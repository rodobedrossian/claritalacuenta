import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Loader2, Wifi, AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface VoiceRecordingOverlayProps {
  isOpen: boolean;
  state: "idle" | "connecting" | "recording" | "transcribing" | "parsing" | "ready" | "error";
  duration: number;
  transcribedText?: string;
  partialText?: string; // Live transcription text
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
  getAudioLevels,
  onStop,
  onCancel,
  error
}: VoiceRecordingOverlayProps) => {
  const isMobile = useIsMobile();
  const [barHeights, setBarHeights] = useState<number[]>(new Array(NUM_BARS).fill(10));
  const animationRef = useRef<number>();

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const durations = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(durations[type]);
    }
  }, []);

  // Animate audio waveform bars
  useEffect(() => {
    if (state !== "recording") {
      // Reset bars when not recording
      setBarHeights(new Array(NUM_BARS).fill(10));
      return;
    }

    const animate = () => {
      const levels = getAudioLevels();
      const step = Math.max(1, Math.floor(levels.length / NUM_BARS));
      
      const newHeights = new Array(NUM_BARS).fill(0).map((_, i) => {
        const dataIndex = (i * step) % levels.length;
        const value = levels[dataIndex] || 0;
        const normalized = value / 255;
        // Map to height: min 8px, max 60px
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

  // Trigger haptic on state change
  useEffect(() => {
    if (state === "recording") {
      triggerHaptic('medium');
    } else if (state === "transcribing" || state === "parsing" || state === "connecting") {
      triggerHaptic('light');
    }
  }, [state, triggerHaptic]);

  const isProcessing = state === "transcribing" || state === "parsing";
  const isRecording = state === "recording";
  const isConnecting = state === "connecting";
  const isDismissible = state === "error";

  // Display text (live partial during recording, final after)
  const displayText = isRecording ? partialText : transcribedText;
  const hasText = displayText && displayText.trim().length > 0;

  // Get state-specific UI elements
  const getStateIcon = () => {
    if (isConnecting) {
      return (
        <motion.div
          className="flex flex-col items-center gap-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Wifi className="h-16 w-16 text-primary" />
        </motion.div>
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
        return "Conectando...";
      case "recording":
        return hasText ? "" : "Esperando voz...";
      case "transcribing":
        return "Finalizando...";
      case "parsing":
        return "Analizando...";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  const getStatusSubtext = () => {
    switch (state) {
      case "connecting":
        return "Iniciando transcripción en tiempo real";
      case "recording":
        return hasText ? "" : "Habla claro para mejores resultados";
      case "transcribing":
        return "Procesando audio final";
      case "parsing":
        return "Extrayendo datos de la transacción";
      case "error":
        return error || "Algo salió mal";
      default:
        return "";
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-between px-6 py-8 h-full min-h-[500px]">
      {/* Top section: Waveform + Status */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Audio Waveform Visualizer */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-[3px] h-16 mb-8"
          >
            {barHeights.map((height, i) => (
              <motion.div
                key={i}
                className="w-[4px] rounded-full bg-primary"
                initial={{ height: 8 }}
                animate={{ height }}
                transition={{ duration: 0.05, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        )}

        {/* State Icon (when not recording or no text) */}
        {(!isRecording || !hasText) && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            {getStateIcon()}
            
            {/* Pulsing mic when waiting for voice */}
            {isRecording && !hasText && (
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mic className="h-12 w-12 text-primary" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            )}
          </motion.div>
        )}

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
                <motion.p
                  className="text-2xl md:text-3xl font-medium text-foreground text-center leading-relaxed"
                  key={displayText}
                >
                  "{displayText}"
                  {isRecording && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="inline-block w-[3px] h-7 bg-primary ml-1 align-middle rounded-full"
                    />
                  )}
                </motion.p>
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
          >
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
