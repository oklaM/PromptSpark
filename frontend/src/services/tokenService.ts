import axiosClient from './axiosClient';

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  lastUsedAt?: string;
  createdAt: string;
}

export const tokenService = {
  async listTokens(): Promise<ApiToken[]> {
    const res = await axiosClient.get('/tokens');
    return res.data.data;
  },

  async createToken(name: string): Promise<ApiToken> {
    const res = await axiosClient.post('/tokens', { name });
    return res.data.data;
  },

  async revokeToken(id: string): Promise<void> {
    await axiosClient.delete(`/tokens/${id}`);
  }
};
