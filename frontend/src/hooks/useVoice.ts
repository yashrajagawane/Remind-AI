import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Web Speech API wrapper: continuous speech-to-text plus text-to-speech.
 * English by default; Hindi/Marathi support is wired in Phase 7.
 */
export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Mirror of isListening so the long-lived onend handler reads the latest
  // value without re-subscribing.
  const isListeningRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionImpl = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognitionImpl();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text.toLowerCase());
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      // Auto-restart while the user still intends to listen.
      if (isListeningRef.current) {
        rec.start();
      }
    };

    recognitionRef.current = rec;

    return () => {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec && !isListeningRef.current) {
      rec.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec && isListeningRef.current) {
      rec.stop();
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const msg = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(msg);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    setTranscript, // allow clearing
  };
}
