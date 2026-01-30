import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Category } from "@/hooks/useCategoriesData";

interface CategoryDialogProps {
  onSave: (category: { name: string; type: "income" | "expense"; user_id: string }) => Promise<void>;
  userId: string;
  category?: Category;
  /** Al crear (no editar), pre-selecciona este tipo. Por defecto "expense". */
  defaultType?: "income" | "expense";
  trigger?: React.ReactNode;
}

export const CategoryDialog = ({ onSave, userId, category, defaultType = "expense", trigger }: CategoryDialogProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
    } else {
      setName("");
      setType(defaultType);
    }
  }, [category, defaultType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ name: name.trim(), type, user_id: userId });
      setOpen(false);
      if (!category) resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setType(defaultType);
  };

  const title = category ? "Editar categoría" : "Crear categoría";

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-4 sm:px-0">
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input
          placeholder="Ej: Restaurantes, Sueldo..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Gasto</SelectItem>
            <SelectItem value="income">Ingreso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full gradient-primary"
        disabled={isSubmitting || !name.trim()}
      >
        {isSubmitting ? "Guardando..." : category ? "Actualizar categoría" : "Crear categoría"}
      </Button>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger || (
            <Button size="sm" className="gradient-primary gap-2">
              <Plus className="h-4 w-4" />
              Nueva categoría
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="pb-8">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gradient-primary gap-2">
            <Plus className="h-4 w-4" />
            Nueva categoría
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
