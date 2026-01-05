import { useState, useRef, useCallback } from "react";
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
  users: Array<{ name: string }>;
  userName?: string;
}

type RecordingState = "idle" | "recording" | "processing";

export const useVoiceTransaction = ({ categories, users, userName }: UseVoiceTransactionProps) => {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [parsedTransaction, setParsedTransaction] = useState<VoiceTransactionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setParsedTransaction(null);
      setTranscribedText("");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        await processRecording();
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setState("recording");
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, 30000);
      
    } catch (err: any) {
      console.error("Error starting recording:", err);
      if (err.name === "NotAllowedError") {
        setError("Permiso de micrófono denegado. Por favor, habilita el acceso al micrófono.");
      } else {
        setError("Error al iniciar la grabación: " + err.message);
      }
      setState("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setState("processing");
    }
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const processRecording = async () => {
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      console.log("Audio blob size:", audioBlob.size);
      
      if (audioBlob.size < 1000) {
        throw new Error("La grabación es muy corta. Intenta hablar más tiempo.");
      }
      
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;
      
      // Step 1: Transcribe audio
      console.log("Transcribing audio...");
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
        'transcribe-audio',
        { body: { audio: audioBase64 } }
      );
      
      if (transcribeError) throw transcribeError;
      if (transcribeData.error) throw new Error(transcribeData.error);
      
      const text = transcribeData.text;
      console.log("Transcribed text:", text);
      setTranscribedText(text);
      
      if (!text || text.length < 3) {
        throw new Error("No se pudo entender el audio. Intenta hablar más claro.");
      }
      
      // Step 2: Parse transaction from text
      console.log("Parsing transaction...");
      const { data: parseData, error: parseError } = await supabase.functions.invoke(
        'parse-voice-transaction',
        { 
          body: { 
            text, 
            categories,
            users,
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
      setState("idle");
      
    } catch (err: any) {
      console.error("Error processing recording:", err);
      setError(err.message || "Error al procesar la grabación");
      setState("idle");
      toast.error(err.message || "Error al procesar la grabación");
    }
  };

  const reset = useCallback(() => {
    setState("idle");
    setTranscribedText("");
    setParsedTransaction(null);
    setError(null);
    chunksRef.current = [];
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    state,
    transcribedText,
    parsedTransaction,
    error,
    startRecording,
    stopRecording,
    reset,
    isRecording: state === "recording",
    isProcessing: state === "processing",
  };
};
