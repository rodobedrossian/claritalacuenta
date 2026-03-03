

## Review: Workspace Data Sharing

### Current State (already working)
All major tables (`transactions`, `credit_cards`, `savings`, `savings_entries`, `investments`, `savings_goals`, `budgets`, `recurring_expenses`, `credit_card_transactions`, `chat_conversations`, `monthly_surpluses`) have workspace-level RLS policies using `workspace_id IN (SELECT user_workspace_ids())`. Since edge functions use the user's auth token, RLS automatically scopes data to the shared workspace. **Both owner and member should already see the same data.**

### Issues Found

**1. Build error in `response-stream.tsx` (blocking deployment)**
TypeScript error: `Intl.Segmenter` requires `es2022` lib. This needs fixing for the app to build.

**2. `get-dashboard-data` does not receive `workspace_id` from frontend**
`useDashboardData` has `workspaceId` as a parameter but never passes it to the edge function. While RLS handles scoping correctly, passing it explicitly would ensure the explicit workspace filter in the edge function also works (belt and suspenders).

**3. `get-savings-data` has no workspace scoping logic at all**
Unlike `get-dashboard-data`, this edge function has zero workspace awareness in its code. It relies entirely on RLS, which works, but is inconsistent with the dashboard pattern.

**4. `get-transactions-data` has no workspace filter**
Same as savings -- relies entirely on RLS. Works but inconsistent.

### Recommended Changes

1. **Fix build error** -- Update `tsconfig.app.json` to include `"es2022"` in `lib`, or refactor the `Intl.Segmenter` usage in `response-stream.tsx` with a fallback.

2. **Pass `workspace_id` from frontend to edge functions** for consistency:
   - `useDashboardData`: pass `workspace_id: workspaceId` in the body to `get-dashboard-data`
   - `useTransactionsData`: accept `workspaceId` param (it currently doesn't) and pass it
   - `useSavingsData`: same pattern

3. **No RLS or schema changes needed** -- the policies are correct for workspace sharing.

### Summary
The sharing already works at the RLS level. The fixes are about consistency and fixing the build error. No data access changes are strictly required.

