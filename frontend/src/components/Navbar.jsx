import {
  BarChart3,
  BrainCircuit,
  Home,
  Info,
  LineChart,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function Navbar() {
  const linkClass = ({ isActive }) =>
    `nav-item ${isActive ? "active" : ""}`;

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">
          <Sparkles size={22} />
        </div>

        <div>
          <h1>
            PricePilot <span>AI</span>
          </h1>
          <p>Intelligent pricing platform</p>
        </div>
      </div>

      <nav className="navbar-links">
        <NavLink to="/" end className={linkClass}>
          <Home size={18} />
          Home
        </NavLink>

        <NavLink to="/analytics" className={linkClass}>
          <BarChart3 size={18} />
          Analytics
        </NavLink>

        <NavLink to="/forecast" className={linkClass}>
          <LineChart size={18} />
          Forecast
        </NavLink>

        <NavLink to="/model" className={linkClass}>
          <BrainCircuit size={18} />
          AI Model
        </NavLink>
        <NavLink to="/competitors">
  Competitors
</NavLink>

        <NavLink to="/about" className={linkClass}>
          <Info size={18} />
          About
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;