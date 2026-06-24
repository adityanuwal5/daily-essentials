import { Link } from 'react-router-dom'
import { Clock, ShieldCheck, Truck, Smartphone } from 'lucide-react'

const FEATURES = [
  { icon: Clock, title: '15-minute delivery', desc: 'Lightning fast, every order' },
  { icon: ShieldCheck, title: '100% genuine', desc: 'Trusted Indian brands' },
  { icon: Truck, title: 'Free over ₹199', desc: 'No delivery fee on big carts' },
  { icon: Smartphone, title: 'Easy UPI & COD', desc: 'Pay your way' },
]

const LINK_GROUPS = [
  {
    title: 'Shop',
    links: [
      { label: 'Hygiene', to: '/products?category=hygiene' },
      { label: 'Dairy', to: '/products?category=dairy' },
      { label: 'Snacks & Chocolates', to: '/products?category=snacks' },
      { label: 'Everyday Needs', to: '/products?category=everyday' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/' },
      { label: 'Careers', to: '/' },
      { label: 'Blog', to: '/' },
      { label: 'Press', to: '/' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'FAQs', to: '/' },
      { label: 'Track Order', to: '/' },
      { label: 'Returns', to: '/' },
      { label: 'Contact', to: '/' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-100 bg-white">
      {/* Feature strip */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="container-app grid grid-cols-2 gap-4 py-8 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="container-app grid grid-cols-2 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg">
              🛒
            </span>
            <span className="text-lg font-extrabold text-gray-900">
              Daily<span className="text-brand-600">Essentials</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-gray-500">
            Your neighbourhood store, online. Groceries and daily needs
            delivered to your door in 15 minutes across India.
          </p>
        </div>
        {LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <h4 className="text-sm font-semibold text-gray-900">{group.title}</h4>
            <ul className="mt-3 space-y-2">
              {group.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-gray-500 transition hover:text-brand-600"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-5 text-xs text-gray-400 sm:flex-row">
          <p>© 2026 DailyEssentials. All rights reserved.</p>
          <p>Made with 🧡 in India · Prices inclusive of all taxes</p>
        </div>
      </div>
    </footer>
  )
}
