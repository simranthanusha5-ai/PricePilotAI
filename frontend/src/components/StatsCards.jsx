import { motion } from "framer-motion";
import {
  BrainCircuit,
  ChartNoAxesCombined,
  Crosshair,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    label: "R² score",
    value: "0.703",
    description: "Explained variance",
    icon: TrendingUp,
    tone: "blue",
  },
  {
    label: "MAE",
    value: "31.84",
    description: "Mean absolute error",
    icon: Crosshair,
    tone: "green",
  },
  {
    label: "RMSE",
    value: "103.74",
    description: "Root mean squared error",
    icon: ChartNoAxesCombined,
    tone: "purple",
  },
  {
    label: "Model",
    value: "XGBoost",
    description: "Tuned regressor",
    icon: BrainCircuit,
    tone: "orange",
  },
];

function StatsCards() {
  return (
    <section className="stats-section">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Model intelligence</span>
          <h2>Performance overview</h2>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, description, icon: Icon, tone }, index) => (
          <motion.article
            className="stat-card"
            key={label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <div className={`stat-icon ${tone}`}>
              <Icon size={22} />
            </div>

            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{description}</small>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

export default StatsCards;