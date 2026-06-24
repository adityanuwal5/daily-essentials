import { useState } from 'react'
import { Lock, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Centered credentials gateway shown in place of the dashboard when the current
// user is not an admin. It authenticates against POST /api/auth/login/; on
// success the AuthContext stores the returned user (role 'admin'), which
// unlocks the dashboard and reveals the Admin tab in the navbar.
export default function AdminLogin() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const user = await login(username.trim(), password)
      if (!(user?.role === 'admin' || user?.is_admin)) {
        // Authenticated, but not an administrator.
        setError('This account does not have admin access.')
      }
    } catch (err) {
      const status = err?.response?.status
      setError(
        status === 401
          ? 'Incorrect username or password. Please try again.'
          : 'Unable to sign in. Is the backend running?'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Lock className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-gray-900">
            Admin Access
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            This area is restricted. Sign in with your admin credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="mb-1 block text-xs font-semibold text-gray-600"
            >
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (error) setError('')
              }}
              autoFocus
              placeholder="Enter admin username"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-300 focus:border-brand-500 focus:ring-brand-100'
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1 block text-xs font-semibold text-gray-600"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Enter admin password"
                className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none transition focus:ring-2 ${
                  error
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-300 focus:border-brand-500 focus:ring-brand-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {error && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="btn-primary w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            {submitting ? 'Signing in…' : 'Login as Admin'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Use the admin account created via <span className="font-semibold">createsuperuser</span>.
        </p>
      </div>
    </div>
  )
}
