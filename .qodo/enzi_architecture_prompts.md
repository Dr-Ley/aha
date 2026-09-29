# Enzi Platform — CTO Architecture Summary & AI Agent Prompts

## 1. EXECUTIVE SUMMARY

**Mission:** Transform the existing African Home Adventure (AHA) Next.js app into **Enzi**, a multi-tenant tourism/hospitality SaaS platform. AHA becomes Tenant #1. The flagship product is an **AI safari itinerary generator** sold to external tour operators via API.

**Stack:** Next.js 14+ (App Router), React, Tailwind CSS, DaisyUI, PostgreSQL (Neon), Drizzle ORM, Resend (email).

**Architecture:** Modular monolith (single deployable, internally bounded). Not microservices yet.

**Core Principle:** Website & dashboard are **clients** of the Enzi API/platform. The database is the sole source of truth. AI recommends; business logic authorizes.

---

## 2. ARCHITECTURE CHEAT SHEET

| ID | Decision | Implication |
|----|----------|-------------|
| ADR-001 | Enzi owns the platform | No AHA-hardcoded logic in core |
| ADR-002 | AHA = first tenant | All AHA data gets `company_id` |
| ADR-004 | Website & SaaS separable | Public site consumes APIs, not direct DB |
| ADR-009 | External sites integrate via API | `/api/v1/` is the public boundary |
| ADR-010 | AI itinerary = Enzi tourism capability | Reusable across tenants |
| ADR-013 | Tenant isolation server-side | Browser never trusted for `companyId` |
| DB-001 | Company = primary tenant | Every business record has `company_id` |
| DB-006 | Invalid tenant = fail closed | No silent AHA fallback |
| DB-016 | Financial ops = transactional | Booking+Invoice+Payment atomic |
| TECH-001 | Modular monolith | One Next.js app, domain folders |
| TECH-007 | Tenant context server-side | Resolved from auth membership |
| TECH-009 | AI does not own business facts | Prices/fees from DB, not LLM |

### Entity Ownership
| Type | Examples |
|------|----------|
| **Platform** | users, companies, subscriptions, feature_flags |
| **Company-owned** | customers, bookings, payments, vehicles, itineraries |
| **Shared ref** | countries, destinations, attractions, parks |
| **Partner** | accommodation_providers, vehicle_providers |

### Target Folder Structure
```
src/
  app/
    (public)/          # AHA website
    dashboard/         # Enzi dashboard
    api/v1/            # Public API
  features/
    auth/, companies/, customers/, bookings/, payments/
    finance/, tourism/, hospitality/, itineraries/, ai/
  server/
    auth/, authorization/, tenancy/, database/, services/
  components/ui/, components/dashboard/
  lib/, types/, config/
drizzle/
```

---

## 3. TOKEN-EFFICIENT PROMPT TEMPLATE

Use this exact format for every agent request:

```
TASK: <Sprint>.<Task#> — <One-line objective>
PRIORITY: <P0/P1/P2>
CONTEXT: <ADR-###, DB-###, TECH-### references>

OBJECTIVE:
<2-3 sentences max>

ACCEPTANCE CRITERIA:
- [ ] <measurable outcome>
- [ ] <measurable outcome>
- [ ] <measurable outcome>

CONSTRAINTS:
- <technical boundary>
- <technical boundary>
- Do not modify unrelated code.

FILES TO INSPECT:
- <file path>
- <file path>

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- <specific test requirement>

DELIVERABLES:
- Files changed
- DB migrations (if any)
- Test results
- Risks / rollback notes
```

---

## 4. IMPLEMENTATION PROMPTS BY SPRINT

### SPRINT 1: Secure Foundation (P0)
**Theme:** Remove security holes. Establish tenant resolution. No new features.

---

```
TASK: S1.T1 — Remove AUTH_SECRET fallback
PRIORITY: P0
CONTEXT: ADR-013, TECH-007, E1.1

OBJECTIVE:
Remove any fallback/default AUTH_SECRET. App must hard-fail on startup if AUTH_SECRET is missing.

ACCEPTANCE CRITERIA:
- [ ] Missing AUTH_SECRET throws on build/start, not runtime fallback
- [ ] .env.example created with all required vars listed
- [ ] No "aha" or default string fallback exists in auth config

CONSTRAINTS:
- Do not change auth logic beyond secret validation
- Preserve existing session behavior when secret is valid

FILES TO INSPECT:
- src/lib/auth.ts or auth config
- .env / .env.local
- middleware.ts

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Verify app fails to start with empty AUTH_SECRET
```

---

```
TASK: S1.T2 — Create standard auth helper
PRIORITY: P0
CONTEXT: ADR-013, TECH-007, E1.2

OBJECTIVE:
Create a single reusable `requireAuthenticatedUser()` helper used by all protected API routes and server actions.

ACCEPTANCE CRITERIA:
- [ ] Helper returns authenticated user or throws 401
- [ ] All existing protected API routes use the helper
- [ ] No inline auth checks remain in route handlers

CONSTRAINTS:
- Use existing auth library (don't swap auth providers)
- Keep changes to route handlers minimal

FILES TO INSPECT:
- src/app/api/* route handlers
- src/lib/auth.ts
- src/server/auth/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Manual test: protected API without cookie returns 401
```

---

```
TASK: S1.T3 — Remove silent AHA tenant fallback
PRIORITY: P0
CONTEXT: DB-006, TECH-008, E1.4, E2.4

OBJECTIVE:
Find `resolveCompanyId()` and all tenant resolution logic. Replace silent fallback to AHA with explicit 400/403 rejection when company is missing, invalid, or user lacks membership.

ACCEPTANCE CRITERIA:
- [ ] No function returns "aha" as a default companyId
- [ ] Missing/invalid companyId returns 400 Bad Request
- [ ] Valid companyId but unauthorized user returns 403 Forbidden
- [ ] All existing usages updated; no regression for valid AHA requests

CONSTRAINTS:
- Do not change database schema yet
- Preserve valid AHA flows that currently work
- Fail closed: when in doubt, reject

FILES TO INSPECT:
- Any file containing "resolveCompanyId"
- src/lib/tenancy.ts or equivalent
- src/app/api/* routes using companyId
- middleware.ts

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Test cases: valid AHA, missing company, invalid company, wrong user
```

---

```
TASK: S1.T4 — Audit & fix cross-tenant access vulnerabilities
PRIORITY: P0
CONTEXT: ADR-013, DB-002, E1.5, E2.3

OBJECTIVE:
Audit every API route and server action that reads/writes business data. Ensure queries filter by authenticated user's company_id. Fix any route that trusts client-supplied companyId.

ACCEPTANCE CRITERIA:
- [ ] Every business query includes `where: { companyId: ctx.companyId }`
- [ ] No route uses `req.body.companyId` or `searchParams.companyId` as authoritative
- [ ] Public endpoints (contact, enquiry) have Zod validation + rate limiting
- [ ] List of audited routes documented in PR

CONSTRAINTS:
- Do not add new tables
- Do not change UI components
- Focus on API routes and server actions only

FILES TO INSPECT:
- src/app/api/* all route.ts files
- src/app/dashboard/* server actions
- Any Drizzle query in API layer

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Cross-tenant test: User A (AHA) attempts to access User B data (simulated)
```

---

### SPRINT 2: Tenant Data Model (P0)
**Theme:** Introduce proper company/membership tables. Migrate users from global roles to tenant-scoped memberships.

---

```
TASK: S2.T1 — Create company_memberships table
PRIORITY: P0
CONTEXT: DB-004, DB-005, E2.2, E3.1

OBJECTIVE:
Create `company_memberships` linking `users` to `companies` with role. Support one user -> multiple companies. Preserve existing AHA user access.

ACCEPTANCE CRITERIA:
- [ ] Drizzle schema: company_memberships(id, userId, companyId, role, status, createdAt)
- [ ] Foreign keys to users.id and companies.id
- [ ] Unique constraint on (userId, companyId)
- [ ] Migration created and tested
- [ ] Seed script creates membership for existing AHA users

CONSTRAINTS:
- Do not drop users table or existing roles yet
- Role is string enum: owner, admin, sales, operations, guide, finance
- Keep existing auth working during migration

FILES TO INSPECT:
- drizzle/schema.ts or schema folder
- drizzle/ migrations
- src/lib/db/seed.ts or seed scripts

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Apply migration to staging db
- Verify existing AHA users can still log in
```

---

```
TASK: S2.T2 — Establish TenantContext in request pipeline
PRIORITY: P0
CONTEXT: TECH-007, E2.1, E2.3

OBJECTIVE:
Create a `TenantContext` type and helper that resolves {companyId, userId, membershipId, role} from the authenticated request. Use it in all protected routes.

ACCEPTANCE CRITERIA:
- [ ] TenantContext type defined in src/server/tenancy/
- [ ] Helper resolves context from auth session + membership lookup
- [ ] All protected API routes receive and use TenantContext
- [ ] Context is passed to service layer, not reconstructed

CONSTRAINTS:
- Must work with existing auth system
- No global singletons; context per request
- Fail closed if membership missing

FILES TO INSPECT:
- src/server/tenancy/
- src/app/api/* protected routes
- src/server/services/* if exists

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Test: valid context, missing membership, wrong company
```

---

```
TASK: S2.T3 — Classify tables: GLOBAL vs TENANT
PRIORITY: P0
CONTEXT: DB-001, DB-007, E3.1

OBJECTIVE:
Inventory all existing tables. Classify each as GLOBAL (platform), TENANT (company-owned), or SHARED (reference). Add `company_id` to all TENANT tables that lack it.

ACCEPTANCE CRITERIA:
- [ ] Document listing every table with classification
- [ ] All TENANT tables have company_id column (nullable initially for migration)
- [ ] Drizzle relations updated
- [ ] Backfill migration sets company_id to AHA for existing rows
- [ ] Indexes on (company_id) and (company_id, status)

CONSTRAINTS:
- Do not drop tables
- Use nullable + backfill, not destructive migration
- Shared ref tables (destinations, parks) stay global for now

FILES TO INSPECT:
- drizzle/schema.ts
- All table definitions
- Existing migrations

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Verify all existing data assigned to AHA company
- Query performance check on new indexes
```

---

### SPRINT 3: Customer Domain (P0)
**Theme:** Extract customer from inline booking fields into a proper CRM entity.

---

```
TASK: S3.T1 — Create customers table
PRIORITY: P0
CONTEXT: DD-001, E4.1, E4.2

OBJECTIVE:
Create `customers` table: id, companyId, firstName, lastName, email, phone, nationality, country, notes, createdAt. Link to company. Unique constraint on (companyId, email).

ACCEPTANCE CRITERIA:
- [ ] Drizzle schema defined
- [ ] Migration created
- [ ] Foreign key: customers.companyId -> companies.id
- [ ] Unique(companyId, email)
- [ ] Index on customers(companyId, createdAt)

CONSTRAINTS:
- Do not modify bookings table yet
- Keep fields minimal; preferences added later
- Email optional if existing data lacks it

FILES TO INSPECT:
- drizzle/schema.ts
- src/features/customers/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Migration applies cleanly
```

---

```
TASK: S3.T2 — Migrate booking customer data to customers table
PRIORITY: P0
CONTEXT: E4.3, E4.4

OBJECTIVE:
For every existing booking, create a customer record (if not exists) and link via customerId. Preserve historical snapshot on booking itself.

ACCEPTANCE CRITERIA:
- [ ] Migration extracts distinct customers from bookings
- [ ] bookings.customerId populated
- [ ] Customer name/email snapshot preserved on booking row
- [ ] No booking loses customer information

CONSTRAINTS:
- Idempotent migration (rerunnable)
- Handle duplicate emails per company carefully
- Do not delete original booking fields yet (deprecate)

FILES TO INSPECT:
- drizzle/ migrations
- src/features/bookings/

TESTING:
- Run migration on copy of production data
- Verify customer count matches expected
- Verify all bookings have customerId
```

---

```
TASK: S3.T3 — Customer CRUD API + dashboard UI
PRIORITY: P0
CONTEXT: E4.1, E4.2

OBJECTIVE:
Create server actions / API for customer CRUD. Add customer list and detail views to dashboard. Tenant-scoped.

ACCEPTANCE CRITERIA:
- [ ] Create, read, update customer via server action
- [ ] Dashboard /customers page lists company customers only
- [ ] Search by name/email
- [ ] Customer detail shows booking history

CONSTRAINTS:
- Use TenantContext for scoping
- Reuse existing UI components (DaisyUI)
- No client-side data fetching for list

FILES TO INSPECT:
- src/app/dashboard/customers/
- src/features/customers/
- src/server/services/customer-service.ts

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- E2E: create customer, verify isolated by tenant
```

---

### SPRINT 4: Booking + Pricing Engine (P0)
**Theme:** Make bookings component-based. Build centralized pricing service.

---

```
TASK: S4.T1 — Component-based booking model
PRIORITY: P0
CONTEXT: DD-004, E5.3, E5.4

OBJECTIVE:
Refactor bookings to support components: accommodation, transport, park, activity, transfer. Each component has its own cost and configuration. Allow modifications without full rebuild.

ACCEPTANCE CRITERIA:
- [ ] booking_components table: id, bookingId, type, config, cost, sequence
- [ ] Types: accommodation, transport, park_fee, activity, transfer, other
- [ ] Existing bookings migrated to single-component rows
- [ ] Booking total = sum of component costs + markup

CONSTRAINTS:
- Preserve existing booking totals
- Do not break existing payment links
- Component config as JSONB for flexibility

FILES TO INSPECT:
- drizzle/schema.ts (bookings, new booking_components)
- src/features/bookings/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Verify existing booking prices unchanged
```

---

```
TASK: S4.T2 — Centralized Pricing Service
PRIORITY: P0
CONTEXT: DD-008, E6.1, E6.2, E6.3, E6.4, TECH-010

OBJECTIVE:
Create `PricingService` that accepts itinerary components and returns selling price. Formula: sum(costs) + markup -> round up to nearest 10 (KES/USD).

ACCEPTANCE CRITERIA:
- [ ] PricingService in src/server/services/pricing.ts
- [ ] Inputs: components[], travellerCounts, currency
- [ ] Markup configurable per company (default 20%)
- [ ] Rounding: ceil(price / 10) * 10
- [ ] Used by dashboard, website, and API (not duplicated)

CONSTRAINTS:
- Pure function; no DB calls in core calculation
- Currency-aware rounding
- No UI logic; service only

FILES TO INSPECT:
- src/server/services/pricing.ts
- Any existing price calculation in components

TESTING:
- Unit tests for rounding edge cases: 1843 -> 1850, 1850 -> 1850, 1849 -> 1850
- Multi-currency tests
```

---

```
TASK: S4.T3 — Booking modification flow
PRIORITY: P0
CONTEXT: E5.4, E5.3

OBJECTIVE:
Allow staff to modify booking components (change accommodation, add activity) with automatic price recalculation and version snapshot.

ACCEPTANCE CRITERIA:
- [ ] Modify component -> new booking version created
- [ ] Previous version preserved (immutable)
- [ ] Price recalculated via PricingService
- [ ] Audit log entry: who, what changed, old/new price

CONSTRAINTS:
- Versions stored in booking_versions table
- Do not modify original booking row; create new version
- Keep latest version as "current"

FILES TO INSPECT:
- src/app/dashboard/bookings/
- src/server/services/booking-service.ts

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Test: modify accommodation -> verify new version + price change
```

---

### SPRINT 5: Payments + Resend (P0/P1)
**Theme:** Reliable financial records. Email abstraction.

---

```
TASK: S5.T1 — Payment abstraction + transaction safety
PRIORITY: P0
CONTEXT: DB-016, E7.1, E7.3, TECH-013

OBJECTIVE:
Create PaymentService with providers: manual, cash, bank, card, m-pesa. Ensure payment recording is transactional: Payment + Invoice update + Booking balance atomic.

ACCEPTANCE CRITERIA:
- [ ] PaymentService interface + implementations
- [ ] Record payment updates invoice.balance and booking.paymentStatus
- [ ] Drizzle transaction wraps all three writes
- [ ] Idempotency key prevents double recording

CONSTRAINTS:
- Use Drizzle transactions (not Neon HTTP for multi-step)
- Do not integrate live M-Pesa yet; architecture only
- Preserve existing payment data

FILES TO INSPECT:
- src/server/services/payments/
- drizzle/schema.ts (payments, invoices, bookings)

TESTING:
- Unit test: partial payment -> balance updated
- Test: duplicate idempotency key rejected
```

---

```
TASK: S5.T2 — Email service abstraction + Resend integration
PRIORITY: P1
CONTEXT: TECH-011, E9.1, E9.2

OBJECTIVE:
Create EmailService with Resend adapter. Trigger emails via business events, not inline in components. Templates: booking_confirmation, payment_received, itinerary_generated.

ACCEPTANCE CRITERIA:
- [ ] EmailService interface in src/server/services/email/
- [ ] Resend adapter implements send()
- [ ] Event-driven: BookingCreated -> send confirmation
- [ ] Templates use company branding (AHA domain initially)
- [ ] Delivery status tracked

CONSTRAINTS:
- No direct Resend calls outside adapter
- Async sending (fire event, don't await SMTP)
- Template variables typed

FILES TO INSPECT:
- src/server/services/email/
- src/server/services/notifications/
- Any existing email sending code

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Test send with Resend test key
```

---

### SPRINT 6: Tourism Engine (P0)
**Theme:** Structured tourism data for AI consumption.

---

```
TASK: S6.T1 — Destinations + Attractions schema
PRIORITY: P0
CONTEXT: E8.1, E8.2

OBJECTIVE:
Create shared reference tables: destinations (country, region, name) and attractions (name, destinationId, type, duration, bestTime, description). Seed with Kenya/Tanzania data.

ACCEPTANCE CRITERIA:
- [ ] destinations table: id, country, region, name, slug
- [ ] attractions table: id, destinationId, name, type, duration, description
- [ ] Unique slug per destination
- [ ] Seed data: Maasai Mara, Amboseli, Serengeti, Ngorongoro, etc.

CONSTRAINTS:
- Global/shared tables (no company_id)
- Keep minimal; expand later
- Slug format: kebab-case

FILES TO INSPECT:
- drizzle/schema.ts
- src/features/tourism/
- seed files

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Seed applies cleanly
```

---

```
TASK: S6.T2 — Accommodation provider model
PRIORITY: P0
CONTEXT: DD-002, DD-009, E8.3, E8.4

OBJECTIVE:
Create accommodation_providers and properties tables. Support partner-owned and company-owned. Link to company when tenant-owned.

ACCEPTANCE CRITERIA:
- [ ] accommodation_providers: id, name, contact, type (partner/tenant)
- [ ] properties: id, providerId, name, location, country, amenities
- [ ] room_types and rooms linked to property
- [ ] Company-owned properties have companyId

CONSTRAINTS:
- Migrate existing accommodations table data into new schema
- Preserve existing accommodation slugs (add companyId to unique)
- Optional detailed fields per DD-002

FILES TO INSPECT:
- drizzle/schema.ts (accommodations, room_types, rooms)
- src/features/tourism/accommodation/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Migration preserves existing accommodation data
```

---

```
TASK: S6.T3 — Vehicle + Guide resources
PRIORITY: P0
CONTEXT: DD-007, E8.5, E8.6

OBJECTIVE:
Create vehicles and guides tables. Vehicle: ownership (owned/outsourced), type, capacity, registration, availability. Guide: employee/contractor, languages, certifications.

ACCEPTANCE CRITERIA:
- [ ] vehicles: id, companyId, ownership, type, capacity, registration, status
- [ ] vehicle_providers: id, name, contact (for outsourced)
- [ ] guides: id, companyId, name, type, languages, status
- [ ] Tenant-scoped (company-owned)

CONSTRAINTS:
- Seed AHA's 3 owned vehicles
- Link outsourced vehicles to provider

FILES TO INSPECT:
- drizzle/schema.ts
- src/features/tourism/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
```

---

### SPRINT 7: AI Itinerary MVP (P0)
**Theme:** Build the generator. AI proposes; platform validates and prices.

---

```
TASK: S7.T1 — AI Service abstraction
PRIORITY: P0
CONTEXT: TECH-009, E10.1, E10.2

OBJECTIVE:
Create AIService interface with pluggable provider. First implementation can use OpenAI/Anthropic or open-source via API. Abstract prompt construction and response parsing.

ACCEPTANCE CRITERIA:
- [ ] AIService interface: generateItinerary(input) -> structured output
- [ ] Provider adapter pattern
- [ ] Prompt builder constructs prompt from tourism data (not raw DB)
- [ ] JSON schema validation on AI output
- [ ] Fallback/retry logic

CONSTRAINTS:
- Do not hardcode provider API calls throughout app
- Output must be validated before use
- No DB writes from AI service directly

FILES TO INSPECT:
- src/server/services/ai/
- src/features/ai/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Mock provider test
```

---

```
TASK: S7.T2 — Itinerary generation pipeline
PRIORITY: P0
CONTEXT: DD-010, E10.3, E10.4, E11

OBJECTIVE:
Build end-to-end pipeline: Customer requirements -> fetch tourism data -> AI generates draft -> validate -> price -> store itinerary version.

ACCEPTANCE CRITERIA:
- [ ] ItineraryRequest schema: destination, dates, travellers, budget, interests
- [ ] Pipeline fetches available accommodations, parks, activities from DB
- [ ] AI receives structured context (not raw DB dump)
- [ ] Output validated against schema
- [ ] PricingService calculates final price
- [ ] Itinerary + version stored in DB

CONSTRAINTS:
- AI does not set prices (per TECH-009)
- Availability check is basic initially (manual flags)
- Store AI raw response for debugging

FILES TO INSPECT:
- src/server/services/itinerary/
- src/features/itineraries/
- drizzle/schema.ts (itineraries, itinerary_versions)

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- End-to-end test with mock AI response
```

---

```
TASK: S7.T3 — Customer itinerary modification
PRIORITY: P0
CONTEXT: DD-005, DD-006, E10.4

OBJECTIVE:
Allow customer to modify itinerary (change accommodation, swap activity). System creates new version and recalculates price.

ACCEPTANCE CRITERIA:
- [ ] UI to edit itinerary components
- [ ] Each edit creates new itinerary_version
- [ ] Previous versions viewable
- [ ] Price recalculated via PricingService
- [ ] Change log stored

CONSTRAINTS:
- Versions immutable
- Only "current" version editable
- Keep UI simple; no drag-and-drop initially

FILES TO INSPECT:
- src/app/(public)/itinerary/ or similar
- src/features/itineraries/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Test: modify -> new version -> price change
```

---

```
TASK: S7.T4 — PDF itinerary generation
PRIORITY: P1
CONTEXT: E10.3, E11

OBJECTIVE:
Generate professional PDF from itinerary version. Include: day-by-day breakdown, accommodation, activities, transport, price, company branding.

ACCEPTANCE CRITERIA:
- [ ] PDF generated from itinerary version
- [ ] Company branding (AHA initially)
- [ ] Downloadable from customer view and dashboard
- [ ] Styled professionally

CONSTRAINTS:
- Use server-side PDF library (e.g., Puppeteer, React-PDF)
- Do not expose PDF generation to unauthenticated users

FILES TO INSPECT:
- src/server/services/pdf/
- src/app/api/itineraries/[id]/pdf/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Generate sample PDF, verify layout
```

---

### SPRINT 8: Itinerary -> Booking Conversion (P0)
**Theme:** Close the commercial loop.

---

```
TASK: S8.T1 — Convert itinerary to booking
PRIORITY: P0
CONTEXT: E11, E5.1

OBJECTIVE:
Staff can convert approved itinerary into a booking with one action. Reuses booking domain. Preserves itinerary as quote snapshot.

ACCEPTANCE CRITERIA:
- [ ] Dashboard "Convert to Booking" button on itinerary
- [ ] Creates booking with components copied from itinerary
- [ ] Customer linked
- [ ] Price locked (snapshot)
- [ ] Invoice auto-generated
- [ ] Confirmation email sent

CONSTRAINTS:
- Reuse existing booking service (don't duplicate)
- Lock price at conversion time
- Itinerary status updated to "converted"

FILES TO INSPECT:
- src/app/dashboard/itineraries/
- src/server/services/booking-service.ts
- src/server/services/invoice-service.ts

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- E2E: itinerary -> booking -> invoice -> email
```

---

### SPRINT 9: SaaS + External API (P1)
**Theme:** Make Enzi sellable to other tour operators.

---

```
TASK: S9.T1 — SaaS subscription model
PRIORITY: P1
CONTEXT: E12.1, E12.2, E12.3

OBJECTIVE:
Create subscriptions table: companyId, plan, status, startDate, endDate. Plans: starter, professional, enterprise. Gate features by plan.

ACCEPTANCE CRITERIA:
- [ ] subscriptions table with plan enum
- [ ] Feature flags checked against subscription plan
- [ ] AHA seeded as "enterprise" or internal
- [ ] Basic trial/active/cancelled status

CONSTRAINTS:
- No payment gateway for subscriptions yet (manual invoice)
- Keep simple; billing automation is P2

FILES TO INSPECT:
- drizzle/schema.ts
- src/features/subscriptions/

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
```

---

```
TASK: S9.T2 — Versioned public API /api/v1/
PRIORITY: P1
CONTEXT: ADR-009, TECH-017, E13.1, E13.2, E13.3

OBJECTIVE:
Create `/api/v1/itineraries/generate` endpoint for external tour operators. API key auth. Tenant resolution via API key.

ACCEPTANCE CRITERIA:
- [ ] API keys table: id, companyId, keyHash, name, status
- [ ] Middleware authenticates API key from Authorization header
- [ ] POST /api/v1/itineraries/generate accepts requirements JSON
- [ ] Returns structured itinerary + price
- [ ] Rate limiting (basic)

CONSTRAINTS:
- API keys managed in dashboard
- Same pricing engine used
- Same AI service used
- Input validation strict (Zod)

FILES TO INSPECT:
- src/app/api/v1/
- src/server/auth/api-key.ts
- src/middleware.ts

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- Test: valid key, invalid key, expired key, rate limit
```

---

### SPRINT 10: First External Customer (P1)
**Theme:** Onboard one paying tour operator. Learn and iterate.

---

```
TASK: S10.T1 — External operator onboarding flow
PRIORITY: P1
CONTEXT: E12.1, E13.4

OBJECTIVE:
Self-service signup for external tour operators: register company, create admin user, get API key, access dashboard.

ACCEPTANCE CRITERIA:
- [ ] Public signup page (separate from AHA website)
- [ ] Creates company + subscription (trial) + admin membership
- [ ] Dashboard shows API key
- [ ] Basic usage stats (itineraries generated)

CONSTRAINTS:
- No complex billing; manual invoice for now
- AHA website unchanged
- Enzi SaaS on subdomain or separate domain

FILES TO INSPECT:
- src/app/(public)/signup/ or app.enzi.com/signup
- src/server/services/company-service.ts

TESTING:
- Run: npm run lint && npm run typecheck && npm run build
- E2E signup flow
```

---

## 5. CROSS-CUTTING RULES FOR ALL PROMPTS

Apply these to every sprint:

| Rule | Enforcement |
|------|-------------|
| **Tenant Isolation** | Every query: `where: { companyId: ctx.companyId }` |
| **Fail Closed** | Missing auth/tenant = 401/403, never fallback |
| **No UI Business Logic** | Calculations in services, not components |
| **No Duplicate Logic** | One pricing service, one auth helper, one email service |
| **DB Transactions** | Financial writes atomic via Drizzle tx |
| **AI Is Not Source of Truth** | AI suggests; DB prices; logic validates |
| **Preserve Working Code** | Don't refactor unrelated files |
| **Test Before Merge** | lint + typecheck + build + manual test |

---

## 6. DEFINITION OF DONE (Universal)

Every task must satisfy:

- [ ] Code implements acceptance criteria exactly
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Database migration created (if schema changed)
- [ ] Tenant isolation verified
- [ ] No AHA fallback introduced
- [ ] No secrets committed
- [ ] Rollback plan documented (if risky migration)
