from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    university = Column(String)
    grad_year = Column(Integer)
    major = Column(String)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reviews = relationship("Review", back_populates="author", foreign_keys="Review.user_id")
    saved_companies = relationship("SavedCompany", back_populates="user")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    industry = Column(String)
    logo_url = Column(String)
    website = Column(String)
    avg_rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    rating_work = Column(Float, default=0.0)
    rating_mentorship = Column(Float, default=0.0)
    rating_compensation = Column(Float, default=0.0)
    rating_culture = Column(Float, default=0.0)
    return_offer_rate = Column(Float, default=0.0)
    top_tags = Column(JSON, default=list)
    ai_overview = Column(Text)
    ai_overview_updated = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reviews = relationship("Review", back_populates="company")
    saved_by = relationship("SavedCompany", back_populates="company")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

    role_title = Column(String, nullable=False)
    team = Column(String)
    internship_year = Column(Integer)
    duration_months = Column(Integer)
    location_type = Column(String)  # onsite/hybrid/remote
    location = Column(String)

    rating = Column(Float, nullable=True)
    rating_work = Column(Float)
    rating_mentorship = Column(Float)
    rating_compensation = Column(Float)
    rating_culture = Column(Float)

    work_description = Column(Text)
    one_line_summary = Column(String)
    tech_used = Column(JSON, default=list)

    interview_rounds = Column(Integer)
    interview_topics = Column(JSON, default=list)
    interview_difficulty = Column(Integer)
    days_to_offer = Column(Integer)
    specific_questions = Column(Text)
    interview_experience = Column(Text)

    would_return = Column(Boolean)
    would_recommend = Column(Boolean)

    anonymous = Column(Boolean, default=True)
    show_university = Column(Boolean, default=False)
    helpful_count = Column(Integer, default=0)
    is_approved = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User", back_populates="reviews", foreign_keys=[user_id])
    company = relationship("Company", back_populates="reviews")


class SavedCompany(Base):
    __tablename__ = "saved_companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_companies")
    company = relationship("Company", back_populates="saved_by")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used = Column(Boolean, default=False)
