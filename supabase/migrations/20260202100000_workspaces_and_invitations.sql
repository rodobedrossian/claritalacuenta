-- =============================================
-- Workspaces and invitations for shared spaces
-- =============================================

-- 1. Workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Mi espacio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 2. Workspace members (who belongs to which workspace)
CREATE TABLE public.workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 3. Workspace invitations
CREATE TABLE public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_workspace_invitations_token ON public.workspace_invitations(token);
CREATE INDEX idx_workspace_invitations_workspace_email ON public.workspace_invitations(workspace_id, email);
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- 4. Helper: current user is member of a workspace
CREATE OR REPLACE FUNCTION public.user_workspace_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid();
$$;

-- 4b. RPC: get invitation by token (for accept-invite page; callable by anon)
CREATE OR REPLACE FUNCTION public.get_workspace_invitation_by_token(in_token TEXT)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  email TEXT,
  invited_by_user_id UUID,
  status TEXT,
  expires_at TIMESTAMPTZ,
  inviter_email TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wi.id,
    wi.workspace_id,
    wi.email,
    wi.invited_by_user_id,
    wi.status,
    wi.expires_at,
    au.email AS inviter_email
  FROM workspace_invitations wi
  LEFT JOIN auth.users au ON au.id = wi.invited_by_user_id
  WHERE wi.token = in_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_workspace_invitation_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_invitation_by_token(TEXT) TO authenticated;

-- 5. RLS for workspaces: members can read their workspaces
CREATE POLICY "Members can view workspaces"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.user_workspace_ids()));

-- 6. RLS for workspace_members: members can view members of their workspaces
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.user_workspace_ids()));

CREATE POLICY "Members can insert workspace members (for invites)"
  ON public.workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));

-- 7. RLS for workspace_invitations
CREATE POLICY "Members can view invitations of their workspace"
  ON public.workspace_invitations FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.user_workspace_ids()));

CREATE POLICY "Members can insert invitations"
  ON public.workspace_invitations FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));

CREATE POLICY "Members can update invitations (accept)"
  ON public.workspace_invitations FOR UPDATE
  TO authenticated
  USING (workspace_id IN (SELECT public.user_workspace_ids()));
-- We keep anon SELECT so the accept-invite page can fetch invitation by token (if we expose a public RPC that returns minimal invite info).

-- 8. Add workspace_id to data tables (nullable first for backfill)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.credit_card_transactions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.savings ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.savings_entries ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.recurring_expenses ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.statement_imports ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.monthly_surpluses ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 9. Backfill: create one workspace per existing user and set workspace_id on all their rows
DO $$
DECLARE
  r RECORD;
  wid UUID;
BEGIN
  FOR r IN SELECT id FROM public.profiles
  LOOP
    wid := gen_random_uuid();
    INSERT INTO public.workspaces (id, name, created_at) VALUES (wid, 'Mi espacio', now());
    INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES (wid, r.id, 'owner');
    UPDATE public.transactions SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.credit_cards SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.credit_card_transactions SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.budgets SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.savings SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.savings_entries SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.savings_goals SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.investments SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.recurring_expenses SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.statement_imports SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.monthly_surpluses SET workspace_id = wid WHERE user_id = r.id;
    UPDATE public.categories SET workspace_id = wid WHERE user_id = r.id;
  END LOOP;
END $$;

-- 10. Set NOT NULL on workspace_id where we have data (optional: keep nullable for categories global rows)
ALTER TABLE public.transactions ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.credit_cards ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.credit_card_transactions ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.savings ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.savings_entries ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.savings_goals ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.investments ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.recurring_expenses ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.statement_imports ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.monthly_surpluses ALTER COLUMN workspace_id SET NOT NULL;
-- categories: leave workspace_id nullable (global categories have user_id NULL, workspace_id NULL)

-- 11. Drop old RLS policies and create workspace-based ones

-- Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Workspace members can view transactions"
  ON public.transactions FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert transactions"
  ON public.transactions FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update transactions"
  ON public.transactions FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete transactions"
  ON public.transactions FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Credit cards
DROP POLICY IF EXISTS "Users can view their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can insert their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete their own credit cards" ON public.credit_cards;
CREATE POLICY "Workspace members can view credit_cards"
  ON public.credit_cards FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert credit_cards"
  ON public.credit_cards FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update credit_cards"
  ON public.credit_cards FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete credit_cards"
  ON public.credit_cards FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Credit card transactions
DROP POLICY IF EXISTS "Users can view their own credit card transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can insert their own credit card transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can update their own credit card transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can delete their own credit card transactions" ON public.credit_card_transactions;
CREATE POLICY "Workspace members can view credit_card_transactions"
  ON public.credit_card_transactions FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert credit_card_transactions"
  ON public.credit_card_transactions FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update credit_card_transactions"
  ON public.credit_card_transactions FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete credit_card_transactions"
  ON public.credit_card_transactions FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Budgets
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
CREATE POLICY "Workspace members can view budgets"
  ON public.budgets FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert budgets"
  ON public.budgets FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update budgets"
  ON public.budgets FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete budgets"
  ON public.budgets FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Savings
DROP POLICY IF EXISTS "Users can view their own savings" ON public.savings;
DROP POLICY IF EXISTS "Users can insert their own savings" ON public.savings;
DROP POLICY IF EXISTS "Users can update their own savings" ON public.savings;
DROP POLICY IF EXISTS "Users can delete their own savings" ON public.savings;
CREATE POLICY "Workspace members can view savings"
  ON public.savings FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert savings"
  ON public.savings FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update savings"
  ON public.savings FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete savings"
  ON public.savings FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Savings entries
DROP POLICY IF EXISTS "Users can view their own savings_entries" ON public.savings_entries;
DROP POLICY IF EXISTS "Users can insert their own savings_entries" ON public.savings_entries;
DROP POLICY IF EXISTS "Users can update their own savings_entries" ON public.savings_entries;
DROP POLICY IF EXISTS "Users can delete their own savings_entries" ON public.savings_entries;
CREATE POLICY "Workspace members can view savings_entries"
  ON public.savings_entries FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert savings_entries"
  ON public.savings_entries FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update savings_entries"
  ON public.savings_entries FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete savings_entries"
  ON public.savings_entries FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Savings goals
DROP POLICY IF EXISTS "Users can view their own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can insert their own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can update their own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can delete their own savings goals" ON public.savings_goals;
CREATE POLICY "Workspace members can view savings_goals"
  ON public.savings_goals FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert savings_goals"
  ON public.savings_goals FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update savings_goals"
  ON public.savings_goals FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete savings_goals"
  ON public.savings_goals FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Investments
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON public.investments;
CREATE POLICY "Workspace members can view investments"
  ON public.investments FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert investments"
  ON public.investments FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update investments"
  ON public.investments FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete investments"
  ON public.investments FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Recurring expenses
DROP POLICY IF EXISTS "Users can view their own recurring_expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can insert their own recurring_expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can update their own recurring_expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can delete their own recurring_expenses" ON public.recurring_expenses;
CREATE POLICY "Workspace members can view recurring_expenses"
  ON public.recurring_expenses FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert recurring_expenses"
  ON public.recurring_expenses FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update recurring_expenses"
  ON public.recurring_expenses FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete recurring_expenses"
  ON public.recurring_expenses FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Statement imports
DROP POLICY IF EXISTS "Users can view their own statement imports" ON public.statement_imports;
DROP POLICY IF EXISTS "Users can insert their own statement imports" ON public.statement_imports;
DROP POLICY IF EXISTS "Users can update their own statement imports" ON public.statement_imports;
DROP POLICY IF EXISTS "Users can delete their own statement imports" ON public.statement_imports;
CREATE POLICY "Workspace members can view statement_imports"
  ON public.statement_imports FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert statement_imports"
  ON public.statement_imports FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update statement_imports"
  ON public.statement_imports FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete statement_imports"
  ON public.statement_imports FOR DELETE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Monthly surpluses
DROP POLICY IF EXISTS "Users can view their own monthly surpluses" ON public.monthly_surpluses;
DROP POLICY IF EXISTS "Users can insert their own monthly surpluses" ON public.monthly_surpluses;
DROP POLICY IF EXISTS "Users can update their own monthly surpluses" ON public.monthly_surpluses;
CREATE POLICY "Workspace members can view monthly_surpluses"
  ON public.monthly_surpluses FOR SELECT USING (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can insert monthly_surpluses"
  ON public.monthly_surpluses FOR INSERT WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can update monthly_surpluses"
  ON public.monthly_surpluses FOR UPDATE USING (workspace_id IN (SELECT public.user_workspace_ids()));

-- Categories: global (user_id NULL, workspace_id NULL) or workspace-scoped
DROP POLICY IF EXISTS "Users can view global and their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can view global and workspace categories"
  ON public.categories FOR SELECT
  USING (
    (user_id IS NULL AND workspace_id IS NULL)
    OR (workspace_id IN (SELECT public.user_workspace_ids()))
  );
CREATE POLICY "Workspace members can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()) OR (user_id = auth.uid() AND workspace_id IS NULL));
CREATE POLICY "Workspace members can update categories"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.user_workspace_ids()));
CREATE POLICY "Workspace members can delete categories"
  ON public.categories FOR DELETE
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.user_workspace_ids()));

-- 12. Update handle_new_user to create workspace and add member for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wid UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  wid := gen_random_uuid();
  INSERT INTO public.workspaces (id, name, created_at) VALUES (wid, 'Mi espacio', now());
  INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES (wid, new.id, 'owner');
  RETURN new;
END;
$$;
