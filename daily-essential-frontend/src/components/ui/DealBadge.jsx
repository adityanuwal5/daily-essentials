import { Gift, Layers } from 'lucide-react'

// Promotional badge for a product's `deal` field.
//   'BOGO'  -> Buy 1 Get 1
//   'MULTI' -> Multi-buy / combo deal
const DEALS = {
  BOGO: {
    label: 'Buy 1 Get 1',
    icon: Gift,
    className: 'bg-pink-100 text-pink-700',
  },
  MULTI: {
    label: 'Multi-buy Deal',
    icon: Layers,
    className: 'bg-indigo-100 text-indigo-700',
  },
}

export default function DealBadge({ deal }) {
  const config = DEALS[deal]
  if (!config) return null
  const Icon = config.icon
  return (
    <span className={`badge ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
