from typing import Dict
import random

class CompetitorAnalysis:

    def analyze(self, our_price: float) -> Dict:
        random.seed(42)

        competitors = {
            "Amazon": round(our_price * random.uniform(0.97, 1.04), 2),
            "Flipkart": round(our_price * random.uniform(0.95, 1.02), 2),
            "Walmart": round(our_price * random.uniform(0.98, 1.05), 2),
            "eBay": round(our_price * random.uniform(0.96, 1.06), 2),
        }

        average_price = round(
            sum(competitors.values()) / len(competitors),
            2,
        )

        difference = round(
            our_price - average_price,
            2,
        )

        difference_percent = round(
            difference / average_price * 100,
            2,
        )

        if difference_percent < -5:
            position = "Budget"

        elif difference_percent > 5:
            position = "Premium"

        else:
            position = "Competitive"

        opportunity = max(
            0,
            min(
                100,
                round(
                    100 - abs(difference_percent) * 8,
                    1,
                ),
            ),
        )

        if position == "Budget":
            recommendation = "Increase price"

        elif position == "Premium":
            recommendation = "Decrease price"

        else:
            recommendation = "Maintain current price"

        return {
            "our_price": round(our_price, 2),
            "market_average": average_price,
            "difference": difference,
            "difference_percent": difference_percent,
            "market_position": position,
            "opportunity_score": opportunity,
            "recommendation": recommendation,
            "competitors": competitors,
        }