
export enum Role {
  User = 'user',
  Model = 'model'
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface ChatConfig {
  model: string;
  temperature: number;
  topK: number;
  topP: number;
  systemInstruction: string;
}

export interface Topic {
  id: string;
  category: string;
  summary: string;
  timestamp: number;
}

// Available models for selection
export enum GeminiModel {
  Flash = 'gemini-2.5-flash',
  Pro = 'gemini-3-pro-preview',
  ThinkingFlash = 'gemini-2.5-flash-thinking',
  Live = 'gemini-2.5-flash-native-audio-preview-09-2025' 
}

export interface ProjectCard {
  id: string;
  title: string;
  desc: string;
  tech: string[];
  link: string;
}

export interface ExperienceCard {
  id: string;
  role: string;
  company: string;
  period: string;
  desc: string;
}
