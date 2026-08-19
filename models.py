from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(50),
        default="analyst",
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    products: Mapped[list["Product"]] = relationship(
        back_populates="creator",
    )

    price_changes: Mapped[list["PricingHistory"]] = relationship(
        back_populates="changed_by_user",
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(180),
        nullable=False,
    )

    sku: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    current_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    cost_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    stock_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    creator: Mapped["User"] = relationship(
        back_populates="products",
    )

    pricing_history: Mapped[list["PricingHistory"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
    )


class PricingHistory(Base):
    __tablename__ = "pricing_history"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False,
    )

    old_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    new_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    change_reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    changed_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    product: Mapped["Product"] = relationship(
        back_populates="pricing_history",
    )

    changed_by_user: Mapped["User"] = relationship(
        back_populates="price_changes",
    )
class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    module: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    product_name: Mapped[str | None] = mapped_column(
        String(180),
        nullable=True,
    )

    input_data: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    result_data: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )