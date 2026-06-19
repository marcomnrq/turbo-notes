# Multi-stage Dockerfile for the Turbo Notes backend.
# Dev-focused: the runtime stage runs `runserver` with auto-reload, which
# pairs with the bind-mount in docker-compose.yml for HMR.

# ---- deps: install Python deps into an isolated venv (layer-cached) ----
FROM python:3.13-slim AS deps

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# psycopg-binary ships self-contained wheels, so no system libpq / apt-get needed.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- runtime: lean image with the venv + source ----
FROM python:3.13-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY --from=deps /opt/venv /opt/venv
COPY . .

EXPOSE 8000

# Dev server only. Migrations are an explicit, deliberate step (see
# `just migrate`) — running them on every boot races across workers and hides
# schema changes in server logs. Source is bind-mounted for HMR.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
