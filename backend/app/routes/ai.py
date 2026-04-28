import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

OPENROUTER_BASE = "https://openrouter.ai/api/v1"


def get_client():
    if not settings.openrouter_api_key:
        return None
    from openai import OpenAI
    return OpenAI(base_url=OPENROUTER_BASE, api_key=settings.openrouter_api_key)


def chat(client, prompt: str, max_tokens: int = 1024) -> str:
    response = client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


# ── Request / Response schemas ────────────────────────────────────────────────

class ResumeFitRequest(BaseModel):
    resume_text: str
    company: str
    role: str
    company_overview: Optional[str] = None

class ResumeFitResult(BaseModel):
    overall_score: int
    skills_score: int
    experience_score: int
    project_score: int
    strengths: List[str]
    gaps: List[str]
    suggestions: List[str]

class InterviewPrepRequest(BaseModel):
    company_name: str
    topics: List[str] = []
    difficulty: Optional[str] = None

class CompanySummaryRequest(BaseModel):
    company_name: str
    review_texts: List[str]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/resume-fit", response_model=ResumeFitResult)
def score_resume_fit(data: ResumeFitRequest):
    if not data.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required.")

    client = get_client()
    if not client:
        return ResumeFitResult(
            overall_score=65, skills_score=70, experience_score=60, project_score=65,
            strengths=["Strong technical background", "Relevant project experience"],
            gaps=["Limited industry-specific experience", "Missing key technologies"],
            suggestions=["Add quantified achievements", "Highlight relevant coursework", "Link to GitHub"],
        )

    context = f"Company overview: {data.company_overview}\n\n" if data.company_overview else ""
    prompt = f"""You are an expert resume reviewer for tech internships.

{context}A student is applying for a {data.role} position at {data.company}.

Resume:
---
{data.resume_text[:4000]}
---

Return a JSON object with exactly:
- overall_score: int 0-100
- skills_score: int 0-100
- experience_score: int 0-100
- project_score: int 0-100
- strengths: array of 2-4 specific strength strings
- gaps: array of 2-4 specific gap strings
- suggestions: array of 3-5 actionable suggestion strings

Be honest and specific. Return ONLY valid JSON."""

    try:
        return ResumeFitResult(**parse_json(chat(client, prompt, 1024)))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {e}")


@router.post("/interview-prep")
def get_interview_prep(data: InterviewPrepRequest):
    client = get_client()
    study_plan = "Focus on the most common topics. Do 2–3 medium Leetcode problems per day. Prepare STAR stories for behavioral rounds."
    tips = ["Think out loud — interviewers value reasoning over just the answer.", "Prepare specific questions for your interviewer."]

    if client and data.topics:
        top_topics = ", ".join(data.topics[:6])
        prompt = f"""Generate a 4-week interview prep plan for a student interviewing at {data.company_name}.
Most common topics reported by past interns: {top_topics}.

Return JSON with:
- study_plan: multi-paragraph string (use **Week N:** headers)
- tips: array of 3-4 specific interview tips for {data.company_name}

Return ONLY valid JSON."""
        try:
            parsed = parse_json(chat(client, prompt, 600))
            study_plan = parsed.get("study_plan", study_plan)
            tips = parsed.get("tips", tips)
        except Exception:
            pass

    return {"study_plan": study_plan, "tips": tips}


@router.post("/generate-company-summary")
def generate_company_summary(data: CompanySummaryRequest):
    if not data.review_texts:
        raise HTTPException(status_code=400, detail="No review texts provided.")

    client = get_client()
    if not client:
        raise HTTPException(status_code=503, detail="AI not configured. Set OPENROUTER_API_KEY in .env.")

    combined = "\n---\n".join(data.review_texts[:20])
    prompt = f"""Synthesize these intern reviews for {data.company_name} into a 3–4 sentence overview.
Be honest, specific, and direct. Cover culture, work quality, and consistent themes.

Reviews:
{combined[:3000]}

Return ONLY the summary paragraph — no JSON, no headers."""

    try:
        return {"ai_overview": chat(client, prompt, 400).strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")
