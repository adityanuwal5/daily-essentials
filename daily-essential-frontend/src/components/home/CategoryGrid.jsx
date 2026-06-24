import { Link } from 'react-router-dom'

// Clean grid of shoppable product categories.
export default function CategoryGrid({ categories = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {categories.map((c) => (
        <Link
          key={c.id}
          to={`/products?category=${c.id}`}
          className={`group flex flex-col items-center rounded-2xl border border-gray-100 bg-gradient-to-br ${c.color} p-5 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover`}
        >
          <span className="mb-2 text-4xl transition group-hover:scale-110 sm:text-5xl">
            {c.emoji}
          </span>
          <span className="text-sm font-bold text-gray-900">{c.name}</span>
          <span className="mt-0.5 text-xs text-gray-500">{c.tagline}</span>
        </Link>
      ))}
    </div>
  )
}
