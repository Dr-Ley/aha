-- Enchoro Wildlife Camp: WhatsApp stays, bar goods, expenses, and payments,
-- Feb–Apr 2026. Source messages are dated 01/02/2026 through 24/04/2026.
--
-- Stays are the services. Weekly bar sales are the goods. Paid and partially
-- paid services and goods are inserted into payments with status completed.
-- Each completed payment also gets the revenue_entries row the dashboard
-- writes when finance marks a payment completed.
--
-- Stay payments use the stay total (the service is paid). Where part of a
-- receipt was spent before the M-PESA deposit, that spend remains an expense.
-- Partial bar payments use the deposited amount, not the sales total.
-- A payment that already exists for the same stay or bar order is not
-- duplicated; its status is set to completed.
--
-- Compared with the supplied hotel_bookings rows (ids 1–72). Those rows are
-- January 2026 and May–June 2026 only. None of the stays below match an
-- existing check-in date, so all 38 are new. Each insert still skips a row
-- when the same company, check-in, nights, total, and operator already exist,
-- or when the [EWC26-WA ...] note token is already stored.
--
-- Stays are marked paid (amount_paid = total_amount, payment_status = paid,
-- reservation_status = checked_out).
--
-- Room is not named in these messages. Every stay uses the first active EWC
-- room. Reassign rooms in the dashboard after import.
-- Meal plan is half_board at the KES 2,000 per person per night rate used by
-- the earlier Karibu / Ochieng rows. Stella's "overnight" stays are bed_only.
-- Booking.com was bed and breakfast; the enum has no B&B value, so that stay
-- is half_board and the note says bed and breakfast.
--
-- Bar goods (bar_orders.table_label is the week the dashboard parses):
--   31/01–06/02 sales KES 3,900, paid, M-PESA ref 116990662.
--   07/02–13/02 sales KES 17,300, partially paid KES 6,780, ref 117123507.
--     Listed lines sum to 17,100; the message total is 17,300.
--     Diesel and two Tusker crates are expenses, not another payment.
--   14/02–20/02 sales KES 7,100, unpaid. The order is stored. No payment.
--   21/03–27/03 sales KES 7,700, paid, ref 117872420.
--   11/04–17/04 sales KES 4,000, paid, receipt UDHCA17T09.
--   18/04–24/04 sales KES 6,600, partially paid KES 2,000. The weekly note
--     states the amount available for deposit after the beer crate. This chat
--     has no separate transfer receipt. The crate is an expense.
--   10/04/2026 sales none. No order.
--
-- Not inserted:
--   Unmatched M-PESA, no stay or purchase text: KES 5,200 ref 117502834
--     (06/03/2026) and KES 5,300 ref 117631965 (13/03/2026).
--   5 litres Cellar Cask red sweet wine received 02/03/2026 (no price).
--   KTB video note, and Dad's questions about the Booking.com slip.
--
-- The 15/04/2026 Karibu message (9 pax, KES 34,000) is two stays:
--   8 pax × 2 nights = 32,000 and 1 pax × 1 night = 2,000.
--   Both are skipped if a single KES 34,000 Karibu row already exists that day.
-- The 12/03 Booking.com note (139 USD, one night) and the 13/03 extension
--   (278 USD @ 128 = 35,584) are one stay, check-in 12/03, two nights.

-- `payment` is required on financial_reference_type for revenue_entries.
-- Runs outside the data transaction so the new label can be used below.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'financial_reference_type'
      AND e.enumlabel = 'payment'
  ) THEN
    ALTER TYPE financial_reference_type ADD VALUE 'payment';
  END IF;
END $$;

BEGIN;

INSERT INTO "hotel_bookings" (
  "company_id",
  "room_id",
  "check_in_date",
  "check_out_date",
  "nights",
  "total_amount",
  "amount_paid",
  "payment_method",
  "payment_status",
  "external_company",
  "meal_type",
  "reservation_status",
  "notes",
  "created_at",
  "updated_at",
  "customer_id",
  "primary_guest_name",
  "primary_guest_phone",
  "primary_guest_email",
  "additional_occupants",
  "adults",
  "children",
  "infants",
  "pricing_source",
  "guest_category",
  "currency"
)
SELECT
  'ewc',
  (
    SELECT r.id
    FROM "rooms" r
    WHERE r.company_id = 'ewc'
      AND r.is_active = true
    ORDER BY r.id
    LIMIT 1
  ),
  v.check_in_date::date,
  v.check_out_date::date,
  v.nights::integer,
  v.total_amount::integer,
  v.total_amount::integer,
  NULL,
  'paid'::payment_status,
  v.external_company,
  v.meal_type::hotel_meal_type,
  'checked_out'::hotel_reservation_status,
  v.notes,
  v.created_at::timestamp,
  v.created_at::timestamp,
  NULL,
  v.guest_name,
  NULL,
  NULL,
  '[]'::jsonb,
  v.adults::integer,
  0,
  0,
  'manual',
  'resident',
  'KES'
FROM (
  VALUES
    (
      '2026-02-01', '2026-02-04', '3', '12000', 'Ochieng', 'half_board', '2', '2 pax',
      'FEB-O-0201',
      '[EWC26-WA FEB-O-0201] marked fully paid. 2 pax, 3 nights. M-PESA ref 116883148 was KES 11,950.',
      '2026-02-01 12:44:00'
    ),
    (
      '2026-02-03', '2026-02-05', '2', '24000', 'Karibu Safaris', 'half_board', '6', '6 pax',
      'FEB-K-0203',
      '[EWC26-WA FEB-K-0203] marked fully paid. 6 pax, 2 nights, arriving late lunch.',
      '2026-02-03 09:49:00'
    ),
    (
      '2026-02-03', '2026-02-05', '2', '20000', 'Ochieng', 'half_board', '5', '5 pax',
      'FEB-O-0203',
      '[EWC26-WA FEB-O-0203] marked fully paid. 5 pax, 2 nights. M-PESA ref 116929241 was KES 19,900.',
      '2026-02-03 18:44:00'
    ),
    (
      '2026-02-05', '2026-02-07', '2', '12000', 'Karibu Safaris', 'half_board', '3', '3 pax',
      'FEB-K-0205',
      '[EWC26-WA FEB-K-0205] marked fully paid. Message was marked Corrected. 3 pax, 2 nights, arriving late lunch.',
      '2026-02-05 15:37:00'
    ),
    (
      '2026-02-06', '2026-02-08', '2', '28000', 'Karibu Safaris', 'half_board', '7', '7 pax',
      'FEB-K-0206',
      '[EWC26-WA FEB-K-0206] marked fully paid. 7 pax, 2 nights, arriving late lunch.',
      '2026-02-06 07:48:00'
    ),
    (
      '2026-02-09', '2026-02-11', '2', '8000', 'Karibu Safaris', 'half_board', '2', '2 pax',
      'FEB-K-0209',
      '[EWC26-WA FEB-K-0209] marked fully paid. 2 pax, 2 nights, arriving late lunch.',
      '2026-02-09 06:54:00'
    ),
    (
      '2026-02-10', '2026-02-12', '2', '8000', 'Karibu Safaris', 'half_board', '2', '2 pax',
      'FEB-K-0210',
      '[EWC26-WA FEB-K-0210] marked fully paid. 2 pax, 2 nights, arriving late lunch.',
      '2026-02-10 06:47:00'
    ),
    (
      '2026-02-11', '2026-02-13', '2', '32000', 'Karibu Safaris', 'half_board', '8', '8 pax',
      'FEB-K-0211',
      '[EWC26-WA FEB-K-0211] marked fully paid. 8 pax, 2 nights, arriving late lunch.',
      '2026-02-11 06:12:00'
    ),
    (
      '2026-02-12', '2026-02-14', '2', '12000', 'Karibu Safaris', 'half_board', '3', '3 pax',
      'FEB-K-0212',
      '[EWC26-WA FEB-K-0212] marked fully paid. 3 pax, 2 nights, arriving late lunch.',
      '2026-02-12 08:00:00'
    ),
    (
      '2026-02-12', '2026-02-14', '2', '20000', 'Ochieng', 'half_board', '5', '5 pax',
      'FEB-O-0212',
      '[EWC26-WA FEB-O-0212] marked fully paid. 5 pax, 2 nights. KES 4,000 used for bed-net frames; M-PESA ref 117095046 deposited KES 16,000.',
      '2026-02-12 11:58:00'
    ),
    (
      '2026-02-13', '2026-02-15', '2', '12000', 'Karibu Safaris', 'half_board', '3', '3 pax',
      'FEB-K-0213',
      '[EWC26-WA FEB-K-0213] marked fully paid. 3 pax, 2 nights, arriving late lunch.',
      '2026-02-13 10:41:00'
    ),
    (
      '2026-02-13', '2026-02-15', '2', '4000', 'Ochieng', 'half_board', '1', '1 pax',
      'FEB-O-0213',
      '[EWC26-WA FEB-O-0213] marked fully paid. 1 pax, 2 nights. M-PESA ref 117121633 KES 4,000.',
      '2026-02-13 17:39:00'
    ),
    (
      '2026-02-14', '2026-02-16', '2', '4000', 'Karibu Safaris', 'half_board', '1', '1 pax',
      'FEB-K-0214',
      '[EWC26-WA FEB-K-0214] marked fully paid. 1 pax, 2 nights, arriving late lunch.',
      '2026-02-14 10:55:00'
    ),
    (
      '2026-02-17', '2026-02-19', '2', '20000', 'Karibu Safaris', 'half_board', '5', '5 pax',
      'FEB-K-0217',
      '[EWC26-WA FEB-K-0217] marked fully paid. 5 pax, 2 nights, arriving late lunch.',
      '2026-02-17 08:58:00'
    ),
    (
      '2026-02-20', '2026-02-22', '2', '16000', 'Karibu Safaris', 'half_board', '4', '4 pax',
      'FEB-K-0220',
      '[EWC26-WA FEB-K-0220] marked fully paid. 4 pax, 2 nights, arriving late lunch.',
      '2026-02-20 10:11:00'
    ),
    (
      '2026-03-01', '2026-03-03', '2', '4000', 'Karibu Safaris', 'half_board', '1', '1 pax',
      'MAR-K-0301',
      '[EWC26-WA MAR-K-0301] marked fully paid. 1 pax, 2 nights, arriving late lunch.',
      '2026-03-01 12:25:00'
    ),
    (
      '2026-03-02', '2026-03-04', '2', '16000', 'Karibu Safaris', 'half_board', '4', '4 pax',
      'MAR-K-0302',
      '[EWC26-WA MAR-K-0302] marked fully paid. 4 pax, 2 nights, arriving evening.',
      '2026-03-02 09:12:00'
    ),
    (
      '2026-03-02', '2026-03-05', '3', '12000', 'Ochieng', 'half_board', '2', '2 pax',
      'MAR-O-0302',
      '[EWC26-WA MAR-O-0302] marked fully paid. 2 pax, 3 nights. M-PESA ref 117419071 KES 12,000.',
      '2026-03-02 17:03:00'
    ),
    (
      '2026-03-04', '2026-03-07', '3', '12000', 'Karibu Safaris', 'half_board', '2', '2 pax',
      'MAR-K-0304',
      '[EWC26-WA MAR-K-0304] marked fully paid. 2 pax, 3 nights, arriving late lunch.',
      '2026-03-04 10:26:00'
    ),
    (
      '2026-03-05', '2026-03-08', '3', '6000', 'Karibu Safaris', 'half_board', '1', '1 pax',
      'MAR-K-0305',
      '[EWC26-WA MAR-K-0305] marked fully paid. 1 pax, 3 nights, arriving late lunch.',
      '2026-03-05 12:55:00'
    ),
    (
      '2026-03-06', '2026-03-08', '2', '4000', 'Karibu Safaris', 'half_board', '1', '1 pax',
      'MAR-K-0306',
      '[EWC26-WA MAR-K-0306] marked fully paid. 1 pax, 2 nights, arriving late lunch.',
      '2026-03-06 11:30:00'
    ),
    (
      '2026-03-06', '2026-03-07', '1', '2000', 'Ochieng', 'bed_only', '1', '1 pax',
      'MAR-O-0306',
      '[EWC26-WA MAR-O-0306] marked fully paid. 1 pax overnight. M-PESA ref 117493868 KES 2,000.',
      '2026-03-06 11:31:00'
    ),
    (
      '2026-03-09', '2026-03-11', '2', '16000', 'Karibu Safaris', 'half_board', '4', '4 pax',
      'MAR-K-0309',
      '[EWC26-WA MAR-K-0309] marked fully paid. 4 pax, 2 nights, arriving evening.',
      '2026-03-09 10:00:00'
    ),
    (
      '2026-03-09', '2026-03-11', '2', '8000', 'Ochieng', 'half_board', '2', '2 pax',
      'MAR-O-0309',
      '[EWC26-WA MAR-O-0309] marked fully paid. 2 pax, 2 nights. M-PESA ref 117544171 KES 8,000.',
      '2026-03-09 10:30:00'
    ),
    (
      '2026-03-12', '2026-03-14', '2', '8000', 'Karibu Safaris', 'half_board', '2', '2 pax',
      'MAR-K-0312',
      '[EWC26-WA MAR-K-0312] marked fully paid. 2 pax, 2 nights, arriving late lunch.',
      '2026-03-12 10:55:00'
    ),
    (
      '2026-03-12', '2026-03-14', '2', '35584', 'Booking.com', 'half_board', '6', '6 pax',
      'MAR-B-0312',
      '[EWC26-WA MAR-B-0312] marked fully paid. 6 pax, bed and breakfast. First night 139 USD, extended one night, 278 USD at 128 = KES 35,584. Dad asked whether the slip was for Enchoro; Stella deposited the net from the camp M-PESA. M-PESA ref 117620190 KES 30,000 after fuel and oil (KES 84 short of the KES 30,084 remainder).',
      '2026-03-13 09:01:00'
    ),
    (
      '2026-03-13', '2026-03-15', '2', '16000', 'Karibu Safaris', 'half_board', '4', '4 pax',
      'MAR-K-0313',
      '[EWC26-WA MAR-K-0313] marked fully paid. 4 pax, 2 nights, arriving late lunch.',
      '2026-03-13 12:56:00'
    ),
    (
      '2026-03-23', '2026-03-25', '2', '16000', 'Karibu Safaris', 'half_board', '4', '4 pax',
      'MAR-K-0323',
      '[EWC26-WA MAR-K-0323] marked fully paid. 4 pax, 2 nights, arriving late lunch.',
      '2026-03-23 11:01:00'
    ),
    (
      '2026-03-27', '2026-03-29', '2', '8000', 'Ochieng', 'half_board', '2', '2 pax',
      'MAR-O-0327',
      '[EWC26-WA MAR-O-0327] marked fully paid. 2 pax, 2 nights. M-PESA ref 117869708 KES 8,000.',
      '2026-03-27 16:45:00'
    ),
    (
      '2026-04-01', '2026-04-03', '2', '16000', 'Karibu Safaris', 'half_board', '4', '4 pax',
      'APR-K-0401',
      '[EWC26-WA APR-K-0401] marked fully paid. 4 pax, 2 nights, arriving late lunch. Operator line was not in the message; recorded as Karibu Safaris to match Dads other arrival notices.',
      '2026-04-01 12:33:00'
    ),
    (
      '2026-04-03', '2026-04-05', '2', '8000', 'Karibu Safaris', 'half_board', '2', '2 pax',
      'APR-K-0403',
      '[EWC26-WA APR-K-0403] marked fully paid. 2 pax, 2 nights, arriving evening.',
      '2026-04-03 11:02:00'
    ),
    (
      '2026-04-06', '2026-04-07', '1', '4000', 'Ochieng', 'bed_only', '2', '2 pax',
      'APR-O-0406',
      '[EWC26-WA APR-O-0406] marked fully paid. 2 pax overnight. Diesel, petrol, and transport KES 1,500; M-PESA ref 118056150 deposited KES 2,500.',
      '2026-04-06 15:55:00'
    ),
    (
      '2026-04-09', '2026-04-10', '1', '8000', 'Ochieng', 'bed_only', '4', '4 pax',
      'APR-O-0409',
      '[EWC26-WA APR-O-0409] marked fully paid. 4 pax overnight. Transformer repair and water-pump petrol KES 1,000; M-PESA ref 118122807 deposited KES 7,000.',
      '2026-04-09 16:57:00'
    ),
    (
      '2026-04-13', '2026-04-15', '2', '12000', 'Karibu Safaris', 'half_board', '3', '3 pax',
      'APR-K-0413',
      '[EWC26-WA APR-K-0413] marked fully paid. 3 pax, 2 nights, arriving late lunch.',
      '2026-04-13 12:28:00'
    ),
    (
      '2026-04-15', '2026-04-17', '2', '32000', 'Karibu Safaris', 'half_board', '8', '8 pax',
      'APR-K-0415A',
      '[EWC26-WA APR-K-0415A] marked fully paid. Split from the 9 pax / KES 34,000 message: 8 pax, 2 nights, arriving late lunch.',
      '2026-04-15 12:27:00'
    ),
    (
      '2026-04-15', '2026-04-16', '1', '2000', 'Karibu Safaris', 'half_board', '1', '1 pax',
      'APR-K-0415B',
      '[EWC26-WA APR-K-0415B] marked fully paid. Split from the 9 pax / KES 34,000 message: 1 pax, 1 night, arriving late lunch.',
      '2026-04-15 12:27:00'
    ),
    (
      '2026-04-18', '2026-04-20', '2', '12000', 'Karibu Safaris', 'half_board', '3', '3 pax',
      'APR-K-0418',
      '[EWC26-WA APR-K-0418] marked fully paid. 3 pax, 2 nights, arriving late lunch. Karibu Safaris named in the follow-up message.',
      '2026-04-18 10:36:00'
    ),
    (
      '2026-04-20', '2026-04-22', '2', '8000', 'Karibu Safaris', 'half_board', '3', '3 pax',
      'APR-K-0420',
      '[EWC26-WA APR-K-0420] marked fully paid. 3 pax, 2 nights, arriving late lunch. Stated total is KES 8,000; the usual rate for this party would be KES 12,000.',
      '2026-04-20 13:12:00'
    )
) AS v(
  check_in_date,
  check_out_date,
  nights,
  total_amount,
  external_company,
  meal_type,
  adults,
  guest_name,
  token,
  notes,
  created_at
)
WHERE NOT EXISTS (
  SELECT 1
  FROM "hotel_bookings" hb
  WHERE hb.company_id = 'ewc'
    AND (
      hb.notes LIKE '%[EWC26-WA ' || v.token || ']%'
      OR (
        hb.check_in_date = v.check_in_date::date
        AND hb.nights = v.nights::integer
        AND hb.total_amount = v.total_amount::integer
        AND lower(coalesce(hb.external_company, '')) = lower(v.external_company)
      )
    )
)
AND NOT (
  v.token IN ('APR-K-0415A', 'APR-K-0415B')
  AND EXISTS (
    SELECT 1
    FROM "hotel_bookings" hb
    WHERE hb.company_id = 'ewc'
      AND hb.check_in_date = DATE '2026-04-15'
      AND hb.total_amount = 34000
      AND lower(coalesce(hb.external_company, '')) LIKE '%karibu%'
  )
)
AND NOT (
  v.token = 'MAR-B-0312'
  AND EXISTS (
    SELECT 1
    FROM "hotel_bookings" hb
    WHERE hb.company_id = 'ewc'
      AND hb.check_in_date = DATE '2026-03-12'
      AND lower(coalesce(hb.external_company, '')) LIKE '%booking%'
  )
);

INSERT INTO "bar_categories" ("company_id", "name", "description", "sort_order")
SELECT 'ewc', 'Drinks', 'Camp bar', 0
WHERE NOT EXISTS (
  SELECT 1
  FROM "bar_categories" c
  WHERE c.company_id = 'ewc'
);

INSERT INTO "bar_items" (
  "company_id",
  "category_id",
  "name",
  "description",
  "price",
  "is_available"
)
SELECT
  'ewc',
  (
    SELECT c.id
    FROM "bar_categories" c
    WHERE c.company_id = 'ewc'
    ORDER BY c.id
    LIMIT 1
  ),
  v.name,
  'Added for the Feb–Apr 2026 WhatsApp bar import.',
  v.price::integer,
  true
FROM (
  VALUES
    ('Soda', '100'),
    ('Water', '200'),
    ('Tusker', '400'),
    ('Wine', '400')
) AS v(name, price)
WHERE NOT EXISTS (
  SELECT 1
  FROM "bar_items" bi
  WHERE bi.company_id = 'ewc'
    AND bi.name ILIKE v.name || '%'
);

INSERT INTO "bar_orders" (
  "company_id",
  "status",
  "table_label",
  "customer_name",
  "notes",
  "created_at",
  "updated_at"
)
SELECT
  'ewc',
  v.status,
  v.table_label,
  NULL,
  v.notes,
  v.created_at::timestamp,
  v.created_at::timestamp
FROM (
  VALUES
    (
      'BAR-0206',
      'paid',
      '31/01/2026 - 06/02/2026',
      '[EWC26-WA BAR-0206] Weekly bar sales 31/01/2026 to 06/02/2026. Total sales KES 3,900. M-PESA ref 116990662.',
      '2026-02-06 19:12:00'
    ),
    (
      'BAR-0213',
      'partially_paid',
      '07/02/2026 - 13/02/2026',
      '[EWC26-WA BAR-0213] Weekly bar sales 07/02/2026 to 13/02/2026. Message total KES 17,300; listed lines sum to KES 17,100. Deposit KES 6,780, M-PESA ref 117123507. Diesel and Tusker crates are expenses.',
      '2026-02-13 18:42:00'
    ),
    (
      'BAR-0220',
      'unpaid',
      '14/02/2026 - 20/02/2026',
      '[EWC26-WA BAR-0220] Weekly bar sales 14/02/2026 to 20/02/2026. Total sales KES 7,100. No deposit in this chat, so no payment.',
      '2026-02-20 18:43:00'
    ),
    (
      'BAR-0327',
      'paid',
      '21/03/2026 - 27/03/2026',
      '[EWC26-WA BAR-0327] Weekly bar sales 21/03/2026 to 27/03/2026. Total sales KES 7,700. M-PESA ref 117872420.',
      '2026-03-27 19:01:00'
    ),
    (
      'BAR-0417',
      'paid',
      '11/04/2026 - 17/04/2026',
      '[EWC26-WA BAR-0417] Weekly bar sales 11/04/2026 to 17/04/2026. Total sales KES 4,000. M-PESA receipt UDHCA17T09.',
      '2026-04-17 18:26:00'
    ),
    (
      'BAR-0424',
      'partially_paid',
      '18/04/2026 - 24/04/2026',
      '[EWC26-WA BAR-0424] Weekly bar sales 18/04/2026 to 24/04/2026. Total sales KES 6,600. Amount available for deposit KES 2,000 after the beer crate. No transfer receipt in this chat.',
      '2026-04-24 18:50:00'
    )
) AS v(token, status, table_label, notes, created_at)
WHERE NOT EXISTS (
  SELECT 1
  FROM "bar_orders" o
  WHERE o.company_id = 'ewc'
    AND o.notes LIKE '%[EWC26-WA ' || v.token || ']%'
);

INSERT INTO "bar_order_items" (
  "company_id",
  "order_id",
  "item_id",
  "quantity",
  "unit_price",
  "line_total",
  "notes",
  "created_at"
)
SELECT
  'ewc',
  o.id,
  bi.id,
  v.quantity::integer,
  v.unit_price::integer,
  v.line_total::integer,
  '[EWC26-WA ' || v.token || ' ' || v.item_name || ']',
  o.created_at
FROM (
  VALUES
    ('BAR-0206', 'Soda', '9', '100', '900'),
    ('BAR-0206', 'Water', '3', '200', '600'),
    ('BAR-0206', 'Tusker', '6', '400', '2400'),
    ('BAR-0213', 'Soda', '19', '100', '1900'),
    ('BAR-0213', 'Water', '12', '200', '2400'),
    ('BAR-0213', 'Tusker', '22', '400', '8800'),
    ('BAR-0213', 'Wine', '10', '400', '4000'),
    ('BAR-0220', 'Soda', '13', '100', '1300'),
    ('BAR-0220', 'Water', '3', '200', '600'),
    ('BAR-0220', 'Tusker', '10', '400', '4000'),
    ('BAR-0220', 'Wine', '3', '400', '1200'),
    ('BAR-0327', 'Soda', '31', '100', '3100'),
    ('BAR-0327', 'Water', '15', '200', '3000'),
    ('BAR-0327', 'Tusker', '4', '400', '1600'),
    ('BAR-0417', 'Soda', '6', '100', '600'),
    ('BAR-0417', 'Water', '3', '200', '600'),
    ('BAR-0417', 'Tusker', '5', '400', '2000'),
    ('BAR-0417', 'Wine', '2', '400', '800'),
    ('BAR-0424', 'Water', '3', '200', '600'),
    ('BAR-0424', 'Tusker', '10', '400', '4000'),
    ('BAR-0424', 'Wine', '5', '400', '2000')
) AS v(token, item_name, quantity, unit_price, line_total)
JOIN "bar_orders" o
  ON o.company_id = 'ewc'
 AND o.notes LIKE '%[EWC26-WA ' || v.token || ']%'
JOIN LATERAL (
  SELECT bi.id
  FROM "bar_items" bi
  WHERE bi.company_id = 'ewc'
    AND bi.name ILIKE v.item_name || '%'
  ORDER BY length(bi.name), bi.id
  LIMIT 1
) bi ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "bar_order_items" li
  WHERE li.order_id = o.id
    AND li.notes LIKE '%[EWC26-WA ' || v.token || ' ' || v.item_name || ']%'
);

INSERT INTO "expenses" (
  "company_id",
  "booking_id",
  "reference_type",
  "reference_id",
  "category",
  "amount",
  "description",
  "incurred_at",
  "created_at"
)
SELECT
  'ewc',
  NULL,
  CASE
    WHEN v.reference_type = '' THEN NULL
    ELSE v.reference_type::financial_reference_type
  END,
  (
    SELECT hb.id
    FROM "hotel_bookings" hb
    WHERE v.stay_token <> ''
      AND hb.company_id = 'ewc'
      AND (
        hb.notes LIKE '%[EWC26-WA ' || v.stay_token || ']%'
        OR (
          hb.check_in_date = NULLIF(v.stay_check_in, '')::date
          AND hb.total_amount = NULLIF(v.stay_total, '')::integer
          AND lower(coalesce(hb.external_company, '')) = lower(v.stay_company)
        )
      )
    ORDER BY hb.id
    LIMIT 1
  ),
  v.category,
  v.amount::integer,
  v.description,
  v.incurred_at::timestamp,
  v.incurred_at::timestamp
FROM (
  VALUES
    (
      'Supplies', '4000',
      '[EWC26-WA EXP-FEB-O-0212-NETS] 4 bed net frames for Kimanjaro and Mingati, paid from the Ochieng receipt.',
      'EXP-FEB-O-0212-NETS',
      'hotel', 'FEB-O-0212', '2026-02-12', '20000', 'Ochieng',
      '2026-02-12 11:58:00'
    ),
    (
      'Fuel', '980',
      '[EWC26-WA EXP-FEB-BAR-0213-DIESEL] 5 litres of diesel, weekly bar record 07/02/2026 to 13/02/2026.',
      'EXP-FEB-BAR-0213-DIESEL',
      '', '', '', '0', '',
      '2026-02-13 18:42:00'
    ),
    (
      'Bar stock', '9600',
      '[EWC26-WA EXP-FEB-BAR-0213-TUSKER] 2 crates of Tusker, weekly bar record 07/02/2026 to 13/02/2026.',
      'EXP-FEB-BAR-0213-TUSKER',
      '', '', '', '0', '',
      '2026-02-13 18:42:00'
    ),
    (
      'Fuel', '3600',
      '[EWC26-WA EXP-MAR-B-0313-DIESEL] Diesel 20 litres, paid from the Booking.com receipt.',
      'EXP-MAR-B-0313-DIESEL',
      'hotel', 'MAR-B-0312', '2026-03-12', '35584', 'Booking.com',
      '2026-03-13 09:01:00'
    ),
    (
      'Fuel', '700',
      '[EWC26-WA EXP-MAR-B-0313-PETROL] Petrol 3 litres, paid from the Booking.com receipt.',
      'EXP-MAR-B-0313-PETROL',
      'hotel', 'MAR-B-0312', '2026-03-12', '35584', 'Booking.com',
      '2026-03-13 09:01:00'
    ),
    (
      'Fuel', '1200',
      '[EWC26-WA EXP-MAR-B-0313-OIL] Oil 2 litres, paid from the Booking.com receipt.',
      'EXP-MAR-B-0313-OIL',
      'hotel', 'MAR-B-0312', '2026-03-12', '35584', 'Booking.com',
      '2026-03-13 09:01:00'
    ),
    (
      'Fuel', '1000',
      '[EWC26-WA EXP-APR-O-0406-DIESEL] Diesel 5 litres, paid from the Ochieng overnight receipt.',
      'EXP-APR-O-0406-DIESEL',
      'hotel', 'APR-O-0406', '2026-04-06', '4000', 'Ochieng',
      '2026-04-06 15:55:00'
    ),
    (
      'Fuel', '400',
      '[EWC26-WA EXP-APR-O-0406-PETROL] Petrol 2 litres, paid from the Ochieng overnight receipt.',
      'EXP-APR-O-0406-PETROL',
      'hotel', 'APR-O-0406', '2026-04-06', '4000', 'Ochieng',
      '2026-04-06 15:55:00'
    ),
    (
      'Transport', '100',
      '[EWC26-WA EXP-APR-O-0406-TRANSPORT] Transport, paid from the Ochieng overnight receipt.',
      'EXP-APR-O-0406-TRANSPORT',
      'hotel', 'APR-O-0406', '2026-04-06', '4000', 'Ochieng',
      '2026-04-06 15:55:00'
    ),
    (
      'Repairs', '500',
      '[EWC26-WA EXP-APR-O-0409-POWER] Electricity repair at the main transformer, paid from the Ochieng overnight receipt.',
      'EXP-APR-O-0409-POWER',
      'hotel', 'APR-O-0409', '2026-04-09', '8000', 'Ochieng',
      '2026-04-09 16:57:00'
    ),
    (
      'Fuel', '500',
      '[EWC26-WA EXP-APR-O-0409-PETROL] Petrol 2 litres for the water pump, paid from the Ochieng overnight receipt.',
      'EXP-APR-O-0409-PETROL',
      'hotel', 'APR-O-0409', '2026-04-09', '8000', 'Ochieng',
      '2026-04-09 16:57:00'
    ),
    (
      'Bar stock', '4600',
      '[EWC26-WA EXP-APR-BAR-0424-BEER] 1 crate of beer. The 24/04/2026 bar note said it was to be purchased at 4,600; the deposit was KES 2,000 from KES 6,600 sales.',
      'EXP-APR-BAR-0424-BEER',
      '', '', '', '0', '',
      '2026-04-24 18:50:00'
    )
) AS v(
  category,
  amount,
  description,
  token,
  reference_type,
  stay_token,
  stay_check_in,
  stay_total,
  stay_company,
  incurred_at
)
WHERE NOT EXISTS (
  SELECT 1
  FROM "expenses" e
  WHERE e.company_id = 'ewc'
    AND e.description LIKE '%[EWC26-WA ' || v.token || ']%'
);

INSERT INTO "payments" (
  "company_id",
  "booking_id",
  "reference_type",
  "reference_id",
  "amount",
  "currency",
  "status",
  "method",
  "provider",
  "idempotency_key",
  "notes",
  "recorded_at",
  "created_at"
)
SELECT
  'ewc',
  NULL,
  'hotel'::financial_reference_type,
  hb.id,
  hb.total_amount,
  'KES',
  'completed',
  CASE
    WHEN hb.notes LIKE '%M-PESA ref%' OR hb.notes ILIKE '%receipt %' THEN 'm-pesa'
    ELSE NULL
  END,
  CASE
    WHEN hb.notes LIKE '%M-PESA ref%' OR hb.notes ILIKE '%receipt %' THEN 'm-pesa'
    ELSE 'manual'
  END,
  'EWC26-WA-PAY-' || v.token,
  '[EWC26-WA PAY-' || v.token || '] Completed payment for the stay. ' || coalesce(hb.notes, ''),
  coalesce(hb.created_at, v.recorded_at::timestamp),
  coalesce(hb.created_at, v.recorded_at::timestamp)
FROM (
  VALUES
    ('FEB-O-0201', '2026-02-01', '12000', 'Ochieng', '2026-02-01 12:44:00'),
    ('FEB-K-0203', '2026-02-03', '24000', 'Karibu Safaris', '2026-02-03 09:49:00'),
    ('FEB-O-0203', '2026-02-03', '20000', 'Ochieng', '2026-02-03 18:44:00'),
    ('FEB-K-0205', '2026-02-05', '12000', 'Karibu Safaris', '2026-02-05 15:37:00'),
    ('FEB-K-0206', '2026-02-06', '28000', 'Karibu Safaris', '2026-02-06 07:48:00'),
    ('FEB-K-0209', '2026-02-09', '8000', 'Karibu Safaris', '2026-02-09 06:54:00'),
    ('FEB-K-0210', '2026-02-10', '8000', 'Karibu Safaris', '2026-02-10 06:47:00'),
    ('FEB-K-0211', '2026-02-11', '32000', 'Karibu Safaris', '2026-02-11 06:12:00'),
    ('FEB-K-0212', '2026-02-12', '12000', 'Karibu Safaris', '2026-02-12 08:00:00'),
    ('FEB-O-0212', '2026-02-12', '20000', 'Ochieng', '2026-02-12 11:58:00'),
    ('FEB-K-0213', '2026-02-13', '12000', 'Karibu Safaris', '2026-02-13 10:41:00'),
    ('FEB-O-0213', '2026-02-13', '4000', 'Ochieng', '2026-02-13 17:39:00'),
    ('FEB-K-0214', '2026-02-14', '4000', 'Karibu Safaris', '2026-02-14 10:55:00'),
    ('FEB-K-0217', '2026-02-17', '20000', 'Karibu Safaris', '2026-02-17 08:58:00'),
    ('FEB-K-0220', '2026-02-20', '16000', 'Karibu Safaris', '2026-02-20 10:11:00'),
    ('MAR-K-0301', '2026-03-01', '4000', 'Karibu Safaris', '2026-03-01 12:25:00'),
    ('MAR-K-0302', '2026-03-02', '16000', 'Karibu Safaris', '2026-03-02 09:12:00'),
    ('MAR-O-0302', '2026-03-02', '12000', 'Ochieng', '2026-03-02 17:03:00'),
    ('MAR-K-0304', '2026-03-04', '12000', 'Karibu Safaris', '2026-03-04 10:26:00'),
    ('MAR-K-0305', '2026-03-05', '6000', 'Karibu Safaris', '2026-03-05 12:55:00'),
    ('MAR-K-0306', '2026-03-06', '4000', 'Karibu Safaris', '2026-03-06 11:30:00'),
    ('MAR-O-0306', '2026-03-06', '2000', 'Ochieng', '2026-03-06 11:31:00'),
    ('MAR-K-0309', '2026-03-09', '16000', 'Karibu Safaris', '2026-03-09 10:00:00'),
    ('MAR-O-0309', '2026-03-09', '8000', 'Ochieng', '2026-03-09 10:30:00'),
    ('MAR-K-0312', '2026-03-12', '8000', 'Karibu Safaris', '2026-03-12 10:55:00'),
    ('MAR-B-0312', '2026-03-12', '35584', 'Booking.com', '2026-03-13 09:01:00'),
    ('MAR-K-0313', '2026-03-13', '16000', 'Karibu Safaris', '2026-03-13 12:56:00'),
    ('MAR-K-0323', '2026-03-23', '16000', 'Karibu Safaris', '2026-03-23 11:01:00'),
    ('MAR-O-0327', '2026-03-27', '8000', 'Ochieng', '2026-03-27 16:45:00'),
    ('APR-K-0401', '2026-04-01', '16000', 'Karibu Safaris', '2026-04-01 12:33:00'),
    ('APR-K-0403', '2026-04-03', '8000', 'Karibu Safaris', '2026-04-03 11:02:00'),
    ('APR-O-0406', '2026-04-06', '4000', 'Ochieng', '2026-04-06 15:55:00'),
    ('APR-O-0409', '2026-04-09', '8000', 'Ochieng', '2026-04-09 16:57:00'),
    ('APR-K-0413', '2026-04-13', '12000', 'Karibu Safaris', '2026-04-13 12:28:00'),
    ('APR-K-0415A', '2026-04-15', '32000', 'Karibu Safaris', '2026-04-15 12:27:00'),
    ('APR-K-0415B', '2026-04-15', '2000', 'Karibu Safaris', '2026-04-15 12:27:00'),
    ('APR-K-0418', '2026-04-18', '12000', 'Karibu Safaris', '2026-04-18 10:36:00'),
    ('APR-K-0420', '2026-04-20', '8000', 'Karibu Safaris', '2026-04-20 13:12:00')
) AS v(token, check_in, total_amount, external_company, recorded_at)
JOIN LATERAL (
  SELECT hb.id, hb.total_amount, hb.notes, hb.created_at
  FROM "hotel_bookings" hb
  WHERE hb.company_id = 'ewc'
    AND (
      hb.notes LIKE '%[EWC26-WA ' || v.token || ']%'
      OR (
        hb.check_in_date = v.check_in::date
        AND hb.total_amount = v.total_amount::integer
        AND lower(coalesce(hb.external_company, '')) = lower(v.external_company)
      )
      OR (
        v.token = 'MAR-B-0312'
        AND hb.check_in_date = DATE '2026-03-12'
        AND lower(coalesce(hb.external_company, '')) LIKE '%booking%'
      )
    )
  ORDER BY
    CASE WHEN hb.notes LIKE '%[EWC26-WA ' || v.token || ']%' THEN 0 ELSE 1 END,
    hb.id
  LIMIT 1
) hb ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "payments" p
  WHERE p.company_id = 'ewc'
    AND (
      p.idempotency_key = 'EWC26-WA-PAY-' || v.token
      OR (
        p.reference_type = 'hotel'
        AND p.reference_id = hb.id
      )
    )
);

-- One payment when 15 Apr Karibu is already stored as a single KES 34,000 stay.
INSERT INTO "payments" (
  "company_id",
  "booking_id",
  "reference_type",
  "reference_id",
  "amount",
  "currency",
  "status",
  "method",
  "provider",
  "idempotency_key",
  "notes",
  "recorded_at",
  "created_at"
)
SELECT
  'ewc',
  NULL,
  'hotel'::financial_reference_type,
  hb.id,
  hb.total_amount,
  'KES',
  'completed',
  NULL,
  'manual',
  'EWC26-WA-PAY-APR-K-0415',
  '[EWC26-WA PAY-APR-K-0415] Completed payment for the combined 9 pax / KES 34,000 Karibu stay.',
  coalesce(hb.created_at, TIMESTAMP '2026-04-15 12:27:00'),
  coalesce(hb.created_at, TIMESTAMP '2026-04-15 12:27:00')
FROM "hotel_bookings" hb
WHERE hb.company_id = 'ewc'
  AND hb.check_in_date = DATE '2026-04-15'
  AND hb.total_amount = 34000
  AND lower(coalesce(hb.external_company, '')) LIKE '%karibu%'
  AND NOT EXISTS (
    SELECT 1
    FROM "hotel_bookings" split
    WHERE split.company_id = 'ewc'
      AND (
        split.notes LIKE '%[EWC26-WA APR-K-0415A]%'
        OR split.notes LIKE '%[EWC26-WA APR-K-0415B]%'
      )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "payments" p
    WHERE p.company_id = 'ewc'
      AND (
        p.idempotency_key = 'EWC26-WA-PAY-APR-K-0415'
        OR (p.reference_type = 'hotel' AND p.reference_id = hb.id)
      )
  );

INSERT INTO "payments" (
  "company_id",
  "booking_id",
  "reference_type",
  "reference_id",
  "amount",
  "currency",
  "status",
  "method",
  "provider",
  "idempotency_key",
  "notes",
  "recorded_at",
  "created_at"
)
SELECT
  'ewc',
  NULL,
  'bar'::financial_reference_type,
  o.id,
  v.amount::integer,
  'KES',
  'completed',
  NULLIF(v.method, ''),
  v.provider,
  'EWC26-WA-PAY-' || v.token,
  v.notes,
  v.recorded_at::timestamp,
  v.recorded_at::timestamp
FROM (
  VALUES
    (
      'BAR-0206',
      '3900',
      'm-pesa',
      'm-pesa',
      '[EWC26-WA PAY-BAR-0206] Completed. Paid bar sales KES 3,900. M-PESA ref 116990662.',
      '2026-02-06 19:12:00'
    ),
    (
      'BAR-0213',
      '6780',
      'm-pesa',
      'm-pesa',
      '[EWC26-WA PAY-BAR-0213] Completed. Partially paid bar sales. Deposit KES 6,780 of KES 17,300. M-PESA ref 117123507.',
      '2026-02-13 19:09:00'
    ),
    (
      'BAR-0327',
      '7700',
      'm-pesa',
      'm-pesa',
      '[EWC26-WA PAY-BAR-0327] Completed. Paid bar sales KES 7,700. M-PESA ref 117872420.',
      '2026-03-27 19:03:00'
    ),
    (
      'BAR-0417',
      '4000',
      'm-pesa',
      'm-pesa',
      '[EWC26-WA PAY-BAR-0417] Completed. Paid bar sales KES 4,000. M-PESA receipt UDHCA17T09.',
      '2026-04-18 12:57:00'
    ),
    (
      'BAR-0424',
      '2000',
      '',
      'manual',
      '[EWC26-WA PAY-BAR-0424] Completed. Partially paid bar sales. Deposit KES 2,000 of KES 6,600. The weekly note states the amount available for deposit; this chat has no transfer receipt.',
      '2026-04-24 18:50:00'
    )
) AS v(token, amount, method, provider, notes, recorded_at)
JOIN "bar_orders" o
  ON o.company_id = 'ewc'
 AND o.notes LIKE '%[EWC26-WA ' || v.token || ']%'
 AND o.status IN ('paid', 'partially_paid')
WHERE NOT EXISTS (
  SELECT 1
  FROM "payments" p
  WHERE p.company_id = 'ewc'
    AND (
      p.idempotency_key = 'EWC26-WA-PAY-' || v.token
      OR (
        p.reference_type = 'bar'
        AND p.reference_id = o.id
      )
    )
);

UPDATE "payments" p
SET "status" = 'completed'
WHERE p.company_id = 'ewc'
  AND p.idempotency_key LIKE 'EWC26-WA-PAY-%'
  AND lower(p.status) IS DISTINCT FROM 'completed';

UPDATE "payments" p
SET "status" = 'completed'
FROM "hotel_bookings" hb
WHERE p.company_id = 'ewc'
  AND hb.company_id = 'ewc'
  AND p.reference_type = 'hotel'
  AND p.reference_id = hb.id
  AND hb.notes LIKE '%[EWC26-WA %]%'
  AND hb.check_in_date >= DATE '2026-02-01'
  AND hb.check_in_date < DATE '2026-05-01'
  AND lower(p.status) IS DISTINCT FROM 'completed';

UPDATE "payments" p
SET "status" = 'completed'
FROM "bar_orders" o
WHERE p.company_id = 'ewc'
  AND o.company_id = 'ewc'
  AND p.reference_type = 'bar'
  AND p.reference_id = o.id
  AND o.notes LIKE '%[EWC26-WA BAR-%]%'
  AND o.status IN ('paid', 'partially_paid')
  AND lower(p.status) IS DISTINCT FROM 'completed';

DELETE FROM "revenue_entries" r
USING "payments" p
WHERE r.company_id = 'ewc'
  AND p.company_id = 'ewc'
  AND p.idempotency_key LIKE 'EWC26-WA-PAY-%'
  AND r.reference_type = p.reference_type
  AND r.reference_id = p.reference_id
  AND p.reference_type IN ('hotel', 'bar');

INSERT INTO "revenue_entries" (
  "company_id",
  "booking_id",
  "reference_type",
  "reference_id",
  "amount",
  "package_label",
  "period_month",
  "recognized_at",
  "created_at"
)
SELECT
  'ewc',
  NULL,
  'payment'::financial_reference_type,
  p.id,
  p.amount,
  CASE p.reference_type
    WHEN 'hotel' THEN 'Hotel stay #' || p.reference_id::text || ' — payment #' || p.id::text
    WHEN 'bar' THEN 'Bar order #' || p.reference_id::text || ' — payment #' || p.id::text
    ELSE 'Payment #' || p.id::text || ' (KES)'
  END,
  to_char(coalesce(p.recorded_at, p.created_at), 'YYYY-MM'),
  coalesce(p.recorded_at, p.created_at),
  coalesce(p.recorded_at, p.created_at)
FROM "payments" p
WHERE p.company_id = 'ewc'
  AND lower(p.status) = 'completed'
  AND (
    p.idempotency_key LIKE 'EWC26-WA-PAY-%'
    OR (
      p.reference_type = 'hotel'
      AND p.reference_id IN (
        SELECT hb.id
        FROM "hotel_bookings" hb
        WHERE hb.company_id = 'ewc'
          AND hb.notes LIKE '%[EWC26-WA %]%'
          AND hb.check_in_date >= DATE '2026-02-01'
          AND hb.check_in_date < DATE '2026-05-01'
      )
    )
    OR (
      p.reference_type = 'bar'
      AND p.reference_id IN (
        SELECT o.id
        FROM "bar_orders" o
        WHERE o.company_id = 'ewc'
          AND o.notes LIKE '%[EWC26-WA BAR-%]%'
          AND o.status IN ('paid', 'partially_paid')
      )
    )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "revenue_entries" r
    WHERE r.company_id = 'ewc'
      AND r.reference_type = 'payment'
      AND r.reference_id = p.id
  );

COMMIT;
