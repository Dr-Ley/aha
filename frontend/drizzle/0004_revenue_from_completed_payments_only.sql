-- Revenue is recognized from completed payment entries only.
-- Remove legacy source-linked rows that were created directly from paid/partial source records.
DELETE FROM "revenue_entries"
WHERE "reference_type" IN ('tour', 'hotel', 'bar', 'restaurant');
