from __future__ import annotations

import math
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor


DATA_PATH = Path("data/combined_olist_dataset.csv")
MODEL_PATH = Path("demand_forecast_bundle.pkl")

LAGS = [1, 7, 14, 28]
ROLLING_WINDOWS = [7, 28]

FEATURE_NAMES = [
    "category_encoded",
    "day_index",
    "day_of_week_sin",
    "day_of_week_cos",
    "month_sin",
    "month_cos",
    "lag_1",
    "lag_7",
    "lag_14",
    "lag_28",
    "rolling_mean_7",
    "rolling_mean_28",
]


def build_daily_demand(df: pd.DataFrame) -> pd.DataFrame:
    required_columns = {
        "order_purchase_timestamp",
        "product_category_name",
        "order_id",
    }

    missing = required_columns - set(df.columns)
    if missing:
        raise ValueError(f"Dataset is missing columns: {sorted(missing)}")

    clean = df.copy()

    clean["date"] = pd.to_datetime(
        clean["order_purchase_timestamp"],
        errors="coerce",
    ).dt.normalize()

    clean["category"] = (
        clean["product_category_name"]
        .fillna("Unknown")
        .astype(str)
    )

    clean = clean.dropna(subset=["date"])

    # Each order-item row is treated as one unit of observed demand.
    observed = (
        clean.groupby(["date", "category"])
        .size()
        .rename("demand")
        .reset_index()
    )

    all_dates = pd.date_range(
        observed["date"].min(),
        observed["date"].max(),
        freq="D",
    )

    all_categories = sorted(observed["category"].unique())

    complete_index = pd.MultiIndex.from_product(
        [all_dates, all_categories],
        names=["date", "category"],
    )

    daily = (
        observed.set_index(["date", "category"])
        .reindex(complete_index, fill_value=0)
        .reset_index()
    )

    daily["demand"] = daily["demand"].astype(float)

    return daily


def add_features(
    daily: pd.DataFrame,
    encoder: LabelEncoder,
) -> pd.DataFrame:
    featured = daily.sort_values(["category", "date"]).copy()

    featured["category_encoded"] = encoder.transform(
        featured["category"]
    )

    first_date = featured["date"].min()

    featured["day_index"] = (
        featured["date"] - first_date
    ).dt.days

    day_of_week = featured["date"].dt.dayofweek
    month = featured["date"].dt.month

    featured["day_of_week_sin"] = np.sin(
        2 * math.pi * day_of_week / 7
    )
    featured["day_of_week_cos"] = np.cos(
        2 * math.pi * day_of_week / 7
    )

    featured["month_sin"] = np.sin(
        2 * math.pi * month / 12
    )
    featured["month_cos"] = np.cos(
        2 * math.pi * month / 12
    )

    grouped = featured.groupby("category")["demand"]

    for lag in LAGS:
        featured[f"lag_{lag}"] = grouped.shift(lag)

    for window in ROLLING_WINDOWS:
        featured[f"rolling_mean_{window}"] = (
            grouped.shift(1)
            .rolling(window)
            .mean()
            .reset_index(level=0, drop=True)
        )

    return featured.dropna(subset=FEATURE_NAMES)


def calculate_wape(
    actual: np.ndarray,
    predicted: np.ndarray,
) -> float:
    denominator = np.abs(actual).sum()

    if denominator == 0:
        return 1.0

    return float(
        np.abs(actual - predicted).sum() / denominator
    )


def main() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"{DATA_PATH} does not exist. Run combine_dataset.py first."
        )

    raw_df = pd.read_csv(DATA_PATH)

    daily = build_daily_demand(raw_df)

    encoder = LabelEncoder()
    encoder.fit(daily["category"])

    featured = add_features(daily, encoder)

    # Hold out the final 60 days for time-aware validation.
    validation_start = featured["date"].max() - pd.Timedelta(days=59)

    train_df = featured[
        featured["date"] < validation_start
    ].copy()

    validation_df = featured[
        featured["date"] >= validation_start
    ].copy()

    X_train = train_df[FEATURE_NAMES]
    y_train = train_df["demand"]

    X_validation = validation_df[FEATURE_NAMES]
    y_validation = validation_df["demand"]

    model = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=500,
        learning_rate=0.04,
        max_depth=8,
        min_child_weight=3,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_alpha=0.05,
        reg_lambda=1.0,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    validation_predictions = np.clip(
        model.predict(X_validation),
        0,
        None,
    )

    mae = mean_absolute_error(
        y_validation,
        validation_predictions,
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_validation,
            validation_predictions,
        )
    )

    wape = calculate_wape(
        y_validation.to_numpy(),
        validation_predictions,
    )

    print("\n===== Demand Forecasting Validation =====")
    print("MAE :", round(mae, 4))
    print("RMSE:", round(rmse, 4))
    print("WAPE:", round(wape, 4))

    # Refit on every available training row.
    model.fit(
        featured[FEATURE_NAMES],
        featured["demand"],
    )

    history = {
        category: group[
            ["date", "demand"]
        ].sort_values("date")
        for category, group in daily.groupby("category")
    }

    bundle = {
        "model": model,
        "category_encoder": encoder,
        "feature_names": FEATURE_NAMES,
        "history": history,
        "first_date": daily["date"].min(),
        "last_date": daily["date"].max(),
        "metrics": {
            "mae": float(mae),
            "rmse": float(rmse),
            "wape": float(wape),
        },
    }

    joblib.dump(bundle, MODEL_PATH)

    print(f"\nSaved demand model to {MODEL_PATH}")
    print("Categories:", len(encoder.classes_))
    print("History range:", daily["date"].min(), "to", daily["date"].max())


if __name__ == "__main__":
    main()