import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { leerSesion } from '@/lib/cognito'
import { useAuthStore } from '@/store/auth.store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ─── Create instance ──────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// ─── Request interceptor — attach JWT ─────────────────────────────────────────
// leerSesion renueva el token con el refresh token de Cognito si ya vencio
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const sesion = await leerSesion().catch(() => null)
      if (sesion) {
        config.headers.Authorization = `Bearer ${sesion.accessToken}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response interceptor — handle 401 ───────────────────────────────────────
// si igual llega un 401 la sesion ya no sirve (por ejemplo, vencio el refresh token)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().logout()
      window.location.href = '/auth/login'
    }

    return Promise.reject(error)
  },
)

export default apiClient

// ─── Typed API helpers ────────────────────────────────────────────────────────
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((r) => r.data),

  delete: <T>(url: string) =>
    apiClient.delete<T>(url).then((r) => r.data),

  upload: <T>(url: string, file: File, params?: Record<string, string>) =>
    apiClient.post<T>(url, (() => { const f = new FormData(); f.append('file', file); return f })(), {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
}
