import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getIconForCategory, getCategoryColor, DEFAULT_CATEGORY_COLORS } from "@/lib/categoryIcons";

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
}

interface BudgetCategoryStepProps {
  category: string;
  availableCategories: Category[];
  onCategoryChange: (category: string) => void;
  onNext: () => void;
}

export const BudgetCategoryStep = ({
  category,
  availableCategories,
  onCategoryChange,
  onNext,
}: BudgetCategoryStepProps) => {
  const handleSelectCategory = (categoryName: string) => {
    onCategoryChange(categoryName);
    setTimeout(() => onNext(), 150);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 shrink-0">
        <h3 className="font-semibold text-lg">¿Para qué categoría?</h3>
        <p className="text-sm text-muted-foreground">Elegí la categoría de gasto a presupuestar</p>
      </div>

      <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
        <div className="grid grid-cols-3 gap-2 pb-4">
          {availableCategories.length === 0 ? (
            <div className="col-span-3 py-8 text-center text-sm text-muted-foreground">
              Todas las categorías de gasto ya tienen presupuesto.
            </div>
          ) : (
            availableCategories.map((cat) => {
              const color = cat.color || DEFAULT_CATEGORY_COLORS[cat.name] || getCategoryColor(cat.name);
              const IconComponent = getIconForCategory(cat.name, cat.icon);
              const isSelected = category === cat.name;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.name)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border/50 bg-card hover:bg-muted/50"
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <IconComponent className="h-5 w-5" style={{ color }} />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center leading-tight",
                      isSelected ? "text-primary" : "text-foreground"
                    )}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
