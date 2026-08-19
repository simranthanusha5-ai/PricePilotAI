from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from auth import decode_access_token
from database import get_db
from models import User


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except (ValueError, TypeError):
        raise credentials_error

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise credentials_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account is inactive.",
        )

    return user


def require_roles(
    *allowed_roles: str,
) -> Callable:
    def role_dependency(
        current_user: User = Depends(
            get_current_user
        ),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to perform this action."
                ),
            )

        return current_user

    return role_dependency