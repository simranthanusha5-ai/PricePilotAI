import {
  Database,
  Code2,
  BrainCircuit,
  Globe,
} from "lucide-react";

function About() {
  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div>
          <span className="eyebrow">About</span>

          <h1>About PricePilot AI</h1>

          <p>
            PricePilot AI is an intelligent product price prediction platform
            built using Machine Learning, FastAPI, React, and XGBoost.
          </p>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Project Overview</span>

            <h2>Tech Stack</h2>
          </div>
        </div>

        <div className="workflow-grid">

          <article className="workflow-card">
            <div className="workflow-icon">
              <BrainCircuit size={24}/>
            </div>

            <h3>Machine Learning</h3>

            <p>
              XGBoost model trained on the Olist Brazilian E-commerce dataset
              with feature engineering and hyperparameter tuning.
            </p>
          </article>

          <article className="workflow-card">
            <div className="workflow-icon">
              <Code2 size={24}/>
            </div>

            <h3>Backend</h3>

            <p>
              FastAPI REST API serving real-time predictions using the trained
              machine learning model.
            </p>
          </article>

          <article className="workflow-card">
            <div className="workflow-icon">
              <Globe size={24}/>
            </div>

            <h3>Frontend</h3>

            <p>
              React + Vite dashboard providing an interactive interface for
              price prediction and analytics.
            </p>
          </article>

          <article className="workflow-card">
            <div className="workflow-icon">
              <Database size={24}/>
            </div>

            <h3>Dataset</h3>

            <p>
              Olist Brazilian E-Commerce dataset including products, orders,
              sellers and freight information.
            </p>
          </article>

        </div>

        <div style={{marginTop:"40px"}}>
          <a
            href="https://github.com/simranthanusha5-ai/PricePilotAI"
            target="_blank"
            rel="noreferrer"
            className="primary-action"
            style={{
              display:"inline-flex",
              width:"auto",
              alignItems:"center",
              gap:"10px",
              textDecoration:"none"
            }}
          >
            <Code2 size={20} />
            View GitHub Repository
          </a>
        </div>

      </section>
    </main>
  );
}

export default About;