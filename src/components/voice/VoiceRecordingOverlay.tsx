import { useEffect, useRef, useState } from "react";
import { Mic, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecordingOverlayProps {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  getAudioLevels: () => Uint8Array;
  onStop: () => void;
  onCancel: () => void;
  error?: string | null;
}

export const VoiceRecordingOverlay = ({
  isRecording,
  isProcessing,
  duration,
  getAudioLevels,
  onStop,
  onCancel,
  error
}: VoiceRecordingOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Draw waveform visualization
  useEffect(() => {
    if (!isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const levels = getAudioLevels();
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas with a neutral color
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      if (levels.length === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw bars
      const barCount = 32;
      const barWidth = (width / barCount) - 2;
      const barGap = 2;

      // Sample the frequency data
      const step = Math.floor(levels.length / barCount);
      
      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * step;
        const value = levels[dataIndex] || 0;
        const barHeight = Math.max(4, (value / 255) * height * 0.8);
        
        const x = i * (barWidth + barGap);
        const y = (height - barHeight) / 2;

        // Use computed primary color or fallback
        const primaryColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--primary')
          .trim();
        const [h, s, l] = primaryColor.split(' ').map(v => v.replace('%', ''));
        
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, `hsl(${h}, ${s}%, ${l}%)`);
        gradient.addColorStop(1, `hsl(${h}, ${s}%, ${l}%, 0.5)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, getAudioLevels]);

  if (!isRecording && !isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isProcessing ? 'bg-muted' : 'bg-destructive/10'
          }`}>
            {isProcessing ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <Mic className="h-8 w-8 text-destructive animate-pulse" />
            )}
          </div>
          <h2 className="text-xl font-semibold">
            {isProcessing ? "Procesando audio..." : "Grabando..."}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isProcessing 
              ? "Transcribiendo y analizando tu mensaje" 
              : "Habla claro para describir tu transacción"
            }
          </p>
        </div>

        {/* Waveform Visualization */}
        {isRecording && (
          <div className="mb-6">
            <canvas
              ref={canvasRef}
              width={320}
              height={80}
              className="w-full h-20 rounded-lg bg-muted/50"
            />
          </div>
        )}

        {/* Timer */}
        <div className="text-center mb-6">
          <span className="text-3xl font-mono font-bold text-foreground">
            {formatDuration(duration)}
          </span>
          <span className="text-muted-foreground ml-2">/ 00:30</span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}

        {/* Actions */}
        {isRecording && (
          <div className="space-y-3">
            <Button
              onClick={onStop}
              className="w-full gap-2 h-12 text-base gradient-primary"
            >
              <Send className="h-5 w-5" />
              Detener y Enviar
            </Button>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-center">
            <Button variant="ghost" onClick={onCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
