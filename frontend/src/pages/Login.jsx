import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const loginBody = new URLSearchParams();

      loginBody.append("username", formData.email);
      loginBody.append("password", formData.password);

      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: loginBody,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed."
        );
      }

      localStorage.setItem(
        "pricepilot_token",
        data.access_token
      );

      localStorage.setItem(
        "pricepilot_user",
        JSON.stringify(data.user)
      );

      navigate("/");
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.message ||
          "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">
          Secure access
        </span>

        <h1>Welcome back</h1>

        <p>
          Sign in to access PricePilot AI.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>Email</span>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </label>

          {error && (
            <div className="forecast-error">
              {error}
            </div>
          )}

          <button
            className="primary-action"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </p>
      </section>
    </main>
  );
}

export default Login;