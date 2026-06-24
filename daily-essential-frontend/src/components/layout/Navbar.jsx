import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ShoppingCart,
  MapPin,
  Menu,
  X,
  LayoutDashboard,
  Clock,
} from 'lucide-react'
import SearchBar from '../common/SearchBar'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'All Items' },
  { to: '/admin', label: 'Admin', adminOnly: true },
]

export default function Navbar() {
  const { totals } = useCart()
  const { isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Hide admin-only links from non-admin users (RBAC at the UI level).
  const navLinks = NAV_LINKS.filter((link) => !link.adminOnly || isAdmin)

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="container-app">
        {/* Top row */}
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg">
              🛒
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-gray-900 sm:block">
              Daily<span className="text-brand-600">Essentials</span>
            </span>
          </Link>

          {/* Delivery pill */}
          <div className="hidden items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 lg:flex">
            <Clock className="h-4 w-4" />
            Delivery in 15 mins
            <span className="mx-1 text-brand-200">|</span>
            <MapPin className="h-4 w-4" />
            <span className="text-gray-600">Set location</span>
          </div>

          {/* Search (desktop) */}
          <div className="ml-auto hidden max-w-xl flex-1 md:block">
            <SearchBar />
          </div>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative ml-auto flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 md:ml-0"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            {totals.itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white">
                {totals.itemCount}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Search (mobile) */}
        <div className="pb-3 md:hidden">
          <SearchBar />
        </div>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 pb-2 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {link.label === 'Admin' ? (
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" /> Admin
                </span>
              ) : (
                link.label
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <nav className="container-app flex flex-col py-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* key on location to remount drawer-close on route change */}
      <span key={location.pathname} className="hidden" />
    </header>
  )
}
