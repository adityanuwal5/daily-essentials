#!/bin/bash
# Vercel build step: install dependencies and collect static files into
# STATIC_ROOT (./staticfiles) so WhiteNoise/Vercel can serve the admin UI.
# DEBUG must be off here so the compressed/manifest storage is used.
pip install -r requirements.txt
DJANGO_DEBUG=False python manage.py collectstatic --noinput --clear
