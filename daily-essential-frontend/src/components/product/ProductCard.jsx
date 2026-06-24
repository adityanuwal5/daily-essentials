import { Clock, Plus, Star } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatINR, discountPercent } from '../../utils/format'
import VegIndicator from '../ui/VegIndicator'
import DealBadge from '../ui/DealBadge'
import QuantityStepper from '../ui/QuantityStepper'

export default function ProductCard({ product }) {
  const { addItem, decrementItem, quantityById } = useCart()
  const quantity = quantityById[product.id] || 0
  const discount = discountPercent(product.price, product.mrp)
  const outOfStock = !product.inStock

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      {/* Image area */}
      <div
        className={`relative flex aspect-square items-center justify-center bg-gradient-to-br ${product.color}`}
      >
        {/* Discount ribbon */}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {discount}% OFF
          </span>
        )}
        {/* Veg / Non-Veg indicator */}
        <span className="absolute right-2 top-2">
          <VegIndicator foodType={product.foodType} />
        </span>

        <span className="select-none text-6xl drop-shadow-sm transition group-hover:scale-110 sm:text-7xl">
          {product.emoji}
        </span>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-md bg-gray-800 px-2 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        {/* Delivery time badge */}
        <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-gray-500">
          <Clock className="h-3 w-3 text-brand-600" />
          Delivered in {product.deliveryMins} mins
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-gray-400">{product.unit}</p>

        {/* Rating + deal */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="badge bg-green-100 text-green-700">
            <Star className="h-3 w-3 fill-current" />
            {product.rating}
          </span>
          <DealBadge deal={product.deal} />
        </div>

        {/* Price + action */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-gray-900">
                {formatINR(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>
          </div>

          <div className="w-[5.5rem] shrink-0">
            {outOfStock ? (
              <button
                disabled
                className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-200 text-xs font-semibold text-gray-400"
              >
                Notify
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={() => addItem(product)}
                className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-brand-600 bg-brand-50 text-sm font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            ) : (
              <QuantityStepper
                quantity={quantity}
                onIncrement={() => addItem(product)}
                onDecrement={() => decrementItem(product.id)}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
