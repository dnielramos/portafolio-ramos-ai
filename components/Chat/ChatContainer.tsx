import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatConfig, ChatMessage, Role, Topic, ProjectCard, ExperienceCard } from '../../types';
import { DEFAULT_CONFIG } from '../../constants';
import { geminiService } from '../../services/geminiService';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { SettingsModal } from '../SettingsModal';
import { MemoryPanel } from './MemoryPanel';
import { SettingsIcon, RobotIcon, HistoryIcon, MicIcon, CloseIcon } from '../ui/Icons';
import { SphereVisualizer } from '../ui/SphereVisualizer';
import { LiveServerMessage } from '@google/genai';

// --- Audio Utils ---
function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const uint8 = new Uint8Array(int16.buffer);
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const b64 = btoa(binary);
    
    return {
      data: b64,
      mimeType: 'audio/pcm;rate=16000',
    };
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
}


export const ChatContainer: React.FC = () => {
  // --- State ---
  const [config, setConfig] = useState<ChatConfig>(DEFAULT_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  // Inactivity Timer State
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 15000; // 15 seconds

  // Live Audio State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0); // For sphere visualization
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  // UI Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Data ---
  const projects: ProjectCard[] = [
    { id: '1', title: 'Nebula Chat', desc: 'Real-time AI chat interface with React & Gemini.', tech: ['React', 'Gemini API', 'Tailwind'], link: '#' },
    { id: '2', title: 'Portfolio V2', desc: 'Personal brand showcase with high-end animations.', tech: ['Next.js', 'Framer Motion'], link: 'https://github.com/dnielramos' },
    { id: '3', title: 'E-Com Dash', desc: 'Angular analytics dashboard for sales data.', tech: ['Angular', 'RxJS', 'D3.js'], link: '#' },
  ];

  const experience: ExperienceCard[] = [
    { id: '1', role: 'Senior Frontend Engineer', company: 'Tech Corp', period: '2021 - Present', desc: 'Leading UI architecture.' },
    { id: '2', role: 'Full Stack Dev', company: 'StartUp Inc', period: '2018 - 2021', desc: 'Built scalable MERN apps.' },
    { id: '3', role: 'UI Designer', company: 'Creative Studio', period: '2016 - 2018', desc: 'Focused on user empathy.' },
  ];


  // --- Initialization ---
  useEffect(() => {
    geminiService.startChat(config);
  }, [config]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- Inactivity Logic ---
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
    }
    
    // Only set timer if there are messages and we are not loading and not in live mode
    if (messages.length > 0 && !isLoading && !isLiveMode) {
        inactivityTimerRef.current = setTimeout(() => {
            setMessages([]); // Reset to landing
        }, INACTIVITY_LIMIT);
    }
  }, [messages.length, isLoading, isLiveMode]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);


  // --- Chat Logic ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const categorizeTopic = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('skill') || lower.includes('habilidad') || lower.includes('tech')) return 'Skills';
    if (lower.includes('project') || lower.includes('proyecto')) return 'Projects';
    if (lower.includes('contact') || lower.includes('contacto')) return 'Contact';
    if (lower.includes('experi') || lower.includes('work')) return 'Experience';
    return 'General';
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: Role.User,
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    // Memory Update
    const category = categorizeTopic(text);
    setTopics(prev => [{
        id: Date.now().toString(),
        category: category,
        summary: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
        timestamp: Date.now()
    }, ...prev]);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiMessageId, role: Role.Model, content: '', timestamp: Date.now(), isStreaming: true }]);

    try {
      const stream = geminiService.sendMessageStream(text);
      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages((prev) => prev.map((msg) => msg.id === aiMessageId ? { ...msg, content: fullContent } : msg));
      }
    } catch (error) {
        setMessages((prev) => prev.map((msg) => msg.id === aiMessageId ? { ...msg, content: "Connection error.", isError: true } : msg));
    } finally {
      setIsLoading(false);
      setMessages((prev) => prev.map((msg) => msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg));
    }
  };


  // --- Live API Logic ---
  const startLiveSession = async () => {
    setIsLiveMode(true);
    setLiveStatus('connecting');
    
    try {
        // Audio Context Setup
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioCtx;
        nextStartTimeRef.current = audioCtx.currentTime;

        // Input Stream (Microphone)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = inputCtx.createMediaStreamSource(stream);
        inputSourceRef.current = source;

        // Script Processor for Raw PCM
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Visualization Volume Calculation (RMS)
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            setAudioVolume(Math.min(rms * 5, 1)); // Boost sensitivity

            // Send to API
            const pcmBlob = createBlob(inputData);
            if (liveSessionRef.current) {
                liveSessionRef.current.then((session: any) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);

        // Connect to Gemini Live
        liveSessionRef.current = geminiService.connectLive(config, {
            onopen: () => {
                console.log("Live Session Opened");
                setLiveStatus('connected');
            },
            onmessage: async (msg: LiveServerMessage) => {
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                     const audioBuffer = await decodeAudioData(
                        decode(audioData),
                        audioCtx,
                        24000,
                        1
                     );
                     const source = audioCtx.createBufferSource();
                     source.buffer = audioBuffer;
                     source.connect(audioCtx.destination);
                     
                     // Scheduling
                     const currentTime = audioCtx.currentTime;
                     const startTime = Math.max(nextStartTimeRef.current, currentTime);
                     source.start(startTime);
                     nextStartTimeRef.current = startTime + audioBuffer.duration;

                     // Simple volume visualization for output (fake it based on duration presence)
                     setAudioVolume(0.6); 
                     setTimeout(() => setAudioVolume(0), audioBuffer.duration * 1000);
                }
            },
            onclose: () => console.log("Live Closed"),
            onerror: (e: any) => console.error("Live Error", e)
        });

    } catch (err) {
        console.error("Failed to start live", err);
        setLiveStatus('error');
    }
  };

  const stopLiveSession = () => {
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    // Note: Currently no clean 'disconnect' on the session object in SDK types directly exposed, 
    // but we stop sending data.
    setIsLiveMode(false);
    setLiveStatus('connecting');
  };


  // --- Subcomponents ---
  const SuggestionChip = ({ label, prompt }: { label: string; prompt: string }) => (
    <button onClick={() => handleSendMessage(prompt)} className="px-4 py-2 bg-nebula-800/50 hover:bg-nebula-700 border border-nebula-700 rounded-xl text-sm text-slate-300 hover:text-nebula-glow transition-all">
      {label}
    </button>
  );

  const ProjectCardItem = ({ item }: { item: ProjectCard }) => (
    <div className="group bg-nebula-900/40 border border-nebula-800 rounded-xl p-4 hover:bg-nebula-800/60 hover:border-nebula-accent/50 transition-all duration-300 cursor-pointer">
        <h3 className="text-nebula-glow font-bold text-sm group-hover:translate-x-1 transition-transform">{item.title}</h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
        <div className="flex gap-1 mt-2 flex-wrap">
            {item.tech.map(t => <span key={t} className="text-[10px] bg-nebula-950 px-1.5 py-0.5 rounded text-slate-500">{t}</span>)}
        </div>
    </div>
  );

  const ExperienceCardItem = ({ item }: { item: ExperienceCard }) => (
    <div className="relative pl-4 border-l-2 border-nebula-800 hover:border-nebula-accent transition-colors py-2">
        <div className="absolute -left-[5px] top-3 w-2 h-2 bg-nebula-950 border border-nebula-500 rounded-full"></div>
        <h4 className="text-slate-200 text-sm font-bold">{item.role}</h4>
        <div className="flex justify-between items-center mt-0.5">
            <span className="text-xs text-nebula-accent">{item.company}</span>
            <span className="text-[10px] text-slate-500">{item.period}</span>
        </div>
    </div>
  );


  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-b from-nebula-950 to-nebula-900 text-slate-200 overflow-hidden relative">
      
      {/* --- Live Mode Overlay --- */}
      {isLiveMode && (
        <div className="absolute inset-0 z-50 bg-nebula-950 flex flex-col items-center justify-center">
            <div className="w-full h-full absolute inset-0 opacity-50">
                <SphereVisualizer isActive={true} volume={audioVolume} />
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-white tracking-tighter">
                        {liveStatus === 'connecting' ? 'Connecting...' : 'Listening'}
                    </h2>
                    <p className="text-nebula-accent text-sm uppercase tracking-widest animate-pulse">
                        {liveStatus === 'connected' ? 'Live Voice Session' : 'Establishing Uplink'}
                    </p>
                </div>

                <button 
                    onClick={stopLiveSession}
                    className="group relative flex items-center justify-center w-20 h-20 bg-red-500/10 hover:bg-red-500/20 rounded-full border border-red-500/50 transition-all duration-300"
                >
                    <div className="absolute inset-0 rounded-full border border-red-500 opacity-20 animate-ping"></div>
                    <CloseIcon className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>
      )}


      {/* --- Background --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-nebula-900/40 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-nebula-800/30 rounded-full blur-[100px] opacity-20"></div>
      </div>

      {/* --- Header --- */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-nebula-800/50 bg-nebula-950/80 backdrop-blur-lg z-10 relative">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nebula-accent to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <span className="font-bold text-white text-sm">DR</span>
            </div>
            <div>
                <h1 className="text-base font-bold text-slate-100 tracking-tight">Daniel Ramos</h1>
                <p className="text-[10px] text-nebula-accent uppercase tracking-wider">AI Portfolio v2.5</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={startLiveSession} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-nebula-900 border border-nebula-700 hover:border-nebula-accent text-xs text-nebula-glow transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nebula-glow opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-nebula-accent"></span>
                </span>
                Live Voice
            </button>
            <button onClick={() => setIsMemoryOpen(true)} className="p-2 hover:text-nebula-accent transition-colors">
                <HistoryIcon className="w-6 h-6" />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:text-nebula-accent transition-colors">
                <SettingsIcon className="w-6 h-6" />
            </button>
        </div>
      </header>

      {/* --- Main Layout --- */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left Column: Projects (Hidden on mobile, visible on large screens if chat hasn't started or user wants to see it) */}
        <div className={`hidden lg:flex flex-col w-64 border-r border-nebula-800/50 bg-nebula-950/30 p-4 gap-4 overflow-y-auto transition-opacity duration-500 ${messages.length > 0 ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Featured Projects</h2>
            {projects.map(p => <ProjectCardItem key={p.id} item={p} />)}
        </div>

        {/* Center Column: Chat */}
        <main className="flex-1 flex flex-col relative">
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 scroll-smooth">
                {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in px-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-nebula-800 to-nebula-900 border border-nebula-700 flex items-center justify-center shadow-2xl animate-pulse-slow">
                            <RobotIcon className="w-10 h-10 text-nebula-accent" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-nebula-accent">
                        Daniel Ramos
                        </h2>
                        <p className="text-slate-400 max-w-md mx-auto text-base">
                        Senior Frontend Engineer & AI Specialist
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 max-w-xl">
                        <SuggestionChip label="💼 Experience" prompt="Tell me about Daniel's professional experience." />
                        <SuggestionChip label="🛠️ Tech Stack" prompt="What is Daniel's preferred tech stack?" />
                        <SuggestionChip label="🚀 Projects" prompt="Show me Daniel's best projects." />
                        <SuggestionChip label="📬 Contact" prompt="How can I contact Daniel?" />
                    </div>
                </div>
                ) : (
                <div className="max-w-3xl mx-auto w-full pb-4">
                    {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gradient-to-t from-nebula-950 via-nebula-950/90 to-transparent">
                 <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
        </main>

        {/* Right Column: Experience (Hidden on mobile) */}
        <div className={`hidden lg:flex flex-col w-64 border-l border-nebula-800/50 bg-nebula-950/30 p-4 gap-4 overflow-y-auto transition-opacity duration-500 ${messages.length > 0 ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}>
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Experience</h2>
             <div className="space-y-6">
                {experience.map(e => <ExperienceCardItem key={e.id} item={e} />)}
             </div>
        </div>

      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config}
        onSave={setConfig}
      />

      {/* Memory Panel */}
      <MemoryPanel 
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        topics={topics}
      />
    </div>
  );
};
