import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  login as apiLogin,
  logout as apiLogout,
  restoreSession,
} from '../services/api'

// Global auth state backed by the Django JWT API.
//
// Login hits POST /api/auth/login/: the access token is held in memory by the
// Axios client and the refresh token is stored as a secure HttpOnly cookie by
// the server. On app load we attempt to restore the session from that cookie
// (refresh -> /auth/me), so an authenticated session survives page reloads.
// `role` ('admin' | 'customer') comes straight from the backend user record
// and drives client-side RBAC (admin nav link, /admin route).

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore an existing session (if the HttpOnly refresh cookie is still valid).
  useEffect(() => {
    let alive = true
    restoreSession()
      .then((u) => {
        if (alive) setUser(u)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  // Authenticate against the backend; returns the user on success, throws on
  // failure so the caller (login form) can surface an error message.
  const login = async (username, password) => {
    const loggedIn = await apiLogin(username, password)
    setUser(loggedIn)
    return loggedIn
  }

  const logout = async () => {
    await apiLogout()
    setUser(null)
  }

  const value = useMemo(() => {
    const isAuthenticated = Boolean(user)
    const isAdmin =
      isAuthenticated && (user.role === 'admin' || user.is_admin === true)
    return {
      user,
      loading,
      isAuthenticated,
      isAdmin,
      login,
      logout,
    }
  }, [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
