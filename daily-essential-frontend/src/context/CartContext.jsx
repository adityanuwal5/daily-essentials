import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'

// Global shopping-cart state via Context + useReducer.
// Persists to localStorage so the cart survives refreshes.

const CartContext = createContext(null)

const STORAGE_KEY = 'dailyessentials_cart'

const DELIVERY_FEE = 25
const FREE_DELIVERY_THRESHOLD = 199
const TAX_RATE = 0.05 // 5% GST (mock)

const initialState = {
  items: [], // [{ ...product, quantity }]
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.payload }

    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.payload.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      }
    }

    case 'DECREMENT_ITEM': {
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.id === action.payload
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
          .filter((i) => i.quantity > 0),
      }
    }

    case 'SET_QUANTITY': {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== id) }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity } : i
        ),
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      }

    case 'CLEAR_CART':
      return { ...state, items: [] }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) dispatch({ type: 'HYDRATE', payload: JSON.parse(stored) })
    } catch {
      /* ignore corrupt storage */
    }
  }, [])

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      /* storage may be full / unavailable */
    }
  }, [state.items])

  const actions = useMemo(
    () => ({
      addItem: (product) => dispatch({ type: 'ADD_ITEM', payload: product }),
      decrementItem: (id) => dispatch({ type: 'DECREMENT_ITEM', payload: id }),
      setQuantity: (id, quantity) =>
        dispatch({ type: 'SET_QUANTITY', payload: { id, quantity } }),
      removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    }),
    []
  )

  // Derived totals — recomputed only when items change.
  const totals = useMemo(() => {
    const itemCount = state.items.reduce((n, i) => n + i.quantity, 0)
    const itemsTotal = state.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    )
    const mrpTotal = state.items.reduce(
      (sum, i) => sum + (i.mrp ?? i.price) * i.quantity,
      0
    )
    const savings = mrpTotal - itemsTotal
    const deliveryFee =
      itemsTotal === 0 || itemsTotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : DELIVERY_FEE
    const taxes = Math.round(itemsTotal * TAX_RATE)
    const grandTotal = itemsTotal + deliveryFee + taxes
    return {
      itemCount,
      itemsTotal,
      mrpTotal,
      savings,
      deliveryFee,
      taxes,
      grandTotal,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      amountToFreeDelivery: Math.max(0, FREE_DELIVERY_THRESHOLD - itemsTotal),
    }
  }, [state.items])

  // Quick lookup of quantity by product id for ProductCard incrementers.
  const quantityById = useMemo(() => {
    const map = {}
    for (const i of state.items) map[i.id] = i.quantity
    return map
  }, [state.items])

  const value = useMemo(
    () => ({ items: state.items, totals, quantityById, ...actions }),
    [state.items, totals, quantityById, actions]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
