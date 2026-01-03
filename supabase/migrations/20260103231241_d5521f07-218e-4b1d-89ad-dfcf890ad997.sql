-- Create storage bucket for credit card statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('credit-card-statements', 'credit-card-statements', false);

-- RLS policies for storage bucket
CREATE POLICY "Users can upload their own statements"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'credit-card-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own statements"
ON storage.objects
FOR SELECT
USING (bucket_id = 'credit-card-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own statements"
ON storage.objects
FOR DELETE
USING (bucket_id = 'credit-card-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create statement_imports table
CREATE TABLE public.statement_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  statement_month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  extracted_data JSONB,
  error_message TEXT,
  transactions_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.statement_imports ENABLE ROW LEVEL SECURITY;

-- RLS policies for statement_imports
CREATE POLICY "Users can view their own statement imports"
ON public.statement_imports
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statement imports"
ON public.statement_imports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statement imports"
ON public.statement_imports
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statement imports"
ON public.statement_imports
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_statement_imports_updated_at
BEFORE UPDATE ON public.statement_imports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();