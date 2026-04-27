from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/companies", tags=["companies"])


def enrich_company(c: models.Company, user: models.User, db: Session) -> dict:
    is_saved = db.query(models.SavedCompany).filter(
        models.SavedCompany.user_id == user.id,
        models.SavedCompany.company_id == c.id
    ).first() is not None
    teaser = (c.ai_overview or '')[:120] + '...' if c.ai_overview else None
    return {
        **{k: getattr(c, k, None) for k in schemas.CompanyOut.model_fields},
        "is_saved": is_saved,
        "ai_teaser": teaser,
    }


@router.get("/trending")
def trending_companies(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    companies = db.query(models.Company).order_by(desc(models.Company.review_count)).limit(10).all()
    return [enrich_company(c, current_user, db) for c in companies]


@router.get("/recommended")
def recommended_companies(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    companies = db.query(models.Company).order_by(desc(models.Company.avg_rating)).limit(6).all()
    return [enrich_company(c, current_user, db) for c in companies]


@router.get("/search")
def search_companies(
    q: Optional[str] = Query(None),
    roles: Optional[List[str]] = Query(None),
    tech: Optional[List[str]] = Query(None),
    difficulty: Optional[int] = Query(0),
    sort: str = Query("most_reviewed"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Company)

    if q:
        query = query.filter(models.Company.name.ilike(f"%{q}%"))

    if sort == "most_reviewed":
        query = query.order_by(desc(models.Company.review_count))
    elif sort == "highest_rated":
        query = query.order_by(desc(models.Company.avg_rating))
    else:
        query = query.order_by(desc(models.Company.review_count))

    companies = query.limit(50).all()
    return [enrich_company(c, current_user, db) for c in companies]


@router.get("/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    c = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not c:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Company not found")
    return enrich_company(c, current_user, db)


@router.get("/{company_id}/reviews")
def get_company_reviews(
    company_id: int,
    sort: str = Query("helpful"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Review).filter(
        models.Review.company_id == company_id,
        models.Review.is_approved == True,
    )
    if sort == "helpful":
        q = q.order_by(desc(models.Review.helpful_count))
    else:
        q = q.order_by(desc(models.Review.created_at))

    reviews = q.limit(50).all()
    result = []
    for r in reviews:
        university = r.author.university if r.show_university else None
        avg = sum(filter(None, [r.rating_work, r.rating_mentorship, r.rating_compensation, r.rating_culture])) or 0
        count = sum(1 for v in [r.rating_work, r.rating_mentorship, r.rating_compensation, r.rating_culture] if v)
        result.append({
            **{col.name: getattr(r, col.name) for col in r.__table__.columns},
            "university": university,
            "rating": round(avg / count, 1) if count else None,
            "interview_experience": r.specific_questions,
        })
    return result
