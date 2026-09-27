import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getToken, getUser, logout } from "./auth.js";

function Dashboard() {
  const user = getUser();

  const [stats, setStats] = useState({
  points: 0,
  streak: 0,
  level: 1,
  forest_actions: 0,
});

useEffect(() => {
  const token = getToken();

  if (!token) {
    logout();
    return;
  }

  fetch(
    `https://greenpulse-web-tc0g.onrender.com/api/dashboard?token=${encodeURIComponent(token)}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }

      return response.json();
    })
    .then((data) => {
      setStats(data);
    })
    .catch((error) => {
      console.error("Dashboard error:", error);
    });
}, []);

  return (
    <main className="dashboard-page">
      <header className="dashboard-topbar">
        <Link to="/" className="dashboard-brand">
          <span>🌱</span>
          GREEN<span>PULSE</span>
        </Link>

        <div className="dashboard-account">
          <span>🌱 {user?.username || "User"}</span>

          {user?.role === "admin" && (
            <span className="dashboard-admin">ADMIN</span>
          )}

          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">
            YOUR GREENPULSE
          </span>

          <h1>
            Welcome back,
            <br />
            <span>{user?.username || "Explorer"}.</span>
          </h1>

          <p>
            Your everyday actions become measurable impact.
            Keep going and build your streak.
          </p>
        </div>

        <div className="dashboard-impact">
          <span>YOUR IMPACT</span>
          <strong>{stats.points}</strong>
          <small>points</small>
        </div>
      </section>

      <section className="dashboard-stats">
        <article>
          <span>🔥 STREAK</span>
          <strong>{stats.streak}</strong>
          <small>days</small>
        </article>

        <article>
          <span>⭐ POINTS</span>
          <strong>{stats.points}</strong>
          <small>earned</small>
        </article>

        <article>
          <span>🌱 LEVEL</span>
          <strong>{stats.level}</strong>
          <small>Growing</small>
        </article>

        <article>
          <span>🌳 FOREST</span>
          <strong>{stats.forest_actions}</strong>
          <small>actions</small>
        </article>
      </section>

      <section className="dashboard-actions">
        <div className="dashboard-section-heading">
          <span>KEEP MOVING</span>
          <h2>What will you do today?</h2>
        </div>

        <div className="dashboard-grid">
          <Link to="/explore" className="dashboard-card featured">
            <span>🌍</span>
            <h3>Calculate your impact</h3>
            <p>
              Measure the footprint of your everyday choices.
            </p>
            <strong>Start calculating →</strong>
          </Link>

          <div className="dashboard-card">
            <span>🎯</span>
            <h3>Daily challenges</h3>
            <p>
              Small actions. Consistent habits. Real progress.
            </p>
            <strong>Coming next →</strong>
          </div>

          <div className="dashboard-card">
            <span>🌳</span>
            <h3>My Forest</h3>
            <p>
              Watch your actions grow into your own digital ecosystem.
            </p>
            <strong>Coming next →</strong>
          </div>

          <div className="dashboard-card">
            <span>⏱️</span>
            <h3>Focus with Pomodoro</h3>
            <p>
              Turn focused time into another part of your journey.
            </p>
            <strong>Coming next →</strong>
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        GREEN PULSE · BUILDING BETTER HABITS, ONE ACTION AT A TIME.
      </footer>
    </main>
  );
}

export default Dashboard;