/** Single promotion item from scraped JSON (inside promotions array) */
export interface PromotionPayload {
  id?: number;
  benefit: string;
  benefit_type: string;
  channel?: string;
  payment_methods?: string[];
  applicable_days?: string[];
  applicable_days_names?: string[];
  bank_logo?: string | null;
  image_file?: string | null;
  subtitle?: string | null;
  period?: string | null;
  recurring?: string | null;
  discount_pct?: number | null;
  installments?: number[] | null;
  sin_tope?: boolean;
  tope_label?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  conditions?: string | null;
  exclusivo_clientes?: boolean;
  online_only?: boolean;
  presencial_only?: boolean;
  [key: string]: unknown;
}

/** JSON format when pasting (one day's data from scraper) */
export interface PromoImportJson {
  filter_day: number;
  filter_day_name?: string;
  source?: string;
  promotions: PromotionPayload[];
}

export const DAY_NAMES: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};
