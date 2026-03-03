import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ChatPieChart } from "./ChatPieChart";
import { ChatBarChart } from "./ChatBarChart";
import { ChatLineChart } from "./ChatLineChart";
import { ChatKPICard } from "./ChatKPICard";
import { ChatTable } from "./ChatTable";
import { cn } from "@/lib/utils";
import { useTextStream } from "@/components/ui/response-stream";
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
      const rawData = data.data || [];
      const chartData = rawData.map((d: any) => ({ name: d.name || d.label, value: d.value }));
      const lineData = rawData.map((d: any) => ({
        name: d.name || d.label,
        value: d.value,
        ingresos: d.ingresos ?? d.income,
        gastos: d.gastos ?? d.expenses,
      }));
      switch (data.chart_type) {
        case "pie":
          return <ChatPieChart key={index} data={chartData} title={data.title} />;
        case "bar":
          return <ChatBarChart key={index} data={chartData} title={data.title} />;
        case "line":
          return <ChatLineChart key={index} data={lineData} title={data.title} />;
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

function NonAnimatedBlock({
  children,
  onComplete,
}: {
  children: React.ReactNode;
  onComplete: () => void;
}) {
  useEffect(() => {
    onComplete();
  }, [onComplete]);
  return <>{children}</>;
}

const proseClasses = cn(
  "prose prose-sm max-w-none text-foreground",
  "prose-strong:text-foreground prose-headings:text-foreground",
  "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
  "prose-headings:mt-3 prose-headings:mb-1",
  "leading-relaxed",
  "[&_p]:mb-3 [&_p:last-child]:mb-0"
);

function AnimatedTextBlock({
  content,
  className,
  onComplete,
}: {
  content: string;
  className?: string;
  onComplete?: () => void;
}) {
  const { displayedText } = useTextStream({
    textStream: content,
    mode: "fade",
    speed: 80,
    fadeDuration: 120,
    segmentDelay: 15,
    onComplete,
  });

  return (
    <div className={cn(proseClasses, className)}>
      <ReactMarkdown>{normalizeNewlines(displayedText)}</ReactMarkdown>
    </div>
  );
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
  const [visibleBlockIndex, setVisibleBlockIndex] = useState(0);

  const advanceToNext = () => {
    setVisibleBlockIndex((prev) => Math.min(prev + 1, blocks.length));
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[95%] space-y-2">
        {blocks.map((block, i) => {
          if (i > visibleBlockIndex) return null;

          if (block.type === "text") {
            const isCurrentBlock = i === visibleBlockIndex;
            return (
              <div
                key={i}
                className="rounded-2xl rounded-bl-md px-4 py-3 bg-card text-sm"
              >
                {isCurrentBlock ? (
                  <AnimatedTextBlock
                    content={block.content}
                    onComplete={advanceToNext}
                  />
                ) : (
                  <div className={proseClasses}>
                    <ReactMarkdown>{normalizeNewlines(block.content)}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          }
          if (block.type === "suggestions" && onSuggestionClick) {
            const isCurrentBlock = i === visibleBlockIndex;
            if (isCurrentBlock) {
              return (
                <NonAnimatedBlock key={i} onComplete={advanceToNext}>
                  <div className="flex flex-wrap gap-2 pt-1">
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
                </NonAnimatedBlock>
              );
            }
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
            const isCurrentBlock = i === visibleBlockIndex;
            const vizContent = renderViz(block.vizType, block.data, i);
            if (isCurrentBlock) {
              return (
                <NonAnimatedBlock key={i} onComplete={advanceToNext}>
                  {vizContent}
                </NonAnimatedBlock>
              );
            }
            return <React.Fragment key={i}>{vizContent}</React.Fragment>;
          }
          return null;
        })}
      </div>
    </div>
  );
}
