import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ChatLineChartProps {
  data: { name: string; value?: number; ingresos?: number; gastos?: number; income?: number; expenses?: number }[];
  title?: string;
}

const formatTooltip = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

export function ChatLineChart({ data, title }: ChatLineChartProps) {
  const hasIngresosGastos = data.some((d) => (d.ingresos ?? d.income) != null || (d.gastos ?? d.expenses) != null);

  return (
    <div className="my-3 rounded-xl bg-card p-4">
      {title && <p className="text-sm font-medium text-foreground mb-2">{title}</p>}
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
            formatter={(value: number) => formatTooltip(value)}
            contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}
          />
          {hasIngresosGastos ? (
            <>
              <Line
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="hsl(152, 48%, 38%)"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="gastos"
                name="Gastos"
                stroke="hsl(var(--destructive))"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
              <Legend />
            </>
          ) : (
            <Line type="monotone" dataKey="value" stroke="hsl(152, 48%, 38%)" strokeWidth={2.5} dot={{ r: 4 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
