import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Box,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch("/analytics.json");

        if (!response.ok) {
          throw new Error("Could not load analytics data.");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (requestError) {
        console.error(requestError);
        setError(
          "Analytics data could not be loaded. Run generate_analytics.py first."
        );
      }
    };

    loadAnalytics();
  }, []);

  if (error) {
    return (
      <main className="dashboard-content">
        <div className="analytics-error">{error}</div>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="dashboard-content">
        <div className="analytics-loading">Loading analytics...</div>
      </main>
    );
  }

  const monthlyOrders = analytics.monthly_orders.map((item) => ({
    ...item,
    month: monthNames[item.month - 1],
  }));

  const summaryCards = [
    {
      label: "Average price",
      value: `₹${Number(analytics.summary.average_price).toFixed(2)}`,
      description: "Mean product selling price",
      icon: TrendingUp,
      tone: "blue",
    },
    {
      label: "Median price",
      value: `₹${Number(analytics.summary.median_price).toFixed(2)}`,
      description: "Middle value across products",
      icon: BarChart3,
      tone: "purple",
    },
    {
      label: "Total orders",
      value: Number(analytics.summary.total_orders).toLocaleString(),
      description: "Unique customer orders",
      icon: ShoppingBag,
      tone: "green",
    },
    {
      label: "Total products",
      value: Number(analytics.summary.total_products).toLocaleString(),
      description: "Unique products analyzed",
      icon: Package,
      tone: "orange",
    },
  ];

  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Commerce analytics</span>

          <h1>Explore real insights from the Olist dataset.</h1>

          <p>
            Review product pricing, order activity, category performance and
            delivery behavior using analytics generated from the merged
            e-commerce dataset.
          </p>
        </div>
      </section>

      <section className="analytics-summary-grid">
        {summaryCards.map(
          ({ label, value, description, icon: Icon, tone }, index) => (
            <motion.article
              className="analytics-summary-card"
              key={label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div className={`analytics-summary-icon ${tone}`}>
                <Icon size={22} />
              </div>

              <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{description}</small>
              </div>
            </motion.article>
          )
        )}
      </section>

      <section className="analytics-grid">
        <motion.article
          className="dashboard-card analytics-chart-card"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Price analysis</span>
              <h2>Product price distribution</h2>
              <p>Number of products grouped by selling-price range.</p>
            </div>
          </div>

          <div className="analytics-chart-wrapper">
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={analytics.price_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                <XAxis
                  dataKey="range"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#60a5fa"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          className="dashboard-card analytics-chart-card"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Order activity</span>
              <h2>Monthly orders</h2>
              <p>Unique orders recorded for each purchase month.</p>
            </div>
          </div>

          <div className="analytics-chart-wrapper">
            <ResponsiveContainer width="100%" height={310}>
              <AreaChart data={monthlyOrders}>
                <defs>
                  <linearGradient
                    id="ordersFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="95%"
                      stopColor="#8b5cf6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  fill="url(#ordersFill)"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          className="dashboard-card analytics-chart-card"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Category performance</span>
              <h2>Top product categories</h2>
              <p>Most frequently ordered product categories.</p>
            </div>
          </div>

          <div className="analytics-chart-wrapper">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={analytics.top_categories}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                <XAxis
                  type="number"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="category"
                  width={150}
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#34d399"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          className="dashboard-card analytics-chart-card"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Delivery insights</span>
              <h2>Delivery-time distribution</h2>
              <p>Orders grouped by the number of days taken for delivery.</p>
            </div>
          </div>

          <div className="analytics-chart-wrapper">
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={analytics.delivery_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                <XAxis
                  dataKey="range"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#fb923c"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </section>
    </main>
  );
}

export default Analytics;