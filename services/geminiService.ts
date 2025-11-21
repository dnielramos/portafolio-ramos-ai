import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import { ChatConfig, GeminiModel } from "../types";

class GeminiService {
  public ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  public apiKey: string = '';

  constructor() {
    try {
      this.apiKey = process.env.API_KEY || '';
    } catch (e) {
      console.error("API_KEY access failed.");
    }
    
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  public startChat(config: ChatConfig) {
    this.chatSession = this.ai.chats.create({
      model: config.model,
      config: {
        temperature: config.temperature,
        topK: config.topK,
        topP: config.topP,
        systemInstruction: config.systemInstruction,
      },
    });
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.chatSession) {
      throw new Error("Chat session not initialized.");
    }

    try {
      const result = await this.chatSession.sendMessageStream({ message });
      
      for await (const chunk of result) {
        const responseChunk = chunk as GenerateContentResponse;
        if (responseChunk.text) {
          yield responseChunk.text;
        }
      }
    } catch (error) {
      console.error("Error in sendMessageStream:", error);
      throw error;
    }
  }

  // Live API Connection
  public async connectLive(config: ChatConfig, callbacks: any) {
     return await this.ai.live.connect({
      model: GeminiModel.Live,
      callbacks: callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: config.systemInstruction,
      },
    });
  }
}

export const geminiService = new GeminiService();
