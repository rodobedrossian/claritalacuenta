import { useState } from "react";
import { PiggyBank } from "lucide-react";
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

interface AddSavingsDialogProps {
  onAdd: (currency: "USD" | "ARS", amount: number) => void;
}

export const AddSavingsDialog = ({ onAdd }: AddSavingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !currency) {
      toast.error("Please fill in all fields");
      return;
    }

    onAdd(currency as "USD" | "ARS", parseFloat(amount));

    toast.success(`Savings updated successfully`);
    setOpen(false);
    setCurrency("");
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
          <PiggyBank className="mr-2 h-4 w-4" />
          Add Savings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add Savings</DialogTitle>
          <DialogDescription>
            Add or update your savings in USD or ARS.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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

          <Button type="submit" className="w-full gradient-primary hover:opacity-90">
            Add Savings
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
