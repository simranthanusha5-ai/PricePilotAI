import { motion } from "framer-motion";
import {
  Box,
  CheckCircle2,
  Gauge,
  Scale,
  Sparkles,
} from "lucide-react";

function PredictionCard({ result, loading }) {
  const predictedPrice = result?.predicted_price ?? null;
  const volume = result?.product_volume_cm3 ?? null;
  const density = result?.product_density ?? null;

  return (
    <motion.section
      className="dashboard-card prediction-card"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">AI recommendation</span>
          <h2>Prediction result</h2>
          <p>Generated using the tuned XGBoost pricing model.</p>
        </div>

        <div className="model-pill">
          <Sparkles size={15} />
          XGBoost
        </div>
      </div>

      <div className="prediction-visual">
        <div className="prediction-ring">
          <motion.div
            className="prediction-value"
            key={predictedPrice}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span>Recommended price</span>

            <strong>
              {loading
                ? "..."
                : predictedPrice !== null
                  ? `₹${Number(predictedPrice).toFixed(2)}`
                  : "₹--"}
            </strong>

            <div className="optimal-status">
              <CheckCircle2 size={16} />
              Optimal estimate
            </div>
          </motion.div>
        </div>
      </div>

      <div className="insight-row">
        <article className="mini-card">
          <div className="mini-icon blue">
            <Box size={20} />
          </div>

          <div>
            <span>Product volume</span>
            <strong>
              {volume !== null ? Number(volume).toFixed(0) : "--"}
            </strong>
            <small>cm³</small>
          </div>
        </article>

        <article className="mini-card">
          <div className="mini-icon green">
            <Scale size={20} />
          </div>

          <div>
            <span>Product density</span>
            <strong>
              {density !== null ? Number(density).toFixed(4) : "--"}
            </strong>
            <small>g/cm³</small>
          </div>
        </article>

        
      </div>
    </motion.section>
  );
}

export default PredictionCard;