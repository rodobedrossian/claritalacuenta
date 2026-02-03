import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Loader2, Wifi, AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { showIOSBanner } from "@/hooks/use-ios-banner";
import type { CommittedWordWithTimestamp } from "@/hooks/useVoiceTransaction";

interface VoiceRecordingOverlayProps {
  isOpen: boolean;
  state: "idle" | "connecting" | "recording" | "transcribing" | "parsing" | "ready" | "error";
  duration: number;
  transcribedText?: string;
  partialText?: string; // Live transcription text
  committedWordsWithTimestamps?: CommittedWordWithTimestamp[] | null;
  getAudioLevels: () => Uint8Array;
  onStop: () => void;
  onCancel: () => void;
  error?: string | null;
}

const MAX_DURATION = 30;
const NUM_BARS = 40;

export const VoiceRecordingOverlay = ({
  isOpen,
  state,
  duration,
  transcribedText,
  partialText,
  committedWordsWithTimestamps,
  getAudioLevels,
  onStop,
  onCancel,
  error
}: VoiceRecordingOverlayProps) => {
  const isMobile = useIsMobile();
  const [barHeights, setBarHeights] = useState<number[]>(new Array(NUM_BARS).fill(10));
  const animationRef = useRef<number>();
  const [orbScale, setOrbScale] = useState(1);

  // Haptic feedback
  const triggerHaptic = useCallback(async (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      const styles = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      };
      await Haptics.impact({ style: styles[type] });
    } catch (e) {
      // Fallback
    }
  }, []);

  // Define derived states first to avoid ReferenceErrors
  const isProcessing = state === "transcribing" || state === "parsing";
  const isRecording = state === "recording" || state === "connecting";
  const isConnecting = state === "connecting";
  const isDismissible = state === "error" || state === "idle";
  
  const displayText = isRecording ? (partialText || "") : (transcribedText || "");
  const hasText = displayText.trim().length > 0;

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger banner on error
  useEffect(() => {
    if (state === "error" && error) {
      showIOSBanner(error, 'error');
    }
  }, [state, error]);

  // Animate audio waveform bars and orb
  useEffect(() => {
    if (state !== "recording") {
      setBarHeights(new Array(NUM_BARS).fill(10));
      setOrbScale(1);
      return;
    }

    const animate = () => {
      const levels = getAudioLevels();
      
      // Calculate average level for orb scaling
      const sum = levels.reduce((a, b) => a + b, 0);
      const avg = sum / levels.length;
      const normalizedAvg = avg / 255;
      setOrbScale(1 + normalizedAvg * 0.5);

      const step = Math.max(1, Math.floor(levels.length / NUM_BARS));
      const newHeights = new Array(NUM_BARS).fill(0).map((_, i) => {
        const dataIndex = (i * step) % levels.length;
        const value = levels[dataIndex] || 0;
        const normalized = value / 255;
        return 8 + normalized * 52;
      });
      
      setBarHeights(newHeights);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, getAudioLevels]);

  // Trigger haptic on text change
  useEffect(() => {
    if (isRecording && hasText) {
      triggerHaptic('light');
    }
  }, [displayText, isRecording, hasText, triggerHaptic]);

  // Trigger haptic on state change
  useEffect(() => {
    if (state === "recording") {
      triggerHaptic('medium');
    } else if (state === "transcribing" || state === "parsing") {
      triggerHaptic('light');
    } else if (state === "ready") {
      triggerHaptic('heavy');
    }
  }, [state, triggerHaptic]);

  // Get state-specific UI elements
  const getStateIcon = () => {
    if (isConnecting || isRecording) {
      return (
        <div className="relative flex items-center justify-center h-48 w-48">
          {/* Siri-style Animated Orb */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 blur-3xl"
            animate={{
              scale: isRecording ? [1 * orbScale, 1.2 * orbScale, 1 * orbScale] : [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-tr from-primary via-primary/80 to-primary/40 blur-xl"
            animate={{
              scale: isRecording ? orbScale : 1,
              rotate: [0, 180, 360],
            }}
            transition={{ 
              scale: { duration: 0.1, ease: "easeOut" },
              rotate: { duration: 10, repeat: Infinity, ease: "linear" }
            }}
          />
          <motion.div 
            className="relative z-10 h-24 w-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl"
            animate={{ scale: isRecording ? 0.9 + orbScale * 0.1 : 1 }}
            transition={{ duration: 0.1 }}
          >
            <Mic className="h-10 w-10 text-primary" />
          </motion.div>
          
          {/* Audio reactive rings */}
          {isRecording && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: [0.8, 1.8], 
                    opacity: [0.5, 0] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.6,
                    ease: "easeOut" 
                  }}
                />
              ))}
            </>
          )}
        </div>
      );
    }
    
    if (isProcessing) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-16 w-16 text-primary" />
        </motion.div>
      );
    }
    
    if (state === "error") {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center"
        >
          <X className="h-10 w-10 text-destructive" />
        </motion.div>
      );
    }
    
    return null;
  };

  const getStatusText = () => {
    switch (state) {
      case "connecting":
        return ""; // Totally silent connecting
      case "recording":
        return hasText ? "" : "Escuchando...";
      case "transcribing":
        return "Procesando...";
      case "parsing":
        return "Analizando...";
      case "error":
        return "Reintentar";
      default:
        return "";
    }
  };

  const getStatusSubtext = () => {
    switch (state) {
      case "recording":
        return hasText ? "" : "Decí algo como 'Gasto 5000 en comida'";
      case "error":
        return "Hubo un problema con la grabación";
      default:
        return "";
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-between px-6 py-8 h-full min-h-[500px]">
      {/* Top section: Waveform + Status */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* State Icon (Siri Orb included here) */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-12"
        >
          {getStateIcon()}
        </motion.div>

        {/* Main Transcription Text Area */}
        <AnimatePresence mode="wait">
          {hasText && (
            <motion.div
              key="transcription-area"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md px-4 mb-6"
            >
              <div className="relative min-h-[120px] flex items-center justify-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground text-center leading-relaxed">
                  {displayText.split(' ').map((word, i, arr) => {
                    const isLastWord = i === arr.length - 1;
                    const committedCount = committedWordsWithTimestamps?.length ?? 0;
                    const isInCommittedTail = committedCount > 0 && arr.length - i <= committedCount && !isLastWord;
                    const opacity = isLastWord ? 1 : isInCommittedTail ? 0.9 : 0.5;
                    const color = isLastWord ? "var(--primary)" : "currentColor";
                    return (
                      <motion.span
                        key={`${i}-${word}`}
                        initial={{ opacity: 0, y: 10, filter: "blur(10px)", scale: 0.8 }}
                        animate={{
                          opacity,
                          y: 0,
                          filter: "blur(0px)",
                          scale: 1,
                          color
                        }}
                        transition={{
                          duration: 0.4,
                          ease: [0.23, 1, 0.32, 1]
                        }}
                        className={isInCommittedTail ? "inline-block mr-2 text-muted-foreground" : "inline-block mr-2"}
                      >
                        {word}
                      </motion.span>
                    );
                  })}
                  {isRecording && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="inline-block w-[3px] h-7 bg-primary ml-1 align-middle rounded-full shadow-[0_0_10px_hsl(var(--primary))]"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Text (only when no transcription text) */}
        {getStatusText() && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.p
              className="text-xl font-medium text-foreground mb-1"
              key={state}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {getStatusText()}
            </motion.p>
            <p className="text-sm text-muted-foreground">
              {getStatusSubtext()}
            </p>
          </motion.div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {state === "error" && error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-sm mt-6"
            >
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom section: Timer + Actions */}
      <div className="w-full max-w-sm space-y-4">
        {/* Recording indicator + Timer */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-muted-foreground"
          >
             <motion.span
               className="inline-block w-2 h-2 rounded-full bg-destructive"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-medium">Grabando</span>
            <span className="text-sm font-mono tabular-nums">
              {formatDuration(duration)} / {formatDuration(MAX_DURATION)}
            </span>
          </motion.div>
        )}

        {/* Send Button - Only when recording AND has text */}
        {isRecording && hasText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={() => {
                triggerHaptic('medium');
                onStop();
              }}
              className="w-full h-14 text-lg gap-3 gradient-primary shadow-lg"
              size="lg"
            >
              <Send className="h-5 w-5" />
              Enviar
            </Button>
          </motion.div>
        )}

        {/* Cancel Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="ghost"
            onClick={() => {
              triggerHaptic('light');
              onCancel();
            }}
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </motion.div>
      </div>
    </div>
  );

  // Use Drawer on mobile for native feel
  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        dismissible={isDismissible}
        onOpenChange={(open) => {
          // Prevent accidental swipe-to-close while recording/processing.
          if (!open && isDismissible) onCancel();
        }}
      >
        <DrawerContent className="h-[85vh]">
          <VisuallyHidden>
            <DrawerTitle>Grabación de Voz</DrawerTitle>
            <DrawerDescription>
              Escuchando tu voz para registrar una transacción automáticamente.
            </DrawerDescription>
          </VisuallyHidden>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  // Use modal overlay on desktop
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            role="dialog"
            aria-labelledby="voice-dialog-title"
            aria-describedby="voice-dialog-description"
          >
            <VisuallyHidden>
              <h2 id="voice-dialog-title">Grabación de Voz</h2>
              <p id="voice-dialog-description">Escuchando tu voz para registrar una transacción automáticamente.</p>
            </VisuallyHidden>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
