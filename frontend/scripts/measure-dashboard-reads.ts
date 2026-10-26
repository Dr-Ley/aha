/**
 * Local aha_dev measurements for the dashboard read path.
 * These are MongoDB driver timings, not authenticated HTTP latency.
 */
import { MongoClient, type Document } from "mongodb";

const URI = "mongodb://127.0.0.1:27017/aha_dev";
const COMPANIES = ["aha", "ewc", "bth"] as const;
const RUNS = 20;

function percentile(samples: number[], p: number): number {
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}

function bytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value));
}

async function timed(run: () => Promise<unknown>): Promise<number[]> {
  await run();
  const samples: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const started = performance.now();
    await run();
    samples.push(performance.now() - started);
  }
  return samples;
}

async function explain(collection: ReturnType<MongoClient["db"]>["collection"] extends never ? never : import("mongodb").Collection, filter: Document, sort?: Document, limit?: number) {
  let cursor = collection.find(filter);
  if (sort) cursor = cursor.sort(sort);
  if (limit != null) cursor = cursor.limit(limit);
  const explained = await cursor.explain("executionStats");
  const stats = explained.executionStats ?? {};
  let indexName: string | null = null;
  const walk = (node: { stage?: string; indexName?: string; inputStage?: unknown } | null) => {
    if (!node) return;
    if (node.indexName) indexName = node.indexName;
    if (node.stage === "COLLSCAN") indexName = indexName ?? "COLLSCAN";
    if (node.inputStage) walk(node.inputStage as typeof node);
  };
  walk(stats.executionStages);
  return {
    nReturned: Number(stats.nReturned ?? 0),
    totalDocsExamined: Number(stats.totalDocsExamined ?? 0),
    totalKeysExamined: Number(stats.totalKeysExamined ?? 0),
    executionTimeMillis: Number(stats.executionTimeMillis ?? 0),
    indexName,
  };
}

async function main() {
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 4000 });
  await client.connect();
  const db = client.db("aha_dev");
  try {
    if (db.databaseName !== "aha_dev") throw new Error(`Refused ${db.databaseName}`);
    const statuses = await db.collection("payments").distinct("status");
    const nullRecorded = await db.collection("payments").countDocuments({ $or: [{ recorded_at: null }, { recorded_at: { $exists: false } }] });
    console.log("payment statuses", statuses);
    console.log("payments with null recorded_at", nullRecorded);

    for (const company of COMPANIES) {
      const payments = db.collection("payments");
      const revenue = db.collection("revenue_entries");
      const filter = { company_id: company };
      const paymentSort = { recorded_at: -1, _id: -1 };
      const revenueSort = { recognized_at: -1, _id: -1 };
      const [paymentExplain, paymentPageExplain, revenueExplain, revenuePageExplain] = await Promise.all([
        explain(payments, filter, paymentSort),
        explain(payments, filter, paymentSort, 10),
        explain(revenue, filter, revenueSort),
        explain(revenue, filter, revenueSort, 10),
      ]);
      const fullPayments = await payments.find(filter).sort(paymentSort).toArray();
      const pagePayments = fullPayments.slice(0, 10);
      const fullRevenue = await revenue.find(filter).sort(revenueSort).toArray();
      const series = fullRevenue.map((row) => ({
        amount: row.amount,
        packageLabel: row.package_label,
        periodMonth: row.period_month,
        recognizedAt: row.recognized_at,
      }));
      const paymentSamples = await timed(() => payments.find(filter).sort(paymentSort).limit(10).toArray());
      const revenueSamples = await timed(() => revenue.find(filter).sort(revenueSort).limit(10).toArray());
      console.log(
        company,
        JSON.stringify({
          payments: paymentExplain,
          paymentsPage: paymentPageExplain,
          revenue: revenueExplain,
          revenuePage: revenuePageExplain,
          paymentBytes: { full: bytes(fullPayments), page: bytes(pagePayments) },
          revenueBytes: { full: bytes(fullRevenue), seriesPlusPage: bytes({ series, revenue: fullRevenue.slice(0, 10) }) },
          paymentPageMs: { median: percentile(paymentSamples, 50), p95: percentile(paymentSamples, 95) },
          revenuePageMs: { median: percentile(revenueSamples, 50), p95: percentile(revenueSamples, 95) },
        })
      );
    }
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
