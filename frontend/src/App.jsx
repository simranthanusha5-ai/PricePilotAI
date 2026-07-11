import { useState } from "react";
import axios from "axios";
import "./App.css";

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

const fields = [
  {
    name: "freight_value",
    label: "Freight Value",
    unit: "₹",
    icon: "↗",
  },
  {
    name: "product_weight_g",
    label: "Product Weight",
    unit: "g",
    icon: "◉",
  },
  {
    name: "product_length_cm",
    label: "Length",
    unit: "cm",
    icon: "↔",
  },
  {
    name: "product_height_cm",
    label: "Height",
    unit: "cm",
    icon: "↕",
  },
  {
    name: "product_width_cm",
    label: "Width",
    unit: "cm",
    icon: "◇",
  },
  {
    name: "product_photos_qty",
    label: "Product Photos",
    unit: "qty",
    icon: "▣",
  },
  {
    name: "product_category_encoded",
    label: "Category ID",
    unit: "",
    icon: "◆",
  },
  {
    name: "purchase_month",
    label: "Purchase Month",
    unit: "1–12",
    icon: "□",
    min: 1,
    max: 12,
  },
  {
    name: "purchase_dayofweek",
    label: "Day of Week",
    unit: "0–6",
    icon: "◷",
    min: 0,
    max: 6,
  },
  {
    name: "delivery_days",
    label: "Delivery Days",
    unit: "",
    icon: "▰",
  },
  {
    name: "seller_encoded",
    label: "Seller ID",
    unit: "",
    icon: "○",
    wide: true,
  },
];

function App() {
  const [formData, setFormData] = useState(initialForm);
  const [result, setResult] = useState({
    predicted_price: 218.2,
    product_volume_cm3: 3000,
    product_density: 0.1666,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setResult(null);
    setError("");
  };

  const predictPrice = async (event) => {
    event.preventDefault();
    setError("");

    const hasEmptyValue = Object.values(formData).some(
      (value) => value.trim() === ""
    );

    if (hasEmptyValue) {
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
        "Could not connect to FastAPI. Make sure the backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-overlay" />

      <nav className="topbar">
        <div className="brand">
          <div className="brand-symbol">P</div>

          <div className="brand-copy">
            <strong>
              PricePilot <span>AI</span>
            </strong>
          </div>

          <div className="model-label">ML PRICE PREDICTION</div>
        </div>

        <div className="nav-links">
          <button className="nav-link active">Dashboard</button>
          <button className="nav-link">Analytics</button>
          <button className="nav-link">History</button>
          <button className="nav-link">About Model</button>
        </div>
      </nav>

      <section className="dashboard">
        <form className="panel input-panel" onSubmit={predictPrice}>
          <header className="panel-header">
            <div className="header-icon">⌁</div>

            <div>
              <h2>Product & Order Details</h2>
              <p>Provide accurate details for the best prediction</p>
            </div>

            <button
              type="button"
              className="reset-button"
              onClick={resetForm}
            >
              ↻ Reset
            </button>
          </header>

          <div className="input-grid">
            {fields.map((field) => (
              <label
                className={`field ${field.wide ? "field-wide" : ""}`}
                key={field.name}
              >
                <span className="field-label">
                  {field.label}
                  {field.unit && (
                    <small>
                      {field.unit === "₹" ? ` (${field.unit})` : ""}
                    </small>
                  )}
                </span>

                <div className="input-wrap">
                  <span className="input-icon">{field.icon}</span>

                  <input
                    type="number"
                    step="any"
                    min={field.min ?? 0}
                    max={field.max}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                  />

                  {field.unit && field.unit !== "₹" && (
                    <span className="input-unit">{field.unit}</span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="predict-button"
            disabled={loading}
          >
            <div className="predict-icon">✦</div>

            <div className="predict-copy">
              <strong>
                {loading ? "Calculating Price..." : "Predict Price"}
              </strong>
              <span>Get an AI-powered price recommendation</span>
            </div>

            <div className="predict-arrow">
              {loading ? <span className="spinner" /> : "→"}
            </div>
          </button>
        </form>

        <section className="panel result-panel">
          <header className="panel-header result-header">
            <div className="header-icon result-icon">↗</div>

            <div>
              <h2>Prediction Result</h2>
              <p>AI-powered price recommendation</p>
            </div>

            <div className="model-chip">Model: XGBoost</div>
          </header>

          <div className="result-visual">
            <div className="wave wave-one" />
            <div className="wave wave-two" />
            <div className="wave wave-three" />

            <div className="price-orbit">
              <div className="orbit-glow" />

              <div className="price-content">
                <span>Recommended Price</span>

                <strong>
                  ₹
                  {result
                    ? Number(result.predicted_price).toFixed(2)
                    : "--"}
                </strong>

                <div className="optimal-chip">
                  <span>✓</span>
                  Optimal Price
                </div>
              </div>
            </div>
          </div>

          <div className="recommendation-note">
            <div className="note-symbol">✦</div>
            <p>
              This recommendation is generated using historical order,
              product, delivery and seller information.
            </p>
          </div>

          <div className="insights-title">
            <span>◉</span>
            Additional Insights
          </div>

          <div className="insight-grid">
            <article className="insight-card volume-card">
              <div>
                <span>Volume</span>
                <strong>
                  {result
                    ? Number(result.product_volume_cm3).toFixed(0)
                    : "--"}
                </strong>
                <small>cm³</small>
              </div>

              <div className="insight-symbol cube-symbol">◇</div>
            </article>

            <article className="insight-card density-card">
              <div>
                <span>Density</span>
                <strong>
                  {result
                    ? Number(result.product_density).toFixed(3)
                    : "--"}
                </strong>
                <small>g/cm³</small>
              </div>

              <div className="insight-symbol">⚖</div>
            </article>
          </div>
        </section>
      </section>

      <footer className="footer">
        <span>PricePilot AI</span>
        <span>•</span>
        <span>XGBoost Price Intelligence Platform</span>
      </footer>
    </main>
  );
}

export default App;