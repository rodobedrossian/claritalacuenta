

## Problem

Estefanía (user `a6936bc8`) is a **member** of your workspace (`bc8aa563`), but all her data (transactions, credit card transactions, statement imports, etc.) lives in her **original** workspace (`37a63326`). Since RLS scopes everything by `workspace_id`, you only see data from `bc8aa563` — which contains none of her records.

This is not a code bug. It's a **data migration issue**: when she joined your workspace, her existing data wasn't moved over.

## Plan

### 1. Migrate Estefanía's data to the shared workspace

Run a database migration to update `workspace_id` on all her records from `37a63326-a957-499c-8765-dbe655119a13` to `bc8aa563-aadf-4958-a610-fe1d138b17d0`. Tables to update:

- `transactions`
- `credit_cards`
- `credit_card_transactions`
- `statement_imports`
- `savings`
- `savings_entries`
- `savings_goals`
- `investments`
- `budgets`
- `recurring_expenses`
- `chat_conversations`
- `monthly_surpluses`
- `categories` (workspace-scoped ones)

### 2. Prevent this in the future

Update the app so that when a user joins a new workspace (accept invite flow), their existing data is automatically migrated — or at minimum, new data is always created under the shared workspace. This requires a small change in the accept-invite logic.

### Technical Details

**Migration SQL** (single migration with multiple UPDATE statements):
```sql
UPDATE transactions SET workspace_id = 'bc8aa563-...' WHERE user_id = 'a6936bc8-...' AND workspace_id = '37a63326-...';
-- Repeat for each table above
```

**Future-proofing**: In `AcceptInvite.tsx` or the invite acceptance logic, after joining the new workspace, migrate all data from the user's old workspace to the new one using a database function.

