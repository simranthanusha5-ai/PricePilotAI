import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Gauge,
  Lightbulb,
  Minus,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const HORIZONS = [
  { value: 7, label: "Next 7 days" },
  { value: 30, label: "Next 30 days" },
  { value: 90, label: "Next 90 days" },
  { value: 365, label: "Next 365 days" },
];

function formatDate(dateString) {
  if (!dateString) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatCompactDate(dateString) {
  if (!dateString) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(new Date(`${dateString}T00:00:00`));
}

function TrendIcon({ trend, size = 20 }) {
  if (trend === "increasing") {
    return <TrendingUp size={size} />;
  }

  if (trend === "decreasing") {
    return <TrendingDown size={size} />;
  }

  return <Minus size={size} />;
}

function DemandForecast() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [horizon, setHorizon] = useState(30);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        setError("");

        const response = await fetch(
          `${API_URL}/demand/categories`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not load categories."
          );
        }

        const receivedCategories = data.categories || [];

        setCategories(receivedCategories);

        if (receivedCategories.length > 0) {
          setCategory(receivedCategories[0].value);
        }
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError.message ||
            "Could not connect to the forecasting API."
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  const selectedCategoryLabel = useMemo(() => {
    const internalValue = forecast?.category || category;

    return (
      categories.find(
        (item) => item.value === internalValue
      )?.label ||
      internalValue ||
      "Selected category"
    );
  }, [categories, category, forecast]);

  const trendLabel = forecast?.trend
    ? forecast.trend.charAt(0).toUpperCase() +
      forecast.trend.slice(1)
    : "No forecast";

  const confidenceLevel = useMemo(() => {
    const score = Number(forecast?.confidence_score || 0);

    if (score >= 70) {
      return "High";
    }

    if (score >= 45) {
      return "Moderate";
    }

    return "Low";
  }, [forecast]);

  const forecastPreview = useMemo(() => {
    if (!forecast?.daily_forecast) {
      return [];
    }

    return forecast.daily_forecast.slice(0, 7);
  }, [forecast]);

  const kpiCards = useMemo(() => {
    if (!forecast) {
      return [];
    }

    return [
      {
        label: "Total predicted demand",
        value: Number(
          forecast.total_predicted_demand
        ).toFixed(2),
        suffix: "units",
        description: "Across selected horizon",
        icon: BarChart3,
        tone: "violet",
      },
      {
        label: "Average daily demand",
        value: Number(
          forecast.average_daily_demand
        ).toFixed(2),
        suffix: "units/day",
        description: "Forecast-period average",
        icon: CalendarDays,
        tone: "blue",
      },
      {
        label: "Confidence score",
        value: `${Number(
          forecast.confidence_score
        ).toFixed(1)}%`,
        suffix: "",
        description: `${confidenceLevel} confidence`,
        icon: ShieldCheck,
        tone: "green",
      },
      {
        label: "Recent daily average",
        value: Number(
          forecast.recent_daily_average
        ).toFixed(2),
        suffix: "units/day",
        description: "Recent 28-day average",
        icon: Activity,
        tone: "orange",
      },
      {
        label: "Forecast period",
        value: formatCompactDate(
          forecast.forecast_start
        ),
        suffix: "",
        description: `to ${formatCompactDate(
          forecast.forecast_end
        )} · ${forecast.horizon_days} days`,
        icon: CalendarRange,
        tone: "cyan",
      },
    ];
  }, [forecast, confidenceLevel]);

  async function saveForecastHistory(
    forecastData,
    categoryLabel
  ) {
    const token = localStorage.getItem(
      "pricepilot_token"
    );

    if (!token) {
      console.warn(
        "Forecast history was not saved because no authentication token was found."
      );
      return;
    }

    try {
      const historyResponse = await fetch(
        `${API_URL}/history`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            module: "demand_forecast",
            product_name: categoryLabel,
            input_data: {
              category,
              category_label: categoryLabel,
              horizon_days: Number(horizon),
            },
            result_data: forecastData,
          }),
        }
      );

      if (!historyResponse.ok) {
        const historyError = await historyResponse
          .json()
          .catch(() => ({}));

        console.warn(
          "Forecast generated, but history saving failed:",
          historyError.detail ||
            historyResponse.statusText
        );
      }
    } catch (historyError) {
      console.warn(
        "Forecast generated, but history saving failed:",
        historyError
      );
    }
  }

  async function generateForecast(event) {
    event.preventDefault();

    if (!category) {
      setError("Please select a product category.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/forecast-demand`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category,
            horizon_days: Number(horizon),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Demand forecast failed."
        );
      }

      const categoryLabel =
        categories.find(
          (item) => item.value === category
        )?.label ||
        category ||
        "Selected category";

      setForecast(data);

      await saveForecastHistory(
        data,
        categoryLabel
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.message ||
          "Unable to generate the forecast."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dashboard-content forecast-page">
      <section className="forecast-topbar">
        <div>
          <span className="eyebrow">
            Demand intelligence
          </span>

          <h1>Demand Forecasting</h1>

          <p>
            Generate category-level demand projections using
            historical sales patterns, lag features and calendar
            signals.
          </p>
        </div>

        <form
          className="forecast-controls"
          onSubmit={generateForecast}
        >
          <label>
            <span>Product category</span>

            <div className="forecast-select-control">
              <PackageSearch size={18} />

              <select
                value={category}
                disabled={loadingCategories}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                {loadingCategories ? (
                  <option value="">
                    Loading categories...
                  </option>
                ) : (
                  categories.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))
                )}
              </select>
            </div>
          </label>

          <label>
            <span>Forecast horizon</span>

            <div className="forecast-select-control">
              <CalendarRange size={18} />

              <select
                value={horizon}
                onChange={(event) =>
                  setHorizon(
                    Number(event.target.value)
                  )
                }
              >
                {HORIZONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <button
            className="forecast-generate-button"
            type="submit"
            disabled={
              loading ||
              loadingCategories ||
              !category
            }
          >
            <Sparkles size={18} />

            {loading
              ? "Generating..."
              : "Generate forecast"}
          </button>
        </form>
      </section>

      {error && (
        <div className="forecast-error">
          {error}
        </div>
      )}

      {!forecast ? (
        <motion.section
          className="dashboard-card forecast-welcome-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="forecast-welcome-icon">
            <PackageSearch size={36} />
          </div>

          <h2>Generate your first forecast</h2>

          <p>
            Choose a product category and forecast horizon above
            to explore demand trends, confidence and daily
            projections.
          </p>
        </motion.section>
      ) : (
        <>
          <motion.section
            className="forecast-result-header"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="forecast-category-heading">
              <div className="forecast-category-icon">
                <PackageSearch size={29} />
              </div>

              <div>
                <span className="eyebrow">
                  Forecast result
                </span>

                <h2>{selectedCategoryLabel}</h2>

                <p>
                  Demand projection for the selected product
                  category.
                </p>
              </div>
            </div>

            <div
              className={`forecast-status-card ${forecast.trend}`}
            >
              <TrendIcon
                trend={forecast.trend}
                size={25}
              />

              <div>
                <strong>{trendLabel}</strong>
                <span>
                  Compared with recent demand
                </span>
              </div>
            </div>
          </motion.section>

          <section className="forecast-kpi-grid">
            {kpiCards.map(
              (
                {
                  label,
                  value,
                  suffix,
                  description,
                  icon: Icon,
                  tone,
                },
                index
              ) => (
                <motion.article
                  className="forecast-kpi-card"
                  key={label}
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.07,
                  }}
                >
                  <div
                    className={`forecast-kpi-icon ${tone}`}
                  >
                    <Icon size={21} />
                  </div>

                  <span>{label}</span>

                  <div className="forecast-kpi-value">
                    <strong>{value}</strong>

                    {suffix && (
                      <small>{suffix}</small>
                    )}
                  </div>

                  <p>{description}</p>
                </motion.article>
              )
            )}
          </section>

          <section className="forecast-analysis-grid">
            <motion.article
              className="dashboard-card forecast-chart-panel"
              initial={{
                opacity: 0,
                x: -18,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
            >
              <div className="forecast-panel-heading">
                <div>
                  <span className="eyebrow">
                    Daily projection
                  </span>

                  <h2>Demand forecast</h2>
                </div>

                <div className="forecast-chart-legend">
                  <span />
                  Predicted daily demand
                </div>
              </div>

              <div className="forecast-chart-wrapper">
                <ResponsiveContainer
                  width="100%"
                  height={390}
                >
                  <AreaChart
                    data={forecast.daily_forecast}
                    margin={{
                      top: 12,
                      right: 12,
                      left: -10,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="forecastAreaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.58}
                        />

                        <stop
                          offset="100%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="rgba(148, 163, 184, 0.12)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="display_date"
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={42}
                      fontSize={12}
                    />

                    <YAxis
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />

                    <Tooltip
                      labelFormatter={(value) =>
                        value
                      }
                      formatter={(value) => [
                        `${Number(
                          value
                        ).toFixed(2)} units`,
                        "Predicted demand",
                      ]}
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

                    <Area
                      type="monotone"
                      dataKey="predicted_demand"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fill="url(#forecastAreaGradient)"
                      activeDot={{
                        r: 6,
                        fill: "#c4b5fd",
                        stroke: "#7c3aed",
                        strokeWidth: 3,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.article>

            <motion.aside
              className="dashboard-card forecast-insights-panel"
              initial={{
                opacity: 0,
                x: 18,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
            >
              <div className="forecast-panel-heading">
                <div>
                  <span className="eyebrow">
                    Forecast intelligence
                  </span>

                  <h2>Forecast insights</h2>
                </div>

                <Lightbulb size={23} />
              </div>

              <div className="forecast-insight-list">
                <article
                  className={`forecast-insight-card trend-${forecast.trend}`}
                >
                  <TrendIcon
                    trend={forecast.trend}
                    size={22}
                  />

                  <div>
                    <strong>Demand trend</strong>

                    <p>
                      Demand is expected to be{" "}
                      <b>{forecast.trend}</b>{" "}
                      compared with the recent 28-day
                      average.
                    </p>
                  </div>
                </article>

                <article className="forecast-insight-card seasonality">
                  <CalendarDays size={22} />

                  <div>
                    <strong>
                      Forecast horizon
                    </strong>

                    <p>
                      This projection covers{" "}
                      <b>
                        {forecast.horizon_days} days
                      </b>
                      . Shorter horizons generally provide
                      more reliable forecasts.
                    </p>
                  </div>
                </article>

                <article className="forecast-insight-card confidence">
                  <Gauge size={22} />

                  <div>
                    <strong>
                      Model confidence
                    </strong>

                    <p>
                      Confidence is{" "}
                      <b>
                        {confidenceLevel.toLowerCase()}
                      </b>{" "}
                      at{" "}
                      {Number(
                        forecast.confidence_score
                      ).toFixed(1)}
                      %.
                    </p>
                  </div>
                </article>
              </div>

              <div className="forecast-model-metrics">
                <div>
                  <ShieldCheck size={18} />

                  <span>
                    Validation performance
                  </span>
                </div>

                <p>
                  WAPE{" "}
                  <strong>
                    {Number(
                      forecast.validation_metrics
                        ?.wape
                    ).toFixed(3)}
                  </strong>

                  <span>•</span>

                  MAE{" "}
                  <strong>
                    {Number(
                      forecast.validation_metrics
                        ?.mae
                    ).toFixed(3)}
                  </strong>

                  <span>•</span>

                  RMSE{" "}
                  <strong>
                    {Number(
                      forecast.validation_metrics
                        ?.rmse
                    ).toFixed(3)}
                  </strong>
                </p>
              </div>
            </motion.aside>
          </section>

          <motion.section
            className="dashboard-card forecast-table-panel"
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <div className="forecast-panel-heading">
              <div>
                <span className="eyebrow">
                  Forecast details
                </span>

                <h2>Daily forecast preview</h2>
              </div>

              <div className="forecast-period-chip">
                <Clock3 size={16} />

                Day 1 – Day{" "}
                {forecast.horizon_days}
              </div>
            </div>

            <div className="forecast-table-wrapper">
              <table className="forecast-table">
                <thead>
                  <tr>
                    <th>Date</th>

                    {forecastPreview.map(
                      (row) => (
                        <th key={row.date}>
                          {row.display_date}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <th>Predicted demand</th>

                    {forecastPreview.map(
                      (row) => (
                        <td key={row.date}>
                          {Number(
                            row.predicted_demand
                          ).toFixed(2)}
                        </td>
                      )
                    )}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="forecast-table-note">
              <CheckCircle2 size={17} />

              Showing the first seven days from a{" "}
              {forecast.horizon_days}-day forecast.
            </div>
          </motion.section>
        </>
      )}
    </main>
  );
}

export default DemandForecast;