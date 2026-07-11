import {
  BrainCircuit,
  Database,
  GitMerge,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

const workflow = [
  {
    icon: Database,
    title: "Data preparation",
    text: "Combined orders, order items, and products datasets from Olist.",
  },
  {
    icon: GitMerge,
    title: "Feature engineering",
    text: "Created volume, density, category, date, delivery, and seller features.",
  },
  {
    icon: SlidersHorizontal,
    title: "Model tuning",
    text: "Used RandomizedSearchCV with cross-validation to optimize XGBoost.",
  },
  {
    icon: Sparkles,
    title: "Final model",
    text: "The tuned XGBoost regressor achieved an R² score of 0.703.",
  },
];

function Model() {
  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div>
          <span className="eyebrow">AI model</span>
          <h1>How the pricing model works</h1>
          <p>
            The system learns pricing patterns from product, seller, delivery,
            and order characteristics.
          </p>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Model overview</span>
            <h2>Tuned XGBoost regressor</h2>
            <p>
              Selected after comparing Linear Regression and XGBoost using MAE,
              RMSE, and R².
            </p>
          </div>

          <div className="model-pill">
            <BrainCircuit size={16} />
            R² 0.703
          </div>
        </div>

        <div className="workflow-grid">
          {workflow.map(({ icon: Icon, title, text }) => (
            <article className="workflow-card" key={title}>
              <div className="workflow-icon">
                <Icon size={22} />
              </div>

              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Model;