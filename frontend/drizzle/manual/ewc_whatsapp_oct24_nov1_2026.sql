-- Enchoro Wildlife Camp, 24 Oct-1 Nov 2026 WhatsApp.
-- Stays through 23 Oct and the bar week ending 25 Oct are already loaded.
-- The 24 Oct Ochieng message was sent twice. It is one stay.
-- Rate used for a stated headcount is KES 2,000 per person per night,
-- which is what the earlier October stays multiply out to.
-- The 29 Oct message left the pax count blank. 4 pax is 16,000 / 2 nights
-- at that rate.
-- The 31 Oct receipt of KES 16,000 covers two stays. The overnight adult is
-- KES 2,000. The 2 adults and 3 children for 2 nights are the remaining
-- KES 14,000. The message does not give a separate child rate.
-- Karibu totals are marked paid, matching the earlier October Karibu rows.
-- Room is still unrecorded, so every stay uses room 105.
-- Each paid stay and the bar week gets one completed payment and one revenue
-- row. Payments point at the stay or bar order. Revenue points at the same
-- record.
-- Bar revenue is the sales total of KES 11,800. The Stanbic deposit of
-- KES 10,100 is the cash left after stock purchases and the till, and those
-- purchases are expenses.
-- Inserts skip a row when its note token or idempotency key already exists.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rooms WHERE id = 105 AND company_id = 'ewc') THEN
    RAISE EXCEPTION 'EWC room 105 is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bar_items WHERE id = 6 AND company_id = 'ewc') THEN
    RAISE EXCEPTION 'EWC bar item 6 (Beer) is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bar_items WHERE id = 7 AND company_id = 'ewc') THEN
    RAISE EXCEPTION 'EWC bar item 7 (Water) is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bar_items WHERE id = 8 AND company_id = 'ewc') THEN
    RAISE EXCEPTION 'EWC bar item 8 (Sodas) is missing';
  END IF;
END $$;

SELECT setval('hotel_bookings_id_seq', (SELECT MAX(id) FROM hotel_bookings));
SELECT setval('hotel_booking_rooms_id_seq', (SELECT MAX(id) FROM hotel_booking_rooms));
SELECT setval('bar_orders_id_seq', (SELECT MAX(id) FROM bar_orders));
SELECT setval('bar_order_items_id_seq', (SELECT MAX(id) FROM bar_order_items));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('revenue_entries_id_seq', (SELECT MAX(id) FROM revenue_entries));
SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));

INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'ewc', 105, '2026-10-24', '2026-10-26', 2, 20000, 20000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-2410] 5 pax, 2 nights, paid 20k', '2026-10-24 11:00:00', '2026-10-24 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 5, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-2410]%');
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 105, 1, 10000, '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-2410]%'
  AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms r WHERE r.hotel_booking_id = b.id AND r.room_id = 105);
INSERT INTO payments (company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 20000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-2410', '[EWC26-WA PAY-O-2410] Completed payment for the stay.', '2026-10-24 11:00:00', '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-2410]%'
  AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-2410' OR (reference_type = 'hotel' AND reference_id = b.id)));
INSERT INTO revenue_entries (company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 20000, 'Group stay (room not recorded)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-2410]%'
  AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = b.id);

INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'ewc', 105, '2026-10-28', '2026-10-30', 2, 4000, 4000, NULL, 'paid', 'Karibu Safaris', NULL, 'checked_out', '[EWC26-WA K-2810] Arriving late lunch. Total 4k (not marked paid) | marked paid', '2026-10-28 11:00:00', '2026-10-28 11:00:00', NULL, 'Karibu Safaris group', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA K-2810]%');
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 105, 1, 2000, '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA K-2810]%'
  AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms r WHERE r.hotel_booking_id = b.id AND r.room_id = 105);
INSERT INTO payments (company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 4000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-k-2810', '[EWC26-WA PAY-K-2810] Completed payment for the stay.', '2026-10-28 11:00:00', '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA K-2810]%'
  AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-k-2810' OR (reference_type = 'hotel' AND reference_id = b.id)));
INSERT INTO revenue_entries (company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 4000, 'Group stay (room not recorded)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA K-2810]%'
  AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = b.id);

INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'ewc', 105, '2026-10-29', '2026-10-31', 2, 16000, 16000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-2910] Pax count blank on the message. 4 pax, 2 nights, paid 16k at KES 2,000 per person per night.', '2026-10-29 11:00:00', '2026-10-29 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 4, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-2910]%');
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 105, 1, 8000, '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-2910]%'
  AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms r WHERE r.hotel_booking_id = b.id AND r.room_id = 105);
INSERT INTO payments (company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 16000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-2910', '[EWC26-WA PAY-O-2910] Completed payment for the stay.', '2026-10-29 11:00:00', '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-2910]%'
  AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-2910' OR (reference_type = 'hotel' AND reference_id = b.id)));
INSERT INTO revenue_entries (company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 16000, 'Group stay (room not recorded)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-2910]%'
  AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = b.id);

INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'ewc', 105, '2026-10-31', '2026-11-02', 2, 14000, 14000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-3110] 2 adults and 3 children, 2 nights. The 31 Oct Ochieng receipt of 16k also covers the 1 adult overnight, so this stay is the remaining 14k.', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 2, 3, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND (notes LIKE '%[EWC26-WA O-3110] %' OR notes LIKE '%[EWC26-WA O-3110]'));
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 105, 1, 7000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND (b.notes LIKE '%[EWC26-WA O-3110] %' OR b.notes LIKE '%[EWC26-WA O-3110]')
  AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms r WHERE r.hotel_booking_id = b.id AND r.room_id = 105);
INSERT INTO payments (company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 14000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-3110', '[EWC26-WA PAY-O-3110] Completed payment for the stay.', '2026-10-31 11:00:00', '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND (b.notes LIKE '%[EWC26-WA O-3110] %' OR b.notes LIKE '%[EWC26-WA O-3110]')
  AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-3110' OR (reference_type = 'hotel' AND reference_id = b.id)));
INSERT INTO revenue_entries (company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 14000, 'Group stay (room not recorded)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND (b.notes LIKE '%[EWC26-WA O-3110] %' OR b.notes LIKE '%[EWC26-WA O-3110]')
  AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = b.id);

INSERT INTO hotel_bookings (company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 'ewc', 105, '2026-10-31', '2026-11-01', 1, 2000, 2000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-3110N] 1 adult overnight, paid 2k. Together with the 2 adult / 3 child stay the 31 Oct Ochieng receipt is 16k.', '2026-10-31 11:00:00', '2026-10-31 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-3110N]%');
INSERT INTO hotel_booking_rooms (hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT b.id, 105, 1, 2000, '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-3110N]%'
  AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms r WHERE r.hotel_booking_id = b.id AND r.room_id = 105);
INSERT INTO payments (company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 2000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-3110n', '[EWC26-WA PAY-O-3110N] Completed payment for the stay.', '2026-10-31 11:00:00', '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-3110N]%'
  AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-3110n' OR (reference_type = 'hotel' AND reference_id = b.id)));
INSERT INTO revenue_entries (company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 'ewc', NULL, 'hotel', b.id, 2000, 'Group stay (room not recorded)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00'
FROM hotel_bookings b
WHERE b.company_id = 'ewc' AND b.notes LIKE '%[EWC26-WA O-3110N]%'
  AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = b.id);

INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'ewc', 'paid', '25/10/2026 - 01/11/2026', NULL, '[EWC26-WA BAR-0111] Week 25/10-01/11. Sales KES 11,800 (Beer 22 x 400, Sodas 6 x 100, Water 12 x 200). Purchases KES 1,500. Till KES 200. Cash 10,100 deposited to Stanbic Bank account 0100002141258 on 1/11/26 2:50 PM, ref UK1KGBSIM9. Stock 01/11: Tusker 10, soda 46, water 16, no wine.', '2026-11-01 14:50:00', '2026-11-01 14:50:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA BAR-0111]%');
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'ewc', o.id, 6, 22, 400, 8800, NULL, '2026-11-01 14:50:00'
FROM bar_orders o
WHERE o.company_id = 'ewc' AND o.notes LIKE '%[EWC26-WA BAR-0111]%'
  AND NOT EXISTS (SELECT 1 FROM bar_order_items i WHERE i.order_id = o.id AND i.item_id = 6);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'ewc', o.id, 8, 6, 100, 600, NULL, '2026-11-01 14:50:00'
FROM bar_orders o
WHERE o.company_id = 'ewc' AND o.notes LIKE '%[EWC26-WA BAR-0111]%'
  AND NOT EXISTS (SELECT 1 FROM bar_order_items i WHERE i.order_id = o.id AND i.item_id = 8);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'ewc', o.id, 7, 12, 200, 2400, NULL, '2026-11-01 14:50:00'
FROM bar_orders o
WHERE o.company_id = 'ewc' AND o.notes LIKE '%[EWC26-WA BAR-0111]%'
  AND NOT EXISTS (SELECT 1 FROM bar_order_items i WHERE i.order_id = o.id AND i.item_id = 7);
INSERT INTO payments (company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 'ewc', NULL, 'bar', o.id, 11800, 'KES', 'completed', 'cash', 'cash', 'ewc26-wa-bar-0111-cash', 'Weekly bar record (WhatsApp)', '2026-11-01 14:50:00', '2026-11-01 14:50:00'
FROM bar_orders o
WHERE o.company_id = 'ewc' AND o.notes LIKE '%[EWC26-WA BAR-0111]%'
  AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-bar-0111-cash' OR (reference_type = 'bar' AND reference_id = o.id)));
INSERT INTO revenue_entries (company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 'ewc', NULL, 'bar', o.id, 11800, 'Bar sales (cash)', '2026-11', '2026-11-01 14:50:00', '2026-11-01 14:50:00'
FROM bar_orders o
WHERE o.company_id = 'ewc' AND o.notes LIKE '%[EWC26-WA BAR-0111]%'
  AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'bar' AND reference_id = o.id AND package_label = 'Bar sales (cash)');
INSERT INTO expenses (company_id, booking_id, reference_type, reference_id, category, amount, description, incurred_at, created_at)
SELECT 'ewc', NULL, NULL, NULL, 'Bar', 500, '[EWC26-WA BAREXP-0111-1] 1 crate soda (week 25/10-01/11)', '2026-11-01 14:50:00', '2026-11-01 14:50:00'
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'ewc' AND description LIKE '%[EWC26-WA BAREXP-0111-1]%');
INSERT INTO expenses (company_id, booking_id, reference_type, reference_id, category, amount, description, incurred_at, created_at)
SELECT 'ewc', NULL, NULL, NULL, 'Bar', 1000, '[EWC26-WA BAREXP-0111-2] 1 dozen water (week 25/10-01/11)', '2026-11-01 14:50:00', '2026-11-01 14:50:00'
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'ewc' AND description LIKE '%[EWC26-WA BAREXP-0111-2]%');

SELECT setval('hotel_bookings_id_seq', (SELECT MAX(id) FROM hotel_bookings));
SELECT setval('hotel_booking_rooms_id_seq', (SELECT MAX(id) FROM hotel_booking_rooms));
SELECT setval('bar_orders_id_seq', (SELECT MAX(id) FROM bar_orders));
SELECT setval('bar_order_items_id_seq', (SELECT MAX(id) FROM bar_order_items));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('revenue_entries_id_seq', (SELECT MAX(id) FROM revenue_entries));
SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));
COMMIT;
