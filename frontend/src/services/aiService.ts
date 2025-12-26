import axiosClient from './axiosClient';

export interface AiAnalysisResult {
  title?: string;
  description?: string;
  category?: string;
  tags: string[];
  content?: string;
}

class AiService {
  async analyzeContent(data: { content?: string; title?: string; description?: string }, targetField?: string): Promise<AiAnalysisResult> {
    const response = await axiosClient.post('/ai/analyze', { ...data, targetField });
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
      // Use fetch for SSE
      const response = await fetch('/api/ai/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, config, model }),
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
