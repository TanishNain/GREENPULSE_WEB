import { useEffect, useState } from "react";
import "./Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import { getToken, getUser, logout } from "./auth.js";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://greenpulse-web-tc0g.onrender.com";

const CHALLENGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getUnlockTime(challenge) {
  if (!challenge?.completed) {
    return null;
  }

  const completedAt =
    challenge?.completion?.completed_at ||
    challenge?.completed_at ||
    null;

  if (!completedAt) {
    return null;
  }

  const completedTime = new Date(completedAt).getTime();

  if (Number.isNaN(completedTime)) {
    return null;
  }

  return completedTime + CHALLENGE_COOLDOWN_MS;
}

function formatCountdown(milliseconds) {
  if (milliseconds <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.ceil(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [stats, setStats] = useState({
    points: 0,
    streak: 0,
    level: 1,
    forest_actions: 0,
  });

  const [challenge, setChallenge] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [challengeCompleting, setChallengeCompleting] = useState(false);
  const [challengeError, setChallengeError] = useState("");
  const [challengeMessage, setChallengeMessage] = useState("");
  const [unlockTime, setUnlockTime] = useState(null);
  const [countdown, setCountdown] = useState("");

  // --------------------------------------------------
  // LOAD DASHBOARD STATS
  // --------------------------------------------------

  const loadDashboard = async (token) => {
    const response = await fetch(
      `${API_URL}/api/dashboard?token=${encodeURIComponent(token)}`
    );

    if (!response.ok) {
      throw new Error("Failed to load dashboard");
    }

    const data = await response.json();

    setStats(data);
  };

  // --------------------------------------------------
  // LOAD TODAY'S CHALLENGE
  // --------------------------------------------------

  const loadChallenge = async (token) => {
    setChallengeLoading(true);
    setChallengeError("");

    try {
      const response = await fetch(
        `${API_URL}/api/challenges/today?token=${encodeURIComponent(token)}`
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load today's challenge");
      }

      const data = await response.json();

      setChallenge(data);

      const nextUnlockTime = getUnlockTime(data);

      setUnlockTime(nextUnlockTime);
    } catch (error) {
      console.error("Challenge error:", error);

      setChallengeError(
        "We couldn't load today's challenge. Please try again."
      );
    } finally {
      setChallengeLoading(false);
    }
  };

  // --------------------------------------------------
  // INITIAL DASHBOARD LOAD
  // --------------------------------------------------

  useEffect(() => {
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    Promise.all([
      loadDashboard(token),
      loadChallenge(token),
    ]).catch((error) => {
      console.error("Dashboard error:", error);
    });
  }, []);

  // --------------------------------------------------
  // 24-HOUR COUNTDOWN
  // --------------------------------------------------

  useEffect(() => {
    if (!unlockTime) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const remaining = unlockTime - Date.now();

      if (remaining <= 0) {
        setCountdown("00:00:00");

        const token = getToken();

        if (token) {
          loadChallenge(token);
        }

        return;
      }

      setCountdown(formatCountdown(remaining));
    };

    updateCountdown();

    const interval = window.setInterval(
      updateCountdown,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [unlockTime]);

  // --------------------------------------------------
  // BACK BUTTON
  // --------------------------------------------------

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // --------------------------------------------------
  // COMPLETE DAILY CHALLENGE
  // --------------------------------------------------

  const handleCompleteChallenge = async () => {
    const token = getToken();

    if (
      !token ||
      !challenge?.challenge?.id ||
      challenge.completed ||
      challengeCompleting ||
      (unlockTime && unlockTime > Date.now())
    ) {
      return;
    }

    setChallengeCompleting(true);
    setChallengeError("");
    setChallengeMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/challenges/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            challenge_id: challenge.challenge.id,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      // ------------------------------------------------
      // ALREADY COMPLETED
      // ------------------------------------------------

      if (!response.ok) {
        if (response.status === 409) {
          const completedAt =
            data?.completion?.completed_at ||
            new Date().toISOString();

          const nextUnlock =
            new Date(completedAt).getTime() +
            CHALLENGE_COOLDOWN_MS;

          setChallenge((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              completed: true,
              completion: {
                ...(current.completion || {}),
                completed_at: completedAt,
              },
            };
          });

          setUnlockTime(nextUnlock);

          setChallengeMessage(
            "Today's challenge has already been completed."
          );

          await loadDashboard(token);

          return;
        }

        throw new Error(
          data?.detail || "Unable to complete challenge"
        );
      }

      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      const completedAt =
        data?.completion?.completed_at ||
        new Date().toISOString();

      const nextUnlock =
        new Date(completedAt).getTime() +
        CHALLENGE_COOLDOWN_MS;

      setChallenge((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          completed: true,
          completion: {
            completed_at: completedAt,
            points: data.progress.points,
          },
        };
      });

      setUnlockTime(nextUnlock);

      setStats((current) => ({
        ...current,
        points: data.progress.points,
        streak: data.progress.streak,
        level: data.progress.level,
        forest_actions: data.progress.forest_actions,
      }));

      setChallengeMessage(
        `Challenge completed! +${data.challenge.points} points 🌱`
      );
    } catch (error) {
      console.error("Challenge completion error:", error);

      setChallengeError(
        error.message ||
          "Something went wrong while completing the challenge."
      );
    } finally {
      setChallengeCompleting(false);
    }
  };

  const challengeLocked =
    Boolean(unlockTime) &&
    unlockTime > Date.now();

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="dashboard-page">

      {/* TOP BAR */}
      <header className="dashboard-topbar">

        <button
          type="button"
          onClick={handleBack}
          className="dashboard-back-button"
          aria-label="Go back to the previous page"
        >
          ← Back to Home
        </button>

        <Link to="/" className="dashboard-brand">
          <span>🌱</span>
          GREEN<span>PULSE</span>
        </Link>

        <div className="dashboard-account">

          <span>
            🌱 {user?.username || "User"}
          </span>

          {user?.role === "admin" && (
            <span className="dashboard-admin">
              ADMIN
            </span>
          )}

          <button
            type="button"
            onClick={logout}
          >
            Log out
          </button>

        </div>
      </header>

      {/* HERO */}
      <section className="dashboard-hero">

        <div>

          <span className="dashboard-eyebrow">
            YOUR GREENPULSE
          </span>

          <h1>
            Welcome back,
            <br />
            <span>
              {user?.username || "Explorer"}.
            </span>
          </h1>

          <p>
            Your everyday actions become measurable impact.
            Keep going and build your streak.
          </p>

        </div>

        <div className="dashboard-impact">

          <span>
            YOUR IMPACT
          </span>

          <strong>
            {stats.points}
          </strong>

          <small>
            points
          </small>

        </div>

      </section>

      {/* STATS */}
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

      {/* DAILY CHALLENGE */}
      <section className="dashboard-challenge-section">

        <div className="dashboard-section-heading">

          <span>DAILY CHALLENGE</span>

          <h2>
            One action. Every day.
          </h2>

        </div>

        {/* LOADING */}
        {challengeLoading && (
          <article className="dashboard-challenge-card dashboard-challenge-loading">

            <div className="challenge-loading-icon">
              🌱
            </div>

            <div>
              <span className="challenge-loading-line"></span>
              <span className="challenge-loading-line short"></span>
              <span className="challenge-loading-line"></span>
            </div>

          </article>
        )}

        {/* ERROR */}
        {!challengeLoading && challengeError && (
          <article className="dashboard-challenge-card dashboard-challenge-error">

            <div className="challenge-icon">
              ⚠️
            </div>

            <div className="challenge-content">

              <span className="challenge-label">
                SOMETHING WENT WRONG
              </span>

              <h3>
                Challenge unavailable
              </h3>

              <p>
                {challengeError}
              </p>

              <button
                type="button"
                className="challenge-action-button"
                onClick={() => {
                  const token = getToken();

                  if (token) {
                    loadChallenge(token);
                  }
                }}
              >
                Try again
              </button>

            </div>

          </article>
        )}

        {/* CHALLENGE */}
        {!challengeLoading &&
          !challengeError &&
          challenge?.challenge && (

            <article
              className={`dashboard-challenge-card ${
                challenge.completed
                  ? "challenge-completed"
                  : ""
              } ${
                challengeLocked
                  ? "challenge-locked"
                  : ""
              }`}
            >

              <div className="challenge-icon-wrap">

                <span className="challenge-icon">
                  {challengeLocked
                    ? "🔒"
                    : challenge.challenge.icon}
                </span>

              </div>

              <div className="challenge-content">

                <div className="challenge-meta">

                  <span
                    className={
                      challengeLocked
                        ? "challenge-lock-label"
                        : "challenge-label"
                    }
                  >
                    {challengeLocked
                      ? "NEXT CHALLENGE LOCKED"
                      : challenge.challenge.category}
                  </span>

                  {!challengeLocked && (
                    <span className="challenge-points">
                      +{challenge.challenge.points} POINTS
                    </span>
                  )}

                </div>

                <h3>
                  {challengeLocked
                    ? "Your next challenge is growing."
                    : challenge.challenge.title}
                </h3>

                <p className="challenge-description">
                  {challengeLocked
                    ? "You've completed today's sustainability action. Your next challenge unlocks after the 24-hour cooldown."
                    : challenge.challenge.description}
                </p>

                {!challengeLocked && (
                  <div className="challenge-action-box">

                    <span>ACTION</span>

                    <strong>
                      {challenge.challenge.action}
                    </strong>

                  </div>
                )}

                {challengeMessage && (
                  <div className="challenge-success-message">
                    ✓ {challengeMessage}
                  </div>
                )}

                {/* LOCKED STATE */}
                {challengeLocked ? (

                  <div className="challenge-unlock-box">

                    <span>
                      NEXT CHALLENGE UNLOCKS IN
                    </span>

                    <div className="challenge-countdown">
                      {countdown || "24:00:00"}
                      <small>
                        remaining
                      </small>
                    </div>

                    <p className="challenge-unlock-note">
                      Keep your progress safe. The next action
                      becomes available automatically.
                    </p>

                  </div>

                ) : challenge.completed ? (

                  /* COMPLETED STATE */
                  <div className="challenge-completed-state">

                    <span className="challenge-check">
                      ✓
                    </span>

                    <div>

                      <strong>
                        Completed today
                      </strong>

                      <small>
                        Your next challenge is unlocking now.
                      </small>

                    </div>

                  </div>

                ) : (

                  /* ACTIVE STATE */
                  <div className="challenge-controls">

                    <button
                      type="button"
                      className="challenge-action-button"
                      onClick={handleCompleteChallenge}
                      disabled={challengeCompleting}
                    >
                      {challengeCompleting
                        ? "Saving..."
                        : "I completed this →"}
                    </button>

                    <span className="challenge-honesty">
                      Complete only if you genuinely did it.
                    </span>

                  </div>

                )}

              </div>

            </article>
          )}

      </section>

      {/* ACTIONS */}
      <section className="dashboard-actions">

        <div className="dashboard-section-heading">

          <span>KEEP MOVING</span>

          <h2>
            What will you do today?
          </h2>

        </div>

        <div className="dashboard-grid">

          {/* CALCULATOR */}
          <Link
            to="/explore"
            className="dashboard-card featured"
          >
            <span>🌍</span>

            <h3>
              Calculate your impact
            </h3>

            <p>
              Measure the footprint of your everyday choices.
            </p>

            <strong>
              Start calculating →
            </strong>
          </Link>

          {/* DAILY CHALLENGES */}
          <article className="dashboard-card dashboard-card-live">

            <span>🎯</span>

            <h3>
              Daily challenges
            </h3>

            <p>
              Complete one practical sustainability action every
              day and grow your progress.
            </p>

            <strong>
              Today's challenge ↑
            </strong>

          </article>

          {/* FOREST */}
          <Link
            to="/forest"
            className="dashboard-card featured"
          >

            <span>🌳</span>

            <h3>
              My Forest
            </h3>

            <p>
              Watch your actions grow into your own digital
              ecosystem.
            </p>

            <strong>
              Enter your forest →
            </strong>

          </Link>

          {/* POMODORO */}
          <div className="dashboard-card">

            <span>⏱️</span>

            <h3>
              Focus with Pomodoro
            </h3>

            <p>
              Turn focused time into another part of your journey.
            </p>

            <strong>
              Coming next →
            </strong>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        GREEN PULSE · BUILDING BETTER HABITS, ONE ACTION AT A TIME.
      </footer>

    </main>
  );
}

export default Dashboard;