from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.preprocessing import LabelEncoder

app = FastAPI(
    title="PricePilot AI API",
    description="API for predicting product prices using a trained XGBoost model",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
model = joblib.load("price_prediction_model.pkl")
products_df = pd.read_csv("data/olist_products_dataset.csv")

category_names = (
    products_df["product_category_name"]
    .fillna("Unknown")
    .astype(str)
)

category_encoder = LabelEncoder()
category_encoder.fit(category_names)

category_options = [
    {
        "name": category,
        "encoded_value": int(category_encoder.transform([category])[0])
    }
    for category in category_encoder.classes_
]

class PriceInput(BaseModel):
    freight_value: float
    product_weight_g: float
    product_length_cm: float
    product_height_cm: float
    product_width_cm: float
    product_photos_qty: float
    product_category_encoded: int
    purchase_month: int
    purchase_dayofweek: int
    delivery_days: float
    seller_encoded: int


@app.get("/")
def home():
    return {
        "message": "PricePilot AI API is running!",
        "model": "XGBoost",
        "status": "Loaded successfully"
    }
@app.get("/metadata")
def get_metadata():
    return {
        "categories": category_options,
        "months": [
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December"
        ],
        "weekdays": [
            "Monday", "Tuesday", "Wednesday",
            "Thursday", "Friday", "Saturday", "Sunday"
        ]
    }


@app.post("/predict-price")
def predict_price(data: PriceInput):

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
        data.seller_encoded
    ]]

    prediction = model.predict(input_data)

    return {
        "predicted_price": round(float(prediction[0]), 2),
        "product_volume_cm3": round(product_volume_cm3, 2),
        "product_density": round(product_density, 4)
    }