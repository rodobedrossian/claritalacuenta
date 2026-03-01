
-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view chat_conversations"
  ON public.chat_conversations FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "Workspace members can insert chat_conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "Workspace members can update chat_conversations"
  ON public.chat_conversations FOR UPDATE
  USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "Workspace members can delete chat_conversations"
  ON public.chat_conversations FOR DELETE
  USING (workspace_id IN (SELECT user_workspace_ids()));

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text,
  tool_calls jsonb,
  visualization_type text,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their conversations"
  ON public.chat_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM public.chat_conversations
    WHERE workspace_id IN (SELECT user_workspace_ids())
  ));

CREATE POLICY "Users can insert messages to their conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.chat_conversations
    WHERE workspace_id IN (SELECT user_workspace_ids())
  ));

CREATE POLICY "Users can delete messages of their conversations"
  ON public.chat_messages FOR DELETE
  USING (conversation_id IN (
    SELECT id FROM public.chat_conversations
    WHERE workspace_id IN (SELECT user_workspace_ids())
  ));

-- Trigger for updated_at on conversations
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
