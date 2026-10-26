-- Enchoro Wildlife Camp, 16-25 Oct 2026 WhatsApp.
-- Stays through 14 Oct and the bar week ending 10 Oct are already loaded.
-- Karibu totals are marked paid, matching the earlier October Karibu rows.
-- The 16 Oct Ochieng receipt of KES 16,000 is two stays: 3 pax x 2 nights
-- (12,000) and 2 pax overnight (4,000), at KES 2,000 per person per night.
-- Room is still unrecorded, so every stay uses room 105.
-- Each paid stay and each bar week gets one completed payment and one revenue
-- row. Payments point at the stay or bar order. Revenue points at the same
-- record, which is how the October EWC rows already report.
-- Bar revenue is the sales total. The Stanbic deposits are the cash left
-- after stock purchases, and those purchases are expenses.
-- Inserts skip a row when its note token or idempotency key already exists.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM hotel_bookings WHERE id >= 3533) THEN
    RAISE EXCEPTION 'hotel_bookings already has id >= 3533';
  END IF;
  IF EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE id >= 3530) THEN
    RAISE EXCEPTION 'hotel_booking_rooms already has id >= 3530';
  END IF;
  IF EXISTS (SELECT 1 FROM bar_orders WHERE id >= 202) THEN
    RAISE EXCEPTION 'bar_orders already has id >= 202';
  END IF;
  IF EXISTS (SELECT 1 FROM bar_order_items WHERE id >= 269) THEN
    RAISE EXCEPTION 'bar_order_items already has id >= 269';
  END IF;
  IF EXISTS (SELECT 1 FROM payments WHERE id >= 1580) THEN
    RAISE EXCEPTION 'payments already has id >= 1580';
  END IF;
  IF EXISTS (SELECT 1 FROM revenue_entries WHERE id >= 4246) THEN
    RAISE EXCEPTION 'revenue_entries already has id >= 4246';
  END IF;
  IF EXISTS (SELECT 1 FROM expenses WHERE id >= 340) THEN
    RAISE EXCEPTION 'expenses already has id >= 340';
  END IF;
END $$;

INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3533, 'ewc', 105, '2026-10-16', '2026-10-18', 2, 28000, 28000, NULL, 'paid', 'Karibu Safaris', NULL, 'checked_out', '[EWC26-WA K-1610] Arriving late lunch. Total 28k (not marked paid) | marked paid', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Karibu Safaris group', NULL, NULL, '[]'::jsonb, 7, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA K-1610]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3530, 3533, 105, 1, 14000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3533) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3533 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1580, 'ewc', NULL, 'hotel', 3533, 28000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-k-1610', '[EWC26-WA PAY-K-1610] Completed payment for the stay.', '2026-10-16 11:00:00', '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3533) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-k-1610' OR (reference_type = 'hotel' AND reference_id = 3533)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4246, 'ewc', NULL, 'hotel', 3533, 28000, 'Group stay (room not recorded)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3533) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3533);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3534, 'ewc', 105, '2026-10-17', '2026-10-20', 3, 6000, 6000, NULL, 'paid', 'Karibu Safaris', NULL, 'checked_out', '[EWC26-WA K-1710] Arriving late lunch. Total 6k (not marked paid) | marked paid', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Karibu Safaris group', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA K-1710]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3531, 3534, 105, 1, 2000, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3534) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3534 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1581, 'ewc', NULL, 'hotel', 3534, 6000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-k-1710', '[EWC26-WA PAY-K-1710] Completed payment for the stay.', '2026-10-17 11:00:00', '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3534) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-k-1710' OR (reference_type = 'hotel' AND reference_id = 3534)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4247, 'ewc', NULL, 'hotel', 3534, 6000, 'Group stay (room not recorded)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3534) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3534);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3535, 'ewc', 105, '2026-10-16', '2026-10-18', 2, 12000, 12000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-1610] 3 pax, 2 nights, paid 12k. The 16 Oct Ochieng receipt of 16k also covers the 2 pax overnight.', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 3, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-1610]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3532, 3535, 105, 1, 6000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3535) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3535 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1582, 'ewc', NULL, 'hotel', 3535, 12000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-1610', '[EWC26-WA PAY-O-1610] Completed payment for the stay.', '2026-10-16 11:00:00', '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3535) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-1610' OR (reference_type = 'hotel' AND reference_id = 3535)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4248, 'ewc', NULL, 'hotel', 3535, 12000, 'Group stay (room not recorded)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3535) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3535);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3536, 'ewc', 105, '2026-10-16', '2026-10-17', 1, 4000, 4000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-1610N] 2 pax overnight, paid 4k. Together with the 3 pax / 2 night stay the 16 Oct Ochieng receipt is 16k.', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-1610N]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3533, 3536, 105, 1, 4000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3536) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3536 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1583, 'ewc', NULL, 'hotel', 3536, 4000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-1610n', '[EWC26-WA PAY-O-1610N] Completed payment for the stay.', '2026-10-16 11:00:00', '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3536) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-1610n' OR (reference_type = 'hotel' AND reference_id = 3536)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4249, 'ewc', NULL, 'hotel', 3536, 4000, 'Group stay (room not recorded)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3536) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3536);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3537, 'ewc', 105, '2026-10-17', '2026-10-19', 2, 16000, 16000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-1710] 4 pax, paid 16k', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 4, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-1710]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3534, 3537, 105, 1, 8000, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3537) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3537 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1584, 'ewc', NULL, 'hotel', 3537, 16000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-1710', '[EWC26-WA PAY-O-1710] Completed payment for the stay.', '2026-10-17 11:00:00', '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3537) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-1710' OR (reference_type = 'hotel' AND reference_id = 3537)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4250, 'ewc', NULL, 'hotel', 3537, 16000, 'Group stay (room not recorded)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3537) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3537);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3538, 'ewc', 105, '2026-10-18', '2026-10-20', 2, 24000, 24000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-1810] 6 pax, paid 24k', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 6, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-1810]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3535, 3538, 105, 1, 12000, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3538) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3538 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1585, 'ewc', NULL, 'hotel', 3538, 24000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-1810', '[EWC26-WA PAY-O-1810] Completed payment for the stay.', '2026-10-18 11:00:00', '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3538) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-1810' OR (reference_type = 'hotel' AND reference_id = 3538)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4251, 'ewc', NULL, 'hotel', 3538, 24000, 'Group stay (room not recorded)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3538) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3538);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3539, 'ewc', 105, '2026-10-19', '2026-10-21', 2, 12000, 12000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-1910] 3 pax, paid 12k', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 3, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-1910]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3536, 3539, 105, 1, 6000, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3539) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3539 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1586, 'ewc', NULL, 'hotel', 3539, 12000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-1910', '[EWC26-WA PAY-O-1910] Completed payment for the stay.', '2026-10-19 11:00:00', '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3539) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-1910' OR (reference_type = 'hotel' AND reference_id = 3539)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4252, 'ewc', NULL, 'hotel', 3539, 12000, 'Group stay (room not recorded)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3539) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3539);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3540, 'ewc', 105, '2026-10-21', '2026-10-23', 2, 8000, 8000, NULL, 'paid', 'Karibu Safaris', NULL, 'checked_out', '[EWC26-WA K-2110] Arriving late lunch. Total 8k (not marked paid) | marked paid', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Karibu Safaris group', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA K-2110]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3537, 3540, 105, 1, 4000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3540) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3540 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1587, 'ewc', NULL, 'hotel', 3540, 8000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-k-2110', '[EWC26-WA PAY-K-2110] Completed payment for the stay.', '2026-10-21 11:00:00', '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3540) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-k-2110' OR (reference_type = 'hotel' AND reference_id = 3540)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4253, 'ewc', NULL, 'hotel', 3540, 8000, 'Group stay (room not recorded)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3540) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3540);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3541, 'ewc', 105, '2026-10-21', '2026-10-23', 2, 8000, 8000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-2110] 2 pax, paid 8k', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-2110]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3538, 3541, 105, 1, 4000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3541) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3541 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1588, 'ewc', NULL, 'hotel', 3541, 8000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-2110', '[EWC26-WA PAY-O-2110] Completed payment for the stay.', '2026-10-21 11:00:00', '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3541) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-2110' OR (reference_type = 'hotel' AND reference_id = 3541)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4254, 'ewc', NULL, 'hotel', 3541, 8000, 'Group stay (room not recorded)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3541) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3541);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3542, 'ewc', 105, '2026-10-22', '2026-10-24', 2, 28000, 28000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-2210] 7 pax, paid 28k', '2026-10-22 11:00:00', '2026-10-22 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 7, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-2210]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3539, 3542, 105, 1, 14000, '2026-10-22 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3542) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3542 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1589, 'ewc', NULL, 'hotel', 3542, 28000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-2210', '[EWC26-WA PAY-O-2210] Completed payment for the stay.', '2026-10-22 11:00:00', '2026-10-22 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3542) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-2210' OR (reference_type = 'hotel' AND reference_id = 3542)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4255, 'ewc', NULL, 'hotel', 3542, 28000, 'Group stay (room not recorded)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3542) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3542);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3543, 'ewc', 105, '2026-10-23', '2026-10-25', 2, 8000, 8000, NULL, 'paid', NULL, NULL, 'checked_out', '[EWC26-WA O-2310] 2 pax, paid 8k', '2026-10-23 11:00:00', '2026-10-23 11:00:00', NULL, 'Ochieng', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA O-2310]%');
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3540, 3543, 105, 1, 4000, '2026-10-23 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3543) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3543 AND room_id = 105);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1590, 'ewc', NULL, 'hotel', 3543, 8000, 'KES', 'completed', NULL, 'manual', 'ewc26-wa-pay-o-2310', '[EWC26-WA PAY-O-2310] Completed payment for the stay.', '2026-10-23 11:00:00', '2026-10-23 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3543) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-pay-o-2310' OR (reference_type = 'hotel' AND reference_id = 3543)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4256, 'ewc', NULL, 'hotel', 3543, 8000, 'Group stay (room not recorded)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3543) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'hotel' AND reference_id = 3543);
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 202, 'ewc', 'paid', '10/10/2026 - 18/10/2026', NULL, '[EWC26-WA BAR-1810] Week 10/10-18/10. Sales KES 20,500 (Beer 18 x 400, Water 34 x 200, Sodas 57 x 100, Wine 2 glasses x 400). Purchases KES 8,400. Cash 12,100 deposited to Stanbic Bank 18/10/26 1:23 PM, ref UJIKGA3056. Stock 18/10: Tusker 16, soda 42, water 17, wine 3 glasses.', '2026-10-18 13:23:00', '2026-10-18 13:23:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA BAR-1810]%');
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 269, 'ewc', 202, 6, 18, 400, 7200, NULL, '2026-10-18 13:23:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 202) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 202 AND item_id = 6);
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 270, 'ewc', 202, 7, 34, 200, 6800, NULL, '2026-10-18 13:23:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 202) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 202 AND item_id = 7);
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 271, 'ewc', 202, 8, 57, 100, 5700, NULL, '2026-10-18 13:23:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 202) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 202 AND item_id = 8);
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 272, 'ewc', 202, 9, 2, 400, 800, NULL, '2026-10-18 13:23:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 202) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 202 AND item_id = 9);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1591, 'ewc', NULL, 'bar', 202, 20500, 'KES', 'completed', 'cash', 'cash', 'ewc26-wa-bar-1810-cash', 'Weekly bar record (WhatsApp)', '2026-10-18 13:23:00', '2026-10-18 13:23:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 202) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-bar-1810-cash' OR (reference_type = 'bar' AND reference_id = 202)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4257, 'ewc', NULL, 'bar', 202, 20500, 'Bar sales (cash)', '2026-10', '2026-10-18 13:23:00', '2026-10-18 13:23:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 202) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'bar' AND reference_id = 202 AND package_label = 'Bar sales (cash)');
INSERT INTO expenses (id, company_id, booking_id, reference_type, reference_id, category, amount, description, incurred_at, created_at)
SELECT 340, 'ewc', NULL, NULL, NULL, 'Bar', 5400, '[EWC26-WA BAREXP-1810-1] 1 crate Tusker (week 10/10-18/10)', '2026-10-18 13:23:00', '2026-10-18 13:23:00'
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'ewc' AND description LIKE '%[EWC26-WA BAREXP-1810-1]%');
INSERT INTO expenses (id, company_id, booking_id, reference_type, reference_id, category, amount, description, incurred_at, created_at)
SELECT 341, 'ewc', NULL, NULL, NULL, 'Bar', 1000, '[EWC26-WA BAREXP-1810-2] 1 dozen water (week 10/10-18/10)', '2026-10-18 13:23:00', '2026-10-18 13:23:00'
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'ewc' AND description LIKE '%[EWC26-WA BAREXP-1810-2]%');
INSERT INTO expenses (id, company_id, booking_id, reference_type, reference_id, category, amount, description, incurred_at, created_at)
SELECT 342, 'ewc', NULL, NULL, NULL, 'Bar', 2000, '[EWC26-WA BAREXP-1810-3] 1 crate soda (week 10/10-18/10)', '2026-10-18 13:23:00', '2026-10-18 13:23:00'
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'ewc' AND description LIKE '%[EWC26-WA BAREXP-1810-3]%');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 203, 'ewc', 'paid', '18/10/2026 - 25/10/2026', NULL, '[EWC26-WA BAR-2510] Week 18/10-25/10. Sales KES 21,300 (Beer 47 x 400, Sodas 13 x 100, Wine 3 glasses x 400). Purchases KES 10,800 plus KES 4,600 still to buy for 1 crate Tusker. Cash 5,900 deposited to Stanbic Bank 25/10/26 1:51 PM, ref UJPKGAXOWX. Stock 25/10: Tusker 7, soda 28, water 18, no wine.', '2026-10-25 13:51:00', '2026-10-25 13:51:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'ewc' AND notes LIKE '%[EWC26-WA BAR-2510]%');
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 273, 'ewc', 203, 6, 47, 400, 18800, NULL, '2026-10-25 13:51:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 203) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 203 AND item_id = 6);
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 274, 'ewc', 203, 8, 13, 100, 1300, NULL, '2026-10-25 13:51:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 203) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 203 AND item_id = 8);
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 275, 'ewc', 203, 9, 3, 400, 1200, NULL, '2026-10-25 13:51:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 203) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 203 AND item_id = 9);
INSERT INTO payments (id, company_id, booking_id, reference_type, reference_id, amount, currency, status, method, provider, idempotency_key, notes, recorded_at, created_at)
SELECT 1592, 'ewc', NULL, 'bar', 203, 21300, 'KES', 'completed', 'cash', 'cash', 'ewc26-wa-bar-2510-cash', 'Weekly bar record (WhatsApp)', '2026-10-25 13:51:00', '2026-10-25 13:51:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 203) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'ewc' AND (idempotency_key = 'ewc26-wa-bar-2510-cash' OR (reference_type = 'bar' AND reference_id = 203)));
INSERT INTO revenue_entries (id, company_id, booking_id, reference_type, reference_id, amount, package_label, period_month, recognized_at, created_at)
SELECT 4258, 'ewc', NULL, 'bar', 203, 21300, 'Bar sales (cash)', '2026-10', '2026-10-25 13:51:00', '2026-10-25 13:51:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 203) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'ewc' AND reference_type = 'bar' AND reference_id = 203 AND package_label = 'Bar sales (cash)');
INSERT INTO expenses (id, company_id, booking_id, reference_type, reference_id, category, amount, description, incurred_at, created_at)
SELECT 343, 'ewc', NULL, NULL, NULL, 'Bar', 10800, '[EWC26-WA BAREXP-2510-1] 2 crates Tusker (week 18/10-25/10)', '2026-10-25 13:51:00', '2026-10-25 13:51:00'
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'ewc' AND description LIKE '%[EWC26-WA BAREXP-2510-1]%');
INSERT INTO expenses (id, company_id, booking_id, reference_type, reference_id, category, amount, description, incurred_at, created_at)
SELECT 344, 'ewc', NULL, NULL, NULL, 'Bar', 4600, '[EWC26-WA BAREXP-2510-2] 1 crate Tusker still to be purchased (week 18/10-25/10)', '2026-10-25 13:51:00', '2026-10-25 13:51:00'
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'ewc' AND description LIKE '%[EWC26-WA BAREXP-2510-2]%');

SELECT setval('hotel_bookings_id_seq', (SELECT MAX(id) FROM hotel_bookings));
SELECT setval('hotel_booking_rooms_id_seq', (SELECT MAX(id) FROM hotel_booking_rooms));
SELECT setval('bar_orders_id_seq', (SELECT MAX(id) FROM bar_orders));
SELECT setval('bar_order_items_id_seq', (SELECT MAX(id) FROM bar_order_items));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('revenue_entries_id_seq', (SELECT MAX(id) FROM revenue_entries));
SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));
COMMIT;
