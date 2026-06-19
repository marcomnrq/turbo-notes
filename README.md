# Turbo Notes

Simple notes-taking app built with Django and Next.js!

Users sign up, get three default categories seeded for them (Random Thoughts, Personal, School), and can create, edit, filter, search, and delete notes. Each category color-tints its notes, matching the provided Figma design.

---

## How to run?

Two ways to run it. Both expect Node on the host; the host path also expects Python.

### Docker

```bash
cp backend/.env.example backend/.env   # optional; defaults work
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:8000
- API docs (Swagger): http://localhost:8000/api/docs

Postgres boots in its own container; the backend reads `DATABASE_URL` automatically.

### Option B — host-local dev (fast HMR, SQLite)

```bash
npm install
cd backend && python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
cd ..
just dev
```


---

## Technical Decisions

- **Docker + Docker Compose** — the whole stack (Postgres, backend, frontend) runs with docker. Multi-stage Dockerfiles for optimal images; healthchecks with Postgres.
- **Biome + Ruff** — fast tool per side (frontend / backend) that does both linting and formatting.
- **Simple monorepo with `just`** — backend and frontend live side by side. The `justfile` wraps the common commands (`dev`, `test`, `lint`, `migrate`).
- **Scalable folder structure** — backend split by domain (users, notes, core)
- **JWT auth** — simple JWT implementation. not suitable for production but simple enough for the challenge.
- **TanStack Query as the data layer** — server state lives in the cache, not on component state.

---

## How AI was used

AI was used with the following:

- **Coding agent (Claude Code, ZCode with the latest GLM)** were the main coding clients used.
- **Agent skills** (see below) to inject framework-specific best practices so the agent's output matched Django/Next.js.
- **MCP servers** (see below) to ground the agent in the real design assets and let it verify its own UI work.

## Agent skills & MCP servers

This project ships a small agent-tooling setup (in `.agents/` and `.mcp.json`) that made the AI assistance above measurably better.

### Skills (`skills-lock.json`)
This is a very standard combo for the work:

- **django-expert** — Django/DRF patterns: custom users, queryset scoping, signals, N+1 avoidance.
- **next-best-practices** — App Router conventions, RSC/client boundaries, error handling. Official from Vercel.
- **shadcn** — component composition and styling via the shadcn registry.
- **lang-typescript** — strict typing rules (no `any`, narrowing).
- **improve** — avoid shadcn mistakes.

### MCP servers (`.mcp.json`)
- **Figma MCP** — let the agent read the actual design file (layout, colors, spacing) rather than guessing from a screenshot.
- **Playwright MCP** — let the agent drive the running app to verify UI changes actually worked, end to end.
- **shadcn MCP** — query/add components straight from the registry.
