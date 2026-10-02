import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_BASE = "https://greenpulse-web-tc0g.onrender.com";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function Stat({ icon, label, value, detail }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-icon">{icon}</div>

      <div className="admin-stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const token = localStorage.getItem("greenpulse_token");

  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [calculations, setCalculations] = useState([]);
  const [activity, setActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnalysis, setUserAnalysis] = useState(null);

  const [activeSection, setActiveSection] = useState("overview");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token || ""}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const adminFetch = useCallback(
    async (url, options = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...(options.headers || {}),
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("ADMIN_ACCESS_DENIED");
      }

      if (!response.ok) {
        let message = "Admin request failed.";

        try {
          const data = await response.json();
          message = data.detail || message;
        } catch {
          // Ignore invalid JSON.
        }

        throw new Error(message);
      }

      return response.json();
    },
    [authHeaders]
  );

  const loadAdmin = useCallback(async () => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setError("");

      const me = await adminFetch(
        `${API_BASE}/api/admin/me?token=${encodeURIComponent(token)}`
      );

      if (!me?.is_admin && me?.role !== "admin") {
        throw new Error("ADMIN_ACCESS_DENIED");
      }

      setAdmin(me);

      const [
        statsData,
        usersData,
        reviewsData,
        calculationsData,
        activityData,
      ] = await Promise.all([
        adminFetch(`${API_BASE}/api/admin/stats?token=${encodeURIComponent(token)}`),
        adminFetch(`${API_BASE}/api/admin/users?token=${encodeURIComponent(token)}`),
        adminFetch(`${API_BASE}/api/admin/reviews?token=${encodeURIComponent(token)}`),
        adminFetch(
          `${API_BASE}/api/admin/calculations?token=${encodeURIComponent(token)}`
        ),
        adminFetch(
          `${API_BASE}/api/admin/activity?token=${encodeURIComponent(token)}`
        ),
      ]);

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : usersData?.users || []);
      setReviews(
        Array.isArray(reviewsData)
          ? reviewsData
          : reviewsData?.reviews || []
      );
      setCalculations(
        Array.isArray(calculationsData)
          ? calculationsData
          : calculationsData?.calculations || []
      );
      setActivity(
        Array.isArray(activityData)
          ? activityData
          : activityData?.activity || []
      );
    } catch (err) {
      if (err.message === "ADMIN_ACCESS_DENIED") {
        navigate("/dashboard");
        return;
      }

      setError(err.message || "Could not load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [adminFetch, navigate, token]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const openUser = async (user) => {
    setSelectedUser(user);
    setUserAnalysis(null);

    try {
      const data = await adminFetch(
        `${API_BASE}/api/admin/users/${user.id}?token=${encodeURIComponent(
          token
        )}`
      );

      setUserAnalysis(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const changeAccountStatus = async (user) => {
    const action =
      user.account_status === "frozen"
        ? "unfreeze"
        : "freeze";

    const confirmed = window.confirm(
      `${action === "freeze" ? "Freeze" : "Unfreeze"} ${
        user.username
      }'s account?`
    );

    if (!confirmed) return;

    try {
      setBusy(true);

      await adminFetch(
        `${API_BASE}/api/admin/users/${user.id}/${action}?token=${encodeURIComponent(
          token
        )}`,
        {
          method: "POST",
        }
      );

      await loadAdmin();

      if (selectedUser?.id === user.id) {
        const refreshed = users.find((item) => item.id === user.id);

        if (refreshed) {
          setSelectedUser({
            ...refreshed,
            account_status:
              action === "freeze" ? "frozen" : "active",
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      String(user.username || "")
        .toLowerCase()
        .includes(query)
    );
  }, [users, search]);

  const totalUsers =
    number(stats?.total_users) ||
    number(stats?.users) ||
    users.length;

  const activeUsers =
    number(stats?.active_users) ||
    users.filter(
      (user) => user.account_status !== "frozen"
    ).length;

  const frozenUsers =
    number(stats?.frozen_users) ||
    users.filter(
      (user) => user.account_status === "frozen"
    ).length;

  const totalPoints =
    number(stats?.total_points) ||
    users.reduce(
      (sum, user) => sum + number(user.points),
      0
    );

  const totalCalculations =
    number(stats?.total_calculations) ||
    users.reduce(
      (sum, user) => sum + number(user.total_calculations),
      0
    );

  if (loading) {
    return (
      <div className="admin-page admin-loading">
        <div>
          <div className="admin-loading-orb">🛡️</div>
          <h1>Loading Admin Console</h1>
          <p>Connecting to GreenPulse control center...</p>
        </div>
      </div>
    );
  }

  if (error && !admin) {
    return (
      <div className="admin-page admin-loading">
        <div>
          <div className="admin-loading-orb">🔒</div>
          <h1>Admin access required</h1>
          <p>{error}</p>

          <button
            className="admin-primary-button"
            onClick={() => navigate("/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">🌿</div>

          <div>
            <strong>GREEN<span>PULSE</span></strong>
            <small>ADMIN CONSOLE</small>
          </div>
        </div>

        <div className="admin-nav">
          <button
            className={activeSection === "overview" ? "active" : ""}
            onClick={() => setActiveSection("overview")}
          >
            <span>◈</span>
            Overview
          </button>

          <button
            className={activeSection === "users" ? "active" : ""}
            onClick={() => setActiveSection("users")}
          >
            <span>👥</span>
            Users
          </button>

          <button
            className={activeSection === "calculations" ? "active" : ""}
            onClick={() => setActiveSection("calculations")}
          >
            <span>🧮</span>
            Calculations
          </button>

          <button
            className={activeSection === "reviews" ? "active" : ""}
            onClick={() => setActiveSection("reviews")}
          >
            <span>💬</span>
            Reviews
          </button>

          <button
            className={activeSection === "activity" ? "active" : ""}
            onClick={() => setActiveSection("activity")}
          >
            <span>⚡</span>
            Activity
          </button>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-security-card">
            <span>🛡️</span>
            <div>
              <strong>Protected area</strong>
              <small>Role verified by backend</small>
            </div>
          </div>

          <button
            className="admin-user-dashboard"
            onClick={() => navigate("/dashboard")}
          >
            ← User Dashboard
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-kicker">GREENPULSE CONTROL CENTER</span>

            <h1>
              Admin <em>Dashboard</em>
            </h1>

            <p>
              Monitor the platform, understand user activity,
              and manage accounts.
            </p>
          </div>

          <div className="admin-header-right">
            <button
              className="admin-refresh"
              onClick={loadAdmin}
              disabled={busy}
            >
              ↻ Refresh
            </button>

            <div className="admin-profile">
              <div>🛡️</div>

              <span>
                <strong>{admin?.username || "Administrator"}</strong>
                <small>Administrator</small>
              </span>
            </div>
          </div>
        </header>

        {error && (
          <div className="admin-alert">
            ⚠️ {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {activeSection === "overview" && (
          <>
            <section className="admin-stat-grid">
              <Stat
                icon="👥"
                label="Total Users"
                value={totalUsers}
                detail={`${activeUsers} active`}
              />

              <Stat
                icon="🟢"
                label="Active Accounts"
                value={activeUsers}
                detail="Currently available"
              />

              <Stat
                icon="❄️"
                label="Frozen Accounts"
                value={frozenUsers}
                detail="Restricted accounts"
              />

              <Stat
                icon="⭐"
                label="Points Generated"
                value={totalPoints.toLocaleString()}
                detail="Across all users"
              />

              <Stat
                icon="🧮"
                label="Calculations"
                value={totalCalculations.toLocaleString()}
                detail="Recorded footprints"
              />

              <Stat
                icon="🌍"
                label="Platform Status"
                value="ONLINE"
                detail="Database connected"
              />
            </section>

            <section className="admin-grid-two">
              <article className="admin-panel admin-activity-panel">
                <div className="admin-panel-heading">
                  <div>
                    <span>LIVE PULSE</span>
                    <h2>Recent Activity</h2>
                  </div>

                  <button
                    onClick={() => setActiveSection("activity")}
                  >
                    View all →
                  </button>
                </div>

                <div className="admin-activity-list">
                  {activity.slice(0, 8).map((item, index) => (
                    <div className="admin-activity" key={item.id || index}>
                      <div className="admin-activity-icon">
                        {item.type === "calculation"
                          ? "🧮"
                          : item.type === "challenge"
                          ? "🎯"
                          : "🌱"}
                      </div>

                      <div>
                        <strong>
                          {item.username ||
                            item.name ||
                            "GreenPulse user"}
                        </strong>

                        <small>
                          {item.action ||
                            item.type ||
                            "Activity recorded"}
                        </small>
                      </div>

                      <time>
                        {formatDate(
                          item.created_at ||
                            item.completed_at ||
                            item.date
                        )}
                      </time>
                    </div>
                  ))}

                  {!activity.length && (
                    <div className="admin-empty">
                      No activity recorded yet.
                    </div>
                  )}
                </div>
              </article>

              <article className="admin-panel admin-control-panel">
                <div className="admin-panel-heading">
                  <div>
                    <span>CONTROL</span>
                    <h2>Account Management</h2>
                  </div>
                </div>

                <div className="admin-control-stat">
                  <div>
                    <strong>{activeUsers}</strong>
                    <span>Active users</span>
                  </div>

                  <div>
                    <strong>{frozenUsers}</strong>
                    <span>Frozen users</span>
                  </div>
                </div>

                <button
                  className="admin-large-action"
                  onClick={() => setActiveSection("users")}
                >
                  👥 Manage User Accounts
                  <span>→</span>
                </button>

                <button
                  className="admin-large-action"
                  onClick={() =>
                    setActiveSection("calculations")
                  }
                >
                  🧮 Explore Carbon Data
                  <span>→</span>
                </button>

                <button
                  className="admin-large-action"
                  onClick={() => setActiveSection("reviews")}
                >
                  💬 Review Community Feedback
                  <span>→</span>
                </button>
              </article>
            </section>
          </>
        )}

        {activeSection === "users" && (
          <section className="admin-panel admin-users-panel">
            <div className="admin-panel-heading admin-users-heading">
              <div>
                <span>ACCOUNT CENTER</span>
                <h2>GreenPulse Users</h2>
              </div>

              <div className="admin-user-search">
                🔎
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search username..."
                />
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Points</th>
                    <th>Streak</th>
                    <th>Calculations</th>
                    <th>Joined</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <button
                          className="admin-user-cell"
                          onClick={() => openUser(user)}
                        >
                          <span>🌱</span>

                          <div>
                            <strong>{user.username}</strong>
                            <small>ID #{user.id}</small>
                          </div>
                        </button>
                      </td>

                      <td>
                        <span
                          className={`admin-role ${
                            user.role === "admin"
                              ? "admin"
                              : ""
                          }`}
                        >
                          {user.role || "user"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-status ${
                            user.account_status === "frozen"
                              ? "frozen"
                              : "active"
                          }`}
                        >
                          <i />
                          {user.account_status === "frozen"
                            ? "Frozen"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        {number(user.points).toLocaleString()}
                      </td>

                      <td>{number(user.streak)} days</td>

                      <td>
                        {number(
                          user.total_calculations
                        )}
                      </td>

                      <td>{formatDate(user.created_at)}</td>

                      <td>
                        <div className="admin-row-actions">
                          <button
                            onClick={() => openUser(user)}
                          >
                            Analyze
                          </button>

                          {user.role !== "admin" && (
                            <button
                              className={
                                user.account_status ===
                                "frozen"
                                  ? "unfreeze"
                                  : "freeze"
                              }
                              onClick={() =>
                                changeAccountStatus(user)
                              }
                              disabled={busy}
                            >
                              {user.account_status ===
                              "frozen"
                                ? "Unfreeze"
                                : "Freeze"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!filteredUsers.length && (
                <div className="admin-empty">
                  No users match your search.
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "calculations" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span>CARBON DATA</span>
                <h2>Recent Calculations</h2>
              </div>

              <strong className="admin-count">
                {calculations.length} records
              </strong>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Date</th>
                    <th>CO₂e</th>
                    <th>Points</th>
                    <th>Transport</th>
                    <th>Food</th>
                  </tr>
                </thead>

                <tbody>
                  {calculations.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>
                        <strong>
                          {item.username ||
                            item.name ||
                            `User #${item.user_id}`}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          item.calculation_date ||
                            item.date ||
                            item.created_at
                        )}
                      </td>

                      <td>
                        {number(
                          item.co2e
                        ).toFixed(2)} kg
                      </td>

                      <td>
                        +{number(item.points)}
                      </td>

                      <td>
                        {item.transport_mode ||
                          item.transport ||
                          "—"}
                      </td>

                      <td>
                        {item.diet ||
                          item.food ||
                          "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!calculations.length && (
                <div className="admin-empty">
                  No calculation records yet.
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "reviews" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span>COMMUNITY</span>
                <h2>Reviews & Feedback</h2>
              </div>

              <strong className="admin-count">
                {reviews.length} reviews
              </strong>
            </div>

            <div className="admin-review-grid">
              {reviews.map((review, index) => (
                <article
                  className="admin-review-card"
                  key={review.id || index}
                >
                  <div className="admin-review-top">
                    <div className="admin-review-avatar">
                      {(review.name || "G")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {review.name || "Anonymous"}
                      </strong>

                      <small>
                        {formatDate(review.created_at)}
                      </small>
                    </div>

                    <span>
                      {"★".repeat(
                        Math.min(
                          5,
                          Math.max(
                            0,
                            number(review.rating)
                          )
                        )
                      )}
                    </span>
                  </div>

                  <p>{review.review || "No review text."}</p>
                </article>
              ))}

              {!reviews.length && (
                <div className="admin-empty">
                  No reviews yet.
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "activity" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span>PLATFORM LOG</span>
                <h2>Activity Stream</h2>
              </div>
            </div>

            <div className="admin-full-activity">
              {activity.map((item, index) => (
                <div
                  className="admin-activity"
                  key={item.id || index}
                >
                  <div className="admin-activity-icon">
                    🌱
                  </div>

                  <div>
                    <strong>
                      {item.username ||
                        item.name ||
                        "GreenPulse user"}
                    </strong>

                    <small>
                      {item.action ||
                        item.type ||
                        "Activity recorded"}
                    </small>
                  </div>

                  <time>
                    {formatDate(
                      item.created_at ||
                        item.completed_at ||
                        item.date
                    )}
                  </time>
                </div>
              ))}

              {!activity.length && (
                <div className="admin-empty">
                  Nothing here yet.
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {selectedUser && (
        <div
          className="admin-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <aside className="admin-user-modal">
            <button
              className="admin-modal-close"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>

            <div className="admin-modal-avatar">🌱</div>

            <span className="admin-kicker">
              USER ANALYSIS
            </span>

            <h2>{selectedUser.username}</h2>

            <p>
              Account #{selectedUser.id}
            </p>

            <div className="admin-analysis-grid">
              <div>
                <span>Points</span>
                <strong>
                  {number(
                    userAnalysis?.points ??
                      selectedUser.points
                  ).toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Streak</span>
                <strong>
                  {number(
                    userAnalysis?.streak ??
                      selectedUser.streak
                  )}
                </strong>
              </div>

              <div>
                <span>Calculations</span>
                <strong>
                  {number(
                    userAnalysis?.total_calculations ??
                      selectedUser.total_calculations
                  )}
                </strong>
              </div>

              <div>
                <span>Eco Days</span>
                <strong>
                  {number(
                    userAnalysis?.completed_days ??
                      selectedUser.completed_days
                  )}
                </strong>
              </div>
            </div>

            <div className="admin-modal-status">
              <span>Account status</span>

              <strong
                className={
                  selectedUser.account_status ===
                  "frozen"
                    ? "frozen"
                    : "active"
                }
              >
                {selectedUser.account_status ===
                "frozen"
                  ? "❄️ Frozen"
                  : "🟢 Active"}
              </strong>
            </div>

            {selectedUser.role !== "admin" && (
              <button
                className={`admin-modal-action ${
                  selectedUser.account_status ===
                  "frozen"
                    ? "unfreeze"
                    : "freeze"
                }`}
                onClick={() =>
                  changeAccountStatus(selectedUser)
                }
              >
                {selectedUser.account_status ===
                "frozen"
                  ? "Unfreeze Account"
                  : "Freeze Account"}
              </button>
            )}

            <div className="admin-modal-note">
              <span>🔐</span>
              <p>
                Account controls are enforced by the
                GreenPulse backend. Changing browser
                code cannot grant admin privileges.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}