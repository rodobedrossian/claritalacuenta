import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const sizeClasses = {
  sm: {
    wrapper: "gap-0 items-baseline",
    // Altura del wrapper = altura de "ucula" (leading-none). object-bottom para que la R apoye en la baseline y no flote.
    imageWrapper: "h-[1.125rem] w-6 -mr-1 flex shrink-0 overflow-hidden",
    image: "h-[1.125rem] min-w-[1.5rem] w-auto object-contain object-left object-bottom",
    text: "text-lg font-bold tracking-tight text-foreground leading-none",
  },
  md: {
    wrapper: "gap-0 items-baseline",
    imageWrapper: "h-[1.25rem] w-7 -mr-1 flex shrink-0 overflow-hidden",
    image: "h-[1.25rem] min-w-[1.75rem] w-auto object-contain object-left object-bottom",
    text: "text-xl font-bold tracking-tight text-foreground leading-none",
  },
  lg: {
    wrapper: "gap-0 items-baseline",
    imageWrapper: "h-[1.5rem] w-8 -mr-1.5 flex shrink-0 overflow-hidden",
    image: "h-[1.5rem] min-w-[2rem] w-auto object-contain object-left object-bottom",
    text: "text-2xl font-bold tracking-tight text-foreground leading-none",
  },
  xl: {
    wrapper: "gap-0 items-baseline",
    imageWrapper: "h-[2.25rem] w-11 -mr-2 flex shrink-0 overflow-hidden",
    image: "h-[2.25rem] min-w-[2.75rem] w-auto object-contain object-left object-bottom",
    text: "text-4xl font-bold tracking-tight text-foreground leading-none",
  },
};

interface RuculaLogoProps {
  size?: Size;
  className?: string;
  /** Si true, solo muestra la imagen (la R), sin "ucula". Útil para sidebar colapsado. */
  iconOnly?: boolean;
}

/**
 * Logo de Rucula: la imagen hace de "R" pegada al texto "ucula".
 * Contenedor a la misma altura que el texto y object-bottom para que la R apoye en la baseline (sin flotar).
 */
export function RuculaLogo({ size = "md", className, iconOnly = false }: RuculaLogoProps) {
  const s = sizeClasses[size];

  if (iconOnly) {
    return (
      <span className={cn("inline-flex shrink-0", className)}>
        <span className={cn("inline-flex overflow-hidden", s.imageWrapper)}>
          <img
            src="/rucula-logo.png"
            alt="Rucula"
            className={cn(s.image)}
          />
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-baseline", s.wrapper, className)}
      aria-label="Rucula"
    >
      <span className={cn("inline-flex overflow-hidden", s.imageWrapper)}>
        <img
          src="/rucula-logo.png"
          alt=""
          role="presentation"
          className={cn(s.image)}
        />
      </span>
      <span className={cn(s.text, "leading-none")}>ucula</span>
    </span>
  );
}
