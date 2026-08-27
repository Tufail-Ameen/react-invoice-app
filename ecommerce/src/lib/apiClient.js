import axios from 'axios'
import { tokenStore } from './tokenStore'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

/** Session khatam hone par app ko batane ke liye. */
const sessionExpiredListeners = new Set()
export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details ?? null
  }

  /** react-hook-form ke setError ke liye field-wise errors. */
  get fieldErrors() {
    if (!this.details || Array.isArray(this.details)) return {}
    return Object.fromEntries(
      Object.entries(this.details).map(([field, messages]) => [
        field,
        Array.isArray(messages) ? messages[0] : String(messages),
      ])
    )
  }
}

api.interceptors.request.use((config) => {
  const token = tokenStore.access
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Ek waqt mein sirf ek refresh call jaye. Warna 6 parallel 401s = 6 refresh calls.
let refreshPromise = null

async function refreshTokens() {
  const refreshToken = tokenStore.refresh
  if (!refreshToken) throw new Error('No refresh token')

  refreshPromise =
    refreshPromise ??
    axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        const tokens = response.data.data.tokens
        tokenStore.set(tokens)
        return tokens
      })
      .finally(() => {
        refreshPromise = null
      })

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    if (!response) {
      throw new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Server se rabta nahi ho saka. Apna internet ya backend check karein.',
      })
    }

    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh')

    if (response.status === 401 && !config._retried && !isAuthEndpoint) {
      config._retried = true
      try {
        await refreshTokens()
        return api(config)
      } catch {
        tokenStore.clear()
        sessionExpiredListeners.forEach((listener) => listener())
      }
    }

    const payload = response.data?.error ?? {}
    throw new ApiError({
      status: response.status,
      code: payload.code ?? 'UNKNOWN_ERROR',
      message: payload.message ?? 'Kuch ghalat ho gaya. Dobara koshish karein.',
      details: payload.details,
    })
  }
)

/** Sab endpoints `{ data: ... }` envelope bhejte hain — yahin unwrap ho jata hai. */
export async function request(config) {
  const response = await api.request(config)
  return response.data?.data ?? response.data
}

export const get = (url, params) => request({ method: 'GET', url, params })
export const post = (url, data) => request({ method: 'POST', url, data })
export const patch = (url, data) => request({ method: 'PATCH', url, data })
export const put = (url, data) => request({ method: 'PUT', url, data })
export const del = (url) => request({ method: 'DELETE', url })
