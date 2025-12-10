import axios from 'axios';

const API_BASE = '/api/auth';

export const authService = {
  async register(payload: { username: string; password: string; email?: string; displayName?: string }) {
    const res = await axios.post(`${API_BASE}/register`, payload);
    return res.data;
  },
  async login(payload: { username: string; password: string }) {
    const res = await axios.post(`${API_BASE}/login`, payload);
    return res.data;
  }
};
