-- Create a security definer function to get user email safely
CREATE OR REPLACE FUNCTION public.get_auth_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop and recreate the INSERT policy using the new function
DROP POLICY IF EXISTS "Members can insert workspace members" ON public.workspace_members;

CREATE POLICY "Members can insert workspace members"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  -- Either user is already a member of the workspace
  (workspace_id IN (SELECT user_workspace_ids()))
  OR
  -- Or user has a valid invitation and is adding themselves
  (
    user_id = auth.uid()
    AND public.has_valid_invitation(workspace_id, public.get_auth_user_email())
  )
);