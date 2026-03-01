import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = [
  "hsl(152, 48%, 38%)",
  "hsl(200, 65%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 65%, 50%)",
  "hsl(270, 50%, 55%)",
  "hsl(170, 55%, 45%)",
  "hsl(20, 70%, 55%)",
  "hsl(310, 45%, 50%)",
];

interface ChatPieChartProps {
  data: { name: string; value: number }[];
  title?: string;
}

export function ChatPieChart({ data, title }: ChatPieChartProps) {
  return (
    <div className="my-3 rounded-xl border border-border/50 bg-card p-4">
      {title && <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>}
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)
            }
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
