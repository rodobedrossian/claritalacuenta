import { useState, useRef, useCallback, useEffect } from "react";
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

// Audio encoding helper - converts Float32 to PCM16 Base64
const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
};

interface UseVoiceTransactionOptions extends UseVoiceTransactionProps {
  getToken?: () => Promise<string | null>;
}

export const useVoiceTransaction = ({ categories, userName, getToken }: UseVoiceTransactionOptions) => {
  const [state, setState] = useState<VoiceRecordingState>("idle");
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [partialText, setPartialText] = useState<string>("");
  const [parsedTransaction, setParsedTransaction] = useState<VoiceTransactionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  // Refs for managing resources
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isParsingRef = useRef<boolean>(false);
  const committedTextsRef = useRef<Set<string>>(new Set());
  const startInFlightRef = useRef(false);
  const stopInFlightRef = useRef(false);
  const stopIntentRef = useRef(false);
  const stateRef = useRef<VoiceRecordingState>(state);
  const currentPartialRef = useRef<string>("");
  const hasReceivedSpeechRef = useRef<boolean>(false);

  const MAX_DURATION_MS = 30_000;
  const SILENCE_TIMEOUT_MS = 2_000; // Stop after 2 seconds of silence (optimized for iOS feel)

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setFatalError = useCallback((message: string) => {
    console.error("[Voice] Fatal:", message);
    setError(message);
    setState("error");
    toast.error(message);
  }, []);

  // Cleanup all resources
  const cleanup = useCallback(() => {
    console.log("[Voice] Cleaning up resources...");
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (e) { /* ignore */ }
      sourceRef.current = null;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (e) { /* ignore */ }
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) { /* ignore */ }
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      try { 
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(); 
        }
      } catch (e) { /* ignore */ }
      wsRef.current = null;
    }
  }, []);

  // Get audio levels for visualization (synthetic waveform based on partial text activity)
  const getAudioLevels = useCallback((): Uint8Array => {
    if (stateRef.current !== "recording") return new Uint8Array(64).fill(0);

    const len = 64;
    const arr = new Uint8Array(len);
    const t = Date.now() / 1000;
    const activity = Math.min(1, (currentPartialRef.current?.length || 0) / 24);

    for (let i = 0; i < len; i++) {
      const phase = (i / len) * Math.PI * 2;
      const a = 0.35 + 0.35 * Math.sin(t * 6 + phase);
      const b = 0.2 + 0.2 * Math.sin(t * 2.2 + phase * 2);
      const noise = (Math.sin((t + i) * 12.9898) * 43758.5453) % 1;
      const v = (a + b + noise * 0.25) * (0.35 + activity);
      arr[i] = Math.max(0, Math.min(255, Math.floor(v * 255)));
    }
    return arr;
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
      console.log("[Voice] Parsed transaction:", transaction);
      
      if (!transaction || !transaction.amount) {
        throw new Error("No se pudo extraer la información de la transacción.");
      }
      
      setParsedTransaction(transaction);
      setState("ready");
    } catch (err: any) {
      console.error("[Voice] Error parsing transcript:", err);
      setError(err.message || "Error al procesar la grabación");
      setState("error");
      toast.error(err.message || "Error al procesar la grabación");
    } finally {
      isParsingRef.current = false;
    }
  }, [categories, userName]);

  // Stop recording and process the transcript
  const stopRecording = useCallback(async () => {
    if (stopInFlightRef.current) return;
    stopInFlightRef.current = true;
    stopIntentRef.current = true;
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
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Send final commit message if WebSocket is open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        console.log("[Voice] Sending final commit...");
        wsRef.current.send(JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: "",
          commit: true
        }));
      } catch (e) {
        console.error("[Voice] Error sending commit:", e);
      }
    }
    
    // Wait a bit for the final committed transcript, then cleanup
    setTimeout(() => {
      cleanup();
      
      // Get the final text (committed + any remaining partial)
      const committedArray = Array.from(committedTextsRef.current);
      const finalText = [...committedArray, currentPartialRef.current]
        .filter(Boolean)
        .join(" ")
        .trim()
        // Filter out invalid characters (non-printable, weird unicode)
        .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '');
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
      
      stopInFlightRef.current = false;
      stopIntentRef.current = false;
    }, 500);
  }, [cleanup, parseTranscript]);

  // Start recording with native WebSocket
  const startRecording = useCallback(async () => {
    if (startInFlightRef.current) return;
    startInFlightRef.current = true;
    
    try {
      // Reset state
      cleanup();
      setError(null);
      setParsedTransaction(null);
      setTranscribedText("");
      setPartialText("");
      currentPartialRef.current = "";
      setDuration(0);
      committedTextsRef.current = new Set();
      stopIntentRef.current = false;
      hasReceivedSpeechRef.current = false;
      setState("connecting");
      
      console.log("[Voice] Starting recording flow...");

      // 1. Get ElevenLabs scribe token (use prefetched if available)
      let token: string | null = null;
      
      if (getToken) {
        console.log("[Voice] Attempting to use prefetched token...");
        token = await getToken();
      }
      
      // Fallback to direct fetch if no prefetched token
      if (!token) {
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
        
        token = tokenData.token;
      }

      console.log("[Voice] Token ready, setting up audio capture...");

      // 2. Request microphone access
      console.log("[Voice] Requesting microphone access...");
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("La grabación de voz no está disponible en este dispositivo o navegador. Asegúrate de estar usando HTTPS.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // 3. Set up audio processing
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // 4. Create WebSocket connection to ElevenLabs
      const wsUrl = new URL("wss://api.elevenlabs.io/v1/speech-to-text/realtime");
      wsUrl.searchParams.set("model_id", "scribe_v2_realtime");
      wsUrl.searchParams.set("token", token);
      wsUrl.searchParams.set("language_code", "es");
      wsUrl.searchParams.set("sample_rate", "16000");
      wsUrl.searchParams.set("encoding", "pcm_s16le");
      wsUrl.searchParams.set("commit_strategy", "manual");
      
      console.log("[Voice] Connecting to WebSocket:", wsUrl.toString().replace(token, "TOKEN_HIDDEN"));
      
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Voice] WebSocket connected successfully!");
        
        if (stopIntentRef.current) {
          ws.close();
          return;
        }
        
        setState("recording");
        
        // Start sending audio data
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN || stopIntentRef.current) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          const base64Audio = encodeAudioForAPI(new Float32Array(inputData));
          
          try {
            ws.send(JSON.stringify({
              message_type: "input_audio_chunk",
              audio_base_64: base64Audio
            }));
          } catch (err) {
            console.error("[Voice] Error sending audio chunk:", err);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);

        // Auto-stop after MAX_DURATION
        autoStopTimeoutRef.current = setTimeout(() => {
          console.log("[Voice] Auto-stop triggered (30s limit)");
          stopRecording();
        }, MAX_DURATION_MS);

        // Reset speech detection flag
        hasReceivedSpeechRef.current = false;
      };

      // Helper to reset silence timeout
      const resetSilenceTimer = () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        // Only start silence timer after we've received some speech
        if (hasReceivedSpeechRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log("[Voice] Auto-stop triggered (3s silence)");
            stopRecording();
          }, SILENCE_TIMEOUT_MS);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const msgType = data.type || data.message_type;
          console.log("[Voice] WS message:", msgType, data.text ? `"${data.text}"` : "");
          
          switch (msgType) {
            case "partial_transcript":
              // Live partial transcript - filter out invalid characters
              currentPartialRef.current = (data.text || "")
                .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '');
              const committedArray = Array.from(committedTextsRef.current);
              const displayText = [...committedArray, currentPartialRef.current]
                .filter(Boolean)
                .join(" ");
              setPartialText(displayText);
              
              // Mark that we've received speech and reset silence timer
              if (currentPartialRef.current) {
                hasReceivedSpeechRef.current = true;
                resetSilenceTimer();
              }
              break;
              
            case "committed_transcript":
            case "final_transcript":
              // Final committed transcript - use Set to avoid duplicates
              if (data.text && data.text.trim()) {
                const cleanText = data.text.trim()
                  // Filter out invalid characters
                  .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '');
                if (cleanText && !committedTextsRef.current.has(cleanText)) {
                  committedTextsRef.current.add(cleanText);
                  const fullText = Array.from(committedTextsRef.current).join(" ");
                  setTranscribedText(fullText);
                  currentPartialRef.current = "";
                  setPartialText(fullText);
                  
                  // Reset silence timer after committed speech
                  hasReceivedSpeechRef.current = true;
                  resetSilenceTimer();
                }
              }
              break;
              
            case "error":
              console.error("[Voice] Server error:", data);
              if (!stopIntentRef.current) {
                setFatalError(data.message || data.error || "Error en la transcripción");
              }
              break;
              
            case "session_started":
              console.log("[Voice] Session started:", data.session_id);
              break;
              
            case "session_ended":
              console.log("[Voice] Session ended");
              break;
              
            default:
              // Log unknown message types for debugging
              console.log("[Voice] Unknown message type:", msgType, data);
          }
        } catch (err) {
          console.error("[Voice] Error parsing WS message:", err);
        }
      };

      ws.onerror = (e) => {
        console.error("[Voice] WebSocket error:", e);
        if (!stopIntentRef.current) {
          setFatalError("Error de conexión con el servicio de transcripción");
        }
      };

      ws.onclose = (e) => {
        console.log("[Voice] WebSocket closed:", e.code, e.reason, "wasClean:", e.wasClean);
        if (!stopIntentRef.current && stateRef.current === "recording") {
          // Unexpected close during recording
          setFatalError("Se perdió la conexión. Intentá de nuevo.");
        }
      };
      
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
  }, [cleanup, setFatalError, stopRecording]);

  const cancel = useCallback(() => {
    stopIntentRef.current = true;
    cleanup();
    setState("idle");
    setDuration(0);
    setError(null);
    setPartialText("");
    currentPartialRef.current = "";
    setTranscribedText("");
    committedTextsRef.current = new Set();
    hasReceivedSpeechRef.current = false;
  }, [cleanup]);

  const reset = useCallback(() => {
    stopIntentRef.current = true;
    cleanup();
    setState("idle");
    setTranscribedText("");
    setPartialText("");
    currentPartialRef.current = "";
    setParsedTransaction(null);
    setError(null);
    setDuration(0);
    isParsingRef.current = false;
    committedTextsRef.current = new Set();
    hasReceivedSpeechRef.current = false;
  }, [cleanup]);

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
      cleanup();
    };
  }, [cleanup]);

  // Combined live text (committed + partial)
  const liveText = [...Array.from(committedTextsRef.current), currentPartialRef.current].filter(Boolean).join(" ").trim();

  return {
    state,
    transcribedText,
    partialText: liveText || partialText, // Live text for display during recording
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
