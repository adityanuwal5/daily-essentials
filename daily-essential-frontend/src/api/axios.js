// Central Axios client for the DailyEssentials backend.
//
// `withCredentials: true` is essential: it makes the browser send our secure
// HttpOnly cookies (the JWT refresh cookie + access cookie) with every request,
// and accept Set-Cookie responses cross-origin (the Django CORS config allows
// http://localhost:5173 with credentials).
//
// The short-lived access token is ALSO mirrored into memory and attached as a
// Bearer header, so auth works regardless of cookie SameSite behaviour. The
// refresh token is never read by JS — it lives only in the HttpOnly cookie, so
// XSS cannot steal it. On a 401 we transparently hit /auth/refresh/ (which
// reads that cookie) and retry the original request once.

import axios from 'axios'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/* ----------------------- In-memory access token ----------------------- */
// Kept in a module variable (not localStorage) so it is never exposed to other
// scripts or persisted where XSS could read it.
let accessToken = null

export function setAccessToken(token) {
  accessToken = token || null
}

export function getAccessToken() {
  return accessToken
}

/* --------------------------- Interceptors ------------------------------ */

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Single-flight refresh: if many requests 401 at once, only one refresh fires.
let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error
    const original = config || {}

    // Don't try to refresh the refresh/login calls themselves, and only retry
    // a given request once.
    const isAuthRoute =
      original.url &&
      (original.url.includes('/auth/refresh') ||
        original.url.includes('/auth/login'))

    if (response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/auth/refresh/')
            .then((r) => r.data?.access ?? null)
            .finally(() => {
              refreshPromise = null
            })
        }
        const newAccess = await refreshPromise
        if (newAccess) {
          setAccessToken(newAccess)
          original.headers = original.headers || {}
          original.headers.Authorization = `Bearer ${newAccess}`
          return api(original)
        }
      } catch {
        // Refresh failed — fall through and reject so callers can react.
        setAccessToken(null)
      }
    }

    return Promise.reject(error)
  }
)

export default api
