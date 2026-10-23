import { Int32, MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017/aha_dev";
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5_000 });

function n(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

await client.connect();
const db = client.db("aha_dev");
if (db.databaseName !== "aha_dev") throw new Error(db.databaseName);

const payments = await db.collection("payments").find({}).toArray();
const revenue = await db.collection("revenue_entries").find({}).toArray();

const statusCounts = new Map<string, number>();
for (const payment of payments) {
  const status = String(payment.status);
  statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
}

const revenueTypes = new Map<string, number>();
const revenueById = new Map<number, Record<string, unknown>>();
const revenueByPaymentRef = new Map<number, Record<string, unknown>>();
for (const entry of revenue) {
  const type = entry.reference_type == null ? "(null)" : String(entry.reference_type);
  revenueTypes.set(type, (revenueTypes.get(type) ?? 0) + 1);
  const id = n(entry._id);
  if (id != null) revenueById.set(id, entry);
  if (entry.reference_type === "payment") {
    const ref = n(entry.reference_id);
    if (ref != null) revenueByPaymentRef.set(ref, entry);
  }
}

const completed = payments.filter((payment) => payment.status === "completed");
let idOverlap = 0;
let idOverlapSame = 0;
let idOverlapDifferent = 0;
let alreadyLinked = 0;
let missingLink = 0;
let wouldInsertNewId = 0;
let missingRequired = 0;
const collisionSamples: string[] = [];
const missingSamples: string[] = [];

for (const payment of completed) {
  const id = n(payment._id);
  const amount = n(payment.amount);
  const recorded = payment.recorded_at instanceof Date;
  if (id == null || amount == null || typeof payment.company_id !== "string" || !recorded) {
    missingRequired++;
    continue;
  }
  const existing = revenueById.get(id);
  if (existing) {
    idOverlap++;
    const same =
      existing.company_id === payment.company_id &&
      existing.amount === payment.amount &&
      existing.booking_id === (payment.booking_id ?? null) &&
      existing.reference_type === (payment.reference_type ?? "payment") &&
      existing.reference_id === (payment.reference_id ?? payment._id);
    if (same) idOverlapSame++;
    else {
      idOverlapDifferent++;
      if (collisionSamples.length < 8) {
        collisionSamples.push(
          `payment ${id} ${payment.company_id} amount ${payment.amount} ref ${String(payment.reference_type)}/${String(payment.reference_id)} vs revenue company ${String(existing.company_id)} amount ${String(existing.amount)} ref ${String(existing.reference_type)}/${String(existing.reference_id)} label ${String(existing.package_label)}`
        );
      }
    }
  }
  const linked = revenueByPaymentRef.get(id);
  if (linked) alreadyLinked++;
  else {
    missingLink++;
    if (!existing) wouldInsertNewId++;
    if (missingSamples.length < 8) {
      missingSamples.push(
        `payment ${id} ${payment.company_id} amount ${payment.amount} ref ${String(payment.reference_type)}/${String(payment.reference_id)} booking ${String(payment.booking_id)}`
      );
    }
  }
}

const paymentIds = new Set(payments.map((payment) => n(payment._id)).filter((id): id is number => id != null));
let revenueIdInAnyPayment = 0;
for (const id of revenueById.keys()) if (paymentIds.has(id)) revenueIdInAnyPayment++;

const maxPayment = Math.max(...[...paymentIds, 0]);
const maxRevenue = Math.max(...[...revenueById.keys(), 0]);

function totals(rows: Record<string, unknown>[], companyOf: (row: Record<string, unknown>) => string) {
  const byCompany = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const company = companyOf(row);
    const current = byCompany.get(company) ?? { count: 0, amount: 0 };
    current.count++;
    current.amount += n(row.amount) ?? 0;
    byCompany.set(company, current);
  }
  return Object.fromEntries([...byCompany.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

console.log(JSON.stringify({
  payments: payments.length,
  paymentStatuses: Object.fromEntries(statusCounts),
  revenue: revenue.length,
  revenueTypes: Object.fromEntries(revenueTypes),
  completed: completed.length,
  missingRequired,
  idOverlap,
  idOverlapSame,
  idOverlapDifferent,
  revenueIdsThatMatchAnyPaymentId: revenueIdInAnyPayment,
  completedAlreadyLinkedByReference: alreadyLinked,
  completedMissingPaymentReference: missingLink,
  completedThatScriptWouldInsert: wouldInsertNewId,
  maxPaymentId: maxPayment,
  maxRevenueId: maxRevenue,
  completedTotals: totals(completed, (row) => String(row.company_id)),
  revenueTotals: totals(revenue, (row) => String(row.company_id)),
  collisionSamples,
  missingSamples,
}, null, 2));

await client.close();
