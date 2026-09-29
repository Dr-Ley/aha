# Sprint 1.T4 — Protected route audit

Tenant is resolved by `requireTenantContext` (session + membership). Client `companyId` is never authoritative after that helper returns.

| Route | Auth | Tenant filter |
|---|---|---|
| GET/PATCH/DELETE `/api/bookings` | staff: TenantContext `bookings`/`tours`; customer GET: `requireAuthenticatedUser` | `bookings.companyId` |
| POST `/api/bookings` | staff `intent=staff_manual`: TenantContext `bookings` edit; public: rate limit + Zod | public tour must match `body.companyId` |
| `/api/payments` | TenantContext `payments` | `payments.companyId` |
| `/api/expenses` | TenantContext `expenses` | `expenses.companyId` |
| `/api/invoices` | TenantContext `payments` / bookings / accommodation | `invoices.companyId` |
| `/api/revenue` | TenantContext `payments` | company-scoped revenue |
| `/api/customers` | TenantContext `bookings`/`tours`/`accommodation` | `customers.companyId` |
| `/api/hotel-bookings` + identify | TenantContext `accommodation` | `hotel_bookings.companyId` |
| `/api/rooms` `/api/room-types` | TenantContext `accommodation` | companyId |
| `/api/restaurant-*` `/api/bar-*` | TenantContext restaurant/bar | companyId |
| `/api/notifications` | TenantContext overview | companyId |
| `/api/dashboard/overview` | TenantContext overview | companyId |
| `/api/dashboard/entity-preview` | TenantContext by entity module | companyId (enquiries scoped, not hardcoded AHA) |
| `/api/dashboard/permissions` | `requireStaffUser` | memberships for session user |
| `/api/admin/users` `/api/admin/user-permissions` | `requireStaffUser` + admin | platform admin |
| `/api/documents/.../pdf` | TenantContext by document module | companyId |
| GET `/api/tours` `/api/accommodations` `/api/testimonials` | public | required `companyId` (400 if missing) |
| POST `/api/contact` | public Zod + rate limit | writes `contact_submissions.companyId` |
| GET/PATCH `/api/contact` | TenantContext `enquiries` | `companyId` |
| POST `/api/likes` | `requireAuthenticatedUser` + rate limit | like row `companyId` from catalog item |
