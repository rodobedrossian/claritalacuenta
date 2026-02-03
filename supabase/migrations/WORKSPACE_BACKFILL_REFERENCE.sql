-- =============================================
-- REFERENCIA: Backfill de workspaces para usuarios existentes
-- =============================================
-- NO EJECUTAR si ya aplicaste la migración 20260202100000_workspaces_and_invitations.sql
-- (esa migración ya incluye este backfill).
--
-- Uso: solo si tenés workspaces/workspace_members creados y columnas workspace_id
-- agregadas, pero los datos existentes no tienen workspace_id asignado.
--
-- Requisitos: tablas workspaces, workspace_members; columnas workspace_id en:
-- transactions, credit_cards, credit_card_transactions, budgets, savings,
-- savings_entries, savings_goals, investments, recurring_expenses,
-- statement_imports, monthly_surpluses, categories.
-- =============================================

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
