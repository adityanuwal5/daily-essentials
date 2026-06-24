import { useEffect, useMemo, useState } from 'react'
import {
  IndianRupee,
  ShoppingBag,
  Package,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react'
import {
  getAdminProducts,
  getAdminOrders,
  getDashboardMetrics,
  createProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
} from '../services/api'
import { CATEGORIES, ORDER_STATUSES } from '../data/mockData'
import { formatINR } from '../utils/format'

const STATUS_STYLES = {
  Placed: 'bg-gray-100 text-gray-700',
  Packing: 'bg-amber-100 text-amber-700',
  'Out for delivery': 'bg-blue-100 text-blue-700',
  Delivered: 'bg-green-100 text-green-700',
}

const EMPTY_PRODUCT = {
  name: '',
  brand: '',
  category: 'everyday',
  price: '',
  mrp: '',
  unit: '',
  emoji: '📦',
  color: 'from-gray-100 to-white',
  foodType: '',
  deal: '',
  deliveryMins: 15,
  rating: 4.5,
  inStock: true,
  trending: false,
  essential: false,
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // product object or null
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    Promise.all([
      getAdminProducts(),
      getAdminOrders(),
      // Live counters for the stat cards; tolerate failure so the rest of the
      // dashboard still renders.
      getDashboardMetrics().catch(() => null),
    ]).then(([p, o, m]) => {
      setProducts(p)
      setOrders(o)
      setMetrics(m)
      setLoading(false)
    })
  }, [])

  // Prefer live backend metrics; fall back to deriving from loaded lists.
  const stats = useMemo(() => {
    if (metrics) {
      return {
        totalSales: Number(metrics.total_revenue) || 0,
        orderCount: metrics.total_orders ?? 0,
        productCount: metrics.total_products ?? products.length,
        delivered: metrics.orders_by_status?.delivered ?? 0,
        lowStock: metrics.low_stock_products ?? 0,
      }
    }
    const totalSales = orders.reduce((s, o) => s + o.total, 0)
    const delivered = orders.filter((o) => o.status === 'Delivered').length
    const lowStock = products.filter((p) => !p.inStock).length
    return {
      totalSales,
      orderCount: orders.length,
      productCount: products.length,
      delivered,
      lowStock,
    }
  }, [metrics, orders, products])

  async function handleSave(form) {
    const payload = {
      ...form,
      price: Number(form.price),
      mrp: Number(form.mrp) || Number(form.price),
      deliveryMins: Number(form.deliveryMins),
      rating: Number(form.rating),
      foodType: form.foodType || null,
      deal: form.deal || null,
    }
    if (editing) {
      const updated = await updateProduct(editing.id, payload)
      setProducts((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...updated } : p))
      )
    } else {
      const created = await createProduct(payload)
      setProducts((prev) => [created, ...prev])
    }
    closeForm()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    await deleteProduct(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleStatusChange(orderId, status) {
    await updateOrderStatus(orderId, status)
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    )
  }

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }
  function openEdit(product) {
    setEditing(product)
    setShowForm(true)
  }
  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Overview of sales, orders & inventory
          </p>
        </div>
        <span className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">
          🔒 Restricted area
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Total Sales"
          value={formatINR(stats.totalSales)}
          tone="bg-brand-100 text-brand-700"
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={stats.orderCount}
          tone="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={stats.productCount}
          tone="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={TrendingUp}
          label="Delivered"
          value={stats.delivered}
          tone="bg-green-100 text-green-700"
        />
      </div>

      {/* Order fulfillment tracker */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-gray-900">
          Order Fulfillment
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {o.id}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{o.customer}</td>
                  <td className="px-4 py-3 text-gray-500">{o.city}</td>
                  <td className="px-4 py-3 text-gray-700">{o.items}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatINR(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) =>
                        handleStatusChange(o.id, e.target.value)
                      }
                      className={`rounded-lg border-0 px-2.5 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-300 ${
                        STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inventory management */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Inventory Management
          </h2>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${p.color} text-lg`}
                      >
                        {p.emoji}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {CATEGORIES.find((c) => c.id === p.category)?.name ||
                      p.category}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatINR(p.price)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                  <td className="px-4 py-3">
                    {p.inStock ? (
                      <span className="badge bg-green-100 text-green-700">
                        In stock
                      </span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3" /> Out
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-brand-50 hover:text-brand-600"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <ProductFormModal
          initial={editing}
          onClose={closeForm}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  )
}

function ProductFormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, foodType: initial.foodType || '', deal: initial.deal || '' }
      : EMPTY_PRODUCT
  )
  const [saving, setSaving] = useState(false)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {initial ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Product name" className="sm:col-span-2">
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Brand">
            <input
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Selling price (₹)">
            <input
              required
              type="number"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="MRP (₹)">
            <input
              type="number"
              value={form.mrp}
              onChange={(e) => set('mrp', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Unit (e.g. 500 ml)">
            <input
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Emoji / icon">
            <input
              value={form.emoji}
              onChange={(e) => set('emoji', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Food type">
            <select
              value={form.foodType}
              onChange={(e) => set('foodType', e.target.value)}
              className={inputCls}
            >
              <option value="">Non-food / N.A.</option>
              <option value="veg">Veg</option>
              <option value="nonveg">Non-Veg</option>
            </select>
          </Field>
          <Field label="Deal">
            <select
              value={form.deal}
              onChange={(e) => set('deal', e.target.value)}
              className={inputCls}
            >
              <option value="">No deal</option>
              <option value="BOGO">Buy 1 Get 1</option>
              <option value="MULTI">Multi-buy</option>
            </select>
          </Field>
          <Field label="Delivery (mins)">
            <input
              type="number"
              value={form.deliveryMins}
              onChange={(e) => set('deliveryMins', e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => set('inStock', e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.trending}
                onChange={(e) => set('trending', e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Trending
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.essential}
                onChange={(e) => set('essential', e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Essential
            </label>
          </div>

          <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-gray-600">
        {label}
      </span>
      {children}
    </label>
  )
}
