-- Create a security definer function to check workspace ownership
CREATE OR REPLACE FUNCTION public.is_workspace_owner(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND role = 'owner'
  )
$$;

-- Drop the existing DELETE policy
DROP POLICY IF EXISTS "Users can delete own membership or owners can remove members" ON public.workspace_members;

-- Create new DELETE policy using the security definer function
CREATE POLICY "Users can delete own membership or owners can remove members"
ON public.workspace_members
FOR DELETE
USING (
  (user_id = auth.uid()) 
  OR 
  is_workspace_owner(workspace_id, auth.uid())
);