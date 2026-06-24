import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container-app flex flex-col items-center py-24 text-center">
      <span className="text-7xl">🛒</span>
      <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
        404 — Page not found
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </div>
  )
}
