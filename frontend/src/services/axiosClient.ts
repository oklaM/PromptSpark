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

// Handle 401 Unauthorized (Token expired/invalid)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      const { logout } = useAuthStore.getState();
      logout();
      // Optionally redirect or show message
      // window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
