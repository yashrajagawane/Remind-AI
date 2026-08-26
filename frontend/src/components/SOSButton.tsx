"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function SOSButton() {
  const [isTriggered, setIsTriggered] = useState(false);

  const handleSOS = async () => {
    setIsTriggered(true);
    // Play loud audio alarm if possible
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
      audio.play().catch(e => console.log("Audio play prevented", e));
    } catch (e) {
      console.error(e);
    }
    
    // Announce
    if ("speechSynthesis" in window) {
      const msg = new SpeechSynthesisUtterance("Emergency protocol activated. Contacting family.");
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }

    // Call backend API (Mock)
    try {
      await fetch("http://localhost:8000/api/v1/sos/trigger", { method: "POST" });
    } catch (error) {
      console.log("Backend SOS triggered in dev mode.");
    }

    // Wait a bit and reset for demo
    setTimeout(() => {
      setIsTriggered(false);
    }, 10000);
  };

  return (
    <button
      onClick={handleSOS}
      className={`fixed bottom-8 right-8 z-50 flex items-center justify-center gap-4 text-white p-6 rounded-full shadow-2xl transition-all duration-300 ${
        isTriggered 
          ? "bg-red-700 w-full max-w-[90vw] right-1/2 translate-x-1/2 bottom-1/2 translate-y-1/2 animate-pulse scale-110" 
          : "bg-emergency hover:scale-105 active:scale-95"
      }`}
    >
      <AlertTriangle size={isTriggered ? 64 : 48} />
      <span className={`font-bold ${isTriggered ? "text-5xl" : "text-3xl"}`}>
        {isTriggered ? "HELP IS ON THE WAY" : "HELP"}
      </span>
    </button>
  );
}
