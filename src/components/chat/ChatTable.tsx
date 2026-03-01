interface ChatTableProps {
  title?: string;
  headers: string[];
  rows: string[][];
}

export function ChatTable({ title, headers, rows }: ChatTableProps) {
  return (
    <div className="my-3 rounded-xl border border-border/50 bg-card overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-border/50">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/30 last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 text-foreground whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
