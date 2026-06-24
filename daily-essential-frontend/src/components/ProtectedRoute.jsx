import { useAuth } from '../context/AuthContext'
import AdminLogin from './AdminLogin'

// Route guard for client-side RBAC.
//
// Renders its children only when the current user has the required role.
// Otherwise it renders a `fallback` IN PLACE of the protected content — never
// the children — so no sensitive metrics or layout skeletons are exposed before
// authorization. For the admin role the fallback is a credentials login gateway
// that authenticates against the backend and, on success, unlocks the children.
export default function ProtectedRoute({
  children,
  requiredRole = 'admin',
  fallback = <AdminLogin />,
}) {
  const { isAuthenticated, user, loading } = useAuth()

  // While the session is being restored from the HttpOnly cookie, hold off so
  // we don't briefly flash the login gateway to an already-authenticated admin.
  if (loading) {
    return (
      <div className="container-app flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    )
  }

  const hasAccess =
    isAuthenticated && (user?.role === requiredRole || user?.is_admin === true)

  return hasAccess ? children : fallback
}
