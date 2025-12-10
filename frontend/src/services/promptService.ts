import axios, { AxiosInstance } from 'axios';
// type Prompt is available in store if needed; removed unused import to avoid TS warnings

const API_BASE_URL = '/api';

class PromptService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Get all prompts
  async getAllPrompts(page: number = 1, limit: number = 20) {
    const response = await this.client.get('/prompts', {
      params: { page, limit },
    });
    return response.data;
  }

  // Get single prompt
  async getPrompt(id: string) {
    const response = await this.client.get(`/prompts/${id}`);
    return response.data;
  }

  // Create new prompt
  async createPrompt(data: any) {
    const response = await this.client.post('/prompts', data);
    return response.data;
  }

  // Update prompt
  async updatePrompt(id: string, data: any) {
    const response = await this.client.put(`/prompts/${id}`, data);
    return response.data;
  }

  // Delete prompt
  async deletePrompt(id: string) {
    const response = await this.client.delete(`/prompts/${id}`);
    return response.data;
  }

  // Search prompts
  async searchPrompts(query: string, category?: string, tags?: string[]) {
    const response = await this.client.get('/prompts/search', {
      params: {
        query,
        category: category || undefined,
        tags: tags?.join(',') || undefined,
      },
    });
    return response.data;
  }

  // Toggle like
  async toggleLike(id: string, liked: boolean) {
    const response = await this.client.post(`/prompts/${id}/like`, { liked });
    return response.data;
  }
}

export const promptService = new PromptService();
