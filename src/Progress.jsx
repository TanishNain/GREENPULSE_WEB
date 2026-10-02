import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Progress.css";

const STORAGE_KEY = "greenpulse_year_data";

const LEVELS = [
  { min: 0, name: "Eco Starter", icon: "🌱" },
  { min: 100, name: "Green Explorer", icon: "🌿" },
  { min: 250, name: "Eco Learner", icon: "🍃" },
  { min: 500, name: "Climate Champion", icon: "🌎" },
  { min: 1000, name: "Planet Protector", icon: "🛡️" },
  { min: 2000, name: "Green Leader", icon: "👑" },
  { min: 5000, name: "Earth Guardian", icon: "🌍" },
];

const BADGES = [
  {
    days: 1,
    name: "First Footprint",
    icon: "👣",
    description: "Complete your first footprint.",
  },
  {
    days: 7,
    name: "Day Explorer",
    icon: "🧭",
    description: "Track 7 different days.",
  },
  {
    days: 30,
    name: "Green Streak",
    icon: "🔥",
    description: "Complete 30 tracked days.",
  },
  {
    days: 100,
    name: "Day Guardian",
    icon: "🛡️",
    description: "Reach 100 tracked days.",
  },
  {
    days: 365,
    name: "Earth Guardian",
    icon: "🌍",
    description: "Complete a full year.",
  },
];

function readData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Progress() {
  const navigate = useNavigate();
  const [data, setData] = useState(readData);

  useEffect(() => {
    const refresh = () => setData(readData());

    window.addEventListener(
      "greenpulse:data-updated",
      refresh
    );

    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(
        "greenpulse:data-updated",
        refresh
      );
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const history = Array.isArray(data.history)
    ? data.history
    : [];

  const points = num(data.total_points);
  const calculations = num(data.total_calculations);
  const streak = num(data.streak);
  const completedDays = num(
    data.completed_days || history.length
  );
  const totalCO2 = num(data.total_co2e);

  const currentLevel = useMemo(() => {
    let level = LEVELS[0];

    LEVELS.forEach((item) => {
      if (points >= item.min) {
        level = item;
      }
    });

    return level;
  }, [points]);

  const nextLevel = useMemo(() => {
    return (
      LEVELS.find((item) => item.min > points) ||
      null
    );
  }, [points]);

  const levelProgress = nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((points - currentLevel.min) /
            (nextLevel.min - currentLevel.min)) *
            100
        )
      )
    : 100;

  const recentHistory = [...history]
    .sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    )
    .slice(0, 7);

  const categoryTotals = useMemo(() => {
    return history.reduce(
      (total, item) => {
        const c = item.categories || {};

        total.electricity += num(c.electricity);
        total.lpg += num(c.lpg);
        total.transport += num(c.transport);
        total.food += num(c.food);
        total.waste += num(c.waste);

        return total;
      },
      {
        electricity: 0,
        lpg: 0,
        transport: 0,
        food: 0,
        waste: 0,
      }
    );
  }, [history]);

  const maxCategory = Math.max(
    categoryTotals.electricity,
    categoryTotals.lpg,
    categoryTotals.transport,
    categoryTotals.food,
    categoryTotals.waste,
    1
  );

  return (
    <div className="progress-page">

      <div className="progress-atmosphere atmosphere-one" />
      <div className="progress-atmosphere atmosphere-two" />

      <header className="progress-header">

        <button
          className="progress-brand"
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          <span>🌱</span>

          <div>
            <strong>GREEN<span>PULSE</span></strong>
            <small>Progress Centre</small>
          </div>
        </button>

        <div className="progress-header-actions">

          <button
            onClick={() => navigate("/dashboard")}
            type="button"
          >
            ← Dashboard
          </button>

          <button
            onClick={() => navigate("/calculator")}
            type="button"
          >
            + Track Footprint
          </button>

        </div>

      </header>

      <main className="progress-main">

        <section className="progress-hero">

          <div>
            <span className="progress-kicker">
              YOUR JOURNEY
            </span>

            <h1>
              Watch your
              <span> impact grow.</span>
            </h1>

            <p>
              Every tracked day adds another step to
              your GreenPulse journey.
            </p>
          </div>

          <div className="level-emblem">
            <div>
              <span>{currentLevel.icon}</span>
            </div>

            <small>LEVEL</small>

            <strong>
              {currentLevel.name}
            </strong>
          </div>

        </section>

        <section className="progress-stat-grid">

          <article className="progress-stat">
            <span>🌱</span>
            <div>
              <strong>{points.toLocaleString()}</strong>
              <small>Green Points</small>
            </div>
          </article>

          <article className="progress-stat">
            <span>📅</span>
            <div>
              <strong>{completedDays}</strong>
              <small>Tracked Days</small>
            </div>
          </article>

          <article className="progress-stat">
            <span>🔥</span>
            <div>
              <strong>{streak}</strong>
              <small>Current Streak</small>
            </div>
          </article>

          <article className="progress-stat">
            <span>🧮</span>
            <div>
              <strong>{calculations}</strong>
              <small>Calculations</small>
            </div>
          </article>

        </section>

        <section className="progress-content">

          <article className="level-card">

            <div className="section-heading">

              <div>
                <span>YOUR LEVEL</span>
                <h2>{currentLevel.name}</h2>
              </div>

              <strong>
                {points.toLocaleString()} XP
              </strong>

            </div>

            <div className="level-track">
              <div
                className="level-fill"
                style={{
                  width: `${levelProgress}%`,
                }}
              />
            </div>

            <div className="level-labels">
              <span>
                {currentLevel.min} points
              </span>

              {nextLevel ? (
                <span>
                  {nextLevel.min} points →
                  {" "}
                  {nextLevel.name}
                </span>
              ) : (
                <span>
                  Maximum level reached 🌍
                </span>
              )}
            </div>

            {nextLevel && (
              <p className="level-message">
                <b>
                  {Math.max(
                    0,
                    nextLevel.min - points
                  )}
                </b>{" "}
                more points until {nextLevel.name}.
              </p>
            )}

          </article>

          <article className="impact-card">

            <div className="section-heading">
              <div>
                <span>IMPACT SNAPSHOT</span>
                <h2>Where your footprint comes from</h2>
              </div>

              <span className="impact-total">
                {totalCO2.toFixed(2)} kg
              </span>
            </div>

            <div className="impact-bars">

              {[
                ["⚡", "Electricity", categoryTotals.electricity],
                ["🔥", "LPG", categoryTotals.lpg],
                ["🚗", "Transport", categoryTotals.transport],
                ["🥗", "Food", categoryTotals.food],
                ["♻️", "Waste", categoryTotals.waste],
              ].map(([icon, name, value]) => (
                <div className="impact-row" key={name}>

                  <div className="impact-name">
                    <span>{icon}</span>
                    <strong>{name}</strong>
                  </div>

                  <div className="impact-bar">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (value / maxCategory) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <b>
                    {value.toFixed(2)}
                  </b>

                </div>
              ))}

            </div>

          </article>

        </section>

        <section className="badges-section">

          <div className="section-title-row">
            <div>
              <span>ACHIEVEMENTS</span>
              <h2>Your Green Badges</h2>
            </div>

            <button
              onClick={() => navigate("/rewards")}
              type="button"
            >
              View Rewards →
            </button>
          </div>

          <div className="badges-grid">

            {BADGES.map((badge) => {
              const unlocked =
                completedDays >= badge.days;

              return (
                <article
                  className={`progress-badge ${
                    unlocked ? "unlocked" : "locked"
                  }`}
                  key={badge.name}
                >

                  <div className="badge-icon">
                    {unlocked ? badge.icon : "🔒"}
                  </div>

                  <div>
                    <strong>{badge.name}</strong>

                    <p>
                      {badge.description}
                    </p>

                    <small>
                      {unlocked
                        ? "UNLOCKED"
                        : `${badge.days} days required`}
                    </small>
                  </div>

                </article>
              );
            })}

          </div>

        </section>

        <section className="history-section">

          <div className="section-title-row">
            <div>
              <span>TRACKING HISTORY</span>
              <h2>Recent GreenPulse Days</h2>
            </div>

            <button
              onClick={() => navigate("/calculator")}
              type="button"
            >
              Track Today →
            </button>
          </div>

          {recentHistory.length > 0 ? (
            <div className="history-list">

              {recentHistory.map((item, index) => (
                <div
                  className="history-row"
                  key={`${item.date}-${index}`}
                >

                  <div className="history-date">
                    <span>🌿</span>

                    <div>
                      <strong>
                        {item.date}
                      </strong>

                      <small>
                        Daily footprint
                      </small>
                    </div>
                  </div>

                  <div className="history-co2">
                    <strong>
                      {num(item.co2e).toFixed(2)}
                    </strong>

                    <span>
                      kg CO₂e
                    </span>
                  </div>

                  <div className="history-points">
                    +{num(item.points)} 🌱
                  </div>

                </div>
              ))}

            </div>
          ) : (
            <div className="empty-history">

              <div>🌱</div>

              <h3>Your journey starts here.</h3>

              <p>
                Complete your first footprint calculation
                to start building your GreenPulse history.
              </p>

              <button
                onClick={() => navigate("/calculator")}
                type="button"
              >
                Calculate My Footprint
              </button>

            </div>
          )}

        </section>

        <section className="progress-cta">

          <div>
            <span>READY FOR ANOTHER STEP?</span>

            <h2>
              Grow your forest.
            </h2>

            <p>
              Turn your Green Points into progress inside
              the GreenPulse Forest.
            </p>
          </div>

          <button
            onClick={() => navigate("/forest")}
            type="button"
          >
            Enter the Forest 🌲
          </button>

        </section>

      </main>

      <footer className="progress-footer">
        <strong>🌱 GREEN PULSE</strong>
        <span>
          GREEN PULSE CSEAIML • Digital Green Challenge 2026
        </span>
      </footer>

    </div>
  );
}