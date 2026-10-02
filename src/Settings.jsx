
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "./auth.js";
import "./Settings.css";

const SETTINGS_KEY = "greenpulse_settings";

const DEFAULT_SETTINGS = {
  sound: true,
  animations: true,
  reminders: false,
  compactCards: false,
  units: "metric",
};

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(readSettings);
  const [savedMessage, setSavedMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      setUser(getUser());
    } catch {
      setUser(null);
    }
  }, []);

  function updateSetting(key, value) {
    setSettings((current) => {
      const next = { ...current, [key]: value };

      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // Settings remain usable for this session.
      }

      return next;
    });

    setSavedMessage("Settings saved locally ✓");
    setResetMessage("");
  }

  function resetSettings() {
    const confirmed = window.confirm(
      "Restore GreenPulse settings to their defaults? Your progress will not be deleted."
    );

    if (!confirmed) return;

    setSettings({ ...DEFAULT_SETTINGS });

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );
    } catch {
      // Keep the page usable if storage is unavailable.
    }

    setSavedMessage("Default settings restored ✓");
    setResetMessage("");
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "This will permanently remove local GreenPulse progress, challenges, rewards, focus sessions and feedback from this browser. Your login account is not intentionally removed. Continue?"
    );

    if (!confirmed) return;

    const keysToRemove = [
      "greenpulse_year_data",
      "greenPulseData",
      "greenpulseData",
      "greenpulse_data",
      "greenpulse_claimed_challenges",
      "greenpulse_unlocked_rewards",
      "greenpulse_focus_sessions",
      "greenpulse_feedback",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    window.dispatchEvent(new Event("greenpulse:data-updated"));
    setResetMessage("Local app data cleared. Refresh any open progress pages.");
    setSavedMessage("");
  }

  function handleLogout() {
    const confirmed = window.confirm("Log out of GreenPulse?");
    if (!confirmed) return;

    try {
      logout();
    } catch {
      // Navigation still returns the user to the home page.
    }

    navigate("/");
  }

  function Toggle({ label, description, settingKey }) {
    return (
      <div className="settings-option">
        <div className="settings-option-copy">
          <strong>{label}</strong>
          <p>{description}</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={Boolean(settings[settingKey])}
          className={
            settings[settingKey]
              ? "settings-toggle is-on"
              : "settings-toggle"
          }
          onClick={() =>
            updateSetting(settingKey, !settings[settingKey])
          }
          aria-label={`${label}: ${settings[settingKey] ? "on" : "off"}`}
        >
          <span />
        </button>
      </div>
    );
  }

  return (
    <main className="settings-page">
      <div className="settings-background-glow settings-glow-one" />
      <div className="settings-background-glow settings-glow-two" />

      <header className="settings-topbar">
        <button
          className="settings-back"
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          <span>←</span> Dashboard
        </button>

        <button
          className="settings-brand"
          onClick={() => navigate("/")}
          type="button"
        >
          <span>🌱</span> GREEN PULSE
        </button>

        <button
          className="settings-home"
          onClick={() => navigate("/")}
          type="button"
        >
          Home
        </button>
      </header>

      <section className="settings-hero">
        <div className="settings-hero-symbol">
          <div className="settings-symbol-ring">⚙</div>
          <span className="settings-symbol-leaf">🌿</span>
        </div>

        <div className="settings-eyebrow">
          <span /> YOUR SPACE <span />
        </div>

        <h1>
          Make it <strong>yours.</strong>
        </h1>

        <p>
          Tune your GreenPulse experience to match your rhythm.
          Small changes, a greener journey.
        </p>
      </section>

      <section className="settings-layout">
        <div className="settings-main">
          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="settings-heading-icon">👤</span>
              <div>
                <h2>Your profile</h2>
                <p>Your local session information</p>
              </div>
            </div>

            <div className="settings-profile">
              <div className="settings-avatar">
                {user?.username
                  ? String(user.username).charAt(0).toUpperCase()
                  : "🌱"}
              </div>

              <div className="settings-profile-info">
                <strong>
                  {user?.username || user?.name || "Green Guardian"}
                </strong>
                <span>
                  {user?.email || "GreenPulse member"}
                </span>
                {user?.role === "admin" && (
                  <span className="settings-admin-tag">ADMIN</span>
                )}
              </div>

              <span className="settings-profile-status">
                <i /> ACTIVE
              </span>
            </div>

            <div className="settings-profile-actions">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
              >
                View dashboard →
              </button>
              <button
                type="button"
                className="settings-logout"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="settings-heading-icon">🎨</span>
              <div>
                <h2>Experience</h2>
                <p>Choose how GreenPulse behaves</p>
              </div>
            </div>

            <Toggle
              label="Sound effects"
              description="Allow sound effects where supported."
              settingKey="sound"
            />

            <Toggle
              label="Animations"
              description="Keep forest effects and interface transitions enabled."
              settingKey="animations"
            />

            <Toggle
              label="Compact cards"
              description="Use a tighter layout with less spacing."
              settingKey="compactCards"
            />

            <Toggle
              label="Daily reminders"
              description="Save your reminder preference for future reminder features."
              settingKey="reminders"
            />

            <p className="settings-note">
              These preferences are stored in this browser. They do not
              yet control every page or send notifications.
            </p>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="settings-heading-icon">📏</span>
              <div>
                <h2>Units & preferences</h2>
                <p>Choose your preferred measurement system</p>
              </div>
            </div>

            <div className="settings-unit-options">
              <button
                type="button"
                className={
                  settings.units === "metric"
                    ? "settings-unit selected"
                    : "settings-unit"
                }
                onClick={() => updateSetting("units", "metric")}
              >
                <span>🌍</span>
                <strong>Metric</strong>
                <small>km · kg · litres</small>
                {settings.units === "metric" && <b>✓</b>}
              </button>

              <button
                type="button"
                className={
                  settings.units === "imperial"
                    ? "settings-unit selected"
                    : "settings-unit"
                }
                onClick={() => updateSetting("units", "imperial")}
              >
                <span>🧭</span>
                <strong>Imperial</strong>
                <small>miles · lb · gallons</small>
                {settings.units === "imperial" && <b>✓</b>}
              </button>
            </div>

            <p className="settings-note">
              This preference is saved now. Calculator conversions will
              be connected when that feature is integrated.
            </p>
          </section>

          <section className="settings-card settings-danger-card">
            <div className="settings-card-heading">
              <span className="settings-heading-icon">🛡️</span>
              <div>
                <h2>Data & privacy</h2>
                <p>Manage data saved in this browser</p>
              </div>
            </div>

            <div className="settings-data-info">
              <span>💾</span>
              <div>
                <strong>Local browser storage</strong>
                <p>
                  Your current progress and preferences are stored locally.
                  Cloud synchronization has not been connected on this page.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="settings-reset-button"
              onClick={resetSettings}
            >
              Restore default settings
            </button>

            <button
              type="button"
              className="settings-clear-button"
              onClick={resetProgress}
            >
              Clear local app data
            </button>

            <p className="settings-danger-note">
              Clearing local app data cannot be undone. It does not
              intentionally remove your login account.
            </p>

            {resetMessage && (
              <div className="settings-status">{resetMessage}</div>
            )}
          </section>
        </div>

        <aside className="settings-sidebar">
          <div className="settings-sidebar-card settings-mission-card">
            <div className="settings-forest-art">🌲</div>
            <span className="settings-mini-label">THE GREEN PULSE WAY</span>
            <h3>
              Grow at
              <br />
              your own pace.
            </h3>
            <p>
              Sustainability should feel achievable, not overwhelming.
              Every small action can make a difference.
            </p>
            <button
              type="button"
              onClick={() => navigate("/forest")}
            >
              Enter the Forest <span>→</span>
            </button>
          </div>

          <div className="settings-sidebar-card settings-shortcuts">
            <span className="settings-mini-label">QUICK ACCESS</span>
            <h3>Your journey</h3>

            <button onClick={() => navigate("/calculator")} type="button">
              <span>🧮</span> Carbon calculator <b>→</b>
            </button>
            <button onClick={() => navigate("/progress")} type="button">
              <span>📊</span> My progress <b>→</b>
            </button>
            <button onClick={() => navigate("/challenges")} type="button">
              <span>🎯</span> Challenges <b>→</b>
            </button>
            <button onClick={() => navigate("/rewards")} type="button">
              <span>🏆</span> Rewards <b>→</b>
            </button>
            <button onClick={() => navigate("/feedback")} type="button">
              <span>💬</span> Send feedback <b>→</b>
            </button>
          </div>

          <div className="settings-sidebar-quote">
            <span>“</span>
            <p>
              We do not need a handful of people doing sustainability
              perfectly. We need millions doing it imperfectly.
            </p>
            <small>— THE GREEN PULSE SPIRIT</small>
          </div>
        </aside>
      </section>

      <footer className="settings-footer">
        <span>GREEN PULSE CSEAIML</span>
        <span>•</span>
        <span>Digital Green Challenge 2026</span>
        <span>•</span>
        <span>Grow responsibly. 🌍</span>
      </footer>

      {savedMessage && (
        <div className="settings-toast" role="status">
          <span>✓</span> {savedMessage}
          <button
            type="button"
            onClick={() => setSavedMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}

export default Settings;
