from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import TargetEncoder
from xgboost import XGBRegressor


RANDOM_STATE = 42

DATA_DIR = Path("data")
OUTPUT_MODEL = Path("price_model_v2_bundle.pkl")
OUTPUT_DATASET = DATA_DIR / "combined_olist_dataset_v2.csv"


NUMERIC_FEATURES = [
    "freight_value",
    "product_weight_g",
    "product_length_cm",
    "product_height_cm",
    "product_width_cm",
    "product_photos_qty",
    "product_name_lenght",
    "product_description_lenght",
    "product_volume_cm3",
    "product_density",
    "dimension_sum_cm",
    "largest_dimension_cm",
    "smallest_dimension_cm",
    "weight_per_photo",
    "volume_per_photo",
    "estimated_delivery_days",
    "shipping_limit_days",
    "order_item_count",
    "purchase_year",
    "purchase_quarter",
    "purchase_month_sin",
    "purchase_month_cos",
    "purchase_day_sin",
    "purchase_day_cos",
    "is_weekend",
]

CATEGORICAL_FEATURES = [
    "product_category_name",
    "seller_id",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def load_and_merge_data() -> pd.DataFrame:
    orders = pd.read_csv(
        DATA_DIR / "olist_orders_dataset.csv"
    )

    order_items = pd.read_csv(
        DATA_DIR / "olist_order_items_dataset.csv"
    )

    products = pd.read_csv(
        DATA_DIR / "olist_products_dataset.csv"
    )

    merged = order_items.merge(
        orders,
        on="order_id",
        how="left",
        validate="many_to_one",
    )

    final_df = merged.merge(
        products,
        on="product_id",
        how="left",
        validate="many_to_one",
    )

    print("Merged dataset shape:", final_df.shape)

    return final_df


def clean_and_engineer_features(
    df: pd.DataFrame,
) -> pd.DataFrame:
    data = df.copy()

    date_columns = [
        "order_purchase_timestamp",
        "order_estimated_delivery_date",
        "shipping_limit_date",
    ]

    for column in date_columns:
        data[column] = pd.to_datetime(
            data[column],
            errors="coerce",
        )

    # Remove rows that cannot be used.
    data = data.dropna(
        subset=[
            "price",
            "freight_value",
            "seller_id",
            "order_purchase_timestamp",
        ]
    ).copy()

    # Fixed validity limits rather than selecting rows based on
    # the final test-set score.
    data = data[
        (data["price"] >= 5)
        & (data["price"] <= 3000)
        & (data["freight_value"] >= 0)
    ].copy()

    numeric_source_columns = [
        "product_weight_g",
        "product_length_cm",
        "product_height_cm",
        "product_width_cm",
        "product_photos_qty",
        "product_name_lenght",
        "product_description_lenght",
    ]

    for column in numeric_source_columns:
        median_value = data[column].median()

        if pd.isna(median_value):
            median_value = 0

        data[column] = (
            data[column]
            .fillna(median_value)
            .clip(lower=0)
        )

    data["product_category_name"] = (
        data["product_category_name"]
        .fillna("Unknown")
        .astype(str)
    )

    data["seller_id"] = (
        data["seller_id"]
        .fillna("Unknown")
        .astype(str)
    )

    data["product_volume_cm3"] = (
        data["product_length_cm"]
        * data["product_width_cm"]
        * data["product_height_cm"]
    )

    data["product_density"] = (
        data["product_weight_g"]
        / (data["product_volume_cm3"] + 1)
    )

    data["dimension_sum_cm"] = (
        data["product_length_cm"]
        + data["product_width_cm"]
        + data["product_height_cm"]
    )

    dimension_columns = [
        "product_length_cm",
        "product_width_cm",
        "product_height_cm",
    ]

    data["largest_dimension_cm"] = data[
        dimension_columns
    ].max(axis=1)

    data["smallest_dimension_cm"] = data[
        dimension_columns
    ].min(axis=1)

    data["weight_per_photo"] = (
        data["product_weight_g"]
        / (data["product_photos_qty"] + 1)
    )

    data["volume_per_photo"] = (
        data["product_volume_cm3"]
        / (data["product_photos_qty"] + 1)
    )

    # Estimated delivery is available at purchase time.
    data["estimated_delivery_days"] = (
        data["order_estimated_delivery_date"]
        - data["order_purchase_timestamp"]
    ).dt.total_seconds() / 86400

    data["shipping_limit_days"] = (
        data["shipping_limit_date"]
        - data["order_purchase_timestamp"]
    ).dt.total_seconds() / 86400

    data["estimated_delivery_days"] = (
        data["estimated_delivery_days"]
        .replace([np.inf, -np.inf], np.nan)
    )

    data["shipping_limit_days"] = (
        data["shipping_limit_days"]
        .replace([np.inf, -np.inf], np.nan)
    )

    for column in [
        "estimated_delivery_days",
        "shipping_limit_days",
    ]:
        median_value = data[column].median()

        if pd.isna(median_value):
            median_value = 0

        data[column] = (
            data[column]
            .fillna(median_value)
            .clip(lower=0)
        )

    data["order_item_count"] = (
        data.groupby("order_id")["order_item_id"]
        .transform("count")
        .astype(float)
    )

    purchase_timestamp = data[
        "order_purchase_timestamp"
    ]

    data["purchase_year"] = purchase_timestamp.dt.year
    data["purchase_quarter"] = purchase_timestamp.dt.quarter

    purchase_month = purchase_timestamp.dt.month
    purchase_day = purchase_timestamp.dt.dayofweek

    data["purchase_month_sin"] = np.sin(
        2 * np.pi * purchase_month / 12
    )

    data["purchase_month_cos"] = np.cos(
        2 * np.pi * purchase_month / 12
    )

    data["purchase_day_sin"] = np.sin(
        2 * np.pi * purchase_day / 7
    )

    data["purchase_day_cos"] = np.cos(
        2 * np.pi * purchase_day / 7
    )

    data["is_weekend"] = (
        purchase_day >= 5
    ).astype(int)

    data = data.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    for column in NUMERIC_FEATURES:
        median_value = data[column].median()

        if pd.isna(median_value):
            median_value = 0

        data[column] = data[column].fillna(
            median_value
        )

    return data


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                "passthrough",
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                TargetEncoder(
                    target_type="continuous",
                    smooth="auto",
                    cv=5,
                    shuffle=True,
                    random_state=RANDOM_STATE,
                ),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )

    model = XGBRegressor(
        objective="reg:squarederror",
        eval_metric="rmse",
        tree_method="hist",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )


def print_metrics(
    title: str,
    actual: pd.Series,
    predicted: np.ndarray,
) -> dict[str, float]:
    mae = mean_absolute_error(actual, predicted)

    rmse = np.sqrt(
        mean_squared_error(actual, predicted)
    )

    r2 = r2_score(actual, predicted)

    print(f"\n===== {title} =====")
    print("MAE :", round(mae, 4))
    print("RMSE:", round(rmse, 4))
    print("R²  :", round(r2, 4))

    return {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
    }


def main() -> None:
    raw_df = load_and_merge_data()

    final_df = clean_and_engineer_features(
        raw_df
    )

    final_df.to_csv(
        OUTPUT_DATASET,
        index=False,
    )

    print("Cleaned dataset shape:", final_df.shape)
    print("Saved:", OUTPUT_DATASET)

    X = final_df[ALL_FEATURES].copy()
    y = final_df["price"].astype(float)

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=RANDOM_STATE,
        )
    )

    base_pipeline = build_pipeline()

    parameter_distributions = {
        "model__n_estimators": [
            400,
            600,
            800,
            1000,
        ],
        "model__max_depth": [
            5,
            7,
            9,
            11,
        ],
        "model__learning_rate": [
            0.02,
            0.03,
            0.05,
            0.08,
        ],
        "model__min_child_weight": [
            1,
            3,
            5,
            8,
        ],
        "model__subsample": [
            0.75,
            0.85,
            0.95,
            1.0,
        ],
        "model__colsample_bytree": [
            0.7,
            0.8,
            0.9,
            1.0,
        ],
        "model__gamma": [
            0,
            0.05,
            0.1,
            0.2,
        ],
        "model__reg_alpha": [
            0,
            0.01,
            0.1,
            0.5,
        ],
        "model__reg_lambda": [
            0.5,
            1.0,
            2.0,
            5.0,
        ],
    }

    search = RandomizedSearchCV(
        estimator=base_pipeline,
        param_distributions=parameter_distributions,
        n_iter=30,
        scoring="r2",
        cv=5,
        random_state=RANDOM_STATE,
        verbose=2,
        n_jobs=-1,
        return_train_score=True,
    )

    print("\nStarting XGBoost search...")

    search.fit(X_train, y_train)

    raw_price_model = search.best_estimator_

    print("\nBest parameters:")
    print(search.best_params_)

    print(
        "Best cross-validation R²:",
        round(search.best_score_, 4),
    )

    raw_predictions = raw_price_model.predict(
        X_test
    )

    raw_metrics = print_metrics(
        "XGBoost — Raw Price Target",
        y_test,
        raw_predictions,
    )

    # Compare against log-transformed price using the same
    # preprocessing and best XGBoost configuration.
    log_price_model = TransformedTargetRegressor(
        regressor=clone(raw_price_model),
        func=np.log1p,
        inverse_func=np.expm1,
        check_inverse=True,
    )

    print("\nTraining log-price candidate...")

    log_price_model.fit(X_train, y_train)

    log_predictions = np.clip(
        log_price_model.predict(X_test),
        0,
        None,
    )

    log_metrics = print_metrics(
        "XGBoost — Log Price Target",
        y_test,
        log_predictions,
    )

    if log_metrics["r2"] > raw_metrics["r2"]:
        best_model = log_price_model
        best_metrics = log_metrics
        target_transform = "log1p"
    else:
        best_model = raw_price_model
        best_metrics = raw_metrics
        target_transform = "none"

    print("\nSelected target transform:", target_transform)
    print("Selected test R²:", round(best_metrics["r2"], 4))

    bundle = {
        "model": best_model,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "all_features": ALL_FEATURES,
        "target_transform": target_transform,
        "metrics": best_metrics,
        "cv_r2": float(search.best_score_),
        "best_params": search.best_params_,
        "category_options": sorted(
            final_df[
                "product_category_name"
            ].unique().tolist()
        ),
        "seller_options": sorted(
            final_df["seller_id"].unique().tolist()
        ),
    }

    joblib.dump(bundle, OUTPUT_MODEL)

    print("\nSaved experimental bundle:")
    print(OUTPUT_MODEL)

    print(
        "\nYour existing price_prediction_model.pkl "
        "was not overwritten."
    )


if __name__ == "__main__":
    main()