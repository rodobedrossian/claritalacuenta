import { useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useFinancialChat } from "@/hooks/useFinancialChat";
import { ChatMessageBubble } from "@/components/chat/ChatMessage";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { ShiningText } from "@/components/ui/shining-text";

const SUGGESTIONS = [
  "¿Cuánto gasté este mes?",
  "¿En qué categoría gasto más?",
  "¿Cómo viene mi presupuesto?",
  "Comparame los últimos 3 meses",
  "¿Puedo ahorrar $200.000 por mes?",
];

export default function Chat() {
  const { messages, isLoading, sendMessage, clearChat } = useFinancialChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);

  // Auto-scroll: put last user message right below header so user sees their question + response
  useEffect(() => {
    const scrollToLastUserMessage = () => {
      const container = scrollRef.current;
      const messageEl = lastUserMsgRef.current;
      if (container && messageEl) {
        const msgRect = messageEl.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop + (msgRect.top - contRect.top) - 16;
        container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
      } else if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    };
    const timer = setTimeout(scrollToLastUserMessage, 150);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const handleSend = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
  }, [isLoading, sendMessage]);

  const handleSuggestionClick = useCallback((text: string) => {
    if (isLoading) return;
    sendMessage(text);
  }, [isLoading, sendMessage]);

  const isEmpty = messages.length === 0;

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden md:max-w-4xl md:mx-auto md:w-full">
        {/* Header - fixed at top, never scrolls (like mobile) */}
        {!isEmpty && (
          <div className="shrink-0 flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-2 border-b border-border/50 bg-background">
            <h1 className="text-base font-medium text-foreground">Rúcula AI</h1>
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Limpiar chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Messages area - ONLY this scrolls */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar px-4 py-6"
        >
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-8 text-center">
                Preguntame lo que quieras
              </h2>
              <div className="w-full max-w-md">
                <PlaceholdersAndVanishInput
                  placeholders={SUGGESTIONS}
                  onSubmit={(_, value) => handleSend(value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-4"
                >
                  <ShiningText text="Rúcula está pensando..." />
                </motion.div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar - fixed at bottom, never scrolls (like mobile) */}
        {!isEmpty && (
          <div className="shrink-0 border-t border-border/50 bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <PlaceholdersAndVanishInput
              placeholders={SUGGESTIONS}
              onSubmit={(_, value) => handleSend(value)}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
