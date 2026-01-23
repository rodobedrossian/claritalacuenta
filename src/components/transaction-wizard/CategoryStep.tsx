import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getCategoryIcon, getCategoryColor, DEFAULT_CATEGORY_ICONS, DEFAULT_CATEGORY_COLORS } from "@/lib/categoryIcons";

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
}

interface CategoryStepProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CategoryStep = ({
  categories,
  selectedCategory,
  onCategoryChange,
  onNext,
  onBack,
}: CategoryStepProps) => {
  const handleSelectCategory = (categoryName: string) => {
    onCategoryChange(categoryName);
    // Auto-advance after short delay for visual feedback
    setTimeout(() => onNext(), 150);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h3 className="font-semibold text-lg">¿En qué categoría?</h3>
          <p className="text-sm text-muted-foreground">Elegí una categoría para tu transacción</p>
        </div>
      </div>

      {/* Category Grid */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="grid grid-cols-3 gap-2 pb-4">
          {categories.map((cat) => {
            const iconName = cat.icon || DEFAULT_CATEGORY_ICONS[cat.name] || "circle";
            const color = cat.color || DEFAULT_CATEGORY_COLORS[cat.name] || getCategoryColor(cat.name);
            const IconComponent = getCategoryIcon(iconName);
            const isSelected = selectedCategory === cat.name;

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
                  <IconComponent 
                    className="h-5 w-5" 
                    style={{ color }} 
                  />
                </div>
                <span className={cn(
                  "text-xs font-medium text-center leading-tight",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
