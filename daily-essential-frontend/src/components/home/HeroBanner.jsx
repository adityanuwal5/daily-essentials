import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

// Auto-advancing hero carousel for daily deals.
export default function HeroBanner({ banners = [] }) {
  const [index, setIndex] = useState(0)
  const count = banners.length

  useEffect(() => {
    if (count <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 4500)
    return () => clearInterval(t)
  }, [count])

  if (count === 0) return null

  const go = (dir) => setIndex((i) => (i + dir + count) % count)

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-card">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((b) => (
          <div
            key={b.id}
            className={`relative flex min-w-full items-center justify-between gap-4 bg-gradient-to-r ${b.bg} px-6 py-10 text-white sm:px-10 sm:py-14`}
          >
            <div className="max-w-lg">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                ⚡ Today’s Deal
              </span>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl">
                {b.title}
              </h2>
              <p className="mt-2 text-sm text-white/90 sm:text-base">
                {b.subtitle}
              </p>
              <Link
                to={b.href}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
              >
                {b.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="hidden select-none text-8xl drop-shadow-lg sm:block lg:text-9xl">
              {b.emoji}
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-1.5 text-white backdrop-blur transition hover:bg-white/50"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-1.5 text-white backdrop-blur transition hover:bg-white/50"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
