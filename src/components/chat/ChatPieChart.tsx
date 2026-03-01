import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(152, 48%, 38%)",
  "hsl(200, 65%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 65%, 50%)",
  "hsl(270, 50%, 55%)",
  "hsl(170, 55%, 45%)",
  "hsl(20, 70%, 55%)",
  "hsl(310, 45%, 50%)",
  "hsl(45, 80%, 48%)",
  "hsl(0, 60%, 50%)",
];

interface ChatPieChartProps {
  data: { name: string; value: number }[];
  title?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

export function ChatPieChart({ data, title }: ChatPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="my-3 rounded-xl bg-card p-4 overflow-hidden">
      
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Custom legend as a wrapped grid instead of Recharts Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
        {data.map((d, i) => {
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
          return (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{d.name}</span>
              <span className="text-foreground font-medium">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
