import "./App.css";
import { Link, Routes, Route } from "react-router-dom";
import Explore from "./Explore.jsx";
import Reviews from "./Reviews.jsx";
import Auth from "./Auth.jsx";
import { getUser, logout } from "./auth.js";
import Dashboard from "./Dashboard.jsx";
import Forest from "./Forest.jsx";


function App() {
  const user = getUser();
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
  <div className="logo" onClick={() => scrollToSection("home")}>
    <span className="logo-mark">🌱</span>

    <span className="logo-text">
      GREEN<span>PULSE</span>
    </span>
  </div>

  <div className="nav-links">
    <button onClick={() => scrollToSection("about")}>
      About
    </button>

    <button onClick={() => scrollToSection("how")}>
      How it works
    </button>

    <button onClick={() => scrollToSection("feedback")}>
      Feedback
    </button>
  </div>

  <div className="nav-actions">
  <Link to="/explore" className="nav-button">
    Explore GreenPulse ↗
  </Link>

  {user ? (
  <div className="nav-user">
    <Link to="/dashboard" className="nav-dashboard">
      Dashboard
    </Link>

    <span>🌱 {user.username}</span>

    {user.role === "admin" && (
      <span className="nav-admin">ADMIN</span>
    )}

    <button onClick={logout}>Log out</button>
  </div>
) : (
    <Link to="/auth" className="nav-login">
      Log in
    </Link>
  )}
</div>
</nav>

      {/* HERO */}
      <main>
        <section id="home" className="hero">
          {/* Windows Download */}
          <button className="windows-download">
            <span className="windows-icon">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>

            <span className="download-content">
              <small>GREENPULSE DESKTOP</small>
              <strong>Download for Windows</strong>
            </span>

            <span className="download-arrow">↓</span>
          </button>

          <div className="hero-content">
            <div className="eyebrow">
              <span className="pulse-dot"></span>
              SMALL ACTIONS. REAL IMPACT.
            </div>

            <h1>
              Make your
              <br />
              <span>impact visible.</span>
            </h1>

            <p className="hero-description">
              GreenPulse helps you understand your everyday environmental
              impact, build better habits, and see your progress over time.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() => scrollToSection("how")}
              >
                Start exploring
                <span>→</span>
              </button>

              <button
                className="secondary-button"
                onClick={() => scrollToSection("how")}
              >
                See how it works
                <span>↓</span>
              </button>
            </div>

            <div className="hero-stats">
              <div>
                <strong>01</strong>
                <span>Track</span>
              </div>

              <div>
                <strong>02</strong>
                <span>Understand</span>
              </div>

              <div>
                <strong>03</strong>
                <span>Improve</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="hero-visual">
            <div className="glow"></div>

            <div className="impact-card">
              <div className="card-top">
                <span>Your GreenPulse</span>
                <span className="live-dot">● Live</span>
              </div>

              <div className="score-circle">
                <div className="circle-inner">
                  <span className="score">72</span>
                  <small>IMPACT</small>
                </div>
              </div>

              <div className="impact-status">
                <span>🌿</span>
                <div>
                  <strong>Growing</strong>
                  <small>Your habits are improving</small>
                </div>
              </div>

              <div className="card-line"></div>

              <div className="mini-stats">
                <div>
                  <strong>4</strong>
                  <span>Level</span>
                </div>

                <div>
                  <strong>12</strong>
                  <span>Actions</span>
                </div>

                <div>
                  <strong>7</strong>
                  <span>Day streak</span>
                </div>
              </div>
            </div>

            <div className="floating-leaf leaf-one">🍃</div>
            <div className="floating-leaf leaf-two">🌿</div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="section about-section">
          <div className="section-heading">
            <span className="section-label">01 — ABOUT</span>
            <h2>
              Sustainability shouldn't
              <br />
              feel <span>complicated.</span>
            </h2>
          </div>

          <div className="about-grid">
            <div className="about-text">
              <p>
                Most people want to make environmentally responsible choices,
                but understanding the actual impact of everyday actions can be
                difficult.
              </p>

              <p>
                GreenPulse turns those everyday actions into something you can
                understand, track, and improve.
              </p>

              <div className="quote-box">
                <span>“</span>
                <p>
                  The goal isn't perfection.
                  <br />
                  It's progress you can see.
                </p>
              </div>
            </div>

            <div className="about-cards">
              <div className="info-card">
                <span className="card-number">01</span>
                <span className="card-icon">🌍</span>
                <h3>Understand</h3>
                <p>
                  Learn how everyday choices connect to environmental impact.
                </p>
              </div>

              <div className="info-card">
                <span className="card-number">02</span>
                <span className="card-icon">📈</span>
                <h3>Track</h3>
                <p>
                  See your progress instead of relying on vague estimates.
                </p>
              </div>

              <div className="info-card">
                <span className="card-number">03</span>
                <span className="card-icon">🌱</span>
                <h3>Improve</h3>
                <p>
                  Build sustainable habits gradually through visible progress.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="section how-section">
          <div className="section-heading center">
            <span className="section-label">02 — HOW IT WORKS</span>
            <h2>
              Your actions.
              <br />
              Your <span>pulse.</span>
            </h2>
            <p>
              GreenPulse keeps sustainability simple by turning your everyday
              choices into understandable feedback.
            </p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">01</div>
              <div className="step-line"></div>
              <h3>Record</h3>
              <p>
                Tell GreenPulse about the environmental choices you make in
                your everyday life.
              </p>
            </div>

            <div className="step">
              <div className="step-number">02</div>
              <div className="step-line"></div>
              <h3>Calculate</h3>
              <p>
                Your information is converted into meaningful environmental
                feedback.
              </p>
            </div>

            <div className="step">
              <div className="step-number">03</div>
              <div className="step-line"></div>
              <h3>Improve</h3>
              <p>
                Use your feedback to understand patterns and gradually improve
                your habits.
              </p>
            </div>
          </div>
        </section>

        {/* FEEDBACK */}
        <section id="feedback" className="section feedback-section">
          <div className="feedback-card">
            <div>
              <span className="section-label">03 — FEEDBACK</span>

              <h2>
                Progress becomes
                <br />
                <span>visible.</span>
              </h2>

              <p>
                Your environmental journey shouldn't disappear into a
                spreadsheet. GreenPulse turns progress into something you can
                actually see.
              </p>
            </div>

            <div className="feedback-visual">
              <div className="feedback-circle">
                <span>72</span>
                <small>POINTS</small>
              </div>

              <div className="feedback-bars">
                <div className="bar">
                  <span style={{ width: "82%" }}></span>
                </div>
                <div className="bar">
                  <span style={{ width: "65%" }}></span>
                </div>
                <div className="bar">
                  <span style={{ width: "91%" }}></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final-section">
          <span className="final-leaf">🌱</span>

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

          <button
            className="primary-button large"
            onClick={() => scrollToSection("home")}
          >
            Back to the beginning
            <span>↑</span>
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <span>🌱</span>
          GREENPULSE
        </div>

        <p>Making environmental impact easier to understand.</p>

        <span className="footer-copy">© 2026 GreenPulse</span>
      </footer>
    </div>
  );
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/forest" element={<Forest />} />
    </Routes>
  );
}

export default AppRouter;