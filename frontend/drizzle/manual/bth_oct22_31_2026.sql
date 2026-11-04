-- BTH restaurant and bar daily sheets, 22-31 Oct 2026.
-- Compared with the live Supabase rows for company bth on 1 Nov 2026.
-- Restaurant tokens OCT-2 through OCT-22 (1-21 Oct) and bar tokens OCT-2
-- through OCT-22 already match these sheets, including credits on 2 Oct and
-- 20 Oct. Those days are not inserted again.
-- Bar 2 Oct is a zero day and was already omitted. This file does not add it.
-- New tokens are OCT-23 through OCT-32 (22-31 Oct).
-- Credit is added to the order total and the order is partially_paid.
-- Cash and M-PESA are completed payments. A zero tender is omitted.
-- A day with expenses and no sales gets an expense only (bar 27 Oct and 29 Oct).
-- Each statement skips a row when its token, idempotency key, or expense
-- description is already stored.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM restaurant_items WHERE id = 3 AND company_id = 'bth') THEN
    RAISE EXCEPTION 'BTH restaurant item 3 is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bar_items WHERE id = 10 AND company_id = 'bth') THEN
    RAISE EXCEPTION 'BTH bar item 10 is missing';
  END IF;
END $$;

SELECT setval('restaurant_orders_id_seq', (SELECT MAX(id) FROM restaurant_orders));
SELECT setval('restaurant_order_items_id_seq', (SELECT MAX(id) FROM restaurant_order_items));
SELECT setval('bar_orders_id_seq', (SELECT MAX(id) FROM bar_orders));
SELECT setval('bar_order_items_id_seq', (SELECT MAX(id) FROM bar_order_items));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('revenue_entries_id_seq', (SELECT MAX(id) FROM revenue_entries));
SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));

INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-23]', '2026-10-22 11:00:00', '2026-10-22 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-23]' OR notes LIKE '[BTH26-REST-XLSX OCT-23] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 4500, 4500, NULL, '2026-10-22 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-23]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1400, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-23-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-23]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-23-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1400, 'Restaurant sales (cash)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-23]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 3100, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-23-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-23]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-23-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 3100, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-23]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 440, '[BTH26-REST-XLSX OCT-23] Restaurant expenses (daily sheet)', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-23] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-24]', '2026-10-23 11:00:00', '2026-10-23 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-24]' OR notes LIKE '[BTH26-REST-XLSX OCT-24] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 3325, 3325, NULL, '2026-10-23 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-24]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-24] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 650, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-24-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-24]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-24] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-24-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 650, 'Restaurant sales (cash)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-24]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-24] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2675, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-24-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-24]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-24] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-24-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2675, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-24]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-24] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 4225, '[BTH26-REST-XLSX OCT-24] Restaurant expenses (daily sheet)', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-24] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-25]', '2026-10-24 11:00:00', '2026-10-24 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-25]' OR notes LIKE '[BTH26-REST-XLSX OCT-25] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 2860, 2860, NULL, '2026-10-24 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-25]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1700, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-25-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-25]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-25-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1700, 'Restaurant sales (cash)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-25]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1160, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-25-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-25]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-25-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1160, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-25]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 800, '[BTH26-REST-XLSX OCT-25] Restaurant expenses (daily sheet)', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-25] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-26]', '2026-10-25 11:00:00', '2026-10-25 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-26]' OR notes LIKE '[BTH26-REST-XLSX OCT-26] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 3700, 3700, NULL, '2026-10-25 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-26]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-26] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2300, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-26-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-26]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-26] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-26-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2300, 'Restaurant sales (cash)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-26]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-26] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1400, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-26-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-26]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-26] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-26-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1400, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-26]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-26] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 1645, '[BTH26-REST-XLSX OCT-26] Restaurant expenses (daily sheet)', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-26] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'partially_paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-27] | Credit KES 1350 (DIRECTOR)', '2026-10-26 11:00:00', '2026-10-26 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-27]' OR notes LIKE '[BTH26-REST-XLSX OCT-27] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 8050, 8050, NULL, '2026-10-26 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-27]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-27] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1300, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-27-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-27]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-27] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-27-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1300, 'Restaurant sales (cash)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-27]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-27] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 5400, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-27-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-27]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-27] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-27-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 5400, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-27]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-27] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 6605, '[BTH26-REST-XLSX OCT-27] Restaurant expenses (daily sheet)', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-27] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-28]', '2026-10-27 11:00:00', '2026-10-27 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-28]' OR notes LIKE '[BTH26-REST-XLSX OCT-28] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 3900, 3900, NULL, '2026-10-27 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-28]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-28] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 200, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-28-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-28]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-28] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-28-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 200, 'Restaurant sales (cash)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-28]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-28] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 3700, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-28-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-28]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-28] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-28-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 3700, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-28]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-28] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 65, '[BTH26-REST-XLSX OCT-28] Restaurant expenses (daily sheet)', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-28] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-29]', '2026-10-28 11:00:00', '2026-10-28 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-29]' OR notes LIKE '[BTH26-REST-XLSX OCT-29] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 9245, 9245, NULL, '2026-10-28 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-29]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-29] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2345, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-29-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-29]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-29] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-29-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2345, 'Restaurant sales (cash)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-29]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-29] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 6900, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-29-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-29]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-29] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-29-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 6900, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-29]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-29] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 2680, '[BTH26-REST-XLSX OCT-29] Restaurant expenses (daily sheet)', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-29] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-30]', '2026-10-29 11:00:00', '2026-10-29 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-30]' OR notes LIKE '[BTH26-REST-XLSX OCT-30] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 9145, 9145, NULL, '2026-10-29 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-30]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-30] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 4020, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-30-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-30]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-30] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-30-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 4020, 'Restaurant sales (cash)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-30]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-30] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 5125, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-30-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-30]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-30] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-30-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 5125, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-30]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-30] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 3513, '[BTH26-REST-XLSX OCT-30] Restaurant expenses (daily sheet)', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-30] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'partially_paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-31] | Credit KES 1900 (ANDREW)', '2026-10-30 11:00:00', '2026-10-30 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-31]' OR notes LIKE '[BTH26-REST-XLSX OCT-31] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 7525, 7525, NULL, '2026-10-30 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-31]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1400, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-31-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-31]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-31-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1400, 'Restaurant sales (cash)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-31]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 4225, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-31-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-31]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-31-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 4225, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-31]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 4874, '[BTH26-REST-XLSX OCT-31] Restaurant expenses (daily sheet)', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-31] Restaurant expenses (daily sheet)'
);
INSERT INTO restaurant_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-REST-XLSX OCT-32]', '2026-10-31 11:00:00', '2026-10-31 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM restaurant_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-REST-XLSX OCT-32]' OR notes LIKE '[BTH26-REST-XLSX OCT-32] |%')
);
INSERT INTO restaurant_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 3, 1, 5850, 5850, NULL, '2026-10-31 11:00:00'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-32]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-32] |%')
  AND NOT EXISTS (
    SELECT 1 FROM restaurant_order_items i
    WHERE i.order_id = o.id AND i.item_id = 3
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2600, 'KES', 'completed', 'cash', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'restaurant', o.id, 'cash', 'bth26-rest-xlsx-OCT-32-cash'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-32]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-32] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-32-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2600, 'Restaurant sales (cash)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-32]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-32] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 3250, 'KES', 'completed', 'm-pesa', 'Imported from RESTAURANT_TEMPLATE_2026.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'restaurant', o.id, 'm-pesa', 'bth26-rest-xlsx-OCT-32-mpesa'
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-32]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-32] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-rest-xlsx-OCT-32-mpesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 3250, 'Restaurant sales (m-pesa)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'restaurant', o.id
FROM restaurant_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-REST-XLSX OCT-32]' OR o.notes LIKE '[BTH26-REST-XLSX OCT-32] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'restaurant'
      AND r.reference_id = o.id
      AND r.package_label = 'Restaurant sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Restaurant', 1950, '[BTH26-REST-XLSX OCT-32] Restaurant expenses (daily sheet)', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'restaurant', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-REST-XLSX OCT-32] Restaurant expenses (daily sheet)'
);
INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-23]', '2026-10-22 11:00:00', '2026-10-22 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM bar_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-BAR-XLSX OCT-23]' OR notes LIKE '[BTH26-BAR-XLSX OCT-23] |%')
);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 10, 1, 900, 900, NULL, '2026-10-22 11:00:00'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-23]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM bar_order_items i
    WHERE i.order_id = o.id AND i.item_id = 10
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 600, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'bar', o.id, 'cash', 'bth26-bar-xlsx-OCT-23-cash'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-23]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-23-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 600, 'Bar sales (cash)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-23]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 300, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'bar', o.id, 'm-pesa', 'bth26-bar-xlsx-OCT-23-m-pesa'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-23]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-23-m-pesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 300, 'Bar sales (m-pesa)', '2026-10', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-23]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-23] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Bar', 2080, '[BTH26-BAR-XLSX OCT-23] Bar expenses (daily sheet)', '2026-10-22 11:00:00', '2026-10-22 11:00:00', 'bar', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-BAR-XLSX OCT-23] Bar expenses (daily sheet)'
);
INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-24]', '2026-10-23 11:00:00', '2026-10-23 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM bar_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-BAR-XLSX OCT-24]' OR notes LIKE '[BTH26-BAR-XLSX OCT-24] |%')
);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 10, 1, 300, 300, NULL, '2026-10-23 11:00:00'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-24]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-24] |%')
  AND NOT EXISTS (
    SELECT 1 FROM bar_order_items i
    WHERE i.order_id = o.id AND i.item_id = 10
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 300, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'bar', o.id, 'cash', 'bth26-bar-xlsx-OCT-24-cash'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-24]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-24] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-24-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 300, 'Bar sales (cash)', '2026-10', '2026-10-23 11:00:00', '2026-10-23 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-24]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-24] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (cash)'
  );
INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-25]', '2026-10-24 11:00:00', '2026-10-24 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM bar_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-BAR-XLSX OCT-25]' OR notes LIKE '[BTH26-BAR-XLSX OCT-25] |%')
);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 10, 1, 6200, 6200, NULL, '2026-10-24 11:00:00'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-25]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM bar_order_items i
    WHERE i.order_id = o.id AND i.item_id = 10
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1500, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'bar', o.id, 'cash', 'bth26-bar-xlsx-OCT-25-cash'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-25]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-25-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1500, 'Bar sales (cash)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-25]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 4700, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'bar', o.id, 'm-pesa', 'bth26-bar-xlsx-OCT-25-m-pesa'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-25]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-25-m-pesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 4700, 'Bar sales (m-pesa)', '2026-10', '2026-10-24 11:00:00', '2026-10-24 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-25]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-25] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (m-pesa)'
  );
INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-26]', '2026-10-25 11:00:00', '2026-10-25 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM bar_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-BAR-XLSX OCT-26]' OR notes LIKE '[BTH26-BAR-XLSX OCT-26] |%')
);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 10, 1, 1350, 1350, NULL, '2026-10-25 11:00:00'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-26]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-26] |%')
  AND NOT EXISTS (
    SELECT 1 FROM bar_order_items i
    WHERE i.order_id = o.id AND i.item_id = 10
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1350, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'bar', o.id, 'cash', 'bth26-bar-xlsx-OCT-26-cash'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-26]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-26] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-26-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1350, 'Bar sales (cash)', '2026-10', '2026-10-25 11:00:00', '2026-10-25 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-26]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-26] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (cash)'
  );
INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-27]', '2026-10-26 11:00:00', '2026-10-26 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM bar_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-BAR-XLSX OCT-27]' OR notes LIKE '[BTH26-BAR-XLSX OCT-27] |%')
);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 10, 1, 2100, 2100, NULL, '2026-10-26 11:00:00'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-27]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-27] |%')
  AND NOT EXISTS (
    SELECT 1 FROM bar_order_items i
    WHERE i.order_id = o.id AND i.item_id = 10
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2100, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'bar', o.id, 'cash', 'bth26-bar-xlsx-OCT-27-cash'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-27]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-27] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-27-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2100, 'Bar sales (cash)', '2026-10', '2026-10-26 11:00:00', '2026-10-26 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-27]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-27] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (cash)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Bar', 2720, '[BTH26-BAR-XLSX OCT-28] Bar expenses (daily sheet)', '2026-10-27 11:00:00', '2026-10-27 11:00:00', 'bar', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-BAR-XLSX OCT-28] Bar expenses (daily sheet)'
);
INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-29]', '2026-10-28 11:00:00', '2026-10-28 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM bar_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-BAR-XLSX OCT-29]' OR notes LIKE '[BTH26-BAR-XLSX OCT-29] |%')
);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 10, 1, 700, 700, NULL, '2026-10-28 11:00:00'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-29]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-29] |%')
  AND NOT EXISTS (
    SELECT 1 FROM bar_order_items i
    WHERE i.order_id = o.id AND i.item_id = 10
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 700, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'bar', o.id, 'm-pesa', 'bth26-bar-xlsx-OCT-29-m-pesa'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-29]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-29] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-29-m-pesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 700, 'Bar sales (m-pesa)', '2026-10', '2026-10-28 11:00:00', '2026-10-28 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-29]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-29] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (m-pesa)'
  );
INSERT INTO expenses (company_id, booking_id, category, amount, description, incurred_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 'Bar', 1350, '[BTH26-BAR-XLSX OCT-30] Bar expenses (daily sheet)', '2026-10-29 11:00:00', '2026-10-29 11:00:00', 'bar', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM expenses e
  WHERE e.company_id = 'bth' AND e.description = '[BTH26-BAR-XLSX OCT-30] Bar expenses (daily sheet)'
);
INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-31]', '2026-10-30 11:00:00', '2026-10-30 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM bar_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-BAR-XLSX OCT-31]' OR notes LIKE '[BTH26-BAR-XLSX OCT-31] |%')
);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 10, 1, 2350, 2350, NULL, '2026-10-30 11:00:00'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-31]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM bar_order_items i
    WHERE i.order_id = o.id AND i.item_id = 10
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1000, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'bar', o.id, 'cash', 'bth26-bar-xlsx-OCT-31-cash'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-31]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-31-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1000, 'Bar sales (cash)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-31]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (cash)'
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 1350, 'KES', 'completed', 'm-pesa', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'bar', o.id, 'm-pesa', 'bth26-bar-xlsx-OCT-31-m-pesa'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-31]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-31-m-pesa'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 1350, 'Bar sales (m-pesa)', '2026-10', '2026-10-30 11:00:00', '2026-10-30 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-31]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-31] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (m-pesa)'
  );
INSERT INTO bar_orders (company_id, status, table_label, customer_name, notes, created_at, updated_at)
SELECT 'bth', 'paid', NULL, 'Daily sales (imported)', '[BTH26-BAR-XLSX OCT-32]', '2026-10-31 11:00:00', '2026-10-31 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM bar_orders
  WHERE company_id = 'bth'
    AND (notes = '[BTH26-BAR-XLSX OCT-32]' OR notes LIKE '[BTH26-BAR-XLSX OCT-32] |%')
);
INSERT INTO bar_order_items (company_id, order_id, item_id, quantity, unit_price, line_total, notes, created_at)
SELECT 'bth', o.id, 10, 1, 2000, 2000, NULL, '2026-10-31 11:00:00'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-32]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-32] |%')
  AND NOT EXISTS (
    SELECT 1 FROM bar_order_items i
    WHERE i.order_id = o.id AND i.item_id = 10
  );
INSERT INTO payments (company_id, booking_id, amount, currency, status, method, notes, recorded_at, created_at, reference_type, reference_id, provider, idempotency_key)
SELECT 'bth', NULL, 2000, 'KES', 'completed', 'cash', 'Imported from BAR_DAILY_SALES.xlsx', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'bar', o.id, 'cash', 'bth26-bar-xlsx-OCT-32-cash'
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-32]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-32] |%')
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.company_id = 'bth' AND p.idempotency_key = 'bth26-bar-xlsx-OCT-32-cash'
  );
INSERT INTO revenue_entries (company_id, booking_id, amount, package_label, period_month, recognized_at, created_at, reference_type, reference_id)
SELECT 'bth', NULL, 2000, 'Bar sales (cash)', '2026-10', '2026-10-31 11:00:00', '2026-10-31 11:00:00', 'bar', o.id
FROM bar_orders o
WHERE o.company_id = 'bth'
  AND (o.notes = '[BTH26-BAR-XLSX OCT-32]' OR o.notes LIKE '[BTH26-BAR-XLSX OCT-32] |%')
  AND NOT EXISTS (
    SELECT 1 FROM revenue_entries r
    WHERE r.company_id = 'bth'
      AND r.reference_type = 'bar'
      AND r.reference_id = o.id
      AND r.package_label = 'Bar sales (cash)'
  );

SELECT setval('restaurant_orders_id_seq', (SELECT MAX(id) FROM restaurant_orders));
SELECT setval('restaurant_order_items_id_seq', (SELECT MAX(id) FROM restaurant_order_items));
SELECT setval('bar_orders_id_seq', (SELECT MAX(id) FROM bar_orders));
SELECT setval('bar_order_items_id_seq', (SELECT MAX(id) FROM bar_order_items));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('revenue_entries_id_seq', (SELECT MAX(id) FROM revenue_entries));
SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));
COMMIT;
