import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Focus.css";

const FOCUS_KEY = "greenpulse_focus_sessions";

const MODES = [
  {
    id: "deep",
    icon: "🌲",
    title: "Deep Forest",
    minutes: 25,
    description: "A focused session for studying, coding or creating.",
  },
  {
    id: "quick",
    icon: "🍃",
    title: "Quick Breath",
    minutes: 10,
    description: "A short reset when you need to clear your mind.",
  },
  {
    id: "long",
    icon: "🌳",
    title: "Forest Flow",
    minutes: 45,
    description: "A longer uninterrupted session for deep work.",
  },
];

function readSessions() {
  try {
    const raw = localStorage.getItem(FOCUS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Focus() {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [secondsLeft, setSecondsLeft] = useState(
    MODES[0].minutes * 60
  );
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessions, setSessions] = useState(readSessions);

  useEffect(() => {
    if (!running) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timerRef.current);
          setRunning(false);
          setCompleted(true);
          saveCompletedSession();
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [running]);

  function saveCompletedSession() {
    const updated = [
      ...readSessions(),
      {
        date: new Date().toISOString(),
        minutes: selectedMode.minutes,
        mode: selectedMode.id,
      },
    ];

    localStorage.setItem(
      FOCUS_KEY,
      JSON.stringify(updated)
    );

    setSessions(updated);
  }

  function chooseMode(mode) {
    setSelectedMode(mode);
    setSecondsLeft(mode.minutes * 60);
    setRunning(false);
    setCompleted(false);
  }

  function toggleTimer() {
    if (secondsLeft === 0) {
      setSecondsLeft(selectedMode.minutes * 60);
      setCompleted(false);
    }

    setRunning((value) => !value);
  }

  function resetTimer() {
    clearInterval(timerRef.current);
    setRunning(false);
    setCompleted(false);
    setSecondsLeft(selectedMode.minutes * 60);
  }

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (secondsLeft % 60)
    .toString()
    .padStart(2, "0");

  const totalSeconds = selectedMode.minutes * 60;

  const progress =
    totalSeconds > 0
      ? ((totalSeconds - secondsLeft) / totalSeconds) * 100
      : 0;

  const totalFocusMinutes = sessions.reduce(
    (sum, session) => sum + Number(session.minutes || 0),
    0
  );

  return (
    <div className="focus-page">

      <div className="focus-mist focus-mist-one" />
      <div className="focus-mist focus-mist-two" />

      <header className="focus-header">

        <button
          className="focus-brand"
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          <span className="focus-brand-icon">🌱</span>

          <span>
            GREEN<span>PULSE</span>
            <small>Forest Focus</small>
          </span>
        </button>

        <div className="focus-header-actions">
          <button
            onClick={() => navigate("/dashboard")}
            type="button"
          >
            ← Dashboard
          </button>

          <button
            onClick={() => navigate("/forest")}
            type="button"
          >
            Forest 🌲
          </button>
        </div>

      </header>


      <main className="focus-main">

        <section className="focus-hero">

          <div>
            <span className="focus-kicker">
              FOCUS • BREATHE • CREATE
            </span>

            <h1>
              Find your
              <span> quiet forest.</span>
            </h1>

            <p>
              Step away from distractions and spend a few
              intentional minutes focusing on what matters.
            </p>
          </div>

          <div className="focus-stats">

            <div>
              <strong>{sessions.length}</strong>
              <span>Sessions</span>
            </div>

            <div>
              <strong>{totalFocusMinutes}</strong>
              <span>Focus minutes</span>
            </div>

          </div>

        </section>


        <section className="focus-layout">

          <aside className="focus-mode-panel">

            <div className="focus-panel-heading">
              <span>CHOOSE YOUR PATH</span>
              <h2>Focus mode</h2>
            </div>

            <div className="focus-modes">

              {MODES.map((mode) => (

                <button
                  key={mode.id}
                  className={`focus-mode ${
                    selectedMode.id === mode.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => chooseMode(mode)}
                  type="button"
                >

                  <div className="focus-mode-icon">
                    {mode.icon}
                  </div>

                  <div>
                    <strong>{mode.title}</strong>
                    <small>
                      {mode.minutes} minutes
                    </small>
                    <p>{mode.description}</p>
                  </div>

                </button>

              ))}

            </div>

          </aside>


          <section className="focus-timer-card">

            <div className="timer-forest">

              <div
                className="timer-progress-ring"
                style={{
                  background: `conic-gradient(
                    #4ade80 ${progress}%,
                    rgba(255,255,255,0.07) ${progress}% 100%
                  )`,
                }}
              >
                <div className="timer-inner">

                  <div className="timer-tree">
                    {completed ? "🌳" : "🌲"}
                  </div>

                  <span className="timer-mode-label">
                    {completed
                      ? "SESSION COMPLETE"
                      : selectedMode.title.toUpperCase()}
                  </span>

                  <strong className="timer-display">
                    {minutes}:{seconds}
                  </strong>

                  <small>
                    {running
                      ? "Stay in the moment."
                      : completed
                      ? "You made time for yourself."
                      : "Ready when you are."}
                  </small>

                </div>
              </div>

            </div>


            <div className="timer-actions">

              <button
                className="timer-main-button"
                onClick={toggleTimer}
                type="button"
              >
                {running ? "Pause Focus" : completed ? "Start Again" : "Start Focus"}
                <span>
                  {running ? "Ⅱ" : "▶"}
                </span>
              </button>

              <button
                className="timer-reset-button"
                onClick={resetTimer}
                type="button"
              >
                Reset
              </button>

            </div>


            {completed && (
              <div className="focus-complete-message">
                <span>🌱</span>
                <div>
                  <strong>Forest session complete.</strong>
                  <p>
                    Another focused session has been added
                    to your GreenPulse journey.
                  </p>
                </div>
              </div>
            )}

          </section>

        </section>


        <section className="focus-principles">

          <div className="focus-section-heading">
            <span>THE FOREST RULES</span>
            <h2>Protect your attention.</h2>
          </div>

          <div className="principle-grid">

            <article>
              <span>01</span>
              <div>📵</div>
              <h3>Silence the noise</h3>
              <p>
                Put unnecessary notifications away until
                your session ends.
              </p>
            </article>

            <article>
              <span>02</span>
              <div>🎯</div>
              <h3>Choose one thing</h3>
              <p>
                Give your attention to one meaningful task
                instead of splitting it everywhere.
              </p>
            </article>

            <article>
              <span>03</span>
              <div>🌬️</div>
              <h3>Take a breath</h3>
              <p>
                If your attention wanders, pause, breathe,
                and gently return to your task.
              </p>
            </article>

          </div>

        </section>


        <section className="focus-bottom-cta">

          <div className="focus-cta-tree">
            🌲
          </div>

          <div>
            <span>WHEN YOU'RE READY</span>
            <h2>Return to the GreenPulse Forest.</h2>
            <p>
              Your focus is one part of a larger journey.
            </p>
          </div>

          <button
            onClick={() => navigate("/forest")}
            type="button"
          >
            Enter Forest →
          </button>

        </section>

      </main>


      <footer className="focus-footer">
        <strong>🌱 GREEN PULSE</strong>
        <span>
          GREEN PULSE CSEAIML • Digital Green Challenge 2026
        </span>
      </footer>

    </div>
  );
}