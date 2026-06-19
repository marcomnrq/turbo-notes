"""Production settings for the Turbo Notes backend.

This project ships a **stateless JSON API** in production — the Django admin
and the ``/api/docs`` Swagger UI are dev-only conveniences and are not relied
on for production traffic. Accordingly these settings do *not* configure
static-file serving (no WhiteNoise / ``collectstatic``); DRF is locked to
``JSONRenderer`` in the base settings, so the only thing this process emits is
JSON.

Inherits everything from :mod:`core.settings` and layers on the hardening from
Django's deployment checklist. Activate it with::

    DJANGO_SETTINGS_MODULE=core.production

Base settings already drive ``DATABASE_URL``, ``CORS_ALLOWED_ORIGINS`` and
``CSRF_TRUSTED_ORIGINS`` from environment variables, so they carry over.

Verify before shipping::

    python manage.py check --deploy --settings=core.production
"""

import os

from core.settings import *  # noqa: F401,F403  (re-export the whole base config)
from core.settings import _env_bool, _env_list

# ── Secrets ─────────────────────────────────────────────────────────────────
# Never fall back to the insecure dev key in production. Provide a
# SECRET_KEY_FALLBACKS list (comma-separated) so existing sessions/tokens
# survive a key rotation: serve with the new key first, then drop the old one.
SECRET_KEY = os.environ["SECRET_KEY"]
SECRET_KEY_FALLBACKS = _env_list("SECRET_KEY_FALLBACKS", default=[])


# ── Debug & hosts ───────────────────────────────────────────────────────────
DEBUG = False
ALLOWED_HOSTS = _env_list("ALLOWED_HOSTS", default=[])


# ── Middleware: add response compression ────────────────────────────────────
# GZipMiddleware must wrap responses before most other middleware. We rebuild
# MIDDLEWARE (rather than mutate it) to keep ordering explicit. No WhiteNoise
# here — a pure JSON API has no static files to serve.
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ── TLS / HSTS ──────────────────────────────────────────────────────────────
# Assumes a TLS-terminating reverse proxy sits in front of Django.
SECURE_SSL_REDIRECT = _env_bool("SECURE_SSL_REDIRECT", default=True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# HSTS defaults are intentionally conservative for a first deploy:
#   • one hour, preload OFF — safe to roll out and observe.
# Ramp up to SECURE_HSTS_SECONDS=31536000 + SECURE_HSTS_PRELOAD=true only once
# you're certain HTTPS is permanent (preload list removal is slow).
SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "3600"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_bool(
    "SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True
)
SECURE_HSTS_PRELOAD = _env_bool("SECURE_HSTS_PRELOAD", default=False)


# ── Cookies ─────────────────────────────────────────────────────────────────
# Must only travel over HTTPS in production. HttpOnly + SameSite=Lax harden
# against XSS token theft and mitigate CSRF. (The API itself uses Bearer JWTs,
# so these mostly protect the admin/Django session surfaces.)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"


# ── Hardening headers ───────────────────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
