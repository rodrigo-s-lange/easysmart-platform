// frontend/src/lib/api.ts
import axios from "axios";

/**
 * Resolve baseURL automaticamente:
 *  - Usa VITE_API_BASE_URL se estiver no .env.local
 *  - Caso contrário, substitui :5173 por :3010 em localhost
 *  - Fallback final: http://localhost:3010
 */
const fallbackDev =
  typeof window !== "undefined"
    ? window.location.origin.replace(":5173", ":3010")
    : "http://localhost:3010";

const baseURL =
  import.meta.env?.VITE_API_BASE_URL?.toString() ||
  fallbackDev ||
  "http://localhost:3010";

export const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

/**
 * Interceptor para anexar Bearer token do authStore persistido (Zustand)
 */
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token: string | undefined =
        parsed?.state?.tokens?.accessToken ||
        parsed?.state?.accessToken ||
        undefined;

      if (token) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
  } catch (_e) {
    // falha silenciosa
  }
  return config;
});

/**
 * Log simples de erros de resposta
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API error]", {
      url: err?.config?.url,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return Promise.reject(err);
  }
);

export default api;
