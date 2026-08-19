import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import PredictionHistory, User
from schemas import (
    PredictionHistoryCreate,
    PredictionHistoryResponse,
)


router = APIRouter(
    prefix="/history",
    tags=["Prediction History"],
)


@router.post(
    "",
    response_model=PredictionHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_history_record(
    payload: PredictionHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = PredictionHistory(
        user_id=current_user.id,
        module=payload.module,
        product_name=payload.product_name,
        input_data=json.dumps(payload.input_data),
        result_data=json.dumps(payload.result_data),
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get(
    "",
    response_model=list[PredictionHistoryResponse],
)
def list_history_records(
    module: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.user_id
            == current_user.id
        )
    )

    if module:
        query = query.filter(
            PredictionHistory.module == module
        )

    return (
        query
        .order_by(
            PredictionHistory.created_at.desc()
        )
        .all()
    )


@router.get(
    "/{record_id}",
    response_model=PredictionHistoryResponse,
)
def get_history_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == record_id,
            PredictionHistory.user_id
            == current_user.id,
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History record not found.",
        )

    return record


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_history_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == record_id,
            PredictionHistory.user_id
            == current_user.id,
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History record not found.",
        )

    db.delete(record)
    db.commit()