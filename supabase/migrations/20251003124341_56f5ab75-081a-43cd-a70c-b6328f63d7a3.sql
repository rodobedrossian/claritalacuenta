-- Crear tabla para almacenar exchange rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate numeric NOT NULL,
  source text NOT NULL DEFAULT 'dolarapi_cripto',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy para que todos puedan leer
CREATE POLICY "Anyone can view exchange rates"
  ON public.exchange_rates
  FOR SELECT
  TO public
  USING (true);

-- Policy para que solo funciones autenticadas puedan insertar/actualizar
CREATE POLICY "Service role can manage exchange rates"
  ON public.exchange_rates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insertar un valor inicial
INSERT INTO public.exchange_rates (rate, source)
VALUES (1300, 'dolarapi_cripto');