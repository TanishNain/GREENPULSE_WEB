import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Rewards.css";

const STORAGE_KEY = "greenpulse_year_data";
const REWARDS_KEY = "greenpulse_unlocked_rewards";

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
    id: "first-footprint",
    days: 1,
    icon: "👣",
    name: "First Footprint",
    description: "Your first step into the GreenPulse journey.",
  },
  {
    id: "day-explorer",
    days: 7,
    icon: "🧭",
    name: "Day Explorer",
    description: "Track your impact across seven different days.",
  },
  {
    id: "green-streak",
    days: 30,
    icon: "🔥",
    name: "Green Streak",
    description: "Build a 30-day environmental tracking habit.",
  },
  {
    id: "day-guardian",
    days: 100,
    icon: "🛡️",
    name: "Day Guardian",
    description: "Reach one hundred tracked GreenPulse days.",
  },
  {
    id: "earth-guardian",
    days: 365,
    icon: "🌍",
    name: "Earth Guardian",
    description: "Complete a full year of GreenPulse tracking.",
  },
];

const MILESTONE_REWARDS = [
  {
    id: "seed",
    icon: "🌰",
    title: "Forest Seed",
    requirement: 25,
    description: "A symbolic seed representing your first environmental actions.",
  },
  {
    id: "sapling",
    icon: "🌱",
    title: "Young Sapling",
    requirement: 100,
    description: "Your journey has grown enough to unlock your first sapling.",
  },
  {
    id: "grove",
    icon: "🌳",
    title: "Living Grove",
    requirement: 500,
    description: "A bigger milestone for a growing GreenPulse journey.",
  },
  {
    id: "guardian",
    icon: "🛡️",
    title: "Guardian Crest",
    requirement: 1000,
    description: "A symbolic crest for a serious long-term commitment.",
  },
  {
    id: "planet",
    icon: "🌍",
    title: "Planet Guardian",
    requirement: 5000,
    description: "The highest GreenPulse milestone currently available.",
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

function readUnlockedRewards() {
  try {
    const raw = localStorage.getItem(REWARDS_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function number(value) {
  const n = Number(value);

  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function Rewards() {
  const navigate = useNavigate();

  const [data, setData] = useState(readData);
  const [unlockedRewards, setUnlockedRewards] = useState(
    readUnlockedRewards
  );

  useEffect(() => {
    const refresh = () => {
      setData(readData());
      setUnlockedRewards(readUnlockedRewards());
    };

    window.addEventListener("greenpulse:data-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("greenpulse:data-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const points = number(data.total_points);

  const history = Array.isArray(data.history)
    ? data.history
    : [];

  const completedDays = number(
    data.completed_days || history.length
  );

  const currentLevel = useMemo(() => {
    let current = LEVELS[0];

    LEVELS.forEach((level) => {
      if (points >= level.min) {
        current = level;
      }
    });

    return current;
  }, [points]);

  const nextLevel = useMemo(() => {
    return (
      LEVELS.find((level) => level.min > points) ||
      null
    );
  }, [points]);

  const levelProgress = nextLevel
    ? Math.min(
        100,
        ((points - currentLevel.min) /
          (nextLevel.min - currentLevel.min)) *
          100
      )
    : 100;

  const unlockedBadges = BADGES.filter(
    (badge) => completedDays >= badge.days
  ).length;

  const unlockedMilestones = MILESTONE_REWARDS.filter(
    (reward) => points >= reward.requirement
  ).length;

  function unlockReward(id) {
    if (unlockedRewards.includes(id)) return;

    const updated = [...unlockedRewards, id];

    setUnlockedRewards(updated);

    localStorage.setItem(
      REWARDS_KEY,
      JSON.stringify(updated)
    );
  }

  return (
    <div className="rewards-page">

      <div className="rewards-bg-orb rewards-orb-one" />
      <div className="rewards-bg-orb rewards-orb-two" />

      <header className="rewards-header">

        <button
          className="rewards-brand"
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          <span className="rewards-brand-icon">
            🌱
          </span>

          <span>
            GREEN<span>PULSE</span>
            <small>Rewards Sanctuary</small>
          </span>
        </button>

        <div className="rewards-header-actions">

          <button
            onClick={() => navigate("/progress")}
            type="button"
          >
            ← Progress
          </button>

          <button
            className="rewards-dashboard-button"
            onClick={() => navigate("/dashboard")}
            type="button"
          >
            Dashboard
          </button>

        </div>

      </header>


      <main className="rewards-main">

        {/* HERO */}

        <section className="rewards-hero">

          <div className="rewards-hero-copy">

            <span className="rewards-kicker">
              YOUR JOURNEY • YOUR MILESTONES
            </span>

            <h1>
              Every step
              <span> deserves a symbol.</span>
            </h1>

            <p>
              GreenPulse rewards are designed to make your
              environmental journey visible — from your first
              footprint to becoming an Earth Guardian.
            </p>

            <div className="rewards-hero-actions">

              <button
                onClick={() => navigate("/challenges")}
                type="button"
              >
                Complete Challenges
                <span>→</span>
              </button>

              <button
                onClick={() => navigate("/forest")}
                type="button"
                className="rewards-secondary-button"
              >
                Visit Forest 🌲
              </button>

            </div>

          </div>


          <div className="rewards-emblem">

            <div className="emblem-rays" />

            <div className="emblem-circle">

              <div className="emblem-leaf">
                {currentLevel.icon}
              </div>

              <small>CURRENT LEVEL</small>

              <strong>
                {currentLevel.name}
              </strong>

              <span>
                {points.toLocaleString()} points
              </span>

            </div>

          </div>

        </section>


        {/* SUMMARY */}

        <section className="rewards-summary">

          <article className="reward-summary-card">

            <span>🌱</span>

            <div>
              <strong>
                {points.toLocaleString()}
              </strong>

              <small>
                Green Points
              </small>
            </div>

          </article>


          <article className="reward-summary-card">

            <span>🏅</span>

            <div>
              <strong>
                {unlockedBadges}/{BADGES.length}
              </strong>

              <small>
                Badges unlocked
              </small>
            </div>

          </article>


          <article className="reward-summary-card">

            <span>🎁</span>

            <div>
              <strong>
                {unlockedMilestones}/
                {MILESTONE_REWARDS.length}
              </strong>

              <small>
                Milestones unlocked
              </small>
            </div>

          </article>

        </section>


        {/* LEVEL JOURNEY */}

        <section className="reward-level-section">

          <div className="reward-section-heading">

            <div>
              <span>LEVEL JOURNEY</span>

              <h2>
                Grow from seed to guardian.
              </h2>
            </div>

            <p>
              Your Green Points determine which stage
              of the GreenPulse journey you've reached.
            </p>

          </div>


          <div className="level-road">

            <div className="level-road-line">

              <div
                className="level-road-fill"
                style={{
                  width: `${levelProgress}%`,
                }}
              />

            </div>


            <div className="level-road-items">

              {LEVELS.map((level) => {

                const reached =
                  points >= level.min;

                const active =
                  currentLevel.name === level.name;

                return (
                  <div
                    className={`level-road-item ${
                      reached ? "reached" : ""
                    } ${active ? "active" : ""}`}
                    key={level.name}
                  >

                    <div className="level-road-icon">
                      {reached
                        ? level.icon
                        : "🔒"}
                    </div>

                    <strong>
                      {level.name}
                    </strong>

                    <span>
                      {level.min.toLocaleString()} pts
                    </span>

                  </div>
                );
              })}

            </div>

          </div>

        </section>


        {/* BADGES */}

        <section className="rewards-section">

          <div className="reward-section-heading">

            <div>
              <span>BADGE COLLECTION</span>

              <h2>
                Proof of your journey.
              </h2>
            </div>

            <button
              onClick={() => navigate("/progress")}
              type="button"
              className="section-link-button"
            >
              View Progress →
            </button>

          </div>


          <div className="reward-badges-grid">

            {BADGES.map((badge) => {

              const unlocked =
                completedDays >= badge.days;

              return (
                <article
                  className={`reward-badge-card ${
                    unlocked ? "unlocked" : "locked"
                  }`}
                  key={badge.id}
                >

                  <div className="reward-badge-icon">
                    {unlocked
                      ? badge.icon
                      : "🔒"}
                  </div>

                  <div className="reward-badge-body">

                    <span className="reward-badge-status">
                      {unlocked
                        ? "UNLOCKED"
                        : "LOCKED"}
                    </span>

                    <h3>
                      {badge.name}
                    </h3>

                    <p>
                      {badge.description}
                    </p>

                    <div className="reward-badge-requirement">
                      {unlocked
                        ? "✓ Journey milestone reached"
                        : `${badge.days} tracked days required`}
                    </div>

                  </div>

                </article>
              );
            })}

          </div>

        </section>


        {/* MILESTONE REWARDS */}

        <section className="rewards-section milestone-section">

          <div className="reward-section-heading">

            <div>
              <span>MILESTONE REWARDS</span>

              <h2>
                Build something that lasts.
              </h2>
            </div>

            <p>
              Unlock symbolic rewards as your Green
              Points grow.
            </p>

          </div>


          <div className="milestone-grid">

            {MILESTONE_REWARDS.map((reward) => {

              const unlocked =
                points >= reward.requirement;

              const claimed =
                unlockedRewards.includes(reward.id);

              return (
                <article
                  className={`milestone-card ${
                    unlocked ? "available" : "locked"
                  }`}
                  key={reward.id}
                >

                  <div className="milestone-icon">
                    {unlocked
                      ? reward.icon
                      : "🔒"}
                  </div>

                  <div className="milestone-content">

                    <span>
                      {reward.requirement.toLocaleString()} POINTS
                    </span>

                    <h3>
                      {reward.title}
                    </h3>

                    <p>
                      {reward.description}
                    </p>

                    {unlocked ? (

                      claimed ? (

                        <div className="milestone-claimed">
                          ✓ Unlocked in your collection
                        </div>

                      ) : (

                        <button
                          onClick={() =>
                            unlockReward(reward.id)
                          }
                          type="button"
                        >
                          Add to Collection ✦
                        </button>

                      )

                    ) : (

                      <div className="milestone-locked">
                        🔒 {Math.max(
                          0,
                          reward.requirement - points
                        ).toLocaleString()} points remaining
                      </div>

                    )}

                  </div>

                </article>
              );
            })}

          </div>

        </section>


        {/* NEXT TARGET */}

        {nextLevel && (

          <section className="next-reward-card">

            <div className="next-reward-symbol">
              {nextLevel.icon}
            </div>

            <div className="next-reward-copy">

              <span>
                YOUR NEXT LEVEL
              </span>

              <h2>
                {nextLevel.name}
              </h2>

              <p>
                You need{" "}
                <strong>
                  {Math.max(
                    0,
                    nextLevel.min - points
                  ).toLocaleString()}
                </strong>{" "}
                more Green Points to reach your
                next level.
              </p>

            </div>

            <button
              onClick={() => navigate("/calculator")}
              type="button"
            >
              Track Today
              <span>→</span>
            </button>

          </section>

        )}


        {/* FOOT CTA */}

        <section className="rewards-final-cta">

          <div>

            <span>
              THE JOURNEY CONTINUES
            </span>

            <h2>
              Your forest is waiting.
            </h2>

            <p>
              Take what you've earned and step back
              into the world of GreenPulse.
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


      <footer className="rewards-footer">

        <strong>
          🌱 GREEN PULSE
        </strong>

        <span>
          GREEN PULSE CSEAIML • Digital Green Challenge 2026
        </span>

      </footer>

    </div>
  );
}