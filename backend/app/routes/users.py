from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user, hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_me(data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if data.email and data.email != current_user.email:
        existing = db.query(models.User).filter(models.User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use.")
        current_user.email = data.email
    if data.name:
        current_user.name = data.name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me")
def delete_me(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    for review in current_user.reviews:
        review.user_id = None
        review.anonymous = True
        review.show_university = False
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.id}@deleted.invalid"
    current_user.name = "Deleted User"
    db.commit()
    return {"message": "Account deleted. Your reviews have been anonymized."}


@router.get("/me/reviews")
def get_my_reviews(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reviews = db.query(models.Review).filter(
        models.Review.user_id == current_user.id
    ).order_by(desc(models.Review.created_at)).all()

    result = []
    for r in reviews:
        result.append({
            **{col.name: getattr(r, col.name) for col in r.__table__.columns},
            "company_name": r.company.name if r.company else None,
        })
    return result


@router.get("/saved-companies")
def get_saved_companies(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    saved = db.query(models.SavedCompany).filter(
        models.SavedCompany.user_id == current_user.id
    ).all()
    result = []
    for s in saved:
        c = s.company
        result.append({
            "id": c.id, "name": c.name, "industry": c.industry,
            "avg_rating": c.avg_rating, "review_count": c.review_count,
        })
    return result


@router.post("/saved-companies", status_code=201)
def save_company(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    company_id = data.get("company_id")
    existing = db.query(models.SavedCompany).filter(
        models.SavedCompany.user_id == current_user.id,
        models.SavedCompany.company_id == company_id,
    ).first()
    if existing:
        return {"message": "Already saved."}
    sc = models.SavedCompany(user_id=current_user.id, company_id=company_id)
    db.add(sc)
    db.commit()
    return {"message": "Saved."}


@router.delete("/saved-companies/{company_id}")
def unsave_company(company_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sc = db.query(models.SavedCompany).filter(
        models.SavedCompany.user_id == current_user.id,
        models.SavedCompany.company_id == company_id,
    ).first()
    if sc:
        db.delete(sc)
        db.commit()
    return {"message": "Removed from saved."}
