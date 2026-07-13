import json
import pandas as pd

DATA_PATH = "data/combined_olist_dataset.csv"
OUTPUT_PATH = "frontend/public/analytics.json"

df = pd.read_csv(DATA_PATH)

df["order_purchase_timestamp"] = pd.to_datetime(
    df["order_purchase_timestamp"],
    errors="coerce",
)

df["purchase_month"] = df["order_purchase_timestamp"].dt.month

price_distribution = (
    pd.cut(
        df["price"],
        bins=[0, 50, 100, 200, 500, float("inf")],
        labels=["0–50", "51–100", "101–200", "201–500", "500+"],
    )
    .value_counts()
    .sort_index()
)

top_categories = (
    df["product_category_name"]
    .fillna("Unknown")
    .value_counts()
    .head(8)
)

monthly_orders = (
    df.dropna(subset=["purchase_month"])
    .groupby("purchase_month")["order_id"]
    .nunique()
    .reindex(range(1, 13), fill_value=0)
)

delivery_days = (
    pd.to_datetime(
        df["order_delivered_customer_date"],
        errors="coerce",
    )
    - pd.to_datetime(
        df["order_purchase_timestamp"],
        errors="coerce",
    )
).dt.days

delivery_distribution = (
    pd.cut(
        delivery_days,
        bins=[-1, 5, 10, 15, 20, float("inf")],
        labels=["0–5", "6–10", "11–15", "16–20", "20+"],
    )
    .value_counts()
    .sort_index()
)

analytics = {
    "summary": {
        "average_price": round(float(df["price"].mean()), 2),
        "median_price": round(float(df["price"].median()), 2),
        "total_orders": int(df["order_id"].nunique()),
        "total_products": int(df["product_id"].nunique()),
    },
    "price_distribution": [
        {"range": str(index), "count": int(value)}
        for index, value in price_distribution.items()
    ],
    "top_categories": [
        {"category": str(index), "count": int(value)}
        for index, value in top_categories.items()
    ],
    "monthly_orders": [
        {"month": int(index), "orders": int(value)}
        for index, value in monthly_orders.items()
    ],
    "delivery_distribution": [
        {"range": str(index), "count": int(value)}
        for index, value in delivery_distribution.items()
    ],
}

with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
    json.dump(analytics, file, indent=2)

print(f"Analytics saved to {OUTPUT_PATH}")