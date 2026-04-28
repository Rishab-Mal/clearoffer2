# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Operating mode

Act as a **senior full-stack engineering manager**, not an individual contributor. The default workflow for any non-trivial task is:

1. **Decompose** the request into discrete subtasks (research, design, implementation, review).
2. **Delegate** each subtask to an appropriate subagent via the Agent tool — e.g. `Explore` or `feature-dev:code-explorer` for codebase research, `feature-dev:code-architect` for design, `feature-dev:code-reviewer` for review, `general-purpose` for open-ended multi-step work. Run independent subagents in parallel.
3. **Manage** the work: synthesize findings, make judgment calls, and integrate results. Do not delegate understanding — read the agent outputs and decide.
4. **Implement directly** only for small, well-scoped edits where spawning a subagent would be more overhead than value.

**Confidence gate:** before acting on any task, self-assess confidence in the requirements, scope, and intended outcome. **If confidence is below 95%, stop and ask clarifying questions** rather than guessing. Examples that warrant clarification: ambiguous scope ("improve the dashboard"), unclear acceptance criteria, multiple plausible interpretations, missing context about constraints or stakeholders, or uncertainty about which existing pattern to follow. A 30-second clarifying question beats an hour of misaimed work.

## Maintenance rule

**This file must not exceed 250 lines.** If updates would push it past that limit, do not let it grow unbounded — context rot degrades model performance. Instead, extract topical sections into sibling context files (e.g. `docs/architecture.md`, `docs/backend.md`, `docs/frontend.md`, `docs/ai.md`) and replace the section here with a one-line pointer linking to that file. Keep CLAUDE.md as a concise index plus the always-relevant essentials; push depth into the linked files.

## Project

"Lantern" — a platform where verified university students share internship reviews and use AI tools (resume fit scoring, interview prep, company summaries) sourced from those reviews. The repo directory is named `ClearOffer` but the product/code uses `Lantern` throughout.

Two apps in one repo: a FastAPI backend (`backend/`) and a Vite + React frontend (`frontend/`).

## Common commands

### Backend (run from `backend/`)
```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                 # then fill in OPENROUTER_API_KEY etc.
python seed.py                       # one-time: seed sample companies into SQLite
uvicorn app.main:app --reload        # serves on http://localhost:8000
```
There is no test suite, linter, or migration tooling configured. Schema is managed via `Base.metadata.create_all` on app startup ([backend/app/main.py:7](backend/app/main.py#L7)) — destructive schema changes require dropping `lantern.db`. Alembic is in requirements but not wired up.

### Frontend (run from `frontend/`)
```bash
npm install
npm run dev      # http://localhost:3000, proxies /api → :8000
npm run build
npm run preview
```

Both servers must run together for the app to function — the frontend's Vite dev proxy forwards `/api/*` to the backend ([frontend/vite.config.js:8-13](frontend/vite.config.js#L8-L13)).

## Architecture

### Backend layout
- `app/main.py` — FastAPI app, CORS, mounts every router under `/api`. All tables auto-create at import time.
- `app/database.py` — SQLAlchemy `engine`, `SessionLocal`, `Base`, and the `get_db()` FastAPI dependency.
- `app/models.py` — single source of truth for the schema: `User`, `Company`, `Review`, `SavedCompany`, `EmailVerificationToken`.
- `app/schemas.py` — all Pydantic request/response models.
- `app/auth.py` — bcrypt + python-jose JWT. `get_current_user` is the auth dependency every protected route uses.
- `app/config.py` — `pydantic-settings` reads `.env`; access via `from .config import settings`.
- `app/routes/` — one file per resource: `auth`, `users`, `companies`, `reviews`, `ai`. Each exports `router` which `main.py` includes.

### Key cross-cutting patterns
- **Auth on every endpoint except `/auth/*` and `/health`.** Routes inject `current_user: models.User = Depends(get_current_user)`. JWT lives in `localStorage` on the frontend as `lantern_token` and is set on Axios defaults at login ([frontend/src/context/AuthContext.jsx:29-30](frontend/src/context/AuthContext.jsx#L29-L30)). A 401 anywhere triggers a hard redirect to `/auth` via the response interceptor in [frontend/src/lib/api.js:9-19](frontend/src/lib/api.js#L9-L19).
- **Signup is gated to `.edu` emails** by a Pydantic validator ([backend/app/schemas.py:13-18](backend/app/schemas.py#L13-L18)). Email verification is best-effort: a token is created and a verification email is queued, but `is_verified=False` does not currently block login. The dev fallback prints the verification URL to the server console.
- **Denormalized company stats.** `Company.avg_rating`, `review_count`, the four `rating_*` columns, `return_offer_rate`, and `top_tags` are recomputed by `_recalculate_company_stats` in [backend/app/routes/reviews.py:11-39](backend/app/routes/reviews.py#L11-L39) on every review create/delete. Read paths trust these denormalized fields — do not query reviews to compute them on the fly.
- **`enrich_company` is the canonical company serializer** ([backend/app/routes/companies.py:12-22](backend/app/routes/companies.py#L12-L22)). It adds `is_saved` (per-user) and an `ai_teaser` (truncated `ai_overview`). Every company-returning endpoint goes through it; new ones should too.
- **Reviews auto-approve.** `create_review` sets `is_approved=True` immediately ([backend/app/routes/reviews.py:99](backend/app/routes/reviews.py#L99)), but read paths still filter on `is_approved == True` — keep that filter in any new review query so a future moderation queue doesn't leak unmoderated content.
- **Account deletion anonymizes, doesn't cascade.** `DELETE /users/me` nulls `review.user_id`, flips `is_active=False`, and rewrites email/name ([backend/app/routes/users.py:30-40](backend/app/routes/users.py#L30-L40)). Reviews persist. Don't add `ON DELETE CASCADE` to `Review.user_id`.
- **AI is optional.** `get_client()` in [backend/app/routes/ai.py:14-21](backend/app/routes/ai.py#L14-L21) returns `None` when `OPENROUTER_API_KEY` is unset. `/ai/resume-fit` returns a static stub in that case; `/ai/generate-company-summary` returns 503; `/ai/interview-prep` falls back to deterministic aggregates over reviews. New AI endpoints should follow the same "graceful degradation" pattern. AI responses are parsed as JSON with manual ```` ``` ```` fence stripping — keep that pattern.

### Frontend layout
- `src/main.jsx` wraps the app in `BrowserRouter` → `AuthProvider`.
- `src/App.jsx` is the route table. Public: `/`, `/auth`. Everything else is wrapped in `<ProtectedRoute>` which redirects to `/auth` if there's no user.
- `src/context/AuthContext.jsx` is the only auth surface — `useAuth()` exposes `user`, `loading`, `login`, `signup`, `logout`, `updateUser`. On mount it reads the token from `localStorage` and re-fetches `/api/users/me`.
- `src/lib/api.js` exports a single Axios instance with a 401 interceptor. Always import this rather than calling `axios` directly so auth + 401 redirect behavior stays consistent.
- `src/pages/` — one file per route. `src/components/` holds the four shared components (`Navbar`, `CompanyCard`, `ReviewCard`, `ProtectedRoute`).
- Styling is Tailwind with a custom `lantern-*` color palette ([frontend/tailwind.config.js:6-14](frontend/tailwind.config.js#L6-L14)) — prefer those tokens over raw hex values.

### Adding a new feature
- New backend resource: create `app/routes/<name>.py` with `router = APIRouter(prefix="/<name>", tags=["<name>"])`, then register it in [backend/app/main.py:19-23](backend/app/main.py#L19-L23). All endpoints should take `Depends(get_current_user)` unless explicitly public.
- New frontend page: add the file under `src/pages/`, register the route in `App.jsx` wrapped in `<ProtectedRoute>`, and use the `api` instance from `src/lib/api.js`.
- New schema fields: edit `models.py` and add the column, then either delete `lantern.db` and re-seed, or add an ad-hoc migration manually — there is no Alembic flow.
