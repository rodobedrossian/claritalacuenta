
-- First fix "Rent" → "Alquiler" in recurring_expenses
UPDATE recurring_expenses SET category = 'Alquiler' WHERE category = 'Rent';

-- Transactions: convert text categories to UUIDs
UPDATE transactions t
SET category = c.id::text
FROM categories c
WHERE LOWER(c.name) = LOWER(t.category)
AND t.category !~ '^[0-9a-f]{8}-';

-- Budgets: convert text categories to UUIDs
UPDATE budgets b
SET category = c.id::text
FROM categories c
WHERE LOWER(c.name) = LOWER(b.category)
AND b.category !~ '^[0-9a-f]{8}-';

-- Recurring expenses: convert text categories to UUIDs
UPDATE recurring_expenses re
SET category = c.id::text
FROM categories c
WHERE LOWER(c.name) = LOWER(re.category)
AND re.category !~ '^[0-9a-f]{8}-';
