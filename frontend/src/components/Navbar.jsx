import {
  BarChart3,
  BrainCircuit,
  Home,
  Info,
  History,
  LineChart,
  LogOut,
  Package,
  Sparkles,
  User,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("pricepilot_user") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("pricepilot_token");
    localStorage.removeItem("pricepilot_user");
    navigate("/login");
  };

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
        <NavLink to="/revenue" className={linkClass}>
  Revenue
</NavLink>

        <NavLink to="/competitors" className={linkClass}>
          Competitors
        </NavLink>

        <NavLink to="/products" className={linkClass}>
          <Package size={18} />
          Products
        </NavLink>
        <NavLink to="/history" className={linkClass}>
  <History size={18} />
  History
</NavLink>

        <NavLink to="/about" className={linkClass}>
          <Info size={18} />
          About
        </NavLink>
      </nav>

      <div className="navbar-user">
        {user && (
          <div className="navbar-user-name">
            <User size={18} />
            {user.name}
          </div>
        )}

        <button
          className="navbar-logout"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;