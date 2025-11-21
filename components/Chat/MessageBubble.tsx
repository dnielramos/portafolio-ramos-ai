import React from 'react';
import { ChatMessage, Role } from '../../types';
import { RobotIcon, UserIcon } from '../ui/Icons';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.User;

  return (
    <div className={`flex w-full mb-6 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
          isUser 
            ? 'bg-nebula-700 text-nebula-glow' 
            : 'bg-gradient-to-br from-nebula-accent to-blue-600 text-white'
        }`}>
          {isUser ? <UserIcon className="w-5 h-5" /> : <RobotIcon className="w-5 h-5" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
            relative px-5 py-3.5 rounded-2xl shadow-md text-sm md:text-base leading-relaxed whitespace-pre-wrap
            ${isUser 
              ? 'bg-nebula-800 text-slate-100 rounded-tr-none border border-nebula-700' 
              : 'bg-gradient-to-b from-nebula-800/50 to-nebula-900/50 backdrop-blur-md text-slate-200 rounded-tl-none border border-nebula-700/50'
            }
          `}>
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-nebula-accent animate-pulse align-middle" />
            )}
          </div>
          <span className="text-xs text-slate-500 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};