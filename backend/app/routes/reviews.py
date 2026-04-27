from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _recalculate_company_stats(company: models.Company, db: Session):
    reviews = db.query(models.Review).filter(
        models.Review.company_id == company.id,
        models.Review.is_approved == True,
    ).all()

    if not reviews:
        return

    def avg(values): return round(sum(v for v in values if v) / max(1, sum(1 for v in values if v)), 2)

    company.review_count = len(reviews)
    company.rating_work = avg([r.rating_work for r in reviews])
    company.rating_mentorship = avg([r.rating_mentorship for r in reviews])
    company.rating_compensation = avg([r.rating_compensation for r in reviews])
    company.rating_culture = avg([r.rating_culture for r in reviews])
    company.avg_rating = avg([company.rating_work, company.rating_mentorship,
                               company.rating_compensation, company.rating_culture])

    returns = [r.would_return for r in reviews if r.would_return is not None]
    company.return_offer_rate = round(sum(1 for v in returns if v) / max(1, len(returns)) * 100, 1)

    tech_counts = {}
    for r in reviews:
        for t in (r.tech_used or []):
            tech_counts[t] = tech_counts.get(t, 0) + 1
    company.top_tags = sorted(tech_counts, key=tech_counts.get, reverse=True)[:5]

    db.commit()


@router.get("/recent")
def recent_reviews(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reviews = db.query(models.Review).filter(
        models.Review.is_approved == True
    ).order_by(desc(models.Review.created_at)).limit(20).all()

    result = []
    for r in reviews:
        avg_parts = [v for v in [r.rating_work, r.rating_mentorship, r.rating_compensation, r.rating_culture] if v]
        rating = round(sum(avg_parts) / len(avg_parts), 1) if avg_parts else None
        result.append({
            **{col.name: getattr(r, col.name) for col in r.__table__.columns},
            "company_name": r.company.name if r.company else None,
            "university": r.author.university if r.show_university else None,
            "rating": rating,
        })
    return result


@router.post("", status_code=201)
def create_review(data: schemas.ReviewCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    company = db.query(models.Company).filter(models.Company.name.ilike(data.company)).first()
    if not company:
        company = models.Company(name=data.company)
        db.add(company)
        db.commit()
        db.refresh(company)

    avg_parts = [v for v in [data.rating_work, data.rating_mentorship, data.rating_compensation, data.rating_culture] if v]
    avg_rating = round(sum(avg_parts) / len(avg_parts), 1) if avg_parts else None

    review = models.Review(
        user_id=current_user.id,
        company_id=company.id,
        rating=avg_rating or 3.0,
        role_title=data.role_title,
        team=data.team,
        internship_year=data.internship_year,
        duration_months=data.duration_months,
        location_type=data.location_type,
        location=data.location,
        rating_work=data.rating_work,
        rating_mentorship=data.rating_mentorship,
        rating_compensation=data.rating_compensation,
        rating_culture=data.rating_culture,
        work_description=data.work_description,
        one_line_summary=data.one_line_summary,
        tech_used=data.tech_used or [],
        interview_rounds=data.interview_rounds,
        interview_topics=data.interview_topics or [],
        interview_difficulty=data.interview_difficulty,
        days_to_offer=data.days_to_offer,
        specific_questions=data.specific_questions,
        would_return=data.would_return,
        would_recommend=data.would_recommend,
        anonymous=data.anonymous,
        show_university=data.show_university,
        is_approved=True,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    _recalculate_company_stats(company, db)

    return {"id": review.id, "message": "Review submitted successfully."}


@router.post("/{review_id}/helpful")
def mark_helpful(review_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.helpful_count = (review.helpful_count or 0) + 1
    db.commit()
    return {"helpful_count": review.helpful_count}


@router.delete("/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    review = db.query(models.Review).filter(
        models.Review.id == review_id,
        models.Review.user_id == current_user.id,
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    company = review.company
    db.delete(review)
    db.commit()
    if company:
        _recalculate_company_stats(company, db)
    return {"message": "Review deleted."}
