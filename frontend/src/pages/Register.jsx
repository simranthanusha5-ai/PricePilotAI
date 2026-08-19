import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

console.log("PRICEPILOT API:", API_URL);
function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
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
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

    if (!response.ok) {
  let message = "Registration failed.";

  if (typeof data.detail === "string") {
    message = data.detail;
  } else if (Array.isArray(data.detail)) {
    message = data.detail
      .map((item) => item.msg)
      .join(", ");
  }

  throw new Error(message);
}

      navigate("/login");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to register."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">
          Create account
        </span>

        <h1>Register</h1>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <input
            name="name"
            placeholder="Full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {error && (
            <div className="forecast-error">
              {error}
            </div>
          )}

          <button
            className="primary-action"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Account"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Register;