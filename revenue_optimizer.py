from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass
class RevenueOptimizer:
    min_price_factor: float = 0.8
    max_price_factor: float = 1.2
    steps: int = 41

    def optimize(
        self,
        current_price: float,
        baseline_demand: float,
        elasticity: float = 1.3,
    ) -> dict[str, Any]:
        if current_price <= 0:
            raise ValueError("Current price must be greater than zero.")

        if baseline_demand < 0:
            raise ValueError("Baseline demand cannot be negative.")

        if elasticity <= 0:
            raise ValueError("Elasticity must be greater than zero.")

        price_candidates = np.linspace(
            current_price * self.min_price_factor,
            current_price * self.max_price_factor,
            self.steps,
        )

        simulation = []

        for price in price_candidates:
            relative_price = price / current_price

            predicted_demand = baseline_demand * (
                relative_price ** (-elasticity)
            )

            predicted_revenue = price * predicted_demand

            simulation.append(
                {
                    "price": round(float(price), 2),
                    "predicted_demand": round(
                        float(predicted_demand),
                        2,
                    ),
                    "predicted_revenue": round(
                        float(predicted_revenue),
                        2,
                    ),
                }
            )

        best_point = max(
            simulation,
            key=lambda item: item["predicted_revenue"],
        )

        baseline_revenue = current_price * baseline_demand
        optimized_revenue = best_point["predicted_revenue"]

        revenue_gain = optimized_revenue - baseline_revenue

        revenue_gain_percent = (
            (revenue_gain / baseline_revenue) * 100
            if baseline_revenue > 0
            else 0.0
        )

        recommended_price = best_point["price"]
        price_change = recommended_price - current_price

        if price_change > 0.01:
            recommendation = "increase"
        elif price_change < -0.01:
            recommendation = "decrease"
        else:
            recommendation = "keep"

        return {
            "current_price": round(float(current_price), 2),
            "baseline_demand": round(float(baseline_demand), 2),
            "baseline_revenue": round(float(baseline_revenue), 2),
            "recommended_price": round(
                float(recommended_price),
                2,
            ),
            "recommended_demand": round(
                float(best_point["predicted_demand"]),
                2,
            ),
            "optimized_revenue": round(
                float(optimized_revenue),
                2,
            ),
            "revenue_gain": round(float(revenue_gain), 2),
            "revenue_gain_percent": round(
                float(revenue_gain_percent),
                2,
            ),
            "price_change": round(float(price_change), 2),
            "recommendation": recommendation,
            "elasticity": round(float(elasticity), 2),
            "simulation": simulation,
        }