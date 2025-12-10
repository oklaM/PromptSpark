import { AxiosInstance } from 'axios';
import axiosClient from './axiosClient';
// type Prompt is available in store if needed; removed unused import to avoid TS warnings

class PromptService {
  private client: AxiosInstance;

  constructor() {
    this.client = axiosClient as AxiosInstance;
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

  // Export prompts (format: json|csv|md)
  async exportPrompts(ids?: string[], format: 'json' | 'csv' | 'md' = 'json') {
    const params: any = { format };
    if (ids && ids.length > 0) params.ids = ids.join(',');
    const response = await this.client.get('/prompts/export', { params, responseType: format === 'json' ? 'json' : 'text' });
    return response.data;
  }

  // Import prompts (items array)
  async importPrompts(items: any[]) {
    const response = await this.client.post('/prompts/import', { items });
    return response.data;
  }

  // Bulk action: { action: 'delete'|'publish'|'unpublish', ids: string[] }
  async bulkAction(action: string, ids: string[]) {
    const response = await this.client.post('/prompts/bulk', { action, ids });
    return response.data;
  }

  // Duplicate a prompt
  async duplicatePrompt(id: string) {
    const response = await this.client.post(`/prompts/${id}/duplicate`, {});
    return response.data;
  }
}

export const promptService = new PromptService();
