# Dashboard column spec (per company)

Purpose: reduce noise (timestamps, audit fields, JSON blobs) in dashboard tables so decisions are faster.
Column names below are the real Postgres names (snake_case) from `lib/schema.ts`.

## Rules for the agent

1. **Read-only change.** Do NOT drop, rename or alter columns or data in base tables. Implement as SQL views (or narrowed SELECT lists in the data layer) named `dash_<company>_<module>`, e.g. `dash_ewc_hotel_stays`.
2. **Scope by `company_id`.** Company ids: `aha` (confirmed as schema default), `ewc`, `bth` (inferred from schema comments). Verify first: `SELECT id, name FROM companies;`
3. **Keep `id`** in every view for row links and detail drawers, but do not display it.
4. **Never expose:** `password_hash`, `public_token`, `company_id` (display), `created_at` / `updated_at` (unless listed below), and JSON blobs (`plan`, `quote`, `cost_stack`, `metadata`, `config`, `snapshot`, `requirements`).
5. **Names:** combine `first_name` + `last_name` into `name`.
6. **Varchar dates:** `bookings.start_date / end_date / travel_date` and `itineraries.start_date / end_date` are varchar. Cast safely:
   `CASE WHEN start_date ~ '^\d{4}-\d{2}-\d{2}' THEN LEFT(start_date,10)::date END`
7. **Balances:** `payments.status` is a free varchar (default `'pending'`). Confirm which values count as settled before computing balances.
8. **Currency:** `bookings.total_price` is KES. Other tables carry a `currency` column; show it only where a company mixes currencies.
9. **Hotel payments:** confirm whether hotel stay payments are written to `payments` (`reference_type = 'hotel'`), to `hotel_booking_payments`, or both. Avoid double counting.

## Step 0: verify which modules each company really uses

```sql
SELECT 'bookings' t, company_id, count(*) FROM bookings GROUP BY 2
UNION ALL SELECT 'hotel_bookings', company_id, count(*) FROM hotel_bookings GROUP BY 2
UNION ALL SELECT 'restaurant_orders', company_id, count(*) FROM restaurant_orders GROUP BY 2
UNION ALL SELECT 'bar_orders', company_id, count(*) FROM bar_orders GROUP BY 2
UNION ALL SELECT 'itineraries', company_id, count(*) FROM itineraries GROUP BY 2
UNION ALL SELECT 'contact_submissions', company_id, count(*) FROM contact_submissions GROUP BY 2
ORDER BY 1, 2;
```

Hide any module that has zero rows for a company.

## Module availability (from schema comments; assumed, verify with Step 0)

| Module | AHA | EWC | BTH |
|---|---|---|---|
| Overview, Customers, Payments, Revenue, Expenses, Alerts, Notifications, Admin | yes | yes | yes |
| Hotel stays | no | yes | yes |
| Restaurant | no | no | yes |
| Bar | no | yes | yes |
| Safari tours (bookings) | yes | yes | no |
| Itineraries | yes | likely | no |
| Enquiries | yes | if used | if used |

---

# AHA (safari operator)

### Overview
- KPIs: revenue this month (`revenue_entries.amount`), expenses this month (`expenses.amount`), outstanding balance (bookings), departures in next 14 days, new enquiries, open itineraries.
- Table "Upcoming departures" (`bookings`): `name`, `safari_package`, `start_date`, `guests`, `status`, `payment_status`, `total_price`.

### Customers (`customers`)
- Columns: `name`, `email`, `phone`, `country`, `nationality`
- Derived: `booking_count`, `lifetime_spend` (sum of `bookings.total_price` where status in confirmed/completed)
- Hide: `notes`, `preferences`, `user_id` (drawer only)

### Safari tours (`bookings` LEFT JOIN `tours`)
- Columns: `name`, `COALESCE(safari_package, tours.title) AS package`, `booking_kind`, `trip_country`, `start_date`, `end_date`, `guests`, `status`, `payment_status`, `total_price`
- Derived: `balance` = `total_price` minus settled `payments.amount`; `has_special_requests` = `special_requests IS NOT NULL`
- Hide: `email`, `phone`, `price_per_person`, `original_*`, `exchange_rate_*`, `pricing_source`, `cost_stack`, `voucher_to_company`, `accommodation`, `transport`, `current_version`

### Itineraries (`itineraries`)
- Columns: `title`, `COALESCE(guest_name, customer name) AS guest`, `country`, `start_date`, `duration_days`, `status`, `selling_price`, `currency`
- Derived: `travellers` = adults + children + infants; `margin` = `selling_price - cost_total`; `converted` = `booking_id IS NOT NULL`
- Hide: `public_token`, `plan`, `quote`, `requirements`, `summary`, `child_ages`, `current_version`, `guest_email`, `guest_phone`

### Enquiries (`contact_submissions`)
- Columns: `name`, `email`, `phone`, `subject`, `status`, `LEFT(message, 80) AS message_preview`, `created_at` (show as "received 2d ago")
- Hide: `user_id`

### Payments (`payments`)
- Columns: `reference` (booking name + package, resolved from `booking_id`), `amount`, `currency`, `status`, `COALESCE(method, provider) AS method`, `recorded_at::date`
- Hide: `idempotency_key`, `notes`, `created_at`, `reference_id`

### Revenue (`revenue_entries`)
- Columns: `period_month`, `package_label`, `amount`, `booking_id`
- Hide: `reference_type` (tours only), `recognized_at`, `created_at`

### Expenses (`expenses`)
- Columns: `incurred_at::date`, `category`, `description`, `amount`, `booking_id` (cost per safari)
- Hide: `reference_type`, `created_at`

### Alerts (derived, no table exists)
- Bookings with `payment_status <> 'paid'` and `start_date` within 14 days
- `invoices` with `balance > 0`
- Enquiries with `status = 'new'` older than 24h
- `itinerary_generation_logs` with a failed status
- `vehicles` with `status = 'maintenance'`
- `email_deliveries` with `status = 'failed'`
- Display: `severity`, `category`, `message`, `related_record`, `amount_or_due_date`

### Notifications (`notifications`)
- Filter `type IN ('booking','payment','expense','enquiry')`
- Columns: `type`, `action`, `title`, `is_read`, `created_at` (relative time)
- Hide: `metadata`; use `reference_id` only for the click-through link

### Admin user settings
- See "Admin (all companies)" at the end. Module list for AHA: overview, tours, bookings, payments, expenses, enquiries.

---

# EWC (lodge with full-board stays, bar, tours)

### Overview
- KPIs: revenue and expenses this month, split by `reference_type` (hotel / bar / tour), arrivals today and next 7 days, in-house guests, outstanding stay balances.
- Table "Arrivals": `primary_guest_name`, `room_code`, `check_in_date`, `nights`, `meal_type`, `payment_status`, `balance`.

### Customers (`customers`)
- Columns: `name`, `email`, `phone`, `country`
- Derived: `stay_count` (from `hotel_bookings`), `lifetime_spend`
- Hide: `notes`, `preferences`, `nationality`, `user_id`

### Hotel stays (`hotel_bookings` JOIN `rooms` JOIN `room_types`)
- Columns: `primary_guest_name`, `rooms.code AS room`, `room_types.name AS room_type`, `check_in_date`, `check_out_date`, `nights`, `reservation_status`, `payment_status`, `total_amount`, `currency`
- EWC-specific columns: `meal_type`, `external_company`, `guest_category` (resident = KES, non-resident = USD)
- Derived: `guests` = adults + children + infants; `balance` = `total_amount - amount_paid`
- Hide: guest phone/email, `additional_occupants`, `pricing_source`, `payment_method`, `notes`, `updated_at`

### Bar (`bar_orders`, `bar_order_items`, `bar_items`)
- Orders: `table_label`, `customer_name`, `status`, `order_total` (sum of `line_total`), `item_count`, `created_at` (as time)
- Menu: `name`, category name, `price`, `is_available`
- Hide: `notes`, `updated_at`, `description`

### Safari tours (`bookings`), if EWC runs tours
- Same columns as AHA safari tours, without `booking_kind`.

### Payments (`payments`)
- Columns: `reference` (resolved), `reference_type AS department`, `amount`, `currency`, `status`, `COALESCE(method, provider) AS method`, `recorded_at::date`
- Hide: `idempotency_key`, `notes`, `created_at`

### Revenue (`revenue_entries`)
- Columns: `period_month`, `reference_type AS department`, `package_label` (tours only), `amount`
- Hide: `booking_id`, `reference_id`, `recognized_at`, `created_at`

### Expenses (`expenses`)
- Columns: `incurred_at::date`, `category`, `description`, `amount`, `reference_type AS department`
- Hide: `booking_id`, `created_at`

### Alerts (derived)
- `hotel_bookings` with balance > 0 and check-in within 3 days
- `reservation_status = 'pending'` for more than 2 days
- Checked-out stays with balance > 0
- Unpaid bar orders (`status <> 'paid'`)
- Unpaid tour bookings starting within 14 days
- `email_deliveries` with `status = 'failed'`

### Notifications
- Filter `type IN ('hotel','bar','booking','payment','expense')`, same columns as AHA.

### Itineraries and Enquiries
- If Step 0 shows rows, use the AHA definitions.

---

# BTH (hotel, restaurant, bar)

### Overview
- KPIs: revenue and expenses this month by department (hotel / restaurant / bar), open (unpaid) orders, in-house guests, check-ins and check-outs today.
- Table "Today": stays checking in or out (`primary_guest_name`, `room_code`, `check_in_date`, `check_out_date`, `balance`).

### Customers (`customers`)
- Columns: `name`, `phone`, `email`, `country`
- Derived: `stay_count`, `lifetime_spend`
- Hide: `notes`, `preferences`, `nationality`, `user_id`

### Hotel stays (`hotel_bookings` JOIN `rooms` JOIN `room_types`)
- Columns: `primary_guest_name`, `rooms.code AS room`, `room_types.name AS room_type`, `check_in_date`, `check_out_date`, `nights`, `reservation_status`, `payment_status`, `total_amount`
- Derived: `guests` = adults + children + infants; `balance` = `total_amount - amount_paid`
- Hide (EWC-specific): `meal_type`, `external_company`, `guest_category`; also `currency` unless Step 0 shows mixed currencies
- Hide: guest phone/email, `additional_occupants`, `pricing_source`, `payment_method`, `notes`, `updated_at`

### Restaurant (`restaurant_orders`, `restaurant_order_items`, `restaurant_items`)
- Orders: `table_label`, `customer_name`, `status` (unpaid / partially_paid / paid), `order_total` (sum of `line_total`), `item_count`, `created_at` (as time)
- Menu: `name`, category name, `price`, `is_available`
- Hide: `notes`, `updated_at`, `description`

### Bar (`bar_orders`, `bar_order_items`, `bar_items`)
- Same columns as restaurant.

### Payments (`payments`)
- Columns: `reference` (resolved), `reference_type AS department`, `amount`, `status`, `COALESCE(method, provider) AS method`, `recorded_at::date`
- Hide: `currency` (unless mixed), `idempotency_key`, `notes`, `created_at`

### Revenue (`revenue_entries`)
- Columns: `period_month`, `reference_type AS department`, `amount`
- Hide: `package_label` (tour-only), `booking_id`, `reference_id`, `recognized_at`, `created_at`

### Expenses (`expenses`)
- Columns: `incurred_at::date`, `category`, `description`, `amount`, `reference_type AS department`
- Hide: `booking_id`, `created_at`

### Alerts (derived)
- Restaurant or bar orders with `status <> 'paid'` older than a few hours
- Hotel stays with balance > 0 at check-out or check-in
- `reservation_status = 'pending'` for more than 2 days
- `email_deliveries` with `status = 'failed'`

### Notifications
- Filter `type IN ('hotel','restaurant','bar','payment','expense')`, same columns as AHA.

---

# Admin (all companies)

Sources: `company_memberships` (filter by `company_id`) JOIN `users`, plus `user_permissions`.

- Columns: `users.name`, `users.email`, `users.role` (global role), `company_memberships.role`, `company_memberships.status`, `users.dashboard_notifications_enabled`
- Permissions matrix: `module` x (`can_view`, `can_edit`), limited to modules the company uses
- Hide: `avatar`, `country`, `phone`, `created_at`, `updated_at`
- **Never select `password_hash`.**
- Note: the `permission_module` enum only has overview, tours, accommodation, restaurant, bar, bookings, payments, expenses, enquiries. It has no entry for customers, revenue, itineraries, alerts or notifications. Decide how those are gated (add enum values in a migration, or reuse an existing module).

# Module availability by permission module

- AHA: overview, tours, bookings, payments, expenses, enquiries
- EWC: overview, accommodation, bar, tours, bookings, payments, expenses
- BTH: overview, accommodation, restaurant, bar, payments, expenses
