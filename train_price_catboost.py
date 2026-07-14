from __future__ import annotations

import itertools
import random
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor, Pool, cv
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split


RANDOM_STATE = 42

DATA_PATH = Path("data/combined_olist_dataset_v2.csv")
OUTPUT_MODEL = Path("price_catboost_bundle.pkl")
FEATURE_IMPORTANCE_PATH = Path(
    "data/catboost_feature_importance.csv"
)

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


def load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"{DATA_PATH} was not found. Run "
            "train_price_model_v2.py first."
        )

    data = pd.read_csv(DATA_PATH)

    missing_columns = [
        column
        for column in ALL_FEATURES + ["price"]
        if column not in data.columns
    ]

    if missing_columns:
        raise ValueError(
            "Required columns are missing: "
            + ", ".join(missing_columns)
        )

    for column in CATEGORICAL_FEATURES:
        data[column] = (
            data[column]
            .fillna("Unknown")
            .astype(str)
        )

    for column in NUMERIC_FEATURES:
        data[column] = pd.to_numeric(
            data[column],
            errors="coerce",
        )

        median_value = data[column].median()

        if pd.isna(median_value):
            median_value = 0.0

        data[column] = (
            data[column]
            .replace([np.inf, -np.inf], np.nan)
            .fillna(median_value)
        )

    data["price"] = pd.to_numeric(
        data["price"],
        errors="coerce",
    )

    data = data.dropna(subset=["price"]).copy()

    data = data[
        (data["price"] >= 5)
        & (data["price"] <= 3000)
    ].copy()

    print("Loaded dataset:", data.shape)

    return data


def calculate_metrics(
    y_true: pd.Series,
    predictions: np.ndarray,
) -> dict[str, float]:
    mae = mean_absolute_error(
        y_true,
        predictions,
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_true,
            predictions,
        )
    )

    r2 = r2_score(
        y_true,
        predictions,
    )

    return {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
    }


def print_metrics(
    title: str,
    metrics: dict[str, float],
) -> None:
    print(f"\n===== {title} =====")
    print("MAE :", round(metrics["mae"], 4))
    print("RMSE:", round(metrics["rmse"], 4))
    print("R²  :", round(metrics["r2"], 4))


def build_parameter_candidates() -> list[dict[str, Any]]:
    parameter_space = {
        "depth": [6, 7, 8, 9, 10],
        "learning_rate": [
            0.025,
            0.035,
            0.05,
            0.07,
        ],
        "l2_leaf_reg": [
            3,
            5,
            7,
            10,
            15,
        ],
        "random_strength": [
            0.2,
            0.5,
            1.0,
            2.0,
        ],
        "bagging_temperature": [
            0.0,
            0.5,
            1.0,
            2.0,
        ],
        "border_count": [
            64,
            128,
            254,
        ],
    }

    combinations = list(
        itertools.product(
            parameter_space["depth"],
            parameter_space["learning_rate"],
            parameter_space["l2_leaf_reg"],
            parameter_space["random_strength"],
            parameter_space["bagging_temperature"],
            parameter_space["border_count"],
        )
    )

    random_generator = random.Random(
        RANDOM_STATE
    )

    sampled = random_generator.sample(
        combinations,
        k=12,
    )

    candidates = []

    for (
        depth,
        learning_rate,
        l2_leaf_reg,
        random_strength,
        bagging_temperature,
        border_count,
    ) in sampled:
        candidates.append(
            {
                "depth": depth,
                "learning_rate": learning_rate,
                "l2_leaf_reg": l2_leaf_reg,
                "random_strength": random_strength,
                "bagging_temperature": (
                    bagging_temperature
                ),
                "border_count": border_count,
            }
        )

    return candidates


def evaluate_candidate(
    train_pool: Pool,
    candidate_number: int,
    parameters: dict[str, Any],
) -> dict[str, Any]:
    print(
        f"\nTesting candidate "
        f"{candidate_number}:"
    )

    print(parameters)

    cv_parameters = {
        "loss_function": "RMSE",
        "eval_metric": "R2",
        "iterations": 1200,
        "random_seed": RANDOM_STATE,
        "verbose": False,
        "allow_writing_files": False,
        "thread_count": 8,
        **parameters,
    }

    cv_results = cv(
        pool=train_pool,
        params=cv_parameters,
        fold_count=5,
        shuffle=True,
        partition_random_seed=RANDOM_STATE,
        stratified=False,
        early_stopping_rounds=80,
        verbose=False,
    )

    r2_column = "test-R2-mean"

    if r2_column not in cv_results.columns:
        raise RuntimeError(
            f"{r2_column} was not returned by "
            "CatBoost CV."
        )

    best_row_index = int(
        cv_results[r2_column].idxmax()
    )

    best_cv_r2 = float(
        cv_results.loc[
            best_row_index,
            r2_column,
        ]
    )

    best_iteration = best_row_index + 1

    result = {
        "parameters": parameters,
        "cv_r2": best_cv_r2,
        "best_iteration": best_iteration,
    }

    print(
        "Candidate CV R²:",
        round(best_cv_r2, 4),
    )

    print(
        "Best iteration:",
        best_iteration,
    )

    return result


def train_raw_target_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    best_candidate: dict[str, Any],
) -> tuple[
    CatBoostRegressor,
    dict[str, float],
]:
    model = CatBoostRegressor(
        loss_function="RMSE",
        eval_metric="R2",
        iterations=best_candidate[
            "best_iteration"
        ],
        random_seed=RANDOM_STATE,
        allow_writing_files=False,
        thread_count=-1,
        verbose=100,
        **best_candidate["parameters"],
    )

    model.fit(
        X_train,
        y_train,
        cat_features=CATEGORICAL_FEATURES,
        eval_set=(X_test, y_test),
        use_best_model=False,
        verbose=100,
    )

    predictions = np.clip(
        model.predict(X_test),
        0,
        None,
    )

    metrics = calculate_metrics(
        y_test,
        predictions,
    )

    return model, metrics


def train_log_target_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    best_candidate: dict[str, Any],
) -> tuple[
    CatBoostRegressor,
    dict[str, float],
]:
    model = CatBoostRegressor(
        loss_function="RMSE",
        iterations=best_candidate[
            "best_iteration"
        ],
        random_seed=RANDOM_STATE,
        allow_writing_files=False,
        thread_count=-1,
        verbose=100,
        **best_candidate["parameters"],
    )

    model.fit(
        X_train,
        np.log1p(y_train),
        cat_features=CATEGORICAL_FEATURES,
        eval_set=(
            X_test,
            np.log1p(y_test),
        ),
        use_best_model=False,
        verbose=100,
    )

    log_predictions = model.predict(
        X_test
    )

    predictions = np.clip(
        np.expm1(log_predictions),
        0,
        None,
    )

    metrics = calculate_metrics(
        y_test,
        predictions,
    )

    return model, metrics


def save_feature_importance(
    model: CatBoostRegressor,
) -> None:
    feature_importance = pd.DataFrame(
        {
            "feature": ALL_FEATURES,
            "importance": (
                model.get_feature_importance()
            ),
        }
    ).sort_values(
        "importance",
        ascending=False,
    )

    feature_importance.to_csv(
        FEATURE_IMPORTANCE_PATH,
        index=False,
    )

    print("\nTop 15 CatBoost features:")
    print(
        feature_importance.head(15).to_string(
            index=False
        )
    )

    print(
        "\nSaved feature importance:",
        FEATURE_IMPORTANCE_PATH,
    )


def main() -> None:
    data = load_data()

    X = data[ALL_FEATURES].copy()
    y = data["price"].astype(float)

    (
        X_train,
        X_test,
        y_train,
        y_test,
    ) = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
    )

    print("Training rows:", len(X_train))
    print("Testing rows :", len(X_test))

    train_pool = Pool(
        data=X_train,
        label=y_train,
        cat_features=CATEGORICAL_FEATURES,
    )

    candidates = (
        build_parameter_candidates()
    )

    candidate_results = []

    print(
        "\nStarting CatBoost parameter search..."
    )

    print(
        f"Testing {len(candidates)} "
        "parameter candidates with 5-fold CV."
    )

    for index, parameters in enumerate(
        candidates,
        start=1,
    ):
        result = evaluate_candidate(
            train_pool=train_pool,
            candidate_number=index,
            parameters=parameters,
        )

        candidate_results.append(result)

    candidate_results.sort(
        key=lambda item: item["cv_r2"],
        reverse=True,
    )

    best_candidate = candidate_results[0]

    print("\n==============================")
    print("BEST CATBOOST CV RESULT")
    print("==============================")

    print(
        "Best cross-validation R²:",
        round(
            best_candidate["cv_r2"],
            4,
        ),
    )

    print(
        "Best iteration:",
        best_candidate[
            "best_iteration"
        ],
    )

    print("Best parameters:")
    print(
        best_candidate["parameters"]
    )

    print(
        "\nTraining raw-price CatBoost..."
    )

    (
        raw_model,
        raw_metrics,
    ) = train_raw_target_model(
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        best_candidate=best_candidate,
    )

    print_metrics(
        "CatBoost — Raw Price Target",
        raw_metrics,
    )

    print(
        "\nTraining log-price CatBoost..."
    )

    (
        log_model,
        log_metrics,
    ) = train_log_target_model(
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        best_candidate=best_candidate,
    )

    print_metrics(
        "CatBoost — Log Price Target",
        log_metrics,
    )

    if raw_metrics["r2"] >= log_metrics["r2"]:
        selected_model = raw_model
        selected_metrics = raw_metrics
        target_transform = "none"
    else:
        selected_model = log_model
        selected_metrics = log_metrics
        target_transform = "log1p"

    save_feature_importance(
        selected_model
    )

    bundle = {
        "model": selected_model,
        "model_type": "CatBoostRegressor",
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": (
            CATEGORICAL_FEATURES
        ),
        "all_features": ALL_FEATURES,
        "target_transform": target_transform,
        "metrics": selected_metrics,
        "cv_r2": best_candidate["cv_r2"],
        "best_iteration": best_candidate[
            "best_iteration"
        ],
        "best_params": best_candidate[
            "parameters"
        ],
        "category_options": sorted(
            data[
                "product_category_name"
            ].unique().tolist()
        ),
        "seller_options": sorted(
            data[
                "seller_id"
            ].unique().tolist()
        ),
    }

    joblib.dump(
        bundle,
        OUTPUT_MODEL,
    )

    print("\n==============================")
    print("FINAL CATBOOST RESULT")
    print("==============================")

    print(
        "Selected target transform:",
        target_transform,
    )

    print(
        "Selected test R²:",
        round(
            selected_metrics["r2"],
            4,
        ),
    )

    print(
        "Selected test MAE:",
        round(
            selected_metrics["mae"],
            4,
        ),
    )

    print(
        "Selected test RMSE:",
        round(
            selected_metrics["rmse"],
            4,
        ),
    )

    print(
        "Cross-validation R²:",
        round(
            best_candidate["cv_r2"],
            4,
        ),
    )

    print(
        "\nSaved CatBoost bundle:",
        OUTPUT_MODEL,
    )

    print(
        "\nYour XGBoost model files "
        "were not overwritten."
    )


if __name__ == "__main__":
    main()