import ReactMarkdown from "react-markdown";
import { ChatPieChart } from "./ChatPieChart";
import { ChatBarChart } from "./ChatBarChart";
import { ChatLineChart } from "./ChatLineChart";
import { ChatKPICard } from "./ChatKPICard";
import { ChatTable } from "./ChatTable";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/useFinancialChat";

// Parse :::type\n{json}\n::: blocks
function parseBlocks(content: string) {
  const parts: Array<
    | { type: "text"; content: string }
    | { type: "viz"; vizType: string; data: any }
    | { type: "suggestions"; suggestions: string[] }
  > = [];
  const regex = /:::(chart|kpi|table|suggestions)\s*\n([\s\S]*?)\n:::/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) parts.push({ type: "text", content: text });
    }

    if (match[1] === "suggestions") {
      try {
        const data = JSON.parse(match[2].trim());
        if (Array.isArray(data)) {
          parts.push({ type: "suggestions", suggestions: data });
        }
      } catch {
        // ignore
      }
    } else {
      try {
        const data = JSON.parse(match[2].trim());
        parts.push({ type: "viz", vizType: match[1], data });
      } catch {
        parts.push({ type: "text", content: match[0] });
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) parts.push({ type: "text", content: text });
  }

  return parts.length ? parts : [{ type: "text" as const, content }];
}

// Convert single newlines to double for paragraph spacing, but preserve markdown tables
function normalizeNewlines(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = /^\s*\|/.test(line) || /^\s*\|?\s*[-:]+[-|:\s]*$/.test(line);
    const prevIsTableLine = i > 0 && (/^\s*\|/.test(lines[i - 1]) || /^\s*\|?\s*[-:]+[-|:\s]*$/.test(lines[i - 1]));

    // Don't add blank line between table rows
    if (isTableLine || prevIsTableLine) {
      result.push(line);
    } else if (line.trim() && i > 0 && result.length > 0 && result[result.length - 1]?.trim()) {
      result.push('', line);
    } else {
      result.push(line);
    }
  }
  return result.join('\n');
}

function renderViz(vizType: string, data: any, index: number) {
  switch (vizType) {
    case "chart": {
      const chartData = data.data?.map((d: any) => ({ name: d.name || d.label, value: d.value })) || [];
      switch (data.chart_type) {
        case "pie":
          return <ChatPieChart key={index} data={chartData} title={data.title} />;
        case "bar":
          return <ChatBarChart key={index} data={chartData} title={data.title} />;
        case "line":
          return <ChatLineChart key={index} data={chartData} title={data.title} />;
        default:
          return <ChatBarChart key={index} data={chartData} title={data.title} />;
      }
    }
    case "kpi":
      return (
        <ChatKPICard
          key={index}
          label={data.label}
          value={data.value}
          change_percent={data.change_percent}
          change_label={data.change_label}
        />
      );
    case "table":
      return <ChatTable key={index} title={data.title} headers={data.headers} rows={data.rows} />;
    default:
      return null;
  }
}

interface Props {
  message: ChatMessageType;
  onSuggestionClick?: (text: string) => void;
}

export function ChatMessageBubble({ message, onSuggestionClick }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 bg-primary text-primary-foreground text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const blocks = parseBlocks(message.content);

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[95%] space-y-2">
        {blocks.map((block, i) => {
          if (block.type === "text") {
            return (
              <div
                key={i}
                className={cn(
                  "rounded-2xl rounded-bl-md px-4 py-3 bg-card text-sm",
                  "prose prose-sm max-w-none text-foreground",
                  "prose-strong:text-foreground prose-headings:text-foreground",
                  "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
                  "prose-headings:mt-3 prose-headings:mb-1",
                  "leading-relaxed",
                  "[&_p]:mb-3 [&_p:last-child]:mb-0"
                )}
              >
                <ReactMarkdown>{normalizeNewlines(block.content)}</ReactMarkdown>
              </div>
            );
          }
          if (block.type === "suggestions" && onSuggestionClick) {
            return (
              <div key={i} className="flex flex-wrap gap-2 pt-1">
                {block.suggestions.map((s, si) => (
                  <button
                    key={si}
                    onClick={() => onSuggestionClick(s)}
                    className="text-xs px-3 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            );
          }
          if (block.type === "viz") {
            return renderViz(block.vizType, block.data, i);
          }
          return null;
        })}
      </div>
    </div>
  );
}
