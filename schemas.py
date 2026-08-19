from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal[
    "admin",
    "pricing_manager",
    "analyst",
]


class UserRegister(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120,
    )
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    role: UserRole = "analyst"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProductCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=180,
    )
    sku: str = Field(
        min_length=1,
        max_length=100,
    )
    category: str = Field(
        min_length=1,
        max_length=120,
    )
    current_price: float = Field(
        gt=0,
    )
    cost_price: float = Field(
        ge=0,
    )
    stock_quantity: int = Field(
        default=0,
        ge=0,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )


class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=180,
    )
    sku: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=120,
    )
    current_price: float | None = Field(
        default=None,
        gt=0,
    )
    cost_price: float | None = Field(
        default=None,
        ge=0,
    )
    stock_quantity: int | None = Field(
        default=None,
        ge=0,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )
    change_reason: str | None = Field(
        default=None,
        max_length=255,
    )


class ProductResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    name: str
    sku: str
    category: str
    current_price: float
    cost_price: float
    stock_quantity: int
    description: str | None
    created_by: int
    created_at: datetime
    updated_at: datetime


class PricingHistoryResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    product_id: int
    old_price: float
    new_price: float
    change_reason: str | None
    changed_by: int
    changed_at: datetime
class PredictionHistoryCreate(BaseModel):
    module: str = Field(
        min_length=2,
        max_length=50,
    )
    product_name: str | None = Field(
        default=None,
        max_length=180,
    )
    input_data: dict
    result_data: dict


class PredictionHistoryResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    user_id: int
    module: str
    product_name: str | None
    input_data: str
    result_data: str
    created_at: datetime