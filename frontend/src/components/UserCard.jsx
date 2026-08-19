import {
  LogOut,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function UserCard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("pricepilot_user") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("pricepilot_token");
    localStorage.removeItem("pricepilot_user");

    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <section className="user-card">
      <div className="user-card-avatar">
        <User size={30} />
      </div>

      <div className="user-card-content">
        <span className="eyebrow">
          Account
        </span>

        <h2>Welcome, {user.name}</h2>

        <div className="user-card-meta">
          <span>
            <Mail size={16} />
            {user.email}
          </span>

          <span>
            <ShieldCheck size={16} />
            {user.role}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="user-card-logout"
        onClick={handleLogout}
      >
        <LogOut size={17} />
        Logout
      </button>
    </section>
  );
}

export default UserCard;