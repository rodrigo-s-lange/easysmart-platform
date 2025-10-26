/**
 * API Client com Auto Refresh Token
 */

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Adiciona token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Auto refresh em 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se erro não é 401 ou já tentou refresh, rejeita
    if (error.response?.status !== 401 || originalRequest._retry) {
      // Log de erro para debug
      console.error('[API error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }

    // Se já está refreshing, enfileira request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    if (!refreshToken) {
      isRefreshing = false;
      logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Tentar refresh
      const response = await axios.post(
        `${api.defaults.baseURL}/api/v1/auth/refresh`,
        { refreshToken }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.tokens;

      // Atualizar tokens
      setTokens(newAccessToken, newRefreshToken);

      // Processar fila
      processQueue(null, newAccessToken);

      // Retry request original
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      // Refresh falhou - fazer logout
      processQueue(refreshError, null);
      logout();
      
      // Mostrar popup de sessão expirada
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = '/login';
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
