import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const API_URL = "http://127.0.0.1:8000";

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    const endpoint =
      mode === "login"
        ? "/api/auth/login"
        : "/api/auth/register";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Something went wrong"
        );
      }

      if (mode === "login") {
        localStorage.setItem(
          "greenpulse_token",
          data.token
        );

        localStorage.setItem(
          "greenpulse_user",
          JSON.stringify(data.user)
        );

        setMessage(`Welcome back, ${data.user.username} 🌱`);
        navigate("/dashboard");
      } else {
        setMessage(
          "Account created successfully. You can now log in."
        );

        setMode("login");
        setPassword("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>🌱</span>
          GREEN<span>PULSE</span>
        </div>

        <div className="auth-heading">
          <span className="auth-label">
            {mode === "login"
              ? "WELCOME BACK"
              : "JOIN GREENPULSE"}
          </span>

          <h1>
            {mode === "login"
              ? "Your impact."
              : "Start your journey."}
          </h1>

          <p>
            {mode === "login"
              ? "Continue where you left off."
              : "Create your GreenPulse account."}
          </p>
        </div>

        <form onSubmit={submit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              minLength={3}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              minLength={8}
              required
            />
          </label>

          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message success">
              {message}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log in →"
                : "Create account →"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              Don't have an account?
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                  setMessage("");
                }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default Auth;