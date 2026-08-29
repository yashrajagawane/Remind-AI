import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Supported languages for the voice assistant.
 * EN = English, HI = Hindi, MR = Marathi
 */
export type VoiceLang = "en-US" | "hi-IN" | "mr-IN";

export const LANG_LABELS: Record<VoiceLang, string> = {
  "en-US": "English",
  "hi-IN": "Hindi",
  "mr-IN": "Marathi",
};

/**
 * Web Speech API wrapper: continuous speech-to-text plus text-to-speech.
 * Supports English, Hindi, and Marathi with live language switching.
 */
export function useVoice(initialLang: VoiceLang = "en-US") {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState<VoiceLang>(initialLang);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const langRef = useRef<VoiceLang>(initialLang);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Build / rebuild recognition instance when lang changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionImpl = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      setSupported(false);
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    // Stop old instance if it exists
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const rec = new SpeechRecognitionImpl();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final_ = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final_ += text;
        } else {
          interim += text;
        }
      }
      if (final_) {
        setTranscript(final_.toLowerCase().trim());
      } else if (interim) {
        // Show interim so user sees feedback while speaking
        setTranscript(interim.toLowerCase().trim());
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are common, don't kill the session
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start(); } catch {}
      }
    };

    recognitionRef.current = rec;

    // If already listening when lang changed, restart with new lang
    if (isListeningRef.current) {
      try { rec.start(); } catch {}
    }

    return () => {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [lang]);

  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec && !isListeningRef.current) {
      try { rec.start(); } catch {}
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec && isListeningRef.current) {
      try { rec.stop(); } catch {}
      setIsListening(false);
      setTranscript("");
    }
  }, []);

  const speak = useCallback(
    (text: string, voiceLang?: VoiceLang) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      // Cancel any queued speech
      window.speechSynthesis.cancel();

      const msg = new SpeechSynthesisUtterance(text);
      const target = voiceLang || langRef.current;
      msg.lang = target;
      msg.rate = 0.9;
      msg.pitch = 1.0;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.startsWith(target.split("-")[0]));
      if (match) msg.voice = match;

      window.speechSynthesis.speak(msg);
    },
    []
  );

  const switchLang = useCallback((newLang: VoiceLang) => {
    setLang(newLang);
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    lang,
    supported,
    startListening,
    stopListening,
    speak,
    switchLang,
    setTranscript,
  };
}
