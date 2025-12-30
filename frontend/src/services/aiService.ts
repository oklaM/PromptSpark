import axiosClient from './axiosClient';
import { useSettingsStore } from '../stores/settingsStore';

export interface AiAnalysisResult {
  title?: string;
  description?: string;
  category?: string;
  tags: string[];
  content?: string;
}

export interface PromptDiagnosis {
  score: number;
  clarity: string;
  safety: string;
  logic: string;
  suggestions: string[];
}

class AiService {
  async analyzeContent(data: { content?: string; title?: string; description?: string }, targetField?: string): Promise<AiAnalysisResult> {
    const settings = useSettingsStore.getState().config;
    // We pass settings as 'config' object or individual fields. Backend handles both.
    // Let's pass as config object to be safe and cleaner.
    const response = await axiosClient.post('/ai/analyze', { 
        ...data, 
        targetField,
        config: {
            apiKey: settings.apiKey,
            baseURL: settings.baseUrl,
            provider: settings.provider,
            model: settings.model
        }
    });
    return response.data.data;
  }

  async diagnosePrompt(content: string): Promise<PromptDiagnosis> {
    const settings = useSettingsStore.getState().config;
    const response = await axiosClient.post('/ai/diagnose', {
        content,
        config: {
            apiKey: settings.apiKey,
            baseURL: settings.baseUrl,
            provider: settings.provider,
            model: settings.model
        }
    });
    return response.data.data;
  }

  async getModels(): Promise<Array<{ id: string, name: string, provider: string, color: string }>> {
    const response = await axiosClient.get('/ai/models');
    return response.data.data;
  }

  async runPrompt(
    prompt: string, 
    config: any, 
    onChunk: (text: string) => void,
    onDone?: () => void,
    onError?: (err: Error) => void,
    model?: string
  ) {
    try {
      const settings = useSettingsStore.getState().config;
      const modelToUse = model || settings.model;

      // Use fetch for SSE
      const response = await fetch('/api/ai/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            prompt, 
            config, // Generation config (temp, etc)
            model: modelToUse,
            apiKey: settings.apiKey,
            provider: settings.provider,
            baseURL: settings.baseUrl
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      if (!response.body) throw new Error('Response body is null');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let isDone = false;
      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) {
          isDone = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              onDone?.();
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                onChunk(data.text);
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

export const aiService = new AiService();
