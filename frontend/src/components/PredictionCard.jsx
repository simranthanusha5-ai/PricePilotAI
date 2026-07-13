import { motion } from "framer-motion";
import {
  Box,
  CheckCircle2,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";

function PredictionCard({ result, loading }) {
  const predictedPrice = result?.predicted_price ?? null;
  const volume = result?.product_volume_cm3 ?? null;
  const density = result?.product_density ?? null;

  return (
    <motion.section
      className="dashboard-card prediction-card"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="section-heading prediction-heading">
        <div>
          <span className="eyebrow">Price recommendation</span>
          <h2>Estimated selling price</h2>
          <p>Calculated from the product and order details provided.</p>
        </div>

        <div className="model-pill">
          <Sparkles size={15} />
          XGBoost
        </div>
      </div>

      <div className={`prediction-stage ${loading ? "is-loading" : ""}`}>
        <div className="prediction-orbit orbit-one" />
        <div className="prediction-orbit orbit-two" />

        <motion.div
          className="prediction-core"
          key={predictedPrice}
          initial={{ opacity: 0, scale: 0.82, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="price-icon">
            <TrendingUp size={22} />
          </div>

          <span className="price-label">Estimated price</span>

          <strong className="price-number">
            {loading
              ? "Calculating..."
              : predictedPrice !== null
                ? `₹${Number(predictedPrice).toFixed(2)}`
                : "₹--"}
          </strong>

          <div className="prediction-status">
            <CheckCircle2 size={17} />
            {loading ? "Processing prediction" : "Prediction complete"}
          </div>
        </motion.div>
      </div>

      <div className="prediction-insights">
        <motion.article
          className="insight-tile"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <div className="insight-tile-icon blue">
            <Box size={21} />
          </div>

          <div className="insight-tile-content">
            <span>Product volume</span>

            <div>
              <strong>
                {volume !== null ? Number(volume).toFixed(0) : "--"}
              </strong>
              <small>cm³</small>
            </div>
          </div>
        </motion.article>

        <motion.article
          className="insight-tile"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <div className="insight-tile-icon green">
            <Scale size={21} />
          </div>

          <div className="insight-tile-content">
            <span>Product density</span>

            <div>
              <strong>
                {density !== null ? Number(density).toFixed(4) : "--"}
              </strong>
              <small>g/cm³</small>
            </div>
          </div>
        </motion.article>
      </div>

      <div className="prediction-note">
        The result is an estimate based on patterns learned from the Olist
        e-commerce dataset.
      </div>
    </motion.section>
  );
}

export default PredictionCard;