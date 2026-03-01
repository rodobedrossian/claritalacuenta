import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useFinancialChat } from "@/hooks/useFinancialChat";
import { ChatMessageBubble } from "@/components/chat/ChatMessage";
import { Send, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  "¿Cuánto gasté este mes?",
  "¿En qué categoría gasto más?",
  "¿Cómo viene mi presupuesto?",
  "Comparame los últimos 3 meses",
  "¿Puedo ahorrar $200.000 por mes?",
];

export default function Chat() {
  const { messages, isLoading, sendMessage, clearChat } = useFinancialChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);

  // Auto-scroll: when a new user message is sent, scroll it to the top
  // so the user sees their question and the AI response below it
  useEffect(() => {
    const timer = setTimeout(() => {
      if (lastUserMsgRef.current) {
        lastUserMsgRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const handleSend = useCallback((text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;
    if (!text) setInput("");
    sendMessage(trimmed);
    if (inputRef.current) inputRef.current.style.height = "auto";
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  };

  const handleSuggestionClick = useCallback((text: string) => {
    if (isLoading) return;
    sendMessage(text);
  }, [isLoading, sendMessage]);

  const isEmpty = messages.length === 0;

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0 md:max-w-2xl md:mx-auto md:w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Rúcula AI</h1>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Limpiar chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">¡Hola! Soy Rúcula AI</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Tu asistente financiero. Preguntame sobre tus gastos, categorías, tendencias o metas de ahorro.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs px-3 py-2 rounded-full border border-border/50 bg-card text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  // Attach ref to the last user message
                  const isLastUserMsg = m.role === "user" && 
                    messages.slice(i + 1).every((msg) => msg.role !== "user");
                  return (
                    <motion.div
                      key={i}
                      ref={isLastUserMsg ? lastUserMsgRef : undefined}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <ChatMessageBubble
                        message={m}
                        onSuggestionClick={handleSuggestionClick}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start mb-3"
                >
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border/50">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border/50 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-end gap-2 bg-card border border-border/50 rounded-2xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Preguntale a Rúcula..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2 rounded-xl transition-colors shrink-0",
                input.trim() && !isLoading
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
