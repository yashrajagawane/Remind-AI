"use client";

import { useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";

export default function VoiceAssistant() {
  const { isListening, transcript, startListening, stopListening, speak, setTranscript } = useVoice();

  useEffect(() => {
    if (transcript.includes("who is this") || transcript.includes("who is here")) {
      speak("Scanning face now.");
      // In a real app we would use an event emitter or context to trigger the CameraFeed capture
      setTranscript('');
    } else if (transcript.includes("help me") || transcript.includes("emergency")) {
      speak("Emergency protocol activated.");
      // Trigger SOS
      setTranscript('');
    } else if (transcript.includes("show my reminders") || transcript.includes("what medicine")) {
      speak("You have 2 upcoming reminders. Vitamins at 12 PM, and Doctor Sharma at 4 PM.");
      setTranscript('');
    }
  }, [transcript, speak, setTranscript]);

  return (
    <div className="fixed top-8 right-8 z-50 flex flex-col items-end gap-2">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center justify-center p-4 rounded-full shadow-lg transition-colors ${
          isListening ? "bg-accent text-white animate-pulse" : "bg-white text-gray-500"
        }`}
      >
        {isListening ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
      {isListening && transcript && (
        <div className="bg-black/70 text-white px-4 py-2 rounded-lg max-w-xs text-sm">
          "{transcript}"
        </div>
      )}
    </div>
  );
}
