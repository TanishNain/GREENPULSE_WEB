import React, { useEffect, useMemo, useState } from "react";
import "./Forest.css";

const seasons = {
  spring: {
    name: "Spring",
    accent: "#b7d8a5",
    sky: "linear-gradient(#b7cbb7, #d9dfc5 45%, #7e9270)",
  },
  summer: {
    name: "Summer",
    accent: "#d6c982",
    sky: "linear-gradient(#83a8b8, #c5d0ba 48%, #66765d)",
  },
  autumn: {
    name: "Autumn",
    accent: "#c28b58",
    sky: "linear-gradient(#8d7770, #c7a47e 48%, #67594e)",
  },
  winter: {
    name: "Winter",
    accent: "#c5d7dc",
    sky: "linear-gradient(#71899a, #b8c7cc 50%, #59666b)",
  },
};

const weatherList = ["clear", "rain", "storm", "snow", "fog"];

function getTimeMode() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "sunset";
  return "night";
}

function SafeImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className={`${className} image-fallback`} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export default function Forest() {
  const [season, setSeason] = useState("summer");
  const [weather, setWeather] = useState("clear");
  const [timeMode, setTimeMode] = useState(getTimeMode());

  const [points, setPoints] = useState(() => {
    return Number(localStorage.getItem("greenpulse_points") || 72);
  });

  const [dogName, setDogName] = useState(
    () => localStorage.getItem("greenpulse_dog_name") || "Milo"
  );

  const [editingDog, setEditingDog] = useState(false);
  const [dogFed, setDogFed] = useState(
    () => localStorage.getItem("greenpulse_dog_fed") === new Date().toDateString()
  );

  const [menuOpen, setMenuOpen] = useState(true);
  const [activePlace, setActivePlace] = useState("forest");
  const [lionAwake, setLionAwake] = useState(false);
  const [campfire, setCampfire] = useState(false);
  const [caveOpen, setCaveOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeMode(getTimeMode());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("greenpulse_points", points);
  }, [points]);

  useEffect(() => {
    localStorage.setItem("greenpulse_dog_name", dogName);
  }, [dogName]);

  const treeCount = Math.max(1, Math.floor(points / 50));
  const flowerCount = Math.max(3, Math.floor(points / 15));

  const seasonData = seasons[season];

  const atmosphere = useMemo(() => {
    if (timeMode === "night") return "night";
    if (timeMode === "sunset") return "sunset";
    return "day";
  }, [timeMode]);

  function showMessage(text) {
    setMessage(text);
    setTimeout(() => setMessage(""), 2600);
  }

  function feedDog() {
    if (dogFed) {
      showMessage(`${dogName} has already been fed today.`);
      return;
    }

    setPoints((p) => p + 5);
    setDogFed(true);
    localStorage.setItem(
      "greenpulse_dog_fed",
      new Date().toDateString()
    );

    showMessage(`${dogName} enjoyed the meal. +5 Green Points`);
  }

  function wakeLion() {
    setLionAwake(true);
    showMessage("The lion noticed you and slowly moved deeper into the forest.");
  }

  function toggleSound() {
    setSoundOn((value) => !value);
    showMessage(
      !soundOn
        ? "Ambient sound enabled when supported by your browser."
        : "Ambient sound muted."
    );
  }

  return (
    <div
      className={`forest-app ${atmosphere} weather-${weather}`}
      style={{
        "--season-accent": seasonData.accent,
        "--sky": seasonData.sky,
      }}
    >
      {/* =========================================================
          GREEN PULSE INTRO — ONLY AT THE START
      ========================================================= */}

      <section className="forest-intro">
        <div className="intro-content">
          <div className="brand-mark">
            <div className="brand-symbol">GP</div>

            <div>
              <div className="brand-name">GREEN PULSE</div>
              <div className="brand-subtitle">
                Digital Green Challenge 2026
              </div>
            </div>
          </div>

          <h1>Enter the Living Forest</h1>

          <p>
            A digital ecosystem where your sustainable actions become
            something you can see, explore and protect.
          </p>

          <button
            className="enter-button"
            onClick={() =>
              document
                .getElementById("forest-world")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Enter the forest
            <span>↓</span>
          </button>
        </div>
      </section>

      {/* =========================================================
          MAIN WORLD
      ========================================================= */}

      <section
        id="forest-world"
        className={`forest-world ${activePlace}`}
      >
        <div className="world-sky" />

        <div className="distant-mountains" />

        <div className="tree-line tree-line-back">
          <span>🌲</span>
          <span>🌲</span>
          <span>🌲</span>
          <span>🌲</span>
          <span>🌲</span>
          <span>🌲</span>
          <span>🌲</span>
          <span>🌲</span>
        </div>

        <div className="forest-depth">
          {Array.from({ length: Math.min(treeCount, 14) }).map((_, i) => (
            <div
              className="generated-tree"
              key={i}
              style={{
                left: `${5 + ((i * 17) % 91)}%`,
                transform: `scale(${0.55 + ((i * 13) % 45) / 100})`,
              }}
            >
              <div className="tree-crown" />
              <div className="tree-trunk" />
            </div>
          ))}
        </div>

        {/* Weather */}

        {weather === "rain" && (
          <div className="rain-layer">
            {Array.from({ length: 90 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 19) % 100}%`,
                  animationDelay: `${(i % 13) / 10}s`,
                }}
              />
            ))}
          </div>
        )}

        {weather === "snow" && (
          <div className="snow-layer">
            {Array.from({ length: 60 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 31) % 100}%`,
                  animationDelay: `${(i % 11) / 2}s`,
                }}
              >
                •
              </span>
            ))}
          </div>
        )}

        {weather === "fog" && <div className="fog-layer" />}

        {/* =====================================================
            LEFT FOREST CONTROL PANEL
        ===================================================== */}

        <aside className={`forest-menu ${menuOpen ? "open" : "closed"}`}>
          <button
            className="menu-close"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>

          <div className="menu-heading">THE FOREST</div>

          <button
            className={activePlace === "forest" ? "active" : ""}
            onClick={() => setActivePlace("forest")}
          >
            <span>⌂</span>
            Forest
          </button>

          <button
            onClick={() => {
              setActivePlace("garden");
              document
                .getElementById("garden")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span>♧</span>
            My Garden
          </button>

          <button
            onClick={() => {
              setCaveOpen(true);
            }}
          >
            <span>◈</span>
            Cave
          </button>

          <button
            onClick={() => {
              setCampfire(true);
              setActivePlace("campfire");
            }}
          >
            <span>◉</span>
            Night Camp
          </button>

          <div className="menu-divider" />

          <div className="menu-heading">ATMOSPHERE</div>

          <div className="control-label">Season</div>

          <div className="choice-grid">
            {Object.keys(seasons).map((key) => (
              <button
                key={key}
                className={season === key ? "selected" : ""}
                onClick={() => setSeason(key)}
              >
                {seasons[key].name}
              </button>
            ))}
          </div>

          <div className="control-label">Weather</div>

          <div className="choice-grid">
            {weatherList.map((item) => (
              <button
                key={item}
                className={weather === item ? "selected" : ""}
                onClick={() => setWeather(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <button className="sound-button" onClick={toggleSound}>
            {soundOn ? "◉ Sound on" : "○ Sound off"}
          </button>
        </aside>

        {!menuOpen && (
          <button
            className="menu-tab"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
        )}

        {/* =====================================================
            HUD
        ===================================================== */}

        <div className="world-hud">
          <div>
            <span className="hud-label">GREEN POINTS</span>
            <strong>{points}</strong>
          </div>

          <div>
            <span className="hud-label">TREES GROWN</span>
            <strong>{treeCount}</strong>
          </div>

          <div>
            <span className="hud-label">TIME</span>
            <strong>
              {timeMode === "day"
                ? "DAY"
                : timeMode === "sunset"
                ? "SUNSET"
                : "NIGHT"}
            </strong>
          </div>
        </div>

        {/* =====================================================
            DOG
        ===================================================== */}

        <div className="animal dog">
          <div className="dog-shadow" />

          <SafeImage
            src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85"
            alt="Dog"
          />

          <div className="animal-name">
            {dogName}
          </div>

          <div className="animal-actions">
            {editingDog ? (
              <>
                <input
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value.slice(0, 16))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingDog(false);
                  }}
                  autoFocus
                />

                <button onClick={() => setEditingDog(false)}>
                  Save
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingDog(true)}>
                  Rename
                </button>

                <button onClick={feedDog}>
                  {dogFed ? "Fed today" : "Feed +5"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* =====================================================
            LION
        ===================================================== */}

        <button
          className={`lion ${lionAwake ? "awake" : ""}`}
          onClick={wakeLion}
          aria-label="Lion"
        >
          <SafeImage
            src="https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1000&q=85"
            alt="Lion resting in the forest"
          />

          <span>
            {lionAwake ? "The lion walks away..." : "Sleeping"}
          </span>
        </button>

        {/* =====================================================
            BIRDS
        ===================================================== */}

        <div className="bird bird-one">⌁</div>
        <div className="bird bird-two">⌁</div>
        <div className="bird bird-three">⌁</div>

        {/* =====================================================
            BUTTERFLIES
        ===================================================== */}

        <div className="butterfly butterfly-one">🦋</div>
        <div className="butterfly butterfly-two">🦋</div>

        {/* =====================================================
            GROUND
        ===================================================== */}

        <div className="forest-ground">
          {Array.from({ length: Math.min(flowerCount, 25) }).map((_, i) => (
            <span
              className="flower"
              key={i}
              style={{
                left: `${(i * 23) % 98}%`,
                bottom: `${3 + (i % 7)}%`,
              }}
            >
              ✦
            </span>
          ))}
        </div>

        {/* =====================================================
            INTERACTION PROMPT
        ===================================================== */}

        <div className="world-message">
          {message || "Explore quietly. The forest is alive."}
        </div>
      </section>

      {/* =========================================================
          GARDEN
      ========================================================= */}

      <section id="garden" className="garden-section">
        <div className="section-kicker">YOUR ECOLOGICAL FOOTPRINT</div>

        <h2>Watch your garden grow.</h2>

        <p>
          Every Green Point contributes to the digital ecosystem.
          As your activity grows, so does the landscape around you.
        </p>

        <div className="garden-ground">
          {Array.from({ length: Math.min(treeCount + 4, 18) }).map(
            (_, i) => (
              <div
                className="garden-tree"
                key={i}
                style={{
                  left: `${5 + ((i * 29) % 90)}%`,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div />
                <span />
              </div>
            )
          )}

          {Array.from({ length: Math.min(flowerCount, 35) }).map(
            (_, i) => (
              <i
                key={i}
                style={{
                  left: `${(i * 17) % 100}%`,
                  bottom: `${5 + (i % 8)}%`,
                }}
              />
            )
          )}
        </div>

        <div className="garden-stats">
          <div>
            <strong>{points}</strong>
            <span>Green Points</span>
          </div>

          <div>
            <strong>{treeCount}</strong>
            <span>Digital Trees</span>
          </div>

          <div>
            <strong>{flowerCount}</strong>
            <span>Plants</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          CAMPFIRE
      ========================================================= */}

      {campfire && (
        <section className="camp-section">
          <button
            className="camp-close"
            onClick={() => {
              setCampfire(false);
              setActivePlace("forest");
            }}
          >
            Leave camp
          </button>

          <div className="moon" />

          <div className="camp-scene">
            <div className="campfire">
              <div className="flame flame-a" />
              <div className="flame flame-b" />
              <div className="flame flame-c" />

              <div className="logs">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <div className="camp-copy">
            <span>QUIET HOURS</span>
            <h2>The forest after dark.</h2>
            <p>
              Slow down. Watch the fire. Let the forest become still.
            </p>
          </div>
        </section>
      )}

      {/* =========================================================
          CAVE
      ========================================================= */}

      {caveOpen && (
        <div className="cave-overlay">
          <div className="cave">
            <button
              className="cave-close"
              onClick={() => setCaveOpen(false)}
            >
              ×
            </button>

            <div className="cave-light" />

            <div className="crystal crystal-a" />
            <div className="crystal crystal-b" />
            <div className="crystal crystal-c" />

            <div className="bat">⌁</div>

            <div className="cave-content">
              <span>HIDDEN LOCATION</span>
              <h2>The Silent Cave</h2>
              <p>
                Some parts of the ecosystem reveal themselves only
                when you slow down enough to explore.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          GREEN PULSE OUTRO — ONLY AT THE END
      ========================================================= */}

      <section className="forest-outro">
        <div className="outro-logo">GP</div>

        <div className="outro-brand">GREEN PULSE</div>

        <h2>
          Small actions.
          <br />
          A living planet.
        </h2>

        <p>
          GreenPulse turns everyday environmental choices into
          something visible, measurable and meaningful.
        </p>

        <div className="outro-line" />

        <span className="copyright">
          GREEN PULSE CSEAIML • Digital Green Challenge 2026
        </span>
      </section>
    </div>
  );
}