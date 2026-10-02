import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_BASE = "https://greenpulse-web-tc0g.onrender.com";

const SEARCH_ITEMS = [
  {
    name: "Calculator",
    description: "Calculate your carbon footprint",
    path: "/calculator",
    icon: "🧮",
  },
  {
    name: "Forest",
    description: "Grow and explore your digital forest",
    path: "/forest",
    icon: "🌲",
  },
  {
    name: "Challenges",
    description: "Complete today's green challenge",
    path: "/challenges",
    icon: "🎯",
  },
  {
    name: "Rewards",
    description: "View your GreenPulse rewards",
    path: "/rewards",
    icon: "🏆",
  },
  {
    name: "Focus",
    description: "Stay focused while making an impact",
    path: "/focus",
    icon: "🧘",
  },
  {
    name: "Progress",
    description: "View your long-term progress",
    path: "/progress",
    icon: "📈",
  },
  {
    name: "Settings",
    description: "Manage your account",
    path: "/settings",
    icon: "⚙️",
  },
  {
    name: "Feedback",
    description: "Share your thoughts",
    path: "/feedback",
    icon: "💬",
  },
];

const PERIODS = {
  "7D": 7,
  "30D": 30,
  "1Y": 365,
};

function getToken() {
  return localStorage.getItem("greenpulse_token");
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("greenpulse_user") || "{}");
  } catch {
    return {};
  }
}

/*
  The backend may eventually return daily history under different names.
  This normalizer keeps the dashboard flexible without changing the API.
*/
function extractHistory(source) {
  if (!source) return [];

  const candidates = [
    source.daily,
    source.daily_data,
    source.history,
    source.daily_history,
    source.activity,
    source.activity_history,
    source.calculations,
    source.records,
    source.entries,
    source.data,
    source.stats?.daily,
    source.stats?.history,
    source.stats?.daily_history,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate;
    }
  }

  return [];
}

function getRecordDate(record) {
  if (!record || typeof record !== "object") return null;

  const raw =
    record.date ||
    record.day ||
    record.created_at ||
    record.createdAt ||
    record.timestamp ||
    record.datetime;

  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRecordCarbon(record) {
  if (!record || typeof record !== "object") return 0;

  const values = [
    record.total_co2e,
    record.totalCo2e,
    record.total_co2,
    record.totalCo2,
    record.co2e,
    record.co2,
    record.carbon,
    record.carbon_footprint,
    record.carbonFootprint,
    record.footprint,
    record.emission,
    record.emissions,
    record.value,
  ];

  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return Math.max(0, number);
  }

  return 0;
}

function buildChartData(history, period) {
  const days = PERIODS[period];
  const today = new Date();

  const source = history
    .map((record) => {
      const date = getRecordDate(record);
      return {
        date,
        carbon: getRecordCarbon(record),
      };
    })
    .filter((item) => item.date);

  const dailyMap = new Map();

  source.forEach((item) => {
    const key = item.date.toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) || 0) + item.carbon);
  });

  if (period === "1Y") {
    const months = [];

    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );

      const year = date.getFullYear();
      const month = date.getMonth();

      let total = 0;

      dailyMap.forEach((value, key) => {
        const itemDate = new Date(`${key}T00:00:00`);

        if (
          itemDate.getFullYear() === year &&
          itemDate.getMonth() === month
        ) {
          total += value;
        }
      });

      months.push({
        label: date.toLocaleDateString("en-US", {
          month: "short",
        }),
        value: Number(total.toFixed(2)),
      });
    }

    return months;
  }

  const result = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    result.push({
      label:
        period === "7D"
          ? date.toLocaleDateString("en-US", { weekday: "short" })
          : String(date.getDate()),
      value: Number((dailyMap.get(key) || 0).toFixed(2)),
      date: key,
    });
  }

  /*
    For 30 days we keep every day in the data,
    but only label every third day to keep the chart readable.
  */
  if (period === "30D") {
    return result.map((item, index) => ({
      ...item,
      label:
        index % 3 === 0 || index === result.length - 1
          ? item.label
          : "",
    }));
  }

  return result;
}

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [period, setPeriod] = useState("30D");
  const [profileOpen, setProfileOpen] = useState(false);

  const token = getToken();

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const currentToken = getToken();

      if (!currentToken) {
        navigate("/auth");
        return;
      }

      const encodedToken = encodeURIComponent(currentToken);

      const [meResponse, dashboardResponse] = await Promise.all([
        fetch(`${API_BASE}/api/me?token=${encodedToken}`),
        fetch(`${API_BASE}/api/dashboard?token=${encodedToken}`),
      ]);

      if (
        meResponse.status === 401 ||
        dashboardResponse.status === 401
      ) {
        localStorage.removeItem("greenpulse_token");
        localStorage.removeItem("greenpulse_user");
        navigate("/auth");
        return;
      }

      if (!meResponse.ok) {
        throw new Error("Unable to load your account.");
      }

      if (!dashboardResponse.ok) {
        throw new Error("Unable to load dashboard.");
      }

      const meData = await meResponse.json();
      const dashboardData = await dashboardResponse.json();

      const backendUser = meData.user || meData;

      setUser(backendUser);
      setDashboard(dashboardData);

      localStorage.setItem(
        "greenpulse_user",
        JSON.stringify(backendUser)
      );
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const filteredSearch = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return SEARCH_ITEMS;

    return SEARCH_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }, [search]);

  const stats = dashboard?.stats || dashboard || {};

  const storedUser = getStoredUser();

  const username =
    user?.username ||
    storedUser?.username ||
    "Green Explorer";

  const points = Number(
    stats.points ?? user?.points ?? 0
  );

  const streak = Number(
    stats.streak ?? user?.streak ?? 0
  );

  const level = Number(
    stats.level ?? user?.level ?? 1
  );

  const forestActions = Number(
    stats.forest_actions ??
      stats.forestActions ??
      user?.forest_actions ??
      0
  );

  const completedDays = Number(
    stats.completed_days ??
      stats.completedDays ??
      user?.completed_days ??
      0
  );

  const totalCalculations = Number(
    stats.total_calculations ??
      stats.totalCalculations ??
      user?.total_calculations ??
      0
  );

  const totalCo2e = Number(
    stats.total_co2e ??
      stats.totalCo2e ??
      stats.total_footprint ??
      stats.totalFootprint ??
      user?.total_co2e ??
      0
  );

  const savedCo2e = Number(
    stats.total_saved_co2e ??
      stats.totalSavedCo2e ??
      user?.total_saved_co2e ??
      0
  );

  const trees = Math.floor(forestActions / 5);

  const levelProgress = Math.min(
    100,
    Math.max(0, points % 100)
  );

  const footprintProgress = Math.min(
    100,
    Math.round(
      (Math.min(completedDays, 30) / 30) * 100
    )
  );

  const isAdmin =
    String(
      user?.role ||
        storedUser?.role ||
        ""
    ).toLowerCase() === "admin";

  const history = useMemo(
    () => extractHistory(dashboard),
    [dashboard]
  );

  const chartData = useMemo(
    () => buildChartData(history, period),
    [history, period]
  );

  const maxChartValue = Math.max(
    ...chartData.map((item) => item.value),
    0
  );

  function openSearchItem(path) {
    setSearch("");
    setSearchOpen(false);
    navigate(path);
  }

  function logout() {
    localStorage.removeItem("greenpulse_token");
    localStorage.removeItem("greenpulse_user");
    navigate("/");
  }

  function openSettings() {
    setProfileOpen(false);
    navigate("/settings");
  }

  function openAdminStats() {
    setProfileOpen(false);
    navigate("/admin");
  }

  if (loading) {
    return (
      <main className="dashboard-loading">
        <div className="dashboard-loader">
          <div className="loader-leaf">🌱</div>
          <h2>Growing your dashboard...</h2>
          <p>Syncing your GreenPulse impact.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-loading">
        <div className="dashboard-error-card">
          <div className="error-icon">⚠️</div>
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>
          <button onClick={loadDashboard}>Try again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dash-background-glow dash-glow-one" />
      <div className="dash-background-glow dash-glow-two" />

      <header className="dash-topbar">
        <button
          className="dash-mobile-brand"
          onClick={() => navigate("/")}
          type="button"
        >
          <span>🌿</span>
          GREEN<span>PULSE</span>
        </button>

        <div className="dash-search">
          <span>⌕</span>

          <input
            value={search}
            placeholder="Search GreenPulse..."
            aria-label="Search"
            type="text"
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchOpen(true);
            }}
          />

          {search && (
            <button
              className="dash-search-clear"
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

          {searchOpen && (
            <div
              className="dash-search-results"
              onMouseDown={(event) =>
                event.preventDefault()
              }
            >
              {filteredSearch.length > 0 ? (
                filteredSearch.map((item) => (
                  <button
                    key={item.path}
                    className="dash-search-result"
                    type="button"
                    onClick={() =>
                      openSearchItem(item.path)
                    }
                  >
                    <span className="dash-search-result-icon">
                      {item.icon}
                    </span>

                    <span className="dash-search-result-copy">
                      <strong>{item.name}</strong>
                      <small>{item.description}</small>
                    </span>

                    <span className="dash-search-arrow">
                      →
                    </span>
                  </button>
                ))
              ) : (
                <div className="dash-search-empty">
                  🌿
                  <span>No GreenPulse feature found.</span>
                </div>
              )}
            </div>
          )}
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
            onClick={() =>
              setProfileOpen((value) => !value)
            }
          >
            <span className="dash-profile-avatar">
              🌱
            </span>

            <span className="dash-profile-info">
              <strong>{username}</strong>
              <small>
                {isAdmin ? "Administrator" : "Eco Starter"}
              </small>
            </span>

            <span className="dash-profile-chevron">
              {profileOpen ? "⌃" : "⌄"}
            </span>
          </button>

          {profileOpen && (
            <div className="dash-profile-menu">
              <button
                type="button"
                className="dash-profile-menu-item"
                onClick={openSettings}
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  className="dash-profile-menu-item admin"
                  onClick={openAdminStats}
                >
                  <span>📊</span>
                  <span>User & GreenPulse Stats</span>
                </button>
              )}

              <button
                type="button"
                className="dash-profile-menu-item logout"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
              >
                <span>🚪</span>
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="dash-content">
        {/* HERO */}
        <section className="dash-hero">
          <div className="dash-hero-copy">
            <div className="dash-eyebrow">
              WELCOME BACK <span>🌿</span>
            </div>

            <h1>
              Good evening,{" "}
              <span>{username}</span>.
            </h1>

            <p>
              Your actions today create a greener tomorrow.
              <br />
              Keep growing your impact.
            </p>

            <div className="dash-hero-level">
              <div className="dash-level-icon">
                🌱
              </div>

              <div className="dash-level-copy">
                <strong>
                  {level <= 1
                    ? "Eco Starter"
                    : `Level ${level}`}
                </strong>

                <span>{points} eco points</span>
              </div>

              <div className="dash-level-progress">
                <div>
                  <span
                    style={{
                      width: `${levelProgress}%`,
                    }}
                  />
                </div>

                <small>
                  {Math.max(
                    0,
                    100 - levelProgress
                  )}{" "}
                  points to next level
                </small>
              </div>
            </div>
          </div>

          <div
            className="dash-forest-card"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(1, 23, 16, 0.94), rgba(1, 23, 16, 0.24)), url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85')",
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
                <span>Enter My Forest</span>
                <b>→</b>
              </button>
            </div>

            <div className="dash-forest-orb">
              🌳
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="dash-stat-grid">
          <button
            className="dash-stat-card green"
            type="button"
            onClick={() => navigate("/progress")}
          >
            <div className="dash-stat-top">
              <span className="dash-stat-icon">
                🍃
              </span>
              <span className="dash-stat-arrow">
                ↗
              </span>
            </div>

            <div className="dash-stat-title">
              Carbon Saved
            </div>

            <div className="dash-stat-value">
              {savedCo2e.toFixed(1)}
              <small>kg</small>
            </div>

            <div className="dash-stat-description">
              CO₂e saved through your actions
            </div>
          </button>

          <button
            className="dash-stat-card tree"
            type="button"
            onClick={() => navigate("/forest")}
          >
            <div className="dash-stat-top">
              <span className="dash-stat-icon">
                🌳
              </span>
              <span className="dash-stat-arrow">
                ↗
              </span>
            </div>

            <div className="dash-stat-title">
              Trees Grown
            </div>

            <div className="dash-stat-value">
              {trees}
            </div>

            <div className="dash-stat-description">
              Virtual trees in your journey
            </div>
          </button>

          <button
            className="dash-stat-card gold"
            type="button"
            onClick={() => navigate("/rewards")}
          >
            <div className="dash-stat-top">
              <span className="dash-stat-icon">
                ⭐
              </span>
              <span className="dash-stat-arrow">
                ↗
              </span>
            </div>

            <div className="dash-stat-title">
              Points Earned
            </div>

            <div className="dash-stat-value">
              {points}
            </div>

            <div className="dash-stat-description">
              Lifetime GreenPulse points
            </div>
          </button>

          <button
            className="dash-stat-card fire"
            type="button"
            onClick={() => navigate("/challenges")}
          >
            <div className="dash-stat-top">
              <span className="dash-stat-icon">
                🔥
              </span>
              <span className="dash-stat-arrow">
                ↗
              </span>
            </div>

            <div className="dash-stat-title">
              Green Streak
            </div>

            <div className="dash-stat-value">
              {streak}
              <small>
                {streak === 1 ? "day" : "days"}
              </small>
            </div>

            <div className="dash-stat-description">
              Consecutive eco days
            </div>
          </button>
        </section>

        {/* CARBON + QUICK ACTIONS */}
        <section className="dash-main-grid">
          <article className="dash-panel dash-carbon-panel">
            <div className="dash-panel-header">
              <div>
                <span className="dash-section-kicker">
                  IMPACT
                </span>

                <h2>Your Carbon Footprint</h2>
              </div>

              <div className="dash-periods">
                {Object.keys(PERIODS).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      className={
                        period === item
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setPeriod(item)
                      }
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="dash-carbon-body">
              <div className="dash-ring">
                <div
                  className="dash-ring-inner"
                  style={{
                    "--ring-progress": `${footprintProgress}%`,
                  }}
                >
                  <strong>
                    {footprintProgress}%
                  </strong>
                  <span>eco progress</span>
                </div>
              </div>

              <div className="dash-chart-area">
                <div className="dash-chart">
                  {chartData.map((item, index) => {
                    const height =
                      maxChartValue > 0
                        ? Math.max(
                            4,
                            (item.value /
                              maxChartValue) *
                              100
                          )
                        : 3;

                    return (
                      <div
                        className="dash-chart-column"
                        key={`${item.date || item.label}-${index}`}
                        title={
                          item.value > 0
                            ? `${item.value.toFixed(
                                1
                              )} kg CO₂e`
                            : "No recorded impact"
                        }
                      >
                        <div className="dash-chart-bar">
                          <span
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <small>
                          {item.label}
                        </small>
                      </div>
                    );
                  })}
                </div>

                <div className="dash-chart-caption">
                  <span>
                    {history.length > 0
                      ? "Based on your recorded activity"
                      : "Record eco activity to populate your chart"}
                  </span>

                  <span>
                    {period === "1Y"
                      ? "Monthly view"
                      : "Daily view"}
                  </span>
                </div>
              </div>

              <div className="dash-carbon-side">
                <div>
                  <span>Total footprint</span>
                  <strong>
                    {totalCo2e.toFixed(1)} kg
                  </strong>
                </div>

                <div>
                  <span>Completed days</span>
                  <strong>{completedDays}</strong>
                </div>

                <div>
                  <span>Calculations</span>
                  <strong>{totalCalculations}</strong>
                </div>
              </div>
            </div>
          </article>

          <aside className="dash-side-panel">
            <div className="dash-mini-profile">
              <div className="dash-big-avatar">
                🌱
              </div>

              <div>
                <strong>{username}</strong>
                <span>
                  <i />
                  {isAdmin
                    ? "Administrator"
                    : "Eco Starter"}
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

              {[
                [
                  "🧮",
                  "Calculate Footprint",
                  "Record today's impact",
                  "/calculator",
                ],
                [
                  "🌲",
                  "View My Forest",
                  "See your trees grow",
                  "/forest",
                ],
                [
                  "🎯",
                  "Challenges",
                  "Complete eco missions",
                  "/challenges",
                ],
                [
                  "🏆",
                  "Check Rewards",
                  "View points & badges",
                  "/rewards",
                ],
                [
                  "🧘",
                  "Focus Session",
                  "Take a green break",
                  "/focus",
                ],
              ].map(
                ([icon, title, description, path]) => (
                  <button
                    className="dash-quick-action"
                    type="button"
                    key={path}
                    onClick={() => navigate(path)}
                  >
                    <span className="dash-action-icon">
                      {icon}
                    </span>

                    <span className="dash-action-copy">
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>

                    <span className="dash-action-arrow">
                      →
                    </span>
                  </button>
                )
              )}
            </div>
          </aside>
        </section>

        {/* ACTIVITY / MISSIONS / REWARDS */}
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
                onClick={() =>
                  navigate("/progress")
                }
              >
                View details →
              </button>
            </div>

            <div className="dash-week-bars">
              {[
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
              ].map((day, index) => {
                const recent = chartData.slice(-7);
                const item = recent[index];

                const maxRecent = Math.max(
                  ...recent.map(
                    (entry) => entry.value
                  ),
                  0
                );

                const height =
                  item && maxRecent > 0
                    ? Math.max(
                        6,
                        (item.value /
                          maxRecent) *
                          100
                      )
                    : 4;

                return (
                  <div
                    className="dash-week-day"
                    key={day}
                  >
                    <div className="dash-week-bar-wrap">
                      <span
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>

                    <small>{day}</small>
                  </div>
                );
              })}
            </div>

            <div className="dash-week-message">
              <span>🌱</span>

              <div>
                <strong>
                  {streak > 0
                    ? `${streak}-day green streak!`
                    : "Start your green streak!"}
                </strong>

                <small>
                  {streak > 0
                    ? "Keep the momentum alive."
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
                onClick={() =>
                  navigate("/challenges")
                }
              >
                View all →
              </button>
            </div>

            <div className="dash-challenges">
              <div className="dash-challenge">
                <span className="challenge-icon">
                  💧
                </span>

                <div>
                  <strong>Green Start</strong>
                  <small>
                    Complete today's eco calculation
                  </small>

                  <div className="challenge-progress">
                    <span
                      style={{
                        width:
                          totalCalculations > 0
                            ? "100%"
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <b>
                  {totalCalculations > 0
                    ? "1/1"
                    : "0/1"}
                </b>
              </div>

              <div className="dash-challenge">
                <span className="challenge-icon">
                  🔥
                </span>

                <div>
                  <strong>7-Day Warrior</strong>
                  <small>
                    Build a consistent green streak
                  </small>

                  <div className="challenge-progress">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          (streak / 7) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <b>{Math.min(streak, 7)}/7</b>
              </div>

              <div className="dash-challenge">
                <span className="challenge-icon">
                  🌳
                </span>

                <div>
                  <strong>Forest Builder</strong>
                  <small>
                    Grow your virtual forest
                  </small>

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
                onClick={() =>
                  navigate("/rewards")
                }
              >
                View all →
              </button>
            </div>

            <div className="dash-reward-list">
              <div
                className={`dash-reward ${
                  completedDays >= 1
                    ? "unlocked"
                    : ""
                }`}
              >
                <span>🌱</span>

                <div>
                  <strong>First Footprint</strong>
                  <small>
                    Begin your green journey
                  </small>
                </div>

                <b>
                  {completedDays >= 1
                    ? "✓"
                    : "🔒"}
                </b>
              </div>

              <div
                className={`dash-reward ${
                  completedDays >= 7
                    ? "unlocked"
                    : ""
                }`}
              >
                <span>🔥</span>

                <div>
                  <strong>Day Explorer</strong>
                  <small>
                    Complete 7 eco days
                  </small>
                </div>

                <b>
                  {completedDays >= 7
                    ? "✓"
                    : "🔒"}
                </b>
              </div>

              <div
                className={`dash-reward ${
                  points >= 500
                    ? "unlocked"
                    : ""
                }`}
              >
                <span>⭐</span>

                <div>
                  <strong>Climate Champion</strong>
                  <small>
                    Reach 500 points
                  </small>
                </div>

                <b>
                  {points >= 500
                    ? "✓"
                    : "🔒"}
                </b>
              </div>
            </div>
          </article>
        </section>

        {/* DIGITAL FOREST */}
        <section
          className="dash-bottom-forest"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0, 20, 13, 0.97), rgba(0, 20, 13, 0.42)), url('https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=85')",
          }}
        >
          <div className="dash-bottom-forest-copy">
            <span>YOUR DIGITAL FOREST</span>

            <h2>
              Small steps.
              <br />
              <em>Big impact.</em>
            </h2>

            <p>
              Your sustainable actions aren't just
              numbers. They're helping your forest come
              alive.
            </p>

            <button
              type="button"
              onClick={() => navigate("/forest")}
            >
              <span>Enter the Forest</span>
              <b>🌲 →</b>
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

      {searchOpen && (
        <button
          className="dash-search-backdrop"
          aria-label="Close search"
          type="button"
          onClick={() => setSearchOpen(false)}
        />
      )}
    </main>
  );
}

export default Dashboard;