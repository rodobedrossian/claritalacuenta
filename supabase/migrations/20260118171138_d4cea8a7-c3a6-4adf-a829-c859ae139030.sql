-- Insert installments from extracted_data.cuotas into credit_card_transactions
-- This migrates existing installment data from JSON to the dedicated table

INSERT INTO public.credit_card_transactions (
  user_id,
  credit_card_id,
  statement_import_id,
  description,
  amount,
  currency,
  date,
  transaction_type,
  installment_current,
  installment_total
)
SELECT 
  si.user_id,
  si.credit_card_id,
  si.id as statement_import_id,
  cuota->>'descripcion' as description,
  (cuota->>'monto')::numeric as amount,
  COALESCE(cuota->>'moneda', 'ARS') as currency,
  -- Parse date from DD/MM/YYYY format
  CASE 
    WHEN cuota->>'fecha' ~ '^\d{2}/\d{2}/\d{4}$' 
    THEN to_date(cuota->>'fecha', 'DD/MM/YYYY')
    ELSE CURRENT_DATE
  END as date,
  'cuota' as transaction_type,
  (cuota->>'cuota_actual')::integer as installment_current,
  (cuota->>'total_cuotas')::integer as installment_total
FROM 
  public.statement_imports si,
  jsonb_array_elements(si.extracted_data->'cuotas') as cuota
WHERE 
  si.extracted_data->'cuotas' IS NOT NULL
  AND jsonb_array_length(si.extracted_data->'cuotas') > 0;