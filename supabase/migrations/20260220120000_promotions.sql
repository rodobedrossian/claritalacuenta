-- Promotions table: store scraped/imported promos by entity and day of week.
-- Admin only: create, list, toggle is_active, view detail.
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity text NOT NULL,
  day_of_week smallint NOT NULL,
  source text,
  payload jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.promotions IS 'Promociones por entidad y día; solo admin puede gestionar.';
COMMENT ON COLUMN public.promotions.entity IS 'Ej: coto, carrefour';
COMMENT ON COLUMN public.promotions.day_of_week IS '1=Lunes, 7=Domingo (como filter_day del JSON)';
COMMENT ON COLUMN public.promotions.payload IS 'Objeto completo de la promo (benefit, payment_methods, etc.)';

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer y escribir (vía app_metadata.role = 'admin')
CREATE POLICY "admin_select_promotions"
  ON public.promotions FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "admin_insert_promotions"
  ON public.promotions FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "admin_update_promotions"
  ON public.promotions FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX idx_promotions_entity_day ON public.promotions (entity, day_of_week);
CREATE INDEX idx_promotions_is_active ON public.promotions (is_active);
CREATE INDEX idx_promotions_created_at ON public.promotions (created_at DESC);

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
