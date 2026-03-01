import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChatLineChartProps {
  data: { name: string; value: number }[];
  title?: string;
}

export function ChatLineChart({ data, title }: ChatLineChartProps) {
  return (
    <div className="my-3 rounded-xl bg-card p-4">
      {title && <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)
            }
            width={48}
          />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)
            }
            contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}
          />
          <Line type="monotone" dataKey="value" stroke="hsl(152, 48%, 38%)" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
