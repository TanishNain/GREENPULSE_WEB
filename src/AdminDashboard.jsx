import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import {
  getToken,
  getUser,
} from "./auth.js";

const API_BASE =
  "https://greenpulse-web-tc0g.onrender.com";

const NAV_ITEMS = [
  {
    id: "overview",
    icon: "◈",
    label: "Overview",
  },
  {
    id: "users",
    icon: "♙",
    label: "Users",
  },
  {
    id: "calculations",
    icon: "⌁",
    label: "Calculations",
  },
  {
    id: "reviews",
    icon: "★",
    label: "Reviews",
  },
  {
    id: "activity",
    icon: "◌",
    label: "Activity",
  },
];

function AdminDashboard() {
  const navigate = useNavigate();

  const token = getToken();
  const storedUser = getUser();

  const [admin, setAdmin] =
    useState(null);

  const [section, setSection] =
    useState("overview");

  const [stats, setStats] =
    useState(null);

  const [users, setUsers] =
    useState([]);

  const [
    calculations,
    setCalculations,
  ] = useState([]);

  const [reviews, setReviews] =
    useState([]);

  const [activity, setActivity] =
    useState(null);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    sectionLoading,
    setSectionLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    userSearch,
    setUserSearch,
  ] = useState("");

  const [notice, setNotice] =
    useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type":
        "application/json",
    }),
    [token]
  );

  const api = async (
    path,
    options = {}
  ) => {
    const response = await fetch(
      `${API_BASE}${path}`,
      {
        ...options,
        headers: {
          ...authHeaders,
          ...(options.headers || {}),
        },
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.message ||
          `Request failed (${response.status})`
      );
    }

    return data;
  };

  const loadStats = async () => {
    const data = await api(
      `/api/admin/stats?token=${encodeURIComponent(
        token
      )}`
    );

    setStats(data);
  };

  const loadUsers = async () => {
    const data = await api(
      `/api/admin/users?token=${encodeURIComponent(
        token
      )}`
    );

    setUsers(data.users || []);
  };

  const loadReviews = async () => {
    const data = await api(
      `/api/admin/reviews?token=${encodeURIComponent(
        token
      )}`
    );

    setReviews(
      data.reviews || []
    );
  };

  const loadCalculations =
    async () => {
      const data = await api(
        `/api/admin/calculations?token=${encodeURIComponent(
          token
        )}`
      );

      setCalculations(
        data.calculations || []
      );
    };

  const loadActivity =
    async () => {
      const data = await api(
        `/api/admin/activity?token=${encodeURIComponent(
          token
        )}`
      );

      setActivity(data);
    };

  const loadAdmin = async () => {
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await api(
        `/api/admin/me?token=${encodeURIComponent(
          token
        )}`
      );

      if (
        !data.admin ||
        data.admin.role !== "admin"
      ) {
        throw new Error(
          "Administrator access is required."
        );
      }

      setAdmin(data.admin);

      await Promise.all([
        loadStats(),
        loadUsers(),
        loadReviews(),
        loadCalculations(),
        loadActivity(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load admin console."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSection = async (
    nextSection
  ) => {
    setSection(nextSection);
    setNotice("");
    setError("");

    try {
      setSectionLoading(true);

      if (
        nextSection ===
        "overview"
      ) {
        await loadStats();
      }

      if (
        nextSection ===
        "users"
      ) {
        await loadUsers();
      }

      if (
        nextSection ===
        "calculations"
      ) {
        await loadCalculations();
      }

      if (
        nextSection ===
        "reviews"
      ) {
        await loadReviews();
      }

      if (
        nextSection ===
        "activity"
      ) {
        await loadActivity();
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to refresh section."
      );
    } finally {
      setSectionLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openUser =
    async (userId) => {
      try {
        setNotice("");

        setSelectedUser({
          loading: true,
          id: userId,
        });

        const data = await api(
          `/api/admin/users/${userId}?token=${encodeURIComponent(
            token
          )}`
        );

        setSelectedUser(data);
      } catch (err) {
        setSelectedUser(null);

        setError(
          err.message ||
            "Unable to load user analysis."
        );
      }
    };

  const changeUserStatus =
    async (
      userId,
      status
    ) => {
      const action =
        status === "frozen"
          ? "freeze"
          : "unfreeze";

      const confirmed =
        window.confirm(
          status === "frozen"
            ? "Freeze this account?\n\nThe account will remain stored, but active sessions will be invalidated."
            : "Unfreeze this account?"
        );

      if (!confirmed) return;

      try {
        setNotice("");
        setError("");

        await api(
          `/api/admin/users/${userId}/${action}?token=${encodeURIComponent(
            token
          )}`,
          {
            method: "POST",
          }
        );

        setNotice(
          status === "frozen"
            ? "Account frozen successfully."
            : "Account unfrozen successfully."
        );

        await loadUsers();

        if (
          selectedUser?.user?.id ===
          userId
        ) {
          await openUser(
            userId
          );
        }

        await loadStats();
      } catch (err) {
        setError(
          err.message ||
            "Unable to change account status."
        );
      }
    };

  const filteredUsers =
    users.filter((user) =>
      user.username
        ?.toLowerCase()
        .includes(
          userSearch
            .trim()
            .toLowerCase()
        )
    );

  const filteredCalculations =
    calculations.filter(
      (item) =>
        item.username
          ?.toLowerCase()
          .includes(
            search
              .trim()
              .toLowerCase()
          )
    );

  const totalCarbon =
    Number(
      stats?.impact
        ?.total_co2e || 0
    );

  const totalPoints =
    Number(
      stats?.impact
        ?.total_points || 0
    );

  const maxActivity =
    Math.max(
      ...(activity?.calculations ||
        []
      ).map(
        (item) =>
          Number(
            item.count || 0
          )
      ),
      1
    );

  if (loading) {
    return (
      <main className="admin-page admin-loading-page">
        <div className="admin-loading-card">
          <div className="admin-loading-leaf">
            🌱
          </div>

          <h1>
            Opening Admin
            Console
          </h1>

          <p>
            Connecting to
            GreenPulse
            securely...
          </p>

          <div className="admin-loader" />
        </div>
      </main>
    );
  }

  if (error && !admin) {
    return (
      <main className="admin-page admin-error-page">
        <div className="admin-error-card">
          <div className="admin-error-icon">
            🛡️
          </div>

          <span className="admin-eyebrow">
            GREENPULSE SECURITY
          </span>

          <h1>
            Admin access
            required
          </h1>

          <p>
            {error}
          </p>

          <div className="admin-error-actions">
            <button
              className="admin-primary-button"
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              Back to Dashboard
            </button>

            <button
              className="admin-secondary-button"
              type="button"
              onClick={
                loadAdmin
              }
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <button
            className="admin-brand"
            type="button"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <span className="admin-brand-mark">
              🌱
            </span>

            <span>
              <strong>
                GREEN
                <span>
                  PULSE
                </span>
              </strong>

              <small>
                ADMIN CONSOLE
              </small>
            </span>
          </button>

          <div className="admin-security-pill">
            <span className="admin-status-dot" />
            Administrator
            verified
          </div>

          <nav className="admin-nav">
            <span className="admin-nav-title">
              CONTROL CENTER
            </span>

            {NAV_ITEMS.map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-item ${
                    section ===
                    item.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    loadSection(
                      item.id
                    )
                  }
                >
                  <span className="admin-nav-icon">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>

                  {section ===
                    item.id && (
                    <span className="admin-nav-arrow">
                      →
                    </span>
                  )}
                </button>
              )
            )}
          </nav>

          <div className="admin-sidebar-bottom">
            <div className="admin-profile-mini">
              <div className="admin-avatar">
                {(
                  admin?.username ||
                  storedUser?.username ||
                  "A"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {admin?.username ||
                    storedUser?.username ||
                    "Administrator"}
                </strong>

                <span>
                  Administrator
                </span>
              </div>
            </div>

            <button
              className="admin-back-button"
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              ← Return to
              GreenPulse
            </button>
          </div>
        </aside>

        <section className="admin-main">
          <header className="admin-topbar">
            <div>
              <span className="admin-eyebrow">
                GREENPULSE /
                ADMIN
              </span>

              <h1>
                {section ===
                  "overview" &&
                  "Control Center"}

                {section ===
                  "users" &&
                  "User Management"}

                {section ===
                  "calculations" &&
                  "Carbon Calculations"}

                {section ===
                  "reviews" &&
                  "Community Reviews"}

                {section ===
                  "activity" &&
                  "Activity Monitor"}
              </h1>
            </div>

            <div className="admin-top-actions">
              <div className="admin-live-badge">
                <span />
                LIVE
              </div>

              <button
                className="admin-refresh-button"
                type="button"
                onClick={
                  loadAdmin
                }
                title="Refresh admin data"
              >
                ↻
              </button>
            </div>
          </header>

          {(error ||
            notice) && (
            <div
              className={`admin-alert ${
                error
                  ? "error"
                  : "success"
              }`}
            >
              <span>
                {error
                  ? "⚠"
                  : "✓"}
              </span>

              <p>
                {error ||
                  notice}
              </p>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setNotice("");
                }}
              >
                ×
              </button>
            </div>
          )}

          {sectionLoading && (
            <div className="admin-section-loading">
              Updating data...
            </div>
          )}

          {/* =================================================
              OVERVIEW
              ================================================= */}

          {section ===
            "overview" &&
            stats && (
              <div className="admin-content">
                <div className="admin-welcome-card">
                  <div>
                    <span className="admin-card-kicker">
                      ADMINISTRATOR
                      VIEW
                    </span>

                    <h2>
                      GreenPulse
                      is growing.
                    </h2>

                    <p>
                      Monitor users,
                      carbon
                      activity,
                      challenges
                      and
                      community
                      feedback
                      from one
                      place.
                    </p>
                  </div>

                  <div className="admin-welcome-art">
                    🌍
                  </div>
                </div>

                <div className="admin-stat-grid">
                  <StatCard
                    icon="♙"
                    label="Total Users"
                    value={
                      stats.users
                        ?.total ||
                      0
                    }
                    detail={`${stats.users?.active || 0} active`}
                  />

                  <StatCard
                    icon="⌁"
                    label="Calculations"
                    value={
                      stats.activity
                        ?.calculations ||
                      0
                    }
                    detail="saved footprints"
                  />

                  <StatCard
                    icon="🎯"
                    label="Challenges"
                    value={
                      stats.activity
                        ?.challenges_completed ||
                      0
                    }
                    detail="completed"
                  />

                  <StatCard
                    icon="★"
                    label="Reviews"
                    value={
                      stats.activity
                        ?.reviews ||
                      0
                    }
                    detail="community responses"
                  />
                </div>

                <div className="admin-overview-grid">
                  <div className="admin-panel">
                    <div className="admin-panel-heading">
                      <div>
                        <span>
                          IMPACT
                        </span>

                        <h3>
                          GreenPulse
                          totals
                        </h3>
                      </div>
                    </div>

                    <div className="admin-impact-list">
                      <ImpactRow
                        label="Carbon tracked"
                        value={`${totalCarbon.toFixed(
                          2
                        )} kg CO₂e`}
                        icon="◒"
                      />

                      <ImpactRow
                        label="Green Points"
                        value={totalPoints.toLocaleString()}
                        icon="✦"
                      />

                      <ImpactRow
                        label="Active accounts"
                        value={
                          stats
                            .users
                            ?.active ||
                          0
                        }
                        icon="●"
                      />

                      <ImpactRow
                        label="Frozen accounts"
                        value={
                          stats
                            .users
                            ?.frozen ||
                          0
                        }
                        icon="❄"
                      />
                    </div>
                  </div>

                  <div className="admin-panel">
                    <div className="admin-panel-heading">
                      <div>
                        <span>
                          USERS
                        </span>

                        <h3>
                          Account
                          status
                        </h3>
                      </div>
                    </div>

                    <div className="admin-status-visual">
                      <div className="admin-status-ring">
                        <strong>
                          {stats.users
                            ?.total ||
                            0}
                        </strong>

                        <span>
                          users
                        </span>
                      </div>

                      <div className="admin-status-legend">
                        <div>
                          <i className="active-dot" />

                          <span>
                            Active
                          </span>

                          <strong>
                            {stats
                              .users
                              ?.active ||
                              0}
                          </strong>
                        </div>

                        <div>
                          <i className="frozen-dot" />

                          <span>
                            Frozen
                          </span>

                          <strong>
                            {stats
                              .users
                              ?.frozen ||
                              0}
                          </strong>
                        </div>

                        <div>
                          <i className="admin-dot" />

                          <span>
                            Admins
                          </span>

                          <strong>
                            {stats
                              .users
                              ?.admins ||
                              0}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span>
                        RECENT
                        USERS
                      </span>

                      <h3>
                        Accounts
                      </h3>
                    </div>

                    <button
                      className="admin-text-button"
                      type="button"
                      onClick={() =>
                        loadSection(
                          "users"
                        )
                      }
                    >
                      View all →
                    </button>
                  </div>

                  <UserTable
                    users={users.slice(
                      0,
                      6
                    )}
                    onOpen={
                      openUser
                    }
                    onStatus={
                      changeUserStatus
                    }
                  />
                </div>
              </div>
            )}

          {/* =================================================
              USERS
              ================================================= */}

          {section ===
            "users" && (
            <div className="admin-content">
              <div className="admin-section-intro">
                <div>
                  <span className="admin-card-kicker">
                    ACCOUNT
                    CONTROL
                  </span>

                  <h2>
                    Users
                  </h2>

                  <p>
                    Inspect activity
                    and manage
                    account access
                    without
                    deleting user
                    data.
                  </p>
                </div>

                <div className="admin-count-badge">
                  {users.length}{" "}
                  accounts
                </div>
              </div>

              <div className="admin-toolbar">
                <div className="admin-search">
                  <span>⌕</span>

                  <input
                    value={
                      userSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setUserSearch(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Search username..."
                  />

                  {userSearch && (
                    <button
                      type="button"
                      onClick={() =>
                        setUserSearch(
                          ""
                        )
                      }
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  className="admin-secondary-button"
                  type="button"
                  onClick={
                    loadUsers
                  }
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="admin-panel admin-table-panel">
                <UserTable
                  users={
                    filteredUsers
                  }
                  onOpen={
                    openUser
                  }
                  onStatus={
                    changeUserStatus
                  }
                  detailed
                />
              </div>
            </div>
          )}

          {/* =================================================
              CALCULATIONS
              ================================================= */}

          {section ===
            "calculations" && (
            <div className="admin-content">
              <div className="admin-section-intro">
                <div>
                  <span className="admin-card-kicker">
                    CARBON DATA
                  </span>

                  <h2>
                    Calculations
                  </h2>

                  <p>
                    Recent saved
                    carbon
                    calculations
                    across
                    GreenPulse
                    accounts.
                  </p>
                </div>

                <div className="admin-count-badge">
                  {
                    calculations.length
                  }{" "}
                  records
                </div>
              </div>

              <div className="admin-toolbar">
                <div className="admin-search">
                  <span>⌕</span>

                  <input
                    value={search}
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Search by username..."
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch(
                          ""
                        )
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="admin-panel admin-table-panel">
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          Date
                        </th>

                        <th>
                          User
                        </th>

                        <th>
                          Total CO₂e
                        </th>

                        <th>
                          Electricity
                        </th>

                        <th>
                          Transport
                        </th>

                        <th>
                          Food
                        </th>

                        <th>
                          Waste
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCalculations.map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={
                              item.id ||
                              index
                            }
                          >
                            <td>
                              {item.calculation_date ||
                                "—"}
                            </td>

                            <td>
                              <button
                                className="admin-user-link"
                                type="button"
                                onClick={() =>
                                  openUser(
                                    item.user_id
                                  )
                                }
                              >
                                {item.username ||
                                  "Unknown"}
                              </button>
                            </td>

                            <td>
                              <strong>
                                {Number(
                                  item.total_co2e ||
                                    0
                                ).toFixed(
                                  2
                                )}
                              </strong>{" "}
                              kg
                            </td>

                            <td>
                              {Number(
                                item.electricity_co2e ||
                                  0
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td>
                              {Number(
                                item.transport_co2e ||
                                  0
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td>
                              {Number(
                                item.food_co2e ||
                                  0
                              ).toFixed(
                                2
                              )}
                            </td>

                            <td>
                              {Number(
                                item.waste_co2e ||
                                  0
                              ).toFixed(
                                2
                              )}
                            </td>
                          </tr>
                        )
                      )}

                      {!filteredCalculations.length && (
                        <tr>
                          <td
                            colSpan="7"
                            className="admin-empty"
                          >
                            No
                            calculations
                            found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              REVIEWS
              ================================================= */}

          {section ===
            "reviews" && (
            <div className="admin-content">
              <div className="admin-section-intro">
                <div>
                  <span className="admin-card-kicker">
                    COMMUNITY
                  </span>

                  <h2>
                    Reviews
                  </h2>

                  <p>
                    Feedback
                    submitted by
                    GreenPulse
                    users.
                  </p>
                </div>

                <div className="admin-count-badge">
                  {reviews.length}{" "}
                  reviews
                </div>
              </div>

              <div className="admin-review-grid">
                {reviews.map(
                  (review) => (
                    <article
                      className="admin-review-card"
                      key={
                        review.id
                      }
                    >
                      <div className="admin-review-top">
                        <div className="admin-review-avatar">
                          {(
                            review.name ||
                            "U"
                          )
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {review.name ||
                              "Anonymous"}
                          </strong>

                          <span>
                            {review.created_at
                              ? new Date(
                                  review.created_at
                                ).toLocaleDateString()
                              : "Date unavailable"}
                          </span>
                        </div>

                        <div className="admin-review-rating">
                          {"★".repeat(
                            Math.max(
                              0,
                              Math.min(
                                5,
                                Number(
                                  review.rating ||
                                    0
                                )
                              )
                            )
                          )}
                        </div>
                      </div>

                      <p>
                        {review.review ||
                          "No review text."}
                      </p>
                    </article>
                  )
                )}

                {!reviews.length && (
                  <div className="admin-empty-card">
                    No reviews
                    available.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================
              ACTIVITY
              ================================================= */}

          {section ===
            "activity" && (
            <div className="admin-content">
              <div className="admin-section-intro">
                <div>
                  <span className="admin-card-kicker">
                    ACTIVITY
                    MONITOR
                  </span>

                  <h2>
                    Activity
                  </h2>

                  <p>
                    A simple view
                    of recent
                    GreenPulse
                    participation.
                  </p>
                </div>
              </div>

              <div className="admin-overview-grid">
                <div className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span>
                        CALCULATIONS
                      </span>

                      <h3>
                        Daily
                        activity
                      </h3>
                    </div>
                  </div>

                  <div className="admin-bars">
                    {(
                      activity?.calculations ||
                      []
                    )
                      .slice()
                      .reverse()
                      .slice(
                        -14
                      )
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            className="admin-bar-column"
                            key={
                              item.calculation_date ||
                              index
                            }
                          >
                            <div className="admin-bar-value">
                              {
                                item.count
                              }
                            </div>

                            <div className="admin-bar-track">
                              <div
                                className="admin-bar-fill"
                                style={{
                                  height: `${Math.max(
                                    7,
                                    (Number(
                                      item.count
                                    ) /
                                      maxActivity) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>

                            <span>
                              {String(
                                item.calculation_date ||
                                  ""
                              ).slice(
                                5
                              )}
                            </span>
                          </div>
                        )
                      )}
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span>
                        CHALLENGES
                      </span>

                      <h3>
                        Recent
                        completions
                      </h3>
                    </div>
                  </div>

                  <div className="admin-activity-list">
                    {(
                      activity?.challenges ||
                      []
                    )
                      .slice(
                        0,
                        10
                      )
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            className="admin-activity-row"
                            key={
                              item.challenge_date ||
                              index
                            }
                          >
                            <span className="activity-date">
                              {
                                item.challenge_date
                              }
                            </span>

                            <strong>
                              {
                                item.count
                              }{" "}
                              completed
                            </strong>

                            <span>
                              +
                              {
                                item.points ||
                                  0
                              }{" "}
                              pts
                            </span>
                          </div>
                        )
                      )}

                    {!activity
                      ?.challenges
                      ?.length && (
                      <div className="admin-empty">
                        No challenge
                        activity
                        yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          USER ANALYSIS DRAWER
          ===================================================== */}

      {selectedUser && (
        <div
          className="admin-overlay"
          onClick={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedUser(
                null
              );
            }
          }}
        >
          <aside className="admin-user-drawer">
            <button
              className="admin-drawer-close"
              type="button"
              onClick={() =>
                setSelectedUser(
                  null
                )
              }
            >
              ×
            </button>

            {selectedUser.loading ? (
              <div className="admin-drawer-loading">
                <div className="admin-loader" />

                <p>
                  Loading user
                  analysis...
                </p>
              </div>
            ) : (
              <>
                <div className="admin-drawer-header">
                  <div className="admin-large-avatar">
                    {(
                      selectedUser
                        .user
                        ?.username ||
                      "U"
                    )
                      .charAt(
                        0
                      )
                      .toUpperCase()}
                  </div>

                  <span className="admin-card-kicker">
                    USER
                    ANALYSIS
                  </span>

                  <h2>
                    {
                      selectedUser
                        .user
                        ?.username
                    }
                  </h2>

                  <div className="admin-user-meta">
                    <span
                      className={
                        selectedUser
                          .user
                          ?.account_status ===
                        "frozen"
                          ? "frozen"
                          : "active"
                      }
                    >
                      {selectedUser
                        .user
                        ?.account_status ||
                        "active"}
                    </span>

                    <span>
                      {selectedUser
                        .user
                        ?.role ||
                        "user"}
                    </span>
                  </div>
                </div>

                <div className="admin-drawer-stats">
                  <MiniStat
                    label="Points"
                    value={
                      selectedUser
                        .summary
                        ?.points ||
                      0
                    }
                  />

                  <MiniStat
                    label="Streak"
                    value={
                      selectedUser
                        .summary
                        ?.streak ||
                      0
                    }
                  />

                  <MiniStat
                    label="Calculations"
                    value={
                      selectedUser
                        .summary
                        ?.total_calculations ||
                      0
                    }
                  />

                  <MiniStat
                    label="Forest"
                    value={
                      selectedUser
                        .summary
                        ?.forest_actions ||
                      0
                    }
                  />
                </div>

                <div className="admin-drawer-section">
                  <span>
                    CARBON
                    PROFILE
                  </span>

                  <div className="admin-carbon-list">
                    <ImpactRow
                      label="Electricity"
                      value={`${Number(
                        selectedUser
                          .carbon
                          ?.electricity_co2e ||
                          0
                      ).toFixed(
                        2
                      )} kg`}
                      icon="⚡"
                    />

                    <ImpactRow
                      label="LPG"
                      value={`${Number(
                        selectedUser
                          .carbon
                          ?.lpg_co2e ||
                          0
                      ).toFixed(
                        2
                      )} kg`}
                      icon="♨"
                    />

                    <ImpactRow
                      label="Transport"
                      value={`${Number(
                        selectedUser
                          .carbon
                          ?.transport_co2e ||
                          0
                      ).toFixed(
                        2
                      )} kg`}
                      icon="⌁"
                    />

                    <ImpactRow
                      label="Food"
                      value={`${Number(
                        selectedUser
                          .carbon
                          ?.food_co2e ||
                          0
                      ).toFixed(
                        2
                      )} kg`}
                      icon="◉"
                    />

                    <ImpactRow
                      label="Waste"
                      value={`${Number(
                        selectedUser
                          .carbon
                          ?.waste_co2e ||
                          0
                      ).toFixed(
                        2
                      )} kg`}
                      icon="♻"
                    />
                  </div>
                </div>

                <div className="admin-drawer-section">
                  <span>
                    ACCOUNT
                  </span>

                  <div className="admin-account-info">
                    <p>
                      <b>
                        Joined
                      </b>

                      <span>
                        {selectedUser
                          .user
                          ?.created_at
                          ? new Date(
                              selectedUser
                                .user
                                .created_at
                            ).toLocaleDateString()
                          : "—"}
                      </span>
                    </p>

                    <p>
                      <b>
                        Sessions
                      </b>

                      <span>
                        {selectedUser
                          .summary
                          ?.sessions ||
                          0}
                      </span>
                    </p>

                    <p>
                      <b>
                        Completed
                        days
                      </b>

                      <span>
                        {selectedUser
                          .summary
                          ?.completed_days ||
                          0}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedUser
                  .user
                  ?.role !==
                  "admin" && (
                  <div className="admin-drawer-actions">
                    {selectedUser
                      .user
                      ?.account_status ===
                    "frozen" ? (
                      <button
                        className="admin-unfreeze-button"
                        type="button"
                        onClick={() =>
                          changeUserStatus(
                            selectedUser
                              .user
                              .id,
                            "active"
                          )
                        }
                      >
                        Unfreeze
                        Account
                      </button>
                    ) : (
                      <button
                        className="admin-freeze-button"
                        type="button"
                        onClick={() =>
                          changeUserStatus(
                            selectedUser
                              .user
                              .id,
                            "frozen"
                          )
                        }
                      >
                        Freeze
                        Account
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {detail}
        </small>
      </div>
    </div>
  );
}

function ImpactRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="admin-impact-row">
      <div className="admin-impact-left">
        <span>
          {icon}
        </span>

        <p>
          {label}
        </p>
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function MiniStat({
  label,
  value,
}) {
  return (
    <div className="admin-mini-stat">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function UserTable({
  users,
  onOpen,
  onStatus,
  detailed = false,
}) {
  return (
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>
              User
            </th>

            <th>
              Role
            </th>

            <th>
              Status
            </th>

            <th>
              Points
            </th>

            <th>
              Streak
            </th>

            <th>
              Calculations
            </th>

            {detailed && (
              <th>
                Joined
              </th>
            )}

            <th>
              Manage
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map(
            (user) => (
              <tr
                key={
                  user.id
                }
              >
                <td>
                  <button
                    className="admin-table-user"
                    type="button"
                    onClick={() =>
                      onOpen(
                        user.id
                      )
                    }
                  >
                    <span>
                      {(
                        user.username ||
                        "U"
                      )
                        .charAt(
                          0
                        )
                        .toUpperCase()}
                    </span>

                    <strong>
                      {
                        user.username
                      }
                    </strong>
                  </button>
                </td>

                <td>
                  <span
                    className={`admin-role ${
                      user.role ===
                      "admin"
                        ? "admin"
                        : ""
                    }`}
                  >
                    {
                      user.role
                    }
                  </span>
                </td>

                <td>
                  <span
                    className={`admin-account-status ${
                      user.account_status ===
                      "frozen"
                        ? "frozen"
                        : "active"
                    }`}
                  >
                    <i />

                    {user.account_status ||
                      "active"}
                  </span>
                </td>

                <td>
                  {user.points ||
                    0}
                </td>

                <td>
                  {user.streak ||
                    0}
                </td>

                <td>
                  {user.total_calculations ||
                    0}
                </td>

                {detailed && (
                  <td>
                    {user.created_at
                      ? new Date(
                          user.created_at
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                )}

                <td>
                  {user.role ===
                  "admin" ? (
                    <span className="admin-protected">
                      Protected
                    </span>
                  ) : user.account_status ===
                    "frozen" ? (
                    <button
                      className="admin-small-action unfreeze"
                      type="button"
                      onClick={() =>
                        onStatus(
                          user.id,
                          "active"
                        )
                      }
                    >
                      Unfreeze
                    </button>
                  ) : (
                    <button
                      className="admin-small-action freeze"
                      type="button"
                      onClick={() =>
                        onStatus(
                          user.id,
                          "frozen"
                        )
                      }
                    >
                      Freeze
                    </button>
                  )}
                </td>
              </tr>
            )
          )}

          {!users.length && (
            <tr>
              <td
                colSpan={
                  detailed
                    ? 8
                    : 7
                }
                className="admin-empty"
              >
                No users
                found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;