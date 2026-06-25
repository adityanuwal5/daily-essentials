# DailyEssentials - Full Stack Development Log

This document tracks the development progression of **DailyEssentials**, a quick-commerce web application. The journey is divided into the core phases of development: Frontend scaffolding, Backend architecture, Deployment & Troubleshooting, and the final System Merger.

---

## 1. Frontend Development Phase
**Tech Stack:** React (Vite), Tailwind CSS, Lucide React

*   **Initial Scaffolding:** Designed a responsive, production-ready frontend tailored for an Indian quick-commerce experience. Built core pages including the Home Page (with daily deals and categories), Product Listing Page (with sidebars and Veg/Non-Veg indicators), Cart Page, and a Checkout workflow.
*   **Role-Based Access Control (RBAC):** Implemented client-side routing protection. Created a global `AuthContext` to manage user states (`admin` vs `customer`) and built a `<ProtectedRoute />` wrapper to redirect unauthorized traffic away from restricted areas.
*   **Admin Security:** Locked down the Admin Dashboard by integrating a secure login gateway. Ensured that sensitive metrics and navigation tabs are completely hidden from standard users until a valid admin password is provided.

---

## 2. Backend Development Phase
**Tech Stack:** Python, Django, Django Rest Framework (DRF), SQLite

*   **API Initialization:** Structured a modular Django backend (`authentication`, `products`, `orders`). Set up database-agnostic models, generated initial migrations, and created a `seed_db.py` script to populate the database with everyday Indian grocery staples.
*   **Security & Authentication:** Configured `django-cors-headers` to restrict incoming traffic and implemented JWT authentication using `djangorestframework-simplejwt`. Secured refresh tokens using encrypted, server-side `HttpOnly` cookies to prevent XSS attacks.
*   **Database Schema & Logic:** Built a custom `CustomUser` model supporting roles and strict password validation. Created relational models for Products and Orders, and enforced server-side RBAC (`IsAdminUserRole`) to protect write operations and metric endpoints.
*   **Automated QA & Load Testing:** Engineered a suite of autonomous testing agents:
    *   *Penetration Tester:* Checked for CSRF, XSS, and SQL injection vulnerabilities.
    *   *Reliability Scout:* Crawled for 404s and runtime crashes.
    *   *Auth Guard:* Verified that restricted endpoints return 401/403 for unauthorized users.
    *   *Load Tester:* Simulated concurrent requests to test database integrity, leading to the implementation of SQLite WAL (Write-Ahead Logging) to prevent database lock bottlenecks.

---

## 3. Deployment & Issue Resolution
**Infrastructure:** Vercel, PostgreSQL (Neon Cloud)

*   **Database Migration:** Transitioned from a local SQLite setup to a cloud-hosted PostgreSQL database (Neon) to support Vercel's serverless, ephemeral filesystem. Configured `dj-database-url` to dynamically switch between local and production databases.
*   **Vercel Build Automation:** Wrote a custom `build_files.sh` script to automate dependency installation, static file collection, and database migrations (`python manage.py migrate --noinput`) during the Vercel deployment pipeline.
*   **Troubleshooting & Hardening:**
    *   *Environment Security:* Safely managed `DATABASE_URL`, `DJANGO_DEBUG=False`, and generated new `DJANGO_SECRET_KEY` variables in the Vercel dashboard.
    *   *PEP 668 Bypass:* Resolved Vercel build failures caused by externally managed environment restrictions by modifying the pip installation command to use `--break-system-packages`.
    *   *Static Files:* Fixed missing CSS on the Django Admin panel in production by installing and configuring `whitenoise.middleware.WhiteNoiseMiddleware`.

---

## 4. Frontend & Backend Merger
**Integration:** Axios, CORS Configuration

*   **Local Integration:** Configured an Axios client (`baseURL: 'http://localhost:8000/api/'`, `withCredentials: true`) to connect the React frontend to the local Django backend. Replaced static mock data with live database fetch calls for the product feed, admin metrics, and checkout routing.
*   **Production Handshake:** Updated the Vite frontend environment (`.env`) to point the API base URL to the live Vercel deployment (`https://daily-essentials-vert.vercel.app/api/`). Pushed the final configuration to GitHub to complete the full-stack deployment cycle.
