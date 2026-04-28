from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, companies, reviews, users, ai
from .config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClearOffer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ClearOffer API"}


@app.get("/api/stats/reviews-count")
def review_count(db=None):
    from .database import SessionLocal
    from .models import Review
    db = SessionLocal()
    try:
        return {"count": db.query(Review).filter(Review.is_approved == True).count()}
    finally:
        db.close()
