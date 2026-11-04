-- BTH hotel stays, 22-31 Oct 2026.
-- Stays through 21 Oct are already loaded (tokens OCT-2 through OCT-310)
-- with their payments and revenue. This file does not insert them again.
-- Read from the October hotel sheet. The Time column is blank in the
-- screenshot, so a stay with no nights figure is 1 night.
-- A nights figure on the sheet is used as written.
-- Cash and M-PESA are completed payments. One revenue row is stored for
-- the stay total, linked to the stay. Credit is unpaid and has no payment
-- and no revenue.
-- Eight stays from 18-21 Oct were stored as credit. The sheet now shows
-- them paid, so those rows are updated and their payments and revenue added.
-- Each statement skips a row that is already stored.

BEGIN;

SELECT setval('hotel_bookings_id_seq', (SELECT MAX(id) FROM hotel_bookings));
SELECT setval('hotel_booking_rooms_id_seq', (SELECT MAX(id) FROM hotel_booking_rooms));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('revenue_entries_id_seq', (SELECT MAX(id) FROM revenue_entries));

UPDATE hotel_bookings
SET amount_paid = 2000, payment_method = 'cash', payment_status = 'paid', updated_at = '2026-10-18 11:00:00'
WHERE company_id = 'bth'
  AND (notes = '[BTH26-XLSX OCT-265]' OR notes LIKE '[BTH26-XLSX OCT-265] |%')
  AND payment_status = 'unpaid'
  AND amount_paid = 0
  AND total_amount = 2000;
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-265-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-265]' OR b.notes LIKE '[BTH26-XLSX OCT-265] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-265-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-265]' OR b.notes LIKE '[BTH26-XLSX OCT-265] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );

UPDATE hotel_bookings
SET amount_paid = 1500, payment_method = 'm-pesa', payment_status = 'paid', updated_at = '2026-10-18 11:00:00'
WHERE company_id = 'bth'
  AND (notes = '[BTH26-XLSX OCT-271]' OR notes LIKE '[BTH26-XLSX OCT-271] |%')
  AND payment_status = 'unpaid'
  AND amount_paid = 0
  AND total_amount = 1500;
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-271-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-271]' OR b.notes LIKE '[BTH26-XLSX OCT-271] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-271-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-271]' OR b.notes LIKE '[BTH26-XLSX OCT-271] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );

UPDATE hotel_bookings
SET amount_paid = 2000, payment_method = 'cash', payment_status = 'paid', updated_at = '2026-10-19 11:00:00'
WHERE company_id = 'bth'
  AND (notes = '[BTH26-XLSX OCT-278]' OR notes LIKE '[BTH26-XLSX OCT-278] |%')
  AND payment_status = 'unpaid'
  AND amount_paid = 0
  AND total_amount = 2000;
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-278-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-278]' OR b.notes LIKE '[BTH26-XLSX OCT-278] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-278-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-278]' OR b.notes LIKE '[BTH26-XLSX OCT-278] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );

UPDATE hotel_bookings
SET amount_paid = 1500, payment_method = 'm-pesa', payment_status = 'paid', updated_at = '2026-10-19 11:00:00'
WHERE company_id = 'bth'
  AND (notes = '[BTH26-XLSX OCT-283]' OR notes LIKE '[BTH26-XLSX OCT-283] |%')
  AND payment_status = 'unpaid'
  AND amount_paid = 0
  AND total_amount = 1500;
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-283-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-283]' OR b.notes LIKE '[BTH26-XLSX OCT-283] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-283-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-283]' OR b.notes LIKE '[BTH26-XLSX OCT-283] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );

UPDATE hotel_bookings
SET amount_paid = 2000, payment_method = 'cash', payment_status = 'paid', updated_at = '2026-10-20 11:00:00'
WHERE company_id = 'bth'
  AND (notes = '[BTH26-XLSX OCT-288]' OR notes LIKE '[BTH26-XLSX OCT-288] |%')
  AND payment_status = 'unpaid'
  AND amount_paid = 0
  AND total_amount = 2000;
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-288-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-288]' OR b.notes LIKE '[BTH26-XLSX OCT-288] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-288-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-288]' OR b.notes LIKE '[BTH26-XLSX OCT-288] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );

UPDATE hotel_bookings
SET amount_paid = 1500, payment_method = 'm-pesa', payment_status = 'paid', updated_at = '2026-10-20 11:00:00'
WHERE company_id = 'bth'
  AND (notes = '[BTH26-XLSX OCT-296]' OR notes LIKE '[BTH26-XLSX OCT-296] |%')
  AND payment_status = 'unpaid'
  AND amount_paid = 0
  AND total_amount = 1500;
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-296-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-296]' OR b.notes LIKE '[BTH26-XLSX OCT-296] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-296-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-296]' OR b.notes LIKE '[BTH26-XLSX OCT-296] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );

UPDATE hotel_bookings
SET amount_paid = 2000, payment_method = 'cash', payment_status = 'paid', updated_at = '2026-10-21 11:00:00'
WHERE company_id = 'bth'
  AND (notes = '[BTH26-XLSX OCT-304]' OR notes LIKE '[BTH26-XLSX OCT-304] |%')
  AND payment_status = 'unpaid'
  AND amount_paid = 0
  AND total_amount = 2000;
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-304-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-304]' OR b.notes LIKE '[BTH26-XLSX OCT-304] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-304-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-304]' OR b.notes LIKE '[BTH26-XLSX OCT-304] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );

UPDATE hotel_bookings
SET amount_paid = 1500, payment_method = 'm-pesa', payment_status = 'paid', updated_at = '2026-10-21 11:00:00'
WHERE company_id = 'bth'
  AND (notes = '[BTH26-XLSX OCT-309]' OR notes LIKE '[BTH26-XLSX OCT-309] |%')
  AND payment_status = 'unpaid'
  AND amount_paid = 0
  AND total_amount = 1500;
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-309-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-309]' OR b.notes LIKE '[BTH26-XLSX OCT-309] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-309-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-309]' OR b.notes LIKE '[BTH26-XLSX OCT-309] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );

INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 80, '2026-10-22', '2026-10-23', 1, 1700, 1700, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-311]', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-311]' OR notes LIKE '[BTH26-XLSX OCT-311] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 80, 1, 1700, '2026-10-22 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-311]' OR b.notes LIKE '[BTH26-XLSX OCT-311] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 80
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1700, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-311-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-311]' OR b.notes LIKE '[BTH26-XLSX OCT-311] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-311-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-311]' OR b.notes LIKE '[BTH26-XLSX OCT-311] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-22', '2026-10-23', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-312]', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-312]' OR notes LIKE '[BTH26-XLSX OCT-312] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-22 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-312]' OR b.notes LIKE '[BTH26-XLSX OCT-312] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-312-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-312]' OR b.notes LIKE '[BTH26-XLSX OCT-312] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-312-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-312]' OR b.notes LIKE '[BTH26-XLSX OCT-312] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 83, '2026-10-22', '2026-10-23', 1, 1700, 1700, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-313]', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-313]' OR notes LIKE '[BTH26-XLSX OCT-313] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 83, 1, 1700, '2026-10-22 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-313]' OR b.notes LIKE '[BTH26-XLSX OCT-313] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 83
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1700, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-313-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-313]' OR b.notes LIKE '[BTH26-XLSX OCT-313] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-313-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-313]' OR b.notes LIKE '[BTH26-XLSX OCT-313] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-22', '2026-10-23', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-314]', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-314]' OR notes LIKE '[BTH26-XLSX OCT-314] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-22 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-314]' OR b.notes LIKE '[BTH26-XLSX OCT-314] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-314-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-314]' OR b.notes LIKE '[BTH26-XLSX OCT-314] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-314-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-314]' OR b.notes LIKE '[BTH26-XLSX OCT-314] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-22', '2026-10-24', 2, 4000, 4000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-315]', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-315]' OR notes LIKE '[BTH26-XLSX OCT-315] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-22 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-315]' OR b.notes LIKE '[BTH26-XLSX OCT-315] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 4000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-315-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-315]' OR b.notes LIKE '[BTH26-XLSX OCT-315] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-315-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 4000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-315]' OR b.notes LIKE '[BTH26-XLSX OCT-315] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-22', '2026-10-23', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-316]', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-316]' OR notes LIKE '[BTH26-XLSX OCT-316] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-22 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-316]' OR b.notes LIKE '[BTH26-XLSX OCT-316] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-316-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-316]' OR b.notes LIKE '[BTH26-XLSX OCT-316] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-316-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-316]' OR b.notes LIKE '[BTH26-XLSX OCT-316] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 100, '2026-10-22', '2026-10-23', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-317]', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-317]' OR notes LIKE '[BTH26-XLSX OCT-317] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 100, 1, 1500, '2026-10-22 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-317]' OR b.notes LIKE '[BTH26-XLSX OCT-317] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 100
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-317-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-317]' OR b.notes LIKE '[BTH26-XLSX OCT-317] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-317-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-317]' OR b.notes LIKE '[BTH26-XLSX OCT-317] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 101, '2026-10-22', '2026-10-23', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-318]', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-318]' OR notes LIKE '[BTH26-XLSX OCT-318] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 101, 1, 2000, '2026-10-22 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-318]' OR b.notes LIKE '[BTH26-XLSX OCT-318] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 101
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-318-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-318]' OR b.notes LIKE '[BTH26-XLSX OCT-318] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-318-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-318]' OR b.notes LIKE '[BTH26-XLSX OCT-318] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 80, '2026-10-23', '2026-10-24', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-319]', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-319]' OR notes LIKE '[BTH26-XLSX OCT-319] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 80, 1, 1500, '2026-10-23 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-319]' OR b.notes LIKE '[BTH26-XLSX OCT-319] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 80
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-319-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-319]' OR b.notes LIKE '[BTH26-XLSX OCT-319] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-319-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-319]' OR b.notes LIKE '[BTH26-XLSX OCT-319] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-23', '2026-10-24', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-320]', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-320]' OR notes LIKE '[BTH26-XLSX OCT-320] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-23 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-320]' OR b.notes LIKE '[BTH26-XLSX OCT-320] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-320-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-320]' OR b.notes LIKE '[BTH26-XLSX OCT-320] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-320-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-320]' OR b.notes LIKE '[BTH26-XLSX OCT-320] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 83, '2026-10-23', '2026-10-24', 1, 500, 500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-321] | SHOWER', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-321]' OR notes LIKE '[BTH26-XLSX OCT-321] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 83, 1, 500, '2026-10-23 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-321]' OR b.notes LIKE '[BTH26-XLSX OCT-321] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 83
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-321-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-321]' OR b.notes LIKE '[BTH26-XLSX OCT-321] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-321-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-321]' OR b.notes LIKE '[BTH26-XLSX OCT-321] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 85, '2026-10-23', '2026-10-24', 1, 2500, 2500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-322]', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-322]' OR notes LIKE '[BTH26-XLSX OCT-322] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 85, 1, 2500, '2026-10-23 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-322]' OR b.notes LIKE '[BTH26-XLSX OCT-322] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 85
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-322-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-322]' OR b.notes LIKE '[BTH26-XLSX OCT-322] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-322-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-322]' OR b.notes LIKE '[BTH26-XLSX OCT-322] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 90, '2026-10-23', '2026-10-25', 2, 3400, 3400, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-323]', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-323]' OR notes LIKE '[BTH26-XLSX OCT-323] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 90, 1, 1700, '2026-10-23 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-323]' OR b.notes LIKE '[BTH26-XLSX OCT-323] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 90
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 3400, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-323-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-323]' OR b.notes LIKE '[BTH26-XLSX OCT-323] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-323-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 3400, 'Single Self-Contained (SSC)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-323]' OR b.notes LIKE '[BTH26-XLSX OCT-323] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-23', '2026-10-24', 1, 1700, 1700, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-324]', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-324]' OR notes LIKE '[BTH26-XLSX OCT-324] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1700, '2026-10-23 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-324]' OR b.notes LIKE '[BTH26-XLSX OCT-324] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1700, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-324-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-324]' OR b.notes LIKE '[BTH26-XLSX OCT-324] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-324-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-324]' OR b.notes LIKE '[BTH26-XLSX OCT-324] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 100, '2026-10-23', '2026-10-24', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-325]', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-325]' OR notes LIKE '[BTH26-XLSX OCT-325] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 100, 1, 1500, '2026-10-23 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-325]' OR b.notes LIKE '[BTH26-XLSX OCT-325] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 100
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-325-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-325]' OR b.notes LIKE '[BTH26-XLSX OCT-325] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-325-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-325]' OR b.notes LIKE '[BTH26-XLSX OCT-325] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 101, '2026-10-23', '2026-10-24', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-326]', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-326]' OR notes LIKE '[BTH26-XLSX OCT-326] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 101, 1, 2000, '2026-10-23 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-326]' OR b.notes LIKE '[BTH26-XLSX OCT-326] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 101
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-326-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-326]' OR b.notes LIKE '[BTH26-XLSX OCT-326] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-326-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-326]' OR b.notes LIKE '[BTH26-XLSX OCT-326] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 74, '2026-10-24', '2026-10-25', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-327]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-327]' OR notes LIKE '[BTH26-XLSX OCT-327] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 74, 1, 1500, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-327]' OR b.notes LIKE '[BTH26-XLSX OCT-327] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 74
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-327-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-327]' OR b.notes LIKE '[BTH26-XLSX OCT-327] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-327-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-327]' OR b.notes LIKE '[BTH26-XLSX OCT-327] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 76, '2026-10-24', '2026-10-25', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-328]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-328]' OR notes LIKE '[BTH26-XLSX OCT-328] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 76, 1, 2500, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-328]' OR b.notes LIKE '[BTH26-XLSX OCT-328] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 76
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-328-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-328]' OR b.notes LIKE '[BTH26-XLSX OCT-328] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-328-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-328]' OR b.notes LIKE '[BTH26-XLSX OCT-328] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 77, '2026-10-24', '2026-10-25', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-329]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-329]' OR notes LIKE '[BTH26-XLSX OCT-329] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 77, 1, 1000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-329]' OR b.notes LIKE '[BTH26-XLSX OCT-329] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 77
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-329-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-329]' OR b.notes LIKE '[BTH26-XLSX OCT-329] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-329-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-329]' OR b.notes LIKE '[BTH26-XLSX OCT-329] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Standard Room, Shared Bath (SRB)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 80, '2026-10-24', '2026-10-25', 1, 1000, 1000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-330]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-330]' OR notes LIKE '[BTH26-XLSX OCT-330] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 80, 1, 1000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-330]' OR b.notes LIKE '[BTH26-XLSX OCT-330] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 80
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-330-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-330]' OR b.notes LIKE '[BTH26-XLSX OCT-330] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-330-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-330]' OR b.notes LIKE '[BTH26-XLSX OCT-330] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-24', '2026-10-25', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-331]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-331]' OR notes LIKE '[BTH26-XLSX OCT-331] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-331]' OR b.notes LIKE '[BTH26-XLSX OCT-331] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-331-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-331]' OR b.notes LIKE '[BTH26-XLSX OCT-331] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-331-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-331]' OR b.notes LIKE '[BTH26-XLSX OCT-331] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 83, '2026-10-24', '2026-10-25', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-332]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-332]' OR notes LIKE '[BTH26-XLSX OCT-332] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 83, 1, 1000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-332]' OR b.notes LIKE '[BTH26-XLSX OCT-332] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 83
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-332-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-332]' OR b.notes LIKE '[BTH26-XLSX OCT-332] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-332-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-332]' OR b.notes LIKE '[BTH26-XLSX OCT-332] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-24', '2026-10-25', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-333]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-333]' OR notes LIKE '[BTH26-XLSX OCT-333] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-333]' OR b.notes LIKE '[BTH26-XLSX OCT-333] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-333-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-333]' OR b.notes LIKE '[BTH26-XLSX OCT-333] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-333-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-333]' OR b.notes LIKE '[BTH26-XLSX OCT-333] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 85, '2026-10-24', '2026-10-25', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-334]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-334]' OR notes LIKE '[BTH26-XLSX OCT-334] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 85, 1, 2500, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-334]' OR b.notes LIKE '[BTH26-XLSX OCT-334] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 85
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-334-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-334]' OR b.notes LIKE '[BTH26-XLSX OCT-334] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-334-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-334]' OR b.notes LIKE '[BTH26-XLSX OCT-334] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 86, '2026-10-24', '2026-10-25', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-335]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-335]' OR notes LIKE '[BTH26-XLSX OCT-335] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 86, 1, 1000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-335]' OR b.notes LIKE '[BTH26-XLSX OCT-335] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 86
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-335-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-335]' OR b.notes LIKE '[BTH26-XLSX OCT-335] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-335-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-335]' OR b.notes LIKE '[BTH26-XLSX OCT-335] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Standard Room, Shared Bath (SRB)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-24', '2026-10-25', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-336]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-336]' OR notes LIKE '[BTH26-XLSX OCT-336] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-336]' OR b.notes LIKE '[BTH26-XLSX OCT-336] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-336-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-336]' OR b.notes LIKE '[BTH26-XLSX OCT-336] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-336-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-336]' OR b.notes LIKE '[BTH26-XLSX OCT-336] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-24', '2026-10-25', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-337]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-337]' OR notes LIKE '[BTH26-XLSX OCT-337] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-337]' OR b.notes LIKE '[BTH26-XLSX OCT-337] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-337-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-337]' OR b.notes LIKE '[BTH26-XLSX OCT-337] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-337-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-337]' OR b.notes LIKE '[BTH26-XLSX OCT-337] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 94, '2026-10-24', '2026-10-25', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-338]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-338]' OR notes LIKE '[BTH26-XLSX OCT-338] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 94, 1, 2000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-338]' OR b.notes LIKE '[BTH26-XLSX OCT-338] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 94
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-338-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-338]' OR b.notes LIKE '[BTH26-XLSX OCT-338] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-338-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-338]' OR b.notes LIKE '[BTH26-XLSX OCT-338] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 96, '2026-10-24', '2026-10-25', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-339]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-339]' OR notes LIKE '[BTH26-XLSX OCT-339] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 96, 1, 1000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-339]' OR b.notes LIKE '[BTH26-XLSX OCT-339] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 96
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-339-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-339]' OR b.notes LIKE '[BTH26-XLSX OCT-339] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-339-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-339]' OR b.notes LIKE '[BTH26-XLSX OCT-339] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Standard Room, Shared Bath (SRB)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 95, '2026-10-24', '2026-10-25', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-340]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-340]' OR notes LIKE '[BTH26-XLSX OCT-340] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 95, 1, 2500, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-340]' OR b.notes LIKE '[BTH26-XLSX OCT-340] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 95
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-340-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-340]' OR b.notes LIKE '[BTH26-XLSX OCT-340] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-340-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-340]' OR b.notes LIKE '[BTH26-XLSX OCT-340] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 101, '2026-10-24', '2026-10-25', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-341]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-341]' OR notes LIKE '[BTH26-XLSX OCT-341] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 101, 1, 2000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-341]' OR b.notes LIKE '[BTH26-XLSX OCT-341] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 101
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-341-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-341]' OR b.notes LIKE '[BTH26-XLSX OCT-341] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-341-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-341]' OR b.notes LIKE '[BTH26-XLSX OCT-341] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 102, '2026-10-24', '2026-10-25', 1, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-342]', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-342]' OR notes LIKE '[BTH26-XLSX OCT-342] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 102, 1, 3000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-342]' OR b.notes LIKE '[BTH26-XLSX OCT-342] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 102
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-342-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-342]' OR b.notes LIKE '[BTH26-XLSX OCT-342] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-342-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-342]' OR b.notes LIKE '[BTH26-XLSX OCT-342] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Executive / Special (S.P)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 74, '2026-10-25', '2026-10-26', 1, 1700, 1700, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-343]', '2026-10-25 11:00:00', '2026-10-25 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-343]' OR notes LIKE '[BTH26-XLSX OCT-343] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 74, 1, 1700, '2026-10-25 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-343]' OR b.notes LIKE '[BTH26-XLSX OCT-343] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 74
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1700, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-343-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-343]' OR b.notes LIKE '[BTH26-XLSX OCT-343] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-343-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-343]' OR b.notes LIKE '[BTH26-XLSX OCT-343] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 80, '2026-10-25', '2026-10-26', 1, 1700, 1700, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-344]', '2026-10-25 11:00:00', '2026-10-25 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-344]' OR notes LIKE '[BTH26-XLSX OCT-344] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 80, 1, 1700, '2026-10-25 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-344]' OR b.notes LIKE '[BTH26-XLSX OCT-344] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 80
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-344-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-344]' OR b.notes LIKE '[BTH26-XLSX OCT-344] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-344-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-344]' OR b.notes LIKE '[BTH26-XLSX OCT-344] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-25', '2026-10-26', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-345]', '2026-10-25 11:00:00', '2026-10-25 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-345]' OR notes LIKE '[BTH26-XLSX OCT-345] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-25 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-345]' OR b.notes LIKE '[BTH26-XLSX OCT-345] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-345-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-345]' OR b.notes LIKE '[BTH26-XLSX OCT-345] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-345-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-345]' OR b.notes LIKE '[BTH26-XLSX OCT-345] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-25', '2026-10-26', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-346]', '2026-10-25 11:00:00', '2026-10-25 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-346]' OR notes LIKE '[BTH26-XLSX OCT-346] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-25 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-346]' OR b.notes LIKE '[BTH26-XLSX OCT-346] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-346-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-346]' OR b.notes LIKE '[BTH26-XLSX OCT-346] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-346-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-346]' OR b.notes LIKE '[BTH26-XLSX OCT-346] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-25', '2026-10-26', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-347]', '2026-10-25 11:00:00', '2026-10-25 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-347]' OR notes LIKE '[BTH26-XLSX OCT-347] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-25 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-347]' OR b.notes LIKE '[BTH26-XLSX OCT-347] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-347-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-347]' OR b.notes LIKE '[BTH26-XLSX OCT-347] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-347-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-347]' OR b.notes LIKE '[BTH26-XLSX OCT-347] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-25', '2026-10-26', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-348]', '2026-10-25 11:00:00', '2026-10-25 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-348]' OR notes LIKE '[BTH26-XLSX OCT-348] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-25 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-348]' OR b.notes LIKE '[BTH26-XLSX OCT-348] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-348-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-348]' OR b.notes LIKE '[BTH26-XLSX OCT-348] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-348-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-348]' OR b.notes LIKE '[BTH26-XLSX OCT-348] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 74, '2026-10-26', '2026-10-27', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-349]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-349]' OR notes LIKE '[BTH26-XLSX OCT-349] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 74, 1, 1000, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-349]' OR b.notes LIKE '[BTH26-XLSX OCT-349] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 74
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-349-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-349]' OR b.notes LIKE '[BTH26-XLSX OCT-349] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-349-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-349]' OR b.notes LIKE '[BTH26-XLSX OCT-349] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 77, '2026-10-26', '2026-10-27', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-350]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-350]' OR notes LIKE '[BTH26-XLSX OCT-350] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 77, 1, 1000, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-350]' OR b.notes LIKE '[BTH26-XLSX OCT-350] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 77
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-350-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-350]' OR b.notes LIKE '[BTH26-XLSX OCT-350] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-350-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-350]' OR b.notes LIKE '[BTH26-XLSX OCT-350] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Standard Room, Shared Bath (SRB)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 78, '2026-10-26', '2026-10-27', 1, 800, 800, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-351]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-351]' OR notes LIKE '[BTH26-XLSX OCT-351] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 78, 1, 800, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-351]' OR b.notes LIKE '[BTH26-XLSX OCT-351] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 78
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 800, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-351-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-351]' OR b.notes LIKE '[BTH26-XLSX OCT-351] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-351-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 800, 'Bunk Room (BUNKED)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-351]' OR b.notes LIKE '[BTH26-XLSX OCT-351] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Bunk Room (BUNKED)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 80, '2026-10-26', '2026-10-27', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-352]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-352]' OR notes LIKE '[BTH26-XLSX OCT-352] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 80, 1, 1500, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-352]' OR b.notes LIKE '[BTH26-XLSX OCT-352] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 80
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-352-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-352]' OR b.notes LIKE '[BTH26-XLSX OCT-352] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-352-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-352]' OR b.notes LIKE '[BTH26-XLSX OCT-352] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-26', '2026-10-27', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-353]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-353]' OR notes LIKE '[BTH26-XLSX OCT-353] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-353]' OR b.notes LIKE '[BTH26-XLSX OCT-353] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-353-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-353]' OR b.notes LIKE '[BTH26-XLSX OCT-353] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-353-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-353]' OR b.notes LIKE '[BTH26-XLSX OCT-353] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-26', '2026-10-27', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-354]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-354]' OR notes LIKE '[BTH26-XLSX OCT-354] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-354]' OR b.notes LIKE '[BTH26-XLSX OCT-354] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-354-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-354]' OR b.notes LIKE '[BTH26-XLSX OCT-354] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-354-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-354]' OR b.notes LIKE '[BTH26-XLSX OCT-354] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 90, '2026-10-26', '2026-10-30', 4, 4000, 4000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-355]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-355]' OR notes LIKE '[BTH26-XLSX OCT-355] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 90, 1, 1000, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-355]' OR b.notes LIKE '[BTH26-XLSX OCT-355] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 90
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 4000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-355-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-355]' OR b.notes LIKE '[BTH26-XLSX OCT-355] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-355-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 4000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-355]' OR b.notes LIKE '[BTH26-XLSX OCT-355] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-26', '2026-10-27', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-356]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-356]' OR notes LIKE '[BTH26-XLSX OCT-356] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-356]' OR b.notes LIKE '[BTH26-XLSX OCT-356] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-356-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-356]' OR b.notes LIKE '[BTH26-XLSX OCT-356] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-356-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-356]' OR b.notes LIKE '[BTH26-XLSX OCT-356] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-26', '2026-10-27', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-357]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-357]' OR notes LIKE '[BTH26-XLSX OCT-357] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-357]' OR b.notes LIKE '[BTH26-XLSX OCT-357] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-357-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-357]' OR b.notes LIKE '[BTH26-XLSX OCT-357] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-357-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-357]' OR b.notes LIKE '[BTH26-XLSX OCT-357] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 94, '2026-10-26', '2026-10-27', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-358]', '2026-10-26 11:00:00', '2026-10-26 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-358]' OR notes LIKE '[BTH26-XLSX OCT-358] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 94, 1, 2000, '2026-10-26 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-358]' OR b.notes LIKE '[BTH26-XLSX OCT-358] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 94
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-358-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-358]' OR b.notes LIKE '[BTH26-XLSX OCT-358] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-358-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-358]' OR b.notes LIKE '[BTH26-XLSX OCT-358] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 74, '2026-10-27', '2026-10-28', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-359]', '2026-10-27 11:00:00', '2026-10-27 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-359]' OR notes LIKE '[BTH26-XLSX OCT-359] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 74, 1, 1000, '2026-10-27 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-359]' OR b.notes LIKE '[BTH26-XLSX OCT-359] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 74
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-359-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-359]' OR b.notes LIKE '[BTH26-XLSX OCT-359] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-359-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-359]' OR b.notes LIKE '[BTH26-XLSX OCT-359] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-27', '2026-10-28', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-360]', '2026-10-27 11:00:00', '2026-10-27 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-360]' OR notes LIKE '[BTH26-XLSX OCT-360] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-27 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-360]' OR b.notes LIKE '[BTH26-XLSX OCT-360] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-360-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-360]' OR b.notes LIKE '[BTH26-XLSX OCT-360] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-360-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-360]' OR b.notes LIKE '[BTH26-XLSX OCT-360] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-27', '2026-10-28', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-361]', '2026-10-27 11:00:00', '2026-10-27 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-361]' OR notes LIKE '[BTH26-XLSX OCT-361] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-27 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-361]' OR b.notes LIKE '[BTH26-XLSX OCT-361] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-361-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-361]' OR b.notes LIKE '[BTH26-XLSX OCT-361] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-361-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-361]' OR b.notes LIKE '[BTH26-XLSX OCT-361] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-27', '2026-10-28', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-362]', '2026-10-27 11:00:00', '2026-10-27 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-362]' OR notes LIKE '[BTH26-XLSX OCT-362] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-27 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-362]' OR b.notes LIKE '[BTH26-XLSX OCT-362] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-362-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-362]' OR b.notes LIKE '[BTH26-XLSX OCT-362] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-362-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-362]' OR b.notes LIKE '[BTH26-XLSX OCT-362] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-27', '2026-10-28', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-363]', '2026-10-27 11:00:00', '2026-10-27 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-363]' OR notes LIKE '[BTH26-XLSX OCT-363] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-27 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-363]' OR b.notes LIKE '[BTH26-XLSX OCT-363] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-363-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-363]' OR b.notes LIKE '[BTH26-XLSX OCT-363] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-363-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-363]' OR b.notes LIKE '[BTH26-XLSX OCT-363] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 94, '2026-10-27', '2026-10-28', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-364]', '2026-10-27 11:00:00', '2026-10-27 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-364]' OR notes LIKE '[BTH26-XLSX OCT-364] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 94, 1, 2000, '2026-10-27 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-364]' OR b.notes LIKE '[BTH26-XLSX OCT-364] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 94
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-364-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-364]' OR b.notes LIKE '[BTH26-XLSX OCT-364] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-364-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-364]' OR b.notes LIKE '[BTH26-XLSX OCT-364] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 100, '2026-10-27', '2026-10-28', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-365]', '2026-10-27 11:00:00', '2026-10-27 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-365]' OR notes LIKE '[BTH26-XLSX OCT-365] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 100, 1, 1000, '2026-10-27 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-365]' OR b.notes LIKE '[BTH26-XLSX OCT-365] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 100
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-365-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-365]' OR b.notes LIKE '[BTH26-XLSX OCT-365] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-365-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-365]' OR b.notes LIKE '[BTH26-XLSX OCT-365] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 74, '2026-10-28', '2026-10-29', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-366]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-366]' OR notes LIKE '[BTH26-XLSX OCT-366] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 74, 1, 1000, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-366]' OR b.notes LIKE '[BTH26-XLSX OCT-366] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 74
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-366-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-366]' OR b.notes LIKE '[BTH26-XLSX OCT-366] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-366-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-366]' OR b.notes LIKE '[BTH26-XLSX OCT-366] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 76, '2026-10-28', '2026-10-29', 1, 2300, 2300, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-367]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-367]' OR notes LIKE '[BTH26-XLSX OCT-367] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 76, 1, 2300, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-367]' OR b.notes LIKE '[BTH26-XLSX OCT-367] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 76
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2300, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-367-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-367]' OR b.notes LIKE '[BTH26-XLSX OCT-367] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-367-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2300, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-367]' OR b.notes LIKE '[BTH26-XLSX OCT-367] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 80, '2026-10-28', '2026-10-29', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-368]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-368]' OR notes LIKE '[BTH26-XLSX OCT-368] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 80, 1, 1500, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-368]' OR b.notes LIKE '[BTH26-XLSX OCT-368] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 80
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-368-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-368]' OR b.notes LIKE '[BTH26-XLSX OCT-368] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-368-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-368]' OR b.notes LIKE '[BTH26-XLSX OCT-368] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 82, '2026-10-28', '2026-10-29', 1, 2800, 2800, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-369]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-369]' OR notes LIKE '[BTH26-XLSX OCT-369] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 82, 1, 2800, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-369]' OR b.notes LIKE '[BTH26-XLSX OCT-369] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 82
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2800, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-369-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-369]' OR b.notes LIKE '[BTH26-XLSX OCT-369] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-369-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2800, 'Executive / Special (S.P)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-369]' OR b.notes LIKE '[BTH26-XLSX OCT-369] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Executive / Special (S.P)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 83, '2026-10-28', '2026-10-29', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-370]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-370]' OR notes LIKE '[BTH26-XLSX OCT-370] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 83, 1, 1500, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-370]' OR b.notes LIKE '[BTH26-XLSX OCT-370] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 83
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-370-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-370]' OR b.notes LIKE '[BTH26-XLSX OCT-370] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-370-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-370]' OR b.notes LIKE '[BTH26-XLSX OCT-370] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-28', '2026-10-29', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-371]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-371]' OR notes LIKE '[BTH26-XLSX OCT-371] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-371]' OR b.notes LIKE '[BTH26-XLSX OCT-371] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-371-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-371]' OR b.notes LIKE '[BTH26-XLSX OCT-371] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-371-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-371]' OR b.notes LIKE '[BTH26-XLSX OCT-371] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 85, '2026-10-28', '2026-10-30', 2, 4600, 4600, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-372]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-372]' OR notes LIKE '[BTH26-XLSX OCT-372] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 85, 1, 2300, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-372]' OR b.notes LIKE '[BTH26-XLSX OCT-372] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 85
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 4600, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-372-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-372]' OR b.notes LIKE '[BTH26-XLSX OCT-372] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-372-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 4600, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-372]' OR b.notes LIKE '[BTH26-XLSX OCT-372] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-28', '2026-10-29', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-373]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-373]' OR notes LIKE '[BTH26-XLSX OCT-373] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-373]' OR b.notes LIKE '[BTH26-XLSX OCT-373] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-373-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-373]' OR b.notes LIKE '[BTH26-XLSX OCT-373] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-373-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-373]' OR b.notes LIKE '[BTH26-XLSX OCT-373] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 92, '2026-10-28', '2026-10-29', 1, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-374]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-374]' OR notes LIKE '[BTH26-XLSX OCT-374] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 92, 1, 3000, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-374]' OR b.notes LIKE '[BTH26-XLSX OCT-374] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 92
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-374-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-374]' OR b.notes LIKE '[BTH26-XLSX OCT-374] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-374-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-374]' OR b.notes LIKE '[BTH26-XLSX OCT-374] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Executive / Special (S.P)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-28', '2026-10-29', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-375]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-375]' OR notes LIKE '[BTH26-XLSX OCT-375] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-375]' OR b.notes LIKE '[BTH26-XLSX OCT-375] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-375-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-375]' OR b.notes LIKE '[BTH26-XLSX OCT-375] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-375-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-375]' OR b.notes LIKE '[BTH26-XLSX OCT-375] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 95, '2026-10-28', '2026-10-29', 1, 2300, 2300, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-376]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-376]' OR notes LIKE '[BTH26-XLSX OCT-376] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 95, 1, 2300, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-376]' OR b.notes LIKE '[BTH26-XLSX OCT-376] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 95
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2300, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-376-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-376]' OR b.notes LIKE '[BTH26-XLSX OCT-376] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-376-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2300, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-376]' OR b.notes LIKE '[BTH26-XLSX OCT-376] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 101, '2026-10-28', '2026-10-29', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-377]', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-377]' OR notes LIKE '[BTH26-XLSX OCT-377] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 101, 1, 2000, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-377]' OR b.notes LIKE '[BTH26-XLSX OCT-377] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 101
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-377-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-377]' OR b.notes LIKE '[BTH26-XLSX OCT-377] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-377-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-377]' OR b.notes LIKE '[BTH26-XLSX OCT-377] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 74, '2026-10-29', '2026-10-30', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-378]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-378]' OR notes LIKE '[BTH26-XLSX OCT-378] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 74, 1, 1000, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-378]' OR b.notes LIKE '[BTH26-XLSX OCT-378] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 74
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-378-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-378]' OR b.notes LIKE '[BTH26-XLSX OCT-378] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-378-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-378]' OR b.notes LIKE '[BTH26-XLSX OCT-378] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 78, '2026-10-29', '2026-10-30', 1, 650, 650, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-379]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-379]' OR notes LIKE '[BTH26-XLSX OCT-379] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 78, 1, 650, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-379]' OR b.notes LIKE '[BTH26-XLSX OCT-379] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 78
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-379-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-379]' OR b.notes LIKE '[BTH26-XLSX OCT-379] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-379-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 650, 'Bunk Room (BUNKED)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-379]' OR b.notes LIKE '[BTH26-XLSX OCT-379] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Bunk Room (BUNKED)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-29', '2026-10-30', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-380]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-380]' OR notes LIKE '[BTH26-XLSX OCT-380] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-380]' OR b.notes LIKE '[BTH26-XLSX OCT-380] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-380-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-380]' OR b.notes LIKE '[BTH26-XLSX OCT-380] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-380-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-380]' OR b.notes LIKE '[BTH26-XLSX OCT-380] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 82, '2026-10-29', '2026-10-30', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-381]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-381]' OR notes LIKE '[BTH26-XLSX OCT-381] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 82, 1, 2500, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-381]' OR b.notes LIKE '[BTH26-XLSX OCT-381] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 82
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-381-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-381]' OR b.notes LIKE '[BTH26-XLSX OCT-381] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-381-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Executive / Special (S.P)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-381]' OR b.notes LIKE '[BTH26-XLSX OCT-381] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Executive / Special (S.P)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 83, '2026-10-29', '2026-10-30', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-382]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-382]' OR notes LIKE '[BTH26-XLSX OCT-382] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 83, 1, 1500, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-382]' OR b.notes LIKE '[BTH26-XLSX OCT-382] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 83
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-382-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-382]' OR b.notes LIKE '[BTH26-XLSX OCT-382] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-382-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-382]' OR b.notes LIKE '[BTH26-XLSX OCT-382] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-29', '2026-10-30', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-383]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-383]' OR notes LIKE '[BTH26-XLSX OCT-383] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-383]' OR b.notes LIKE '[BTH26-XLSX OCT-383] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-383-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-383]' OR b.notes LIKE '[BTH26-XLSX OCT-383] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-383-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-383]' OR b.notes LIKE '[BTH26-XLSX OCT-383] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-29', '2026-10-30', 1, 2000, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-384]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-384]' OR notes LIKE '[BTH26-XLSX OCT-384] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-384]' OR b.notes LIKE '[BTH26-XLSX OCT-384] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 92, '2026-10-29', '2026-10-30', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-385]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-385]' OR notes LIKE '[BTH26-XLSX OCT-385] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 92, 1, 2500, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-385]' OR b.notes LIKE '[BTH26-XLSX OCT-385] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 92
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-385-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-385]' OR b.notes LIKE '[BTH26-XLSX OCT-385] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-385-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Executive / Special (S.P)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-385]' OR b.notes LIKE '[BTH26-XLSX OCT-385] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Executive / Special (S.P)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-29', '2026-10-30', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-386]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-386]' OR notes LIKE '[BTH26-XLSX OCT-386] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-386]' OR b.notes LIKE '[BTH26-XLSX OCT-386] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-386-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-386]' OR b.notes LIKE '[BTH26-XLSX OCT-386] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-386-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-386]' OR b.notes LIKE '[BTH26-XLSX OCT-386] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 94, '2026-10-29', '2026-10-30', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-387]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-387]' OR notes LIKE '[BTH26-XLSX OCT-387] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 94, 1, 2000, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-387]' OR b.notes LIKE '[BTH26-XLSX OCT-387] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 94
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-387-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-387]' OR b.notes LIKE '[BTH26-XLSX OCT-387] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-387-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-387]' OR b.notes LIKE '[BTH26-XLSX OCT-387] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 95, '2026-10-29', '2026-10-30', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-388]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-388]' OR notes LIKE '[BTH26-XLSX OCT-388] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 95, 1, 2500, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-388]' OR b.notes LIKE '[BTH26-XLSX OCT-388] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 95
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-388-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-388]' OR b.notes LIKE '[BTH26-XLSX OCT-388] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-388-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-388]' OR b.notes LIKE '[BTH26-XLSX OCT-388] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 100, '2026-10-29', '2026-10-30', 1, 1700, 1700, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-389]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-389]' OR notes LIKE '[BTH26-XLSX OCT-389] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 100, 1, 1700, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-389]' OR b.notes LIKE '[BTH26-XLSX OCT-389] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 100
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-389-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-389]' OR b.notes LIKE '[BTH26-XLSX OCT-389] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-389-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-389]' OR b.notes LIKE '[BTH26-XLSX OCT-389] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 101, '2026-10-29', '2026-10-30', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-390]', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-390]' OR notes LIKE '[BTH26-XLSX OCT-390] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 101, 1, 2000, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-390]' OR b.notes LIKE '[BTH26-XLSX OCT-390] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 101
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-390-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-390]' OR b.notes LIKE '[BTH26-XLSX OCT-390] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-390-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-390]' OR b.notes LIKE '[BTH26-XLSX OCT-390] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 74, '2026-10-30', '2026-10-31', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-391]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-391]' OR notes LIKE '[BTH26-XLSX OCT-391] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 74, 1, 1500, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-391]' OR b.notes LIKE '[BTH26-XLSX OCT-391] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 74
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-391-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-391]' OR b.notes LIKE '[BTH26-XLSX OCT-391] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-391-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-391]' OR b.notes LIKE '[BTH26-XLSX OCT-391] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 78, '2026-10-30', '2026-10-31', 1, 800, 800, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-392]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-392]' OR notes LIKE '[BTH26-XLSX OCT-392] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 78, 1, 800, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-392]' OR b.notes LIKE '[BTH26-XLSX OCT-392] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 78
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 800, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-392-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-392]' OR b.notes LIKE '[BTH26-XLSX OCT-392] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-392-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 800, 'Bunk Room (BUNKED)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-392]' OR b.notes LIKE '[BTH26-XLSX OCT-392] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Bunk Room (BUNKED)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-30', '2026-10-31', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-393]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-393]' OR notes LIKE '[BTH26-XLSX OCT-393] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-393]' OR b.notes LIKE '[BTH26-XLSX OCT-393] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-393-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-393]' OR b.notes LIKE '[BTH26-XLSX OCT-393] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-393-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-393]' OR b.notes LIKE '[BTH26-XLSX OCT-393] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 83, '2026-10-30', '2026-11-01', 2, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-394]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-394]' OR notes LIKE '[BTH26-XLSX OCT-394] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 83, 1, 1250, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-394]' OR b.notes LIKE '[BTH26-XLSX OCT-394] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 83
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-394-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-394]' OR b.notes LIKE '[BTH26-XLSX OCT-394] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-394-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-394]' OR b.notes LIKE '[BTH26-XLSX OCT-394] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-30', '2026-10-31', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-395]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-395]' OR notes LIKE '[BTH26-XLSX OCT-395] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-395]' OR b.notes LIKE '[BTH26-XLSX OCT-395] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-395-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-395]' OR b.notes LIKE '[BTH26-XLSX OCT-395] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-395-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-395]' OR b.notes LIKE '[BTH26-XLSX OCT-395] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 85, '2026-10-30', '2026-10-31', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-396]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-396]' OR notes LIKE '[BTH26-XLSX OCT-396] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 85, 1, 2500, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-396]' OR b.notes LIKE '[BTH26-XLSX OCT-396] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 85
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-396-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-396]' OR b.notes LIKE '[BTH26-XLSX OCT-396] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-396-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-396]' OR b.notes LIKE '[BTH26-XLSX OCT-396] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 90, '2026-10-30', '2026-10-31', 1, 500, 500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-397] | SHOWER', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-397]' OR notes LIKE '[BTH26-XLSX OCT-397] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 90, 1, 500, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-397]' OR b.notes LIKE '[BTH26-XLSX OCT-397] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 90
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-397-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-397]' OR b.notes LIKE '[BTH26-XLSX OCT-397] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-397-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-397]' OR b.notes LIKE '[BTH26-XLSX OCT-397] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-30', '2026-10-31', 1, 2000, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-398]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-398]' OR notes LIKE '[BTH26-XLSX OCT-398] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-398]' OR b.notes LIKE '[BTH26-XLSX OCT-398] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-30', '2026-10-31', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-399]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-399]' OR notes LIKE '[BTH26-XLSX OCT-399] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-399]' OR b.notes LIKE '[BTH26-XLSX OCT-399] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-399-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-399]' OR b.notes LIKE '[BTH26-XLSX OCT-399] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-399-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-399]' OR b.notes LIKE '[BTH26-XLSX OCT-399] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 94, '2026-10-30', '2026-10-31', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-400]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-400]' OR notes LIKE '[BTH26-XLSX OCT-400] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 94, 1, 2000, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-400]' OR b.notes LIKE '[BTH26-XLSX OCT-400] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 94
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-400-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-400]' OR b.notes LIKE '[BTH26-XLSX OCT-400] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-400-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-400]' OR b.notes LIKE '[BTH26-XLSX OCT-400] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 101, '2026-10-30', '2026-10-31', 1, 1800, 1800, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-401]', '2026-10-30 11:00:00', '2026-10-30 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-401]' OR notes LIKE '[BTH26-XLSX OCT-401] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 101, 1, 1800, '2026-10-30 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-401]' OR b.notes LIKE '[BTH26-XLSX OCT-401] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 101
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1800, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-401-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-401]' OR b.notes LIKE '[BTH26-XLSX OCT-401] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-401-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1800, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-401]' OR b.notes LIKE '[BTH26-XLSX OCT-401] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 74, '2026-10-31', '2026-11-01', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-402]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-402]' OR notes LIKE '[BTH26-XLSX OCT-402] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 74, 1, 1500, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-402]' OR b.notes LIKE '[BTH26-XLSX OCT-402] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 74
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-402-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-402]' OR b.notes LIKE '[BTH26-XLSX OCT-402] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-402-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-402]' OR b.notes LIKE '[BTH26-XLSX OCT-402] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 75, '2026-10-31', '2026-11-01', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-403]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-403]' OR notes LIKE '[BTH26-XLSX OCT-403] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 75, 1, 2000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-403]' OR b.notes LIKE '[BTH26-XLSX OCT-403] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 75
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-403-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-403]' OR b.notes LIKE '[BTH26-XLSX OCT-403] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-403-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-403]' OR b.notes LIKE '[BTH26-XLSX OCT-403] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 76, '2026-10-31', '2026-11-01', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-404]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-404]' OR notes LIKE '[BTH26-XLSX OCT-404] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 76, 1, 2500, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-404]' OR b.notes LIKE '[BTH26-XLSX OCT-404] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 76
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-404-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-404]' OR b.notes LIKE '[BTH26-XLSX OCT-404] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-404-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-404]' OR b.notes LIKE '[BTH26-XLSX OCT-404] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 77, '2026-10-31', '2026-11-01', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-405]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-405]' OR notes LIKE '[BTH26-XLSX OCT-405] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 77, 1, 1000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-405]' OR b.notes LIKE '[BTH26-XLSX OCT-405] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 77
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-405-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-405]' OR b.notes LIKE '[BTH26-XLSX OCT-405] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-405-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-405]' OR b.notes LIKE '[BTH26-XLSX OCT-405] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Standard Room, Shared Bath (SRB)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 79, '2026-10-31', '2026-11-01', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-406]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-406]' OR notes LIKE '[BTH26-XLSX OCT-406] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 79, 1, 1000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-406]' OR b.notes LIKE '[BTH26-XLSX OCT-406] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 79
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-406-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-406]' OR b.notes LIKE '[BTH26-XLSX OCT-406] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-406-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-406]' OR b.notes LIKE '[BTH26-XLSX OCT-406] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Standard Room, Shared Bath (SRB)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 80, '2026-10-31', '2026-11-05', 5, 5000, 5000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-407]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-407]' OR notes LIKE '[BTH26-XLSX OCT-407] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 80, 1, 1000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-407]' OR b.notes LIKE '[BTH26-XLSX OCT-407] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 80
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 5000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-407-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-407]' OR b.notes LIKE '[BTH26-XLSX OCT-407] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-407-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 5000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-407]' OR b.notes LIKE '[BTH26-XLSX OCT-407] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 81, '2026-10-31', '2026-11-01', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-408]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-408]' OR notes LIKE '[BTH26-XLSX OCT-408] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 81, 1, 2000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-408]' OR b.notes LIKE '[BTH26-XLSX OCT-408] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 81
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-408-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-408]' OR b.notes LIKE '[BTH26-XLSX OCT-408] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-408-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-408]' OR b.notes LIKE '[BTH26-XLSX OCT-408] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 82, '2026-10-31', '2026-11-01', 1, 3000, 3000, 'cash+m-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-409]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-409]' OR notes LIKE '[BTH26-XLSX OCT-409] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 82, 1, 3000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-409]' OR b.notes LIKE '[BTH26-XLSX OCT-409] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 82
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1850, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-409-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-409]' OR b.notes LIKE '[BTH26-XLSX OCT-409] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-409-cash'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1150, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-409-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-409]' OR b.notes LIKE '[BTH26-XLSX OCT-409] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-409-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-409]' OR b.notes LIKE '[BTH26-XLSX OCT-409] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Executive / Special (S.P)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 84, '2026-10-31', '2026-11-01', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-410]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-410]' OR notes LIKE '[BTH26-XLSX OCT-410] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 84, 1, 2000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-410]' OR b.notes LIKE '[BTH26-XLSX OCT-410] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 84
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-410-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-410]' OR b.notes LIKE '[BTH26-XLSX OCT-410] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-410-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-410]' OR b.notes LIKE '[BTH26-XLSX OCT-410] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 85, '2026-10-31', '2026-11-01', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-411]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-411]' OR notes LIKE '[BTH26-XLSX OCT-411] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 85, 1, 2500, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-411]' OR b.notes LIKE '[BTH26-XLSX OCT-411] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 85
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-411-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-411]' OR b.notes LIKE '[BTH26-XLSX OCT-411] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-411-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-411]' OR b.notes LIKE '[BTH26-XLSX OCT-411] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 86, '2026-10-31', '2026-11-01', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-412]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-412]' OR notes LIKE '[BTH26-XLSX OCT-412] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 86, 1, 1000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-412]' OR b.notes LIKE '[BTH26-XLSX OCT-412] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 86
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-412-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-412]' OR b.notes LIKE '[BTH26-XLSX OCT-412] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-412-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-412]' OR b.notes LIKE '[BTH26-XLSX OCT-412] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Standard Room, Shared Bath (SRB)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 90, '2026-10-31', '2026-11-01', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-413]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-413]' OR notes LIKE '[BTH26-XLSX OCT-413] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 90, 1, 1000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-413]' OR b.notes LIKE '[BTH26-XLSX OCT-413] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 90
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-413-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-413]' OR b.notes LIKE '[BTH26-XLSX OCT-413] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-413-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-413]' OR b.notes LIKE '[BTH26-XLSX OCT-413] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 91, '2026-10-31', '2026-11-01', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-414]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-414]' OR notes LIKE '[BTH26-XLSX OCT-414] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 91, 1, 2000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-414]' OR b.notes LIKE '[BTH26-XLSX OCT-414] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 91
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-414-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-414]' OR b.notes LIKE '[BTH26-XLSX OCT-414] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-414-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-414]' OR b.notes LIKE '[BTH26-XLSX OCT-414] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 93, '2026-10-31', '2026-11-01', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-415]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-415]' OR notes LIKE '[BTH26-XLSX OCT-415] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 93, 1, 1500, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-415]' OR b.notes LIKE '[BTH26-XLSX OCT-415] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 93
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-415-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-415]' OR b.notes LIKE '[BTH26-XLSX OCT-415] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-415-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-415]' OR b.notes LIKE '[BTH26-XLSX OCT-415] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 94, '2026-10-31', '2026-11-01', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-416]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-416]' OR notes LIKE '[BTH26-XLSX OCT-416] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 94, 1, 2000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-416]' OR b.notes LIKE '[BTH26-XLSX OCT-416] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 94
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-416-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-416]' OR b.notes LIKE '[BTH26-XLSX OCT-416] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-416-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-416]' OR b.notes LIKE '[BTH26-XLSX OCT-416] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 95, '2026-10-31', '2026-11-01', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-417]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-417]' OR notes LIKE '[BTH26-XLSX OCT-417] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 95, 1, 2500, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-417]' OR b.notes LIKE '[BTH26-XLSX OCT-417] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 95
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'm-pesa', 'bth26-hotel-xlsx-OCT-417-mpesa'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-417]' OR b.notes LIKE '[BTH26-XLSX OCT-417] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-417-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-417]' OR b.notes LIKE '[BTH26-XLSX OCT-417] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Deluxe Double Ensuite (DEL)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 100, '2026-10-31', '2026-11-01', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-418]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-418]' OR notes LIKE '[BTH26-XLSX OCT-418] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 100, 1, 1500, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-418]' OR b.notes LIKE '[BTH26-XLSX OCT-418] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 100
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-418-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-418]' OR b.notes LIKE '[BTH26-XLSX OCT-418] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-418-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-418]' OR b.notes LIKE '[BTH26-XLSX OCT-418] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Single Self-Contained (SSC)'
  );
INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'bth', 101, '2026-10-31', '2026-11-01', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-419]', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_bookings
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-XLSX OCT-419]' OR notes LIKE '[BTH26-XLSX OCT-419] |%')
);
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 101, 1, 2000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-419]' OR b.notes LIKE '[BTH26-XLSX OCT-419] |%')
  AND NOT EXISTS (
    SELECT 1 FROM hotel_booking_rooms r
    WHERE r.hotel_booking_id = b.id AND r.room_id = 101
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id, 'cash', 'bth26-hotel-xlsx-OCT-419-cash'
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-419]' OR b.notes LIKE '[BTH26-XLSX OCT-419] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-hotel-xlsx-OCT-419-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'hotel', b.id
FROM hotel_bookings b
WHERE b.company_id = 'bth'
  AND (b.notes = '[BTH26-XLSX OCT-419]' OR b.notes LIKE '[BTH26-XLSX OCT-419] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth' AND r.reference_type = 'hotel' AND r.reference_id = b.id
      AND r.package_label = 'Double Room Ensuite (DRE)'
  );

SELECT setval('hotel_bookings_id_seq', (SELECT MAX(id) FROM hotel_bookings));
SELECT setval('hotel_booking_rooms_id_seq', (SELECT MAX(id) FROM hotel_booking_rooms));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('revenue_entries_id_seq', (SELECT MAX(id) FROM revenue_entries));
COMMIT;
