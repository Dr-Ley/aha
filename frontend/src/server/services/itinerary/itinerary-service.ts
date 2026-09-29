import { randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { CurrencyCode } from "@/lib/data";
import { exchangeRateToKes, wholeInCurrencyToKes } from "@/lib/data";
import { db } from "@/lib/db";
import { getCompanyMarkupPercent } from "@/lib/booking-components";
import {
  itineraries,
  itineraryComponents,
  itineraryGenerationLogs,
  itineraryVersions,
} from "@/lib/schema";
import {
  AIProviderNotConfiguredError,
  createAIItineraryProvider,
  type AIProvider,
} from "@/server/services/ai";
import { ensureSprint7Schema } from "@/server/database/ensure-sprint7";
import { itineraryAccess, type ItineraryActor } from "@/server/services/itinerary/access";
import { parseAiItineraryOutput } from "@/server/services/itinerary/plan-schema";
import { quoteItineraryPlan } from "@/server/services/itinerary/pricing";
import { ITINERARY_SYSTEM_INSTRUCTION } from "@/server/services/itinerary/prompt";
import {
  normalizeItineraryRequirements,
  requirementsForPrompt,
  type ItineraryRequirementsInput,
} from "@/server/services/itinerary/requirements";
import { catalogForPrompt, retrieveTourismCatalog } from "@/server/services/itinerary/retrieval";
import type {
  ItineraryPlan,
  ItineraryQuoteSnapshot,
  ItineraryRequirements,
  ItineraryStatus,
  TourismCatalog,
} from "@/server/services/itinerary/types";
import { validateItineraryPlan } from "@/server/services/itinerary/validation";

export type ItineraryRow = typeof itineraries.$inferSelect;

function newPublicToken(): string {
  return randomBytes(24).toString("base64url");
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function asPlan(raw: unknown): ItineraryPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (Array.isArray(value.days) && typeof value.title === "string") {
    const first = value.days[0] as Record<string, unknown> | undefined;
    if (first && "destinationId" in first) return value as unknown as ItineraryPlan;
  }
  const parsed = parseAiItineraryOutput(raw);
  return parsed.ok ? parsed.plan : null;
}

function snapshotOf(row: ItineraryRow, components: Array<{ type: string; cost: number; sequence: number; config: Record<string, unknown> }>) {
  return {
    status: row.status,
    title: row.title,
    summary: row.summary,
    plan: row.plan,
    quote: row.quote,
    sellingPrice: row.sellingPrice,
    currency: row.currency,
    components,
  };
}

async function listComponents(itineraryId: number) {
  return db
    .select()
    .from(itineraryComponents)
    .where(eq(itineraryComponents.itineraryId, itineraryId));
}

async function replaceComponents(itineraryId: number, quote: ItineraryQuoteSnapshot) {
  await db.delete(itineraryComponents).where(eq(itineraryComponents.itineraryId, itineraryId));
  if (quote.components.length === 0) return [];
  return db
    .insert(itineraryComponents)
    .values(
      quote.components.map((row) => ({
        itineraryId,
        type: row.type,
        cost: row.cost,
        sequence: row.sequence,
        config: { ...row.config, label: row.label },
      }))
    )
    .returning();
}

async function commitVersion(input: {
  row: ItineraryRow;
  changeSummary: string;
  changedByUserId?: number | null;
  previousSellingPrice?: number | null;
}) {
  const components = await listComponents(input.row.id);
  const [latest] = await db
    .select({ version: itineraryVersions.version })
    .from(itineraryVersions)
    .where(eq(itineraryVersions.itineraryId, input.row.id))
    .orderBy(desc(itineraryVersions.version))
    .limit(1);
  const nextVersion = (latest?.version ?? 0) + 1;
  await db
    .update(itineraryVersions)
    .set({ isCurrent: false })
    .where(and(eq(itineraryVersions.itineraryId, input.row.id), eq(itineraryVersions.isCurrent, true)));
  await db.insert(itineraryVersions).values({
    itineraryId: input.row.id,
    version: nextVersion,
    isCurrent: true,
    snapshot: snapshotOf(input.row, components),
    sellingPrice: input.row.sellingPrice,
    previousSellingPrice: input.previousSellingPrice ?? null,
    currency: input.row.currency,
    changedByUserId: input.changedByUserId ?? null,
    changeSummary: input.changeSummary,
  });
  await db
    .update(itineraries)
    .set({ currentVersion: nextVersion, updatedAt: new Date() })
    .where(eq(itineraries.id, input.row.id));
  return nextVersion;
}

async function writeGenerationLog(input: {
  itineraryId: number;
  companyId: string;
  requestId: string;
  provider: string;
  model?: string | null;
  status: string;
  validationStatus?: string | null;
  failureReason?: string | null;
  durationMs?: number | null;
  retryCount: number;
  estimatedCostUsd?: number | null;
}) {
  await db.insert(itineraryGenerationLogs).values({
    itineraryId: input.itineraryId,
    companyId: input.companyId,
    requestId: input.requestId,
    provider: input.provider,
    model: input.model ?? null,
    status: input.status,
    validationStatus: input.validationStatus ?? null,
    failureReason: input.failureReason?.slice(0, 2000) ?? null,
    durationMs: input.durationMs ?? null,
    retryCount: input.retryCount,
    estimatedCostUsd: input.estimatedCostUsd ?? null,
  });
}

export async function createItinerary(input: {
  body: ItineraryRequirementsInput;
  userId?: number | null;
}): Promise<ItineraryRow> {
  await ensureSprint7Schema();
  const requirements = normalizeItineraryRequirements(input.body);
  const [row] = await db
    .insert(itineraries)
    .values({
      publicToken: newPublicToken(),
      companyId: requirements.companyId,
      userId: input.userId ?? null,
      status: "draft",
      country: requirements.country,
      startDate: requirements.startDate,
      endDate: requirements.endDate,
      durationDays: requirements.durationDays,
      adults: requirements.adults,
      children: requirements.children,
      infants: requirements.infants,
      childAges: requirements.childAges,
      requirements: requirements as unknown as Record<string, unknown>,
      currency: requirements.currency,
      guestEmail: requirements.guestEmail,
      guestName: requirements.guestName,
      guestPhone: requirements.guestPhone,
    })
    .returning();
  await commitVersion({ row, changeSummary: "Itinerary request created" });
  return row;
}

export async function getItineraryById(id: number, companyId?: string): Promise<ItineraryRow | null> {
  await ensureSprint7Schema();
  const [row] = await db
    .select()
    .from(itineraries)
    .where(companyId ? and(eq(itineraries.id, id), eq(itineraries.companyId, companyId)) : eq(itineraries.id, id))
    .limit(1);
  return row ?? null;
}

export async function getItineraryByToken(token: string): Promise<ItineraryRow | null> {
  await ensureSprint7Schema();
  const [row] = await db.select().from(itineraries).where(eq(itineraries.publicToken, token)).limit(1);
  return row ?? null;
}

export async function listItinerariesForCompany(companyId: string, limit = 50): Promise<ItineraryRow[]> {
  await ensureSprint7Schema();
  return db
    .select()
    .from(itineraries)
    .where(eq(itineraries.companyId, companyId))
    .orderBy(desc(itineraries.createdAt))
    .limit(Math.min(100, Math.max(1, limit)));
}

export async function assertCanAccess(
  actor: ItineraryActor,
  row: ItineraryRow,
  action: "view" | "edit" | "accept" | "approve" | "convert"
) {
  const access = itineraryAccess(actor, {
    id: row.id,
    publicToken: row.publicToken,
    companyId: row.companyId,
    userId: row.userId,
    guestEmail: row.guestEmail,
    status: row.status,
  });
  if (!access[action]) {
    const error = new Error(access.reason ?? "forbidden");
    (error as Error & { status: number }).status = access.reason === "tenant_mismatch" || access.reason === "not_owner" || access.reason === "token_mismatch" ? 404 : 403;
    throw error;
  }
  return access;
}

function requirementsFromRow(row: ItineraryRow): ItineraryRequirements {
  const stored = (row.requirements ?? {}) as Partial<ItineraryRequirements>;
  return {
    companyId: row.companyId,
    country: row.country,
    destinationIds: stored.destinationIds ?? [],
    attractionIds: stored.attractionIds ?? [],
    activityIds: stored.activityIds ?? [],
    startDate: row.startDate,
    endDate: row.endDate,
    durationDays: row.durationDays ?? 5,
    adults: row.adults,
    children: row.children,
    infants: row.infants,
    childAges: row.childAges ?? [],
    accommodationCategory: stored.accommodationCategory ?? null,
    accommodationPreferences: stored.accommodationPreferences ?? null,
    budgetAmount: stored.budgetAmount ?? null,
    budgetCurrency: stored.budgetCurrency ?? null,
    interests: stored.interests ?? [],
    wildlifeInterests: stored.wildlifeInterests ?? null,
    preferredTransport: stored.preferredTransport ?? null,
    airportTransfer: stored.airportTransfer !== false,
    notes: stored.notes ?? null,
    guestEmail: row.guestEmail,
    guestName: row.guestName,
    guestPhone: row.guestPhone,
    currency: (row.currency as CurrencyCode) || "USD",
  };
}

async function persistPricedPlan(input: {
  row: ItineraryRow;
  plan: ItineraryPlan;
  catalog: TourismCatalog;
  requirements: ItineraryRequirements;
  status: ItineraryStatus;
  changeSummary: string;
  changedByUserId?: number | null;
}): Promise<ItineraryRow> {
  const markupPercent = await getCompanyMarkupPercent(input.row.companyId);
  const currency = (input.row.currency as CurrencyCode) || input.requirements.currency || "USD";
  const quote = quoteItineraryPlan({
    plan: input.plan,
    catalog: input.catalog,
    requirements: input.requirements,
    markupPercent,
    currency,
  });
  const previousSellingPrice = input.row.sellingPrice;
  const [updated] = await db
    .update(itineraries)
    .set({
      status: input.status,
      title: input.plan.title.slice(0, 255),
      summary: input.plan.summary,
      plan: input.plan as unknown as Record<string, unknown>,
      quote: quote as unknown as Record<string, unknown>,
      costTotal: quote.costTotal,
      markupPercent: quote.markupPercent,
      sellingPrice: quote.sellingPrice,
      currency: quote.currency,
      updatedAt: new Date(),
    })
    .where(eq(itineraries.id, input.row.id))
    .returning();
  await replaceComponents(updated.id, quote);
  await commitVersion({
    row: updated,
    changeSummary: input.changeSummary,
    changedByUserId: input.changedByUserId,
    previousSellingPrice,
  });
  return updated;
}

export async function generateItinerary(input: {
  itineraryId: number;
  provider?: AIProvider;
}): Promise<{ row: ItineraryRow; catalog: TourismCatalog; retryCount: number }> {
  await ensureSprint7Schema();
  const existing = await getItineraryById(input.itineraryId);
  if (!existing) {
    const error = new Error("not_found");
    (error as Error & { status: number }).status = 404;
    throw error;
  }
  if (existing.status === "converted" || existing.status === "cancelled") {
    const error = new Error("Itinerary cannot be regenerated");
    (error as Error & { status: number }).status = 409;
    throw error;
  }

  const requirements = requirementsFromRow(existing);
  const catalog = await retrieveTourismCatalog(existing.companyId, requirements);
  if (catalog.destinations.length === 0) {
    const error = new Error("No tourism destinations are available for this request");
    (error as Error & { status: number }).status = 422;
    throw error;
  }

  const provider = input.provider ?? createAIItineraryProvider();
  const requestId = randomUUID();
  const started = Date.now();
  let retryCount = 0;
  let lastFailure = "Generation failed";
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    retryCount = attempt;
    try {
      const result = await provider.generateStructured({
        systemInstruction: ITINERARY_SYSTEM_INSTRUCTION,
        userPayload: {
          requirements: requirementsForPrompt(requirements),
          catalog: catalogForPrompt(catalog),
        },
      });
      const parsed = parseAiItineraryOutput(result.parsed);
      if (!parsed.ok) {
        lastFailure = `invalid_schema: ${parsed.issues.join("; ")}`;
        await writeGenerationLog({
          itineraryId: existing.id,
          companyId: existing.companyId,
          requestId,
          provider: result.provider,
          model: result.model,
          status: "invalid_schema",
          validationStatus: "rejected",
          failureReason: lastFailure,
          durationMs: Date.now() - started,
          retryCount,
          estimatedCostUsd: result.estimatedCostUsd,
        });
        continue;
      }
      const validated = validateItineraryPlan(parsed.plan, catalog, requirements);
      if (!validated.ok) {
        lastFailure = `invalid_business: ${validated.issues.map((i) => i.message).join("; ")}`;
        await writeGenerationLog({
          itineraryId: existing.id,
          companyId: existing.companyId,
          requestId,
          provider: result.provider,
          model: result.model,
          status: "invalid_business",
          validationStatus: "rejected",
          failureReason: lastFailure,
          durationMs: Date.now() - started,
          retryCount,
          estimatedCostUsd: result.estimatedCostUsd,
        });
        continue;
      }
      const row = await persistPricedPlan({
        row: existing,
        plan: validated.plan,
        catalog,
        requirements,
        status: existing.status === "draft" ? "generated" : "modified",
        changeSummary: attempt === 0 ? "AI-generated itinerary" : `AI-generated itinerary (retry ${attempt})`,
      });
      await writeGenerationLog({
        itineraryId: existing.id,
        companyId: existing.companyId,
        requestId,
        provider: result.provider,
        model: result.model,
        status: "succeeded",
        validationStatus: "accepted",
        durationMs: Date.now() - started,
        retryCount,
        estimatedCostUsd: result.estimatedCostUsd,
      });
      return { row, catalog, retryCount };
    } catch (e) {
      lastFailure = e instanceof Error ? e.message : String(e);
      await writeGenerationLog({
        itineraryId: existing.id,
        companyId: existing.companyId,
        requestId,
        provider: provider.name,
        status: "failed",
        validationStatus: "error",
        failureReason: lastFailure,
        durationMs: Date.now() - started,
        retryCount,
      });
      if (e instanceof AIProviderNotConfiguredError) {
        const error = new Error(
          `${provider.name} is not configured. Add the API key in .env.local and restart the server.`
        );
        (error as Error & { status: number }).status = 503;
        throw error;
      }
    }
  }

  const error = new Error(lastFailure);
  (error as Error & { status: number }).status = 422;
  throw error;
}

export async function modifyItineraryDay(input: {
  row: ItineraryRow;
  day: number;
  destinationId?: number;
  accommodationId?: number | null;
  activityIds?: number[];
  transportId?: number | null;
  transferId?: number | null;
  changedByUserId?: number | null;
}): Promise<ItineraryRow> {
  const plan = asPlan(input.row.plan);
  if (!plan) {
    const error = new Error("Itinerary has no generated plan to edit");
    (error as Error & { status: number }).status = 409;
    throw error;
  }
  const day = plan.days.find((d) => d.day === input.day);
  if (!day) {
    const error = new Error("Day not found");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  if (input.destinationId != null) day.destinationId = input.destinationId;
  if (input.accommodationId !== undefined) day.accommodationId = input.accommodationId;
  if (input.activityIds) day.activityIds = input.activityIds;
  if (input.transportId !== undefined) day.transportId = input.transportId;
  if (input.transferId !== undefined) day.transferId = input.transferId;
  plan.destinationIds = [...new Set(plan.days.map((d) => d.destinationId))];

  const requirements = requirementsFromRow(input.row);
  const catalog = await retrieveTourismCatalog(input.row.companyId, requirements);
  const validated = validateItineraryPlan(plan, catalog, requirements);
  if (!validated.ok) {
    const error = new Error(validated.issues.map((i) => i.message).join("; "));
    (error as Error & { status: number }).status = 422;
    throw error;
  }
  const nextStatus: ItineraryStatus =
    input.row.status === "accepted" || input.row.status === "approved" ? (input.row.status as ItineraryStatus) : "modified";
  return persistPricedPlan({
    row: input.row,
    plan: validated.plan,
    catalog,
    requirements,
    status: nextStatus,
    changeSummary: `Updated day ${input.day}`,
    changedByUserId: input.changedByUserId,
  });
}

export async function setItineraryStatus(input: {
  row: ItineraryRow;
  status: ItineraryStatus;
  changeSummary: string;
  changedByUserId?: number | null;
}): Promise<ItineraryRow> {
  const [updated] = await db
    .update(itineraries)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(itineraries.id, input.row.id))
    .returning();
  await commitVersion({
    row: updated,
    changeSummary: input.changeSummary,
    changedByUserId: input.changedByUserId,
    previousSellingPrice: input.row.sellingPrice,
  });
  return updated;
}

export async function listVersions(itineraryId: number) {
  await ensureSprint7Schema();
  return db
    .select()
    .from(itineraryVersions)
    .where(eq(itineraryVersions.itineraryId, itineraryId))
    .orderBy(desc(itineraryVersions.version));
}

export function itineraryViewUrl(publicToken: string): string {
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    "https://africanhomeadventure.com"
  ).replace(/\/$/, "");
  return `${origin}/itineraries/${publicToken}`;
}

export function destinationLabel(row: ItineraryRow): string {
  const plan = asPlan(row.plan);
  if (plan?.title) return plan.title;
  return row.title || "Safari itinerary";
}

export function accountingFromItinerary(row: ItineraryRow): {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  totalPriceKes: number;
  rateToKes: number;
} {
  const originalCurrency = (row.currency as CurrencyCode) || "USD";
  const originalAmount = Math.max(0, Math.round(Number(row.sellingPrice) || 0));
  return {
    originalAmount,
    originalCurrency,
    totalPriceKes: wholeInCurrencyToKes(originalAmount, originalCurrency),
    rateToKes: exchangeRateToKes(originalCurrency),
  };
}

export { asPlan, requirementsFromRow, todayYmd };
