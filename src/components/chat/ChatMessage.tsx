import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChatPieChart } from "./ChatPieChart";
import { ChatBarChart } from "./ChatBarChart";
import { ChatLineChart } from "./ChatLineChart";
import { ChatKPICard } from "./ChatKPICard";
import { ChatTable } from "./ChatTable";
import { cn } from "@/lib/utils";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { ChatMessage as ChatMessageType, LatencyEntry } from "@/hooks/useFinancialChat";

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
                  "rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border/50 text-sm",
                  "prose prose-sm max-w-none text-foreground",
                  "prose-strong:text-foreground prose-headings:text-foreground",
                  "prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1",
                  "prose-headings:mt-4 prose-headings:mb-2",
                  "[&_br]:block [&_br]:mt-2",
                  "leading-relaxed"
                )}
              >
                <ReactMarkdown>{block.content}</ReactMarkdown>
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
        {message.latency && message.latency.length > 0 && (
          <LatencyBadge latency={message.latency} />
        )}
      </div>
    </div>
  );
}

function LatencyBadge({ latency }: { latency: LatencyEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const total = latency.find((l) => l.step === "total");
  const steps = latency.filter((l) => l.step !== "total");

  const formatMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="h-3 w-3" />
        <span>{total ? formatMs(total.duration_ms) : "—"}</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="mt-1.5 rounded-lg bg-muted/50 border border-border/30 px-3 py-2 space-y-1">
          {steps.map((s, i) => {
            const label = s.step.startsWith("ai_call_")
              ? `🤖 AI call #${s.step.split("_")[2]}`
              : s.step.startsWith("tool:")
              ? `🔧 ${s.step.replace("tool:", "")}`
              : s.step;
            return (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn(
                  "font-mono",
                  s.duration_ms > 3000 ? "text-destructive" : s.duration_ms > 1000 ? "text-amber-500" : "text-muted-foreground"
                )}>
                  {formatMs(s.duration_ms)}
                </span>
              </div>
            );
          })}
          {total && (
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/30">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-mono font-medium text-foreground">{formatMs(total.duration_ms)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
