from __future__ import annotations

import math
from typing import Any

import joblib
import numpy as np
import pandas as pd


class DemandForecastService:
    def __init__(
        self,
        bundle_path: str = "demand_forecast_bundle.pkl",
    ) -> None:
        bundle = joblib.load(bundle_path)

        self.model = bundle["model"]
        self.category_encoder = bundle["category_encoder"]
        self.feature_names = bundle["feature_names"]
        self.history = bundle["history"]
        self.first_date = pd.Timestamp(bundle["first_date"])
        self.last_date = pd.Timestamp(bundle["last_date"])
        self.metrics = bundle["metrics"]

        self.categories = sorted(
            str(category)
            for category in self.category_encoder.classes_
        )

    def _make_feature_row(
        self,
        category: str,
        forecast_date: pd.Timestamp,
        demand_history: list[float],
    ) -> pd.DataFrame:
        category_encoded = int(
            self.category_encoder.transform([category])[0]
        )

        day_of_week = forecast_date.dayofweek
        month = forecast_date.month

        feature_row = {
            "category_encoded": category_encoded,
            "day_index": (
                forecast_date - self.first_date
            ).days,
            "day_of_week_sin": math.sin(
                2 * math.pi * day_of_week / 7
            ),
            "day_of_week_cos": math.cos(
                2 * math.pi * day_of_week / 7
            ),
            "month_sin": math.sin(
                2 * math.pi * month / 12
            ),
            "month_cos": math.cos(
                2 * math.pi * month / 12
            ),
            "lag_1": demand_history[-1],
            "lag_7": demand_history[-7],
            "lag_14": demand_history[-14],
            "lag_28": demand_history[-28],
            "rolling_mean_7": float(
                np.mean(demand_history[-7:])
            ),
            "rolling_mean_28": float(
                np.mean(demand_history[-28:])
            ),
        }

        return pd.DataFrame(
            [feature_row],
            columns=self.feature_names,
        )

    def _confidence_score(self, horizon: int) -> float:
        validation_wape = float(
            self.metrics.get("wape", 1.0)
        )

        base_accuracy = np.clip(
            1.0 - validation_wape,
            0.25,
            0.95,
        )

        # Confidence decreases as recursive forecasts extend farther.
        horizon_decay = math.exp(-horizon / 300)

        confidence = np.clip(
            base_accuracy * horizon_decay,
            0.15,
            0.95,
        )

        return round(float(confidence * 100), 1)

    @staticmethod
    def _classify_trend(
        recent_average: float,
        forecast_average: float,
    ) -> str:
        if recent_average <= 0:
            return "stable"

        percentage_change = (
            forecast_average - recent_average
        ) / recent_average

        if percentage_change > 0.05:
            return "increasing"

        if percentage_change < -0.05:
            return "decreasing"

        return "stable"

    def forecast(
        self,
        category: str,
        horizon: int,
    ) -> dict[str, Any]:
        if category not in self.categories:
            raise ValueError(
                f"Unknown category: {category}"
            )

        category_history = self.history[category].copy()

        category_history["date"] = pd.to_datetime(
            category_history["date"]
        )

        category_history = category_history.sort_values("date")

        demand_history = (
            category_history["demand"]
            .astype(float)
            .tolist()
        )

        if len(demand_history) < 28:
            raise ValueError(
                "Not enough historical observations for this category."
            )

        forecast_rows: list[dict[str, Any]] = []

        for day_number in range(1, horizon + 1):
            forecast_date = self.last_date + pd.Timedelta(
                days=day_number
            )

            X_future = self._make_feature_row(
                category=category,
                forecast_date=forecast_date,
                demand_history=demand_history,
            )

            predicted_demand = float(
                self.model.predict(X_future)[0]
            )

            predicted_demand = max(predicted_demand, 0.0)

            demand_history.append(predicted_demand)

            forecast_rows.append(
                {
                    "date": forecast_date.strftime("%Y-%m-%d"),
                    "predicted_demand": round(
                        predicted_demand,
                        2,
                    ),
                }
            )

        recent_average = float(
            category_history["demand"]
            .tail(28)
            .mean()
        )

        forecast_values = [
            row["predicted_demand"]
            for row in forecast_rows
        ]

        forecast_average = float(
            np.mean(forecast_values)
        )

        total_demand = float(
            np.sum(forecast_values)
        )

        trend = self._classify_trend(
            recent_average=recent_average,
            forecast_average=forecast_average,
        )

        return {
            "category": category,
            "horizon_days": horizon,
            "forecast_start": forecast_rows[0]["date"],
            "forecast_end": forecast_rows[-1]["date"],
            "total_predicted_demand": round(total_demand, 2),
            "average_daily_demand": round(forecast_average, 2),
            "recent_daily_average": round(recent_average, 2),
            "trend": trend,
            "confidence_score": self._confidence_score(horizon),
            "validation_metrics": {
                key: round(float(value), 4)
                for key, value in self.metrics.items()
            },
            "daily_forecast": forecast_rows,
        }