import logging
from collections.abc import Iterable

import httpx
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import Opportunity

LISTINGS_URL = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json"
MAX_ROWS_PER_BUCKET = 20
BUCKET_MAP: dict[str, str] = {
    "Software": "software",
    "Software Engineering": "software",
    "Product": "product",
    "Product Management": "product",
    "AI/ML/Data": "ai_ml_data",
    "Data Science, AI & Machine Learning": "ai_ml_data",
    "Quant": "quant",
    "Quantitative Finance": "quant",
    "Hardware": "hardware",
    "Hardware Engineering": "hardware",
}

logger = logging.getLogger(__name__)
BUCKET_VALUES = ("software", "product", "ai_ml_data", "quant", "hardware")


def normalize_category(raw: str | None) -> str | None:
    if not raw:
        return None
    return BUCKET_MAP.get(raw.strip())


def _coerce_string_list(values: object) -> list[str]:
    if not isinstance(values, Iterable) or isinstance(values, (str, bytes, dict)):
        return []
    result: list[str] = []
    for value in values:
        if value is None:
            continue
        if isinstance(value, dict):
            text = str(
                value.get("name")
                or value.get("label")
                or value.get("value")
                or ""
            ).strip()
        else:
            text = str(value).strip()
        if text:
            result.append(text)
    return result


async def fetch_listings() -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(LISTINGS_URL)
        response.raise_for_status()
        data = response.json()
    if not isinstance(data, list):
        raise ValueError("Unexpected opportunities payload")
    return data


def upsert_listings(db: Session, raw: list[dict]) -> dict:
    active_rows = [
        row for row in raw
        if isinstance(row, dict) and row.get("active")
    ]
    kept_rows = []
    for row in active_rows:
        if not row.get("is_visible", True):
            continue
        bucket = normalize_category(row.get("category"))
        if not bucket or not row.get("id"):
            continue
        kept_rows.append((row, bucket))

    kept_rows.sort(key=lambda item: item[0].get("date_posted") or 0, reverse=True)
    bucket_counts = {bucket: 0 for bucket in BUCKET_VALUES}
    top_rows = []
    for row, bucket in kept_rows:
        if bucket_counts[bucket] >= MAX_ROWS_PER_BUCKET:
            continue
        top_rows.append((row, bucket))
        bucket_counts[bucket] += 1

    kept_ids = {row["id"] for row, _ in top_rows}

    existing_active_ids = {
        row_id for (row_id,) in db.query(Opportunity.id).filter(Opportunity.active.is_(True)).all()
    }

    inserted = 0
    updated = 0
    for row, bucket in top_rows:
        opportunity = db.get(Opportunity, row["id"])
        if opportunity is None:
            opportunity = Opportunity(id=row["id"])
            db.add(opportunity)
            inserted += 1
        else:
            updated += 1

        opportunity.company_name = (row.get("company_name") or "").strip() or "Unknown Company"
        opportunity.title = (row.get("title") or "").strip() or "Untitled Opportunity"
        opportunity.bucket = bucket
        opportunity.category_raw = row.get("category")
        opportunity.locations = _coerce_string_list(row.get("locations"))
        opportunity.terms = _coerce_string_list(row.get("terms"))
        opportunity.degrees = _coerce_string_list(row.get("degrees"))
        opportunity.sponsorship = row.get("sponsorship")
        opportunity.url = row.get("url")
        opportunity.company_url = row.get("company_url")
        opportunity.source = row.get("source")
        opportunity.active = True
        opportunity.is_visible = bool(row.get("is_visible", True))
        opportunity.date_posted = row.get("date_posted")
        opportunity.date_updated = row.get("date_updated")

    soft_deleted = 0
    if existing_active_ids:
        to_deactivate = existing_active_ids - kept_ids
        if to_deactivate:
            soft_deleted = db.query(Opportunity).filter(
                Opportunity.active.is_(True),
                Opportunity.id.in_(to_deactivate),
            ).update(
                {
                    Opportunity.active: False,
                },
                synchronize_session=False,
            )

    db.commit()

    active_after = db.query(Opportunity).filter(Opportunity.active.is_(True)).count()
    evicted = sum(max(0, count - MAX_ROWS_PER_BUCKET) for count in (
        sum(1 for _, bucket in kept_rows if bucket == bucket_name) for bucket_name in BUCKET_VALUES
    ))
    fetched_active = len(active_rows)
    if fetched_active and (len(kept_rows) / fetched_active) < 0.5:
        logger.warning(
            "opportunities ingest kept less than half of active upstream rows: kept=%s fetched_active=%s",
            len(kept_rows),
            fetched_active,
        )

    return {
        "inserted": inserted,
        "updated": updated,
        "soft_deleted": soft_deleted,
        "evicted": evicted,
        "active_after": active_after,
    }


async def run_ingest() -> dict:
    db = SessionLocal()
    try:
        raw = await fetch_listings()
        stats = upsert_listings(db, raw)
        logger.info(
            "ingest complete: inserted=%s updated=%s soft_deleted=%s evicted=%s active=%s",
            stats["inserted"],
            stats["updated"],
            stats["soft_deleted"],
            stats["evicted"],
            stats["active_after"],
        )
        return stats
    except Exception:
        logger.exception("opportunities ingest failed")
        return {
            "inserted": 0,
            "updated": 0,
            "soft_deleted": 0,
            "evicted": 0,
            "active_after": db.query(Opportunity).filter(Opportunity.active.is_(True)).count(),
        }
    finally:
        db.close()
