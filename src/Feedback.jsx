import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Feedback.css";

const FEEDBACK_KEY = "greenpulse_feedback";

const CATEGORIES = [
  {
    id: "experience",
    icon: "🌱",
    title: "Overall Experience",
    description: "How GreenPulse feels to use",
  },
  {
    id: "calculator",
    icon: "🧮",
    title: "Carbon Calculator",
    description: "Tracking and calculation",
  },
  {
    id: "forest",
    icon: "🌲",
    title: "Forest",
    description: "Guardian and forest experience",
  },
  {
    id: "design",
    icon: "🎨",
    title: "Design & UI",
    description: "Look, animation and navigation",
  },
  {
    id: "idea",
    icon: "💡",
    title: "New Idea",
    description: "Suggest something new",
  },
];

const QUICK_FEEDBACK = [
  "🌿 I love the forest theme",
  "⚡ The app feels fast",
  "🎮 I want more game features",
  "📊 I want better progress tracking",
  "🧮 Tracking feels like too much work",
  "✨ I want more customization",
];

function Feedback() {
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("experience");
  const [message, setMessage] = useState("");
  const [selectedQuick, setSelectedQuick] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(FEEDBACK_KEY) || "[]"
      );

      if (Array.isArray(saved)) {
        setFeedbackCount(saved.length);
      }
    } catch {
      setFeedbackCount(0);
    }
  }, []);

  function handleQuickFeedback(text) {
    if (selectedQuick === text) {
      setSelectedQuick("");

      setMessage((current) => {
        return current
          .replace(text, "")
          .replace(/\n+/g, "\n")
          .trim();
      });

      return;
    }

    setSelectedQuick(text);

    setMessage((current) => {
      if (!current.trim()) {
        return text;
      }

      if (current.includes(text)) {
        return current;
      }

      return `${current}\n${text}`;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (rating === 0) {
      window.alert("Please give GreenPulse a rating first 🌱");
      return;
    }

    if (!message.trim()) {
      window.alert("Tell us a little about your experience 💚");
      return;
    }

    const newFeedback = {
      id: Date.now(),
      rating: rating,
      category: category,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = JSON.parse(
        localStorage.getItem(FEEDBACK_KEY) || "[]"
      );

      const feedbackList = Array.isArray(saved) ? saved : [];

      feedbackList.push(newFeedback);

      localStorage.setItem(
        FEEDBACK_KEY,
        JSON.stringify(feedbackList)
      );

      setFeedbackCount(feedbackList.length);
    } catch {
      // Keep the page working if browser storage is unavailable.
    }

    setSubmitted(true);
    setRating(0);
    setCategory("experience");
    setMessage("");
    setSelectedQuick("");
  }

  function resetForm() {
    setSubmitted(false);
    setRating(0);
    setCategory("experience");
    setMessage("");
    setSelectedQuick("");
  }

  return (
    <main className="feedback-page">
      <div className="feedback-glow feedback-glow-one"></div>
      <div className="feedback-glow feedback-glow-two"></div>

      <header className="feedback-topbar">
        <button
          className="feedback-back"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          <span>←</span>
          Dashboard
        </button>

        <div className="feedback-brand">
          <span className="feedback-brand-icon">🌱</span>
          <span>GREEN PULSE</span>
        </div>

        <button
          className="feedback-home"
          type="button"
          onClick={() => navigate("/")}
        >
          Home
        </button>
      </header>

      <section className="feedback-hero">
        <div className="feedback-orbit">
          <div className="feedback-orbit-ring feedback-orbit-ring-one"></div>
          <div className="feedback-orbit-ring feedback-orbit-ring-two"></div>

          <div className="feedback-planet">💚</div>
        </div>

        <div className="feedback-hero-content">
          <div className="feedback-eyebrow">
            <span></span>
            HELP US GROW
            <span></span>
          </div>

          <h1>
            Your voice shapes
            <strong>GreenPulse.</strong>
          </h1>

          <p>
            Every suggestion helps us make GreenPulse simpler,
            greener and more meaningful.
          </p>

          <div className="feedback-hero-pills">
            <span>🌍 Built for the planet</span>
            <span>💡 Built with your ideas</span>
            <span>🌲 Growing together</span>
          </div>
        </div>
      </section>

      <section className="feedback-layout">
        <div className="feedback-form-card">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div className="feedback-section-heading">
                <div>
                  <span className="feedback-small-label">
                    STEP 01
                  </span>

                  <h2>How was your experience?</h2>
                </div>

                <span className="feedback-count">
                  {feedbackCount}{" "}
                  {feedbackCount === 1
                    ? "response"
                    : "responses"}
                </span>
              </div>

              <div className="feedback-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={
                      rating >= star
                        ? "feedback-star active"
                        : "feedback-star"
                    }
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} out of 5`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="feedback-rating-caption">
                {rating === 0 &&
                  "Tap a star to rate your experience"}

                {rating === 1 &&
                  "We have work to do 🌱"}

                {rating === 2 &&
                  "Thanks — we can improve"}

                {rating === 3 &&
                  "A solid start 🌿"}

                {rating === 4 &&
                  "Glad you're enjoying it 💚"}

                {rating === 5 &&
                  "That's what we love to hear! 🌍"}
              </div>

              <div className="feedback-divider"></div>

              <div className="feedback-section-heading compact">
                <div>
                  <span className="feedback-small-label">
                    STEP 02
                  </span>

                  <h2>What are you talking about?</h2>
                </div>
              </div>

              <div className="feedback-categories">
                {CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      category === item.id
                        ? "feedback-category selected"
                        : "feedback-category"
                    }
                    onClick={() => setCategory(item.id)}
                  >
                    <span className="feedback-category-icon">
                      {item.icon}
                    </span>

                    <span className="feedback-category-copy">
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>

                    <span className="feedback-category-check">
                      {category === item.id ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>

              <div className="feedback-divider"></div>

              <div className="feedback-section-heading compact">
                <div>
                  <span className="feedback-small-label">
                    STEP 03
                  </span>

                  <h2>Tell us what you think</h2>
                </div>
              </div>

              <div className="feedback-quick-list">
                {QUICK_FEEDBACK.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      selectedQuick === item
                        ? "feedback-quick selected"
                        : "feedback-quick"
                    }
                    onClick={() => handleQuickFeedback(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <textarea
                className="feedback-textarea"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Tell us what you loved, what felt annoying, or what you want to see next..."
                maxLength={1000}
              ></textarea>

              <div className="feedback-textarea-footer">
                <span>
                  Be honest. We actually want to know. 🌱
                </span>

                <span>{message.length}/1000</span>
              </div>

              <button
                className="feedback-submit"
                type="submit"
              >
                <span>Send Feedback</span>

                <span className="feedback-submit-arrow">
                  →
                </span>
              </button>
            </form>
          ) : (
            <div className="feedback-success">
              <div className="feedback-success-ripple">
                <div className="feedback-success-icon">
                  🌱
                </div>
              </div>

              <span className="feedback-small-label">
                TRANSMISSION COMPLETE
              </span>

              <h2>Thank you, Guardian.</h2>

              <p>
                Your feedback has been recorded on this
                device. Cloud feedback will be connected
                when the GreenPulse database is added.
              </p>

              <div className="feedback-success-stats">
                <div>
                  <strong>✓</strong>
                  <span>Feedback received</span>
                </div>

                <div>
                  <strong>🌍</strong>
                  <span>Planet first</span>
                </div>
              </div>

              <div className="feedback-success-actions">
                <button
                  className="feedback-submit"
                  type="button"
                  onClick={resetForm}
                >
                  <span>Send Another</span>

                  <span className="feedback-submit-arrow">
                    ↗
                  </span>
                </button>

                <button
                  className="feedback-secondary-button"
                  type="button"
                  onClick={() => navigate("/dashboard")}
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="feedback-side">
          <div className="feedback-side-card feedback-side-card-main">
            <div className="feedback-side-icon">🌲</div>

            <span className="feedback-small-label">
              GREEN PULSE MISSION
            </span>

            <h3>
              The forest grows
              <br />
              with every voice.
            </h3>

            <p>
              GreenPulse should make sustainable action feel
              simple, understandable and rewarding.
            </p>

            <div className="feedback-side-line"></div>

            <div className="feedback-side-stat">
              <span>YOUR INPUT</span>
              <strong>MATTERS</strong>
            </div>
          </div>

          <div className="feedback-side-card feedback-side-card-tip">
            <span className="feedback-tip-icon">💡</span>

            <div>
              <strong>One useful idea</strong>

              <p>
                Tell us one thing you would change if you
                were designing GreenPulse yourself.
              </p>
            </div>
          </div>

          <button
            className="feedback-forest-link"
            type="button"
            onClick={() => navigate("/forest")}
          >
            <span>🌲</span>

            <div>
              <strong>Return to the Forest</strong>
              <small>Continue your journey</small>
            </div>

            <b>→</b>
          </button>
        </aside>
      </section>

      <footer className="feedback-footer">
        <span>GREEN PULSE CSEAIML</span>
        <span>•</span>
        <span>Digital Green Challenge 2026</span>
        <span>•</span>
        <span>Grow responsibly. 🌍</span>
      </footer>
    </main>
  );
}

export default Feedback;