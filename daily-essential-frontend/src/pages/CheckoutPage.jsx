import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Home,
  Briefcase,
  Smartphone,
  Landmark,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { placeOrder } from '../services/api'
import { formatINR } from '../utils/format'
import { BillSummary } from './CartPage'

const SAVED_ADDRESSES = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    line: '402, Sunrise Apartments, Andheri West, Mumbai - 400058',
  },
  {
    id: 'work',
    label: 'Work',
    icon: Briefcase,
    line: '7th Floor, Tech Park, BKC, Mumbai - 400051',
  },
]

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm & more', icon: Smartphone },
  { id: 'netbanking', label: 'Net Banking', desc: 'All major banks', icon: Landmark },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when it arrives', icon: Wallet },
]

export default function CheckoutPage() {
  const { items, totals, clearCart } = useCart()
  const navigate = useNavigate()

  const [addressId, setAddressId] = useState('home')
  const [payment, setPayment] = useState('upi')
  const [placing, setPlacing] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const [orderError, setOrderError] = useState('')
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    line: '',
    pincode: '',
  })
  const [useNew, setUseNew] = useState(false)

  // Empty-cart guard (but allow the success screen through).
  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="container-app py-24 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Nothing to check out
        </h1>
        <p className="mt-1 text-sm text-gray-500">Your cart is empty.</p>
        <Link to="/products" className="btn-primary mt-6">
          Browse Products
        </Link>
      </div>
    )
  }

  async function handlePlaceOrder() {
    setPlacing(true)
    setOrderError('')

    // Flatten the selected/new address into a single delivery string for the API.
    const deliveryAddress = useNew
      ? [newAddress.name, newAddress.line, newAddress.pincode, newAddress.phone]
          .filter(Boolean)
          .join(', ')
      : SAVED_ADDRESSES.find((a) => a.id === addressId)?.line || ''

    try {
      const order = await placeOrder({
        items: items.map((i) => ({ id: i.id, qty: i.quantity })),
        delivery_address: deliveryAddress,
        payment_method: payment,
      })
      setConfirmedOrder(order)
      clearCart()
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        setOrderError('Please sign in to place your order.')
      } else {
        setOrderError(
          err?.response?.data?.detail ||
            err?.response?.data?.items_input ||
            'Could not place your order. Please try again.'
        )
      }
    } finally {
      setPlacing(false)
    }
  }

  // ---- Success screen ----
  if (confirmedOrder) {
    return (
      <div className="container-app flex flex-col items-center py-20 text-center">
        <CheckCircle2 className="h-20 w-20 text-brand-500" />
        <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
          Order Confirmed!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Order <span className="font-bold text-gray-800">#{confirmedOrder.id}</span>{' '}
          placed successfully.
        </p>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand-50 px-5 py-3 text-sm font-bold text-brand-700">
          <Clock className="h-5 w-5" /> Arriving in 15 minutes
        </div>
        <p className="mt-6 max-w-sm text-sm text-gray-500">
          We’ve sent the receipt to your registered number. Track your order
          from the orders page.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/products" className="btn-outline">
            Continue Shopping
          </Link>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // ---- Checkout form ----
  return (
    <div className="container-app py-6">
      <h1 className="mb-5 text-2xl font-extrabold text-gray-900">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Address */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
              <MapPin className="h-5 w-5 text-brand-600" /> Delivery Address
            </h2>

            <div className="space-y-3">
              {SAVED_ADDRESSES.map((a) => {
                const Icon = a.icon
                const active = !useNew && addressId === a.id
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAddressId(a.id)
                      setUseNew(false)
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      active
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {a.label}
                      </p>
                      <p className="text-xs text-gray-500">{a.line}</p>
                    </div>
                    {active && (
                      <CheckCircle2 className="h-5 w-5 text-brand-600" />
                    )}
                  </button>
                )
              })}

              {/* Add new address */}
              <button
                onClick={() => setUseNew((v) => !v)}
                className={`w-full rounded-xl border border-dashed p-3 text-sm font-semibold transition ${
                  useNew
                    ? 'border-brand-600 text-brand-700'
                    : 'border-gray-300 text-gray-600 hover:border-brand-400'
                }`}
              >
                + Add a new address
              </button>

              {useNew && (
                <div className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    value={newAddress.name}
                    onChange={(v) => setNewAddress({ ...newAddress, name: v })}
                  />
                  <Input
                    label="Phone number"
                    value={newAddress.phone}
                    onChange={(v) => setNewAddress({ ...newAddress, phone: v })}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Address (house no, street, area)"
                      value={newAddress.line}
                      onChange={(v) => setNewAddress({ ...newAddress, line: v })}
                    />
                  </div>
                  <Input
                    label="Pincode"
                    value={newAddress.pincode}
                    onChange={(v) =>
                      setNewAddress({ ...newAddress, pincode: v })
                    }
                  />
                </div>
              )}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
              <Wallet className="h-5 w-5 text-brand-600" /> Payment Method
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon
                const active = payment === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setPayment(m.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                      active
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {m.label}
                      </p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                    <span
                      className={`h-4 w-4 rounded-full border-2 ${
                        active
                          ? 'border-brand-600 bg-brand-600 ring-2 ring-brand-200'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              This is a demo. No real payment will be processed.
            </p>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-gray-900">
              Order Summary ({totals.itemCount} items)
            </h2>
            <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
              {items.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate text-gray-600">
                    {i.name}{' '}
                    <span className="text-gray-400">× {i.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-800">
                    {formatINR(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <BillSummary totals={totals} />

          {orderError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {orderError}
            </p>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="btn-primary mt-4 w-full py-3 text-base"
          >
            {placing ? (
              'Placing order…'
            ) : (
              <>
                Place Order · {formatINR(totals.grandTotal)}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  )
}
