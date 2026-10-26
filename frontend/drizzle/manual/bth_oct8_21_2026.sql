-- BTH gap fill from bth_restaurant.xlsx, bth_bar.xlsx, and bth_oct_hotel_stays.xlsx.
-- Source rows on or before 7 Oct 2026 are already loaded (restaurant/bar tokens through OCT-8, stays through OCT-109).
-- This script continues those tokens through 21 Oct 2026 and allocates the next integer ids.
-- New rows from 8-21 Oct get payments and revenue. Paid stays already stored for 1-7 Oct get payments only; their revenue rows are left as they are. Credit stays are unpaid and are not revenue.
-- Each insert is skipped when its token or idempotency key already exists.
-- Snapshot maxima: restaurant_orders 282, restaurant_order_items 283, bar_orders 187, bar_order_items 254,
-- hotel_bookings 3331, hotel_booking_rooms 3328, payments 1225, revenue_entries 4001, expenses 320.
BEGIN;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM hotel_bookings WHERE id >= 3332) THEN
    RAISE EXCEPTION 'hotel_bookings already has id >= 3332';
  END IF;
  IF EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE id >= 3329) THEN
    RAISE EXCEPTION 'hotel_booking_rooms already has id >= 3329';
  END IF;
  IF EXISTS (SELECT 1 FROM restaurant_orders WHERE id >= 283) THEN
    RAISE EXCEPTION 'restaurant_orders already has id >= 283';
  END IF;
  IF EXISTS (SELECT 1 FROM restaurant_order_items WHERE id >= 284) THEN
    RAISE EXCEPTION 'restaurant_order_items already has id >= 284';
  END IF;
  IF EXISTS (SELECT 1 FROM bar_orders WHERE id >= 188) THEN
    RAISE EXCEPTION 'bar_orders already has id >= 188';
  END IF;
  IF EXISTS (SELECT 1 FROM bar_order_items WHERE id >= 255) THEN
    RAISE EXCEPTION 'bar_order_items already has id >= 255';
  END IF;
  IF EXISTS (SELECT 1 FROM payments WHERE id >= 1226) THEN
    RAISE EXCEPTION 'payments already has id >= 1226';
  END IF;
  IF EXISTS (SELECT 1 FROM revenue_entries WHERE id >= 4002) THEN
    RAISE EXCEPTION 'revenue_entries already has id >= 4002';
  END IF;
  IF EXISTS (SELECT 1 FROM expenses WHERE id >= 321) THEN
    RAISE EXCEPTION 'expenses already has id >= 321';
  END IF;
END $$;
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 283, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-9]', '2026-10-08 11:00:00', '2026-10-08 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-9]' OR notes LIKE '[BTH26-REST-XLSX OCT-9] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 284, 'bth', 283, 3, 1, 3375, 3375, NULL, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 283) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 283 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1226, 'bth', NULL, 1300, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'restaurant', 283, 'cash', 'bth26-rest-xlsx-OCT-9-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 283) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-9-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4002, 'bth', NULL, 1300, 'Restaurant sales (cash)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'restaurant', 283
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 283) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 283 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1227, 'bth', NULL, 2075, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'restaurant', 283, 'm-pesa', 'bth26-rest-xlsx-OCT-9-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 283) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-9-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4003, 'bth', NULL, 2075, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'restaurant', 283
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 283) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 283 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 284, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-10]', '2026-10-09 11:00:00', '2026-10-09 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-10]' OR notes LIKE '[BTH26-REST-XLSX OCT-10] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 285, 'bth', 284, 3, 1, 4125, 4125, NULL, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 284) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 284 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1228, 'bth', NULL, 1200, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'restaurant', 284, 'cash', 'bth26-rest-xlsx-OCT-10-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 284) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-10-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4004, 'bth', NULL, 1200, 'Restaurant sales (cash)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'restaurant', 284
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 284) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 284 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1229, 'bth', NULL, 2925, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'restaurant', 284, 'm-pesa', 'bth26-rest-xlsx-OCT-10-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 284) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-10-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4005, 'bth', NULL, 2925, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'restaurant', 284
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 284) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 284 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 321, 'bth', NULL, 'Restaurant', 885, '[BTH26-REST-XLSX OCT-10] Restaurant expenses (daily sheet)', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-10] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 285, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-11]', '2026-10-10 11:00:00', '2026-10-10 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-11]' OR notes LIKE '[BTH26-REST-XLSX OCT-11] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 286, 'bth', 285, 3, 1, 17435, 17435, NULL, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 285) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 285 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1230, 'bth', NULL, 4360, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'restaurant', 285, 'cash', 'bth26-rest-xlsx-OCT-11-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 285) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-11-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4006, 'bth', NULL, 4360, 'Restaurant sales (cash)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'restaurant', 285
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 285) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 285 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1231, 'bth', NULL, 13075, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'restaurant', 285, 'm-pesa', 'bth26-rest-xlsx-OCT-11-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 285) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-11-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4007, 'bth', NULL, 13075, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'restaurant', 285
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 285) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 285 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 322, 'bth', NULL, 'Restaurant', 6428, '[BTH26-REST-XLSX OCT-11] Restaurant expenses (daily sheet)', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-11] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 286, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-12]', '2026-10-11 11:00:00', '2026-10-11 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-12]' OR notes LIKE '[BTH26-REST-XLSX OCT-12] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 287, 'bth', 286, 3, 1, 6620, 6620, NULL, '2026-10-11 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 286) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 286 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1232, 'bth', NULL, 4720, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'restaurant', 286, 'cash', 'bth26-rest-xlsx-OCT-12-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 286) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-12-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4008, 'bth', NULL, 4720, 'Restaurant sales (cash)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'restaurant', 286
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 286) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 286 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1233, 'bth', NULL, 1900, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'restaurant', 286, 'm-pesa', 'bth26-rest-xlsx-OCT-12-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 286) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-12-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4009, 'bth', NULL, 1900, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'restaurant', 286
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 286) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 286 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 323, 'bth', NULL, 'Restaurant', 3880, '[BTH26-REST-XLSX OCT-12] Restaurant expenses (daily sheet)', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-12] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 287, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-13]', '2026-10-12 11:00:00', '2026-10-12 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-13]' OR notes LIKE '[BTH26-REST-XLSX OCT-13] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 288, 'bth', 287, 3, 1, 4685, 4685, NULL, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 287) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 287 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1234, 'bth', NULL, 2485, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'restaurant', 287, 'cash', 'bth26-rest-xlsx-OCT-13-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 287) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-13-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4010, 'bth', NULL, 2485, 'Restaurant sales (cash)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'restaurant', 287
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 287) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 287 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1235, 'bth', NULL, 2200, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'restaurant', 287, 'm-pesa', 'bth26-rest-xlsx-OCT-13-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 287) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-13-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4011, 'bth', NULL, 2200, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'restaurant', 287
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 287) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 287 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 324, 'bth', NULL, 'Restaurant', 1300, '[BTH26-REST-XLSX OCT-13] Restaurant expenses (daily sheet)', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-13] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 288, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-14]', '2026-10-13 11:00:00', '2026-10-13 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-14]' OR notes LIKE '[BTH26-REST-XLSX OCT-14] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 289, 'bth', 288, 3, 1, 5330, 5330, NULL, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 288) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 288 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1236, 'bth', NULL, 200, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'restaurant', 288, 'cash', 'bth26-rest-xlsx-OCT-14-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 288) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-14-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4012, 'bth', NULL, 200, 'Restaurant sales (cash)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'restaurant', 288
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 288) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 288 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1237, 'bth', NULL, 5130, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'restaurant', 288, 'm-pesa', 'bth26-rest-xlsx-OCT-14-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 288) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-14-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4013, 'bth', NULL, 5130, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'restaurant', 288
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 288) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 288 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 325, 'bth', NULL, 'Restaurant', 3740, '[BTH26-REST-XLSX OCT-14] Restaurant expenses (daily sheet)', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-14] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 289, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-15]', '2026-10-14 11:00:00', '2026-10-14 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-15]' OR notes LIKE '[BTH26-REST-XLSX OCT-15] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 290, 'bth', 289, 3, 1, 3225, 3225, NULL, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 289) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 289 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1238, 'bth', NULL, 400, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'restaurant', 289, 'cash', 'bth26-rest-xlsx-OCT-15-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 289) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-15-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4014, 'bth', NULL, 400, 'Restaurant sales (cash)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'restaurant', 289
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 289) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 289 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1239, 'bth', NULL, 2825, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'restaurant', 289, 'm-pesa', 'bth26-rest-xlsx-OCT-15-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 289) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-15-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4015, 'bth', NULL, 2825, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'restaurant', 289
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 289) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 289 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 326, 'bth', NULL, 'Restaurant', 3258, '[BTH26-REST-XLSX OCT-15] Restaurant expenses (daily sheet)', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-15] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 290, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-16]', '2026-10-15 11:00:00', '2026-10-15 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-16]' OR notes LIKE '[BTH26-REST-XLSX OCT-16] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 291, 'bth', 290, 3, 1, 16400, 16400, NULL, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 290) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 290 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1240, 'bth', NULL, 6950, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'restaurant', 290, 'cash', 'bth26-rest-xlsx-OCT-16-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 290) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-16-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4016, 'bth', NULL, 6950, 'Restaurant sales (cash)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'restaurant', 290
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 290) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 290 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1241, 'bth', NULL, 9450, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'restaurant', 290, 'm-pesa', 'bth26-rest-xlsx-OCT-16-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 290) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-16-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4017, 'bth', NULL, 9450, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'restaurant', 290
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 290) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 290 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 327, 'bth', NULL, 'Restaurant', 2805, '[BTH26-REST-XLSX OCT-16] Restaurant expenses (daily sheet)', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-16] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 291, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-17]', '2026-10-16 11:00:00', '2026-10-16 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-17]' OR notes LIKE '[BTH26-REST-XLSX OCT-17] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 292, 'bth', 291, 3, 1, 12180, 12180, NULL, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 291) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 291 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1242, 'bth', NULL, 9500, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'restaurant', 291, 'cash', 'bth26-rest-xlsx-OCT-17-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 291) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-17-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4018, 'bth', NULL, 9500, 'Restaurant sales (cash)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'restaurant', 291
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 291) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 291 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1243, 'bth', NULL, 2680, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'restaurant', 291, 'm-pesa', 'bth26-rest-xlsx-OCT-17-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 291) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-17-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4019, 'bth', NULL, 2680, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'restaurant', 291
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 291) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 291 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 328, 'bth', NULL, 'Restaurant', 7017, '[BTH26-REST-XLSX OCT-17] Restaurant expenses (daily sheet)', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-17] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 292, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-18]', '2026-10-17 11:00:00', '2026-10-17 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-18]' OR notes LIKE '[BTH26-REST-XLSX OCT-18] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 293, 'bth', 292, 3, 1, 7450, 7450, NULL, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 292) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 292 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1244, 'bth', NULL, 2100, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'restaurant', 292, 'cash', 'bth26-rest-xlsx-OCT-18-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 292) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-18-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4020, 'bth', NULL, 2100, 'Restaurant sales (cash)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'restaurant', 292
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 292) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 292 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1245, 'bth', NULL, 5350, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'restaurant', 292, 'm-pesa', 'bth26-rest-xlsx-OCT-18-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 292) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-18-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4021, 'bth', NULL, 5350, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'restaurant', 292
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 292) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 292 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 329, 'bth', NULL, 'Restaurant', 220, '[BTH26-REST-XLSX OCT-18] Restaurant expenses (daily sheet)', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-18] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 293, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-19]', '2026-10-18 11:00:00', '2026-10-18 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-19]' OR notes LIKE '[BTH26-REST-XLSX OCT-19] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 294, 'bth', 293, 3, 1, 4975, 4975, NULL, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 293) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 293 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1246, 'bth', NULL, 2125, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'restaurant', 293, 'cash', 'bth26-rest-xlsx-OCT-19-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 293) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-19-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4022, 'bth', NULL, 2125, 'Restaurant sales (cash)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'restaurant', 293
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 293) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 293 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1247, 'bth', NULL, 2850, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'restaurant', 293, 'm-pesa', 'bth26-rest-xlsx-OCT-19-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 293) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-19-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4023, 'bth', NULL, 2850, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'restaurant', 293
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 293) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 293 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 330, 'bth', NULL, 'Restaurant', 4330, '[BTH26-REST-XLSX OCT-19] Restaurant expenses (daily sheet)', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-19] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 294, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-20]', '2026-10-19 11:00:00', '2026-10-19 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-20]' OR notes LIKE '[BTH26-REST-XLSX OCT-20] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 295, 'bth', 294, 3, 1, 5775, 5775, NULL, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 294) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 294 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1248, 'bth', NULL, 1600, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'restaurant', 294, 'cash', 'bth26-rest-xlsx-OCT-20-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 294) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-20-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4024, 'bth', NULL, 1600, 'Restaurant sales (cash)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'restaurant', 294
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 294) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 294 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1249, 'bth', NULL, 4175, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'restaurant', 294, 'm-pesa', 'bth26-rest-xlsx-OCT-20-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 294) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-20-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4025, 'bth', NULL, 4175, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'restaurant', 294
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 294) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 294 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 331, 'bth', NULL, 'Restaurant', 700, '[BTH26-REST-XLSX OCT-20] Restaurant expenses (daily sheet)', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-20] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 295, 'bth', 'partially_paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-21] | Credit KES 2000 (DIRECTOR)', '2026-10-20 11:00:00', '2026-10-20 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-21]' OR notes LIKE '[BTH26-REST-XLSX OCT-21] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 296, 'bth', 295, 3, 1, 7650, 7650, NULL, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 295) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 295 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1250, 'bth', NULL, 3550, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'restaurant', 295, 'cash', 'bth26-rest-xlsx-OCT-21-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 295) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-21-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4026, 'bth', NULL, 3550, 'Restaurant sales (cash)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'restaurant', 295
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 295) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 295 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1251, 'bth', NULL, 2100, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'restaurant', 295, 'm-pesa', 'bth26-rest-xlsx-OCT-21-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 295) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-21-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4027, 'bth', NULL, 2100, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'restaurant', 295
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 295) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 295 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 332, 'bth', NULL, 'Restaurant', 4969, '[BTH26-REST-XLSX OCT-21] Restaurant expenses (daily sheet)', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-21] Restaurant expenses (daily sheet)');
INSERT INTO restaurant_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 296, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-22]', '2026-10-21 11:00:00', '2026-10-21 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_orders WHERE company_id = 'bth' AND (notes = '[BTH26-REST-XLSX OCT-22]' OR notes LIKE '[BTH26-REST-XLSX OCT-22] |%'));
INSERT INTO restaurant_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 297, 'bth', 296, 3, 1, 3660, 3660, NULL, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 296) AND NOT EXISTS (SELECT 1 FROM restaurant_order_items WHERE order_id = 296 AND item_id = 3);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1252, 'bth', NULL, 900, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'restaurant', 296, 'cash', 'bth26-rest-xlsx-OCT-22-cash'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 296) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-22-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4028, 'bth', NULL, 900, 'Restaurant sales (cash)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'restaurant', 296
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 296) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 296 AND package_label = 'Restaurant sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1253, 'bth', NULL, 2760, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'restaurant', 296, 'm-pesa', 'bth26-rest-xlsx-OCT-22-mpesa'
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 296) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-rest-xlsx-OCT-22-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4029, 'bth', NULL, 2760, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'restaurant', 296
WHERE EXISTS (SELECT 1 FROM restaurant_orders WHERE id = 296) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'restaurant' AND reference_id = 296 AND package_label = 'Restaurant sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 333, 'bth', NULL, 'Restaurant', 1540, '[BTH26-REST-XLSX OCT-22] Restaurant expenses (daily sheet)', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-REST-XLSX OCT-22] Restaurant expenses (daily sheet)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 188, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-9]', '2026-10-08 11:00:00', '2026-10-08 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-9]' OR notes LIKE '[BTH26-BAR-XLSX OCT-9] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 255, 'bth', 188, 10, 1, 3900, 3900, NULL, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 188) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 188 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1254, 'bth', NULL, 3900, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'bar', 188, 'm-pesa', 'bth26-bar-xlsx-OCT-9-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 188) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-9-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4030, 'bth', NULL, 3900, 'Bar sales (m-pesa)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'bar', 188
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 188) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 188 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 334, 'bth', NULL, 'Bar', 2220, '[BTH26-BAR-XLSX OCT-9] Bar expenses (daily sheet)', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'bar', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-BAR-XLSX OCT-9] Bar expenses (daily sheet)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 189, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-10]', '2026-10-09 11:00:00', '2026-10-09 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-10]' OR notes LIKE '[BTH26-BAR-XLSX OCT-10] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 256, 'bth', 189, 10, 1, 1300, 1300, NULL, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 189) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 189 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1255, 'bth', NULL, 700, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'bar', 189, 'cash', 'bth26-bar-xlsx-OCT-10-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 189) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-10-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4031, 'bth', NULL, 700, 'Bar sales (cash)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'bar', 189
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 189) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 189 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1256, 'bth', NULL, 600, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'bar', 189, 'm-pesa', 'bth26-bar-xlsx-OCT-10-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 189) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-10-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4032, 'bth', NULL, 600, 'Bar sales (m-pesa)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'bar', 189
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 189) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 189 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 190, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-11]', '2026-10-10 11:00:00', '2026-10-10 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-11]' OR notes LIKE '[BTH26-BAR-XLSX OCT-11] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 257, 'bth', 190, 10, 1, 3300, 3300, NULL, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 190) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 190 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1257, 'bth', NULL, 900, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'bar', 190, 'cash', 'bth26-bar-xlsx-OCT-11-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 190) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-11-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4033, 'bth', NULL, 900, 'Bar sales (cash)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'bar', 190
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 190) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 190 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1258, 'bth', NULL, 2400, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'bar', 190, 'm-pesa', 'bth26-bar-xlsx-OCT-11-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 190) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-11-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4034, 'bth', NULL, 2400, 'Bar sales (m-pesa)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'bar', 190
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 190) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 190 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 335, 'bth', NULL, 'Bar', 4414, '[BTH26-BAR-XLSX OCT-11] Bar expenses (daily sheet)', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'bar', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-BAR-XLSX OCT-11] Bar expenses (daily sheet)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 191, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-12]', '2026-10-11 11:00:00', '2026-10-11 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-12]' OR notes LIKE '[BTH26-BAR-XLSX OCT-12] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 258, 'bth', 191, 10, 1, 6000, 6000, NULL, '2026-10-11 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 191) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 191 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1259, 'bth', NULL, 3900, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'bar', 191, 'cash', 'bth26-bar-xlsx-OCT-12-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 191) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-12-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4035, 'bth', NULL, 3900, 'Bar sales (cash)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'bar', 191
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 191) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 191 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1260, 'bth', NULL, 2100, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'bar', 191, 'm-pesa', 'bth26-bar-xlsx-OCT-12-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 191) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-12-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4036, 'bth', NULL, 2100, 'Bar sales (m-pesa)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'bar', 191
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 191) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 191 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 336, 'bth', NULL, 'Bar', 3640, '[BTH26-BAR-XLSX OCT-12] Bar expenses (daily sheet)', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'bar', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-BAR-XLSX OCT-12] Bar expenses (daily sheet)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 192, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-13]', '2026-10-12 11:00:00', '2026-10-12 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-13]' OR notes LIKE '[BTH26-BAR-XLSX OCT-13] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 259, 'bth', 192, 10, 1, 2700, 2700, NULL, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 192) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 192 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1261, 'bth', NULL, 2700, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'bar', 192, 'cash', 'bth26-bar-xlsx-OCT-13-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 192) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-13-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4037, 'bth', NULL, 2700, 'Bar sales (cash)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'bar', 192
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 192) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 192 AND package_label = 'Bar sales (cash)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 193, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-14]', '2026-10-13 11:00:00', '2026-10-13 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-14]' OR notes LIKE '[BTH26-BAR-XLSX OCT-14] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 260, 'bth', 193, 10, 1, 4350, 4350, NULL, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 193) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 193 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1262, 'bth', NULL, 900, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'bar', 193, 'cash', 'bth26-bar-xlsx-OCT-14-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 193) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-14-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4038, 'bth', NULL, 900, 'Bar sales (cash)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'bar', 193
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 193) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 193 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1263, 'bth', NULL, 3450, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'bar', 193, 'm-pesa', 'bth26-bar-xlsx-OCT-14-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 193) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-14-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4039, 'bth', NULL, 3450, 'Bar sales (m-pesa)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'bar', 193
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 193) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 193 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 337, 'bth', NULL, 'Bar', 2220, '[BTH26-BAR-XLSX OCT-14] Bar expenses (daily sheet)', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'bar', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-BAR-XLSX OCT-14] Bar expenses (daily sheet)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 194, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-15]', '2026-10-14 11:00:00', '2026-10-14 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-15]' OR notes LIKE '[BTH26-BAR-XLSX OCT-15] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 261, 'bth', 194, 10, 1, 2400, 2400, NULL, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 194) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 194 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1264, 'bth', NULL, 1800, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'bar', 194, 'cash', 'bth26-bar-xlsx-OCT-15-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 194) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-15-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4040, 'bth', NULL, 1800, 'Bar sales (cash)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'bar', 194
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 194) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 194 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1265, 'bth', NULL, 600, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'bar', 194, 'm-pesa', 'bth26-bar-xlsx-OCT-15-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 194) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-15-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4041, 'bth', NULL, 600, 'Bar sales (m-pesa)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'bar', 194
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 194) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 194 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 338, 'bth', NULL, 'Bar', 8012, '[BTH26-BAR-XLSX OCT-15] Bar expenses (daily sheet)', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'bar', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-BAR-XLSX OCT-15] Bar expenses (daily sheet)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 195, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-16]', '2026-10-15 11:00:00', '2026-10-15 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-16]' OR notes LIKE '[BTH26-BAR-XLSX OCT-16] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 262, 'bth', 195, 10, 1, 1200, 1200, NULL, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 195) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 195 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1266, 'bth', NULL, 1200, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'bar', 195, 'cash', 'bth26-bar-xlsx-OCT-16-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 195) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-16-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4042, 'bth', NULL, 1200, 'Bar sales (cash)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'bar', 195
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 195) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 195 AND package_label = 'Bar sales (cash)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 196, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-17]', '2026-10-16 11:00:00', '2026-10-16 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-17]' OR notes LIKE '[BTH26-BAR-XLSX OCT-17] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 263, 'bth', 196, 10, 1, 900, 900, NULL, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 196) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 196 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1267, 'bth', NULL, 600, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'bar', 196, 'cash', 'bth26-bar-xlsx-OCT-17-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 196) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-17-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4043, 'bth', NULL, 600, 'Bar sales (cash)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'bar', 196
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 196) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 196 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1268, 'bth', NULL, 300, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'bar', 196, 'm-pesa', 'bth26-bar-xlsx-OCT-17-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 196) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-17-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4044, 'bth', NULL, 300, 'Bar sales (m-pesa)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'bar', 196
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 196) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 196 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 197, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-18]', '2026-10-17 11:00:00', '2026-10-17 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-18]' OR notes LIKE '[BTH26-BAR-XLSX OCT-18] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 264, 'bth', 197, 10, 1, 300, 300, NULL, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 197) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 197 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1269, 'bth', NULL, 300, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'bar', 197, 'cash', 'bth26-bar-xlsx-OCT-18-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 197) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-18-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4045, 'bth', NULL, 300, 'Bar sales (cash)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'bar', 197
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 197) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 197 AND package_label = 'Bar sales (cash)');
INSERT INTO expenses (id, company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 339, 'bth', NULL, 'Bar', 1110, '[BTH26-BAR-XLSX OCT-18] Bar expenses (daily sheet)', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'bar', NULL
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE company_id = 'bth' AND description = '[BTH26-BAR-XLSX OCT-18] Bar expenses (daily sheet)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 198, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-19]', '2026-10-18 11:00:00', '2026-10-18 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-19]' OR notes LIKE '[BTH26-BAR-XLSX OCT-19] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 265, 'bth', 198, 10, 1, 300, 300, NULL, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 198) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 198 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1270, 'bth', NULL, 300, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'bar', 198, 'cash', 'bth26-bar-xlsx-OCT-19-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 198) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-19-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4046, 'bth', NULL, 300, 'Bar sales (cash)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'bar', 198
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 198) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 198 AND package_label = 'Bar sales (cash)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 199, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-20]', '2026-10-19 11:00:00', '2026-10-19 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-20]' OR notes LIKE '[BTH26-BAR-XLSX OCT-20] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 266, 'bth', 199, 10, 1, 4350, 4350, NULL, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 199) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 199 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1271, 'bth', NULL, 1150, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'bar', 199, 'cash', 'bth26-bar-xlsx-OCT-20-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 199) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-20-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4047, 'bth', NULL, 1150, 'Bar sales (cash)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'bar', 199
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 199) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 199 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1272, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'bar', 199, 'm-pesa', 'bth26-bar-xlsx-OCT-20-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 199) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-20-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4048, 'bth', NULL, 3200, 'Bar sales (m-pesa)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'bar', 199
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 199) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 199 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 200, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-21]', '2026-10-20 11:00:00', '2026-10-20 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-21]' OR notes LIKE '[BTH26-BAR-XLSX OCT-21] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 267, 'bth', 200, 10, 1, 3600, 3600, NULL, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 200) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 200 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1273, 'bth', NULL, 600, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'bar', 200, 'cash', 'bth26-bar-xlsx-OCT-21-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 200) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-21-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4049, 'bth', NULL, 600, 'Bar sales (cash)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'bar', 200
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 200) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 200 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1274, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'bar', 200, 'm-pesa', 'bth26-bar-xlsx-OCT-21-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 200) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-21-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4050, 'bth', NULL, 3000, 'Bar sales (m-pesa)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'bar', 200
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 200) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 200 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO bar_orders (id, company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 201, 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-22]', '2026-10-21 11:00:00', '2026-10-21 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM bar_orders WHERE company_id = 'bth' AND (notes = '[BTH26-BAR-XLSX OCT-22]' OR notes LIKE '[BTH26-BAR-XLSX OCT-22] |%'));
INSERT INTO bar_order_items (id, company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 268, 'bth', 201, 10, 1, 600, 600, NULL, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 201) AND NOT EXISTS (SELECT 1 FROM bar_order_items WHERE order_id = 201 AND item_id = 10);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1275, 'bth', NULL, 300, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'bar', 201, 'cash', 'bth26-bar-xlsx-OCT-22-cash'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 201) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-22-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4051, 'bth', NULL, 300, 'Bar sales (cash)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'bar', 201
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 201) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 201 AND package_label = 'Bar sales (cash)');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1276, 'bth', NULL, 300, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'bar', 201, 'm-pesa', 'bth26-bar-xlsx-OCT-22-m-pesa'
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 201) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-bar-xlsx-OCT-22-m-pesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4052, 'bth', NULL, 300, 'Bar sales (m-pesa)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'bar', 201
WHERE EXISTS (SELECT 1 FROM bar_orders WHERE id = 201) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'bar' AND reference_id = 201 AND package_label = 'Bar sales (m-pesa)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3332, 'bth', 74, '2026-10-08', '2026-10-09', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-110]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-110]' OR notes LIKE '[BTH26-XLSX OCT-110] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3329, 3332, 74, 1, 1500, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3332) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3332 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1277, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3332, 'm-pesa', 'bth26-hotel-xlsx-OCT-110-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3332) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-110-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4053, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3332
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3332) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3332 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3333, 'bth', 76, '2026-10-08', '2026-10-09', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-111]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-111]' OR notes LIKE '[BTH26-XLSX OCT-111] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3330, 3333, 76, 1, 2500, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3333) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3333 AND room_id = 76);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1278, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3333, 'm-pesa', 'bth26-hotel-xlsx-OCT-111-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3333) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-111-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4054, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3333
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3333) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3333 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3334, 'bth', 77, '2026-10-08', '2026-10-09', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-112]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-112]' OR notes LIKE '[BTH26-XLSX OCT-112] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3331, 3334, 77, 1, 1000, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3334) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3334 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1279, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3334, 'm-pesa', 'bth26-hotel-xlsx-OCT-112-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3334) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-112-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4055, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3334
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3334) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3334 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3335, 'bth', 80, '2026-10-08', '2026-10-10', 2, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-113]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-113]' OR notes LIKE '[BTH26-XLSX OCT-113] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3332, 3335, 80, 1, 1500, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3335) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3335 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1280, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3335, 'm-pesa', 'bth26-hotel-xlsx-OCT-113-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3335) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-113-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4056, 'bth', NULL, 3000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3335
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3335) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3335 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3336, 'bth', 81, '2026-10-08', '2026-10-09', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-114]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-114]' OR notes LIKE '[BTH26-XLSX OCT-114] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3333, 3336, 81, 1, 2000, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3336) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3336 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1281, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3336, 'm-pesa', 'bth26-hotel-xlsx-OCT-114-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3336) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-114-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4057, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3336
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3336) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3336 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3337, 'bth', 83, '2026-10-08', '2026-10-09', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-115]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-115]' OR notes LIKE '[BTH26-XLSX OCT-115] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3334, 3337, 83, 1, 1500, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3337) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3337 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1282, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3337, 'm-pesa', 'bth26-hotel-xlsx-OCT-115-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3337) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-115-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4058, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3337
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3337) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3337 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3338, 'bth', 84, '2026-10-08', '2026-10-09', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-116]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-116]' OR notes LIKE '[BTH26-XLSX OCT-116] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3335, 3338, 84, 1, 2000, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3338) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3338 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1283, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3338, 'm-pesa', 'bth26-hotel-xlsx-OCT-116-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3338) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-116-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4059, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3338
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3338) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3338 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3339, 'bth', 86, '2026-10-08', '2026-10-09', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-117]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-117]' OR notes LIKE '[BTH26-XLSX OCT-117] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3336, 3339, 86, 1, 1000, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3339) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3339 AND room_id = 86);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1284, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3339, 'm-pesa', 'bth26-hotel-xlsx-OCT-117-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3339) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-117-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4060, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3339
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3339) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3339 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3340, 'bth', 91, '2026-10-08', '2026-10-09', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-118]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-118]' OR notes LIKE '[BTH26-XLSX OCT-118] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3337, 3340, 91, 1, 2000, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3340) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3340 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1285, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3340, 'm-pesa', 'bth26-hotel-xlsx-OCT-118-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3340) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-118-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4061, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3340
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3340) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3340 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3341, 'bth', 96, '2026-10-08', '2026-10-09', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-119]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-119]' OR notes LIKE '[BTH26-XLSX OCT-119] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3338, 3341, 96, 1, 1000, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3341) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3341 AND room_id = 96);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1286, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3341, 'm-pesa', 'bth26-hotel-xlsx-OCT-119-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3341) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-119-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4062, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3341
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3341) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3341 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3342, 'bth', 100, '2026-10-08', '2026-10-09', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-120]', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-120]' OR notes LIKE '[BTH26-XLSX OCT-120] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3339, 3342, 100, 1, 1500, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3342) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3342 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1287, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3342, 'm-pesa', 'bth26-hotel-xlsx-OCT-120-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3342) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-120-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4063, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3342
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3342) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3342 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3343, 'bth', 101, '2026-10-08', '2026-10-08', 0, 1800, 1800, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-121] | Day use (D)', '2026-10-08 11:00:00', '2026-10-08 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-121]' OR notes LIKE '[BTH26-XLSX OCT-121] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3340, 3343, 101, 1, 1800, '2026-10-08 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3343) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3343 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1288, 'bth', NULL, 1800, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3343, 'cash', 'bth26-hotel-xlsx-OCT-121-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3343) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-121-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4064, 'bth', NULL, 1800, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-08 11:00:00', '2026-10-08 11:00:00', 'hotel', 3343
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3343) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3343 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3344, 'bth', 74, '2026-10-09', '2026-10-10', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-122]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-122]' OR notes LIKE '[BTH26-XLSX OCT-122] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3341, 3344, 74, 1, 1500, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3344) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3344 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1289, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3344, 'm-pesa', 'bth26-hotel-xlsx-OCT-122-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3344) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-122-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4065, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3344
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3344) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3344 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3345, 'bth', 75, '2026-10-09', '2026-10-10', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-123]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-123]' OR notes LIKE '[BTH26-XLSX OCT-123] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3342, 3345, 75, 1, 2000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3345) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3345 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1290, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3345, 'm-pesa', 'bth26-hotel-xlsx-OCT-123-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3345) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-123-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4066, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3345
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3345) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3345 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3346, 'bth', 76, '2026-10-09', '2026-10-09', 0, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-124] | Day use (D)', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-124]' OR notes LIKE '[BTH26-XLSX OCT-124] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3343, 3346, 76, 1, 2500, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3346) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3346 AND room_id = 76);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1291, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3346, 'm-pesa', 'bth26-hotel-xlsx-OCT-124-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3346) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-124-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4067, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3346
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3346) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3346 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3347, 'bth', 78, '2026-10-09', '2026-10-10', 1, 3200, 3200, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-125]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 4, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-125]' OR notes LIKE '[BTH26-XLSX OCT-125] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3344, 3347, 78, 1, 3200, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3347) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3347 AND room_id = 78);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1292, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3347, 'm-pesa', 'bth26-hotel-xlsx-OCT-125-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3347) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-125-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4068, 'bth', NULL, 3200, 'Bunk Room (BUNKED)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3347
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3347) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3347 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3348, 'bth', 79, '2026-10-09', '2026-10-10', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-126]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-126]' OR notes LIKE '[BTH26-XLSX OCT-126] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3345, 3348, 79, 1, 1000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3348) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3348 AND room_id = 79);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1293, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3348, 'm-pesa', 'bth26-hotel-xlsx-OCT-126-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3348) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-126-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4069, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3348
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3348) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3348 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3349, 'bth', 81, '2026-10-09', '2026-10-10', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-127]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-127]' OR notes LIKE '[BTH26-XLSX OCT-127] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3346, 3349, 81, 1, 2000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3349) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3349 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1294, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3349, 'm-pesa', 'bth26-hotel-xlsx-OCT-127-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3349) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-127-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4070, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3349
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3349) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3349 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3350, 'bth', 83, '2026-10-09', '2026-10-10', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-128]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-128]' OR notes LIKE '[BTH26-XLSX OCT-128] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3347, 3350, 83, 1, 1500, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3350) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3350 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1295, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3350, 'm-pesa', 'bth26-hotel-xlsx-OCT-128-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3350) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-128-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4071, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3350
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3350) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3350 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3351, 'bth', 86, '2026-10-09', '2026-10-10', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-129]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-129]' OR notes LIKE '[BTH26-XLSX OCT-129] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3348, 3351, 86, 1, 1000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3351) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3351 AND room_id = 86);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1296, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3351, 'm-pesa', 'bth26-hotel-xlsx-OCT-129-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3351) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-129-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4072, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3351
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3351) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3351 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3352, 'bth', 87, '2026-10-09', '2026-10-10', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-130]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-130]' OR notes LIKE '[BTH26-XLSX OCT-130] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3349, 3352, 87, 1, 1000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3352) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3352 AND room_id = 87);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1297, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3352, 'm-pesa', 'bth26-hotel-xlsx-OCT-130-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3352) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-130-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4073, 'bth', NULL, 1000, 'Bunk Room (BUNKED)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3352
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3352) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3352 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3353, 'bth', 88, '2026-10-09', '2026-10-10', 1, 800, 800, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-131]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-131]' OR notes LIKE '[BTH26-XLSX OCT-131] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3350, 3353, 88, 1, 800, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3353) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3353 AND room_id = 88);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1298, 'bth', NULL, 800, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3353, 'm-pesa', 'bth26-hotel-xlsx-OCT-131-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3353) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-131-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4074, 'bth', NULL, 800, 'Bunk Room (BUNKED)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3353
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3353) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3353 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3354, 'bth', 89, '2026-10-09', '2026-10-10', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-132]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-132]' OR notes LIKE '[BTH26-XLSX OCT-132] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3351, 3354, 89, 1, 1000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3354) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3354 AND room_id = 89);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1299, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3354, 'm-pesa', 'bth26-hotel-xlsx-OCT-132-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3354) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-132-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4075, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3354
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3354) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3354 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3355, 'bth', 90, '2026-10-09', '2026-10-10', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-133]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-133]' OR notes LIKE '[BTH26-XLSX OCT-133] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3352, 3355, 90, 1, 1500, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3355) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3355 AND room_id = 90);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1300, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3355, 'm-pesa', 'bth26-hotel-xlsx-OCT-133-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3355) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-133-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4076, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3355
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3355) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3355 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3356, 'bth', 91, '2026-10-09', '2026-10-10', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-134]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-134]' OR notes LIKE '[BTH26-XLSX OCT-134] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3353, 3356, 91, 1, 2000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3356) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3356 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1301, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3356, 'm-pesa', 'bth26-hotel-xlsx-OCT-134-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3356) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-134-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4077, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3356
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3356) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3356 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3357, 'bth', 93, '2026-10-09', '2026-10-10', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-135]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-135]' OR notes LIKE '[BTH26-XLSX OCT-135] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3354, 3357, 93, 1, 1500, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3357) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3357 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1302, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3357, 'cash', 'bth26-hotel-xlsx-OCT-135-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3357) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-135-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4078, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3357
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3357) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3357 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3358, 'bth', 96, '2026-10-09', '2026-10-10', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-136]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-136]' OR notes LIKE '[BTH26-XLSX OCT-136] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3355, 3358, 96, 1, 1000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3358) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3358 AND room_id = 96);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1303, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3358, 'm-pesa', 'bth26-hotel-xlsx-OCT-136-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3358) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-136-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4079, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3358
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3358) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3358 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3359, 'bth', 99, '2026-10-09', '2026-10-10', 1, 1500, 1500, 'cash+m-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-137]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-137]' OR notes LIKE '[BTH26-XLSX OCT-137] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3356, 3359, 99, 1, 1500, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3359) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3359 AND room_id = 99);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1304, 'bth', NULL, 750, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3359, 'cash', 'bth26-hotel-xlsx-OCT-137-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3359) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-137-cash');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1305, 'bth', NULL, 750, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3359, 'm-pesa', 'bth26-hotel-xlsx-OCT-137-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3359) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-137-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4080, 'bth', NULL, 1500, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3359
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3359) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3359 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3360, 'bth', 100, '2026-10-09', '2026-10-10', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-138]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-138]' OR notes LIKE '[BTH26-XLSX OCT-138] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3357, 3360, 100, 1, 1500, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3360) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3360 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1306, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3360, 'm-pesa', 'bth26-hotel-xlsx-OCT-138-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3360) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-138-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4081, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3360
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3360) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3360 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3361, 'bth', 101, '2026-10-09', '2026-10-10', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-139]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-139]' OR notes LIKE '[BTH26-XLSX OCT-139] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3358, 3361, 101, 1, 2000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3361) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3361 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1307, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3361, 'm-pesa', 'bth26-hotel-xlsx-OCT-139-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3361) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-139-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4082, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3361
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3361) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3361 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3362, 'bth', 102, '2026-10-09', '2026-10-10', 1, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-140]', '2026-10-09 11:00:00', '2026-10-09 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-140]' OR notes LIKE '[BTH26-XLSX OCT-140] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3359, 3362, 102, 1, 3000, '2026-10-09 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3362) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3362 AND room_id = 102);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1308, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3362, 'm-pesa', 'bth26-hotel-xlsx-OCT-140-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3362) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-140-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4083, 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-09 11:00:00', '2026-10-09 11:00:00', 'hotel', 3362
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3362) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3362 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3363, 'bth', 74, '2026-10-10', '2026-10-11', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-141]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-141]' OR notes LIKE '[BTH26-XLSX OCT-141] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3360, 3363, 74, 1, 1500, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3363) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3363 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1309, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3363, 'cash', 'bth26-hotel-xlsx-OCT-141-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3363) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-141-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4084, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3363
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3363) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3363 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3364, 'bth', 75, '2026-10-10', '2026-10-11', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-142]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-142]' OR notes LIKE '[BTH26-XLSX OCT-142] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3361, 3364, 75, 1, 2000, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3364) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3364 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1310, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3364, 'm-pesa', 'bth26-hotel-xlsx-OCT-142-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3364) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-142-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4085, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3364
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3364) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3364 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3365, 'bth', 77, '2026-10-10', '2026-10-11', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-143]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-143]' OR notes LIKE '[BTH26-XLSX OCT-143] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3362, 3365, 77, 1, 1000, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3365) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3365 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1311, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3365, 'm-pesa', 'bth26-hotel-xlsx-OCT-143-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3365) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-143-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4086, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3365
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3365) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3365 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3366, 'bth', 80, '2026-10-10', '2026-10-11', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-144]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-144]' OR notes LIKE '[BTH26-XLSX OCT-144] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3363, 3366, 80, 1, 1500, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3366) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3366 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1312, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3366, 'cash', 'bth26-hotel-xlsx-OCT-144-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3366) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-144-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4087, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3366
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3366) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3366 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3367, 'bth', 81, '2026-10-10', '2026-10-11', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-145]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-145]' OR notes LIKE '[BTH26-XLSX OCT-145] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3364, 3367, 81, 1, 2000, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3367) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3367 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1313, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3367, 'm-pesa', 'bth26-hotel-xlsx-OCT-145-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3367) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-145-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4088, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3367
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3367) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3367 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3368, 'bth', 83, '2026-10-10', '2026-10-10', 0, 1700, 1700, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-146] | Day use (D)', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-146]' OR notes LIKE '[BTH26-XLSX OCT-146] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3365, 3368, 83, 1, 1700, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3368) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3368 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1314, 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3368, 'm-pesa', 'bth26-hotel-xlsx-OCT-146-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3368) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-146-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4089, 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3368
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3368) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3368 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3369, 'bth', 84, '2026-10-10', '2026-10-11', 1, 2000, 2000, 'cash+m-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-147]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-147]' OR notes LIKE '[BTH26-XLSX OCT-147] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3366, 3369, 84, 1, 2000, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3369) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3369 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1315, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3369, 'cash', 'bth26-hotel-xlsx-OCT-147-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3369) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-147-cash');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1316, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3369, 'm-pesa', 'bth26-hotel-xlsx-OCT-147-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3369) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-147-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4090, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3369
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3369) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3369 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3370, 'bth', 85, '2026-10-10', '2026-10-11', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-148]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-148]' OR notes LIKE '[BTH26-XLSX OCT-148] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3367, 3370, 85, 1, 2500, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3370) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3370 AND room_id = 85);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1317, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3370, 'm-pesa', 'bth26-hotel-xlsx-OCT-148-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3370) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-148-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4091, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3370
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3370) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3370 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3371, 'bth', 86, '2026-10-10', '2026-10-11', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-149]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-149]' OR notes LIKE '[BTH26-XLSX OCT-149] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3368, 3371, 86, 1, 1000, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3371) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3371 AND room_id = 86);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1318, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3371, 'm-pesa', 'bth26-hotel-xlsx-OCT-149-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3371) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-149-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4092, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3371
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3371) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3371 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3372, 'bth', 88, '2026-10-10', '2026-10-11', 1, 800, 800, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-150]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-150]' OR notes LIKE '[BTH26-XLSX OCT-150] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3369, 3372, 88, 1, 800, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3372) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3372 AND room_id = 88);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1319, 'bth', NULL, 800, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3372, 'm-pesa', 'bth26-hotel-xlsx-OCT-150-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3372) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-150-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4093, 'bth', NULL, 800, 'Bunk Room (BUNKED)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3372
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3372) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3372 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3373, 'bth', 90, '2026-10-10', '2026-10-11', 1, 1700, 1700, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-151]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-151]' OR notes LIKE '[BTH26-XLSX OCT-151] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3370, 3373, 90, 1, 1700, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3373) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3373 AND room_id = 90);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1320, 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3373, 'm-pesa', 'bth26-hotel-xlsx-OCT-151-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3373) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-151-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4094, 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3373
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3373) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3373 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3374, 'bth', 91, '2026-10-10', '2026-10-11', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-152]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-152]' OR notes LIKE '[BTH26-XLSX OCT-152] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3371, 3374, 91, 1, 2000, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3374) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3374 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1321, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3374, 'm-pesa', 'bth26-hotel-xlsx-OCT-152-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3374) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-152-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4095, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3374
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3374) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3374 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3375, 'bth', 93, '2026-10-10', '2026-10-11', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-153]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-153]' OR notes LIKE '[BTH26-XLSX OCT-153] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3372, 3375, 93, 1, 1500, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3375) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3375 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1322, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3375, 'cash', 'bth26-hotel-xlsx-OCT-153-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3375) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-153-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4096, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3375
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3375) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3375 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3376, 'bth', 100, '2026-10-10', '2026-10-11', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-154]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-154]' OR notes LIKE '[BTH26-XLSX OCT-154] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3373, 3376, 100, 1, 1500, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3376) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3376 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1323, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3376, 'm-pesa', 'bth26-hotel-xlsx-OCT-154-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3376) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-154-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4097, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3376
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3376) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3376 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3377, 'bth', 101, '2026-10-10', '2026-10-11', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-155]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-155]' OR notes LIKE '[BTH26-XLSX OCT-155] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3374, 3377, 101, 1, 2000, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3377) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3377 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1324, 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3377, 'cash', 'bth26-hotel-xlsx-OCT-155-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3377) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-155-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4098, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3377
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3377) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3377 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3378, 'bth', 102, '2026-10-10', '2026-10-11', 1, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-156]', '2026-10-10 11:00:00', '2026-10-10 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-156]' OR notes LIKE '[BTH26-XLSX OCT-156] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3375, 3378, 102, 1, 3000, '2026-10-10 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3378) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3378 AND room_id = 102);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1325, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3378, 'm-pesa', 'bth26-hotel-xlsx-OCT-156-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3378) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-156-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4099, 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-10 11:00:00', '2026-10-10 11:00:00', 'hotel', 3378
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3378) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3378 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3379, 'bth', 74, '2026-10-11', '2026-10-12', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-157]', '2026-10-11 11:00:00', '2026-10-11 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-157]' OR notes LIKE '[BTH26-XLSX OCT-157] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3376, 3379, 74, 1, 1500, '2026-10-11 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3379) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3379 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1326, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3379, 'm-pesa', 'bth26-hotel-xlsx-OCT-157-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3379) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-157-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4100, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3379
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3379) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3379 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3380, 'bth', 80, '2026-10-11', '2026-10-12', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-158]', '2026-10-11 11:00:00', '2026-10-11 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-158]' OR notes LIKE '[BTH26-XLSX OCT-158] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3377, 3380, 80, 1, 1500, '2026-10-11 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3380) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3380 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1327, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3380, 'm-pesa', 'bth26-hotel-xlsx-OCT-158-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3380) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-158-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4101, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3380
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3380) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3380 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3381, 'bth', 81, '2026-10-11', '2026-10-12', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-159]', '2026-10-11 11:00:00', '2026-10-11 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-159]' OR notes LIKE '[BTH26-XLSX OCT-159] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3378, 3381, 81, 1, 2000, '2026-10-11 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3381) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3381 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1328, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3381, 'm-pesa', 'bth26-hotel-xlsx-OCT-159-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3381) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-159-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4102, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3381
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3381) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3381 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3382, 'bth', 93, '2026-10-11', '2026-10-12', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-160]', '2026-10-11 11:00:00', '2026-10-11 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-160]' OR notes LIKE '[BTH26-XLSX OCT-160] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3379, 3382, 93, 1, 1500, '2026-10-11 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3382) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3382 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1329, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3382, 'm-pesa', 'bth26-hotel-xlsx-OCT-160-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3382) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-160-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4103, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3382
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3382) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3382 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3383, 'bth', 97, '2026-10-11', '2026-10-12', 1, 650, 650, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-161]', '2026-10-11 11:00:00', '2026-10-11 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-161]' OR notes LIKE '[BTH26-XLSX OCT-161] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3380, 3383, 97, 1, 650, '2026-10-11 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3383) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3383 AND room_id = 97);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1330, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3383, 'm-pesa', 'bth26-hotel-xlsx-OCT-161-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3383) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-161-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4104, 'bth', NULL, 650, 'Bunk Room (BUNKED)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3383
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3383) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3383 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3384, 'bth', 100, '2026-10-11', '2026-10-12', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-162]', '2026-10-11 11:00:00', '2026-10-11 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-162]' OR notes LIKE '[BTH26-XLSX OCT-162] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3381, 3384, 100, 1, 1500, '2026-10-11 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3384) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3384 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1331, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3384, 'm-pesa', 'bth26-hotel-xlsx-OCT-162-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3384) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-162-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4105, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-11 11:00:00', '2026-10-11 11:00:00', 'hotel', 3384
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3384) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3384 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3385, 'bth', 74, '2026-10-12', '2026-10-13', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-163]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-163]' OR notes LIKE '[BTH26-XLSX OCT-163] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3382, 3385, 74, 1, 1000, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3385) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3385 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1332, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3385, 'm-pesa', 'bth26-hotel-xlsx-OCT-163-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3385) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-163-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4106, 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3385
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3385) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3385 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3386, 'bth', 75, '2026-10-12', '2026-10-13', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-164]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-164]' OR notes LIKE '[BTH26-XLSX OCT-164] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3383, 3386, 75, 1, 2000, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3386) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3386 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1333, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3386, 'm-pesa', 'bth26-hotel-xlsx-OCT-164-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3386) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-164-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4107, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3386
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3386) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3386 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3387, 'bth', 80, '2026-10-12', '2026-10-14', 2, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-165]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-165]' OR notes LIKE '[BTH26-XLSX OCT-165] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3384, 3387, 80, 1, 1500, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3387) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3387 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1334, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3387, 'm-pesa', 'bth26-hotel-xlsx-OCT-165-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3387) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-165-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4108, 'bth', NULL, 3000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3387
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3387) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3387 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3388, 'bth', 81, '2026-10-12', '2026-10-13', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-166]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-166]' OR notes LIKE '[BTH26-XLSX OCT-166] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3385, 3388, 81, 1, 2000, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3388) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3388 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1335, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3388, 'm-pesa', 'bth26-hotel-xlsx-OCT-166-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3388) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-166-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4109, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3388
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3388) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3388 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3389, 'bth', 83, '2026-10-12', '2026-10-13', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-167]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-167]' OR notes LIKE '[BTH26-XLSX OCT-167] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3386, 3389, 83, 1, 1500, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3389) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3389 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1336, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3389, 'm-pesa', 'bth26-hotel-xlsx-OCT-167-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3389) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-167-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4110, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3389
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3389) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3389 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3390, 'bth', 84, '2026-10-12', '2026-10-13', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-168]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-168]' OR notes LIKE '[BTH26-XLSX OCT-168] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3387, 3390, 84, 1, 2000, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3390) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3390 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1337, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3390, 'm-pesa', 'bth26-hotel-xlsx-OCT-168-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3390) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-168-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4111, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3390
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3390) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3390 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3391, 'bth', 88, '2026-10-12', '2026-10-13', 1, 650, 650, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-169]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-169]' OR notes LIKE '[BTH26-XLSX OCT-169] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3388, 3391, 88, 1, 650, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3391) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3391 AND room_id = 88);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1338, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3391, 'm-pesa', 'bth26-hotel-xlsx-OCT-169-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3391) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-169-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4112, 'bth', NULL, 650, 'Bunk Room (BUNKED)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3391
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3391) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3391 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3392, 'bth', 90, '2026-10-12', '2026-10-16', 4, 4000, 4000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-170]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-170]' OR notes LIKE '[BTH26-XLSX OCT-170] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3389, 3392, 90, 1, 1000, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3392) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3392 AND room_id = 90);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1339, 'bth', NULL, 4000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3392, 'm-pesa', 'bth26-hotel-xlsx-OCT-170-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3392) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-170-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4113, 'bth', NULL, 4000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3392
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3392) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3392 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3393, 'bth', 93, '2026-10-12', '2026-10-13', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-171]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-171]' OR notes LIKE '[BTH26-XLSX OCT-171] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3390, 3393, 93, 1, 1500, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3393) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3393 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1340, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3393, 'm-pesa', 'bth26-hotel-xlsx-OCT-171-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3393) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-171-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4114, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3393
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3393) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3393 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3394, 'bth', 97, '2026-10-12', '2026-10-13', 1, 650, 650, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-172]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-172]' OR notes LIKE '[BTH26-XLSX OCT-172] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3391, 3394, 97, 1, 650, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3394) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3394 AND room_id = 97);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1341, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3394, 'm-pesa', 'bth26-hotel-xlsx-OCT-172-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3394) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-172-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4115, 'bth', NULL, 650, 'Bunk Room (BUNKED)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3394
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3394) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3394 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3395, 'bth', 100, '2026-10-12', '2026-10-13', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-173]', '2026-10-12 11:00:00', '2026-10-12 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-173]' OR notes LIKE '[BTH26-XLSX OCT-173] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3392, 3395, 100, 1, 1500, '2026-10-12 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3395) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3395 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1342, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3395, 'm-pesa', 'bth26-hotel-xlsx-OCT-173-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3395) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-173-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4116, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-12 11:00:00', '2026-10-12 11:00:00', 'hotel', 3395
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3395) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3395 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3396, 'bth', 74, '2026-10-13', '2026-10-14', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-174]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-174]' OR notes LIKE '[BTH26-XLSX OCT-174] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3393, 3396, 74, 1, 1500, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3396) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3396 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1343, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3396, 'cash', 'bth26-hotel-xlsx-OCT-174-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3396) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-174-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4117, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3396
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3396) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3396 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3397, 'bth', 77, '2026-10-13', '2026-10-13', 0, 1000, 1000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-175] | Day use (D)', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-175]' OR notes LIKE '[BTH26-XLSX OCT-175] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3394, 3397, 77, 1, 1000, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3397) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3397 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1344, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3397, 'cash', 'bth26-hotel-xlsx-OCT-175-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3397) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-175-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4118, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3397
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3397) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3397 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3398, 'bth', 81, '2026-10-13', '2026-10-14', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-176]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-176]' OR notes LIKE '[BTH26-XLSX OCT-176] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3395, 3398, 81, 1, 2000, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3398) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3398 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1345, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3398, 'm-pesa', 'bth26-hotel-xlsx-OCT-176-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3398) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-176-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4119, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3398
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3398) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3398 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3399, 'bth', 84, '2026-10-13', '2026-10-14', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-177]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-177]' OR notes LIKE '[BTH26-XLSX OCT-177] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3396, 3399, 84, 1, 2000, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3399) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3399 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1346, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3399, 'm-pesa', 'bth26-hotel-xlsx-OCT-177-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3399) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-177-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4120, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3399
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3399) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3399 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3400, 'bth', 86, '2026-10-13', '2026-10-14', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-178]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-178]' OR notes LIKE '[BTH26-XLSX OCT-178] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3397, 3400, 86, 1, 1000, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3400) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3400 AND room_id = 86);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1347, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3400, 'm-pesa', 'bth26-hotel-xlsx-OCT-178-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3400) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-178-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4121, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3400
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3400) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3400 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3401, 'bth', 88, '2026-10-13', '2026-10-14', 1, 650, 650, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-179]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-179]' OR notes LIKE '[BTH26-XLSX OCT-179] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3398, 3401, 88, 1, 650, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3401) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3401 AND room_id = 88);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1348, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3401, 'm-pesa', 'bth26-hotel-xlsx-OCT-179-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3401) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-179-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4122, 'bth', NULL, 650, 'Bunk Room (BUNKED)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3401
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3401) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3401 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3402, 'bth', 91, '2026-10-13', '2026-10-15', 2, 4000, 4000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-180]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-180]' OR notes LIKE '[BTH26-XLSX OCT-180] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3399, 3402, 91, 1, 2000, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3402) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3402 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1349, 'bth', NULL, 4000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3402, 'cash', 'bth26-hotel-xlsx-OCT-180-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3402) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-180-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4123, 'bth', NULL, 4000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3402
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3402) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3402 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3403, 'bth', 93, '2026-10-13', '2026-10-14', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-181]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-181]' OR notes LIKE '[BTH26-XLSX OCT-181] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3400, 3403, 93, 1, 1500, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3403) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3403 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1350, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3403, 'm-pesa', 'bth26-hotel-xlsx-OCT-181-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3403) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-181-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4124, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3403
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3403) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3403 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3404, 'bth', 94, '2026-10-13', '2026-10-14', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-182]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-182]' OR notes LIKE '[BTH26-XLSX OCT-182] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3401, 3404, 94, 1, 1500, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3404) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3404 AND room_id = 94);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1351, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3404, 'm-pesa', 'bth26-hotel-xlsx-OCT-182-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3404) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-182-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4125, 'bth', NULL, 1500, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3404
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3404) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3404 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3405, 'bth', 96, '2026-10-13', '2026-10-14', 1, 800, 800, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-183]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-183]' OR notes LIKE '[BTH26-XLSX OCT-183] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3402, 3405, 96, 1, 800, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3405) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3405 AND room_id = 96);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1352, 'bth', NULL, 800, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3405, 'm-pesa', 'bth26-hotel-xlsx-OCT-183-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3405) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-183-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4126, 'bth', NULL, 800, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3405
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3405) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3405 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3406, 'bth', 99, '2026-10-13', '2026-10-14', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-184]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-184]' OR notes LIKE '[BTH26-XLSX OCT-184] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3403, 3406, 99, 1, 1000, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3406) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3406 AND room_id = 99);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1353, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3406, 'm-pesa', 'bth26-hotel-xlsx-OCT-184-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3406) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-184-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4127, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3406
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3406) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3406 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3407, 'bth', 100, '2026-10-13', '2026-10-14', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-185]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-185]' OR notes LIKE '[BTH26-XLSX OCT-185] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3404, 3407, 100, 1, 1500, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3407) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3407 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1354, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3407, 'm-pesa', 'bth26-hotel-xlsx-OCT-185-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3407) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-185-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4128, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3407
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3407) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3407 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3408, 'bth', 101, '2026-10-13', '2026-10-14', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-186]', '2026-10-13 11:00:00', '2026-10-13 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-186]' OR notes LIKE '[BTH26-XLSX OCT-186] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3405, 3408, 101, 1, 2000, '2026-10-13 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3408) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3408 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1355, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3408, 'm-pesa', 'bth26-hotel-xlsx-OCT-186-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3408) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-186-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4129, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-13 11:00:00', '2026-10-13 11:00:00', 'hotel', 3408
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3408) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3408 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3409, 'bth', 74, '2026-10-14', '2026-10-15', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-187]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-187]' OR notes LIKE '[BTH26-XLSX OCT-187] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3406, 3409, 74, 1, 1500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3409) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3409 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1356, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3409, 'm-pesa', 'bth26-hotel-xlsx-OCT-187-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3409) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-187-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4130, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3409
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3409) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3409 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3410, 'bth', 75, '2026-10-14', '2026-10-15', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-188]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-188]' OR notes LIKE '[BTH26-XLSX OCT-188] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3407, 3410, 75, 1, 2000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3410) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3410 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1357, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3410, 'm-pesa', 'bth26-hotel-xlsx-OCT-188-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3410) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-188-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4131, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3410
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3410) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3410 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3411, 'bth', 76, '2026-10-14', '2026-10-15', 1, 2500, 2500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-189]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-189]' OR notes LIKE '[BTH26-XLSX OCT-189] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3408, 3411, 76, 1, 2500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3411) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3411 AND room_id = 76);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1358, 'bth', NULL, 2500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3411, 'cash', 'bth26-hotel-xlsx-OCT-189-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3411) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-189-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4132, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3411
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3411) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3411 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3412, 'bth', 77, '2026-10-14', '2026-10-15', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-190]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-190]' OR notes LIKE '[BTH26-XLSX OCT-190] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3409, 3412, 77, 1, 1000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3412) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3412 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1359, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3412, 'm-pesa', 'bth26-hotel-xlsx-OCT-190-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3412) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-190-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4133, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3412
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3412) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3412 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3413, 'bth', 79, '2026-10-14', '2026-10-15', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-191]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-191]' OR notes LIKE '[BTH26-XLSX OCT-191] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3410, 3413, 79, 1, 1000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3413) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3413 AND room_id = 79);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1360, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3413, 'm-pesa', 'bth26-hotel-xlsx-OCT-191-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3413) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-191-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4134, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3413
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3413) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3413 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3414, 'bth', 80, '2026-10-14', '2026-10-15', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-192]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-192]' OR notes LIKE '[BTH26-XLSX OCT-192] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3411, 3414, 80, 1, 1500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3414) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3414 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1361, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3414, 'm-pesa', 'bth26-hotel-xlsx-OCT-192-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3414) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-192-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4135, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3414
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3414) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3414 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3415, 'bth', 81, '2026-10-14', '2026-10-15', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-193]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-193]' OR notes LIKE '[BTH26-XLSX OCT-193] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3412, 3415, 81, 1, 2000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3415) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3415 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1362, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3415, 'm-pesa', 'bth26-hotel-xlsx-OCT-193-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3415) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-193-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4136, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3415
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3415) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3415 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3416, 'bth', 82, '2026-10-14', '2026-10-15', 1, 2500, 2500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-194]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-194]' OR notes LIKE '[BTH26-XLSX OCT-194] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3413, 3416, 82, 1, 2500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3416) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3416 AND room_id = 82);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1363, 'bth', NULL, 2500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3416, 'cash', 'bth26-hotel-xlsx-OCT-194-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3416) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-194-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4137, 'bth', NULL, 2500, 'Executive / Special (S.P)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3416
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3416) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3416 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3417, 'bth', 83, '2026-10-14', '2026-10-15', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-195]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-195]' OR notes LIKE '[BTH26-XLSX OCT-195] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3414, 3417, 83, 1, 2000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3417) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3417 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1364, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3417, 'm-pesa', 'bth26-hotel-xlsx-OCT-195-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3417) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-195-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4138, 'bth', NULL, 2000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3417
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3417) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3417 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3418, 'bth', 84, '2026-10-14', '2026-10-15', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-196]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-196]' OR notes LIKE '[BTH26-XLSX OCT-196] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3415, 3418, 84, 1, 2000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3418) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3418 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1365, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3418, 'm-pesa', 'bth26-hotel-xlsx-OCT-196-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3418) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-196-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4139, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3418
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3418) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3418 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3419, 'bth', 85, '2026-10-14', '2026-10-15', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-197]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-197]' OR notes LIKE '[BTH26-XLSX OCT-197] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3416, 3419, 85, 1, 2500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3419) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3419 AND room_id = 85);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1366, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3419, 'm-pesa', 'bth26-hotel-xlsx-OCT-197-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3419) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-197-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4140, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3419
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3419) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3419 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3420, 'bth', 86, '2026-10-14', '2026-10-15', 1, 1000, 1000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-198]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-198]' OR notes LIKE '[BTH26-XLSX OCT-198] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3417, 3420, 86, 1, 1000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3420) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3420 AND room_id = 86);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1367, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3420, 'cash', 'bth26-hotel-xlsx-OCT-198-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3420) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-198-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4141, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3420
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3420) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3420 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3421, 'bth', 88, '2026-10-14', '2026-10-15', 1, 650, 650, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-199]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-199]' OR notes LIKE '[BTH26-XLSX OCT-199] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3418, 3421, 88, 1, 650, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3421) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3421 AND room_id = 88);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1368, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3421, 'm-pesa', 'bth26-hotel-xlsx-OCT-199-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3421) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-199-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4142, 'bth', NULL, 650, 'Bunk Room (BUNKED)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3421
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3421) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3421 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3422, 'bth', 89, '2026-10-14', '2026-10-15', 1, 1000, 1000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-200]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-200]' OR notes LIKE '[BTH26-XLSX OCT-200] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3419, 3422, 89, 1, 1000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3422) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3422 AND room_id = 89);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1369, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3422, 'cash', 'bth26-hotel-xlsx-OCT-200-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3422) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-200-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4143, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3422
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3422) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3422 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3423, 'bth', 92, '2026-10-14', '2026-10-15', 1, 2500, 2500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-201]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-201]' OR notes LIKE '[BTH26-XLSX OCT-201] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3420, 3423, 92, 1, 2500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3423) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3423 AND room_id = 92);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1370, 'bth', NULL, 2500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3423, 'cash', 'bth26-hotel-xlsx-OCT-201-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3423) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-201-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4144, 'bth', NULL, 2500, 'Executive / Special (S.P)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3423
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3423) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3423 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3424, 'bth', 93, '2026-10-14', '2026-10-15', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-202]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-202]' OR notes LIKE '[BTH26-XLSX OCT-202] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3421, 3424, 93, 1, 1500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3424) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3424 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1371, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3424, 'm-pesa', 'bth26-hotel-xlsx-OCT-202-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3424) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-202-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4145, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3424
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3424) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3424 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3425, 'bth', 94, '2026-10-14', '2026-10-16', 2, 4000, 4000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-203]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-203]' OR notes LIKE '[BTH26-XLSX OCT-203] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3422, 3425, 94, 1, 2000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3425) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3425 AND room_id = 94);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1372, 'bth', NULL, 4000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3425, 'm-pesa', 'bth26-hotel-xlsx-OCT-203-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3425) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-203-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4146, 'bth', NULL, 4000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3425
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3425) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3425 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3426, 'bth', 95, '2026-10-14', '2026-10-15', 1, 2500, 2500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-204]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-204]' OR notes LIKE '[BTH26-XLSX OCT-204] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3423, 3426, 95, 1, 2500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3426) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3426 AND room_id = 95);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1373, 'bth', NULL, 2500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3426, 'cash', 'bth26-hotel-xlsx-OCT-204-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3426) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-204-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4147, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3426
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3426) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3426 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3427, 'bth', 97, '2026-10-14', '2026-10-15', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-205]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-205]' OR notes LIKE '[BTH26-XLSX OCT-205] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3424, 3427, 97, 1, 1000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3427) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3427 AND room_id = 97);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1374, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3427, 'm-pesa', 'bth26-hotel-xlsx-OCT-205-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3427) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-205-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4148, 'bth', NULL, 1000, 'Bunk Room (BUNKED)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3427
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3427) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3427 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3428, 'bth', 99, '2026-10-14', '2026-10-15', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-206]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-206]' OR notes LIKE '[BTH26-XLSX OCT-206] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3425, 3428, 99, 1, 1500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3428) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3428 AND room_id = 99);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1375, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3428, 'm-pesa', 'bth26-hotel-xlsx-OCT-206-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3428) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-206-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4149, 'bth', NULL, 1500, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3428
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3428) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3428 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3429, 'bth', 100, '2026-10-14', '2026-10-15', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-207]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-207]' OR notes LIKE '[BTH26-XLSX OCT-207] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3426, 3429, 100, 1, 1500, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3429) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3429 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1376, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3429, 'm-pesa', 'bth26-hotel-xlsx-OCT-207-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3429) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-207-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4150, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3429
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3429) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3429 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3430, 'bth', 101, '2026-10-14', '2026-10-15', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-208]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-208]' OR notes LIKE '[BTH26-XLSX OCT-208] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3427, 3430, 101, 1, 2000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3430) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3430 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1377, 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3430, 'cash', 'bth26-hotel-xlsx-OCT-208-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3430) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-208-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4151, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3430
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3430) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3430 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3431, 'bth', 102, '2026-10-14', '2026-10-15', 1, 3000, 3000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-209]', '2026-10-14 11:00:00', '2026-10-14 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-209]' OR notes LIKE '[BTH26-XLSX OCT-209] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3428, 3431, 102, 1, 3000, '2026-10-14 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3431) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3431 AND room_id = 102);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1378, 'bth', NULL, 3000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3431, 'cash', 'bth26-hotel-xlsx-OCT-209-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3431) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-209-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4152, 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-14 11:00:00', '2026-10-14 11:00:00', 'hotel', 3431
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3431) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3431 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3432, 'bth', 74, '2026-10-15', '2026-10-16', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-210]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-210]' OR notes LIKE '[BTH26-XLSX OCT-210] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3429, 3432, 74, 1, 1500, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3432) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3432 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1379, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3432, 'cash', 'bth26-hotel-xlsx-OCT-210-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3432) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-210-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4153, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3432
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3432) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3432 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3433, 'bth', 75, '2026-10-15', '2026-10-16', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-211]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-211]' OR notes LIKE '[BTH26-XLSX OCT-211] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3430, 3433, 75, 1, 2000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3433) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3433 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1380, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3433, 'm-pesa', 'bth26-hotel-xlsx-OCT-211-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3433) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-211-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4154, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3433
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3433) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3433 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3434, 'bth', 76, '2026-10-15', '2026-10-16', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-212]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-212]' OR notes LIKE '[BTH26-XLSX OCT-212] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3431, 3434, 76, 1, 2500, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3434) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3434 AND room_id = 76);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1381, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3434, 'm-pesa', 'bth26-hotel-xlsx-OCT-212-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3434) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-212-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4155, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3434
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3434) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3434 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3435, 'bth', 77, '2026-10-15', '2026-10-16', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-213]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-213]' OR notes LIKE '[BTH26-XLSX OCT-213] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3432, 3435, 77, 1, 1000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3435) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3435 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1382, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3435, 'm-pesa', 'bth26-hotel-xlsx-OCT-213-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3435) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-213-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4156, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3435
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3435) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3435 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3436, 'bth', 78, '2026-10-15', '2026-10-16', 1, 600, 600, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-214]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-214]' OR notes LIKE '[BTH26-XLSX OCT-214] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3433, 3436, 78, 1, 600, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3436) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3436 AND room_id = 78);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1383, 'bth', NULL, 600, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3436, 'cash', 'bth26-hotel-xlsx-OCT-214-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3436) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-214-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4157, 'bth', NULL, 600, 'Bunk Room (BUNKED)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3436
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3436) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3436 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3437, 'bth', 79, '2026-10-15', '2026-10-16', 1, 1000, 1000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-215]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-215]' OR notes LIKE '[BTH26-XLSX OCT-215] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3434, 3437, 79, 1, 1000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3437) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3437 AND room_id = 79);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1384, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3437, 'cash', 'bth26-hotel-xlsx-OCT-215-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3437) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-215-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4158, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3437
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3437) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3437 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3438, 'bth', 80, '2026-10-15', '2026-10-16', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-216]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-216]' OR notes LIKE '[BTH26-XLSX OCT-216] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3435, 3438, 80, 1, 1000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3438) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3438 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1385, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3438, 'm-pesa', 'bth26-hotel-xlsx-OCT-216-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3438) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-216-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4159, 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3438
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3438) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3438 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3439, 'bth', 81, '2026-10-15', '2026-10-16', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-217]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-217]' OR notes LIKE '[BTH26-XLSX OCT-217] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3436, 3439, 81, 1, 2000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3439) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3439 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1386, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3439, 'm-pesa', 'bth26-hotel-xlsx-OCT-217-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3439) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-217-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4160, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3439
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3439) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3439 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3440, 'bth', 82, '2026-10-15', '2026-10-16', 1, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-218]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-218]' OR notes LIKE '[BTH26-XLSX OCT-218] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3437, 3440, 82, 1, 3000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3440) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3440 AND room_id = 82);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1387, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3440, 'm-pesa', 'bth26-hotel-xlsx-OCT-218-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3440) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-218-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4161, 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3440
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3440) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3440 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3441, 'bth', 83, '2026-10-15', '2026-10-16', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-219]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-219]' OR notes LIKE '[BTH26-XLSX OCT-219] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3438, 3441, 83, 1, 1500, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3441) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3441 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1388, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3441, 'm-pesa', 'bth26-hotel-xlsx-OCT-219-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3441) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-219-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4162, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3441
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3441) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3441 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3442, 'bth', 84, '2026-10-15', '2026-10-16', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-220]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-220]' OR notes LIKE '[BTH26-XLSX OCT-220] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3439, 3442, 84, 1, 2000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3442) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3442 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1389, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3442, 'm-pesa', 'bth26-hotel-xlsx-OCT-220-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3442) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-220-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4163, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3442
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3442) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3442 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3443, 'bth', 85, '2026-10-15', '2026-10-16', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-221]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-221]' OR notes LIKE '[BTH26-XLSX OCT-221] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3440, 3443, 85, 1, 2500, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3443) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3443 AND room_id = 85);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1390, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3443, 'm-pesa', 'bth26-hotel-xlsx-OCT-221-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3443) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-221-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4164, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3443
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3443) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3443 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3444, 'bth', 86, '2026-10-15', '2026-10-17', 2, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-222]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-222]' OR notes LIKE '[BTH26-XLSX OCT-222] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3441, 3444, 86, 1, 1000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3444) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3444 AND room_id = 86);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1391, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3444, 'm-pesa', 'bth26-hotel-xlsx-OCT-222-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3444) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-222-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4165, 'bth', NULL, 2000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3444
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3444) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3444 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3445, 'bth', 87, '2026-10-15', '2026-10-16', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-223]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-223]' OR notes LIKE '[BTH26-XLSX OCT-223] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3442, 3445, 87, 1, 1000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3445) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3445 AND room_id = 87);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1392, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3445, 'm-pesa', 'bth26-hotel-xlsx-OCT-223-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3445) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-223-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4166, 'bth', NULL, 1000, 'Bunk Room (BUNKED)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3445
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3445) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3445 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3446, 'bth', 88, '2026-10-15', '2026-10-16', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-224]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-224]' OR notes LIKE '[BTH26-XLSX OCT-224] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3443, 3446, 88, 1, 2000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3446) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3446 AND room_id = 88);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1393, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3446, 'm-pesa', 'bth26-hotel-xlsx-OCT-224-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3446) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-224-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4167, 'bth', NULL, 2000, 'Bunk Room (BUNKED)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3446
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3446) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3446 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3447, 'bth', 89, '2026-10-15', '2026-10-16', 1, 1000, 1000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-225]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-225]' OR notes LIKE '[BTH26-XLSX OCT-225] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3444, 3447, 89, 1, 1000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3447) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3447 AND room_id = 89);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1394, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3447, 'cash', 'bth26-hotel-xlsx-OCT-225-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3447) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-225-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4168, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3447
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3447) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3447 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3448, 'bth', 91, '2026-10-15', '2026-10-16', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-226]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-226]' OR notes LIKE '[BTH26-XLSX OCT-226] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3445, 3448, 91, 1, 2000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3448) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3448 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1395, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3448, 'm-pesa', 'bth26-hotel-xlsx-OCT-226-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3448) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-226-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4169, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3448
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3448) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3448 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3449, 'bth', 92, '2026-10-15', '2026-10-16', 1, 3000, 3000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-227]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-227]' OR notes LIKE '[BTH26-XLSX OCT-227] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3446, 3449, 92, 1, 3000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3449) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3449 AND room_id = 92);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1396, 'bth', NULL, 3000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3449, 'cash', 'bth26-hotel-xlsx-OCT-227-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3449) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-227-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4170, 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3449
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3449) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3449 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3450, 'bth', 93, '2026-10-15', '2026-10-16', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-228]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-228]' OR notes LIKE '[BTH26-XLSX OCT-228] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3447, 3450, 93, 1, 1500, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3450) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3450 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1397, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3450, 'cash', 'bth26-hotel-xlsx-OCT-228-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3450) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-228-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4171, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3450
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3450) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3450 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3451, 'bth', 95, '2026-10-15', '2026-10-16', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-229]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-229]' OR notes LIKE '[BTH26-XLSX OCT-229] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3448, 3451, 95, 1, 2500, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3451) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3451 AND room_id = 95);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1398, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3451, 'm-pesa', 'bth26-hotel-xlsx-OCT-229-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3451) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-229-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4172, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3451
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3451) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3451 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3452, 'bth', 96, '2026-10-15', '2026-10-16', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-230]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-230]' OR notes LIKE '[BTH26-XLSX OCT-230] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3449, 3452, 96, 1, 1000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3452) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3452 AND room_id = 96);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1399, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3452, 'm-pesa', 'bth26-hotel-xlsx-OCT-230-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3452) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-230-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4173, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3452
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3452) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3452 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3453, 'bth', 97, '2026-10-15', '2026-10-16', 1, 3200, 3200, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-231]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 4, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-231]' OR notes LIKE '[BTH26-XLSX OCT-231] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3450, 3453, 97, 1, 3200, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3453) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3453 AND room_id = 97);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1400, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3453, 'm-pesa', 'bth26-hotel-xlsx-OCT-231-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3453) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-231-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4174, 'bth', NULL, 3200, 'Bunk Room (BUNKED)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3453
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3453) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3453 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3454, 'bth', 98, '2026-10-15', '2026-10-16', 1, 3200, 3200, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-232]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 4, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-232]' OR notes LIKE '[BTH26-XLSX OCT-232] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3451, 3454, 98, 1, 3200, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3454) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3454 AND room_id = 98);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1401, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3454, 'm-pesa', 'bth26-hotel-xlsx-OCT-232-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3454) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-232-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4175, 'bth', NULL, 3200, 'Bunk Room (BUNKED)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3454
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3454) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3454 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3455, 'bth', 99, '2026-10-15', '2026-10-16', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-233]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-233]' OR notes LIKE '[BTH26-XLSX OCT-233] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3452, 3455, 99, 1, 1000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3455) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3455 AND room_id = 99);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1402, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3455, 'm-pesa', 'bth26-hotel-xlsx-OCT-233-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3455) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-233-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4176, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3455
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3455) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3455 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3456, 'bth', 100, '2026-10-15', '2026-10-16', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-234]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-234]' OR notes LIKE '[BTH26-XLSX OCT-234] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3453, 3456, 100, 1, 1500, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3456) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3456 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1403, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3456, 'm-pesa', 'bth26-hotel-xlsx-OCT-234-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3456) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-234-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4177, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3456
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3456) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3456 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3457, 'bth', 101, '2026-10-15', '2026-10-16', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-235]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-235]' OR notes LIKE '[BTH26-XLSX OCT-235] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3454, 3457, 101, 1, 2000, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3457) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3457 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1404, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3457, 'm-pesa', 'bth26-hotel-xlsx-OCT-235-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3457) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-235-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4178, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3457
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3457) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3457 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3458, 'bth', 102, '2026-10-15', '2026-10-16', 1, 3500, 3500, 'cash+m-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-236]', '2026-10-15 11:00:00', '2026-10-15 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 3, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-236]' OR notes LIKE '[BTH26-XLSX OCT-236] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3455, 3458, 102, 1, 3500, '2026-10-15 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3458) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3458 AND room_id = 102);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1405, 'bth', NULL, 500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3458, 'cash', 'bth26-hotel-xlsx-OCT-236-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3458) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-236-cash');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1406, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3458, 'm-pesa', 'bth26-hotel-xlsx-OCT-236-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3458) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-236-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4179, 'bth', NULL, 3500, 'Executive / Special (S.P)', '2026-10', '2026-10-15 11:00:00', '2026-10-15 11:00:00', 'hotel', 3458
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3458) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3458 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3459, 'bth', 74, '2026-10-16', '2026-10-16', 0, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-237] | Day use (D)', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-237]' OR notes LIKE '[BTH26-XLSX OCT-237] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3456, 3459, 74, 1, 1500, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3459) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3459 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1407, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3459, 'cash', 'bth26-hotel-xlsx-OCT-237-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3459) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-237-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4180, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3459
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3459) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3459 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3460, 'bth', 75, '2026-10-16', '2026-10-17', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-238]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-238]' OR notes LIKE '[BTH26-XLSX OCT-238] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3457, 3460, 75, 1, 2500, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3460) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3460 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1408, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3460, 'm-pesa', 'bth26-hotel-xlsx-OCT-238-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3460) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-238-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4181, 'bth', NULL, 2500, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3460
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3460) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3460 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3461, 'bth', 76, '2026-10-16', '2026-10-17', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-239]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-239]' OR notes LIKE '[BTH26-XLSX OCT-239] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3458, 3461, 76, 1, 2500, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3461) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3461 AND room_id = 76);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1409, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3461, 'm-pesa', 'bth26-hotel-xlsx-OCT-239-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3461) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-239-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4182, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3461
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3461) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3461 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3462, 'bth', 77, '2026-10-16', '2026-10-17', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-240]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-240]' OR notes LIKE '[BTH26-XLSX OCT-240] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3459, 3462, 77, 1, 1000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3462) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3462 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1410, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3462, 'm-pesa', 'bth26-hotel-xlsx-OCT-240-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3462) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-240-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4183, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3462
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3462) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3462 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3463, 'bth', 80, '2026-10-16', '2026-10-17', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-241]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-241]' OR notes LIKE '[BTH26-XLSX OCT-241] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3460, 3463, 80, 1, 1500, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3463) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3463 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1411, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3463, 'm-pesa', 'bth26-hotel-xlsx-OCT-241-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3463) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-241-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4184, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3463
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3463) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3463 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3464, 'bth', 81, '2026-10-16', '2026-10-17', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-242]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-242]' OR notes LIKE '[BTH26-XLSX OCT-242] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3461, 3464, 81, 1, 2000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3464) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3464 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1412, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3464, 'm-pesa', 'bth26-hotel-xlsx-OCT-242-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3464) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-242-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4185, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3464
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3464) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3464 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3465, 'bth', 85, '2026-10-16', '2026-10-17', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-243]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-243]' OR notes LIKE '[BTH26-XLSX OCT-243] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3462, 3465, 85, 1, 2500, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3465) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3465 AND room_id = 85);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1413, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3465, 'm-pesa', 'bth26-hotel-xlsx-OCT-243-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3465) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-243-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4186, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3465
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3465) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3465 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3466, 'bth', 89, '2026-10-16', '2026-10-17', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-244]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-244]' OR notes LIKE '[BTH26-XLSX OCT-244] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3463, 3466, 89, 1, 1000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3466) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3466 AND room_id = 89);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1414, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3466, 'm-pesa', 'bth26-hotel-xlsx-OCT-244-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3466) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-244-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4187, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3466
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3466) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3466 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3467, 'bth', 90, '2026-10-16', '2026-10-17', 1, 1700, 1700, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-245]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-245]' OR notes LIKE '[BTH26-XLSX OCT-245] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3464, 3467, 90, 1, 1700, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3467) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3467 AND room_id = 90);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1415, 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3467, 'm-pesa', 'bth26-hotel-xlsx-OCT-245-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3467) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-245-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4188, 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3467
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3467) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3467 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3468, 'bth', 91, '2026-10-16', '2026-10-17', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-246]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-246]' OR notes LIKE '[BTH26-XLSX OCT-246] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3465, 3468, 91, 1, 2000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3468) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3468 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1416, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3468, 'm-pesa', 'bth26-hotel-xlsx-OCT-246-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3468) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-246-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4189, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3468
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3468) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3468 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3469, 'bth', 93, '2026-10-16', '2026-10-17', 1, 1000, 1000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-247]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-247]' OR notes LIKE '[BTH26-XLSX OCT-247] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3466, 3469, 93, 1, 1000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3469) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3469 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1417, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3469, 'cash', 'bth26-hotel-xlsx-OCT-247-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3469) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-247-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4190, 'bth', NULL, 1000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3469
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3469) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3469 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3470, 'bth', 94, '2026-10-16', '2026-10-17', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-248]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-248]' OR notes LIKE '[BTH26-XLSX OCT-248] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3467, 3470, 94, 1, 2000, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3470) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3470 AND room_id = 94);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1418, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3470, 'm-pesa', 'bth26-hotel-xlsx-OCT-248-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3470) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-248-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4191, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3470
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3470) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3470 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3471, 'bth', 100, '2026-10-16', '2026-10-17', 1, 1200, 1200, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-249]', '2026-10-16 11:00:00', '2026-10-16 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-249]' OR notes LIKE '[BTH26-XLSX OCT-249] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3468, 3471, 100, 1, 1200, '2026-10-16 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3471) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3471 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1419, 'bth', NULL, 1200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3471, 'm-pesa', 'bth26-hotel-xlsx-OCT-249-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3471) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-249-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4192, 'bth', NULL, 1200, 'Single Self-Contained (SSC)', '2026-10', '2026-10-16 11:00:00', '2026-10-16 11:00:00', 'hotel', 3471
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3471) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3471 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3472, 'bth', 74, '2026-10-17', '2026-10-18', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-250]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-250]' OR notes LIKE '[BTH26-XLSX OCT-250] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3469, 3472, 74, 1, 1500, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3472) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3472 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1420, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3472, 'cash', 'bth26-hotel-xlsx-OCT-250-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3472) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-250-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4193, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3472
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3472) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3472 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3473, 'bth', 76, '2026-10-17', '2026-10-18', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-251]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-251]' OR notes LIKE '[BTH26-XLSX OCT-251] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3470, 3473, 76, 1, 2500, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3473) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3473 AND room_id = 76);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1421, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3473, 'm-pesa', 'bth26-hotel-xlsx-OCT-251-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3473) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-251-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4194, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3473
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3473) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3473 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3474, 'bth', 80, '2026-10-17', '2026-10-18', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-252]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-252]' OR notes LIKE '[BTH26-XLSX OCT-252] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3471, 3474, 80, 1, 1500, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3474) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3474 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1422, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3474, 'cash', 'bth26-hotel-xlsx-OCT-252-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3474) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-252-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4195, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3474
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3474) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3474 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3475, 'bth', 81, '2026-10-17', '2026-10-18', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-253]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-253]' OR notes LIKE '[BTH26-XLSX OCT-253] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3472, 3475, 81, 1, 2000, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3475) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3475 AND room_id = 81);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1423, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3475, 'm-pesa', 'bth26-hotel-xlsx-OCT-253-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3475) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-253-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4196, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3475
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3475) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3475 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3476, 'bth', 82, '2026-10-17', '2026-10-18', 1, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-254]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-254]' OR notes LIKE '[BTH26-XLSX OCT-254] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3473, 3476, 82, 1, 3000, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3476) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3476 AND room_id = 82);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1424, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3476, 'm-pesa', 'bth26-hotel-xlsx-OCT-254-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3476) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-254-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4197, 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3476
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3476) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3476 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3477, 'bth', 83, '2026-10-17', '2026-10-18', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-255]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-255]' OR notes LIKE '[BTH26-XLSX OCT-255] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3474, 3477, 83, 1, 1500, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3477) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3477 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1425, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3477, 'cash', 'bth26-hotel-xlsx-OCT-255-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3477) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-255-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4198, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3477
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3477) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3477 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3478, 'bth', 84, '2026-10-17', '2026-10-18', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-256]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-256]' OR notes LIKE '[BTH26-XLSX OCT-256] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3475, 3478, 84, 1, 2000, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3478) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3478 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1426, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3478, 'm-pesa', 'bth26-hotel-xlsx-OCT-256-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3478) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-256-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4199, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3478
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3478) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3478 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3479, 'bth', 90, '2026-10-17', '2026-10-18', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-257]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-257]' OR notes LIKE '[BTH26-XLSX OCT-257] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3476, 3479, 90, 1, 1500, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3479) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3479 AND room_id = 90);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1427, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3479, 'm-pesa', 'bth26-hotel-xlsx-OCT-257-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3479) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-257-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4200, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3479
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3479) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3479 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3480, 'bth', 91, '2026-10-17', '2026-10-18', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-258]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-258]' OR notes LIKE '[BTH26-XLSX OCT-258] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3477, 3480, 91, 1, 2000, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3480) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3480 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1428, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3480, 'm-pesa', 'bth26-hotel-xlsx-OCT-258-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3480) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-258-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4201, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3480
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3480) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3480 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3481, 'bth', 93, '2026-10-17', '2026-10-18', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-259]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-259]' OR notes LIKE '[BTH26-XLSX OCT-259] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3478, 3481, 93, 1, 1500, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3481) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3481 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1429, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3481, 'm-pesa', 'bth26-hotel-xlsx-OCT-259-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3481) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-259-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4202, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3481
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3481) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3481 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3482, 'bth', 95, '2026-10-17', '2026-10-18', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-260]', '2026-10-17 11:00:00', '2026-10-17 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-260]' OR notes LIKE '[BTH26-XLSX OCT-260] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3479, 3482, 95, 1, 2500, '2026-10-17 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3482) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3482 AND room_id = 95);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1430, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3482, 'm-pesa', 'bth26-hotel-xlsx-OCT-260-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3482) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-260-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4203, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-17 11:00:00', '2026-10-17 11:00:00', 'hotel', 3482
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3482) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3482 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3483, 'bth', 74, '2026-10-18', '2026-10-19', 1, 1500, 1500, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-261]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-261]' OR notes LIKE '[BTH26-XLSX OCT-261] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3480, 3483, 74, 1, 1500, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3483) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3483 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1431, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3483, 'cash', 'bth26-hotel-xlsx-OCT-261-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3483) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-261-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4204, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3483
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3483) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3483 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3484, 'bth', 75, '2026-10-18', '2026-10-19', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-262]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-262]' OR notes LIKE '[BTH26-XLSX OCT-262] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3481, 3484, 75, 1, 1500, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3484) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3484 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1432, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3484, 'm-pesa', 'bth26-hotel-xlsx-OCT-262-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3484) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-262-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4205, 'bth', NULL, 1500, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3484
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3484) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3484 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3485, 'bth', 77, '2026-10-18', '2026-10-19', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-263]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-263]' OR notes LIKE '[BTH26-XLSX OCT-263] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3482, 3485, 77, 1, 1000, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3485) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3485 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1433, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3485, 'm-pesa', 'bth26-hotel-xlsx-OCT-263-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3485) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-263-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4206, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3485
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3485) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3485 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3486, 'bth', 80, '2026-10-18', '2026-10-18', 0, 1700, 1700, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-264] | Day use (D)', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-264]' OR notes LIKE '[BTH26-XLSX OCT-264] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3483, 3486, 80, 1, 1700, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3486) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3486 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1434, 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3486, 'm-pesa', 'bth26-hotel-xlsx-OCT-264-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3486) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-264-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4207, 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3486
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3486) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3486 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3487, 'bth', 81, '2026-10-18', '2026-10-19', 1, 2000, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-265]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-265]' OR notes LIKE '[BTH26-XLSX OCT-265] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3484, 3487, 81, 1, 2000, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3487) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3487 AND room_id = 81);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3488, 'bth', 82, '2026-10-18', '2026-10-19', 1, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-266]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-266]' OR notes LIKE '[BTH26-XLSX OCT-266] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3485, 3488, 82, 1, 3000, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3488) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3488 AND room_id = 82);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1435, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3488, 'm-pesa', 'bth26-hotel-xlsx-OCT-266-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3488) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-266-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4208, 'bth', NULL, 3000, 'Executive / Special (S.P)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3488
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3488) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3488 AND package_label = 'Executive / Special (S.P)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3489, 'bth', 83, '2026-10-18', '2026-10-18', 0, 1700, 1700, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-267] | Day use (D)', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-267]' OR notes LIKE '[BTH26-XLSX OCT-267] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3486, 3489, 83, 1, 1700, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3489) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3489 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1436, 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3489, 'm-pesa', 'bth26-hotel-xlsx-OCT-267-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3489) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-267-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4209, 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3489
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3489) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3489 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3490, 'bth', 84, '2026-10-18', '2026-10-19', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-268]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-268]' OR notes LIKE '[BTH26-XLSX OCT-268] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3487, 3490, 84, 1, 2000, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3490) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3490 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1437, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3490, 'm-pesa', 'bth26-hotel-xlsx-OCT-268-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3490) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-268-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4210, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3490
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3490) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3490 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3491, 'bth', 90, '2026-10-18', '2026-10-19', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-269]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-269]' OR notes LIKE '[BTH26-XLSX OCT-269] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3488, 3491, 90, 1, 1500, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3491) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3491 AND room_id = 90);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1438, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3491, 'm-pesa', 'bth26-hotel-xlsx-OCT-269-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3491) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-269-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4211, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3491
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3491) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3491 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3492, 'bth', 91, '2026-10-18', '2026-10-19', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-270]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-270]' OR notes LIKE '[BTH26-XLSX OCT-270] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3489, 3492, 91, 1, 2000, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3492) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3492 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1439, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3492, 'm-pesa', 'bth26-hotel-xlsx-OCT-270-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3492) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-270-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4212, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3492
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3492) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3492 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3493, 'bth', 93, '2026-10-18', '2026-10-19', 1, 1500, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-271]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-271]' OR notes LIKE '[BTH26-XLSX OCT-271] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3490, 3493, 93, 1, 1500, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3493) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3493 AND room_id = 93);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3494, 'bth', 100, '2026-10-18', '2026-10-19', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-272]', '2026-10-18 11:00:00', '2026-10-18 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-272]' OR notes LIKE '[BTH26-XLSX OCT-272] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3491, 3494, 100, 1, 1500, '2026-10-18 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3494) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3494 AND room_id = 100);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1440, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3494, 'm-pesa', 'bth26-hotel-xlsx-OCT-272-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3494) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-272-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4213, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-18 11:00:00', '2026-10-18 11:00:00', 'hotel', 3494
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3494) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3494 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3495, 'bth', 74, '2026-10-19', '2026-10-20', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-273]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-273]' OR notes LIKE '[BTH26-XLSX OCT-273] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3492, 3495, 74, 1, 1500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3495) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3495 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1441, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3495, 'm-pesa', 'bth26-hotel-xlsx-OCT-273-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3495) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-273-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4214, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3495
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3495) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3495 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3496, 'bth', 75, '2026-10-19', '2026-10-20', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-274]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-274]' OR notes LIKE '[BTH26-XLSX OCT-274] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3493, 3496, 75, 1, 1500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3496) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3496 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1442, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3496, 'm-pesa', 'bth26-hotel-xlsx-OCT-274-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3496) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-274-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4215, 'bth', NULL, 1500, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3496
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3496) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3496 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3497, 'bth', 76, '2026-10-19', '2026-10-20', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-275]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-275]' OR notes LIKE '[BTH26-XLSX OCT-275] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3494, 3497, 76, 1, 2500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3497) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3497 AND room_id = 76);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1443, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3497, 'm-pesa', 'bth26-hotel-xlsx-OCT-275-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3497) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-275-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4216, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3497
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3497) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3497 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3498, 'bth', 78, '2026-10-19', '2026-10-20', 1, 650, 650, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-276]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-276]' OR notes LIKE '[BTH26-XLSX OCT-276] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3495, 3498, 78, 1, 650, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3498) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3498 AND room_id = 78);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1444, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3498, 'm-pesa', 'bth26-hotel-xlsx-OCT-276-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3498) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-276-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4217, 'bth', NULL, 650, 'Bunk Room (BUNKED)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3498
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3498) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3498 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3499, 'bth', 80, '2026-10-19', '2026-10-21', 2, 3000, 3000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-277]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-277]' OR notes LIKE '[BTH26-XLSX OCT-277] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3496, 3499, 80, 1, 1500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3499) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3499 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1445, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3499, 'm-pesa', 'bth26-hotel-xlsx-OCT-277-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3499) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-277-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4218, 'bth', NULL, 3000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3499
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3499) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3499 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3500, 'bth', 81, '2026-10-19', '2026-10-20', 1, 2000, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-278]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-278]' OR notes LIKE '[BTH26-XLSX OCT-278] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3497, 3500, 81, 1, 2000, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3500) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3500 AND room_id = 81);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3501, 'bth', 83, '2026-10-19', '2026-10-20', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-279]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-279]' OR notes LIKE '[BTH26-XLSX OCT-279] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3498, 3501, 83, 1, 1500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3501) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3501 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1446, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3501, 'm-pesa', 'bth26-hotel-xlsx-OCT-279-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3501) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-279-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4219, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3501
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3501) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3501 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3502, 'bth', 84, '2026-10-19', '2026-10-20', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-280]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-280]' OR notes LIKE '[BTH26-XLSX OCT-280] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3499, 3502, 84, 1, 1500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3502) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3502 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1447, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3502, 'm-pesa', 'bth26-hotel-xlsx-OCT-280-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3502) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-280-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4220, 'bth', NULL, 1500, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3502
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3502) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3502 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3503, 'bth', 90, '2026-10-19', '2026-10-23', 4, 4000, 4000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-281]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-281]' OR notes LIKE '[BTH26-XLSX OCT-281] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3500, 3503, 90, 1, 1000, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3503) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3503 AND room_id = 90);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1448, 'bth', NULL, 4000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3503, 'm-pesa', 'bth26-hotel-xlsx-OCT-281-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3503) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-281-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4221, 'bth', NULL, 4000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3503
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3503) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3503 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3504, 'bth', 94, '2026-10-19', '2026-10-20', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-282]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-282]' OR notes LIKE '[BTH26-XLSX OCT-282] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3501, 3504, 94, 1, 1500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3504) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3504 AND room_id = 94);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1449, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3504, 'm-pesa', 'bth26-hotel-xlsx-OCT-282-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3504) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-282-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4222, 'bth', NULL, 1500, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3504
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3504) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3504 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3505, 'bth', 100, '2026-10-19', '2026-10-20', 1, 1500, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-283]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-283]' OR notes LIKE '[BTH26-XLSX OCT-283] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3502, 3505, 100, 1, 1500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3505) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3505 AND room_id = 100);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3506, 'bth', 101, '2026-10-19', '2026-10-20', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-284]', '2026-10-19 11:00:00', '2026-10-19 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-284]' OR notes LIKE '[BTH26-XLSX OCT-284] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3503, 3506, 101, 1, 1500, '2026-10-19 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3506) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3506 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1450, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3506, 'm-pesa', 'bth26-hotel-xlsx-OCT-284-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3506) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-284-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4223, 'bth', NULL, 1500, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-19 11:00:00', '2026-10-19 11:00:00', 'hotel', 3506
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3506) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3506 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3507, 'bth', 74, '2026-10-20', '2026-10-21', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-285]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-285]' OR notes LIKE '[BTH26-XLSX OCT-285] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3504, 3507, 74, 1, 1500, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3507) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3507 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1451, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3507, 'm-pesa', 'bth26-hotel-xlsx-OCT-285-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3507) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-285-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4224, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3507
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3507) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3507 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3508, 'bth', 75, '2026-10-20', '2026-10-21', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-286]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-286]' OR notes LIKE '[BTH26-XLSX OCT-286] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3505, 3508, 75, 1, 2000, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3508) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3508 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1452, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3508, 'm-pesa', 'bth26-hotel-xlsx-OCT-286-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3508) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-286-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4225, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3508
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3508) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3508 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3509, 'bth', 77, '2026-10-20', '2026-10-21', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-287]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-287]' OR notes LIKE '[BTH26-XLSX OCT-287] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3506, 3509, 77, 1, 1000, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3509) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3509 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1453, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3509, 'm-pesa', 'bth26-hotel-xlsx-OCT-287-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3509) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-287-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4226, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3509
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3509) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3509 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3510, 'bth', 81, '2026-10-20', '2026-10-21', 1, 2000, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-288]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-288]' OR notes LIKE '[BTH26-XLSX OCT-288] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3507, 3510, 81, 1, 2000, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3510) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3510 AND room_id = 81);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3511, 'bth', 83, '2026-10-20', '2026-10-21', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-289]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-289]' OR notes LIKE '[BTH26-XLSX OCT-289] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3508, 3511, 83, 1, 1500, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3511) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3511 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1454, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3511, 'm-pesa', 'bth26-hotel-xlsx-OCT-289-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3511) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-289-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4227, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3511
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3511) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3511 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3512, 'bth', 86, '2026-10-20', '2026-10-21', 1, 1000, 1000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-290]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-290]' OR notes LIKE '[BTH26-XLSX OCT-290] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3509, 3512, 86, 1, 1000, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3512) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3512 AND room_id = 86);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1455, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3512, 'cash', 'bth26-hotel-xlsx-OCT-290-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3512) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-290-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4228, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3512
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3512) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3512 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3513, 'bth', 91, '2026-10-20', '2026-10-20', 0, 1800, 1800, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-291] | Day use (D)', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-291]' OR notes LIKE '[BTH26-XLSX OCT-291] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3510, 3513, 91, 1, 1800, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3513) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3513 AND room_id = 91);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1456, 'bth', NULL, 1800, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3513, 'm-pesa', 'bth26-hotel-xlsx-OCT-291-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3513) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-291-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4229, 'bth', NULL, 1800, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3513
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3513) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3513 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3514, 'bth', 93, '2026-10-20', '2026-10-20', 0, 1300, 1300, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-292] | Day use (D)', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-292]' OR notes LIKE '[BTH26-XLSX OCT-292] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3511, 3514, 93, 1, 1300, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3514) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3514 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1457, 'bth', NULL, 1300, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3514, 'm-pesa', 'bth26-hotel-xlsx-OCT-292-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3514) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-292-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4230, 'bth', NULL, 1300, 'Single Self-Contained (SSC)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3514
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3514) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3514 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3515, 'bth', 93, '2026-10-20', '2026-10-21', 1, 1700, 1700, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-293]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-293]' OR notes LIKE '[BTH26-XLSX OCT-293] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3512, 3515, 93, 1, 1700, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3515) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3515 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1458, 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3515, 'm-pesa', 'bth26-hotel-xlsx-OCT-293-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3515) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-293-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4231, 'bth', NULL, 1700, 'Single Self-Contained (SSC)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3515
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3515) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3515 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3516, 'bth', 95, '2026-10-20', '2026-10-21', 1, 2500, 2500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-294]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-294]' OR notes LIKE '[BTH26-XLSX OCT-294] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3513, 3516, 95, 1, 2500, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3516) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3516 AND room_id = 95);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1459, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3516, 'm-pesa', 'bth26-hotel-xlsx-OCT-294-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3516) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-294-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4232, 'bth', NULL, 2500, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3516
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3516) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3516 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3517, 'bth', 96, '2026-10-20', '2026-10-21', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-295]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-295]' OR notes LIKE '[BTH26-XLSX OCT-295] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3514, 3517, 96, 1, 1000, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3517) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3517 AND room_id = 96);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1460, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3517, 'm-pesa', 'bth26-hotel-xlsx-OCT-295-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3517) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-295-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4233, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3517
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3517) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3517 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3518, 'bth', 100, '2026-10-20', '2026-10-21', 1, 1500, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-296]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-296]' OR notes LIKE '[BTH26-XLSX OCT-296] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3515, 3518, 100, 1, 1500, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3518) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3518 AND room_id = 100);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3519, 'bth', 101, '2026-10-20', '2026-10-21', 1, 2000, 2000, 'cash', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-297]', '2026-10-20 11:00:00', '2026-10-20 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-297]' OR notes LIKE '[BTH26-XLSX OCT-297] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3516, 3519, 101, 1, 2000, '2026-10-20 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3519) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3519 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1461, 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3519, 'cash', 'bth26-hotel-xlsx-OCT-297-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3519) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-297-cash');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4234, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-20 11:00:00', '2026-10-20 11:00:00', 'hotel', 3519
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3519) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3519 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3520, 'bth', 74, '2026-10-21', '2026-10-22', 1, 3000, 3000, 'cash+m-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-298]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-298]' OR notes LIKE '[BTH26-XLSX OCT-298] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3517, 3520, 74, 1, 3000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3520) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3520 AND room_id = 74);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1462, 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3520, 'cash', 'bth26-hotel-xlsx-OCT-298-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3520) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-298-cash');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1463, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3520, 'm-pesa', 'bth26-hotel-xlsx-OCT-298-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3520) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-298-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4235, 'bth', NULL, 3000, 'Single Self-Contained (SSC)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3520
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3520) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3520 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3521, 'bth', 75, '2026-10-21', '2026-10-31', 10, 20000, 20000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-299]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-299]' OR notes LIKE '[BTH26-XLSX OCT-299] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3518, 3521, 75, 1, 2000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3521) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3521 AND room_id = 75);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1464, 'bth', NULL, 20000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3521, 'm-pesa', 'bth26-hotel-xlsx-OCT-299-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3521) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-299-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4236, 'bth', NULL, 20000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3521
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3521) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3521 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3522, 'bth', 76, '2026-10-21', '2026-10-22', 1, 2300, 2300, 'cash+m-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-300]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 2, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-300]' OR notes LIKE '[BTH26-XLSX OCT-300] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3519, 3522, 76, 1, 2300, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3522) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3522 AND room_id = 76);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1465, 'bth', NULL, 1800, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3522, 'cash', 'bth26-hotel-xlsx-OCT-300-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3522) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-300-cash');
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1466, 'bth', NULL, 500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3522, 'm-pesa', 'bth26-hotel-xlsx-OCT-300-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3522) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-300-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4237, 'bth', NULL, 2300, 'Deluxe Double Ensuite (DEL)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3522
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3522) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3522 AND package_label = 'Deluxe Double Ensuite (DEL)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3523, 'bth', 77, '2026-10-21', '2026-10-23', 2, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-301]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-301]' OR notes LIKE '[BTH26-XLSX OCT-301] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3520, 3523, 77, 1, 1000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3523) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3523 AND room_id = 77);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1467, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3523, 'm-pesa', 'bth26-hotel-xlsx-OCT-301-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3523) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-301-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4238, 'bth', NULL, 2000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3523
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3523) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3523 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3524, 'bth', 79, '2026-10-21', '2026-10-22', 1, 1000, 1000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-302]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-302]' OR notes LIKE '[BTH26-XLSX OCT-302] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3521, 3524, 79, 1, 1000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3524) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3524 AND room_id = 79);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1468, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3524, 'm-pesa', 'bth26-hotel-xlsx-OCT-302-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3524) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-302-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4239, 'bth', NULL, 1000, 'Standard Room, Shared Bath (SRB)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3524
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3524) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3524 AND package_label = 'Standard Room, Shared Bath (SRB)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3525, 'bth', 80, '2026-10-21', '2026-10-22', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-303]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-303]' OR notes LIKE '[BTH26-XLSX OCT-303] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3522, 3525, 80, 1, 1500, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3525) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3525 AND room_id = 80);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1469, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3525, 'm-pesa', 'bth26-hotel-xlsx-OCT-303-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3525) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-303-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4240, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3525
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3525) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3525 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3526, 'bth', 81, '2026-10-21', '2026-10-22', 1, 2000, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-304]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-304]' OR notes LIKE '[BTH26-XLSX OCT-304] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3523, 3526, 81, 1, 2000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3526) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3526 AND room_id = 81);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3527, 'bth', 83, '2026-10-21', '2026-10-22', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-305]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-305]' OR notes LIKE '[BTH26-XLSX OCT-305] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3524, 3527, 83, 1, 1500, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3527) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3527 AND room_id = 83);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1470, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3527, 'm-pesa', 'bth26-hotel-xlsx-OCT-305-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3527) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-305-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4241, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3527
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3527) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3527 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3528, 'bth', 84, '2026-10-21', '2026-10-22', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-306]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-306]' OR notes LIKE '[BTH26-XLSX OCT-306] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3525, 3528, 84, 1, 2000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3528) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3528 AND room_id = 84);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1471, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3528, 'm-pesa', 'bth26-hotel-xlsx-OCT-306-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3528) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-306-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4242, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3528
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3528) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3528 AND package_label = 'Double Room Ensuite (DRE)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3529, 'bth', 88, '2026-10-21', '2026-10-22', 1, 650, 650, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-307]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-307]' OR notes LIKE '[BTH26-XLSX OCT-307] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3526, 3529, 88, 1, 650, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3529) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3529 AND room_id = 88);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1472, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3529, 'm-pesa', 'bth26-hotel-xlsx-OCT-307-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3529) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-307-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4243, 'bth', NULL, 650, 'Bunk Room (BUNKED)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3529
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3529) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3529 AND package_label = 'Bunk Room (BUNKED)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3530, 'bth', 93, '2026-10-21', '2026-10-22', 1, 1500, 1500, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-308]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-308]' OR notes LIKE '[BTH26-XLSX OCT-308] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3527, 3530, 93, 1, 1500, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3530) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3530 AND room_id = 93);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1473, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3530, 'm-pesa', 'bth26-hotel-xlsx-OCT-308-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3530) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-308-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4244, 'bth', NULL, 1500, 'Single Self-Contained (SSC)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3530
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3530) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3530 AND package_label = 'Single Self-Contained (SSC)');
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3531, 'bth', 100, '2026-10-21', '2026-10-22', 1, 1500, 0, 'credit', 'unpaid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-309]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-309]' OR notes LIKE '[BTH26-XLSX OCT-309] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3528, 3531, 100, 1, 1500, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3531) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3531 AND room_id = 100);
INSERT INTO hotel_bookings (id, company_id, room_id, check_in_date, check_out_date, nights, total_amount, amount_paid, payment_method, payment_status, external_company, meal_type, reservation_status, notes, created_at, updated_at, customer_id, primary_guest_name, primary_guest_phone, primary_guest_email, additional_occupants, adults, children, infants, pricing_source, guest_category, currency)
SELECT 3532, 'bth', 101, '2026-10-21', '2026-10-22', 1, 2000, 2000, 'm-pesa', 'paid', NULL, NULL, 'checked_out', '[BTH26-XLSX OCT-310]', '2026-10-21 11:00:00', '2026-10-21 11:00:00', NULL, 'Walk-in', NULL, NULL, '[]'::jsonb, 1, 0, 0, 'manual', 'resident', 'KES'
WHERE NOT EXISTS (SELECT 1 FROM hotel_bookings WHERE company_id = 'bth' AND (notes = '[BTH26-XLSX OCT-310]' OR notes LIKE '[BTH26-XLSX OCT-310] |%'));
INSERT INTO hotel_booking_rooms (id, hotel_booking_id, room_id, quantity, nightly_rate, created_at)
SELECT 3529, 3532, 101, 1, 2000, '2026-10-21 11:00:00'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3532) AND NOT EXISTS (SELECT 1 FROM hotel_booking_rooms WHERE hotel_booking_id = 3532 AND room_id = 101);
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1474, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3532, 'm-pesa', 'bth26-hotel-xlsx-OCT-310-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3532) AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND idempotency_key = 'bth26-hotel-xlsx-OCT-310-mpesa');
INSERT INTO revenue_entries (id, company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 4245, 'bth', NULL, 2000, 'Double Room Ensuite (DRE)', '2026-10', '2026-10-21 11:00:00', '2026-10-21 11:00:00', 'hotel', 3532
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3532) AND NOT EXISTS (SELECT 1 FROM revenue_entries WHERE company_id = 'bth' AND reference_type = 'hotel' AND reference_id = 3532 AND package_label = 'Double Room Ensuite (DRE)');
-- Payments for paid stays already loaded on 1-7 Oct 2026. Those stays already have one revenue row each.
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1475, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-01 11:00:00', '2026-10-01 11:00:00', 'hotel', 3154, 'm-pesa', 'bth26-hotel-xlsx-OCT-2-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3154 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-2-mpesa' OR (reference_type = 'hotel' AND reference_id = 3154 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1476, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-01 11:00:00', '2026-10-01 11:00:00', 'hotel', 3155, 'm-pesa', 'bth26-hotel-xlsx-OCT-3-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3155 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-3-mpesa' OR (reference_type = 'hotel' AND reference_id = 3155 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1477, 'bth', NULL, 700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-01 11:00:00', '2026-10-01 11:00:00', 'hotel', 3156, 'm-pesa', 'bth26-hotel-xlsx-OCT-4-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3156 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-4-mpesa' OR (reference_type = 'hotel' AND reference_id = 3156 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1478, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-01 11:00:00', '2026-10-01 11:00:00', 'hotel', 3157, 'm-pesa', 'bth26-hotel-xlsx-OCT-5-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3157 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-5-mpesa' OR (reference_type = 'hotel' AND reference_id = 3157 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1479, 'bth', NULL, 650, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-01 11:00:00', '2026-10-01 11:00:00', 'hotel', 3158, 'cash', 'bth26-hotel-xlsx-OCT-6-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3158 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-6-cash' OR (reference_type = 'hotel' AND reference_id = 3158 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1480, 'bth', NULL, 650, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-01 11:00:00', '2026-10-01 11:00:00', 'hotel', 3159, 'cash', 'bth26-hotel-xlsx-OCT-7-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3159 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-7-cash' OR (reference_type = 'hotel' AND reference_id = 3159 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1481, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3160, 'm-pesa', 'bth26-hotel-xlsx-OCT-8-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3160 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-8-mpesa' OR (reference_type = 'hotel' AND reference_id = 3160 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1482, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3161, 'm-pesa', 'bth26-hotel-xlsx-OCT-9-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3161 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-9-mpesa' OR (reference_type = 'hotel' AND reference_id = 3161 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1483, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3162, 'm-pesa', 'bth26-hotel-xlsx-OCT-10-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3162 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-10-mpesa' OR (reference_type = 'hotel' AND reference_id = 3162 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1484, 'bth', NULL, 2400, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3163, 'm-pesa', 'bth26-hotel-xlsx-OCT-11-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3163 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-11-mpesa' OR (reference_type = 'hotel' AND reference_id = 3163 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1485, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3164, 'm-pesa', 'bth26-hotel-xlsx-OCT-12-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3164 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-12-mpesa' OR (reference_type = 'hotel' AND reference_id = 3164 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1486, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3165, 'm-pesa', 'bth26-hotel-xlsx-OCT-13-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3165 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-13-mpesa' OR (reference_type = 'hotel' AND reference_id = 3165 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1487, 'bth', NULL, 3000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3166, 'cash', 'bth26-hotel-xlsx-OCT-14-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3166 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-14-cash' OR (reference_type = 'hotel' AND reference_id = 3166 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1488, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3167, 'm-pesa', 'bth26-hotel-xlsx-OCT-15-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3167 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-15-mpesa' OR (reference_type = 'hotel' AND reference_id = 3167 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1489, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3168, 'm-pesa', 'bth26-hotel-xlsx-OCT-16-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3168 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-16-mpesa' OR (reference_type = 'hotel' AND reference_id = 3168 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1490, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3169, 'm-pesa', 'bth26-hotel-xlsx-OCT-17-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3169 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-17-mpesa' OR (reference_type = 'hotel' AND reference_id = 3169 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1491, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3170, 'm-pesa', 'bth26-hotel-xlsx-OCT-18-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3170 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-18-mpesa' OR (reference_type = 'hotel' AND reference_id = 3170 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1492, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3171, 'm-pesa', 'bth26-hotel-xlsx-OCT-19-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3171 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-19-mpesa' OR (reference_type = 'hotel' AND reference_id = 3171 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1493, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3172, 'm-pesa', 'bth26-hotel-xlsx-OCT-20-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3172 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-20-mpesa' OR (reference_type = 'hotel' AND reference_id = 3172 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1494, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3173, 'm-pesa', 'bth26-hotel-xlsx-OCT-21-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3173 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-21-mpesa' OR (reference_type = 'hotel' AND reference_id = 3173 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1495, 'bth', NULL, 2900, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3174, 'm-pesa', 'bth26-hotel-xlsx-OCT-22-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3174 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-22-mpesa' OR (reference_type = 'hotel' AND reference_id = 3174 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1496, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3175, 'm-pesa', 'bth26-hotel-xlsx-OCT-23-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3175 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-23-mpesa' OR (reference_type = 'hotel' AND reference_id = 3175 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1497, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3176, 'm-pesa', 'bth26-hotel-xlsx-OCT-24-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3176 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-24-mpesa' OR (reference_type = 'hotel' AND reference_id = 3176 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1498, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3177, 'm-pesa', 'bth26-hotel-xlsx-OCT-25-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3177 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-25-mpesa' OR (reference_type = 'hotel' AND reference_id = 3177 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1499, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3178, 'm-pesa', 'bth26-hotel-xlsx-OCT-26-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3178 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-26-mpesa' OR (reference_type = 'hotel' AND reference_id = 3178 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1500, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3179, 'm-pesa', 'bth26-hotel-xlsx-OCT-27-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3179 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-27-mpesa' OR (reference_type = 'hotel' AND reference_id = 3179 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1501, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3180, 'm-pesa', 'bth26-hotel-xlsx-OCT-28-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3180 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-28-mpesa' OR (reference_type = 'hotel' AND reference_id = 3180 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1502, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3181, 'm-pesa', 'bth26-hotel-xlsx-OCT-29-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3181 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-29-mpesa' OR (reference_type = 'hotel' AND reference_id = 3181 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1503, 'bth', NULL, 3500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-02 11:00:00', '2026-10-02 11:00:00', 'hotel', 3182, 'm-pesa', 'bth26-hotel-xlsx-OCT-30-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3182 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-30-mpesa' OR (reference_type = 'hotel' AND reference_id = 3182 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1504, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3183, 'm-pesa', 'bth26-hotel-xlsx-OCT-31-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3183 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-31-mpesa' OR (reference_type = 'hotel' AND reference_id = 3183 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1505, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3184, 'm-pesa', 'bth26-hotel-xlsx-OCT-32-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3184 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-32-mpesa' OR (reference_type = 'hotel' AND reference_id = 3184 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1506, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3185, 'm-pesa', 'bth26-hotel-xlsx-OCT-33-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3185 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-33-mpesa' OR (reference_type = 'hotel' AND reference_id = 3185 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1507, 'bth', NULL, 500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3186, 'm-pesa', 'bth26-hotel-xlsx-OCT-34-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3186 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-34-mpesa' OR (reference_type = 'hotel' AND reference_id = 3186 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1508, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3187, 'cash', 'bth26-hotel-xlsx-OCT-35-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3187 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-35-cash' OR (reference_type = 'hotel' AND reference_id = 3187 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1509, 'bth', NULL, 2400, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3188, 'm-pesa', 'bth26-hotel-xlsx-OCT-36-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3188 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-36-mpesa' OR (reference_type = 'hotel' AND reference_id = 3188 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1510, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3189, 'm-pesa', 'bth26-hotel-xlsx-OCT-37-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3189 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-37-mpesa' OR (reference_type = 'hotel' AND reference_id = 3189 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1511, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3190, 'm-pesa', 'bth26-hotel-xlsx-OCT-38-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3190 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-38-mpesa' OR (reference_type = 'hotel' AND reference_id = 3190 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1512, 'bth', NULL, 6000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3191, 'm-pesa', 'bth26-hotel-xlsx-OCT-39-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3191 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-39-mpesa' OR (reference_type = 'hotel' AND reference_id = 3191 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1513, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3192, 'm-pesa', 'bth26-hotel-xlsx-OCT-40-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3192 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-40-mpesa' OR (reference_type = 'hotel' AND reference_id = 3192 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1514, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3193, 'm-pesa', 'bth26-hotel-xlsx-OCT-41-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3193 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-41-mpesa' OR (reference_type = 'hotel' AND reference_id = 3193 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1515, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3194, 'm-pesa', 'bth26-hotel-xlsx-OCT-42-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3194 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-42-mpesa' OR (reference_type = 'hotel' AND reference_id = 3194 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1516, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3195, 'm-pesa', 'bth26-hotel-xlsx-OCT-43-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3195 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-43-mpesa' OR (reference_type = 'hotel' AND reference_id = 3195 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1517, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3196, 'm-pesa', 'bth26-hotel-xlsx-OCT-44-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3196 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-44-mpesa' OR (reference_type = 'hotel' AND reference_id = 3196 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1518, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3197, 'm-pesa', 'bth26-hotel-xlsx-OCT-45-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3197 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-45-mpesa' OR (reference_type = 'hotel' AND reference_id = 3197 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1519, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3198, 'm-pesa', 'bth26-hotel-xlsx-OCT-46-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3198 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-46-mpesa' OR (reference_type = 'hotel' AND reference_id = 3198 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1520, 'bth', NULL, 1900, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3199, 'cash', 'bth26-hotel-xlsx-OCT-47-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3199 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-47-cash' OR (reference_type = 'hotel' AND reference_id = 3199 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1521, 'bth', NULL, 2900, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3200, 'm-pesa', 'bth26-hotel-xlsx-OCT-48-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3200 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-48-mpesa' OR (reference_type = 'hotel' AND reference_id = 3200 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1522, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3201, 'm-pesa', 'bth26-hotel-xlsx-OCT-49-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3201 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-49-mpesa' OR (reference_type = 'hotel' AND reference_id = 3201 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1523, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3202, 'm-pesa', 'bth26-hotel-xlsx-OCT-50-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3202 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-50-mpesa' OR (reference_type = 'hotel' AND reference_id = 3202 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1524, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3203, 'm-pesa', 'bth26-hotel-xlsx-OCT-51-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3203 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-51-mpesa' OR (reference_type = 'hotel' AND reference_id = 3203 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1525, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3204, 'm-pesa', 'bth26-hotel-xlsx-OCT-52-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3204 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-52-mpesa' OR (reference_type = 'hotel' AND reference_id = 3204 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1526, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3205, 'm-pesa', 'bth26-hotel-xlsx-OCT-53-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3205 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-53-mpesa' OR (reference_type = 'hotel' AND reference_id = 3205 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1527, 'bth', NULL, 3200, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3206, 'm-pesa', 'bth26-hotel-xlsx-OCT-54-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3206 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-54-mpesa' OR (reference_type = 'hotel' AND reference_id = 3206 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1528, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3207, 'm-pesa', 'bth26-hotel-xlsx-OCT-55-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3207 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-55-mpesa' OR (reference_type = 'hotel' AND reference_id = 3207 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1529, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3208, 'm-pesa', 'bth26-hotel-xlsx-OCT-56-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3208 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-56-mpesa' OR (reference_type = 'hotel' AND reference_id = 3208 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1530, 'bth', NULL, 3500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-03 11:00:00', '2026-10-03 11:00:00', 'hotel', 3209, 'm-pesa', 'bth26-hotel-xlsx-OCT-57-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3209 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-57-mpesa' OR (reference_type = 'hotel' AND reference_id = 3209 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1531, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3210, 'cash', 'bth26-hotel-xlsx-OCT-58-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3210 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-58-cash' OR (reference_type = 'hotel' AND reference_id = 3210 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1532, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3211, 'm-pesa', 'bth26-hotel-xlsx-OCT-59-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3211 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-59-mpesa' OR (reference_type = 'hotel' AND reference_id = 3211 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1533, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3212, 'm-pesa', 'bth26-hotel-xlsx-OCT-60-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3212 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-60-mpesa' OR (reference_type = 'hotel' AND reference_id = 3212 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1534, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3213, 'm-pesa', 'bth26-hotel-xlsx-OCT-61-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3213 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-61-mpesa' OR (reference_type = 'hotel' AND reference_id = 3213 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1535, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3214, 'm-pesa', 'bth26-hotel-xlsx-OCT-62-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3214 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-62-mpesa' OR (reference_type = 'hotel' AND reference_id = 3214 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1536, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3216, 'm-pesa', 'bth26-hotel-xlsx-OCT-64-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3216 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-64-mpesa' OR (reference_type = 'hotel' AND reference_id = 3216 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1537, 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3217, 'm-pesa', 'bth26-hotel-xlsx-OCT-65-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3217 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-65-mpesa' OR (reference_type = 'hotel' AND reference_id = 3217 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1538, 'bth', NULL, 2300, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3218, 'm-pesa', 'bth26-hotel-xlsx-OCT-66-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3218 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-66-mpesa' OR (reference_type = 'hotel' AND reference_id = 3218 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1539, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3219, 'm-pesa', 'bth26-hotel-xlsx-OCT-67-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3219 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-67-mpesa' OR (reference_type = 'hotel' AND reference_id = 3219 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1540, 'bth', NULL, 1200, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3220, 'cash', 'bth26-hotel-xlsx-OCT-68-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3220 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-68-cash' OR (reference_type = 'hotel' AND reference_id = 3220 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1541, 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3221, 'cash', 'bth26-hotel-xlsx-OCT-69-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3221 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-69-cash' OR (reference_type = 'hotel' AND reference_id = 3221 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1542, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3222, 'm-pesa', 'bth26-hotel-xlsx-OCT-70-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3222 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-70-mpesa' OR (reference_type = 'hotel' AND reference_id = 3222 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1543, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3223, 'm-pesa', 'bth26-hotel-xlsx-OCT-71-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3223 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-71-mpesa' OR (reference_type = 'hotel' AND reference_id = 3223 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1544, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-04 11:00:00', '2026-10-04 11:00:00', 'hotel', 3224, 'm-pesa', 'bth26-hotel-xlsx-OCT-72-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3224 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-72-mpesa' OR (reference_type = 'hotel' AND reference_id = 3224 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1545, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-05 11:00:00', '2026-10-05 11:00:00', 'hotel', 3225, 'cash', 'bth26-hotel-xlsx-OCT-73-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3225 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-73-cash' OR (reference_type = 'hotel' AND reference_id = 3225 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1546, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-05 11:00:00', '2026-10-05 11:00:00', 'hotel', 3226, 'm-pesa', 'bth26-hotel-xlsx-OCT-74-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3226 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-74-mpesa' OR (reference_type = 'hotel' AND reference_id = 3226 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1547, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-05 11:00:00', '2026-10-05 11:00:00', 'hotel', 3227, 'm-pesa', 'bth26-hotel-xlsx-OCT-75-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3227 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-75-mpesa' OR (reference_type = 'hotel' AND reference_id = 3227 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1548, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-05 11:00:00', '2026-10-05 11:00:00', 'hotel', 3229, 'm-pesa', 'bth26-hotel-xlsx-OCT-77-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3229 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-77-mpesa' OR (reference_type = 'hotel' AND reference_id = 3229 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1549, 'bth', NULL, 4000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-05 11:00:00', '2026-10-05 11:00:00', 'hotel', 3230, 'm-pesa', 'bth26-hotel-xlsx-OCT-78-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3230 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-78-mpesa' OR (reference_type = 'hotel' AND reference_id = 3230 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1550, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-05 11:00:00', '2026-10-05 11:00:00', 'hotel', 3231, 'cash', 'bth26-hotel-xlsx-OCT-79-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3231 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-79-cash' OR (reference_type = 'hotel' AND reference_id = 3231 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1551, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3232, 'cash', 'bth26-hotel-xlsx-OCT-80-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3232 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-80-cash' OR (reference_type = 'hotel' AND reference_id = 3232 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1552, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3233, 'm-pesa', 'bth26-hotel-xlsx-OCT-81-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3233 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-81-mpesa' OR (reference_type = 'hotel' AND reference_id = 3233 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1553, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3234, 'm-pesa', 'bth26-hotel-xlsx-OCT-82-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3234 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-82-mpesa' OR (reference_type = 'hotel' AND reference_id = 3234 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1554, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3235, 'cash', 'bth26-hotel-xlsx-OCT-83-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3235 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-83-cash' OR (reference_type = 'hotel' AND reference_id = 3235 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1555, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3236, 'm-pesa', 'bth26-hotel-xlsx-OCT-84-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3236 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-84-mpesa' OR (reference_type = 'hotel' AND reference_id = 3236 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1556, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3237, 'cash', 'bth26-hotel-xlsx-OCT-85-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3237 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-85-cash' OR (reference_type = 'hotel' AND reference_id = 3237 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1557, 'bth', NULL, 3000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3238, 'm-pesa', 'bth26-hotel-xlsx-OCT-86-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3238 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-86-mpesa' OR (reference_type = 'hotel' AND reference_id = 3238 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1558, 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3240, 'cash', 'bth26-hotel-xlsx-OCT-88-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3240 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-88-cash' OR (reference_type = 'hotel' AND reference_id = 3240 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1559, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3241, 'cash', 'bth26-hotel-xlsx-OCT-89-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3241 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-89-cash' OR (reference_type = 'hotel' AND reference_id = 3241 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1560, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3241, 'm-pesa', 'bth26-hotel-xlsx-OCT-89-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3241 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-89-mpesa' OR (reference_type = 'hotel' AND reference_id = 3241 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1561, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3242, 'm-pesa', 'bth26-hotel-xlsx-OCT-90-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3242 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-90-mpesa' OR (reference_type = 'hotel' AND reference_id = 3242 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1562, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3243, 'cash', 'bth26-hotel-xlsx-OCT-91-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3243 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-91-cash' OR (reference_type = 'hotel' AND reference_id = 3243 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1563, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3244, 'm-pesa', 'bth26-hotel-xlsx-OCT-92-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3244 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-92-mpesa' OR (reference_type = 'hotel' AND reference_id = 3244 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1564, 'bth', NULL, 650, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3245, 'm-pesa', 'bth26-hotel-xlsx-OCT-93-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3245 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-93-mpesa' OR (reference_type = 'hotel' AND reference_id = 3245 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1565, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3246, 'm-pesa', 'bth26-hotel-xlsx-OCT-94-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3246 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-94-mpesa' OR (reference_type = 'hotel' AND reference_id = 3246 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1566, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3247, 'm-pesa', 'bth26-hotel-xlsx-OCT-95-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3247 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-95-mpesa' OR (reference_type = 'hotel' AND reference_id = 3247 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1567, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3248, 'm-pesa', 'bth26-hotel-xlsx-OCT-96-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3248 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-96-mpesa' OR (reference_type = 'hotel' AND reference_id = 3248 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1568, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3249, 'm-pesa', 'bth26-hotel-xlsx-OCT-97-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3249 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-97-mpesa' OR (reference_type = 'hotel' AND reference_id = 3249 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1569, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3250, 'm-pesa', 'bth26-hotel-xlsx-OCT-98-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3250 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-98-mpesa' OR (reference_type = 'hotel' AND reference_id = 3250 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1570, 'bth', NULL, 650, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3251, 'cash', 'bth26-hotel-xlsx-OCT-99-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3251 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-99-cash' OR (reference_type = 'hotel' AND reference_id = 3251 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1571, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3252, 'm-pesa', 'bth26-hotel-xlsx-OCT-100-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3252 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-100-mpesa' OR (reference_type = 'hotel' AND reference_id = 3252 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1572, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-06 11:00:00', '2026-10-06 11:00:00', 'hotel', 3253, 'm-pesa', 'bth26-hotel-xlsx-OCT-101-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3253 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-101-mpesa' OR (reference_type = 'hotel' AND reference_id = 3253 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1573, 'bth', NULL, 1500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-07 11:00:00', '2026-10-07 11:00:00', 'hotel', 3254, 'm-pesa', 'bth26-hotel-xlsx-OCT-102-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3254 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-102-mpesa' OR (reference_type = 'hotel' AND reference_id = 3254 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1574, 'bth', NULL, 2500, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-07 11:00:00', '2026-10-07 11:00:00', 'hotel', 3255, 'm-pesa', 'bth26-hotel-xlsx-OCT-103-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3255 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-103-mpesa' OR (reference_type = 'hotel' AND reference_id = 3255 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1575, 'bth', NULL, 1000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-07 11:00:00', '2026-10-07 11:00:00', 'hotel', 3256, 'm-pesa', 'bth26-hotel-xlsx-OCT-104-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3256 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-104-mpesa' OR (reference_type = 'hotel' AND reference_id = 3256 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1576, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-07 11:00:00', '2026-10-07 11:00:00', 'hotel', 3257, 'cash', 'bth26-hotel-xlsx-OCT-105-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3257 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-105-cash' OR (reference_type = 'hotel' AND reference_id = 3257 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1577, 'bth', NULL, 1700, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-07 11:00:00', '2026-10-07 11:00:00', 'hotel', 3259, 'm-pesa', 'bth26-hotel-xlsx-OCT-107-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3259 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-107-mpesa' OR (reference_type = 'hotel' AND reference_id = 3259 AND method = 'm-pesa')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1578, 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-07 11:00:00', '2026-10-07 11:00:00', 'hotel', 3260, 'cash', 'bth26-hotel-xlsx-OCT-108-cash'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3260 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-108-cash' OR (reference_type = 'hotel' AND reference_id = 3260 AND method = 'cash')));
INSERT INTO payments (id, company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 1579, 'bth', NULL, 2000, 'KES', 'completed', 'm-pesa', 'Imported from bth_oct_hotel_stays.xlsx', '2026-10-07 11:00:00', '2026-10-07 11:00:00', 'hotel', 3261, 'm-pesa', 'bth26-hotel-xlsx-OCT-109-mpesa'
WHERE EXISTS (SELECT 1 FROM hotel_bookings WHERE id = 3261 AND company_id = 'bth') AND NOT EXISTS (SELECT 1 FROM payments WHERE company_id = 'bth' AND (idempotency_key = 'bth26-hotel-xlsx-OCT-109-mpesa' OR (reference_type = 'hotel' AND reference_id = 3261 AND method = 'm-pesa')));
SELECT setval('restaurant_orders_id_seq', (SELECT MAX(id) FROM restaurant_orders));
SELECT setval('restaurant_order_items_id_seq', (SELECT MAX(id) FROM restaurant_order_items));
SELECT setval('bar_orders_id_seq', (SELECT MAX(id) FROM bar_orders));
SELECT setval('bar_order_items_id_seq', (SELECT MAX(id) FROM bar_order_items));
SELECT setval('hotel_bookings_id_seq', (SELECT MAX(id) FROM hotel_bookings));
SELECT setval('hotel_booking_rooms_id_seq', (SELECT MAX(id) FROM hotel_booking_rooms));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('revenue_entries_id_seq', (SELECT MAX(id) FROM revenue_entries));
SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));
COMMIT;
