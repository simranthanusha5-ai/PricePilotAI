import { useState } from "react";
import axios from "axios";

import InputForm from "./components/InputForm";
import PredictionCard from "./components/PredictionCard";
import StatsCards from "./components/StatsCards";
import PriceChart from "./components/PriceChart";

import "./components/Dashboard.css";

const initialForm = {
  freight_value: "20",
  product_weight_g: "500",
  product_length_cm: "20",
  product_height_cm: "10",
  product_width_cm: "15",
  product_photos_qty: "3",
  product_category_encoded: "10",
  purchase_month: "7",
  purchase_dayofweek: "2",
  delivery_days: "8",
  seller_encoded: "100",
};

function Dashboard() {
  const [formData, setFormData] = useState(initialForm);

  const [result, setResult] = useState({
    predicted_price: 218.2,
    product_volume_cm3: 3000,
    product_density: 0.1666,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFormData(initialForm);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const hasEmptyField = Object.values(formData).some(
      (value) => String(value).trim() === ""
    );

    if (hasEmptyField) {
      setError("Please complete all fields before predicting.");
      return;
    }

    const payload = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        Number(value),
      ])
    );

    try {
      setLoading(true);

      const response = await axios.post(
        "http://127.0.0.1:8000/predict-price",
        payload
      );

      setResult(response.data);
    } catch (requestError) {
      console.error(requestError);

      setError(
        "Prediction failed. Check that the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-background" />
      <div className="dashboard-glow dashboard-glow-one" />
      <div className="dashboard-glow dashboard-glow-two" />

      <main className="dashboard-content">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Intelligent pricing platform</span>

            <h1>
              Make smarter pricing decisions with machine learning.
            </h1>

            <p>
              Enter product, shipping, delivery and seller details to receive
              an estimated selling price from the tuned XGBoost model.
            </p>
          </div>

          <div className="hero-summary">
            <span>Model performance</span>
            <strong>R² 0.703</strong>
            <small>Tuned XGBoost regressor</small>
          </div>
        </section>

        <section className="prediction-layout">
          <InputForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
            loading={loading}
            error={error}
          />

          <PredictionCard result={result} loading={loading} />
        </section>

        <section className="dashboard-section">
          <div className="section-intro">
            <div>
              <span className="eyebrow">Performance</span>
              <h2>Model evaluation</h2>
            </div>

            <p>
              The final model was evaluated using R², mean absolute error and
              root mean squared error.
            </p>
          </div>

          <StatsCards />
        </section>

        <section className="dashboard-section">
          <div className="section-intro">
            <div>
              <span className="eyebrow">Analytics</span>
              <h2>Estimated price trend</h2>
            </div>

            <p>
              A visual summary of estimated pricing movement across the sample
              period.
            </p>
          </div>

          <PriceChart />
        </section>
      </main>
    </div>
  );
}

export default Dashboard;