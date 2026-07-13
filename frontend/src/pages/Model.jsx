import { motion } from "framer-motion";
import {
  BrainCircuit,
  CheckCircle2,
  Database,
  GitBranch,
  Layers3,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const pipelineSteps = [
  {
    icon: Database,
    title: "Data preparation",
    text: "Merged orders, order items and product datasets from Olist.",
  },
  {
    icon: Layers3,
    title: "Feature engineering",
    text: "Created volume, density, date, delivery, category and seller features.",
  },
  {
    icon: SlidersHorizontal,
    title: "Hyperparameter tuning",
    text: "Used RandomizedSearchCV with 3-fold cross-validation.",
  },
  {
    icon: BrainCircuit,
    title: "Final model",
    text: "Selected the tuned XGBoost regressor for deployment.",
  },
];

const metrics = [
  {
    label: "R² score",
    value: "0.703",
    text: "Explained variance",
    icon: TrendingUp,
    tone: "blue",
  },
  {
    label: "MAE",
    value: "31.84",
    text: "Mean absolute error",
    icon: CheckCircle2,
    tone: "green",
  },
  {
    label: "RMSE",
    value: "103.74",
    text: "Root mean squared error",
    icon: GitBranch,
    tone: "purple",
  },
];

const features = [
  "Freight value",
  "Product weight",
  "Length, width and height",
  "Product photos",
  "Product volume",
  "Product density",
  "Product category",
  "Purchase month",
  "Purchase day of week",
  "Delivery days",
  "Seller encoding",
];

function Model() {
  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Machine learning</span>

          <h1>How the pricing model works.</h1>

          <p>
            PricePilot AI uses a tuned XGBoost regression model trained on the
            Olist e-commerce dataset to estimate product prices from product,
            seller, delivery and order information.
          </p>
        </div>
      </section>

      <section className="model-metrics-grid">
        {metrics.map(({ label, value, text, icon: Icon, tone }, index) => (
          <motion.article
            className="model-metric-card"
            key={label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <div className={`model-metric-icon ${tone}`}>
              <Icon size={22} />
            </div>

            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{text}</small>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="dashboard-card model-section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Training workflow</span>
            <h2>Model development pipeline</h2>
            <p>
              The final prediction system was built through a structured data
              science workflow.
            </p>
          </div>

          <div className="model-pill">
            <Sparkles size={15} />
            XGBoost
          </div>
        </div>

        <div className="pipeline-grid">
          {pipelineSteps.map(({ icon: Icon, title, text }, index) => (
            <motion.article
              className="pipeline-card"
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div className="pipeline-step-number">{index + 1}</div>

              <div className="pipeline-icon">
                <Icon size={22} />
              </div>

              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="model-details-grid">
        <article className="dashboard-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Input features</span>
              <h2>What the model uses</h2>
              <p>
                These features are passed to the trained model during
                prediction.
              </p>
            </div>
          </div>

          <div className="feature-list">
            {features.map((feature) => (
              <div className="feature-item" key={feature}>
                <CheckCircle2 size={17} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Why XGBoost</span>
              <h2>Why this model was selected</h2>
            </div>
          </div>

          <div className="reason-list">
            <div>
              <strong>Handles nonlinear patterns</strong>
              <p>
                Product pricing depends on complex interactions between size,
                freight, category, seller and delivery information.
              </p>
            </div>

            <div>
              <strong>Strong tabular performance</strong>
              <p>
                XGBoost performs well on structured datasets with mixed feature
                types and large sample sizes.
              </p>
            </div>

            <div>
              <strong>Better than the baseline</strong>
              <p>
                The tuned model significantly improved over Linear Regression,
                increasing R² from 0.1922 to 0.703.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-card hyperparameter-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Best configuration</span>
            <h2>Tuned hyperparameters</h2>
            <p>
              These values produced the strongest validation result during
              RandomizedSearchCV.
            </p>
          </div>
        </div>

        <div className="hyperparameter-grid">
          <div>
            <span>n_estimators</span>
            <strong>500</strong>
          </div>

          <div>
            <span>max_depth</span>
            <strong>10</strong>
          </div>

          <div>
            <span>learning_rate</span>
            <strong>0.1</strong>
          </div>

          <div>
            <span>subsample</span>
            <strong>1.0</strong>
          </div>

          <div>
            <span>colsample_bytree</span>
            <strong>0.8</strong>
          </div>

          <div>
            <span>min_child_weight</span>
            <strong>3</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Model;