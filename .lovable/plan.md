

## Problem

In `useCreditCardStatements.ts` line 107, the query filters by `.eq("user_id", userId)`, which means you only see statements imported by **your** user, not your workspace partner's. RLS already allows workspace-level access, but the explicit `user_id` filter overrides that.

## Fix

**File: `src/hooks/useCreditCardStatements.ts`**

Remove the `.eq("user_id", userId)` filter from the `fetchStatements` query (line 107). RLS on `statement_imports` already scopes to `workspace_id IN (SELECT user_workspace_ids())`, so all workspace members' statements will be returned automatically.

The rest of the queries in this hook (getting transactions, totals, etc.) already rely on RLS via `credit_card_transactions` table and don't filter by `user_id`, so they'll work correctly once the statements list includes all workspace members' data.

No database or RLS changes needed.

