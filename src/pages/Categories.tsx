import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesData, Category } from "@/hooks/useCategoriesData";
import { CategoryDialog } from "@/components/categories/CategoryDialog";
import { 
  ChevronLeft, 
  Tag, 
  Trash2, 
  Pencil,
  Plus,
  Info,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Categories = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setAuthLoading(false);
    });
  }, [navigate]);

  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategoriesData(user?.id);

  const systemCategories = categories.filter(c => !c.user_id);
  const myCategories = categories.filter(c => c.user_id);
  const myIncome = myCategories.filter(c => c.type === "income");
  const myExpense = myCategories.filter(c => c.type === "expense");
  const systemIncome = systemCategories.filter(c => c.type === "income");
  const systemExpense = systemCategories.filter(c => c.type === "expense");

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que querés eliminar esta categoría?")) {
      await deleteCategory(id);
    }
  };

  const GroupedList = ({ 
    title, 
    items, 
    isSystem = false, 
    action, 
    emptyLabel = "No hay categorías personalizadas aún." 
  }: { 
    title: string; 
    items: Category[]; 
    isSystem?: boolean; 
    action?: React.ReactNode;
    emptyLabel?: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{title}</h2>
        {action}
      </div>
      <div className="bg-card border border-border/40 rounded-[2rem] overflow-hidden divide-y divide-border/40">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          items.map((category) => (
            <div 
              key={category.id} 
              className={cn(
                "flex items-center justify-between p-4 group transition-colors",
                !isSystem && "hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${category.color || '#f3f4f6'}20`, color: category.color || '#6b7280' }}
                >
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight capitalize">{category.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    {category.type === "expense" ? "Gasto" : "Ingreso"}
                  </p>
                </div>
              </div>

              {!isSystem && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CategoryDialog 
                    onSave={async (data) => await updateCategory(category.id, data)}
                    userId={user?.id}
                    category={category}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {isSystem && (
                <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter opacity-40">
                  Sistema
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full bg-background overflow-hidden">
          <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl z-40 pt-safe pb-3 transition-all duration-300">
            <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
              <div className="flex items-center gap-2 h-10">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            <main className="container mx-auto px-4 md:px-6 py-6 space-y-6">
              <Skeleton className="h-10 w-full max-w-md rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-full rounded-[2rem]" />
              </div>
            </main>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Header - iOS Style */}
        <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="flex items-center justify-between h-10">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full -ml-2" 
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold tracking-tight">Categorías</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <main className="container mx-auto px-4 md:px-6 py-6 pb-32">
            <Tabs defaultValue="expense" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2 overflow-x-auto no-scrollbar">
                <TabsTrigger value="expense" className="gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Gastos
                </TabsTrigger>
                <TabsTrigger value="income" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ingresos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expense" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <GroupedList
                    title="Mis categorías"
                    items={myExpense}
                    action={user?.id ? (
                      <CategoryDialog
                        onSave={addCategory}
                        userId={user.id}
                        defaultType="expense"
                        trigger={
                          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            Nueva
                          </Button>
                        }
                      />
                    ) : null}
                    emptyLabel="No hay categorías de gastos personalizadas aún."
                  />
                  <div className="space-y-4">
                    <GroupedList
                      title="Categorías del sistema"
                      items={systemExpense}
                      isSystem
                      emptyLabel="No hay categorías de gastos del sistema."
                    />
                    <div className="flex items-start gap-2 px-4 text-muted-foreground/60">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <p className="text-[10px] leading-relaxed">
                        Las categorías del sistema son generales y no se pueden modificar ni eliminar para mantener la consistencia de tus reportes.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="income" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <GroupedList
                    title="Mis categorías"
                    items={myIncome}
                    action={user?.id ? (
                      <CategoryDialog
                        onSave={addCategory}
                        userId={user.id}
                        defaultType="income"
                        trigger={
                          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            Nueva
                          </Button>
                        }
                      />
                    ) : null}
                    emptyLabel="No hay categorías de ingresos personalizadas aún."
                  />
                  <div className="space-y-4">
                    <GroupedList
                      title="Categorías del sistema"
                      items={systemIncome}
                      isSystem
                      emptyLabel="No hay categorías de ingresos del sistema."
                    />
                    <div className="flex items-start gap-2 px-4 text-muted-foreground/60">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <p className="text-[10px] leading-relaxed">
                        Las categorías del sistema son generales y no se pueden modificar ni eliminar para mantener la consistencia de tus reportes.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </AppLayout>
  );
};

export default Categories;
