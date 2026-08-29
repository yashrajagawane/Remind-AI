'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { AlertTriangle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface Props {
  patientId: string;
}

export interface SOSButtonRef {
  triggerSOS: () => void;
}

export const SOSButton = forwardRef<SOSButtonRef, Props>(({ patientId }, ref) => {
  const [isTriggered, setIsTriggered] = useState(false);
  const [error, setError] = useState(false);

  const handleSOS = async (method: 'button' | 'voice' = 'button') => {
    if (isTriggered) return;
    
    setIsTriggered(true);
    setError(false);

    // Announce via Web Speech API
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance('Emergency protocol activated. Contacting family.');
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }

    try {
      // Call backend API
      const res = await fetchApi('/sos/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, trigger_method: method }),
      });

      if (!res.ok) {
        throw new Error('Failed to trigger SOS');
      }
    } catch (e) {
      console.error(e);
      setError(true);
    }

    // Reset visual state after 10 seconds for demo purposes
    setTimeout(() => {
      setIsTriggered(false);
      setError(false);
    }, 10000);
  };

  useImperativeHandle(ref, () => ({
    triggerSOS: () => handleSOS('voice'),
  }));

  return (
    <button
      onClick={() => handleSOS('button')}
      className={`fixed bottom-8 right-8 z-50 flex items-center justify-center gap-4 text-white p-6 rounded-full shadow-2xl transition-all duration-300 ${
        isTriggered
          ? 'bg-red-700 w-full max-w-[90vw] right-1/2 translate-x-1/2 bottom-1/2 translate-y-1/2 animate-pulse scale-110'
          : 'bg-emergency hover:scale-105 active:scale-95'
      }`}
    >
      <AlertTriangle size={isTriggered ? 64 : 48} />
      <div className="flex flex-col items-start">
        <span className={`font-bold ${isTriggered ? 'text-5xl' : 'text-3xl'}`}>
          {isTriggered ? 'HELP IS ON THE WAY' : 'HELP'}
        </span>
        {error && (
          <span className="text-white/80 text-sm mt-2">
            Failed to contact server. Please dial emergency services directly.
          </span>
        )}
      </div>
    </button>
  );
});

SOSButton.displayName = 'SOSButton';

export default SOSButton;
