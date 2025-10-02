import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AddTransactionDialogProps {
  onAdd: (transaction: {
    type: "income" | "expense";
    amount: number;
    currency: "USD" | "ARS";
    category: string;
    description: string;
    date: string;
    user_id: string;
  }) => void;
  categories: string[];
  users: Array<{ id: string; full_name: string | null }>;
}

export const AddTransactionDialog = ({ onAdd, categories, users }: AddTransactionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !currency || !category || !description || !userId) {
      toast.error("Please fill in all fields");
      return;
    }

    onAdd({
      type,
      amount: parseFloat(amount),
      currency: currency as "USD" | "ARS",
      category,
      description,
      date: new Date().toISOString(),
      user_id: userId,
    });

    toast.success(`${type === "income" ? "Income" : "Expense"} added successfully`);
    setOpen(false);
    setCurrency("");
    setAmount("");
    setCategory("");
    setDescription("");
    setUserId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary hover:opacity-90 transition-smooth shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new income or expense to track your finances.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
              <SelectTrigger id="type" className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={(value: "USD" | "ARS") => setCurrency(value)}>
              <SelectTrigger id="currency" className="bg-muted border-border">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="ARS">ARS ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="bg-muted border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Owner</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="owner" className="bg-muted border-border">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || "Unknown User"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <Button type="submit" className="w-full gradient-primary hover:opacity-90">
            Add Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
