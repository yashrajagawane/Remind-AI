'use client';

import { useEffect, useRef } from 'react';
import { Mic, MicOff, Globe } from 'lucide-react';
import { useVoice, VoiceLang, LANG_LABELS } from '@/hooks/useVoice';

/**
 * Voice command keywords per language.
 * Each key maps to a list of trigger phrases.
 */
const COMMANDS: Record<string, { triggers: Record<VoiceLang, string[]> }> = {
  scan: {
    triggers: {
      'en-US': ['who is this', 'who is here', 'scan face', 'recognize'],
      'hi-IN': ['yeh kaun hai', 'kaun hai', 'chehra dikhao'],
      'mr-IN': ['he kaun aahe', 'chehra olakha'],
    },
  },
  help: {
    triggers: {
      'en-US': ['help me', 'emergency', 'call for help', 'i need help'],
      'hi-IN': ['madad karo', 'bachao', 'help'],
      'mr-IN': ['madad kara', 'vachva'],
    },
  },
  reminders: {
    triggers: {
      'en-US': ['show my reminders', 'what medicine', 'what do i take', 'my schedule', 'reminders'],
      'hi-IN': ['meri dawai', 'yaad dilao', 'kya lena hai'],
      'mr-IN': ['mala aathvan kara', 'aushadh'],
    },
  },
  time: {
    triggers: {
      'en-US': ['what time is it', 'what is the time', 'current time'],
      'hi-IN': ['kitna baj raha hai', 'samay kya hai'],
      'mr-IN': ['kiti vaajle', 'vel kaay'],
    },
  },
  greeting: {
    triggers: {
      'en-US': ['hello', 'good morning', 'good afternoon', 'good evening'],
      'hi-IN': ['namaste', 'namaskar'],
      'mr-IN': ['namaskar', 'namaste'],
    },
  },
};

const RESPONSES: Record<string, Record<VoiceLang, string>> = {
  scan: {
    'en-US': 'Scanning face now. Please look at the camera.',
    'hi-IN': 'Chehra scan ho raha hai. Kripya camera ki taraf dekhein.',
    'mr-IN': 'Chehra scan hot aahe. Krupaya camera kade bagha.',
  },
  help: {
    'en-US': 'Emergency protocol activated. Contacting your family now.',
    'hi-IN': 'Emergency shuru ho gaya. Aapke parivaar ko call kiya ja raha hai.',
    'mr-IN': 'Emergency suruaat. Tumchya kutumbaala call kelay.',
  },
  reminders: {
    'en-US': 'Let me check your reminders.',
    'hi-IN': 'Aapki yaad suchee dekh raha hoon.',
    'mr-IN': 'Tumchya aathvani tapasun baghto.',
  },
  time: {
    'en-US': `The current time is TIME_PLACEHOLDER.`,
    'hi-IN': 'Abhi TIME_PLACEHOLDER baj rahe hain.',
    'mr-IN': 'Sdhya TIME_PLACEHOLDER vaajle aahet.',
  },
  greeting: {
    'en-US': 'Hello! I am your companion. How can I help you?',
    'hi-IN': 'Namaste! Main aapka saathi hoon. Main kaise madad kar sakta hoon?',
    'mr-IN': 'Namaskar! Mi tumcha sathi aahe. Mi kashi madad karu shakto?',
  },
  unknown: {
    'en-US': 'I did not understand. Try saying "who is this", "show my reminders", or "help me".',
    'hi-IN': 'Main samajh nahi paaya. Kripya "yeh kaun hai", "meri dawai", ya "madad karo" bolein.',
    'mr-IN': 'Mala samajale nahi. Krupaya "he kaun aahe", "mala aathvan kara", kinva "madad kara" bola.',
  },
};

interface Props {
  onScanTrigger?: () => void;
  onSOSTrigger?: () => void;
}

export default function VoiceAssistant({ onScanTrigger, onSOSTrigger }: Props) {
  const {
    isListening,
    transcript,
    lang,
    supported,
    startListening,
    stopListening,
    speak,
    switchLang,
    setTranscript,
  } = useVoice('en-US');

  const processedRef = useRef('');

  useEffect(() => {
    if (!transcript || transcript === processedRef.current) return;

    // Only process final (non-interim) transcripts that differ
    const text = transcript.toLowerCase().trim();

    let matched = false;
    for (const [cmd, config] of Object.entries(COMMANDS)) {
      const triggers = config.triggers[lang] || config.triggers['en-US'];
      const hit = triggers.some(t => text.includes(t));
      if (!hit) continue;

      matched = true;
      processedRef.current = transcript;

      if (cmd === 'scan') {
        speak(RESPONSES.scan[lang]);
        onScanTrigger?.();
      } else if (cmd === 'help') {
        speak(RESPONSES.help[lang]);
        onSOSTrigger?.();
      } else if (cmd === 'reminders') {
        speak(RESPONSES.reminders[lang]);
        // The reminder feed on the patient page will already be visible
      } else if (cmd === 'time') {
        const now = new Date().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
        const resp = RESPONSES.time[lang].replace('TIME_PLACEHOLDER', now);
        speak(resp);
      } else if (cmd === 'greeting') {
        speak(RESPONSES.greeting[lang]);
      }

      setTranscript('');
      break;
    }

    // If no command matched after 3 seconds of silence, give a hint
    if (!matched && text.length > 10) {
      processedRef.current = transcript;
      // Only respond to clearly spoken phrases, not fragments
      speak(RESPONSES.unknown[lang]);
      setTranscript('');
    }
  }, [transcript, lang, speak, setTranscript, onScanTrigger, onSOSTrigger]);

  if (!supported) return null;

  const langs: VoiceLang[] = ['en-US', 'hi-IN', 'mr-IN'];

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Language Switcher */}
      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-2 py-1">
        <Globe size={14} className="text-brand/50 mr-1" />
        {langs.map(l => (
          <button
            key={l}
            onClick={() => switchLang(l)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              lang === l
                ? 'bg-brand text-white'
                : 'text-brand/60 hover:bg-brand/10'
            }`}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      {/* Mic Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center justify-center p-5 rounded-full shadow-xl transition-all ${
          isListening
            ? 'bg-brand text-white animate-pulse scale-110'
            : 'bg-white text-brand/60 hover:bg-brand/5'
        }`}
        title={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <Mic size={28} /> : <MicOff size={28} />}
      </button>

      {/* Live Transcript Bubble */}
      {isListening && transcript && (
        <div className="bg-brand/90 text-white px-4 py-2.5 rounded-xl max-w-xs text-sm shadow-lg animate-in fade-in">
          &ldquo;{transcript}&rdquo;
        </div>
      )}

      {/* Listening indicator */}
      {isListening && !transcript && (
        <div className="bg-white/90 backdrop-blur-sm text-brand/60 px-4 py-2 rounded-xl text-xs shadow font-medium">
          Listening in {LANG_LABELS[lang]}...
        </div>
      )}
    </div>
  );
}
