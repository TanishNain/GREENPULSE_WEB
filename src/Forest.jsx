import { useEffect, useMemo, useState } from "react";
import "./Forest.css";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://greenpulse-web-tc0g.onrender.com";

function Tree({ className = "", size = "medium" }) {
  return (
    <div className={`forest-tree forest-tree-${size} ${className}`}>
      <div className="tree-trunk" />

      <div className="tree-crown tree-crown-a" />
      <div className="tree-crown tree-crown-b" />
      <div className="tree-crown tree-crown-c" />

      <div className="tree-leaves tree-leaves-a" />
      <div className="tree-leaves tree-leaves-b" />
      <div className="tree-leaves tree-leaves-c" />
    </div>
  );
}

function Bird({ delay = "0s", top = "25%" }) {
  return (
    <div
      className="forest-bird"
      style={{
        "--bird-delay": delay,
        "--bird-top": top,
      }}
    >
      <span />
      <span />
    </div>
  );
}

function LeafParticles() {
  return (
    <div className="forest-particles" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          key={index}
          style={{
            "--particle-left": `${(index * 17) % 100}%`,
            "--particle-delay": `${(index % 7) * 1.1}s`,
            "--particle-duration": `${6 + (index % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Forest() {
  const [forest, setForest] = useState(null);
  const [weather, setWeather] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  async function loadForest() {
    try {
      setLoading(true);

      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const [forestResponse, weatherResponse, seasonResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/forest`, { headers }),
          fetch(`${API_URL}/api/forest/weather`),
          fetch(`${API_URL}/api/forest/season`),
        ]);

      if (forestResponse.ok) {
        setForest(await forestResponse.json());
      }

      if (weatherResponse.ok) {
        setWeather(await weatherResponse.json());
      }

      if (seasonResponse.ok) {
        setSeason(await seasonResponse.json());
      }
    } catch (error) {
      console.error("Forest loading failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForest();
  }, []);

  const actions = Number(
    forest?.forest_actions ??
      forest?.stats?.forest_actions ??
      forest?.progress?.forest_actions ??
      0
  );

  const stage = forest?.stage ?? forest?.forest_stage ?? "Seedling";

  const unlocked = useMemo(() => {
    const features =
      forest?.unlocked_features ??
      forest?.features ??
      [];

    return Array.isArray(features) ? features : [];
  }, [forest]);

  const hasFeature = (name) =>
    unlocked.some((item) =>
      String(item).toLowerCase().includes(name.toLowerCase())
    );

  const weatherCondition = String(
    weather?.condition ?? weather?.conditions ?? "clear"
  ).toLowerCase();

  const isRain =
    weatherCondition.includes("rain") ||
    weatherCondition.includes("drizzle") ||
    weatherCondition.includes("shower");

  const isStorm = weatherCondition.includes("storm");
  const isFog = weatherCondition.includes("fog");

  const isNight =
    weather?.is_day === false ||
    weather?.day_night === "night";

  const streamUnlocked =
    hasFeature("stream") || actions >= 50;

  const birdsUnlocked =
    hasFeature("birds") || actions >= 3;

  const insectsUnlocked =
    hasFeature("insects") || actions >= 7;

  const wildlifeUnlocked =
    hasFeature("wildlife") || actions >= 15;

  const deepForest =
    actions >= 30 ||
    stage === "Deep Forest" ||
    stage === "Thriving Ecosystem" ||
    stage === "Forest Guardian";

  if (loading) {
    return (
      <main className="forest-page forest-loading">
        <div className="forest-loading-core">
          <div className="forest-loading-seed">🌱</div>
          <p>Growing your forest...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={[
        "forest-page",
        `forest-stage-${Math.min(6, Math.max(1, Math.ceil(actions / 20) || 1))}`,
        isNight ? "forest-night" : "",
        isRain ? "forest-rain" : "",
        isStorm ? "forest-storm" : "",
        isFog ? "forest-fog" : "",
      ].join(" ")}
    >
      <div className="forest-sky" />
      <div className="forest-sun" />
      <div className="forest-sun-rays" />

      <div className="forest-mist forest-mist-one" />
      <div className="forest-mist forest-mist-two" />

      {isRain && (
        <div className="forest-rain-layer" aria-hidden="true">
          {Array.from({ length: 80 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      )}

      <LeafParticles />

      {birdsUnlocked && <Bird delay="0s" top="22%" />}
      {birdsUnlocked && <Bird delay="5s" top="32%" />}
      {wildlifeUnlocked && <Bird delay="10s" top="18%" />}

      <section className="forest-header">
        <button
          className="forest-back"
          onClick={() => window.history.back()}
        >
          ← Dashboard
        </button>

        <div className="forest-brand">
          GREEN<span>PULSE</span>
        </div>

        <div className="forest-weather">
          <span>{weather?.emoji ?? (isRain ? "🌧" : "☀")}</span>
          <div>
            <strong>
              {weather?.condition ?? "Clear"}
            </strong>
            <small>
              {season?.season ?? forest?.season ?? "Monsoon"}
            </small>
          </div>
        </div>
      </section>

      <section className="forest-world">
        <div className="forest-background">
          <div className="forest-hill forest-hill-back" />
          <div className="forest-hill forest-hill-middle" />

          <Tree className="tree-back-one" size="small" />
          <Tree className="tree-back-two" size="small" />
          <Tree className="tree-back-three" size="medium" />
        </div>

        <div className="forest-ground">
          <div className="forest-path" />

          <div className="forest-plants">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          {actions >= 3 && (
            <div className="forest-shrub forest-shrub-one" />
          )}

          {actions >= 7 && (
            <div className="forest-shrub forest-shrub-two" />
          )}

          {actions >= 14 && (
            <div className="forest-flowers">
              <i />
              <i />
              <i />
              <i />
            </div>
          )}

          {streamUnlocked && (
            <div className="forest-stream">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="forest-midground">
          <Tree className="tree-main-one" size="large" />
          <Tree className="tree-main-two" size="large" />

          {deepForest && (
            <>
              <Tree className="tree-deep-one" size="large" />
              <Tree className="tree-deep-two" size="large" />
            </>
          )}
        </div>

        <div className="forest-foreground">
          <div className="foreground-leaves foreground-leaves-left" />
          <div className="foreground-leaves foreground-leaves-right" />
        </div>

        {insectsUnlocked && (
          <div className="forest-fireflies" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        )}

        {insectsUnlocked && (
          <div className="forest-butterflies" aria-hidden="true">
            <span />
            <span />
          </div>
        )}

        <div className="forest-center">
          <div className="forest-seedling">
            <div className="seedling-stem" />
            <div className="seedling-leaf seedling-leaf-left" />
            <div className="seedling-leaf seedling-leaf-right" />
          </div>
        </div>
      </section>

      <section className="forest-info">
        <div>
          <span className="forest-eyebrow">YOUR DIGITAL ECOSYSTEM</span>
          <h1>{stage}</h1>
          <p>
            Every sustainable action you complete gives this forest
            another reason to grow.
          </p>
        </div>

        <div className="forest-progress-card">
          <span>FOREST ACTIONS</span>
          <strong>{actions}</strong>
          <small>actions completed</small>
        </div>
      </section>

      <section className="forest-unlocks">
        <span className="forest-eyebrow">ECOSYSTEM</span>

        <div className="forest-unlock-list">
          <div className={birdsUnlocked ? "unlocked" : ""}>
            <span>🐦</span>
            <div>
              <strong>Birds</strong>
              <small>
                {birdsUnlocked ? "Unlocked" : "3 actions"}
              </small>
            </div>
          </div>

          <div className={insectsUnlocked ? "unlocked" : ""}>
            <span>✦</span>
            <div>
              <strong>Insects</strong>
              <small>
                {insectsUnlocked ? "Unlocked" : "7 actions"}
              </small>
            </div>
          </div>

          <div className={wildlifeUnlocked ? "unlocked" : ""}>
            <span>◈</span>
            <div>
              <strong>Wildlife</strong>
              <small>
                {wildlifeUnlocked ? "Unlocked" : "15 actions"}
              </small>
            </div>
          </div>

          <div className={streamUnlocked ? "unlocked" : ""}>
            <span>〰</span>
            <div>
              <strong>Stream</strong>
              <small>
                {streamUnlocked ? "Unlocked" : "50 actions"}
              </small>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}