
CREATE OR REPLACE FUNCTION public.migrate_user_data_to_workspace(_user_id uuid, _new_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old_workspace_id uuid;
BEGIN
  SELECT workspace_id INTO _old_workspace_id
  FROM workspace_members
  WHERE user_id = _user_id AND role = 'owner'
  LIMIT 1;

  IF _old_workspace_id IS NULL OR _old_workspace_id = _new_workspace_id THEN
    RETURN;
  END IF;

  UPDATE transactions SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE credit_cards SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE credit_card_transactions SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE statement_imports SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE savings SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE savings_entries SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE savings_goals SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE investments SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE budgets SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE recurring_expenses SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE chat_conversations SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE monthly_surpluses SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
  UPDATE categories SET workspace_id = _new_workspace_id WHERE user_id = _user_id AND workspace_id = _old_workspace_id;
END;
$$;
