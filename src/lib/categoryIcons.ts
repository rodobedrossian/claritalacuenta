import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Briefcase,
  Heart,
  Plane,
  Gift,
  Coffee,
  Smartphone,
  Gamepad2,
  GraduationCap,
  TrendingUp,
  Banknote,
  Wallet,
  Dog,
  Baby,
  Sparkles,
  Circle,
  type LucideIcon,
} from "lucide-react";

// Map icon string names to Lucide components
export const ICON_MAP: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  "utensils": Utensils,
  "car": Car,
  "home": Home,
  "briefcase": Briefcase,
  "heart": Heart,
  "plane": Plane,
  "gift": Gift,
  "coffee": Coffee,
  "smartphone": Smartphone,
  "gamepad-2": Gamepad2,
  "graduation-cap": GraduationCap,
  "trending-up": TrendingUp,
  "banknote": Banknote,
  "wallet": Wallet,
  "dog": Dog,
  "baby": Baby,
  "sparkles": Sparkles,
  "circle": Circle,
};

// Default fallback colors for categories without a custom color
export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  "Supermercado": "#22c55e",
  "Delivery": "#f97316",
  "Ropa": "#8b5cf6",
  "Servicios": "#3b82f6",
  "Transporte": "#14b8a6",
  "Salud": "#ec4899",
  "Vacaciones": "#0ea5e9",
  "Regalos": "#f43f5e",
  "Cafetería": "#a16207",
  "Tecnología": "#6366f1",
  "Entretenimiento": "#a855f7",
  "Educación": "#0d9488",
  "Trabajo": "#64748b",
  "Inversión": "#10b981",
  "Freelance": "#22c55e",
  "Otros": "#eab308",
  "Mascotas": "#f97316",
  "Hijos": "#ec4899",
  "Belleza": "#a855f7",
};

// Default fallback icons for categories without a custom icon
export const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  "Supermercado": "shopping-cart",
  "Delivery": "utensils",
  "Ropa": "shirt",
  "Servicios": "home",
  "Transporte": "car",
  "Salud": "heart",
  "Vacaciones": "plane",
  "Regalos": "gift",
  "Cafetería": "coffee",
  "Tecnología": "smartphone",
  "Entretenimiento": "gamepad-2",
  "Educación": "graduation-cap",
  "Trabajo": "briefcase",
  "Inversión": "trending-up",
  "Freelance": "banknote",
  "Otros": "wallet",
  "Mascotas": "dog",
  "Hijos": "baby",
  "Belleza": "sparkles",
};

export function getCategoryIcon(iconName: string | undefined | null): LucideIcon {
  if (!iconName) return Circle;
  return ICON_MAP[iconName] || Circle;
}

export function getCategoryColor(
  categoryName: string,
  customColor?: string | null
): string {
  if (customColor) return customColor;
  return DEFAULT_CATEGORY_COLORS[categoryName] || "#6366f1";
}
