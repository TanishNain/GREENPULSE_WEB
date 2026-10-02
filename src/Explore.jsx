import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Explore.css";

const STORAGE_KEY = "greenpulse_year_data";

function getGreenPulseData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {
        total_points: 0,
        total_calculations: 0,
        completed_days: 0,
        streak: 0,
      };
    }

    const data = JSON.parse(raw);

    return {
      total_points: Number(data.total_points) || 0,
      total_calculations: Number(data.total_calculations) || 0,
      completed_days: Number(data.completed_days) || 0,
      streak: Number(data.streak) || 0,
    };
  } catch {
    return {
      total_points: 0,
      total_calculations: 0,
      completed_days: 0,
      streak: 0,
    };
  }
}

function Explore() {
  const [greenPulseData, setGreenPulseData] = useState(
    getGreenPulseData
  );

  useEffect(() => {
    const updateData = () => {
      setGreenPulseData(getGreenPulseData());
    };

    updateData();

    window.addEventListener(
      "greenpulse:data-updated",
      updateData
    );

    window.addEventListener(
      "storage",
      updateData
    );

    return () => {
      window.removeEventListener(
        "greenpulse:data-updated",
        updateData
      );

      window.removeEventListener(
        "storage",
        updateData
      );
    };
  }, []);

  return (
    <div className="explore-page">

      {/* AMBIENT BACKGROUND */}

      <div className="explore-noise" />
      <div className="explore-glow explore-glow-one" />
      <div className="explore-glow explore-glow-two" />

      {/* NAVIGATION */}

      <nav className="explore-navbar">

        <Link to="/" className="explore-logo">
          <span>🌱</span>

          <strong>
            GREEN<span>PULSE</span>
          </strong>
        </Link>

        <Link to="/" className="back-home">
          ← Back to GreenPulse
        </Link>

      </nav>


      {/* HERO */}

      <section className="explore-hero">

        <div className="explore-hero-content">

          <span className="explore-eyebrow">
            GREENPULSE — V1.00
          </span>

          <div className="hero-title-wrap">

            <h1>
              Understand your impact.
              <br />
              Then make it <span>better.</span>
            </h1>

            <div className="title-line" />

          </div>

          <p>
            GreenPulse turns everyday environmental choices into measurable
            feedback, progress, and something you can actually understand.
          </p>

          <div className="version-pill">
            <span></span>
            V1.00 — CURRENTLY AVAILABLE
          </div>

        </div>


        {/* HERO ORBIT */}

        <div className="explore-hero-orbit">

          <div className="orbit-halo" />

          <div className="orbit-ring orbit-one"></div>

          <div className="orbit-ring orbit-two"></div>

          <div className="orbit-ring orbit-three"></div>

          <div className="orbit-particle particle-one">✦</div>
          <div className="orbit-particle particle-two">·</div>
          <div className="orbit-particle particle-three">✦</div>

          <div className="orbit-core">

            <div className="core-pulse" />

            <span>🌱</span>

            <strong>
              {greenPulseData.total_points}
            </strong>

            <small>IMPACT POINTS</small>

            <div className="core-status">
              <i />
              LIVE DATA
            </div>

          </div>

        </div>

      </section>


      {/* WHAT GREENPULSE CURRENTLY DOES */}

      <section className="explore-section current-section">

        <div className="section-intro">

          <span className="explore-label">
            01 — V1.00
          </span>

          <h2>
            What GreenPulse
            <br />
            <span>does today.</span>
          </h2>

          <p>
            GreenPulse V1.00 focuses on turning everyday environmental data
            into understandable feedback — without making sustainability feel
            like a complicated calculation.
          </p>

        </div>


        <div className="capability-grid">

          <article className="capability-card featured">

            <span className="capability-number">01</span>

            <div className="capability-icon">🌍</div>

            <h3>Environmental Impact</h3>

            <p>
              GreenPulse calculates your environmental impact from everyday
              activities and turns the information into a clear result.
            </p>

            <span className="capability-tag">CORE</span>

            <div className="card-glow" />

          </article>


          <article className="capability-card">

            <span className="capability-number">02</span>

            <div className="capability-icon">📊</div>

            <h3>Impact Breakdown</h3>

            <p>
              See how different areas of everyday life contribute to your
              overall environmental impact.
            </p>

            <span className="capability-tag">AVAILABLE</span>

            <div className="card-glow" />

          </article>


          <article className="capability-card">

            <span className="capability-number">03</span>

            <div className="capability-icon">📅</div>

            <h3>Daily → Yearly View</h3>

            <p>
              Follow your environmental impact across daily activity,
              monthly patterns, and yearly projections.
            </p>

            <span className="capability-tag">AVAILABLE</span>

            <div className="card-glow" />

          </article>


          <article className="capability-card">

            <span className="capability-number">04</span>

            <div className="capability-icon">🎯</div>

            <h3>Points & Levels</h3>

            <p>
              Your progress can become more visible through points, levels,
              and measurable improvement over time.
            </p>

            <span className="capability-tag">AVAILABLE</span>

            <div className="card-glow" />

          </article>


          <article className="capability-card">

            <span className="capability-number">05</span>

            <div className="capability-icon">🔥</div>

            <h3>Streaks & Rewards</h3>

            <p>
              Keep showing up through streaks, badges, rewards, and a history
              of your progress.
            </p>

            <span className="capability-tag">AVAILABLE</span>

            <div className="card-glow" />

          </article>


          <article className="capability-card">

            <span className="capability-number">06</span>

            <div className="capability-icon">📈</div>

            <h3>Progress Dashboard</h3>

            <p>
              Your environmental journey stays visible through progress
              feedback, reports, screenshots, and persistent data.
            </p>

            <span className="capability-tag">AVAILABLE</span>

            <div className="card-glow" />

          </article>

        </div>

      </section>


      {/* HOW IT THINKS */}

      <section className="explore-section philosophy-section">

        <div className="philosophy-content">

          <span className="explore-label">
            02 — THE IDEA
          </span>

          <h2>
            Sustainability shouldn't
            <br />
            require a <span>spreadsheet.</span>
          </h2>

          <p>
            The goal of GreenPulse is not to make people manually calculate
            every environmental number in their lives.
          </p>

          <p>
            Instead, GreenPulse is designed to turn everyday choices into
            understandable feedback — so people can see patterns, recognise
            progress, and gradually build better habits.
          </p>

          <div className="philosophy-quote">

            <span>“</span>

            <strong>
              The goal isn't perfection.
              <br />
              It's progress you can see.
            </strong>

          </div>

        </div>


        <div className="philosophy-visual">

          <div className="visual-step">

            <span>01</span>

            <div>
              <strong>YOUR ACTION</strong>
              <small>Everyday choices</small>
            </div>

          </div>

          <div className="visual-arrow">↓</div>

          <div className="visual-step">

            <span>02</span>

            <div>
              <strong>GREENPULSE</strong>
              <small>Calculates & understands</small>
            </div>

          </div>

          <div className="visual-arrow">↓</div>

          <div className="visual-step active">

            <span>03</span>

            <div>
              <strong>FEEDBACK</strong>
              <small>Impact you can understand</small>
            </div>

          </div>

        </div>

      </section>


      {/* GROWING TREE */}

      <section className="explore-section growth-section">

        <div className="section-intro center">

          <span className="explore-label">
            03 — GROWING WITH YOU
          </span>

          <h2>
            From tracking impact
            <br />
            to <span>creating impact.</span>
          </h2>

          <p>
            V1.00 is only the beginning. GreenPulse is designed to grow from
            an impact-tracking system into a wider environmental platform.
          </p>

        </div>


        <div className="tree-roadmap">

          <div className="tree-line"></div>

          <div className="tree-stage stage-one">

            <div className="tree-node">
              🌱
            </div>

            <span>V1.00</span>

            <h3>Seed</h3>

            <p>
              Track your environmental impact and understand your progress.
            </p>

          </div>


          <div className="tree-stage stage-two">

            <div className="tree-node">
              🌿
            </div>

            <span>NEXT</span>

            <h3>Sprout</h3>

            <p>
              More ways to understand actions, habits, and environmental
              progress.
            </p>

          </div>


          <div className="tree-stage stage-three">

            <div className="tree-node">
              🌳
            </div>

            <span>FUTURE</span>

            <h3>Tree</h3>

            <p>
              Meaningful environmental contributions and recognised impact.
            </p>

          </div>


          <div className="tree-stage stage-four">

            <div className="tree-node">
              🌲
            </div>

            <span>VISION</span>

            <h3>Forest</h3>

            <p>
              A connected community turning individual progress into wider
              environmental action.
            </p>

          </div>

        </div>

      </section>


      {/* FUTURE PLANS */}

      <section className="explore-section future-section">

        <div className="section-intro">

          <span className="explore-label">
            04 — FUTURE PLANS
          </span>

          <h2>
            What's growing
            <br />
            <span>next.</span>
          </h2>

          <p>
            Some ideas are still being designed and tested. They are part of
            the GreenPulse vision, not features of V1.00 yet.
          </p>

        </div>


        <div className="future-list">

          <div className="future-item">

            <span>01</span>

            <div>
              <h3>Environmental Contributions</h3>

              <p>
                Move beyond tracking impact by recognising meaningful
                environmental actions and contributions.
              </p>
            </div>

            <b>PLANNED</b>

          </div>


          <div className="future-item">

            <span>02</span>

            <div>
              <h3>Recognition Badges</h3>

              <p>
                Build a system where meaningful contributions can eventually
                become verifiable recognition.
              </p>
            </div>

            <b>PLANNED</b>

          </div>


          <div className="future-item">

            <span>03</span>

            <div>
              <h3>Organisation & NGO Support</h3>

              <p>
                Explore partnerships where environmental contributions can
                receive confirmation or support from relevant organisations.
              </p>
            </div>

            <b>EXPLORING</b>

          </div>


          <div className="future-item">

            <span>04</span>

            <div>
              <h3>AI-Assisted Verification</h3>

              <p>
                Use AI as an assistant for reviewing evidence while keeping
                meaningful verification connected to real organisations.
              </p>
            </div>

            <b>EXPLORING</b>

          </div>


          <div className="future-item pulsy-item">

            <span>05</span>

            <div>

              <h3>PULSY</h3>

              <p>
                An interactive GreenPulse companion designed to help people
                understand the platform, their progress, and what they can do
                next.
              </p>

            </div>

            <b>FUTURE</b>

            <div className="pulsy-orb">🌱</div>

          </div>

        </div>

      </section>


      {/* REVIEWS CTA */}

      <section className="reviews-cta">

        <div>

          <span className="explore-label">
            05 — YOUR VOICE
          </span>

          <h2>
            You've seen
            <br />
            <span>GreenPulse.</span>
          </h2>

          <p>
            Tell us what you think. Your feedback helps shape what GreenPulse
            becomes next.
          </p>

        </div>

        <Link to="/reviews" className="review-button">
          Write a review <span>↗</span>
        </Link>

      </section>


      {/* FINAL CTA */}

      <section className="explore-final">

        <span className="final-leaf">🌱</span>

        <h2>
          The pulse is
          <br />
          <span>growing.</span>
        </h2>

        <p>
          Start with understanding.
          <br />
          Grow through action.
        </p>

        <Link to="/" className="explore-home-button">
          Back to GreenPulse <span>↑</span>
        </Link>

      </section>


      {/* FOOTER */}

      <footer className="explore-footer">

        <div className="footer-brand">
          <span>🌱</span>
          GREENPULSE
        </div>

        <p>
          Making environmental impact easier to understand.
        </p>

        <span>
          © 2026 GreenPulse
        </span>

      </footer>

    </div>
  );
}

export default Explore;