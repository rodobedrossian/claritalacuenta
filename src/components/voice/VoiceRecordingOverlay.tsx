import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Loader2, Wifi } from "lucide-react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isMobile = useIsMobile();
  const [audioLevel, setAudioLevel] = useState(0);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = (duration / MAX_DURATION) * 100;

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const durations = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(durations[type]);
    }
  }, []);

  // Draw circular waveform visualization
  useEffect(() => {
    if (state !== "recording" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get computed primary color from CSS and convert to proper HSLA format
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryHsl = computedStyle.getPropertyValue('--primary').trim();
    
    // Parse HSL values and create color function
    // CSS uses space-separated values (217 91% 60%), Canvas needs comma-separated (217, 91%, 60%)
    const createColor = (alpha: number) => {
      if (primaryHsl) {
        // Replace spaces with commas for proper HSLA format
        const hslWithCommas = primaryHsl.replace(/\s+/g, ', ');
        return `hsla(${hslWithCommas}, ${alpha})`;
      }
      // Fallback color
      return `rgba(59, 130, 246, ${alpha})`;
    };

    // Set canvas size for high DPI
    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = 80;

    const draw = () => {
      const levels = getAudioLevels();
      
      // Calculate average level for pulsing
      let avgLevel = 0;
      if (levels.length > 0) {
        avgLevel = Array.from(levels).reduce((a, b) => a + b, 0) / levels.length / 255;
      }
      setAudioLevel(avgLevel);

      // Clear with transparent
      ctx.clearRect(0, 0, size, size);

      // Draw outer glow rings
      const numRings = 3;
      for (let ring = numRings; ring > 0; ring--) {
        const ringRadius = baseRadius + (ring * 25) + (avgLevel * 30);
        const alpha = (0.15 - (ring * 0.04)) * (0.5 + avgLevel * 0.5);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = createColor(alpha);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw waveform bars in a circle
      const barCount = 48;
      const step = Math.max(1, Math.floor(levels.length / barCount));

      for (let i = 0; i < barCount; i++) {
        const dataIndex = (i * step) % levels.length;
        const value = levels[dataIndex] || 0;
        const normalizedValue = value / 255;
        
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const barHeight = 15 + normalizedValue * 45;
        
        const innerRadius = baseRadius - 5;
        const outerRadius = innerRadius + barHeight;
        
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;

        // Gradient from primary to primary with lower opacity
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, createColor(0.8));
        gradient.addColorStop(1, createColor(0.3));

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw center circle with gradient
      const centerGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius
      );
      centerGradient.addColorStop(0, createColor(0.2));
      centerGradient.addColorStop(0.7, createColor(0.1));
      centerGradient.addColorStop(1, createColor(0.05));

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - 10, 0, Math.PI * 2);
      ctx.fillStyle = centerGradient;
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

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

  const getStatusText = () => {
    switch (state) {
      case "connecting":
        return "Conectando...";
      case "recording":
        return "Escuchando...";
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
        return "Describe tu transacción con claridad";
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

  const isProcessing = state === "transcribing" || state === "parsing" || state === "connecting";
  const isRecording = state === "recording";
  const isConnecting = state === "connecting";

  // Display text (live partial during recording, final after)
  const displayText = isRecording ? partialText : transcribedText;

  const content = (
    <div className="flex flex-col items-center justify-center px-6 py-8 h-full min-h-[500px]">
      {/* Circular Progress Timer */}
      <div className="relative mb-6">
        {/* Progress ring */}
        <svg className="w-72 h-72 -rotate-90" viewBox="0 0 280 280">
          {/* Background ring */}
          <circle
            cx="140"
            cy="140"
            r="130"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
            fill="none"
          />
          {/* Progress ring */}
          <motion.circle
            cx="140"
            cy="140"
            r="130"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 130}
            strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
            initial={{ strokeDashoffset: 2 * Math.PI * 130 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 130 * (1 - progress / 100) }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>

        {/* Canvas for waveform - positioned inside the ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isRecording ? (
            <canvas
              ref={canvasRef}
              className="w-[280px] h-[280px]"
              style={{ width: 280, height: 280 }}
            />
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {isConnecting ? (
                <motion.div
                  className="flex flex-col items-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Wifi className="h-12 w-12 text-primary" />
                  <span className="text-xs text-muted-foreground">Conectando</span>
                </motion.div>
              ) : isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-16 w-16 text-primary" />
                </motion.div>
              ) : state === "error" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center"
                >
                  <X className="h-10 w-10 text-destructive" />
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </div>

        {/* Center mic icon when recording */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            animate={{ scale: 1 + audioLevel * 0.15 }}
            transition={{ duration: 0.1 }}
          >
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm">
              <Mic className="h-8 w-8 text-primary" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Timer Display */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-4xl font-mono font-bold text-foreground tabular-nums">
            {formatDuration(duration)}
          </span>
          <span className="text-lg text-muted-foreground font-mono">
            / {formatDuration(MAX_DURATION)}
          </span>
        </div>
        <motion.p
          className="text-lg font-medium text-foreground"
          key={state}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {getStatusText()}
        </motion.p>
        <p className="text-sm text-muted-foreground mt-1">
          {getStatusSubtext()}
        </p>
      </motion.div>

      {/* Live Transcription Display */}
      <AnimatePresence mode="wait">
        {displayText && (
          <motion.div
            key="live-text"
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="w-full max-w-sm mb-6 overflow-hidden"
          >
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50 min-h-[60px]">
              <p className="text-sm text-foreground text-center">
                {isRecording ? (
                  <motion.span
                    key={displayText}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className="inline"
                  >
                    {displayText}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="ml-0.5 inline-block w-0.5 h-4 bg-primary align-middle"
                    />
                  </motion.span>
                ) : (
                  <span className="italic">"{displayText}"</span>
                )}
              </p>
              {isRecording && (
                <p className="text-xs text-primary mt-2 text-center flex items-center justify-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Transcripción en vivo
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {state === "error" && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-sm mb-6"
          >
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-3">
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
      <Drawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
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
