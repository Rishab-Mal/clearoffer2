# Opportunities Feature — Implementation Plan

## Context

Add an **Opportunities** tab to ClearOffer that surfaces live internship postings sourced from `SimplifyJobs/Summer2026-Internships` (a public GitHub repo whose `.github/scripts/listings.json` holds ~19.7k entries, ~2.6k currently active). The tab shows postings across five role buckets: Software, Product, AI/ML/Data Science, Quant, and Hardware. The system auto-refreshes hourly so listings stay fresh without manual upkeep, and is hard-capped to 100 active rows so the page never grows unbounded — when a new posting arrives at the cap, the oldest (by upstream `date_posted`) is evicted.

A separate frontend worktree is already in flight, so this plan freezes a JSON API contract the FastAPI backend will serve.

### Locked decisions

- **Source**: internships only (`SimplifyJobs/Summer2026-Internships`, `dev` branch)
- **Refresh**: hourly via APScheduler running in the FastAPI process
- **Buckets**: 5 (`software`, `product`, `ai_ml_data`, `quant`, `hardware`); the user's 7 categories collapse here because Simplify groups DS+AI+ML into one
- **Auth**: login required; FastAPI verifies the **Supabase JWT** the frontend already sends (the frontend lives in Supabase auth, not the legacy ClearOffer JWT)
- **Cap**: 100 active rows max; eviction by oldest `date_posted`
- **Transport**: FastAPI JSON endpoints under `/api/opportunities`

### Important note about CLAUDE.md drift

CLAUDE.md describes a SQLAlchemy + ClearOffer-JWT auth flow. The actual frontend (`frontend/src/lib/api.js`, `frontend/src/context/AuthContext.jsx`) uses **Supabase auth and Supabase Postgres** — it sends a Supabase access token. So the existing FastAPI `get_current_user` (HS256 with `settings.secret_key`) cannot validate the token the frontend sends. This plan adds a Supabase-JWT verifier and uses it for the new endpoints only. Existing routes are untouched.

---

## 1. Database model (`backend/app/models.py`)

Append a single class. Use Simplify's UUID string as the PK so upserts collapse to `db.merge` or `get`-then-update.

```python
class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(String, primary_key=True)           # Simplify UUID
    company_name = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    bucket = Column(String, nullable=False, index=True)   # software|product|ai_ml_data|quant|hardware
    category_raw = Column(String)                          # untouched upstream value, for debugging
    locations = Column(JSON, default=list)
    terms = Column(JSON, default=list)
    degrees = Column(JSON, default=list)
    sponsorship = Column(String)
    url = Column(String)
    company_url = Column(String)
    source = Column(String)
    active = Column(Boolean, default=True, index=True)
    is_visible = Column(Boolean, default=True)
    date_posted = Column(Integer, index=True)              # unix epoch (matches upstream)
    date_updated = Column(Integer)
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (Index("ix_opps_listing", "bucket", "active", "date_posted"),)
```

Auto-creates on next boot via `Base.metadata.create_all` — no Alembic.

---

## 2. Pydantic schema (`backend/app/schemas.py`)

Append `OpportunityOut` only. Read-only resource — no Create/Update.

```python
class OpportunityOut(BaseModel):
    id: str
    company_name: str
    title: str
    bucket: str                       # one of: software|product|ai_ml_data|quant|hardware
    locations: List[str]
    terms: List[str]
    degrees: List[str]
    sponsorship: Optional[str] = None
    url: Optional[str] = None
    company_url: Optional[str] = None
    date_posted: Optional[int] = None # unix epoch seconds
    class Config: from_attributes = True
```

---

## 3. Supabase JWT verification (`backend/app/auth_supabase.py` — NEW)

Add a new dependency that validates the Supabase access token instead of the legacy HS256 token. Do not modify `auth.py` — keep both auth paths so existing routes don't break.

- New env vars in `backend/app/config.py`:
  - `supabase_url: str = ""`
  - `supabase_jwt_secret: str = ""` (the HS256 JWT secret from Supabase project settings → API → JWT Secret)
- New file `backend/app/auth_supabase.py` exporting `get_supabase_user(authorization: str = Header(...))`:
  - Strip `Bearer ` prefix; raise 401 if missing
  - `jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")` (uses `python-jose`, already a dep)
  - Return a small dict `{ "id": payload["sub"], "email": payload.get("email") }`
  - On `JWTError` raise `HTTPException(401, "Invalid Supabase token")`
- Reuse pattern from `backend/app/auth.py:27` for raising; do not duplicate.

Opportunities routes use `Depends(get_supabase_user)`.

---

## 4. Ingest service (`backend/app/services/opportunities_ingest.py` — NEW; also create `backend/app/services/__init__.py`)

```python
LISTINGS_URL = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json"
MAX_ACTIVE_ROWS = 100

BUCKET_MAP: dict[str, str] = {
    "Software": "software", "Software Engineering": "software",
    "Product": "product", "Product Management": "product",
    "AI/ML/Data": "ai_ml_data", "Data Science, AI & Machine Learning": "ai_ml_data",
    "Quant": "quant", "Quantitative Finance": "quant",
    "Hardware": "hardware", "Hardware Engineering": "hardware",
}

def normalize_category(raw: str | None) -> str | None: ...
async def fetch_listings() -> list[dict]:
    # httpx.AsyncClient(timeout=30); .raise_for_status(); .json()

def upsert_listings(db, raw: list[dict]) -> dict:
    """
    Returns {"inserted": int, "updated": int, "soft_deleted": int, "evicted": int, "active_after": int}.

    Algorithm:
      1. Filter raw → keep only rows where active && is_visible && normalize_category() is not None.
      2. Sort kept rows by date_posted DESC, take top MAX_ACTIVE_ROWS (= 100).
         This is the cap: the 101st newest never enters the active set.
      3. Build kept_ids = {row["id"] for row in top_100}.
      4. For each row in top_100: db.get(Opportunity, id) → update fields (set active=True) or insert new.
         (still record category_raw and bucket separately)
      5. Soft-delete any pre-existing row with active=True whose id not in kept_ids:
         UPDATE opportunities SET active=False WHERE active=True AND id NOT IN kept_ids.
         These are "evicted" (rolled off the 100) plus "naturally inactive" (closed upstream).
      6. db.commit().
    """

async def run_ingest() -> dict:
    # SessionLocal(); fetch; upsert; log "ingest complete: inserted=… updated=… evicted=… active=…";
    # try/except wraps everything — log and swallow so APScheduler keeps firing.
    # WARN if (kept_after_normalize / fetched_active) < 0.5 — upstream-schema-drift canary.
```

**Why the cap lives in the ingest, not the query:** the 100-row rule is a storage invariant — the table physically holds at most 100 active rows at any time. The list endpoint just queries `WHERE active=True`. This makes eviction visible in logs and keeps the listing query trivial.

---

## 5. Scheduler (`backend/app/scheduler.py` — NEW)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from .services.opportunities_ingest import run_ingest

scheduler = AsyncIOScheduler()

def setup_jobs():
    scheduler.add_job(
        run_ingest,
        "interval", minutes=60,
        next_run_time=datetime.now(),    # fire once at boot to populate empty DB
        id="opportunities_ingest",
        max_instances=1, coalesce=True,
    )
```

Wire via FastAPI lifespan in `backend/app/main.py` (replaces the bare `Base.metadata.create_all` line at `backend/app/main.py:7`):

```python
from contextlib import asynccontextmanager
from .scheduler import scheduler, setup_jobs

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    setup_jobs()
    scheduler.start()
    try: yield
    finally: scheduler.shutdown(wait=False)

app = FastAPI(title="ClearOffer API", version="1.0.0", lifespan=lifespan)
```

Add `apscheduler==3.10.4` to `backend/requirements.txt`.

---

## 6. Routes (`backend/app/routes/opportunities.py` — NEW)

Single file, two endpoints, all gated by `Depends(get_supabase_user)`.

```python
router = APIRouter(prefix="/opportunities", tags=["opportunities"])

@router.get("")
def list_opportunities(
    bucket: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    sponsorship_friendly: Optional[bool] = Query(None),
    sort: Literal["newest","oldest"] = Query("newest"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user = Depends(get_supabase_user),
): ...

@router.post("/sync")
async def sync_now(user = Depends(get_supabase_user)):
    return await run_ingest()
```

Filter logic:
- Always `WHERE active = TRUE` (so capped to ≤100 by construction)
- `bucket` → equality
- `q` → `ILIKE` on `title` OR `company_name`
- `location` → JSON-string `LIKE` on `locations`
- `sponsorship_friendly=true` → exclude rows whose `sponsorship` matches `%Citizenship%` or `%Clearance%`
- `sort` → `date_posted` DESC or ASC

Register in `backend/app/main.py:19-23`: `app.include_router(opportunities.router, prefix="/api")` and add `opportunities` to the import line.

---

## 7. JSON API Contract (for the separate frontend worktree)

The frontend in the other worktree should integrate against this contract. All endpoints require an `Authorization: Bearer <supabase_access_token>` header — grab it via `supabase.auth.getSession()` (the existing `frontend/src/lib/api.js` already does this).

### `GET /api/opportunities`

**Query parameters** (all optional):

| Param                  | Type                            | Default    | Notes                                                              |
|------------------------|---------------------------------|------------|--------------------------------------------------------------------|
| `bucket`               | `software \| product \| ai_ml_data \| quant \| hardware` | `null` | Single bucket filter. Omit to return all five.                     |
| `q`                    | `string`                        | `null`     | Substring match (case-insensitive) on title and company name.      |
| `location`             | `string`                        | `null`     | Substring match (case-insensitive) on any location.                |
| `sponsorship_friendly` | `boolean`                       | `null`     | If `true`, hides postings requiring US citizenship or clearance.   |
| `sort`                 | `newest \| oldest`              | `newest`   | Order by `date_posted`.                                            |
| `limit`                | `integer` (1–100)               | `50`       | Page size.                                                         |
| `offset`               | `integer` (≥0)                  | `0`        | Page offset.                                                       |

**Response — `200 OK`:**

```json
{
  "items": [
    {
      "id": "6258bf6c-f75a-4578-a674-7813c7ec4566",
      "company_name": "Honeywell",
      "title": "Software Engineer & Computer Science",
      "bucket": "software",
      "locations": ["USA"],
      "terms": ["Summer 2026"],
      "degrees": ["Bachelor's"],
      "sponsorship": "U.S. Citizenship is Required",
      "url": "https://ibqbjb.fa.ocs.oraclecloud.com/...",
      "company_url": "",
      "date_posted": 1756659984
    }
  ],
  "total": 87,
  "buckets": {
    "software": 42,
    "product": 8,
    "ai_ml_data": 21,
    "quant": 6,
    "hardware": 10
  },
  "cap": 100
}
```

- `items` — page of matching rows after filters and pagination.
- `total` — count of rows matching filters before `limit`/`offset` (for "Load more" math).
- `buckets` — counts per bucket of all currently active rows (ignores filters; powers the tab badges). Sum is always ≤ 100.
- `cap` — the hard cap (100). Lets the frontend show e.g. "87 / 100 live postings".

**Errors:**
- `401 { "detail": "Invalid Supabase token" }` — missing/expired/malformed token.
- `422` — invalid query parameter.

### `POST /api/opportunities/sync`

Manually trigger an ingest. Same auth header. **Response — `200 OK`:**

```json
{ "inserted": 0, "updated": 87, "soft_deleted": 0, "evicted": 3, "active_after": 100 }
```

Useful for debugging and for forcing a refresh after a bug fix.

### Frontend integration sketch (the separate worktree can adapt this)

```js
import api from './lib/api'  // existing axios instance

// list page
const { data } = await api.get('/api/opportunities', {
  params: { bucket: 'software', sort: 'newest', limit: 50, offset: 0 }
})
// data.items, data.total, data.buckets, data.cap

// open a posting
window.open(item.url, '_blank', 'noopener,noreferrer')
```

No changes to `frontend/src/lib/api.js` are required — it already attaches the Supabase token, which the new `get_supabase_user` dependency now validates on the backend side.

---

## 8. Frontend page (only if the other worktree wants a reference implementation)

Skip if the other worktree owns the UI. If not, here is the minimal page so the in-repo frontend has it too.

**`frontend/src/pages/Opportunities.jsx` — NEW:**
- 5 tab pills: `Software | Product | AI/ML/Data Science | Quant | Hardware`, each showing `buckets[key] ?? 0`. Clicking sets `bucket` state.
- Filter strip: search input (`q`, debounced 300 ms), location input, "Visa-friendly" checkbox.
- Card list: company name, title, location chips, posted-date (`new Date(date_posted * 1000).toLocaleDateString()`), Apply button → `<a href={url} target="_blank" rel="noopener noreferrer">`.
- Header: "X / 100 live internships" using `total` and `cap`.
- Loading skeleton + empty state.
- Use `lantern-*` Tailwind tokens; mirror layout from existing list pages.

**`frontend/src/App.jsx`** — register route:
```jsx
<Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
```

**`frontend/src/components/Navbar.jsx`** — add a nav link with the `Briefcase` icon from `lucide-react` between existing items.

---

## 9. Build sequence

1. `backend/requirements.txt` — add `apscheduler==3.10.4`.
2. `backend/app/config.py` — add `supabase_url` and `supabase_jwt_secret` settings.
3. `backend/app/models.py` — append `Opportunity` class; add `Index` to imports if not already.
4. `backend/app/schemas.py` — append `OpportunityOut`.
5. `backend/app/auth_supabase.py` — new file with `get_supabase_user`.
6. `backend/app/services/__init__.py` — empty.
7. `backend/app/services/opportunities_ingest.py` — full module per §4.
8. `backend/app/scheduler.py` — per §5.
9. `backend/app/main.py` — switch to `lifespan`, import `opportunities` route, register router.
10. `backend/app/routes/opportunities.py` — list + sync endpoints.
11. (Optional) Frontend page + route + navbar entry — only if the other worktree isn't doing it.

Steps 1–10 are fully testable without touching the frontend.

---

## 10. Verification

- `pip install -r backend/requirements.txt` then `uvicorn app.main:app --reload` from `backend/`.
- Watch logs within ~30 s for `ingest complete: inserted=N updated=0 evicted=0 active=100`. The `active=100` is the proof the cap works.
- Get a Supabase access token from the running frontend (DevTools → Application → Local Storage → `sb-<project>-auth-token` → `access_token`).
- `curl -H "Authorization: Bearer $TOKEN" 'http://localhost:8000/api/opportunities?bucket=software&limit=3'` — expect `items`, `total`, `buckets` (sum ≤ 100), `cap: 100`.
- `curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/opportunities/sync` — second call should show `inserted=0`, `updated≈100`, `evicted=0` (steady state).
- `sqlite3 backend/lantern.db "select count(*) from opportunities where active=1;"` — must return ≤ 100. Bucket breakdown: `select bucket, count(*) from opportunities where active=1 group by bucket;`.
- `curl` without an `Authorization` header → 401.

---

## 11. Risks and gotchas

- **Egress.** ~3 MB × 24/day ≈ 70 MB/day pulled from GitHub raw. Well under unauthenticated rate limits.
- **Single-process scheduler.** APScheduler runs in-process. If FastAPI dies, ingest stops. Multi-worker uvicorn would run the job N times — pin to `--workers 1` or move to external cron later.
- **Schema drift canary.** A `< 50% kept` warning catches the case where Simplify renames `category` to something not in `BUCKET_MAP`.
- **SQLite + concurrent ingest.** Ingest writes (~100 rows) while requests read. Default journal mode is fine at this volume; switch to WAL via a one-line PRAGMA in `database.py` if write contention shows up.
- **First-boot race.** `next_run_time=datetime.now()` fires inside `lifespan` startup but resolves on the loop — first HTTP request might race the first ingest and see `total=0`. Frontend empty state covers it.
- **Cap interaction with eviction.** A row evicted in run N can re-enter in run N+1 if upstream's `date_posted` makes it top-100 again. The soft-delete keeps the row record, so this is a single-column `UPDATE active=True`, not a re-insert. No data loss.
- **Auth migration debt.** The existing FastAPI HS256 routes (e.g. `/api/users/me`) now coexist with a Supabase-JWT route. Both work, but a future cleanup should migrate the legacy routes to `get_supabase_user` so there's one auth path. Out of scope here.
- **CLAUDE.md is stale.** It still describes the SQLAlchemy/HS256 stack as the source of truth. Worth updating in a follow-up so future agents don't repeat the confusion this plan ran into.

---

### Critical files

- `/Users/n.chinlue/ClearOffer/backend/app/main.py`
- `/Users/n.chinlue/ClearOffer/backend/app/config.py`
- `/Users/n.chinlue/ClearOffer/backend/app/models.py`
- `/Users/n.chinlue/ClearOffer/backend/app/schemas.py`
- `/Users/n.chinlue/ClearOffer/backend/app/auth_supabase.py` (new)
- `/Users/n.chinlue/ClearOffer/backend/app/services/opportunities_ingest.py` (new)
- `/Users/n.chinlue/ClearOffer/backend/app/scheduler.py` (new)
- `/Users/n.chinlue/ClearOffer/backend/app/routes/opportunities.py` (new)
- `/Users/n.chinlue/ClearOffer/backend/requirements.txt`
