import StatsCards from "../components/StatsCards";
import PriceChart from "../components/PriceChart";

function Analytics() {
  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div>
          <span className="eyebrow">Analytics</span>
          <h1>Model performance and price trends</h1>
          <p>
            Review the tuned model metrics and explore the estimated pricing
            trend.
          </p>
        </div>
      </section>

      <StatsCards />
      <PriceChart />
    </main>
  );
}

export default Analytics;