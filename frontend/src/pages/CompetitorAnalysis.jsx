import { useMemo, useState } from "react";
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
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Lightbulb,
  Minus,
  Target,
} from "lucide-react";

import "../components/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const CHART_COLORS = [
  "#00E5FF",
  "#4F8CFF",
  "#8B5CF6",
  "#34D399",
  "#F59E0B",
];

function formatCurrency(value) {
  return `₹${Number(value).toFixed(2)}`;
}

function getPriceDifference(price, ourPrice) {
  return Number(price) - Number(ourPrice);
}

function CompetitorAnalysis() {
  const [price, setPrice] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const saveHistory = async (analysis) => {
  const token = localStorage.getItem("pricepilot_token");

  if (!token) {
    console.warn("No authentication token found.");
    return;
  }

  try {
    await axios.post(
      `${API_URL}/history`,
      {
        module: "competitor_analysis",
        product_name: "Market Price Analysis",

        input_data: {
          our_price: Number(analysis.our_price),
        },

        result_data: analysis,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("History saved successfully.");
  } catch (error) {
    console.error(
      "History save failed:",
      error.response?.data || error.message
    );
  }
};
  

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
      await saveHistory(response.data);
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

  const chartData = useMemo(() => {
    if (!result) {
      return [];
    }

    return [
      {
        company: "Our Price",
        price: Number(result.our_price),
        difference: 0,
      },
      ...Object.entries(result.competitors).map(
        ([company, value]) => ({
          company,
          price: Number(value),
          difference: getPriceDifference(
            value,
            result.our_price
          ),
        })
      ),
    ];
  }, [result]);

  const competitorAverage = useMemo(() => {
    if (!result) {
      return 0;
    }

    const values = Object.values(
      result.competitors
    ).map(Number);

    if (values.length === 0) {
      return 0;
    }

    return (
      values.reduce(
        (total, value) => total + value,
        0
      ) / values.length
    );
  }, [result]);

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
    ? String(result.market_position).toLowerCase()
    : "";

  const getDifferenceLabel = (
    competitorPrice
  ) => {
    if (!result) {
      return "";
    }

    const difference = getPriceDifference(
      competitorPrice,
      result.our_price
    );

    if (difference > 0) {
      return `+${formatCurrency(difference)}`;
    }

    if (difference < 0) {
      return `-${formatCurrency(
        Math.abs(difference)
      )}`;
    }

    return "Same price";
  };

  const getDifferenceIcon = (
    competitorPrice
  ) => {
    if (!result) {
      return <Minus size={16} />;
    }

    const difference = getPriceDifference(
      competitorPrice,
      result.our_price
    );

    if (difference > 0) {
      return <ArrowUpRight size={16} />;
    }

    if (difference < 0) {
      return <ArrowDownRight size={16} />;
    }

    return <Minus size={16} />;
  };

  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div>
          <span className="eyebrow">
            Market intelligence
          </span>

          <h1>Competitor Analysis</h1>

          <p>
            Compare your product price with simulated competitor
            prices and identify your market position.
          </p>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              Price input
            </span>

            <h2>Analyze market position</h2>

            <p>
              Enter your selling price to generate a simulated
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
                {formatCurrency(result.our_price)}
              </strong>

              <small>Current selling price</small>
            </article>

            <article className="stat-card">
              <span>Competitor Average</span>

              <strong>
                {formatCurrency(competitorAverage)}
              </strong>

              <small>
                Average across simulated competitors
              </small>
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
                {Number(
                  result.opportunity_score
                ).toFixed(1)}
                %
              </strong>

              <small>
                Pricing competitiveness score
              </small>
            </article>
          </section>

          <section className="dashboard-card competitor-recommendation-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  AI recommendation
                </span>

                <h2>
                  {result.recommendation}
                </h2>

                <p>
                  Your price is{" "}
                  {Math.abs(
                    differencePercent
                  ).toFixed(2)}
                  % {differenceDirection} the simulated market
                  average.
                </p>
              </div>

              <div
                className={`market-position-badge ${positionClass}`}
              >
                <Target size={17} />
                {result.market_position}
              </div>
            </div>

            <div className="competitor-insight-strip">
              <Lightbulb size={20} />

              <p>
                The simulated competitor average is{" "}
                <strong>
                  {formatCurrency(
                    competitorAverage
                  )}
                </strong>
                . Use this range as guidance when testing price
                changes.
              </p>
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
              ).map(([company, value]) => {
                const numericValue =
                  Number(value);

                const difference =
                  getPriceDifference(
                    numericValue,
                    result.our_price
                  );

                const differenceClass =
                  difference > 0
                    ? "higher"
                    : difference < 0
                      ? "lower"
                      : "equal";

                return (
                  <article
                    className="stat-card"
                    key={company}
                  >
                    <span>{company}</span>

                    <strong>
                      {formatCurrency(
                        numericValue
                      )}
                    </strong>

                    <small
                      className={`competitor-difference ${differenceClass}`}
                    >
                      {getDifferenceIcon(
                        numericValue
                      )}

                      {getDifferenceLabel(
                        numericValue
                      )}
                    </small>
                  </article>
                );
              })}
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

              <div className="competitor-average-summary">
                <BadgeIndianRupee size={20} />

                <div>
                  <span>
                    Competitor average
                  </span>

                  <strong>
                    {formatCurrency(
                      competitorAverage
                    )}
                  </strong>
                </div>
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
                    top: 34,
                    right: 56,
                    left: 18,
                    bottom: 18,
                  }}
                  barCategoryGap="24%"
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
                    interval={0}
                    tick={{
                      fill: "#93a4c3",
                      fontSize: 13,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[
  (dataMin) => Math.floor(dataMin * 0.95),
  (dataMax) => Math.ceil(dataMax * 1.05),
]}
                    tick={{
                      fill: "#93a4c3",
                      fontSize: 13,
                    }}
                    tickFormatter={(value) =>
                      `₹${Number(
                        value
                      ).toFixed(0)}`
                    }
                  />

                  <Tooltip
                    cursor={{
                      fill:
                        "rgba(99, 102, 241, 0.08)",
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
                    formatter={(
                      value,
                      name,
                      item
                    ) => {
                      const difference =
                        Number(
                          item?.payload
                            ?.difference || 0
                        );

                      const label =
                        difference > 0
                          ? `Price · +${formatCurrency(
                              difference
                            )}`
                          : difference < 0
                            ? `Price · -${formatCurrency(
                                Math.abs(
                                  difference
                                )
                              )}`
                            : "Price";

                      return [
                        formatCurrency(
                          value
                        ),
                        label,
                      ];
                    }}
                  />

                  <ReferenceLine
                    y={Number(
                      result.market_average
                    )}
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
                    {chartData.map(
                      (entry, index) => (
                        <Cell
                          key={
                            entry.company
                          }
                          fill={
                            CHART_COLORS[
                              index %
                                CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                    <LabelList
                      dataKey="price"
                      position="top"
                      formatter={(value) =>
                        formatCurrency(value)
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

              Market average:{" "}
              {formatCurrency(
                result.market_average
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default CompetitorAnalysis;