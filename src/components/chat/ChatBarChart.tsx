import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChatBarChartProps {
  data: { name: string; value: number }[];
  title?: string;
}

export function ChatBarChart({ data, title }: ChatBarChartProps) {
  return (
    <div className="my-3 rounded-xl border border-border/50 bg-card p-4">
      {title && <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)
            }
            contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}
          />
          <Bar dataKey="value" fill="hsl(152, 48%, 38%)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
