// Centralised API layer for DailyEssentials.
//
// Components never call the network directly — they only import from here, so
// the UI is decoupled from transport details and backend field names. This
// module talks to the Django REST API through the shared Axios client and
// NORMALISES backend records into the shape the existing UI components expect.
//
// Live Django REST endpoints used:
//   POST   /api/auth/login/                 { username, password } -> { access, user }
//   POST   /api/auth/refresh/               (reads HttpOnly cookie)
//   POST   /api/auth/logout/
//   GET    /api/auth/me/
//   GET    /api/products/                   ?category=&min_price=&max_price=&food_type=&search=
//   GET    /api/products/:id/
//   POST   /api/orders/                     { delivery_address, payment_method, items_input }
//   GET    /api/admin/dashboard-metrics/
//   GET/POST/PUT/PATCH/DELETE /api/admin/products/[:id/]
//
// Set VITE_USE_MOCK="true" to fall back to bundled mock data (offline dev).

import api, { setAccessToken } from '../api/axios'
import {
  PRODUCTS,
  CATEGORIES,
  BANNERS,
  ORDERS,
} from '../data/mockData'

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true'

// Simulate network latency so loading states are exercised in mock mode.
const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms))

/* --------------------------- Normalisation ---------------------------- */
// The backend Product fields differ from the UI's shape. These maps + the
// normaliser bridge the two so components (ProductCard, HomePage, etc.) need
// zero changes. Presentation-only attributes the API doesn't store (gradient
// colour, trending/essential flags, star rating) are derived deterministically.

const CATEGORY_COLOR = {
  dairy: 'from-blue-100 to-white',
  snacks: 'from-amber-100 to-white',
  hygiene: 'from-sky-100 to-white',
  everyday: 'from-emerald-100 to-white',
}

const CATEGORY_EMOJI = {
  dairy: '🥛',
  snacks: '🍫',
  hygiene: '🧼',
  everyday: '🛒',
}

function normalizeProduct(p) {
  if (!p) return null
  const price = Number(p.price)
  const mrp = p.mrp != null ? Number(p.mrp) : price
  // Deterministic 4.3–4.8 star rating derived from id (stable across reloads).
  const rating = Math.round((4.3 + ((Number(p.id) || 0) % 6) * 0.1) * 10) / 10
  const inStock =
    p.in_stock != null ? Boolean(p.in_stock) : Number(p.stock_quantity) > 0

  return {
    id: p.id,
    name: p.name,
    brand: p.brand || '',
    category: p.category,
    description: p.description || '',
    price,
    mrp,
    unit: p.unit || '',
    emoji: p.image_emoji || CATEGORY_EMOJI[p.category] || '📦',
    color: CATEGORY_COLOR[p.category] || 'from-gray-100 to-white',
    // Hygiene items are non-food -> no veg/non-veg indicator.
    foodType:
      p.category === 'hygiene'
        ? null
        : p.food_type || (p.is_veg ? 'veg' : 'nonveg'),
    deal: p.deal_badge || null,
    deliveryMins: p.estimated_delivery_time ?? 15,
    rating,
    inStock,
    stock_quantity: p.stock_quantity,
    // Presentation flags so the homepage rows stay populated until the API
    // exposes its own merchandising fields.
    trending: Boolean(p.deal_badge) || rating >= 4.6,
    essential: ['dairy', 'everyday', 'hygiene'].includes(p.category),
  }
}

// UI form shape -> backend payload (admin create/update).
function denormalizeProduct(form) {
  const price = Number(form.price)
  return {
    name: form.name,
    brand: form.brand || '',
    unit: form.unit || '',
    category: form.category,
    description: form.description || '',
    price,
    mrp: Number(form.mrp) || price,
    image_emoji: form.emoji || '',
    is_veg: form.foodType !== 'nonveg',
    deal_badge: form.deal || null,
    estimated_delivery_time: Number(form.deliveryMins) || 15,
    // The UI tracks stock as a boolean; map it to a quantity.
    stock_quantity: form.inStock
      ? Number(form.stock_quantity) > 0
        ? Number(form.stock_quantity)
        : 50
      : 0,
    is_active: true,
  }
}

// A DRF list endpoint may return a plain array or a paginated { results: [] }.
function asList(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

/* ------------------------------- Auth ------------------------------- */

export async function login(username, password) {
  const { data } = await api.post('/auth/login/', { username, password })
  // Keep the transient access token in memory for Bearer auth; the refresh
  // token is set as an HttpOnly cookie by the server (not visible here).
  setAccessToken(data.access)
  return data.user
}

export async function logout() {
  try {
    await api.post('/auth/logout/')
  } finally {
    setAccessToken(null)
  }
}

// Restore a session on app load: refresh the access token from the HttpOnly
// cookie, then fetch the current user. Returns null if not authenticated.
export async function restoreSession() {
  try {
    const { data } = await api.post('/auth/refresh/')
    if (data?.access) setAccessToken(data.access)
    const me = await api.get('/auth/me/')
    return me.data
  } catch {
    setAccessToken(null)
    return null
  }
}

export async function getMe() {
  const { data } = await api.get('/auth/me/')
  return data
}

/* ----------------------------- Catalog ----------------------------- */

// Categories & banners are presentation config the API does not serve; keep
// them sourced from the bundled constants.
export async function getCategories() {
  await delay(60)
  return CATEGORIES
}

export async function getBanners() {
  await delay(60)
  return BANNERS
}

export async function getProducts(filters = {}) {
  if (USE_MOCK) {
    await delay(200)
    return applyFilters(PRODUCTS, filters)
  }
  const params = {}
  if (filters.category) params.category = filters.category
  if (filters.search) params.search = filters.search
  if (filters.minPrice != null) params.min_price = filters.minPrice
  if (filters.maxPrice != null) params.max_price = filters.maxPrice
  if (filters.foodType) params.food_type = filters.foodType

  const { data } = await api.get('/products/', { params })
  return asList(data).map(normalizeProduct)
}

export async function getProductById(id) {
  if (USE_MOCK) {
    await delay(120)
    return PRODUCTS.find((p) => p.id === Number(id)) || null
  }
  const { data } = await api.get(`/products/${id}/`)
  return normalizeProduct(data)
}

// Lightweight search used by the header auto-suggest. Returns name matches only.
export async function searchProducts(query) {
  const q = query.trim()
  if (!q) return []
  if (USE_MOCK) {
    await delay(80)
    const lc = q.toLowerCase()
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lc) ||
        p.brand.toLowerCase().includes(lc)
    ).slice(0, 6)
  }
  const { data } = await api.get('/products/', { params: { search: q } })
  return asList(data).map(normalizeProduct).slice(0, 6)
}

/* ------------------------------ Orders ----------------------------- */

export async function placeOrder(payload) {
  if (USE_MOCK) {
    await delay(500)
    return {
      id: `DE-${Math.floor(10000 + Math.random() * 89999)}`,
      status: 'Placed',
      ...payload,
    }
  }
  // The cart sends UI items; translate to the backend's checkout contract.
  // Totals are intentionally NOT trusted by the server — it recomputes them.
  const body = {
    delivery_address: payload.delivery_address,
    payment_method: payload.payment_method || 'cod',
    items_input: (payload.items || []).map((i) => ({
      product: i.id,
      quantity: i.qty ?? i.quantity ?? 1,
    })),
  }
  const { data } = await api.post('/orders/', body)
  return data
}

/* ------------------------------ Admin ------------------------------ */

export async function getDashboardMetrics() {
  const { data } = await api.get('/admin/dashboard-metrics/')
  return data
}

export async function getAdminOrders() {
  // The backend currently exposes per-user orders + aggregate metrics, but no
  // admin-wide order list endpoint, so the fulfillment tracker uses sample data.
  await delay(120)
  return ORDERS
}

export async function updateOrderStatus(orderId, status) {
  // Mirrors getAdminOrders: no admin order-status endpoint yet, so this is a
  // local no-op that echoes the change back for the optimistic UI update.
  await delay(120)
  return { id: orderId, status }
}

export async function getAdminProducts() {
  if (USE_MOCK) {
    await delay(150)
    return PRODUCTS
  }
  const { data } = await api.get('/admin/products/')
  return asList(data).map(normalizeProduct)
}

export async function createProduct(product) {
  if (USE_MOCK) {
    await delay(200)
    return { ...product, id: Math.floor(Math.random() * 100000) }
  }
  const { data } = await api.post('/admin/products/', denormalizeProduct(product))
  return normalizeProduct(data)
}

export async function updateProduct(id, product) {
  if (USE_MOCK) {
    await delay(200)
    return { ...product, id }
  }
  const { data } = await api.patch(
    `/admin/products/${id}/`,
    denormalizeProduct(product)
  )
  return normalizeProduct(data)
}

export async function deleteProduct(id) {
  if (USE_MOCK) {
    await delay(150)
    return null
  }
  await api.delete(`/admin/products/${id}/`)
  return null
}

/* --------------------------- Mock helpers -------------------------- */

function applyFilters(products, filters) {
  let result = [...products]
  if (filters.category) {
    result = result.filter((p) => p.category === filters.category)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    )
  }
  if (filters.minPrice != null) {
    result = result.filter((p) => p.price >= filters.minPrice)
  }
  if (filters.maxPrice != null) {
    result = result.filter((p) => p.price <= filters.maxPrice)
  }
  if (filters.foodType) {
    result = result.filter((p) => p.foodType === filters.foodType)
  }
  return result
}
