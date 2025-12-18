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
}

export const aiService = new AiService();
