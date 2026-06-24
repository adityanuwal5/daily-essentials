import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { searchProducts } from '../../services/api'
import { formatINR } from '../../utils/format'

// Search input with debounced auto-suggestions.
// Reused in the Navbar (desktop) and the Home hero.
export default function SearchBar({ size = 'md', autoFocus = false }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  // Debounced fetch of suggestions.
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      const results = await searchProducts(query)
      setSuggestions(results)
      setOpen(true)
      setActiveIdx(-1)
    }, 180)
    return () => clearTimeout(t)
  }, [query])

  // Close on outside click.
  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function submitSearch(q) {
    const term = (q ?? query).trim()
    setOpen(false)
    if (term) navigate(`/products?search=${encodeURIComponent(term)}`)
  }

  function goToProduct(p) {
    setOpen(false)
    setQuery('')
    navigate(`/products?search=${encodeURIComponent(p.name)}`)
  }

  function onKeyDown(e) {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') submitSearch()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0) goToProduct(suggestions[activeIdx])
      else submitSearch()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const heightClass = size === 'lg' ? 'h-14 text-base' : 'h-11 text-sm'

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder='Search "milk", "chocolate", "atta"...'
          aria-label="Search products"
          className={`w-full rounded-xl border border-gray-200 bg-white pl-11 pr-10 ${heightClass} shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSuggestions([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-card-hover animate-fade-in">
          {suggestions.map((p, idx) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => goToProduct(p)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                  activeIdx === idx ? 'bg-brand-50' : 'hover:bg-gray-50'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${p.color} text-lg`}
                >
                  {p.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800">
                    {p.name}
                  </span>
                  <span className="block text-xs text-gray-400">
                    {p.brand} · {p.unit}
                  </span>
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {formatINR(p.price)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
