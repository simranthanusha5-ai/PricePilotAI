import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartData = [
  { month: "Jan", price: 165 },
  { month: "Feb", price: 176 },
  { month: "Mar", price: 171 },
  { month: "Apr", price: 188 },
  { month: "May", price: 196 },
  { month: "Jun", price: 205 },
  { month: "Jul", price: 218 },
];

function PriceChart() {
  return (
    <motion.section
      className="dashboard-card chart-card"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Pricing analytics</span>
          <h2>Estimated price trend</h2>
          <p>Illustrative monthly trend for the prediction dashboard.</p>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
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
              dataKey="price"
              stroke="#60a5fa"
              strokeWidth={3}
              fill="url(#priceFill)"
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

export default PriceChart;