import { useState } from "react";
import axios from "axios";
import { ArrowRight, BarChart3, BrainCircuit, Server } from "lucide-react";

import InputForm from "./components/InputForm";
import PredictionCard from "./components/PredictionCard";
import StatsCards from "./components/StatsCards";
import PriceChart from "./components/PriceChart";

import "./components/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
        `${API_URL}/predict-price`,
        payload
      );

      setResult(response.data);
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.response?.data?.detail ||
          requestError.message ||
          "Prediction failed. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document
      .getElementById("price-prediction-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-background" />
      <div className="dashboard-glow dashboard-glow-one" />
      <div className="dashboard-glow dashboard-glow-two" />

      <main className="dashboard-content">
      

        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="eyebrow">
              Intelligent pricing platform
            </span>

            <h1>
              Smarter pricing.
              <br />
              Better revenue.
            </h1>

            <p>
              Predict product prices, forecast demand, compare
              competitors and optimize revenue from one
              AI-powered platform.
            </p>

            <div className="home-hero-actions">
              <button
                className="primary-action"
                type="button"
                onClick={scrollToForm}
              >
                Start prediction
                <ArrowRight size={18} />
              </button>

              <a
                className="secondary-action"
                href="/analytics"
              >
                View analytics
              </a>
            </div>
          </div>

          <div className="home-hero-stats">
            <article>
              <div className="home-stat-icon">
                <BrainCircuit size={22} />
              </div>

              <span>Model performance</span>
              <strong>R² 0.703</strong>
              <small>Tuned XGBoost regressor</small>
            </article>

            <article>
              <div className="home-stat-icon">
                <BarChart3 size={22} />
              </div>

              <span>AI modules</span>
              <strong>4</strong>
              <small>
                Pricing, demand, revenue and competitors
              </small>
            </article>

            <article>
              <div className="home-stat-icon">
                <Server size={22} />
              </div>

              <span>API status</span>
              <strong>Online</strong>
              <small>FastAPI backend connected</small>
            </article>
          </div>
        </section>

        <section
          className="prediction-layout"
          id="price-prediction-form"
        >
          <InputForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
            loading={loading}
            error={error}
          />

          <PredictionCard
            result={result}
            loading={loading}
          />
        </section>

        <section className="dashboard-section">
          <div className="section-intro">
            <div>
              <span className="eyebrow">Performance</span>
              <h2>Model evaluation</h2>
            </div>

            <p>
              Review the final model using R², mean absolute
              error and root mean squared error.
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
              Explore pricing movement across the sample period.
            </p>
          </div>

          <PriceChart />
        </section>
      </main>
    </div>
  );
}

export default Dashboard;