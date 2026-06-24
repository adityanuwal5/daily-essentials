import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Sparkles } from 'lucide-react'
import HeroBanner from '../components/home/HeroBanner'
import CategoryGrid from '../components/home/CategoryGrid'
import ProductRow from '../components/home/ProductRow'
import { getBanners, getCategories, getProducts } from '../services/api'

export default function HomePage() {
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([getBanners(), getCategories(), getProducts()]).then(
      ([b, c, p]) => {
        if (!alive) return
        setBanners(b)
        setCategories(c)
        setProducts(p)
        setLoading(false)
      }
    )
    return () => {
      alive = false
    }
  }, [])

  const trending = products.filter((p) => p.trending)
  const essentials = products.filter((p) => p.essential)
  const deals = products.filter((p) => p.deal)

  return (
    <div className="container-app space-y-12 py-6">
      {/* Hero */}
      {loading ? (
        <div className="h-56 animate-pulse rounded-2xl bg-gray-200" />
      ) : (
        <HeroBanner banners={banners} />
      )}

      {/* Delivery promise strip */}
      <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-center text-sm font-semibold text-brand-700">
        <Clock className="h-4 w-4" />
        Order now and get it delivered in as fast as 15 minutes!
      </div>

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-gray-900 sm:text-2xl">
          Shop by Category
        </h2>
        <CategoryGrid categories={categories} />
      </section>

      {loading ? (
        <ProductGridSkeleton />
      ) : (
        <>
          {/* Deals banner row */}
          <ProductRow
            title="Today’s Best Deals"
            subtitle="Buy 1 Get 1 & multi-buy offers you’ll love"
            products={deals}
            viewAllHref="/products"
          />

          {/* Trending */}
          <ProductRow
            title="🔥 Trending Now"
            subtitle="What everyone in your city is ordering"
            products={trending}
            viewAllHref="/products"
          />

          {/* Daily essentials */}
          <ProductRow
            title="🧺 Daily Essentials"
            subtitle="Stock up on your everyday must-haves"
            products={essentials}
            viewAllHref="/products"
          />
        </>
      )}

      {/* App promo */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-10 text-white sm:px-10">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Save more, every order
            </span>
            <h3 className="mt-3 text-2xl font-extrabold">
              Free delivery on orders above ₹199
            </h3>
            <p className="mt-1 text-sm text-white/70">
              No surprises at checkout. Genuine brands, transparent pricing,
              lightning-fast delivery.
            </p>
          </div>
          <Link
            to="/products"
            className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-72 w-44 shrink-0 animate-pulse rounded-2xl bg-gray-200"
        />
      ))}
    </div>
  )
}
