import { SlidersHorizontal, X } from 'lucide-react'
import { CATEGORIES } from '../../data/mockData'
import { formatINR } from '../../utils/format'

const FOOD_TYPES = [
  { value: '', label: 'All' },
  { value: 'veg', label: 'Veg' },
  { value: 'nonveg', label: 'Non-Veg' },
]

const PRICE_MAX = 300

// Controlled filter panel. Parent owns `filters` state; this only emits changes.
export default function FilterSidebar({ filters, onChange, onClear, className = '' }) {
  function update(patch) {
    onChange({ ...filters, ...patch })
  }

  return (
    <aside className={className}>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </h2>
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        </div>

        {/* Category */}
        <div className="border-t border-gray-100 py-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Category
          </h3>
          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="category"
                checked={!filters.category}
                onChange={() => update({ category: '' })}
                className="accent-brand-600"
              />
              All categories
            </label>
            {CATEGORIES.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === c.id}
                  onChange={() => update({ category: c.id })}
                  className="accent-brand-600"
                />
                <span>{c.emoji}</span>
                {c.name}
              </label>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div className="border-t border-gray-100 py-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Max Price
          </h3>
          <input
            type="range"
            min="0"
            max={PRICE_MAX}
            step="10"
            value={filters.maxPrice ?? PRICE_MAX}
            onChange={(e) =>
              update({
                maxPrice:
                  Number(e.target.value) >= PRICE_MAX
                    ? null
                    : Number(e.target.value),
              })
            }
            className="w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{formatINR(0)}</span>
            <span className="font-semibold text-gray-800">
              {filters.maxPrice == null
                ? `${formatINR(PRICE_MAX)}+`
                : `Up to ${formatINR(filters.maxPrice)}`}
            </span>
          </div>
        </div>

        {/* Veg / Non-Veg */}
        <div className="border-t border-gray-100 py-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Food Preference
          </h3>
          <div className="flex gap-2">
            {FOOD_TYPES.map((ft) => (
              <button
                key={ft.value}
                onClick={() => update({ foodType: ft.value })}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                  (filters.foodType || '') === ft.value
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {ft.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
