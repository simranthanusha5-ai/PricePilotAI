import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import "../components/Dashboard.css";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  BarChart3,
  Gauge,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function RecommendationIcon({ recommendation }) {
  if (recommendation === "increase") {
    return <ArrowUpRight size={22} />;
  }

  if (recommendation === "decrease") {
    return <ArrowDownRight size={22} />;
  }

  return <ArrowRight size={22} />;
}

function RevenueOptimization() {
  const [currentPrice, setCurrentPrice] = useState("220");
  const [baselineDemand, setBaselineDemand] = useState("100");
  const [elasticity, setElasticity] = useState("1.3");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const saveHistory = async (optimizationResult) => {
  const token = localStorage.getItem("pricepilot_token");

  if (!token) {
    console.warn("No authentication token found.");
    return;
  }

  try {
    await fetch(`${API_URL}/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        module: "revenue_optimization",

        product_name: "Revenue Optimization",

        input_data: {
          current_price: Number(currentPrice),
          baseline_demand: Number(baselineDemand),
          elasticity: Number(elasticity),
        },

        result_data: optimizationResult,
      }),
    });

    console.log("Revenue history saved.");
  } catch (error) {
    console.error(error);
  }
};

  const recommendationLabel = useMemo(() => {
    if (!result) {
      return "";
    }

    if (result.recommendation === "increase") {
      return "Increase price";
    }

    if (result.recommendation === "decrease") {
      return "Decrease price";
    }

    return "Keep current price";
  }, [result]);

  const recommendationText = useMemo(() => {
    if (!result) {
      return "";
    }

    const absoluteChange = Math.abs(Number(result.price_change));

    if (result.recommendation === "increase") {
      return `Increase the current price by ₹${absoluteChange.toFixed(
        2
      )} to improve estimated revenue.`;
    }

    if (result.recommendation === "decrease") {
      return `Reduce the current price by ₹${absoluteChange.toFixed(
        2
      )} to improve estimated revenue.`;
    }

    return "The current price is already close to the simulated revenue optimum.";
  }, [result]);

  async function optimizeRevenue(event) {
    event.preventDefault();

    const price = Number(currentPrice);
    const demand = Number(baselineDemand);
    const elasticityValue = Number(elasticity);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Current price must be greater than zero.");
      return;
    }

    if (!Number.isFinite(demand) || demand <= 0) {
      setError("Baseline demand must be greater than zero.");
      return;
    }

    if (!Number.isFinite(elasticityValue) || elasticityValue <= 0) {
      setError("Elasticity must be greater than zero.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/optimize-revenue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_price: price,
            baseline_demand: demand,
            elasticity: elasticityValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : "Revenue optimization failed.";

        throw new Error(detail);
      }

      setResult(data);
      await saveHistory(data);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.message ||
          "Could not connect to the revenue optimization API."
      );
    } finally {
      setLoading(false);
    }
  }

  const summaryCards = result
    ? [
        {
          label: "Current price",
          value: `₹${Number(result.current_price).toFixed(2)}`,
          description: "Current selling price",
          icon: BadgeIndianRupee,
          tone: "blue",
        },
        {
          label: "Recommended price",
          value: `₹${Number(result.recommended_price).toFixed(2)}`,
          description: recommendationLabel,
          icon: Sparkles,
          tone: "purple",
        },
        {
          label: "Expected demand",
          value: Number(result.recommended_demand).toFixed(2),
          description: "Units at recommended price",
          icon: Users,
          tone: "green",
        },
        {
          label: "Optimized revenue",
          value: `₹${Number(result.optimized_revenue).toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`,
          description: "Estimated maximum revenue",
          icon: WalletCards,
          tone: "orange",
        },
        {
          label: "Revenue gain",
          value: `${Number(result.revenue_gain_percent).toFixed(2)}%`,
          description: `₹${Number(result.revenue_gain).toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} improvement`,
          icon: TrendingUp,
          tone: "cyan",
        },
      ]
    : [];

  return (
    <main className="dashboard-content revenue-page">
      <section className="revenue-topbar">
        <div>
          <span className="eyebrow">Pricing intelligence</span>

          <h1>Revenue Optimization</h1>

          <p>
            Simulate how price changes may affect demand and revenue,
            then identify the strongest estimated price point.
          </p>
        </div>

        <form
          className="revenue-controls"
          onSubmit={optimizeRevenue}
        >
          <label>
            <span>Current price</span>

            <div className="revenue-input-control">
              <BadgeIndianRupee size={18} />

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={currentPrice}
                onChange={(event) =>
                  setCurrentPrice(event.target.value)
                }
              />
            </div>
          </label>

          <label>
            <span>Baseline demand</span>

            <div className="revenue-input-control">
              <Users size={18} />

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={baselineDemand}
                onChange={(event) =>
                  setBaselineDemand(event.target.value)
                }
              />
            </div>
          </label>

          <label>
            <span>Price elasticity</span>

            <div className="revenue-input-control">
              <Gauge size={18} />

              <input
                type="number"
                min="0.1"
                step="0.1"
                value={elasticity}
                onChange={(event) =>
                  setElasticity(event.target.value)
                }
              />
            </div>
          </label>

          <button
            className="revenue-generate-button"
            type="submit"
            disabled={loading}
          >
            <Sparkles size={18} />

            {loading
              ? "Optimizing..."
              : "Optimize revenue"}
          </button>
        </form>
      </section>

      {error && (
        <div className="forecast-error">{error}</div>
      )}

      {!result ? (
        <motion.section
          className="dashboard-card revenue-welcome-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="revenue-welcome-icon">
            <TrendingUp size={38} />
          </div>

          <h2>Run a revenue simulation</h2>

          <p>
            Enter a current price, baseline demand and elasticity
            value to estimate an optimal price and revenue outcome.
          </p>
        </motion.section>
      ) : (
        <>
          <motion.section
            className="revenue-result-header"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="revenue-result-heading">
              <div className="revenue-result-icon">
                <BarChart3 size={30} />
              </div>

              <div>
                <span className="eyebrow">
                  Optimization result
                </span>

                <h2>{recommendationLabel}</h2>

                <p>{recommendationText}</p>
              </div>
            </div>

            <div
              className={`revenue-status-card ${result.recommendation}`}
            >
              <RecommendationIcon
                recommendation={result.recommendation}
              />

              <div>
                <strong>
                  ₹{Number(result.recommended_price).toFixed(2)}
                </strong>

                <span>Recommended selling price</span>
              </div>
            </div>
          </motion.section>

          <section className="revenue-kpi-grid">
            {summaryCards.map(
              (
                {
                  label,
                  value,
                  description,
                  icon: Icon,
                  tone,
                },
                index
              ) => (
                <motion.article
                  className="revenue-kpi-card"
                  key={label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.07,
                  }}
                >
                  <div
                    className={`revenue-kpi-icon ${tone}`}
                  >
                    <Icon size={21} />
                  </div>

                  <span>{label}</span>

                  <strong>{value}</strong>

                  <p>{description}</p>
                </motion.article>
              )
            )}
          </section>

          <section className="revenue-analysis-grid">
            <motion.article
              className="dashboard-card revenue-chart-panel"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="forecast-panel-heading">
                <div>
                  <span className="eyebrow">
                    Price simulation
                  </span>

                  <h2>Revenue curve</h2>

                  <p>
                    Estimated revenue and demand across the tested
                    price range.
                  </p>
                </div>
              </div>

              <div className="revenue-chart-wrapper">
                <ResponsiveContainer
                  width="100%"
                  height={420}
                >
                  <ComposedChart
                    data={result.simulation}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 5,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="rgba(148, 163, 184, 0.12)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="price"
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(value) =>
                        `₹${Number(value).toFixed(0)}`
                      }
                    />

                    <YAxis
                      yAxisId="revenue"
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}`
                      }
                    />

                    <YAxis
                      yAxisId="demand"
                      orientation="right"
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />

                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "predicted_revenue") {
                          return [
                            `₹${Number(value).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}`,
                            "Predicted revenue",
                          ];
                        }

                        return [
                          `${Number(value).toFixed(2)} units`,
                          "Predicted demand",
                        ];
                      }}
                      labelFormatter={(value) =>
                        `Price: ₹${Number(value).toFixed(2)}`
                      }
                      contentStyle={{
                        background: "#08152f",
                        border:
                          "1px solid rgba(139, 92, 246, 0.35)",
                        borderRadius: "14px",
                        color: "#f8fafc",
                        boxShadow:
                          "0 18px 44px rgba(0, 0, 0, 0.35)",
                      }}
                    />

                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="predicted_revenue"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />

                    <Line
                      yAxisId="demand"
                      type="monotone"
                      dataKey="predicted_demand"
                      stroke="#34d399"
                      strokeWidth={2}
                      strokeDasharray="6 6"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.article>

            <motion.aside
              className="dashboard-card revenue-insights-panel"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="forecast-panel-heading">
                <div>
                  <span className="eyebrow">
                    Optimization insight
                  </span>

                  <h2>AI recommendation</h2>
                </div>

                <Lightbulb size={23} />
              </div>

              <div
                className={`revenue-recommendation-card ${result.recommendation}`}
              >
                <RecommendationIcon
                  recommendation={result.recommendation}
                />

                <div>
                  <strong>{recommendationLabel}</strong>
                  <p>{recommendationText}</p>
                </div>
              </div>

              <div className="revenue-insight-list">
                <article>
                  <span>Baseline revenue</span>

                  <strong>
                    ₹
                    {Number(
                      result.baseline_revenue
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </article>

                <article>
                  <span>Optimized revenue</span>

                  <strong>
                    ₹
                    {Number(
                      result.optimized_revenue
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </article>

                <article>
                  <span>Price change</span>

                  <strong>
                    {Number(result.price_change) >= 0
                      ? "+"
                      : ""}
                    ₹{Number(result.price_change).toFixed(2)}
                  </strong>
                </article>

                <article>
                  <span>Elasticity used</span>

                  <strong>
                    {Number(result.elasticity).toFixed(2)}
                  </strong>
                </article>
              </div>

              <div className="revenue-disclaimer">
                This module uses a simulated constant-elasticity
                demand curve. It is a decision-support estimate,
                not a causal pricing model.
              </div>
            </motion.aside>
          </section>

          <motion.section
            className="dashboard-card revenue-table-panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="forecast-panel-heading">
              <div>
                <span className="eyebrow">
                  Simulation details
                </span>

                <h2>Price sweep preview</h2>

                <p>
                  A sample of the simulated price, demand and
                  revenue combinations.
                </p>
              </div>
            </div>

            <div className="revenue-table-wrapper">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th>Price</th>
                    <th>Predicted demand</th>
                    <th>Predicted revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {result.simulation
                    .filter(
                      (_, index) =>
                        index % 5 === 0 ||
                        index ===
                          result.simulation.length - 1
                    )
                    .map((row) => (
                      <tr key={row.price}>
                        <td>
                          ₹{Number(row.price).toFixed(2)}
                        </td>

                        <td>
                          {Number(
                            row.predicted_demand
                          ).toFixed(2)}
                        </td>

                        <td>
                          ₹
                          {Number(
                            row.predicted_revenue
                          ).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </>
      )}
    </main>
  );
}

export default RevenueOptimization;