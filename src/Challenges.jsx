import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Challenges.css";

const STORAGE_KEY = "greenpulse_year_data";

const CHALLENGES = [
  {
    id: "green-start",
    icon: "🌱",
    title: "Green Start",
    description: "Complete your first GreenPulse footprint.",
    reward: 25,
    type: "days",
    target: 1,
    label: "1 day",
  },
  {
    id: "week-warrior",
    icon: "🔥",
    title: "7-Day Warrior",
    description: "Track your environmental impact for 7 different days.",
    reward: 75,
    type: "days",
    target: 7,
    label: "7 days",
  },
  {
    id: "forest-builder",
    icon: "🌲",
    title: "Forest Builder",
    description: "Reach 150 Green Points and help your virtual forest grow.",
    reward: 100,
    type: "points",
    target: 150,
    label: "150 points",
  },
  {
    id: "green-traveller",
    icon: "🚲",
    title: "Green Traveller",
    description: "Log a day using walking, cycling, bus or train.",
    reward: 50,
    type: "greenTravel",
    target: 1,
    label: "1 green trip",
  },
  {
    id: "food-choice",
    icon: "🥗",
    title: "Planet Plate",
    description: "Log a vegetarian meal in your GreenPulse journey.",
    reward: 40,
    type: "vegetarian",
    target: 1,
    label: "1 vegetarian meal",
  },
  {
    id: "thirty-days",
    icon: "🌍",
    title: "30-Day Guardian",
    description: "Build a 30-day GreenPulse tracking journey.",
    reward: 250,
    type: "days",
    target: 30,
    label: "30 days",
  },
];

function readData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getChallengeProgress(challenge, data) {
  const history = Array.isArray(data.history) ? data.history : [];

  if (challenge.type === "days") {
    return Math.min(num(data.completed_days || history.length), challenge.target);
  }

  if (challenge.type === "points") {
    return Math.min(num(data.total_points), challenge.target);
  }

  if (challenge.type === "greenTravel") {
    const count = history.filter((item) => {
      const mode = item?.inputs?.transportMode;
      return (
        mode === "Walking / Cycling" ||
        mode === "Bus" ||
        mode === "Train"
      );
    }).length;

    return Math.min(count, challenge.target);
  }

  if (challenge.type === "vegetarian") {
    const count = history.filter(
      (item) => item?.inputs?.diet === "Vegetarian"
    ).length;

    return Math.min(count, challenge.target);
  }

  return 0;
}

export default function Challenges() {
  const navigate = useNavigate();
  const [data, setData] = useState(readData);
  const [claimed, setClaimed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("greenpulse_claimed_challenges") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const refresh = () => setData(readData());

    window.addEventListener("greenpulse:data-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("greenpulse:data-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const completedCount = useMemo(() => {
    return CHALLENGES.filter((challenge) => {
      const progress = getChallengeProgress(challenge, data);
      return progress >= challenge.target;
    }).length;
  }, [data]);

  const totalAvailable = CHALLENGES.reduce(
    (sum, challenge) => sum + challenge.reward,
    0
  );

  function claimChallenge(challenge) {
    const progress = getChallengeProgress(challenge, data);

    if (progress < challenge.target || claimed.includes(challenge.id)) {
      return;
    }

    const updatedClaimed = [...claimed, challenge.id];

    setClaimed(updatedClaimed);

    localStorage.setItem(
      "greenpulse_claimed_challenges",
      JSON.stringify(updatedClaimed)
    );

    const currentData = readData();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...currentData,
        total_points: num(currentData.total_points) + challenge.reward,
      })
    );

    window.dispatchEvent(
      new CustomEvent("greenpulse:data-updated")
    );
  }

  return (
    <div className="challenges-page">
      <div className="challenge-glow challenge-glow-one" />
      <div className="challenge-glow challenge-glow-two" />

      <header className="challenges-header">
        <button
          className="challenge-brand"
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          <span className="challenge-brand-icon">🌱</span>
          <span>
            GREEN<span>PULSE</span>
            <small>Challenge Centre</small>
          </span>
        </button>

        <div className="challenge-header-actions">
          <button onClick={() => navigate("/dashboard")} type="button">
            ← Dashboard
          </button>

          <button
            className="challenge-track-button"
            onClick={() => navigate("/calculator")}
            type="button"
          >
            Track Today 🌱
          </button>
        </div>
      </header>

      <main className="challenges-main">
        <section className="challenges-hero">
          <div className="challenge-hero-copy">
            <span className="challenge-kicker">
              DAILY • WEEKLY • LONG-TERM
            </span>

            <h1>
              Small actions.
              <span> Real momentum.</span>
            </h1>

            <p>
              Take on simple environmental challenges, earn Green Points,
              and keep building your GreenPulse journey.
            </p>

            <div className="challenge-hero-actions">
              <button
                onClick={() => navigate("/calculator")}
                type="button"
              >
                Make Today's Impact
                <span>→</span>
              </button>

              <button
                className="secondary-challenge-button"
                onClick={() => navigate("/progress")}
                type="button"
              >
                View Progress
              </button>
            </div>
          </div>

          <div className="challenge-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />

            <div className="challenge-planet">
              <span>🌍</span>
            </div>

            <div className="orbit-chip chip-one">🌱 +25</div>
            <div className="orbit-chip chip-two">🔥 +75</div>
            <div className="orbit-chip chip-three">🌲 +100</div>
          </div>
        </section>

        <section className="challenge-overview">
          <div className="overview-card">
            <span>🏆</span>
            <div>
              <strong>{completedCount}</strong>
              <small>Challenges completed</small>
            </div>
          </div>

          <div className="overview-card">
            <span>🌱</span>
            <div>
              <strong>{num(data.total_points).toLocaleString()}</strong>
              <small>Current Green Points</small>
            </div>
          </div>

          <div className="overview-card">
            <span>🎁</span>
            <div>
              <strong>{totalAvailable}</strong>
              <small>Points across challenges</small>
            </div>
          </div>
        </section>

        <section className="challenge-section">
          <div className="challenge-section-heading">
            <div>
              <span>YOUR MISSIONS</span>
              <h2>Choose your next challenge</h2>
            </div>

            <p>
              Progress updates automatically when you track your GreenPulse.
            </p>
          </div>

          <div className="challenge-grid">
            {CHALLENGES.map((challenge) => {
              const progress = getChallengeProgress(challenge, data);
              const completed = progress >= challenge.target;
              const isClaimed = claimed.includes(challenge.id);

              const percentage = Math.min(
                100,
                (progress / challenge.target) * 100
              );

              return (
                <article
                  className={`challenge-card ${
                    completed ? "completed" : ""
                  } ${isClaimed ? "claimed" : ""}`}
                  key={challenge.id}
                >
                  <div className="challenge-card-top">
                    <div className="challenge-icon">
                      {challenge.icon}
                    </div>

                    <span className="challenge-reward">
                      +{challenge.reward} 🌱
                    </span>
                  </div>

                  <div className="challenge-card-content">
                    <div className="challenge-status">
                      {isClaimed
                        ? "REWARD CLAIMED"
                        : completed
                        ? "READY TO CLAIM"
                        : "IN PROGRESS"}
                    </div>

                    <h3>{challenge.title}</h3>

                    <p>{challenge.description}</p>

                    <div className="challenge-progress-label">
                      <span>{challenge.label}</span>
                      <strong>
                        {progress}/{challenge.target}
                      </strong>
                    </div>

                    <div className="challenge-progress-track">
                      <div
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {completed && !isClaimed ? (
                      <button
                        className="claim-button"
                        onClick={() => claimChallenge(challenge)}
                        type="button"
                      >
                        Claim +{challenge.reward} Points
                        <span>✦</span>
                      </button>
                    ) : isClaimed ? (
                      <div className="claimed-message">
                        ✓ Reward added to your journey
                      </div>
                    ) : (
                      <button
                        className="challenge-card-action"
                        onClick={() => navigate("/calculator")}
                        type="button"
                      >
                        Continue Tracking →
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="challenge-tip">
          <div className="tip-icon">💡</div>

          <div>
            <span>GREEN PULSE TIP</span>
            <h2>You don't have to change everything at once.</h2>
            <p>
              One smaller choice repeated consistently can become a
              powerful habit. Track what you can, explore your progress,
              and let your journey grow naturally.
            </p>
          </div>

          <button
            onClick={() => navigate("/forest")}
            type="button"
          >
            Visit Forest 🌲
          </button>
        </section>
      </main>

      <footer className="challenges-footer">
        <strong>🌱 GREEN PULSE</strong>
        <span>
          GREEN PULSE CSEAIML • Digital Green Challenge 2026
        </span>
      </footer>
    </div>
  );
}