-- Extend get_workspace_invitation_by_token to return has_account (whether invited email exists in auth.users)
CREATE OR REPLACE FUNCTION public.get_workspace_invitation_by_token(in_token TEXT)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  email TEXT,
  invited_by_user_id UUID,
  status TEXT,
  expires_at TIMESTAMPTZ,
  inviter_email TEXT,
  has_account BOOLEAN
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
    au.email AS inviter_email,
    EXISTS (SELECT 1 FROM auth.users u WHERE u.email = wi.email) AS has_account
  FROM workspace_invitations wi
  LEFT JOIN auth.users au ON au.id = wi.invited_by_user_id
  WHERE wi.token = in_token
  LIMIT 1;
$$;
