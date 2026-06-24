import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductCard from '../product/ProductCard'

// A titled section with a horizontally scrollable strip of product cards.
export default function ProductRow({ title, subtitle, products = [], viewAllHref }) {
  if (products.length === 0) return null
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="w-40 shrink-0 snap-start sm:w-48 md:w-52"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
