# DailyEssentials — Backend API

A secure, production-grade Django REST Framework backend for the **DailyEssentials**
quick-commerce app. Built with a modular app architecture, JWT auth over HttpOnly
cookies, strict password regulation, and server-side role-based access control.

## Tech stack

- **Django 5.0** + **Django REST Framework** — API & ORM
- **djangorestframework-simplejwt** — JWT access/refresh tokens
- **django-cors-headers** — CORS protection
- **django-filter** — query-parameter filtering
- **SQLite** — local relational DBMS (database-agnostic via the ORM)

## Project structure

```
core/                       Project config (settings, root urls, wsgi/asgi)
apps/
  authentication/           CustomUser, JWT cookie auth, password rules
  products/                 Product catalog, RBAC permissions, seed command
  orders/                   Order + OrderItem, checkout, admin dashboard
manage.py
requirements.txt
.env.example
```

## Quick start

```bash
# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) configure environment
copy .env.example .env           # then edit values

# 4. Apply migrations and seed the catalog
python manage.py migrate
python manage.py seed_db         # add --flush to wipe first

# 5. Create an administrator (role is set to "admin" automatically)
python manage.py createsuperuser

# 6. Run the dev server
python manage.py runserver       # http://127.0.0.1:8000
```

## Security modules

**1. CORS protection** — only `http://localhost:5173` (the React/Vite dev
server) may call the API from a browser, with credentials enabled so the
HttpOnly cookies round-trip. Configure via `CORS_ALLOWED_ORIGINS`.

**2. JWT via HttpOnly cookies** — login issues a short-lived (15 min) access
token and a long-lived (7 day) refresh token. The refresh token is delivered
*only* inside an HttpOnly, path-scoped cookie, so client-side JavaScript (and
XSS payloads) can never read it. `/api/auth/refresh/` reads that cookie to mint
new access tokens.

**3. Strict password policy** — Django's validation engine enforces minimum
length, blocks common and purely-numeric passwords, and a custom validator
requires a combination of letters and numbers.

**4. Server-side RBAC** — the `IsAdminUserRole` permission gates all admin
writes and the metrics dashboard, returning `403 Forbidden` to regular clients.

## API endpoints

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

## Notes

- The schema is written entirely with the Django ORM, so switching `DATABASES`
  to PostgreSQL/MySQL needs no model changes.
- Order line items store a **price snapshot** (`unit_price`, `product_name`) so
  historical orders stay accurate even when catalog prices change; deleting a
  product never erases purchase history (`on_delete=SET_NULL`).
- Order totals are always computed **server-side** — client-supplied totals are
  never trusted — and stock is validated/decremented atomically under a row lock.
