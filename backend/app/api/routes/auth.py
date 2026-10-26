from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import User
from app.schemas import UserLogin, TokenResponse, UserOut
from app.core.security import verify_password, create_access_token
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    email_clean = credentials.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is deactivated."
        )

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
