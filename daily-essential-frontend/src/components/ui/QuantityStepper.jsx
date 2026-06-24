import { Minus, Plus } from 'lucide-react'

// Compact +/- quantity control used on product cards and the cart.
export default function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  size = 'md',
}) {
  const dims =
    size === 'sm' ? 'h-8 text-sm' : size === 'lg' ? 'h-11 text-base' : 'h-10 text-sm'
  const btn = size === 'sm' ? 'w-8' : size === 'lg' ? 'w-11' : 'w-10'

  return (
    <div
      className={`flex ${dims} items-center justify-between overflow-hidden rounded-lg bg-brand-600 font-bold text-white`}
    >
      <button
        type="button"
        onClick={onDecrement}
        className={`flex ${btn} h-full items-center justify-center transition hover:bg-brand-700`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[1.5rem] text-center tabular-nums">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        className={`flex ${btn} h-full items-center justify-center transition hover:bg-brand-700`}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
