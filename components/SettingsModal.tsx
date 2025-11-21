import React, { useState, useEffect } from 'react';
import { ChatConfig, GeminiModel } from '../types';
import { CloseIcon } from './ui/Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChatConfig;
  onSave: (config: ChatConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<ChatConfig>(config);
  const [isClosing, setIsClosing] = useState(false);

  // Reset local config when opening
  useEffect(() => {
    if (isOpen) setLocalConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleSave = () => {
    onSave(localConfig);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`
        w-full max-w-md bg-nebula-900 border border-nebula-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col
        ${isClosing ? 'animate-[scale-out_0.2s_ease-in]' : 'animate-slide-up'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-nebula-800 bg-nebula-900/50">
          <h2 className="text-xl font-semibold text-white tracking-wide">Configuration</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-nebula-accent">Model</label>
            <select
              value={localConfig.model}
              onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
              className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-nebula-accent transition-colors appearance-none"
            >
              <option value={GeminiModel.Flash}>Gemini 2.5 Flash (Fast)</option>
              <option value={GeminiModel.Pro}>Gemini 2.5 Pro (Reasoning)</option>
            </select>
          </div>

          {/* System Instruction */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-nebula-accent">System Instruction</label>
            <textarea
              value={localConfig.systemInstruction}
              onChange={(e) => setLocalConfig({ ...localConfig, systemInstruction: e.target.value })}
              className="w-full h-24 bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-nebula-accent transition-colors resize-none"
              placeholder="Define how the AI behaves..."
            />
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-nebula-accent">Temperature (Creativity)</label>
              <span className="text-xs text-slate-400">{localConfig.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localConfig.temperature}
              onChange={(e) => setLocalConfig({ ...localConfig, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-nebula-800 rounded-lg appearance-none cursor-pointer accent-nebula-accent"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-nebula-800 bg-nebula-900/50 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-nebula-accent hover:bg-cyan-400 text-nebula-950 font-bold rounded-xl transition-all duration-200 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};