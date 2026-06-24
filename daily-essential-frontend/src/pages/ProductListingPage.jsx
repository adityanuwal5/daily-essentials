import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, PackageSearch, X } from 'lucide-react'
import FilterSidebar from '../components/product/FilterSidebar'
import ProductCard from '../components/product/ProductCard'
import { getProducts } from '../services/api'
import { CATEGORIES } from '../data/mockData'

const SORTS = [
  { value: 'popular', label: 'Popularity' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Discount' },
]

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('popular')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Filters are derived from / synced to the URL query string.
  const filters = useMemo(
    () => ({
      category: searchParams.get('category') || '',
      search: searchParams.get('search') || '',
      maxPrice: searchParams.get('maxPrice')
        ? Number(searchParams.get('maxPrice'))
        : null,
      foodType: searchParams.get('foodType') || '',
    }),
    [searchParams]
  )

  function setFilters(next) {
    const params = {}
    if (next.category) params.category = next.category
    if (next.search) params.search = next.search
    if (next.maxPrice != null) params.maxPrice = String(next.maxPrice)
    if (next.foodType) params.foodType = next.foodType
    setSearchParams(params)
  }

  function clearFilters() {
    // Preserve an active search term when clearing facet filters.
    const params = {}
    if (filters.search) params.search = filters.search
    setSearchParams(params)
  }

  // Fetch products whenever filters change (API does the filtering).
  useEffect(() => {
    let alive = true
    setLoading(true)
    getProducts(filters).then((p) => {
      if (!alive) return
      setAllProducts(p)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [filters])

  const products = useMemo(() => {
    const sorted = [...allProducts]
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'discount':
        sorted.sort(
          (a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp
        )
        break
      default:
        sorted.sort((a, b) => Number(b.trending) - Number(a.trending))
    }
    return sorted
  }, [allProducts, sort])

  const activeCategory = CATEGORIES.find((c) => c.id === filters.category)
  const heading = filters.search
    ? `Results for “${filters.search}”`
    : activeCategory
    ? activeCategory.name
    : 'All Items'

  return (
    <div className="container-app py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{heading}</h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${products.length} products`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-brand-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar (desktop) */}
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          className="hidden w-64 shrink-0 lg:block"
        />

        {/* Grid */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
              <PackageSearch className="h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-lg font-bold text-gray-900">
                No products found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or search term.
              </p>
              <button onClick={clearFilters} className="btn-primary mt-4">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-gray-50 p-4 shadow-xl animate-slide-in">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-1.5 hover:bg-gray-200"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
            />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary mt-4 w-full"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
