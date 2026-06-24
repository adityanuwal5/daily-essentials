import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  Trash2,
  Clock,
  Tag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatINR } from '../utils/format'
import VegIndicator from '../components/ui/VegIndicator'
import QuantityStepper from '../components/ui/QuantityStepper'

export default function CartPage() {
  const { items, totals, addItem, decrementItem, removeItem } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="container-app flex flex-col items-center justify-center py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <ShoppingCart className="h-9 w-9 text-brand-600" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-gray-900">
          Your cart is empty
        </h1>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Looks like you haven’t added anything yet. Let’s fix that — your
          daily essentials are just a tap away.
        </p>
        <Link to="/products" className="btn-primary mt-6">
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="container-app py-6">
      <h1 className="mb-5 text-2xl font-extrabold text-gray-900">
        Your Cart{' '}
        <span className="text-base font-medium text-gray-500">
          ({totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'})
        </span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Items list */}
        <div className="space-y-4">
          {/* Delivery banner */}
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            <Clock className="h-4 w-4" />
            Arriving in 15 minutes
          </div>

          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-card">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4">
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-3xl`}
                >
                  {item.emoji}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <VegIndicator foodType={item.foodType} />
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    {item.brand} · {item.unit}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900">
                      {formatINR(item.price)}
                    </span>
                    {item.mrp > item.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatINR(item.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="w-28">
                    <QuantityStepper
                      quantity={item.quantity}
                      onIncrement={() => addItem(item)}
                      onDecrement={() => decrementItem(item.id)}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatINR(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 transition hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
          >
            ← Add more items
          </Link>
        </div>

        {/* Bill summary */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <BillSummary totals={totals} />
          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary mt-4 w-full py-3 text-base"
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4" /> Safe & secure payments
          </p>
        </div>
      </div>
    </div>
  )
}

export function BillSummary({ totals, title = 'Bill Details' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>

      {totals.savings > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
          <Tag className="h-4 w-4" />
          You’re saving {formatINR(totals.savings)} on this order!
        </div>
      )}

      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label={`Items total`} value={formatINR(totals.itemsTotal)} />
        {totals.savings > 0 && (
          <Row
            label="Product discount"
            value={`- ${formatINR(totals.savings)}`}
            valueClass="text-green-600"
          />
        )}
        <Row
          label="Delivery fee"
          value={
            totals.deliveryFee === 0 ? (
              <span className="font-semibold text-green-600">FREE</span>
            ) : (
              formatINR(totals.deliveryFee)
            )
          }
        />
        <Row label="Govt. taxes & charges (GST)" value={formatINR(totals.taxes)} />

        {totals.amountToFreeDelivery > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            Add {formatINR(totals.amountToFreeDelivery)} more for FREE delivery
          </p>
        )}
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-4">
        <span className="text-base font-bold text-gray-900">To Pay</span>
        <span className="text-lg font-extrabold text-gray-900">
          {formatINR(totals.grandTotal)}
        </span>
      </div>
    </div>
  )
}

function Row({ label, value, valueClass = 'text-gray-900' }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`font-medium ${valueClass}`}>{value}</dd>
    </div>
  )
}
