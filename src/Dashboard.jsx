import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_BASE = "https://greenpulse-web-tc0g.onrender.com";

const FOREST_IMAGE =
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85";

const LEAF_IMAGE =
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85";

const levelData = [
  { min: 0, name: "Eco Starter", icon: "🌱" },
  { min: 100, name: "Green Explorer", icon: "🌿" },
  { min: 250, name: "Eco Learner", icon: "🍃" },
  { min: 500, name: "Climate Champion", icon: "🌎" },
  { min: 1000, name: "Planet Protector", icon: "🛡️" },
  { min: 2000, name: "Green Leader", icon: "👑" },
  { min: 5000, name: "Earth Guardian", icon: "🌳" },
];

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getLevel(points) {
  let current = levelData[0];

  for (const level of levelData) {
    if (points >= level.min) {
      current = level;
    }
  }

  return current;
}

function getNextLevel(points) {
  for (const level of levelData) {
    if (level.min > points) {
      return level;
    }
  }

  return null;
}

function StatCard({
  icon,
  title,
  value,
  unit,
  description,
  accent = "green",
  onClick,
}) {
  return (
    <button
      className={`dash-stat-card ${accent}`}
      onClick={onClick}
      type="button"
    >
      <div className="dash-stat-top">
        <span className="dash-stat-icon">{icon}</span>
        <span className="dash-stat-arrow">↗</span>
      </div>

      <div className="dash-stat-title">{title}</div>

      <div className="dash-stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>

      <div className="dash-stat-description">{description}</div>
    </button>
  );
}

function QuickAction({ icon, title, text, onClick }) {
  return (
    <button className="dash-quick-action" onClick={onClick} type="button">
      <span className="dash-action-icon">{icon}</span>

      <span className="dash-action-copy">
        <strong>{title}</strong>
        <small>{text}</small>
      </span>

      <span className="dash-action-arrow">→</span>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [user, setUser] = useState(null);
  const [activePeriod, setActivePeriod] = useState("30D");
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("greenpulse_token");

  const loadDashboard = useCallback(async () => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setError("");

      const [dashboardResponse, meResponse] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard?token=${encodeURIComponent(token)}`),
        fetch(`${API_BASE}/api/me?token=${encodeURIComponent(token)}`),
      ]);

      if (dashboardResponse.status === 401 || meResponse.status === 401) {
        localStorage.removeItem("greenpulse_token");
        localStorage.removeItem("greenpulse_user");
        navigate("/auth");
        return;
      }

      if (!dashboardResponse.ok) {
        throw new Error("Could not load your dashboard.");
      }

      const dashboardData = await dashboardResponse.json();

      let meData = null;

      if (meResponse.ok) {
        meData = await meResponse.json();
      }

      setDashboard(dashboardData);
      setUser(meData);
      setNow(new Date());
    } catch (err) {
      setError(err.message || "Unable to connect to GreenPulse.");
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    loadDashboard();

    const refresh = () => {
      loadDashboard();
      setNow(new Date());
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("greenpulse:data-updated", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("greenpulse:data-updated", refresh);
    };
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const data = dashboard || {};

    return {
      points: number(data.points),
      streak: number(data.streak),
      level: number(data.level, 1),
      forestActions: number(data.forest_actions),
      completedDays: number(data.completed_days),
      calculations: number(data.total_calculations),
      totalCO2: number(data.total_co2e),
      savedCO2: number(data.total_saved_co2e),
    };
  }, [dashboard]);

  const username =
    user?.username ||
    user?.name ||
    JSON.parse(localStorage.getItem("greenpulse_user") || "null")?.username ||
    "Green Explorer";

  const level = getLevel(stats.points);
  const nextLevel = getNextLevel(stats.points);

  const levelProgress = nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((stats.points - level.min) /
            (nextLevel.min - level.min)) *
            100
        )
      )
    : 100;

  const trees = Math.max(
    0,
    Math.floor(stats.forestActions / 5)
  );

  const footprintScore = Math.min(
    100,
    Math.round((Math.min(stats.completedDays, 30) / 30) * 100)
  );

  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 18
      ? "Good afternoon"
      : "Good evening";

  const chartValues =
    activePeriod === "7D"
      ? [28, 42, 35, 57, 48, 69, 82]
      : activePeriod === "1Y"
      ? [32, 38, 45, 42, 54, 61, 72, 67, 78, 71, 85, 91]
      : [32, 45, 39, 57, 51, 68, 61, 79, 73, 88];

  if (loading) {
    return (
      <div className="dashboard-page dash-loading-screen">
        <div className="dash-loader">
          <div>🌱</div>
          <strong>Growing your dashboard...</strong>
          <span>Syncing with GreenPulse</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page dash-loading-screen">
        <div className="dash-loader dash-error-state">
          <div>🌧️</div>
          <strong>Dashboard unavailable</strong>
          <span>{error}</span>

          <button type="button" onClick={loadDashboard}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dash-background-glow dash-glow-one" />
      <div className="dash-background-glow dash-glow-two" />

      <header className="dash-topbar">
        <div className="dash-mobile-brand">
          <span>🌿</span>
          GREEN<span>PULSE</span>
        </div>

        <div className="dash-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search GreenPulse..."
            aria-label="Search"
          />
        </div>

        <div className="dash-top-actions">
          <button
            className="dash-icon-button"
            type="button"
            title="Notifications"
          >
            🔔
            <i />
          </button>

          <button
            className="dash-profile"
            type="button"
            onClick={() => navigate("/settings")}
          >
            <span className="dash-profile-avatar">🌱</span>

            <span className="dash-profile-info">
              <strong>{username}</strong>
              <small>{level.name}</small>
            </span>

            <span>⌄</span>
          </button>
        </div>
      </header>

      <main className="dash-content">
        <section className="dash-hero">
          <div className="dash-hero-copy">
            <div className="dash-eyebrow">
              WELCOME BACK <span>🌿</span>
            </div>

            <h1>
              {greeting}, <span>{username}</span>.
            </h1>

            <p>
              Your actions today create a greener tomorrow.
              <br />
              Keep growing your impact.
            </p>

            <div className="dash-hero-level">
              <div className="dash-level-icon">{level.icon}</div>

              <div className="dash-level-copy">
                <strong>{level.name}</strong>
                <span>{stats.points.toLocaleString()} eco points</span>
              </div>

              <div className="dash-level-progress">
                <div>
                  <span style={{ width: `${levelProgress}%` }} />
                </div>

                <small>
                  {nextLevel
                    ? `${Math.max(
                        0,
                        nextLevel.min - stats.points
                      )} points to ${nextLevel.name}`
                    : "Maximum level reached"}
                </small>
              </div>
            </div>
          </div>

          <div
            className="dash-forest-card"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(1,23,16,.92), rgba(1,23,16,.22)), url("${FOREST_IMAGE}")`,
            }}
          >
            <div className="dash-forest-card-content">
              <span className="dash-mini-label">
                YOUR GREEN JOURNEY
              </span>

              <h2>
                Grow your forest.
                <br />
                Protect your future.
              </h2>

              <p>
                Every sustainable action gives your
                virtual forest more life.
              </p>

              <button
                type="button"
                onClick={() => navigate("/forest")}
              >
                Enter My Forest <span>→</span>
              </button>
            </div>

            <div className="dash-forest-orb">🌳</div>
          </div>
        </section>

        <section className="dash-stat-grid">
          <StatCard
            icon="🍃"
            title="Carbon Saved"
            value={stats.savedCO2.toFixed(1)}
            unit="kg"
            description="CO₂e saved through your actions"
            onClick={() => navigate("/progress")}
          />

          <StatCard
            icon="🌳"
            title="Trees Grown"
            value={trees}
            description="Virtual trees in your journey"
            accent="tree"
            onClick={() => navigate("/forest")}
          />

          <StatCard
            icon="⭐"
            title="Points Earned"
            value={stats.points.toLocaleString()}
            description="Lifetime GreenPulse points"
            accent="gold"
            onClick={() => navigate("/rewards")}
          />

          <StatCard
            icon="🔥"
            title="Green Streak"
            value={stats.streak}
            unit="days"
            description="Consecutive eco days"
            accent="fire"
            onClick={() => navigate("/challenges")}
          />
        </section>

        <section className="dash-main-grid">
          <article className="dash-panel dash-carbon-panel">
            <div className="dash-panel-header">
              <div>
                <span className="dash-section-kicker">IMPACT</span>
                <h2>Your Carbon Footprint</h2>
              </div>

              <div className="dash-periods">
                {["7D", "30D", "1Y"].map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={
                      activePeriod === period ? "active" : ""
                    }
                    onClick={() => setActivePeriod(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-carbon-body">
              <div className="dash-ring">
                <div
                  className="dash-ring-inner"
                  style={{
                    "--ring-progress": `${footprintScore}%`,
                  }}
                >
                  <strong>{footprintScore}%</strong>
                  <span>eco progress</span>
                </div>
              </div>

              <div className="dash-chart-area">
                <div className="dash-chart">
                  {chartValues.map((value, index) => (
                    <div className="dash-chart-column" key={index}>
                      <div
                        className="dash-chart-bar"
                        style={{
                          height: `${value}%`,
                        }}
                      >
                        <span />
                      </div>

                      <small>
                        {activePeriod === "1Y"
                          ? [
                              "J",
                              "F",
                              "M",
                              "A",
                              "M",
                              "J",
                              "J",
                              "A",
                              "S",
                              "O",
                              "N",
                              "D",
                            ][index]
                          : activePeriod === "7D"
                          ? [
                              "M",
                              "T",
                              "W",
                              "T",
                              "F",
                              "S",
                              "S",
                            ][index]
                          : [
                              "1",
                              "4",
                              "7",
                              "10",
                              "13",
                              "16",
                              "19",
                              "22",
                              "25",
                              "28",
                            ][index]}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dash-carbon-side">
                <div>
                  <span>Total footprint</span>
                  <strong>{stats.totalCO2.toFixed(1)} kg</strong>
                </div>

                <div>
                  <span>Completed days</span>
                  <strong>{stats.completedDays}</strong>
                </div>

                <div>
                  <span>Calculations</span>
                  <strong>{stats.calculations}</strong>
                </div>
              </div>
            </div>
          </article>

          <aside className="dash-side-panel">
            <div className="dash-mini-profile">
              <div className="dash-big-avatar">🌱</div>

              <div>
                <strong>{username}</strong>
                <span>
                  <i /> {level.name}
                </span>
              </div>
            </div>

            <div className="dash-quick-box">
              <div className="dash-panel-header compact">
                <div>
                  <span className="dash-section-kicker">
                    SHORTCUTS
                  </span>
                  <h2>Quick Actions</h2>
                </div>
              </div>

              <QuickAction
                icon="🧮"
                title="Calculate Footprint"
                text="Record today's impact"
                onClick={() => navigate("/calculator")}
              />

              <QuickAction
                icon="🌲"
                title="View My Forest"
                text="See your trees grow"
                onClick={() => navigate("/forest")}
              />

              <QuickAction
                icon="🎯"
                title="Challenges"
                text="Complete eco missions"
                onClick={() => navigate("/challenges")}
              />

              <QuickAction
                icon="🏆"
                title="Check Rewards"
                text="View points & badges"
                onClick={() => navigate("/rewards")}
              />

              <QuickAction
                icon="🧘"
                title="Focus Session"
                text="Take a green break"
                onClick={() => navigate("/focus")}
              />
            </div>
          </aside>
        </section>

        <section className="dash-lower-grid">
          <article className="dash-panel dash-weekly">
            <div className="dash-panel-header">
              <div>
                <span className="dash-section-kicker">
                  ACTIVITY
                </span>
                <h2>Your Green Journey</h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("/progress")}
              >
                View details →
              </button>
            </div>

            <div className="dash-week-bars">
              {[42, 56, 49, 63, 51, 71, 84].map(
                (height, index) => (
                  <div className="dash-week-day" key={index}>
                    <div className="dash-week-bar-wrap">
                      <span style={{ height: `${height}%` }} />
                    </div>

                    <small>
                      {
                        [
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                          "Sun",
                        ][index]
                      }
                    </small>
                  </div>
                )
              )}
            </div>

            <div className="dash-week-message">
              <span>
                {stats.streak > 0 ? "🔥" : "🌱"}
              </span>

              <div>
                <strong>
                  {stats.streak > 0
                    ? "You're on a green streak!"
                    : "Start your green streak!"}
                </strong>

                <small>
                  {stats.streak > 0
                    ? `${stats.streak} consecutive eco day${
                        stats.streak === 1 ? "" : "s"
                      } completed.`
                    : "Complete an eco activity to begin."}
                </small>
              </div>
            </div>
          </article>

          <article className="dash-panel">
            <div className="dash-panel-header">
              <div>
                <span className="dash-section-kicker">
                  MISSIONS
                </span>
                <h2>Current Challenges</h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("/challenges")}
              >
                View all →
              </button>
            </div>

            <div className="dash-challenges">
              <div className="dash-challenge">
                <span className="challenge-icon">💧</span>

                <div>
                  <strong>Green Start</strong>
                  <small>
                    Complete today's eco calculation
                  </small>

                  <div className="challenge-progress">
                    <span
                      style={{
                        width:
                          stats.completedDays > 0
                            ? "100%"
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <b>
                  {stats.completedDays > 0 ? "1/1" : "0/1"}
                </b>
              </div>

              <div className="dash-challenge">
                <span className="challenge-icon">🔥</span>

                <div>
                  <strong>7-Day Warrior</strong>
                  <small>Build a consistent green streak</small>

                  <div className="challenge-progress">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          (stats.streak / 7) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <b>{Math.min(stats.streak, 7)}/7</b>
              </div>

              <div className="dash-challenge">
                <span className="challenge-icon">🌳</span>

                <div>
                  <strong>Forest Builder</strong>
                  <small>Grow your virtual forest</small>

                  <div className="challenge-progress">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          (trees / 20) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <b>{Math.min(trees, 20)}/20</b>
              </div>
            </div>
          </article>

          <article className="dash-panel dash-rewards">
            <div className="dash-panel-header">
              <div>
                <span className="dash-section-kicker">
                  ACHIEVEMENTS
                </span>

                <h2>Your Rewards</h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("/rewards")}
              >
                View all →
              </button>
            </div>

            <div className="dash-reward-list">
              <div
                className={`dash-reward ${
                  stats.completedDays >= 1 ? "unlocked" : ""
                }`}
              >
                <span>🌱</span>

                <div>
                  <strong>First Footprint</strong>
                  <small>Begin your green journey</small>
                </div>

                <b>
                  {stats.completedDays >= 1 ? "✓" : "🔒"}
                </b>
              </div>

              <div
                className={`dash-reward ${
                  stats.completedDays >= 7 ? "unlocked" : ""
                }`}
              >
                <span>🔥</span>

                <div>
                  <strong>Day Explorer</strong>
                  <small>Complete 7 eco days</small>
                </div>

                <b>
                  {stats.completedDays >= 7 ? "✓" : "🔒"}
                </b>
              </div>

              <div
                className={`dash-reward ${
                  stats.points >= 500 ? "unlocked" : ""
                }`}
              >
                <span>⭐</span>

                <div>
                  <strong>Climate Champion</strong>
                  <small>Reach 500 points</small>
                </div>

                <b>
                  {stats.points >= 500 ? "✓" : "🔒"}
                </b>
              </div>
            </div>
          </article>
        </section>

        <section
          className="dash-bottom-forest"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(0,20,13,.96), rgba(0,20,13,.4)), url("${LEAF_IMAGE}")`,
          }}
        >
          <div>
            <span>YOUR DIGITAL FOREST</span>

            <h2>
              Small steps.
              <br />
              <em>Big impact.</em>
            </h2>

            <p>
              Your sustainable actions aren't just numbers.
              They're helping your forest come alive.
            </p>

            <button
              type="button"
              onClick={() => navigate("/forest")}
            >
              Enter the Forest <span>🌲 →</span>
            </button>
          </div>

          <div className="dash-bottom-trees">
            🌲 🌳 🌲
          </div>
        </section>

        <footer className="dash-footer">
          GREEN PULSE CSEAIML
          <span>•</span>
          Digital Green Challenge 2026
          <span>•</span>
          Grow responsibly. 🌍
        </footer>
      </main>
    </div>
  );
}