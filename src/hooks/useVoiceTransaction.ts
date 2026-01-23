import { useState, useRef, useCallback, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VoiceTransactionData {
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "ARS";
  category: string;
  description: string;
  date: string;
  owner?: string;
  confidence: number;
  notes?: string;
}

interface UseVoiceTransactionProps {
  categories: Array<{ name: string; type: string }>;
  userName?: string;
  userId?: string;
}

// More granular states for better UX feedback
export type VoiceRecordingState = 
  | "idle" 
  | "connecting"
  | "recording" 
  | "transcribing" 
  | "parsing" 
  | "ready" 
  | "error";

export const useVoiceTransaction = ({ categories, userName }: UseVoiceTransactionProps) => {
  const [state, setState] = useState<VoiceRecordingState>("idle");
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [partialText, setPartialText] = useState<string>("");
  const [parsedTransaction, setParsedTransaction] = useState<VoiceTransactionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isParsingRef = useRef<boolean>(false);
  const committedTextsRef = useRef<string[]>([]);
  const startInFlightRef = useRef(false);
  const stopInFlightRef = useRef(false);
  const stopIntentRef = useRef(false);
  const stateRef = useRef<VoiceRecordingState>(state);

  const MAX_DURATION_MS = 30_000;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setFatalError = useCallback((message: string) => {
    console.error("[Voice] Fatal:", message);
    setError(message);
    setState("error");
    toast.error(message);
  }, []);

  // ElevenLabs Scribe hook for real-time transcription
  // Using MANUAL commit strategy - recording continues until user presses Send or 30s limit
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.MANUAL, // Manual: user controls when to stop, not silence detection
    onPartialTranscript: (data) => {
      if (stateRef.current !== "recording") return;
      console.log("[Voice] Partial transcript:", data.text);
      setPartialText(data.text);
    },
    onCommittedTranscript: (data) => {
      if (stateRef.current !== "recording") return;
      console.log("[Voice] Committed transcript:", data.text);
      // Accumulate committed transcripts
      committedTextsRef.current.push(data.text);
      const fullText = committedTextsRef.current.join(" ");
      setTranscribedText(fullText);
      setPartialText("");
    },
    onConnect: () => {
      console.log("[Voice] Scribe connected");
    },
    onDisconnect: () => {
      console.log("[Voice] Scribe disconnected");
      // If we disconnected intentionally (stop/cancel/reset), don't mark error.
      if (stopIntentRef.current) return;

      // If we were in a live state, this means the connection dropped.
      const s = stateRef.current;
      if (s === "connecting" || s === "recording") {
        setFatalError("Se cortó la transcripción. Intentá de nuevo.");
      }
    },
    onError: (e) => {
      console.error("[Voice] Scribe error:", e);
      if (stopIntentRef.current) return;
      setFatalError("Error en la transcripción en tiempo real. Intentá de nuevo.");
    },
    onRateLimitedError: ({ error }) => {
      if (stopIntentRef.current) return;
      setFatalError(error || "Transcripción limitada por tasa. Probá de nuevo en unos segundos.");
    },
    onQuotaExceededError: ({ error }) => {
      if (stopIntentRef.current) return;
      setFatalError(error || "No hay cuota disponible para transcripción.");
    },
    onSessionTimeLimitExceededError: ({ error }) => {
      if (stopIntentRef.current) return;
      setFatalError(error || "Se alcanzó el límite de tiempo de la sesión.");
    },
    // Don't treat silence as an error in manual mode - we want recording to continue
    onInsufficientAudioActivityError: () => {
      // Ignore this in manual mode - user controls when to stop
      console.log("[Voice] Insufficient audio activity (ignored in manual mode)");
    },
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }, []);

  // Get audio levels for visualization
  const getAudioLevels = useCallback((): Uint8Array => {
    // Avoid grabbing the microphone twice (common iOS issue). We keep the UI responsive
    // with a synthetic waveform while Scribe owns the actual audio capture.
    if (stateRef.current !== "recording") return new Uint8Array(64).fill(0);

    const len = 64;
    const arr = new Uint8Array(len);
    const t = Date.now() / 1000;
    const activity = Math.min(1, (partialText?.length || 0) / 24);

    for (let i = 0; i < len; i++) {
      const phase = (i / len) * Math.PI * 2;
      const a = 0.35 + 0.35 * Math.sin(t * 6 + phase);
      const b = 0.2 + 0.2 * Math.sin(t * 2.2 + phase * 2);
      const noise = (Math.sin((t + i) * 12.9898) * 43758.5453) % 1;
      const v = (a + b + noise * 0.25) * (0.35 + activity);
      arr[i] = Math.max(0, Math.min(255, Math.floor(v * 255)));
    }
    return arr;
  }, [partialText]);

  // Parse the final transcript
  const parseTranscript = useCallback(async (text: string) => {
    if (isParsingRef.current || !text || text.length < 3) return;
    
    isParsingRef.current = true;
    setState("parsing");
    
    try {
      const { data: parseData, error: parseError } = await supabase.functions.invoke(
        'parse-voice-transaction',
        { 
          body: { 
            text, 
            categories,
            userName 
          } 
        }
      );
      
      if (parseError) throw parseError;
      if (parseData.error) throw new Error(parseData.error);
      
      const transaction = parseData.transaction as VoiceTransactionData;
      console.log("Parsed transaction:", transaction);
      
      if (!transaction || !transaction.amount) {
        throw new Error("No se pudo extraer la información de la transacción.");
      }
      
      setParsedTransaction(transaction);
      setState("ready");
    } catch (err: any) {
      console.error("Error parsing transcript:", err);
      setError(err.message || "Error al procesar la grabación");
      setState("error");
      toast.error(err.message || "Error al procesar la grabación");
    } finally {
      isParsingRef.current = false;
    }
  }, [categories, userName]);

  const stopRecording = useCallback(async () => {
    if (stopInFlightRef.current) return;
    stopInFlightRef.current = true;
    console.log("[Voice] Stopping recording...");
    
    // Stop timers
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    
    // Disconnect from scribe
    stopIntentRef.current = true;
    try {
      if (scribe.isConnected) {
        scribe.disconnect();
      }

      cleanup();

      // Get the final text (committed + any remaining partial)
      const finalText = [...committedTextsRef.current, partialText]
        .filter(Boolean)
        .join(" ")
        .trim();
      console.log("[Voice] Final transcribed text:", finalText);

      if (finalText && finalText.length >= 3) {
        setTranscribedText(finalText);
        setState("transcribing");

        // Small delay to show the transcribed text before parsing
        setTimeout(() => {
          parseTranscript(finalText);
        }, 350);
      } else {
        setError("No se detectó audio suficiente. Intenta hablar más tiempo.");
        setState("error");
      }
    } finally {
      // Let onDisconnect fire without turning this into an error.
      setTimeout(() => {
        stopIntentRef.current = false;
        stopInFlightRef.current = false;
      }, 250);
    }
  }, [cleanup, scribe, partialText, parseTranscript]);

  const startRecording = useCallback(async () => {
    if (startInFlightRef.current) return;
    startInFlightRef.current = true;
    try {
      // Ensure we always start from a clean slate
      stopIntentRef.current = true;
      if (scribe.isConnected) scribe.disconnect();
      scribe.clearTranscripts();
      stopIntentRef.current = false;

      setError(null);
      setParsedTransaction(null);
      setTranscribedText("");
      setPartialText("");
      setDuration(0);
      committedTextsRef.current = [];
      setState("connecting");
      
      console.log("[Voice] Starting recording flow...");

      // Get ElevenLabs scribe token
      console.log("[Voice] Fetching ElevenLabs scribe token...");
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        'elevenlabs-scribe-token'
      );
      
      if (tokenError) {
        console.error("[Voice] Token fetch error:", tokenError);
        throw new Error(tokenError.message || "No se pudo obtener el token de transcripción");
      }
      
      if (!tokenData?.token) {
        console.error("[Voice] No token in response:", tokenData);
        throw new Error("No se recibió el token de transcripción");
      }

      console.log("[Voice] Token received, connecting to ElevenLabs Scribe...");

      // Connect to ElevenLabs Scribe with real-time transcription
      try {
        stopIntentRef.current = false;
        await scribe.connect({
          token: tokenData.token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        console.log("[Voice] Connected to ElevenLabs Scribe successfully");
      } catch (connectError: any) {
        console.error("[Voice] Scribe connection error:", connectError);
        throw new Error("Error al conectar con el servicio de transcripción: " + (connectError.message || "conexión fallida"));
      }
      
      setState("recording");
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Auto-stop after MAX_DURATION
      autoStopTimeoutRef.current = setTimeout(() => {
        console.log("[Voice] Auto-stop triggered");
        stopRecording();
      }, MAX_DURATION_MS);
      
    } catch (err: any) {
      console.error("[Voice] Error starting recording:", err);
      cleanup();
      if (err.name === "NotAllowedError") {
        setError("Permiso de micrófono denegado. Por favor, habilita el acceso al micrófono.");
      } else if (err.name === "NotFoundError") {
        setError("No se encontró un micrófono. Conecta un micrófono e intenta de nuevo.");
      } else {
        setError(err.message || "Error al iniciar la grabación");
      }
      setState("error");
      toast.error(err.message || "Error al iniciar la grabación");
    } finally {
      startInFlightRef.current = false;
    }
  }, [cleanup, scribe, stopRecording]);

  const cancel = useCallback(() => {
    stopIntentRef.current = true;
    if (scribe.isConnected) scribe.disconnect();
    scribe.clearTranscripts();
    cleanup();
    setState("idle");
    setDuration(0);
    setError(null);
    setPartialText("");
    setTranscribedText("");
    committedTextsRef.current = [];
    setTimeout(() => {
      stopIntentRef.current = false;
    }, 0);
  }, [cleanup, scribe]);

  const reset = useCallback(() => {
    stopIntentRef.current = true;
    if (scribe.isConnected) scribe.disconnect();
    scribe.clearTranscripts();
    cleanup();
    setState("idle");
    setTranscribedText("");
    setPartialText("");
    setParsedTransaction(null);
    setError(null);
    setDuration(0);
    isParsingRef.current = false;
    committedTextsRef.current = [];
    setTimeout(() => {
      stopIntentRef.current = false;
    }, 0);
  }, [cleanup, scribe]);

  const retry = useCallback(() => {
    reset();
    // Small delay before starting new recording
    setTimeout(() => {
      startRecording();
    }, 100);
  }, [reset, startRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopIntentRef.current = true;
      if (scribe.isConnected) scribe.disconnect();
      cleanup();
    };
  }, [cleanup, scribe]);

  // Combined live text (committed + partial)
  const liveText = [...committedTextsRef.current, partialText].filter(Boolean).join(" ").trim() || partialText;

  return {
    state,
    transcribedText,
    partialText: liveText, // Live text for display during recording
    parsedTransaction,
    error,
    duration,
    startRecording,
    stopRecording,
    cancel,
    reset,
    retry,
    getAudioLevels,
    // Convenience booleans
    isIdle: state === "idle",
    isConnecting: state === "connecting",
    isRecording: state === "recording",
    isTranscribing: state === "transcribing",
    isParsing: state === "parsing",
    isProcessing: state === "transcribing" || state === "parsing" || state === "connecting",
    isReady: state === "ready",
    isError: state === "error",
    isActive: state !== "idle",
  };
};
