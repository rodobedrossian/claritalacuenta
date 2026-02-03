-- Allow members to delete: own membership (leave) or owners can remove any member
CREATE POLICY "Users can delete own membership or owners can remove members"
  ON public.workspace_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role = 'owner'
    )
  );
