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
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isParsingRef = useRef<boolean>(false);
  const committedTextsRef = useRef<string[]>([]);

  // ElevenLabs Scribe hook for real-time transcription
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD, // Voice Activity Detection for automatic commits
    onPartialTranscript: (data) => {
      console.log("Partial transcript:", data.text);
      setPartialText(data.text);
    },
    onCommittedTranscript: (data) => {
      console.log("Committed transcript:", data.text);
      // Accumulate committed transcripts
      committedTextsRef.current.push(data.text);
      const fullText = committedTextsRef.current.join(" ");
      setTranscribedText(fullText);
      setPartialText("");
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Get audio levels for visualization
  const getAudioLevels = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(64).fill(0);
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

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
    if (scribe.isConnected) {
      scribe.disconnect();
    }
    
    cleanup();
    
    // Get the final text (committed + any remaining partial)
    const finalText = [...committedTextsRef.current, partialText].filter(Boolean).join(" ").trim();
    console.log("[Voice] Final transcribed text:", finalText);
    
    if (finalText && finalText.length >= 3) {
      setTranscribedText(finalText);
      setState("transcribing");
      
      // Small delay to show the transcribed text before parsing
      setTimeout(() => {
        parseTranscript(finalText);
      }, 500);
    } else {
      setError("No se detectó audio suficiente. Intenta hablar más tiempo.");
      setState("error");
    }
  }, [cleanup, scribe, partialText, parseTranscript]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setParsedTransaction(null);
      setTranscribedText("");
      setPartialText("");
      setDuration(0);
      committedTextsRef.current = [];
      setState("connecting");
      
      console.log("[Voice] Starting recording flow...");
      
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("[Voice] Microphone access granted");
      streamRef.current = stream;

      // Setup audio context and analyser for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

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
        await scribe.connect({
          token: tokenData.token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
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
      
      // Auto-stop after 30 seconds
      autoStopTimeoutRef.current = setTimeout(() => {
        console.log("[Voice] Auto-stop triggered after 30s");
        stopRecording();
      }, 30000);
      
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
    }
  }, [cleanup, scribe, stopRecording]);

  const cancel = useCallback(() => {
    if (scribe.isConnected) {
      scribe.disconnect();
    }
    cleanup();
    setState("idle");
    setDuration(0);
    setError(null);
    setPartialText("");
    setTranscribedText("");
    committedTextsRef.current = [];
  }, [cleanup, scribe]);

  const reset = useCallback(() => {
    if (scribe.isConnected) {
      scribe.disconnect();
    }
    cleanup();
    setState("idle");
    setTranscribedText("");
    setPartialText("");
    setParsedTransaction(null);
    setError(null);
    setDuration(0);
    isParsingRef.current = false;
    committedTextsRef.current = [];
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
      if (scribe.isConnected) {
        scribe.disconnect();
      }
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
