import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import User, Institution
from app.schemas import UserLogin, UserRegister, TokenResponse, UserOut
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/institutions")
def list_institutions(db: Session = Depends(get_db)):
    """List registered institutions for convenient selection during sign up."""
    institutions = db.query(Institution).order_by(Institution.name.asc()).limit(50).all()
    return [{"id": i.id, "name": i.name, "code": i.institution_code, "state": i.state} for i in institutions]

@router.post("/register", response_model=TokenResponse)
def register(credentials: UserRegister, db: Session = Depends(get_db)):
    email_clean = credentials.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    if len(credentials.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    role = credentials.role.strip() if credentials.role else "INSTITUTION_USER"
    if role not in ["INSTITUTION_USER", "REGULATORY_OFFICER", "ADMIN"]:
        role = "INSTITUTION_USER"

    institution_id = None
    if role == "INSTITUTION_USER":
        code = credentials.institution_code.strip() if credentials.institution_code else None
        name = credentials.institution_name.strip() if credentials.institution_name else None
        state = credentials.state.strip() if credentials.state else "General"

        if code:
            inst = db.query(Institution).filter(Institution.institution_code == code).first()
            if not inst and name:
                inst = Institution(name=name, institution_code=code, state=state)
                db.add(inst)
                db.flush()
            if inst:
                institution_id = inst.id
        elif name:
            generated_code = f"1-{uuid.uuid4().hex[:8].upper()}"
            inst = Institution(name=name, institution_code=generated_code, state=state)
            db.add(inst)
            db.flush()
            institution_id = inst.id

    hashed_pw = get_password_hash(credentials.password)
    user = User(
        email=email_clean,
        password_hash=hashed_pw,
        full_name=credentials.full_name.strip(),
        role=role,
        institution_id=institution_id,
        is_active=True,
        last_login_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    inst_name = user.institution.name if user.institution else None
    inst_code = user.institution.institution_code if user.institution else None

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            id=user.id,
            email=user.email,
            role=user.role,
            full_name=user.full_name,
            institution_id=user.institution_id,
            institution_name=inst_name,
            institution_code=inst_code,
            is_active=user.is_active
        )
    )

import time

_FAILED_ATTEMPTS: dict = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 300

def _check_rate_limit(email: str):
    now = time.time()
    attempts = [t for t in _FAILED_ATTEMPTS.get(email, []) if now - t < LOCKOUT_WINDOW_SECONDS]
    _FAILED_ATTEMPTS[email] = attempts
    if len(attempts) >= MAX_FAILED_ATTEMPTS:
        remaining = int(LOCKOUT_WINDOW_SECONDS - (now - attempts[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Security alert: Too many failed login attempts. Please wait {remaining} seconds before trying again."
        )

def _record_failed_attempt(email: str):
    now = time.time()
    attempts = [t for t in _FAILED_ATTEMPTS.get(email, []) if now - t < LOCKOUT_WINDOW_SECONDS]
    attempts.append(now)
    _FAILED_ATTEMPTS[email] = attempts

def _clear_failed_attempts(email: str):
    if email in _FAILED_ATTEMPTS:
        del _FAILED_ATTEMPTS[email]

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    email_clean = credentials.email.strip().lower()
    _check_rate_limit(email_clean)

    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        _record_failed_attempt(email_clean)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated for security."
        )

    _clear_failed_attempts(email_clean)
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    inst_name = user.institution.name if user.institution else None
    inst_code = user.institution.institution_code if user.institution else None

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            id=user.id,
            email=user.email,
            role=user.role,
            full_name=user.full_name,
            institution_id=user.institution_id,
            institution_name=inst_name,
            institution_code=inst_code,
            is_active=user.is_active
        )
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    inst_name = current_user.institution.name if current_user.institution else None
    inst_code = current_user.institution.institution_code if current_user.institution else None
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name,
        institution_id=current_user.institution_id,
        institution_name=inst_name,
        institution_code=inst_code,
        is_active=current_user.is_active
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out."}
