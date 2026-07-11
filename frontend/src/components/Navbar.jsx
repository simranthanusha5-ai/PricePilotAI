import {
  BarChart3,
  BrainCircuit,
  Home,
  Info,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function Navbar() {
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
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <Home size={18} />
          Home
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <BarChart3 size={18} />
          Analytics
        </NavLink>

        <NavLink
          to="/model"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <BrainCircuit size={18} />
          AI Model
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <Info size={18} />
          About
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;