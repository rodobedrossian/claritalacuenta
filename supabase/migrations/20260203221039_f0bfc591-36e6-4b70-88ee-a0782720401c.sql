-- Create a security definer function to check if user has a valid invitation
CREATE OR REPLACE FUNCTION public.has_valid_invitation(_workspace_id uuid, _user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_invitations
    WHERE workspace_id = _workspace_id
      AND email = lower(_user_email)
      AND status = 'pending'
      AND expires_at > now()
  )
$$;

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Members can insert workspace members (for invites)" ON public.workspace_members;

-- Create new INSERT policy that allows:
-- 1. Existing members to add others (current behavior)
-- 2. Users accepting a valid invitation to add themselves
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
    AND public.has_valid_invitation(workspace_id, (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);