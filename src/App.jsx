import React from "react";
import "./App.css";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard.jsx";
import Explore from "./Explore.jsx";
import Reviews from "./Reviews.jsx";
import Auth from "./Auth.jsx";
import Dashboard from "./Dashboard.jsx";
import Forest from "./Forest.jsx";
import Calculator from "./Calculator.jsx";
import Challenges from "./Challenges.jsx";
import Rewards from "./Rewards.jsx";
import Focus from "./Focus.jsx";
import Settings from "./Settings.jsx";
import Feedback from "./Feedback.jsx";

import { getUser, logout } from "./auth.js";

/* =========================================================
   GREEN PULSE — LIVE DATA
========================================================= */

const STORAGE_KEY = "greenpulse_year_data";

const LEVELS = [
  { min: 0, name: "Eco Starter", icon: "🌱" },
  { min: 100, name: "Green Explorer", icon: "🍃" },
  { min: 250, name: "Eco Learner", icon: "🌿" },
  { min: 500, name: "Climate Champion", icon: "🌳" },
  { min: 1000, name: "Planet Protector", icon: "🌲" },
  { min: 2000, name: "Green Leader", icon: "🌎" },
  { min: 5000, name: "Earth Guardian", icon: "🌍" },
];

function readGreenPulseData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {
        total_points: 0,
        total_calculations: 0,
        completed_days: 0,
        streak: 0,
        total_co2e: 0,
      };
    }

    const data = JSON.parse(raw);

    return {
      total_points: Number(data.total_points || 0),
      total_calculations: Number(data.total_calculations || 0),
      completed_days: Number(data.completed_days || 0),
      streak: Number(data.streak || 0),
      total_co2e: Number(data.total_co2e || 0),
    };
  } catch {
    return {
      total_points: 0,
      total_calculations: 0,
      completed_days: 0,
      streak: 0,
      total_co2e: 0,
    };
  }
}

function getLevel(points) {
  let current = LEVELS[0];

  for (const level of LEVELS) {
    if (points >= level.min) {
      current = level;
    }
  }

  return current;
}

function getNextLevel(points) {
  for (const level of LEVELS) {
    if (points < level.min) {
      return level;
    }
  }

  return null;
}


/* =========================================================
   GREEN PULSE — LANDING PAGE
========================================================= */

function HomePage() {
  const user = getUser();
  const navigate = useNavigate();

  const [data, setData] = React.useState(readGreenPulseData);

  React.useEffect(() => {
    const refresh = () => {
      setData(readGreenPulseData());
    };

    window.addEventListener("greenpulse:data-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("greenpulse:data-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const points = data.total_points;
  const calculations = data.total_calculations;
  const days = data.completed_days;
  const streak = data.streak;
  const footprint = data.total_co2e;

  const level = getLevel(points);
  const nextLevel = getNextLevel(points);

  let progress = 100;

  if (nextLevel) {
    const previousLevel = level.min;
    const range = nextLevel.min - previousLevel;

    progress =
      range > 0
        ? Math.min(
            100,
            Math.max(
              0,
              ((points - previousLevel) / range) * 100
            )
          )
        : 0;
  }

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  function handleLogout() {
    logout();
    navigate("/");
    window.location.reload();
  }

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">

        <button
          className="logo"
          type="button"
          onClick={() => scrollToSection("home")}
          aria-label="GreenPulse home"
        >
          <span className="logo-mark">🌱</span>

          <span className="logo-text">
            GREEN<span>PULSE</span>
          </span>
        </button>


        <div className="nav-links">

          <button
            type="button"
            onClick={() => scrollToSection("about")}
          >
            About
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("how")}
          >
            How it works
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("feedback")}
          >
            Feedback
          </button>

        </div>


        <div className="nav-actions">

          <Link
            to="/explore"
            className="nav-button"
          >
            Explore GreenPulse
            <span>↗</span>
          </Link>

          {user ? (
            <div className="nav-user">

              <Link
                to="/dashboard"
                className="nav-dashboard"
              >
                Dashboard
              </Link>

              <span className="nav-username">
                🌱 {user.username || user.name || "Green Guardian"}
              </span>

              {user.role === "admin" && (
                <span className="nav-admin">
                  ADMIN
                </span>
              )}

              <button
                type="button"
                onClick={handleLogout}
              >
                Log out
              </button>

            </div>
          ) : (
            <Link
              to="/auth"
              className="nav-login"
            >
              Log in
            </Link>
          )}

        </div>

      </nav>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>

        {/* ===================================================
            HERO
        =================================================== */}

        <section
          id="home"
          className="hero"
        >

          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />


          <div className="hero-background-mark">
            GP
          </div>


          {/* WINDOWS / DESKTOP */}

          <Link
            to="/calculator"
            className="windows-download"
          >

            <span className="windows-icon">
              <span />
              <span />
              <span />
              <span />
            </span>

            <span className="download-content">

              <small>
                GREENPULSE DESKTOP
              </small>

              <strong>
                Open GreenPulse Calculator
              </strong>

            </span>

            <span className="download-arrow">
              →
            </span>

          </Link>


          {/* HERO COPY */}

          <div className="hero-content">

            <div className="eyebrow">
              <span className="pulse-dot" />

              <span>
                YOUR EVERYDAY IMPACT, VISUALIZED
              </span>
            </div>


            <h1>
              Make your
              <br />
              <span>impact visible.</span>
            </h1>


            <p className="hero-description">
              GreenPulse turns everyday environmental
              choices into clear feedback, meaningful
              progress, and a journey you can actually see.
            </p>


            <div className="hero-buttons">

              <Link
                to="/dashboard"
                className="primary-button"
              >
                Open Dashboard
                <span>→</span>
              </Link>

              <button
                type="button"
                className="secondary-button"
                onClick={() => scrollToSection("how")}
              >
                Discover GreenPulse
                <span>↓</span>
              </button>

            </div>


            {/* LIVE HERO MICRO-STATS */}

            <div className="hero-stats">

              <div>
                <strong>
                  {calculations}
                </strong>

                <span>
                  Calculations
                </span>
              </div>

              <div>
                <strong>
                  {days}
                </strong>

                <span>
                  Days tracked
                </span>
              </div>

              <div>
                <strong>
                  {streak}
                </strong>

                <span>
                  Day streak
                </span>
              </div>

            </div>

          </div>


          {/* =================================================
              HERO LIVE CARD
          ================================================= */}

          <div className="hero-visual">

            <div className="glow" />

            <div className="hero-ring ring-large" />
            <div className="hero-ring ring-small" />


            <div className="impact-card">

              <div className="card-top">

                <div>
                  <span className="card-overline">
                    GREENPULSE
                  </span>

                  <strong>
                    Personal Impact
                  </strong>
                </div>

                <span className="live-dot">
                  ● LIVE
                </span>

              </div>


              {/* SCORE */}

              <div className="score-circle">

                <div
                  className="score-progress"
                  style={{
                    "--progress": `${Math.min(
                      100,
                      Math.max(7, progress)
                    ) * 3.6}deg`,
                  }}
                />

                <div className="circle-inner">

                  <span className="score">
                    {points}
                  </span>

                  <small>
                    GREEN POINTS
                  </small>

                </div>

              </div>


              {/* STATUS */}

              <div className="impact-status">

                <div className="status-icon">
                  {level.icon}
                </div>

                <div className="status-copy">

                  <span className="status-label">
                    CURRENT LEVEL
                  </span>

                  <strong>
                    {level.name}
                  </strong>

                  <small>
                    {nextLevel
                      ? `${Math.max(
                          0,
                          nextLevel.min - points
                        )} points to ${nextLevel.name}`
                      : "You've reached the highest level"}
                  </small>

                </div>

                <span className="status-arrow">
                  ↗
                </span>

              </div>


              {/* LEVEL BAR */}

              <div className="level-progress">

                <div className="level-progress-top">

                  <span>
                    Level progress
                  </span>

                  <strong>
                    {Math.round(progress)}%
                  </strong>

                </div>

                <div className="level-track">
                  <span
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

              </div>


              <div className="card-line" />


              {/* MINI STATS */}

              <div className="mini-stats">

                <div>
                  <strong>
                    {days}
                  </strong>

                  <span>
                    Days
                  </span>
                </div>

                <div>
                  <strong>
                    {streak}
                  </strong>

                  <span>
                    Streak
                  </span>
                </div>

                <div>
                  <strong>
                    {footprint.toFixed(1)}
                  </strong>

                  <span>
                    CO₂e
                  </span>
                </div>

              </div>

            </div>


            {/* FLOATING DATA */}

            <div className="floating-widget widget-one">

              <span className="widget-icon">
                🌿
              </span>

              <div>
                <small>
                  STATUS
                </small>

                <strong>
                  {points > 0
                    ? "Growing"
                    : "Ready to grow"}
                </strong>
              </div>

            </div>


            <div className="floating-widget widget-two">

              <span>
                🔥
              </span>

              <div>
                <small>
                  STREAK
                </small>

                <strong>
                  {streak} day{streak === 1 ? "" : "s"}
                </strong>
              </div>

            </div>


            <div className="floating-leaf leaf-one">
              🍃
            </div>

            <div className="floating-leaf leaf-two">
              🌿
            </div>

          </div>

        </section>


        {/* ===================================================
            LIVE IMPACT STRIP
        =================================================== */}

        <section className="impact-strip">

          <div className="impact-strip-inner">

            <div className="impact-strip-title">
              <span className="strip-dot" />
              YOUR GREENPULSE IS ALIVE
            </div>

            <div className="impact-strip-items">

              <div>
                <strong>{points}</strong>
                <span>Green Points</span>
              </div>

              <div>
                <strong>{calculations}</strong>
                <span>Actions recorded</span>
              </div>

              <div>
                <strong>{days}</strong>
                <span>Days completed</span>
              </div>

              <div>
                <strong>{footprint.toFixed(2)}</strong>
                <span>Total CO₂e</span>
              </div>

            </div>

            <Link
              to="/dashboard"
              className="strip-link"
            >
              View full journey →
            </Link>

          </div>

        </section>


        {/* ===================================================
            ABOUT
        =================================================== */}

        <section
          id="about"
          className="section about-section"
        >

          <div className="section-heading">

            <span className="section-label">
              01 — ABOUT GREENPULSE
            </span>

            <h2>
              Sustainability shouldn't
              <br />
              feel <span>complicated.</span>
            </h2>

            <p className="section-intro">
              GreenPulse is built around one simple idea:
              understanding your impact should be easier
              than changing it.
            </p>

          </div>


          <div className="about-grid">

            <div className="about-text">

              <p>
                Everyday decisions add up. What we eat,
                how we travel, what we consume, and how
                we use resources all contribute to our
                environmental footprint.
              </p>

              <p>
                GreenPulse gives those choices a place to
                live — turning them into understandable
                numbers, progress, challenges and
                experiences.
              </p>


              <div className="quote-box">

                <span>“</span>

                <div>

                  <p>
                    The goal isn't perfection.
                    <br />
                    It's progress you can see.
                  </p>

                  <small>
                    — GREEN PULSE
                  </small>

                </div>

              </div>

            </div>


            <div className="about-cards">

              <div className="info-card">

                <span className="card-number">
                  01
                </span>

                <span className="card-icon">
                  ◉
                </span>

                <h3>
                  Understand
                </h3>

                <p>
                  Turn everyday environmental choices
                  into information you can actually
                  understand.
                </p>

                <span className="card-corner">
                  ↗
                </span>

              </div>


              <div className="info-card">

                <span className="card-number">
                  02
                </span>

                <span className="card-icon">
                  ↗
                </span>

                <h3>
                  Track
                </h3>

                <p>
                  Keep your journey visible through
                  points, streaks, history and progress.
                </p>

                <span className="card-corner">
                  ↗
                </span>

              </div>


              <div className="info-card">

                <span className="card-number">
                  03
                </span>

                <span className="card-icon">
                  ✦
                </span>

                <h3>
                  Improve
                </h3>

                <p>
                  Use feedback and challenges to build
                  better habits one step at a time.
                </p>

                <span className="card-corner">
                  ↗
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section
          id="how"
          className="section how-section"
        >

          <div className="section-heading center">

            <span className="section-label">
              02 — HOW IT WORKS
            </span>

            <h2>
              Your actions.
              <br />
              Your <span>pulse.</span>
            </h2>

            <p>
              GreenPulse keeps the journey simple:
              record what you do, understand the impact,
              and use that information to improve.
            </p>

          </div>


          <div className="steps">

            <div className="step">

              <div className="step-head">
                <div className="step-number">
                  01
                </div>

                <span>
                  INPUT
                </span>
              </div>

              <div className="step-line" />

              <div className="step-icon">
                ✎
              </div>

              <h3>
                Record
              </h3>

              <p>
                Enter the everyday choices and
                activities you want GreenPulse to
                understand.
              </p>

            </div>


            <div className="step">

              <div className="step-head">
                <div className="step-number">
                  02
                </div>

                <span>
                  ANALYZE
                </span>
              </div>

              <div className="step-line" />

              <div className="step-icon">
                ◌
              </div>

              <h3>
                Calculate
              </h3>

              <p>
                GreenPulse transforms your inputs
                into environmental feedback and
                Green Points.
              </p>

            </div>


            <div className="step">

              <div className="step-head">
                <div className="step-number">
                  03
                </div>

                <span>
                  GROW
                </span>
              </div>

              <div className="step-line" />

              <div className="step-icon">
                ↑
              </div>

              <h3>
                Improve
              </h3>

              <p>
                Follow your progress, maintain
                streaks and explore the GreenPulse
                journey.
              </p>

            </div>

          </div>


          {/* JOURNEY PREVIEW */}

          <div className="journey-preview">

            <div className="journey-copy">

              <span className="section-label">
                YOUR JOURNEY
              </span>

              <h3>
                From one action
                <br />
                to a <span>living habit.</span>
              </h3>

              <p>
                Your GreenPulse grows with you.
                Every calculation becomes part of
                a bigger picture.
              </p>

              <Link
                to="/calculator"
                className="text-link"
              >
                Start your first calculation →
              </Link>

            </div>


            <div className="journey-timeline">

              <div className="timeline-line" />

              <div className="timeline-item active">

                <span className="timeline-dot">
                  01
                </span>

                <div>
                  <strong>
                    First footprint
                  </strong>

                  <small>
                    Understand where you begin.
                  </small>
                </div>

              </div>


              <div className="timeline-item">

                <span className="timeline-dot">
                  02
                </span>

                <div>
                  <strong>
                    Build consistency
                  </strong>

                  <small>
                    Keep returning and watch your
                    streak grow.
                  </small>
                </div>

              </div>


              <div className="timeline-item">

                <span className="timeline-dot">
                  03
                </span>

                <div>
                  <strong>
                    Become a Guardian
                  </strong>

                  <small>
                    Progress through the GreenPulse
                    levels.
                  </small>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            FEEDBACK / PROGRESS
        =================================================== */}

        <section
          id="feedback"
          className="section feedback-section"
        >

          <div className="feedback-card">

            <div className="feedback-copy">

              <span className="section-label">
                03 — YOUR PROGRESS
              </span>

              <h2>
                Progress becomes
                <br />
                <span>visible.</span>
              </h2>

              <p>
                Your environmental journey shouldn't
                disappear into a spreadsheet. GreenPulse
                turns progress into something you can
                actually see.
              </p>


              <div className="feedback-actions">

                <Link
                  to="/dashboard"
                  className="primary-button"
                >
                  Open Dashboard
                  <span>→</span>
                </Link>

                <Link
                  to="/feedback"
                  className="secondary-button"
                >
                  Give Feedback
                  <span>↗</span>
                </Link>

              </div>

            </div>


            <div className="feedback-visual">

              <div className="feedback-orbit" />

              <div className="feedback-circle">

                <span>
                  {points}
                </span>

                <small>
                  GREEN POINTS
                </small>

              </div>


              <div className="feedback-bars">

                <div className="bar-row">

                  <span>
                    Journey
                  </span>

                  <div className="bar">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(8, progress)
                        )}%`,
                      }}
                    />
                  </div>

                </div>


                <div className="bar-row">

                  <span>
                    Consistency
                  </span>

                  <div className="bar">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          streak * 10
                        )}%`,
                      }}
                    />
                  </div>

                </div>


                <div className="bar-row">

                  <span>
                    Activity
                  </span>

                  <div className="bar">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          calculations * 8
                        )}%`,
                      }}
                    />
                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            FOREST CTA
        =================================================== */}

        <section className="forest-preview">

          <div className="forest-preview-glow" />

          <div className="forest-preview-content">

            <span className="section-label">
              THE GREENPULSE WORLD
            </span>

            <h2>
              Your progress has
              <br />
              a <span>place to grow.</span>
            </h2>

            <p>
              Step beyond numbers. Explore the
              GreenPulse Forest — a living space where
              your journey becomes something you can
              experience.
            </p>

            <Link
              to="/forest"
              className="forest-button"
            >
              Enter the Forest
              <span>↗</span>
            </Link>

          </div>


          <div className="forest-mini-scene">

            <div className="scene-moon" />

            <div className="scene-stars">
              ✦　·　✧　　·　✦
            </div>

            <div className="scene-mist" />

            <div className="scene-tree tree-left">
              🌲
            </div>

            <div className="scene-tree tree-center">
              🌲
            </div>

            <div className="scene-tree tree-right">
              🌲
            </div>

            <div className="scene-fire">
              <span>🔥</span>
            </div>

            <div className="scene-ground" />

          </div>

        </section>


        {/* ===================================================
            FINAL CTA
        =================================================== */}

        <section className="final-section">

          <span className="final-line">
            <i />
            GREEN PULSE
            <i />
          </span>

          <span className="final-leaf">
            🌱
          </span>

          <h2>
            Ready to see
            <br />
            your <span>GreenPulse?</span>
          </h2>

          <p>
            Start with one action. Then another.
            <br />
            Let the progress speak for itself.
          </p>

          <Link
            to="/dashboard"
            className="primary-button large"
          >
            Open your Dashboard
            <span>→</span>
          </Link>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>

        <div className="footer-main">

          <div className="footer-logo">
            <span>🌱</span>
            GREENPULSE
          </div>

          <p>
            Making environmental impact easier
            to understand.
          </p>

        </div>

        <div className="footer-links">

          <Link to="/explore">
            Explore
          </Link>

          <Link to="/forest">
            Forest
          </Link>

          <Link to="/feedback">
            Feedback
          </Link>

          <Link to="/settings">
            Settings
          </Link>

        </div>

        <span className="footer-copy">
          © 2026 GreenPulse CSEAIML
        </span>

      </footer>

    </div>
  );
}


/* =========================================================
   PLACEHOLDER / UTILITY PAGE
========================================================= */

function ComingSoon({
  title,
  icon,
  description,
}) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #123d2b 0%, #06140f 45%, #020806 100%)",
        color: "#ecfff4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        fontFamily: "inherit",
      }}
    >

      <div
        style={{
          width: "min(650px, 100%)",
          padding: "48px 35px",
          borderRadius: "28px",
          background: "rgba(255,255,255,0.055)",
          border:
            "1px solid rgba(150,255,190,0.12)",
          backdropFilter: "blur(18px)",
          textAlign: "center",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.35)",
        }}
      >

        <div
          style={{
            fontSize: "58px",
            marginBottom: "18px",
          }}
        >
          {icon}
        </div>

        <div
          style={{
            fontSize: "13px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.55,
            marginBottom: "10px",
          }}
        >
          GREEN PULSE
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 52px)",
            margin: "0 0 15px",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            maxWidth: "500px",
            margin: "0 auto 30px",
            lineHeight: 1.7,
            opacity: 0.72,
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              border:
                "1px solid rgba(150,255,190,0.18)",
              borderRadius: "13px",
              padding: "13px 22px",
              background:
                "rgba(255,255,255,0.05)",
              color: "#ecfff4",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              border: "0",
              borderRadius: "13px",
              padding: "13px 22px",
              background: "#78e6a3",
              color: "#03150b",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Dashboard
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ROUTER
========================================================= */

function AppRouter() {
  return (
    <Routes>

      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/calculator"
        element={<Calculator />}
      />

      <Route
        path="/forest"
        element={<Forest />}
      />

      <Route
        path="/challenges"
        element={<Challenges />}
      />

      <Route
        path="/rewards"
        element={<Rewards />}
      />

      <Route
        path="/focus"
        element={<Focus />}
      />

      <Route
        path="/progress"
        element={
          <ComingSoon
            icon="📈"
            title="Progress"
            description="Your environmental progress, trends, history and achievements will be displayed here."
          />
        }
      />

      <Route
        path="/settings"
        element={<Settings />}
      />

      <Route
        path="/feedback"
        element={<Feedback />}
      />

      <Route
        path="/explore"
        element={<Explore />}
      />

      <Route
        path="/reviews"
        element={<Reviews />}
      />

      <Route
        path="/auth"
        element={<Auth />}
      />
      <Route path="/admin" element={<AdminDashboard />} />

      <Route
        path="*"
        element={
          <ComingSoon
            icon="🌱"
            title="Page not found"
            description="The GreenPulse page you're looking for doesn't exist."
          />
        }
      />

    </Routes>
  );
}


export default AppRouter;