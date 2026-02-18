
CREATE TABLE public.ai_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  function_name text NOT NULL,
  model text NOT NULL,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  reference_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS but no user policies - only service role writes/reads
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Index for admin queries
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs (created_at DESC);
CREATE INDEX idx_ai_usage_logs_function_name ON public.ai_usage_logs (function_name);
