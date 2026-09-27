function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-mark">🌱</span>
          <span>GREEN<span>PULSE</span></span>
        </div>

        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#how">How it works</a>
          <a href="#feedback">Feedback</a>
        </div>

        <button className="nav-button">Explore GreenPulse</button>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              🌍 Environmental awareness, made simpler
            </div>

            <h1>
              Make your
              <br />
              <span>impact visible.</span>
            </h1>

            <p>
              GreenPulse helps you understand your environmental impact,
              track your progress, and turn small everyday choices into
              meaningful change.
            </p>

            <div className="hero-actions">
              <button className="primary-button">
                Start your journey →
              </button>

              <button className="secondary-button">
                See how it works
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="pulse-card">
              <div className="pulse-top">
                <span>Your GreenPulse</span>
                <span className="status">● Active</span>
              </div>

              <div className="pulse-score">
                <span className="score">72</span>
                <span className="score-label">impact points</span>
              </div>

              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>

              <div className="pulse-bottom">
                <span>🌿 Growing</span>
                <span>Level 4</span>
              </div>
            </div>

            <div className="floating-card card-one">
              <span>🌳</span>
              <div>
                <strong>Progress</strong>
                <small>Keep growing</small>
              </div>
            </div>

            <div className="floating-card card-two">
              <span>♻️</span>
              <div>
                <strong>Small choices</strong>
                <small>Big difference</small>
              </div>
            </div>
          </div>
        </section>

        <section className="intro" id="about">
          <div className="section-label">WHAT IS GREENPULSE?</div>

          <h2>
            Environmental awareness
            <br />
            shouldn't feel like homework.
          </h2>

          <p>
            GreenPulse is being built to make sustainability easier to
            understand and easier to engage with — without overwhelming
            people with complicated calculations.
          </p>
        </section>

        <section className="how" id="how">
          <div className="section-heading">
            <div>
              <div className="section-label">THE GREENPULSE EXPERIENCE</div>
              <h2>Three simple steps.</h2>
            </div>
          </div>

          <div className="steps">
            <article className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">📊</div>
              <h3>Track</h3>
              <p>
                Understand your everyday environmental impact through
                simple, practical inputs.
              </p>
            </article>

            <article className="step-card featured">
              <div className="step-number">02</div>
              <div className="step-icon">💡</div>
              <h3>Understand</h3>
              <p>
                See what your choices mean and discover where small
                improvements can make a difference.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">🌱</div>
              <h3>Improve</h3>
              <p>
                Build consistency, follow your progress, and make
                sustainability part of everyday life.
              </p>
            </article>
          </div>
        </section>

        <section className="vision">
          <div className="vision-content">
            <div className="section-label">OUR VISION</div>

            <h2>
              From knowing your impact
              <br />
              to actually changing it.
            </h2>

            <p>
              GreenPulse is designed around a simple idea: awareness is
              more powerful when people can see their progress.
            </p>
          </div>

          <div className="vision-stats">
            <div>
              <strong>01</strong>
              <span>Track your journey</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Build consistency</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Grow your impact</span>
            </div>
          </div>
        </section>

        <section className="feedback" id="feedback">
          <div className="feedback-box">
            <div>
              <div className="section-label">HELP BUILD GREENPULSE</div>
              <h2>Your feedback matters.</h2>
              <p>
                GreenPulse is being built with real users in mind.
                Tell us what would make environmental tracking easier
                for you.
              </p>
            </div>

            <button className="primary-button">
              Give feedback →
            </button>
          </div>
        </section>
      </main>

      <footer>
        <div className="logo">
          <span className="logo-mark">🌱</span>
          <span>GREEN<span>PULSE</span></span>
        </div>

        <p>Building a more aware tomorrow, one choice at a time.</p>

        <span>© 2026 GreenPulse</span>
      </footer>
    </div>
  );
}

export default App;