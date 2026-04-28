from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    university: str
    grad_year: int
    major: str

    @field_validator('email')
    @classmethod
    def must_be_edu(cls, v):
        if not v.lower().endswith('.edu'):
            raise ValueError('Must be a .edu email address')
        return v.lower()

    @field_validator('password')
    @classmethod
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    university: Optional[str]
    grad_year: Optional[int]
    major: Optional[str]
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class CompanyOut(BaseModel):
    id: int
    name: str
    industry: Optional[str]
    avg_rating: float
    review_count: int
    rating_work: float
    rating_mentorship: float
    rating_compensation: float
    rating_culture: float
    return_offer_rate: float
    top_tags: List[str]
    ai_overview: Optional[str]
    ai_teaser: Optional[str] = None
    is_saved: Optional[bool] = False

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    company: str
    role_title: str
    team: Optional[str] = None
    internship_year: Optional[int] = None
    duration_months: Optional[int] = None
    location_type: Optional[str] = None
    location: Optional[str] = None
    rating_work: Optional[float] = None
    rating_mentorship: Optional[float] = None
    rating_compensation: Optional[float] = None
    rating_culture: Optional[float] = None
    work_description: Optional[str] = None
    one_line_summary: Optional[str] = None
    tech_used: Optional[List[str]] = []
    interview_rounds: Optional[int] = None
    interview_topics: Optional[List[str]] = []
    interview_difficulty: Optional[int] = None
    days_to_offer: Optional[int] = None
    specific_questions: Optional[str] = None
    would_return: Optional[bool] = None
    would_recommend: Optional[bool] = None
    anonymous: bool = True
    show_university: bool = False

class ReviewOut(BaseModel):
    id: int
    role_title: str
    team: Optional[str]
    internship_year: Optional[int]
    rating: Optional[float]
    one_line_summary: Optional[str]
    work_description: Optional[str]
    interview_experience: Optional[str]
    would_return: Optional[bool]
    tech_used: Optional[List[str]]
    helpful_count: int
    university: Optional[str] = None
    show_university: bool
    location: Optional[str]
    company_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeFitRequest(BaseModel):
    resume_text: str
    company: str
    role: str

class ResumeFitResult(BaseModel):
    overall_score: int
    skills_score: int
    experience_score: int
    project_score: int
    strengths: List[str]
    gaps: List[str]
    suggestions: List[str]


class OpportunityOut(BaseModel):
    id: str
    company_name: str
    title: str
    bucket: str
    locations: List[str]
    terms: List[str]
    degrees: List[str]
    sponsorship: Optional[str] = None
    url: Optional[str] = None
    company_url: Optional[str] = None
    date_posted: Optional[int] = None

    class Config:
        from_attributes = True
