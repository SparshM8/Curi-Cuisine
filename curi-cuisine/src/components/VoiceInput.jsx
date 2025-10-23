import React, { useState, useEffect } from "react";
import { FaMicrophone, FaStopCircle } from "react-icons/fa";

export default function VoiceInput() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        const currentTranscript = Array.from(e.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setTranscript(currentTranscript);
      };
      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
      // Dispatch event with the final transcript
      if (transcript.trim()) {
        const ingredients = transcript.split(/,| and /i).map(i => i.trim()).filter(Boolean);
        const event = new CustomEvent('ingredients:add', { detail: ingredients });
        window.dispatchEvent(event);
  const evt2 = new CustomEvent('toast:show', { detail: { message: `Added: ${ingredients.join(', ')}`, type: 'success' } });
  window.dispatchEvent(evt2);
      }
    } else {
      if (!recognition) {
        alert("Speech Recognition not supported in this browser.");
        return;
      }
      setTranscript("");
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div>
      <p className="text-sm text-header/70 mb-4">
        Press the button and speak your ingredients. For example: "Tomatoes, onions, and chicken".
      </p>
      <button
        onClick={toggleListening}
        className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
          isListening 
            ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' 
            : 'bg-gradient-to-r from-header to-accent'
        }`}
      >
        {isListening ? (
          <>
            <FaStopCircle className="text-xl animate-pulse" />
            🔴 Stop Recording
          </>
        ) : (
          <>
            <FaMicrophone className="text-xl" />
            🎤 Speak Ingredients
          </>
        )}
      </button>

      {transcript && (
        <div className="mt-4 p-4 bg-gradient-to-br from-white/90 to-white/70 rounded-2xl border-2 border-accent/30 shadow-inner">
          <p className="text-xs font-bold text-header/60 mb-2 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Live Transcript
          </p>
          <p className="text-base text-header font-semibold leading-relaxed">{transcript}</p>
        </div>
      )}
      {isListening && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="w-1 h-8 bg-accent rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
          <p className="text-sm font-bold text-accent">Listening to your voice...</p>
        </div>
      )}
      {toast && (
        <div className="mt-3 text-emerald-900 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-xs font-semibold">{toast}</div>
      )}
    </div>
  );
}
