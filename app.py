import os

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.preprocessing import LabelEncoder

import models
from competitor_analysis import CompetitorAnalysis
from database import Base, engine
from demand_forecasting import DemandForecastService
from revenue_optimizer import RevenueOptimizer
from routes_auth import router as auth_router
from routes_products import router as products_router
from routes_history import router as history_router

# ---------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------

app = FastAPI(
    title="PricePilot AI API",
    description=(
        "API for authentication, product management, price prediction, "
        "demand forecasting, revenue optimization, and competitor analysis."
    ),
    version="1.3.0",
)


# ---------------------------------------------------------
# Database setup
# ---------------------------------------------------------

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# Routers
# ---------------------------------------------------------

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(history_router)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

cors_origins = os.getenv(
    "CORS_ORIGINS",
    (
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://localhost:5175,"
        "http://localhost:5176"
    ),
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in cors_origins
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# File paths
# ---------------------------------------------------------

PRICE_MODEL_PATH = os.getenv(
    "PRICE_MODEL_PATH",
    "price_prediction_model.pkl",
)

DEMAND_MODEL_PATH = os.getenv(
    "DEMAND_MODEL_PATH",
    "demand_forecast_bundle.pkl",
)

PRODUCTS_DATA_PATH = os.getenv(
    "PRODUCTS_DATA_PATH",
    "data/olist_products_dataset.csv",
)


# ---------------------------------------------------------
# Load models and services
# ---------------------------------------------------------

price_model = joblib.load(PRICE_MODEL_PATH)

demand_service = DemandForecastService(
    DEMAND_MODEL_PATH
)

revenue_optimizer = RevenueOptimizer()

competitor_service = CompetitorAnalysis()


# ---------------------------------------------------------
# Product metadata
# ---------------------------------------------------------

products_df = pd.read_csv(PRODUCTS_DATA_PATH)

category_names = (
    products_df["product_category_name"]
    .fillna("Unknown")
    .astype(str)
)

category_encoder = LabelEncoder()
category_encoder.fit(category_names)


CATEGORY_TRANSLATIONS = {
    "Unknown": "Other",
    "agro_industria_e_comercio": "Agriculture & Industry",
    "alimentos": "Food",
    "alimentos_bebidas": "Food & Beverages",
    "artes": "Art",
    "artes_e_artesanato": "Arts & Crafts",
    "artigos_de_festas": "Party Supplies",
    "artigos_de_natal": "Christmas Supplies",
    "audio": "Audio Equipment",
    "automotivo": "Automotive",
    "bebes": "Baby Products",
    "bebidas": "Beverages",
    "beleza_saude": "Beauty & Health",
    "brinquedos": "Toys",
    "cama_mesa_banho": "Bed, Bath & Table",
    "casa_conforto": "Home Comfort",
    "casa_conforto_2": "Home Comfort 2",
    "casa_construcao": "Home Construction",
    "cds_dvds_musicais": "Music CDs & DVDs",
    "cine_foto": "Cameras & Photography",
    "climatizacao": "Climate Control",
    "consoles_games": "Gaming Consoles",
    "construcao_ferramentas_construcao": (
        "Construction Tools"
    ),
    "construcao_ferramentas_ferramentas": (
        "General Tools"
    ),
    "construcao_ferramentas_iluminacao": (
        "Lighting Tools"
    ),
    "construcao_ferramentas_jardim": (
        "Garden Construction Tools"
    ),
    "construcao_ferramentas_seguranca": (
        "Safety Tools"
    ),
    "cool_stuff": "Cool Stuff",
    "dvds_blu_ray": "DVDs & Blu-ray",
    "eletrodomesticos": "Home Appliances",
    "eletrodomesticos_2": "Home Appliances 2",
    "eletronicos": "Electronics",
    "eletroportateis": "Portable Appliances",
    "esporte_lazer": "Sports & Leisure",
    "fashion_bolsas_e_acessorios": (
        "Fashion Bags & Accessories"
    ),
    "fashion_calcados": "Footwear",
    "fashion_esporte": "Sports Fashion",
    "fashion_roupa_feminina": "Women's Clothing",
    "fashion_roupa_infanto_juvenil": (
        "Kids' Clothing"
    ),
    "fashion_roupa_masculina": "Men's Clothing",
    "fashion_underwear_e_moda_praia": (
        "Underwear & Beachwear"
    ),
    "ferramentas_jardim": "Garden Tools",
    "flores": "Flowers",
    "fraldas_higiene": "Diapers & Hygiene",
    "industria_comercio_e_negocios": (
        "Industry & Business"
    ),
    "informatica_acessorios": (
        "Computer Accessories"
    ),
    "instrumentos_musicais": (
        "Musical Instruments"
    ),
    "la_cuisine": "Kitchenware",
    "livros_importados": "Imported Books",
    "livros_interesse_geral": "General Books",
    "livros_tecnicos": "Technical Books",
    "malas_acessorios": "Luggage & Accessories",
    "market_place": "Marketplace",
    "moveis_colchao_e_estofado": (
        "Mattresses & Upholstery"
    ),
    "moveis_cozinha_area_de_servico_jantar_e_jardim": (
        "Kitchen, Dining & Garden Furniture"
    ),
    "moveis_decoracao": "Furniture & Decor",
    "moveis_escritorio": "Office Furniture",
    "moveis_quarto": "Bedroom Furniture",
    "moveis_sala": "Living Room Furniture",
    "musica": "Music",
    "papelaria": "Stationery",
    "pc_gamer": "Gaming PCs",
    "pcs": "Computers",
    "perfumaria": "Perfume & Cosmetics",
    "pet_shop": "Pet Supplies",
    "portateis_casa_forno_e_cafe": (
        "Portable Home, Oven & Coffee"
    ),
    "portateis_cozinha_e_preparadores_de_alimentos": (
        "Portable Kitchen Appliances"
    ),
    "relogios_presentes": "Watches & Gifts",
    "seguros_e_servicos": "Insurance & Services",
    "sinalizacao_e_seguranca": (
        "Signage & Security"
    ),
    "tablets_impressao_imagem": (
        "Tablets, Printing & Imaging"
    ),
    "telefonia": "Mobile Phones",
    "telefonia_fixa": "Landline Phones",
    "utilidades_domesticas": "Home Essentials",
}


category_options = [
    {
        "name": CATEGORY_TRANSLATIONS.get(
            category,
            category.replace("_", " ").title(),
        ),
        "value": category,
        "encoded_value": int(
            category_encoder.transform([category])[0]
        ),
    }
    for category in category_encoder.classes_
]


# ---------------------------------------------------------
# Request schemas
# ---------------------------------------------------------

class PriceInput(BaseModel):
    freight_value: float = Field(ge=0)
    product_weight_g: float = Field(gt=0)
    product_length_cm: float = Field(gt=0)
    product_height_cm: float = Field(gt=0)
    product_width_cm: float = Field(gt=0)
    product_photos_qty: float = Field(ge=0)
    product_category_encoded: int = Field(ge=0)
    purchase_month: int = Field(ge=1, le=12)
    purchase_dayofweek: int = Field(ge=0, le=6)
    delivery_days: float = Field(ge=0)
    seller_encoded: int = Field(ge=0)


class DemandForecastInput(BaseModel):
    category: str
    horizon_days: int = Field(
        default=30,
        ge=7,
        le=365,
    )


class RevenueOptimizationInput(BaseModel):
    current_price: float = Field(gt=0)
    baseline_demand: float = Field(gt=0)
    elasticity: float = Field(
        default=1.3,
        gt=0,
    )


class CompetitorAnalysisInput(BaseModel):
    our_price: float = Field(gt=0)


# ---------------------------------------------------------
# General routes
# ---------------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "PricePilot AI API is running!",
        "version": "1.3.0",
        "database": "Available",
        "authentication": "Available",
        "product_management": "Available",
        "price_prediction": "Available",
        "demand_forecasting": "Available",
        "revenue_optimization": "Available",
        "competitor_analysis": "Available",
        "status": "Loaded successfully",
    }


@app.get("/metadata")
def get_metadata():
    return {
        "categories": category_options,
        "months": [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ],
        "weekdays": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ],
    }


# ---------------------------------------------------------
# Demand forecasting routes
# ---------------------------------------------------------

@app.get("/demand/categories")
def get_demand_categories():
    categories = [
        {
            "value": category,
            "label": CATEGORY_TRANSLATIONS.get(
                category,
                category.replace("_", " ").title(),
            ),
        }
        for category in demand_service.categories
        if category != "Unknown"
    ]

    return {
        "categories": categories,
        "supported_horizons": [
            7,
            30,
            90,
            365,
        ],
    }


@app.post("/forecast-demand")
def forecast_demand(
    data: DemandForecastInput,
):
    try:
        return demand_service.forecast(
            category=data.category,
            horizon=data.horizon_days,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


# ---------------------------------------------------------
# Revenue optimization route
# ---------------------------------------------------------

@app.post("/optimize-revenue")
def optimize_revenue(
    data: RevenueOptimizationInput,
):
    try:
        return revenue_optimizer.optimize(
            current_price=data.current_price,
            baseline_demand=data.baseline_demand,
            elasticity=data.elasticity,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


# ---------------------------------------------------------
# Competitor analysis route
# ---------------------------------------------------------

@app.post("/competitor-analysis")
def analyze_competitors(
    data: CompetitorAnalysisInput,
):
    try:
        return competitor_service.analyze(
            our_price=data.our_price,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


# ---------------------------------------------------------
# Price prediction route
# ---------------------------------------------------------

@app.post("/predict-price")
def predict_price(
    data: PriceInput,
):
    product_volume_cm3 = (
        data.product_length_cm
        * data.product_width_cm
        * data.product_height_cm
    )

    product_density = (
        data.product_weight_g
        / (product_volume_cm3 + 1)
    )

    input_data = [[
        data.freight_value,
        data.product_weight_g,
        data.product_length_cm,
        data.product_height_cm,
        data.product_width_cm,
        data.product_photos_qty,
        product_volume_cm3,
        product_density,
        data.product_category_encoded,
        data.purchase_month,
        data.purchase_dayofweek,
        data.delivery_days,
        data.seller_encoded,
    ]]

    try:
        prediction = price_model.predict(
            input_data
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Price prediction failed: "
                f"{str(error)}"
            ),
        ) from error

    return {
        "predicted_price": round(
            float(prediction[0]),
            2,
        ),
        "product_volume_cm3": round(
            product_volume_cm3,
            2,
        ),
        "product_density": round(
            product_density,
            4,
        ),
    }