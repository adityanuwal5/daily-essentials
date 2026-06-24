# 🛒 DailyEssentials

A production-ready frontend for an Indian quick-commerce / grocery web app —
groceries and daily needs delivered in **15 minutes**. Built with **React
(Vite)**, **Tailwind CSS**, and **lucide-react** icons.

Designed for Indian middle-class Gen Z & Millennials, with localized ₹ pricing,
Veg/Non-Veg indicators, Buy-1-Get-1 deals, and fast-delivery badges.

## ✨ Features

- **Home** — auto-sliding hero deals banner, search with live auto-suggestions,
  category grid (Hygiene, Dairy, Snacks/Chocolates, Everyday Needs), and
  "Today's Deals", "Trending Now" & "Daily Essentials" rows.
- **All Items** — sidebar filters (category, max price, Veg/Non-Veg), sorting,
  responsive product grid, URL-synced filters, and a mobile filter drawer.
- **Product cards** — image, title, ₹ pricing with discount, instant Add to Cart
  with quantity stepper, Veg/Non-Veg dot, BOGO/Multi-buy badges, and an
  estimated delivery-time badge.
- **Cart** — line items, quantity controls, savings summary, and a full bill
  breakdown (items total, delivery fee, GST). Persists to `localStorage`.
- **Checkout** — saved/new delivery address, mock payment selector (UPI / Net
  Banking / COD), order summary, and an order-confirmation screen.
- **Admin Dashboard** — sales & order stats, an order-fulfillment status
  tracker, and full inventory CRUD (add / edit / delete products).

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## 🗂️ Project structure

```
src/
├── components/
│   ├── common/      # SearchBar, ScrollToTop
│   ├── home/        # HeroBanner, CategoryGrid, ProductRow
│   ├── layout/      # Navbar, Footer, Layout (app shell)
│   ├── product/     # ProductCard, FilterSidebar
│   └── ui/          # VegIndicator, DealBadge, QuantityStepper
├── context/         # CartContext (global cart state via Context + reducer)
├── data/            # mockData.js (Amul, Cadbury, Britannia, Colgate…)
├── pages/           # Home, ProductListing, Cart, Checkout, Admin, NotFound
├── services/        # api.js (single integration point — mock <-> Django REST)
└── utils/           # format.js (₹ Indian-locale formatting)
```

## 🔌 Connecting the Django REST backend

All network access lives in [`src/services/api.js`](src/services/api.js). It runs
against bundled mock data by default. To point at the real API:

1. Copy `.env.example` to `.env` and set `VITE_USE_MOCK=false`.
2. Set `VITE_API_BASE_URL` (e.g. `/api` with the Vite proxy, or a full URL).
3. Implement the documented endpoints in your Django app — the expected routes
   and payload shapes are listed at the top of `api.js`. No component changes
   are needed; only the service layer talks to the network.

> This is a frontend demo — payments are mocked and no real orders are placed.
```
