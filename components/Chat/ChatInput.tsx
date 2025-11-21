import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { SendIcon, MicIcon, StopIcon } from '../ui/Icons';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition with browser compatibility check
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Capture one sentence/command at a time
        recognition.interimResults = true; // Enable real-time feedback
        
        // Auto-detect user language, default to Spanish for this portfolio
        recognition.lang = navigator.language || 'es-ES';
        
        recognition.onstart = () => setIsListening(true);
        
        recognition.onend = () => setIsListening(false);

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setText(finalTranscript);
            handleSend(finalTranscript); // Auto-send when speech is final
          } else {
            setText(interimTranscript); // Show what is being spoken in real-time
          }
        };

        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setText('');
      recognitionRef.current.start();
    }
  };

  const handleSend = (overrideText?: string) => {
    const contentToSend = overrideText || text;
    if (contentToSend.trim() && !disabled) {
      onSend(contentToSend);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4">
      <div className={`
        relative flex items-end gap-2 p-2 rounded-3xl border transition-all duration-300
        ${isListening ? 'bg-nebula-900/90 border-nebula-glow shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)]' : ''}
        ${disabled ? 'bg-nebula-900/50 border-nebula-800 opacity-70' : 'bg-nebula-800/80 backdrop-blur-xl border-nebula-700 focus-within:border-nebula-accent/50 focus-within:shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]'}
      `}>
        
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled} // Don't disable while listening, allow edits
          placeholder={isListening ? "Listening..." : (disabled ? "Processing request..." : "Ask me about Daniel's skills or projects...")}
          className={`
            flex-1 max-h-[150px] bg-transparent text-slate-200 placeholder-slate-500 text-base p-3 focus:outline-none resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-nebula-700 scrollbar-track-transparent
            ${isListening ? 'animate-pulse text-nebula-glow placeholder-nebula-accent' : ''}
          `}
          rows={1}
        />

        {/* Actions */}
        <div className="flex items-center gap-1 pb-1">
            {/* Microphone Button */}
            {isSupported && (
                 <button
                 onClick={toggleListening}
                 disabled={disabled && !isListening}
                 className={`
                   p-3 rounded-full transition-all duration-300 flex items-center justify-center relative group
                   ${isListening 
                     ? 'bg-nebula-accent/20 text-nebula-glow hover:bg-nebula-accent/30' 
                     : 'hover:bg-nebula-700 text-slate-400 hover:text-nebula-accent'
                   }
                 `}
                 title="Use Voice"
               >
                 {isListening ? (
                    <>
                        <span className="absolute inset-0 rounded-full border border-nebula-glow animate-ping opacity-75"></span>
                        <StopIcon className="w-5 h-5 relative z-10" />
                    </>
                 ) : (
                    <MicIcon className="w-5 h-5" />
                 )}
               </button>
            )}

            {/* Send Button */}
            <button
                onClick={() => handleSend()}
                disabled={!text.trim() || disabled}
                className={`
                p-3 rounded-full transition-all duration-300 flex items-center justify-center
                ${!text.trim() || disabled
                    ? 'bg-nebula-900 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-nebula-accent to-blue-500 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                }
                `}
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};