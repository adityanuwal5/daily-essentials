// FSSAI-style square indicator: green dot = veg, red dot = non-veg.
// Renders nothing for non-food items (foodType === null).
export default function VegIndicator({ foodType, size = 'sm' }) {
  if (!foodType) return null
  const isVeg = foodType === 'veg'
  const box = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const dot = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      aria-label={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`flex ${box} items-center justify-center rounded-[3px] border ${
        isVeg ? 'border-green-600' : 'border-red-600'
      } bg-white`}
    >
      <span
        className={`${dot} rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}
      />
    </span>
  )
}
