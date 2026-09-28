import { useEffect, useMemo, useState } from "react";
import "./Forest.css";
import { getToken, logout } from "./auth.js";
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://greenpulse-web-tc0g.onrender.com";

/* =========================================================
   TREE
   ========================================================= */

function Tree({ className = "", size = "medium", delay = "0s" }) {
  return (
    <div
      className={`forest-tree forest-tree-${size} ${className}`}
      style={{ "--tree-delay": delay }}
      aria-hidden="true"
    >
      <div className="tree-trunk" />

      <div className="tree-crown tree-crown-a" />
      <div className="tree-crown tree-crown-b" />
      <div className="tree-crown tree-crown-c" />

      <div className="tree-leaves tree-leaves-a" />
      <div className="tree-leaves tree-leaves-b" />
      <div className="tree-leaves tree-leaves-c" />
      <div className="tree-leaves tree-leaves-d" />
    </div>
  );
}

/* =========================================================
   BIRD
   ========================================================= */

function Bird({ delay = "0s", top = "25%", duration = "22s" }) {
  return (
    <div
      className="forest-bird"
      style={{
        "--bird-delay": delay,
        "--bird-top": top,
        "--bird-duration": duration,
      }}
      aria-hidden="true"
    >
      <span className="bird-wing bird-wing-left" />
      <span className="bird-wing bird-wing-right" />
      <span className="bird-body" />
    </div>
  );
}

/* =========================================================
   LEAVES
   ========================================================= */

function FallingLeaves() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        left: `${(index * 19 + 7) % 100}%`,
        delay: `${(index % 9) * 1.15}s`,
        duration: `${7 + (index % 6)}s`,
        drift: `${-70 + ((index * 31) % 140)}px`,
        size: `${5 + (index % 4)}px`,
      })),
    []
  );

  return (
    <div className="forest-particles" aria-hidden="true">
      {leaves.map((leaf) => (
        <span
          key={leaf.id}
          style={{
            "--particle-left": leaf.left,
            "--particle-delay": leaf.delay,
            "--particle-duration": leaf.duration,
            "--particle-drift": leaf.drift,
            "--particle-size": leaf.size,
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   FIREFLIES
   ========================================================= */

function Fireflies() {
  const fireflies = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${(index * 23 + 9) % 94}%`,
        top: `${22 + ((index * 17) % 58)}%`,
        delay: `${(index % 8) * 0.8}s`,
        duration: `${3.5 + (index % 5) * 0.7}s`,
      })),
    []
  );

  return (
    <div className="forest-fireflies" aria-hidden="true">
      {fireflies.map((firefly) => (
        <span
          key={firefly.id}
          style={{
            "--firefly-left": firefly.left,
            "--firefly-top": firefly.top,
            "--firefly-delay": firefly.delay,
            "--firefly-duration": firefly.duration,
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   RAIN
   ========================================================= */

function Rain() {
  const drops = useMemo(
    () =>
      Array.from({ length: 90 }, (_, index) => ({
        id: index,
        left: `${(index * 17) % 100}%`,
        delay: `${(index % 15) * 0.12}s`,
        duration: `${0.7 + (index % 6) * 0.08}s`,
      })),
    []
  );

  return (
    <div className="forest-rain-layer" aria-hidden="true">
      {drops.map((drop) => (
        <span
          key={drop.id}
          style={{
            "--rain-left": drop.left,
            "--rain-delay": drop.delay,
            "--rain-duration": drop.duration,
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   BUTTERFLIES
   ========================================================= */

function Butterflies() {
  return (
    <div className="forest-butterflies" aria-hidden="true">
      <span className="butterfly butterfly-one">
        <i />
        <i />
      </span>

      <span className="butterfly butterfly-two">
        <i />
        <i />
      </span>

      <span className="butterfly butterfly-three">
        <i />
        <i />
      </span>
    </div>
  );
}

/* =========================================================
   FLOWERS
   ========================================================= */

function Flowers() {
  return (
    <div className="forest-flowers" aria-hidden="true">
      <span>
        <i />
        <i />
        <i />
        <i />
      </span>

      <span>
        <i />
        <i />
        <i />
        <i />
      </span>

      <span>
        <i />
        <i />
        <i />
        <i />
      </span>

      <span>
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

/* =========================================================
   PLANTS
   ========================================================= */

function GroundPlants({ dense = false }) {
  const count = dense ? 14 : 8;

  return (
    <div className="forest-plants" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          style={{
            "--plant-index": index,
            "--plant-delay": `${(index % 5) * 0.18}s`,
          }}
        >
          <i />
          <i />
        </span>
      ))}
    </div>
  );
}

/* =========================================================
   FOREST
   ========================================================= */

export default function Forest() {
  const [forest, setForest] = useState(null);
  const [weather, setWeather] = useState(null);
  const [season, setSeason] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = getToken();

async function loadForest() {
  try {
    setLoading(true);
    setError("");

    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    const forestResponse = await fetch(
      `${API_URL}/api/forest?token=${encodeURIComponent(token)}`
    );

    if (forestResponse.status === 401) {
      logout();
      return;
    }

    if (!forestResponse.ok) {
      throw new Error(
        `Forest API failed with ${forestResponse.status}`
      );
    }

    const forestData = await forestResponse.json();
    setForest(forestData);

    // Weather and season are optional atmosphere data.
    // They must NEVER prevent the forest itself from loading.
    try {
      const weatherResponse = await fetch(
        `${API_URL}/api/forest/weather`
      );

      if (weatherResponse.ok) {
        setWeather(await weatherResponse.json());
      } else {
        console.warn(
          "Weather unavailable:",
          weatherResponse.status
        );
      }
    } catch (weatherError) {
      console.warn(
        "Weather request failed:",
        weatherError
      );
    }

    try {
      const seasonResponse = await fetch(
        `${API_URL}/api/forest/season`
      );

      if (seasonResponse.ok) {
        setSeason(await seasonResponse.json());
      } else {
        console.warn(
          "Season unavailable:",
          seasonResponse.status
        );
      }
    } catch (seasonError) {
      console.warn(
        "Season request failed:",
        seasonError
      );
    }
  } catch (err) {
    console.error("Forest loading failed:", err);
    setError("Your forest could not be loaded right now.");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadForest();
  }, []);

  /* =======================================================
     DATA
     ======================================================= */

  const actions = Number(
    forest?.forest_actions ??
      forest?.stats?.forest_actions ??
      forest?.progress?.forest_actions ??
      0
  );

  const stage =
    forest?.stage ??
    forest?.forest_stage ??
    forest?.current_stage ??
    "Seedling";

  const unlocked = useMemo(() => {
    const features =
      forest?.unlocked_features ??
      forest?.features ??
      forest?.unlocks ??
      [];

    return Array.isArray(features) ? features : [];
  }, [forest]);

  const hasFeature = (name) =>
    unlocked.some((item) =>
      String(
        typeof item === "object"
          ? item.name ?? item.id ?? item.title ?? ""
          : item
      )
        .toLowerCase()
        .includes(name.toLowerCase())
    );

  const weatherCondition = String(
    weather?.condition ??
      weather?.conditions ??
      weather?.weather ??
      "clear"
  ).toLowerCase();

  const isRain =
    weatherCondition.includes("rain") ||
    weatherCondition.includes("drizzle") ||
    weatherCondition.includes("shower");

  const isStorm =
    weatherCondition.includes("storm") ||
    weatherCondition.includes("thunder");

  const isFog =
    weatherCondition.includes("fog") ||
    weatherCondition.includes("mist");

  const isCloudy =
    weatherCondition.includes("cloud") ||
    weatherCondition.includes("overcast");

  const isNight =
    weather?.is_day === false ||
    String(weather?.day_night ?? "").toLowerCase() === "night";

  /* =======================================================
     MILESTONES
     ======================================================= */

  const birdsUnlocked =
    hasFeature("birds") || actions >= 3;

  const insectsUnlocked =
    hasFeature("insects") || actions >= 7;

  const flowersUnlocked =
    actions >= 14 ||
    hasFeature("flowers");

  const wildlifeUnlocked =
    hasFeature("wildlife") || actions >= 15;

  const deepForest =
    actions >= 30 ||
    stage === "Deep Forest" ||
    stage === "Thriving Ecosystem" ||
    stage === "Forest Guardian";

  const streamUnlocked =
    hasFeature("stream") || actions >= 50;

  const denseForest =
    actions >= 21 ||
    deepForest;

  const thrivingForest =
    actions >= 60 ||
    stage === "Thriving Ecosystem" ||
    stage === "Forest Guardian";

  /* =======================================================
     STAGE NUMBER
     ======================================================= */

  const stageNumber =
    stage === "Forest Guardian"
      ? 6
      : stage === "Thriving Ecosystem"
      ? 5
      : stage === "Deep Forest"
      ? 4
      : stage === "Growing Forest"
      ? 3
      : stage === "Young Forest"
      ? 2
      : 1;

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <main className="forest-page forest-loading">
        <div className="forest-loading-glow" />

        <div className="forest-loading-core">
          <div className="forest-loading-seed">
            <span />
            <span />
            <span />
          </div>

          <span className="forest-loading-label">
            GREENPULSE ECOSYSTEM
          </span>

          <h1>Growing your forest</h1>

          <p>
            Preparing your digital ecosystem...
          </p>

          <div className="forest-loading-bar">
            <span />
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
     ======================================================= */

  if (error || !forest) {
    return (
      <main className="forest-page forest-error-page">
        <div className="forest-error-card">
          <span className="forest-error-icon">!</span>

          <span className="forest-eyebrow">
            ECOSYSTEM OFFLINE
          </span>

          <h1>Forest unavailable</h1>

          <p>
            {error ||
              "Something prevented your forest from loading."}
          </p>

          <button
            type="button"
            className="forest-primary-button"
            onClick={loadForest}
          >
            Try again
          </button>

          <button
            type="button"
            className="forest-secondary-button"
            onClick={() => window.history.back()}
          >
            Return to dashboard
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN WORLD
     ======================================================= */

  const pageClasses = [
    "forest-page",
    `forest-stage-${stageNumber}`,
    isNight ? "forest-night" : "",
    isRain ? "forest-rain" : "",
    isStorm ? "forest-storm" : "",
    isFog ? "forest-fog" : "",
    isCloudy ? "forest-cloudy" : "",
    denseForest ? "forest-dense" : "",
    thrivingForest ? "forest-thriving" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={pageClasses}>
      {/* ===================================================
          ATMOSPHERE
          =================================================== */}

      <div className="forest-sky" />
      <div className="forest-sky-gradient" />

      <div className="forest-sun">
        <span />
      </div>

      <div className="forest-sun-rays">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="forest-clouds">
        <span />
        <span />
        <span />
      </div>

      <div className="forest-haze" />

      <div className="forest-mist forest-mist-one" />
      <div className="forest-mist forest-mist-two" />
      <div className="forest-mist forest-mist-three" />

      {/* ===================================================
          BIRDS
          =================================================== */}

      {birdsUnlocked && (
        <>
          <Bird delay="0s" top="22%" duration="24s" />
          <Bird delay="7s" top="31%" duration="28s" />
        </>
      )}

      {wildlifeUnlocked && (
        <Bird delay="13s" top="17%" duration="31s" />
      )}

      {/* ===================================================
          RAIN
          =================================================== */}

      {isRain && <Rain />}

      {/* ===================================================
          PARTICLES
          =================================================== */}

      {!isRain && <FallingLeaves />}

      {insectsUnlocked && <Fireflies />}

      {flowersUnlocked && <Butterflies />}

      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="forest-header">
        <button
          type="button"
          className="forest-back"
          onClick={() => window.history.back()}
        >
          <span>←</span>
          Dashboard
        </button>

        <div className="forest-brand">
          <span className="brand-leaf">◆</span>
          GREEN<span>PULSE</span>
        </div>

        <div className="forest-weather">
          <div className="weather-symbol">
            {isNight
              ? "☾"
              : isStorm
              ? "≋"
              : isRain
              ? "⌁"
              : isCloudy
              ? "◌"
              : "○"}
          </div>

          <div>
            <strong>
              {weather?.condition ?? "Clear"}
            </strong>

            <small>
              {season?.season ??
                forest?.season ??
                "Monsoon"}
            </small>
          </div>
        </div>
      </header>

      {/* ===================================================
          WORLD
          =================================================== */}

      <section className="forest-world">
        {/* BACKGROUND */}
        <div className="forest-background">
          <div className="forest-hill forest-hill-back" />
          <div className="forest-hill forest-hill-middle" />
          <div className="forest-hill forest-hill-front" />

          <Tree
            className="tree-back-one"
            size="small"
            delay="0s"
          />

          <Tree
            className="tree-back-two"
            size="small"
            delay="1.2s"
          />

          <Tree
            className="tree-back-three"
            size="medium"
            delay="0.7s"
          />

          <Tree
            className="tree-back-four"
            size="small"
            delay="2s"
          />
        </div>

        {/* GROUND */}
        <div className="forest-ground">
          <div className="forest-ground-shadow" />
          <div className="forest-path" />

          <GroundPlants dense={denseForest} />

          {actions >= 3 && (
            <div className="forest-shrub forest-shrub-one">
              <span />
              <span />
              <span />
            </div>
          )}

          {actions >= 7 && (
            <div className="forest-shrub forest-shrub-two">
              <span />
              <span />
              <span />
            </div>
          )}

          {flowersUnlocked && <Flowers />}

          {streamUnlocked && (
            <div className="forest-stream">
              <div className="stream-bank stream-bank-left" />
              <div className="stream-bank stream-bank-right" />

              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {/* MIDGROUND */}
        <div className="forest-midground">
          <Tree
            className="tree-main-one"
            size="large"
            delay="0.3s"
          />

          <Tree
            className="tree-main-two"
            size="large"
            delay="1.4s"
          />

          {deepForest && (
            <>
              <Tree
                className="tree-deep-one"
                size="large"
                delay="2s"
              />

              <Tree
                className="tree-deep-two"
                size="medium"
                delay="2.8s"
              />

              <Tree
                className="tree-deep-three"
                size="large"
                delay="1.8s"
              />
            </>
          )}
        </div>

        {/* CENTER */}
        <div className="forest-center">
          <div className="forest-center-glow" />

          <div className="forest-seedling">
            <div className="seedling-stem" />

            <div className="seedling-leaf seedling-leaf-left">
              <span />
            </div>

            <div className="seedling-leaf seedling-leaf-right">
              <span />
            </div>

            <div className="seedling-ground" />
          </div>
        </div>

        {/* FOREGROUND */}
        <div className="forest-foreground">
          <div className="foreground-tree foreground-tree-left">
            <span />
            <span />
            <span />
          </div>

          <div className="foreground-tree foreground-tree-right">
            <span />
            <span />
            <span />
          </div>

          <div className="foreground-leaves foreground-leaves-left" />
          <div className="foreground-leaves foreground-leaves-right" />
        </div>

        {/* NIGHT FIREFLY GLOW */}
        {isNight && (
          <div className="forest-night-glow" />
        )}
      </section>

      {/* ===================================================
          INFO
          =================================================== */}

      <section className="forest-info">
        <div className="forest-info-copy">
          <span className="forest-eyebrow">
            YOUR DIGITAL ECOSYSTEM
          </span>

          <h1>{stage}</h1>

          <p>
            Every sustainable action you complete gives
            this ecosystem another reason to grow.
          </p>
        </div>

        <div className="forest-progress-card">
          <span>FOREST ACTIONS</span>

          <strong>{actions}</strong>

          <small>
            {actions === 1
              ? "action completed"
              : "actions completed"}
          </small>

          <div className="forest-progress-line">
            <span
              style={{
                width: `${Math.min(
                  100,
                  (actions % 20) * 5 || (actions > 0 ? 5 : 0)
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* ===================================================
          ECOSYSTEM UNLOCKS
          =================================================== */}

      <section className="forest-unlocks">
        <div className="forest-unlocks-heading">
          <span className="forest-eyebrow">
            ECOSYSTEM
          </span>

          <p>
            New life appears as your actions accumulate.
          </p>
        </div>

        <div className="forest-unlock-list">
          <div
            className={
              birdsUnlocked ? "unlocked" : "locked"
            }
          >
            <span className="unlock-art unlock-bird">
              <i />
              <i />
            </span>

            <div>
              <strong>Birdlife</strong>

              <small>
                {birdsUnlocked
                  ? "Unlocked"
                  : "3 actions"}
              </small>
            </div>

            {birdsUnlocked && (
              <b>✓</b>
            )}
          </div>

          <div
            className={
              insectsUnlocked ? "unlocked" : "locked"
            }
          >
            <span className="unlock-art unlock-insect">
              <i />
              <i />
              <i />
            </span>

            <div>
              <strong>Insects</strong>

              <small>
                {insectsUnlocked
                  ? "Unlocked"
                  : "7 actions"}
              </small>
            </div>

            {insectsUnlocked && (
              <b>✓</b>
            )}
          </div>

          <div
            className={
              wildlifeUnlocked ? "unlocked" : "locked"
            }
          >
            <span className="unlock-art unlock-wildlife">
              <i />
            </span>

            <div>
              <strong>Wildlife</strong>

              <small>
                {wildlifeUnlocked
                  ? "Unlocked"
                  : "15 actions"}
              </small>
            </div>

            {wildlifeUnlocked && (
              <b>✓</b>
            )}
          </div>

          <div
            className={
              streamUnlocked ? "unlocked" : "locked"
            }
          >
            <span className="unlock-art unlock-stream">
              <i />
              <i />
              <i />
            </span>

            <div>
              <strong>Living stream</strong>

              <small>
                {streamUnlocked
                  ? "Unlocked"
                  : "50 actions"}
              </small>
            </div>

            {streamUnlocked && (
              <b>✓</b>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer className="forest-footer">
        <span>GREEN PULSE</span>
        <i />
        <small>
          SMALL ACTIONS. LIVING IMPACT.
        </small>
      </footer>
    </main>
  );
}