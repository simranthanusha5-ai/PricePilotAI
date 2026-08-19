from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    hash_password,
    verify_password,
)
from database import get_db
from models import User
from schemas import (
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
)
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered.",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(
            payload.password
        ),
        role=payload.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if (
        user is None
        or not verify_password(
            form_data.password,
            user.hashed_password,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "role": user.role,
        },
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }
