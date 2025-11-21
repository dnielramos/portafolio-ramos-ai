import React from 'react';
import { Topic } from '../../types';
import { HistoryIcon, CloseIcon } from '../ui/Icons';

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ isOpen, onClose, topics }) => {
  return (
    <div className={`
      absolute top-0 right-0 h-full w-80 bg-nebula-950/90 backdrop-blur-xl border-l border-nebula-800 shadow-2xl z-40
      transform transition-transform duration-300 ease-in-out flex flex-col
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-nebula-800">
        <div className="flex items-center gap-2 text-nebula-accent">
          <HistoryIcon className="w-5 h-5" />
          <h2 className="font-semibold tracking-wide">Session Memory</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-nebula-800 rounded-full"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3 opacity-60">
            <HistoryIcon className="w-12 h-12" />
            <p className="text-sm font-light">No topics discussed yet.</p>
          </div>
        ) : (
          topics.map((topic, index) => (
            <div 
              key={topic.id} 
              className="group relative p-4 rounded-xl bg-nebula-900/50 border border-nebula-800 hover:border-nebula-700 transition-all duration-300 hover:shadow-lg hover:shadow-nebula-accent/5 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute top-4 left-0 w-1 h-8 bg-nebula-accent/30 rounded-r-full group-hover:bg-nebula-accent transition-colors"></div>
              <div className="ml-2">
                <span className="text-xs font-bold text-nebula-glow uppercase tracking-wider opacity-80">
                  {topic.category}
                </span>
                <p className="text-sm text-slate-300 mt-1 font-light leading-relaxed">
                  {topic.summary}
                </p>
                <span className="text-[10px] text-slate-600 mt-2 block">
                  {new Date(topic.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-nebula-800 bg-nebula-900/30">
        <p className="text-xs text-slate-500 text-center">
          Memory is read-only for this session.
        </p>
      </div>
    </div>
  );
};