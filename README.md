# 🛒 Daily Essentials | Full-Stack E-Commerce Platform

A secure, production-grade full-stack web application built to manage and deliver daily grocery essentials. This project features a robust **Django REST Framework** backend and a lightning-fast **React (Vite)** frontend, secured by industry-standard JWT HttpOnly cookies and a custom automated QA suite.

📖 **Looking to run this project?** Please see the [SETUP.md](./SETUP.md) file for complete cloning and installation instructions.

## 🛠️ Tech Stack
| Frontend | Backend | Testing & Database |
| :--- | :--- | :--- |
| React 18+ (Vite) | Django 5.0.6 & DRF | Playwright & Pytest |
| Tailwind CSS | djangorestframework-simplejwt | SQLite (WAL Hardened) |
| Axios | django-filter & cors-headers | Custom Testing Orchestrator |

## 🛡️ Security Modules & Architecture

**1. CORS Protection** — Only `http://localhost:5173` (the React/Vite dev server) may call the API from a browser, with credentials enabled so the HttpOnly cookies round-trip. 

**2. JWT via HttpOnly Cookies** — Login issues a short-lived (15 min) access token and a long-lived (7 day) refresh token. The refresh token is delivered *only* inside an HttpOnly, path-scoped cookie, preventing XSS payloads from reading it. `/api/auth/refresh/` reads that cookie to mint new access tokens.

**3. Strict Password Policy** — Django's validation engine enforces minimum length, blocks common and purely-numeric passwords, and a custom validator requires a combination of letters and numbers.

**4. Server-Side RBAC** — The `IsAdminUserRole` permission gates all admin writes and the metrics dashboard, returning `403 Forbidden` to regular clients.

## 📡 API Endpoints

| Method | Path | Access | Description |
| ------ | ---- | ------ | ----------- |
| POST | `/api/auth/login/` | Public | Verify credentials, set JWT session |
| POST | `/api/auth/refresh/` | Cookie | Refresh access token from HttpOnly cookie |
| POST | `/api/auth/logout/` | Public | Clear auth cookies |
| POST | `/api/auth/change-password/` | Authenticated | Update own password (policy enforced) |
| GET | `/api/auth/me/` | Authenticated | Current user profile |
| GET | `/api/products/` | Public | Catalog feed — `?category=&food_type=&min_price=&max_price=&search=` |
| GET | `/api/products/{id}/` | Public | Product detail |
| POST/PUT/PATCH/DELETE | `/api/admin/products/` | Admin (RBAC) | Manage catalog |
| GET | `/api/admin/dashboard-metrics/` | Admin (RBAC) | System metrics |
| GET/POST | `/api/orders/` | Authenticated | Own order history / checkout |

## 🧪 Testing & Database Notes
* **WAL Hardening:** The database is optimized using Write-Ahead Logging (WAL) to prevent SQLite deadlocks during concurrent checkout load testing.
* **Database Agnostic:** The schema is written entirely with the Django ORM, so switching `DATABASES` to PostgreSQL needs no model changes.
* **Immutable Order History:** Order line items store a **price snapshot** (`unit_price`, `product_name`) so historical orders stay accurate even when catalog prices change. Deleting a product never erases purchase history (`on_delete=SET_NULL`).
* **Server-Side Trust:** Order totals are always computed **server-side** — client-supplied totals are never trusted — and stock is validated/decremented atomically under a row lock.

---

## 🧠 AI Prompt Engineering & Architecture

This project was developed using iterative prompt engineering to solve complex multi-agent synchronization and WAL database hardening. You can inspect the full developmental log and the exact prompts used to guide the architecture right here in the repository:

👉 **[View the AI Development Transcript](./CLAUDE_PROMPTS.md)**