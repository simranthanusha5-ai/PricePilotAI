import { useState } from "react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../components/Dashboard.css";
<h1 style={{ color: "red", fontSize: "70px" }}>
  TEST PAGE
</h1>
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const CHART_COLORS = [
  "#00E5FF",
  "#4F8CFF",
  "#8B5CF6",
  "#34D399",
  "#F59E0B",
];

function CompetitorAnalysis() {
  const [price, setPrice] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Enter a valid product price greater than zero.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/competitor-analysis`,
        {
          our_price: numericPrice,
        }
      );

      setResult(response.data);
    } catch (requestError) {
      console.error(
        "Competitor analysis failed:",
        requestError
      );

      setError(
        requestError.response?.data?.detail ||
          requestError.message ||
          "Analysis failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? [
        {
          company: "Our Price",
          price: Number(result.our_price),
        },
        ...Object.entries(result.competitors).map(
          ([company, value]) => ({
            company,
            price: Number(value),
          })
        ),
      ]
    : [];

  const differencePercent = result
    ? Number(result.difference_percent)
    : 0;

  const differenceDirection =
    differencePercent > 0
      ? "above"
      : differencePercent < 0
        ? "below"
        : "equal to";

  const positionClass = result
    ? result.market_position.toLowerCase()
    : "";

  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div>
          <span className="eyebrow">
            Market intelligence
          </span>

          <h1>Competitor Analysis FIXED</h1>

          <p>
            Compare your product price with simulated competitor
            prices and identify your market position.
          </p>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <h2>Analyze market position</h2>

            <p>
              Enter your product price to generate a simulated
              competitor comparison.
            </p>
          </div>
        </div>

        <div className="input-grid">
          <label className="input-field">
            <span>Your product price</span>

            <div className="input-control">
              <span>₹</span>

              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter product price"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    analyze();
                  }
                }}
              />
            </div>
          </label>
        </div>

        <button
          className="primary-action"
          type="button"
          onClick={analyze}
          disabled={loading}
        >
          {loading
            ? "Analyzing..."
            : "Analyze competitors"}
        </button>

        {error && (
          <div className="forecast-error">
            {error}
          </div>
        )}
      </section>

      {result && (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <span>Our Price</span>

              <strong>
                ₹{Number(result.our_price).toFixed(2)}
              </strong>

              <small>Current selling price</small>
            </article>

            <article className="stat-card">
              <span>Market Average</span>

              <strong>
                ₹{Number(result.market_average).toFixed(2)}
              </strong>

              <small>Simulated competitor average</small>
            </article>

            <article className="stat-card">
              <span>Market Position</span>

              <strong>
                {result.market_position}
              </strong>

              <small>
                {Math.abs(differencePercent).toFixed(2)}%{" "}
                {differenceDirection} market
              </small>
            </article>

            <article className="stat-card">
              <span>Opportunity Score</span>

              <strong>
                {Number(result.opportunity_score).toFixed(1)}%
              </strong>

              <small>Pricing competitiveness score</small>
            </article>
          </section>

          <section className="dashboard-card competitor-recommendation-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  AI recommendation
                </span>

                <h2>{result.recommendation}</h2>

                <p>
                  Your price is{" "}
                  {Math.abs(differencePercent).toFixed(2)}%{" "}
                  {differenceDirection} the simulated market
                  average.
                </p>
              </div>

              <div
                className={`market-position-badge ${positionClass}`}
              >
                {result.market_position}
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  Simulated data
                </span>

                <h2>Competitor prices</h2>

                <p>
                  These values are generated for demonstration
                  and are not live marketplace prices.
                </p>
              </div>
            </div>

            <div className="stats-grid">
              {Object.entries(
                result.competitors
              ).map(([company, value]) => (
                <article
                  className="stat-card"
                  key={company}
                >
                  <span>{company}</span>

                  <strong>
                    ₹{Number(value).toFixed(2)}
                  </strong>

                  <small>
                    {Number(value) > Number(result.our_price)
                      ? `${(
                          ((Number(value) -
                            Number(result.our_price)) /
                            Number(result.our_price)) *
                          100
                        ).toFixed(2)}% higher`
                      : Number(value) <
                          Number(result.our_price)
                        ? `${(
                            ((Number(result.our_price) -
                              Number(value)) /
                              Number(result.our_price)) *
                            100
                          ).toFixed(2)}% lower`
                        : "Same price"}
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-card competitor-chart-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  Price comparison
                </span>

                <h2>Market price overview</h2>

                <p>
                  Compare your selling price against the
                  simulated competitor prices.
                </p>
              </div>
            </div>

            <div className="competitor-chart-wrapper">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={chartData}
                  margin={{
                    top: 42,
                    right: 24,
                    left: 8,
                    bottom: 18,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.18)"
                  />

                  <XAxis
                    dataKey="company"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#93a4c3",
                      fontSize: 13,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[
                      (dataMin) =>
                        Math.max(
                          0,
                          Math.floor(dataMin - 10)
                        ),
                      (dataMax) =>
                        Math.ceil(dataMax + 10),
                    ]}
                    tick={{
                      fill: "#93a4c3",
                      fontSize: 13,
                    }}
                    tickFormatter={(value) =>
                      `₹${Number(value).toFixed(0)}`
                    }
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(99, 102, 241, 0.08)",
                    }}
                    contentStyle={{
                      background: "#111827",
                      border:
                        "1px solid rgba(99, 102, 241, 0.35)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      boxShadow:
                        "0 16px 40px rgba(0, 0, 0, 0.35)",
                    }}
                    labelStyle={{
                      color: "#ffffff",
                      fontWeight: 700,
                    }}
                    itemStyle={{
                      color: "#60a5fa",
                      fontWeight: 700,
                    }}
                    formatter={(value) => [
                      `₹${Number(value).toFixed(2)}`,
                      "Price",
                    ]}
                  />

                  <ReferenceLine
  y={Number(result.market_average)}
  stroke="#ef4444"
  strokeDasharray="6 6"
  strokeWidth={2}
/>

                  <Bar
                    dataKey="price"
                    radius={[12, 12, 4, 4]}
                    maxBarSize={84}
                    animationDuration={1200}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.company}
                        fill={
                          CHART_COLORS[
                            index % CHART_COLORS.length
                          ]
                        }
                      />
                    ))}

                    <LabelList
                      dataKey="price"
                      position="top"
                      formatter={(value) =>
                        `₹${Number(value).toFixed(2)}`
                      }
                      fill="#dbeafe"
                      fontSize={12}
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
</div>

<div className="market-average-note">
  <span className="market-average-line" />
  Market average: ₹
  {Number(result.market_average).toFixed(2)}
</div>

</section>
        </>
      )}
    </main>
  );
}

export default CompetitorAnalysis;