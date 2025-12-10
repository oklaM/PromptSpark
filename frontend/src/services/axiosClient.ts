import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = '/api';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token from store on each request
axiosClient.interceptors.request.use((config) => {
  try {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // ignore
  }
  return config;
});

export default axiosClient;
