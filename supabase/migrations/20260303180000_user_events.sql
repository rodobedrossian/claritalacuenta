-- User events table: store all user interactions for analytics and future triggers.
-- Append-only; never blocks the user on failure.
CREATE TABLE public.user_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_events IS 'Eventos de interacción del usuario para analytics y triggers futuros.';
COMMENT ON COLUMN public.user_events.user_id IS 'auth.users.id; null si no logueado';
COMMENT ON COLUMN public.user_events.event_type IS 'click, navigation, form_submit, tab_change, action';
COMMENT ON COLUMN public.user_events.event_name IS 'Nombre semántico o derivado del evento';
COMMENT ON COLUMN public.user_events.properties IS 'Contexto adicional: element, label, href, etc.';

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events
CREATE POLICY "users_insert_own_events"
  ON public.user_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anonymous users can insert events with user_id null
CREATE POLICY "anon_insert_events"
  ON public.user_events FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Users can read their own events (for future triggers/UI)
CREATE POLICY "users_select_own_events"
  ON public.user_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all events
CREATE POLICY "admin_select_events"
  ON public.user_events FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX idx_user_events_user_id ON public.user_events (user_id);
CREATE INDEX idx_user_events_created_at ON public.user_events (created_at DESC);
CREATE INDEX idx_user_events_event_type ON public.user_events (event_type);
