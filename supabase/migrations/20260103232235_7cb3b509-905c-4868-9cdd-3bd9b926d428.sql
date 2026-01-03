-- Add statement_import_id to transactions table to link with imported statements
ALTER TABLE public.transactions 
ADD COLUMN statement_import_id uuid REFERENCES public.statement_imports(id) ON DELETE SET NULL;