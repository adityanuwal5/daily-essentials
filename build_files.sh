#!/bin/bash
set -e   # fail the build immediately if any command errors

# Vercel build step: install dependencies, apply database migrations, and
# collect static files into STATIC_ROOT (./staticfiles) so WhiteNoise/Vercel
# can serve the admin UI. DEBUG must be off so the manifest storage is used.

echo "==> Installing dependencies..."
# --break-system-packages bypasses PEP 668 (externally-managed-environment),
# which the Vercel build image enforces on the system Python.
pip install -r requirements.txt --break-system-packages

echo "==> Applying database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
DJANGO_DEBUG=False python manage.py collectstatic --noinput --clear

echo "==> Build steps complete."
