import secrets
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import hash_password, verify_password, create_access_token
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


async def send_verification_email(email: str, token: str):
    verify_url = f"{settings.frontend_url}/auth/verify?token={token}"
    print(f"\n{'='*60}")
    print(f"  VERIFY EMAIL (dev fallback)")
    print(f"  Email : {email}")
    print(f"  URL   : {verify_url}")
    print(f"{'='*60}\n")
    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your Lantern account"
        msg["From"] = settings.email_from
        msg["To"] = email

        verify_url = f"{settings.frontend_url}/auth/verify?token={token}"
        html = f"""
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
          <h1 style="font-size:24px;font-weight:900;color:#0F172A">✦ LANTERN</h1>
          <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin-top:24px">Verify your email</h2>
          <p style="color:#64748B;font-size:14px">Click the button below to activate your Lantern account.</p>
          <a href="{verify_url}" style="display:inline-block;margin-top:20px;background:#F59E0B;color:#000;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:14px">
            Verify email
          </a>
          <p style="color:#94A3B8;font-size:12px;margin-top:24px">If you didn't create a Lantern account, ignore this email.</p>
        </div>
        """
        msg.attach(MIMEText(html, "html"))

        if settings.smtp_user:
            await aiosmtplib.send(
                msg, hostname=settings.smtp_host, port=settings.smtp_port,
                username=settings.smtp_user, password=settings.smtp_password, start_tls=True,
            )
    except Exception:
        pass  # fail silently in dev


@router.post("/signup", status_code=201)
async def signup(data: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = models.User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
        university=data.university,
        grad_year=data.grad_year,
        major=data.major,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = secrets.token_urlsafe(32)
    vt = models.EmailVerificationToken(user_id=user.id, token=token)
    db.add(vt)
    db.commit()

    background_tasks.add_task(send_verification_email, user.email, token)

    return {"message": "Account created. Check your email to verify."}


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    vt = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.token == token,
        models.EmailVerificationToken.used == False,
    ).first()
    if not vt:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    user = db.query(models.User).filter(models.User.id == vt.user_id).first()
    user.is_verified = True
    vt.used = True
    db.commit()

    return {"message": "Email verified successfully."}


@router.post("/resend-verification")
async def resend_verification(email: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email.lower()).first()
    if not user or user.is_verified:
        return {"message": "If that account exists and is unverified, we sent a new link."}

    token = secrets.token_urlsafe(32)
    vt = models.EmailVerificationToken(user_id=user.id, token=token)
    db.add(vt)
    db.commit()

    background_tasks.add_task(send_verification_email, user.email, token)
    return {"message": "Verification email resent."}
