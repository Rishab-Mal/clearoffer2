import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

OPENROUTER_BASE = "https://openrouter.ai/api/v1"


def get_client():
    if not settings.openrouter_api_key:
        return None
    from openai import OpenAI
    return OpenAI(
        base_url=OPENROUTER_BASE,
        api_key=settings.openrouter_api_key,
    )


def chat(client, prompt: str, max_tokens: int = 1024) -> str:
    response = client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


@router.post("/resume-fit", response_model=schemas.ResumeFitResult)
def score_resume_fit(
    data: schemas.ResumeFitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not data.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required.")

    company = db.query(models.Company).filter(models.Company.name.ilike(data.company)).first()
    context = f"Company context: {company.ai_overview}\n\n" if company and company.ai_overview else ""

    client = get_client()
    if not client:
        return schemas.ResumeFitResult(
            overall_score=65, skills_score=70, experience_score=60, project_score=65,
            strengths=["Strong technical background", "Relevant project experience"],
            gaps=["Limited industry-specific experience", "Missing some key technologies"],
            suggestions=[
                "Add quantified achievements to your projects",
                "Highlight relevant coursework",
                "Include links to GitHub or portfolio",
            ],
        )

    prompt = f"""You are an expert resume reviewer for tech internships.

{context}A student is applying for a {data.role} position at {data.company}.

Resume:
---
{data.resume_text[:4000]}
---

Analyze the fit. Return a JSON object with exactly these keys:
- overall_score: integer 0-100
- skills_score: integer 0-100
- experience_score: integer 0-100
- project_score: integer 0-100
- strengths: array of 2-4 specific strength strings
- gaps: array of 2-4 specific gap strings
- suggestions: array of 3-5 specific actionable suggestion strings

Be honest and specific. Reference what past interns at {data.company} typically have.
Return ONLY valid JSON, no other text."""

    try:
        text = chat(client, prompt, max_tokens=1024)
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return schemas.ResumeFitResult(**json.loads(text))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.get("/interview-prep/{company_id}")
def get_interview_prep(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    reviews = db.query(models.Review).filter(
        models.Review.company_id == company_id,
        models.Review.is_approved == True,
    ).all()

    topic_counts: dict[str, int] = {}
    difficulty_dist = {"Easy": 0, "Medium": 0, "Hard": 0, "Very Hard": 0}
    days_list = []

    for r in reviews:
        for t in (r.interview_topics or []):
            topic_counts[t] = topic_counts.get(t, 0) + 1
        if r.interview_difficulty:
            label = {1: "Easy", 2: "Easy", 3: "Medium", 4: "Hard", 5: "Very Hard"}.get(r.interview_difficulty, "Medium")
            difficulty_dist[label] += 1
        if r.days_to_offer:
            days_list.append(r.days_to_offer)

    topics = sorted([{"name": k, "count": v} for k, v in topic_counts.items()], key=lambda x: -x["count"])
    total_diff = sum(difficulty_dist.values()) or 1
    diff_pct = {k: round(v / total_diff * 100) for k, v in difficulty_dist.items()}
    avg_days = int(sum(days_list) / len(days_list)) if days_list else 30

    study_plan = "Focus on the most common topics above. Aim for 2–3 medium Leetcode problems per day. Prepare STAR stories for behavioral rounds."
    tips = ["Think out loud — interviewers value your reasoning process.", "Prepare specific questions for your interviewer."]

    client = get_client()
    if client and topics:
        top_topics = ", ".join(t["name"] for t in topics[:5])
        prompt = f"""Generate a 4-week interview prep plan for a student interviewing at {company.name} for a software engineering internship.
Most common interview topics reported by past interns: {top_topics}.

Return a JSON object with:
- study_plan: multi-paragraph study plan string (use **Week N:** headers)
- tips: array of 3-4 specific interview tips for {company.name}

Return ONLY valid JSON."""
        try:
            text = chat(client, prompt, max_tokens=600)
            text = text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            parsed = json.loads(text)
            study_plan = parsed.get("study_plan", study_plan)
            tips = parsed.get("tips", tips)
        except Exception:
            pass

    return {
        "company_name": company.name,
        "topics": topics or [{"name": "System Design", "count": 10}, {"name": "Algorithms", "count": 8}],
        "difficulty_distribution": diff_pct,
        "timeline": {"apply": 0, "oa": 7, "phone_screen": 18, "final": 28, "offer": avg_days},
        "study_plan": study_plan,
        "tips": tips,
        "reported_questions": [],
    }


@router.post("/generate-company-summary/{company_id}")
def generate_company_summary(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    reviews = db.query(models.Review).filter(
        models.Review.company_id == company_id,
        models.Review.is_approved == True,
    ).limit(30).all()

    if not reviews:
        raise HTTPException(status_code=400, detail="Not enough reviews to generate a summary.")

    client = get_client()
    if not client:
        raise HTTPException(status_code=503, detail="AI not configured. Set OPENROUTER_API_KEY in .env.")

    review_texts = "\n---\n".join([
        f"Role: {r.role_title}\nYear: {r.internship_year}\nWork: {r.work_description or ''}\nWould return: {r.would_return}"
        for r in reviews[:20]
    ])

    prompt = f"""Synthesize these {len(reviews)} intern reviews for {company.name} into a 3–4 sentence overview.
Be honest, specific, and direct. Cover the culture, work quality, and any consistent themes.

Reviews:
{review_texts[:3000]}

Return ONLY the summary paragraph — no JSON, no headers, no preamble."""

    try:
        summary = chat(client, prompt, max_tokens=400)
        company.ai_overview = summary.strip()
        db.commit()
        return {"ai_overview": company.ai_overview}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
