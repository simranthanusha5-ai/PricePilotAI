from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_roles
from models import PricingHistory, Product, User
from schemas import (
    PricingHistoryResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "pricing_manager")
    ),
):
    existing_product = (
        db.query(Product)
        .filter(Product.sku == payload.sku)
        .first()
    )

    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product with this SKU already exists.",
        )

    product = Product(
        name=payload.name,
        sku=payload.sku,
        category=payload.category,
        current_price=payload.current_price,
        cost_price=payload.cost_price,
        stock_quantity=payload.stock_quantity,
        description=payload.description,
        created_by=current_user.id,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.get(
    "",
    response_model=list[ProductResponse],
)
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Product)
        .order_by(Product.created_at.desc())
        .all()
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "pricing_manager")
    ),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    change_reason = update_data.pop(
        "change_reason",
        None,
    )

    new_sku = update_data.get("sku")

    if new_sku and new_sku != product.sku:
        duplicate = (
            db.query(Product)
            .filter(Product.sku == new_sku)
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product with this SKU already exists.",
            )

    old_price = product.current_price
    new_price = update_data.get(
        "current_price",
        old_price,
    )

    for field, value in update_data.items():
        setattr(product, field, value)

    if new_price != old_price:
        history = PricingHistory(
            product_id=product.id,
            old_price=old_price,
            new_price=new_price,
            change_reason=change_reason,
            changed_by=current_user.id,
        )

        db.add(history)

    db.commit()
    db.refresh(product)

    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    db.delete(product)
    db.commit()


@router.get(
    "/{product_id}/pricing-history",
    response_model=list[PricingHistoryResponse],
)
def get_pricing_history(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return (
        db.query(PricingHistory)
        .filter(
            PricingHistory.product_id == product_id
        )
        .order_by(
            PricingHistory.changed_at.desc()
        )
        .all()
    )