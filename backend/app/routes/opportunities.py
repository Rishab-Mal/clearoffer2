from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import String, asc, cast, desc, func, or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth_supabase import get_supabase_user
from ..database import get_db
from ..services.opportunities_ingest import MAX_ROWS_PER_BUCKET, run_ingest

BUCKET_VALUES = ("software", "product", "ai_ml_data", "quant", "hardware")

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.get("")
def list_opportunities(
    bucket: Optional[Literal["software", "product", "ai_ml_data", "quant", "hardware"]] = Query(None),
    q: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    sponsorship_friendly: Optional[bool] = Query(None),
    sort: Literal["newest", "oldest"] = Query("newest"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_supabase_user),
):
    del user

    query = db.query(models.Opportunity).filter(models.Opportunity.active.is_(True))

    if bucket:
        query = query.filter(models.Opportunity.bucket == bucket)

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                models.Opportunity.title.ilike(pattern),
                models.Opportunity.company_name.ilike(pattern),
            )
        )

    if location:
        query = query.filter(cast(models.Opportunity.locations, String).ilike(f"%{location}%"))

    if sponsorship_friendly:
        query = query.filter(
            or_(
                models.Opportunity.sponsorship.is_(None),
                ~models.Opportunity.sponsorship.ilike("%citizenship%"),
            )
        ).filter(
            or_(
                models.Opportunity.sponsorship.is_(None),
                ~models.Opportunity.sponsorship.ilike("%clearance%"),
            )
        )

    total = query.count()

    order_column = desc(models.Opportunity.date_posted) if sort == "newest" else asc(models.Opportunity.date_posted)
    items = query.order_by(order_column).offset(offset).limit(limit).all()

    bucket_rows = (
        db.query(models.Opportunity.bucket, func.count(models.Opportunity.id))
        .filter(models.Opportunity.active.is_(True))
        .group_by(models.Opportunity.bucket)
        .all()
    )
    buckets = {bucket_name: 0 for bucket_name in BUCKET_VALUES}
    for bucket_name, count in bucket_rows:
        if bucket_name in buckets:
            buckets[bucket_name] = count

    return {
        "items": [schemas.OpportunityOut.model_validate(item).model_dump() for item in items],
        "total": total,
        "buckets": buckets,
        "cap": MAX_ROWS_PER_BUCKET,
    }


@router.post("/sync")
async def sync_now(user=Depends(get_supabase_user)):
    del user
    return await run_ingest()
