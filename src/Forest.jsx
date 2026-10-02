import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

/*
  GREEN PULSE FOREST
  ------------------
  Everything is remote or generated.
  No local image/audio/download paths.

  IMPORTANT:
  Browsers normally block autoplay audio.
  Sound starts only after the user presses SOUND.

  Remote media is treated as optional:
  if it fails, the game continues.
*/

const MEDIA = {
  forest:
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=90",

  dog:
    "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=900&q=85",

  butterfly:
    "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=700&q=80",

  birds:
    "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=900&q=80",

  forestSound:
    "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2c9d2e3f52.mp3",
};

const SEASONS = {
  Spring: {
    icon: "🌸",
    sky: "spring",
    tree: "spring",
    description: "Fresh leaves, flowers and returning birds.",
  },

  Summer: {
    icon: "☀️",
    sky: "summer",
    tree: "summer",
    description: "Warm sunlight and a lively green forest.",
  },

  Autumn: {
    icon: "🍂",
    sky: "autumn",
    tree: "autumn",
    description: "Golden leaves drift through the woodland.",
  },

  Winter: {
    icon: "❄️",
    sky: "winter",
    tree: "winter",
    description: "A quiet frozen forest.",
  },
};

const WEATHER = {
  Clear: "☀️",
  Rain: "🌧️",
  Storm: "⛈️",
  Snow: "❄️",
  Fog: "🌫️",
  Night: "🌙",
};

function SafeImage({ src, className, alt = "" }) {
  const [broken, setBroken] = useState(false);

  if (broken) return null;

  return (
    <img
      src={src}
      className={className}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

function Forest() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [season, setSeason] = useState("Spring");
  const [weather, setWeather] = useState("Clear");

  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem("greenpulse_forest_points");
    return Number(saved || 0);
  });

  const [trees, setTrees] = useState(() => {
    const saved = localStorage.getItem("greenpulse_forest_trees");
    return Number(saved || 3);
  });

  const [fedToday, setFedToday] = useState(() => {
    const saved = localStorage.getItem("greenpulse_fed_date");
    return saved === new Date().toDateString();
  });

  const [dogName, setDogName] = useState(() => {
    return localStorage.getItem("greenpulse_dog_name") || "Buddy";
  });

  const [editingDog, setEditingDog] = useState(false);

  const [sound, setSound] = useState(false);

  const [caveOpen, setCaveOpen] = useState(false);

  const [campfire, setCampfire] = useState(false);

  const [lionAwake, setLionAwake] = useState(false);

  const [message, setMessage] = useState(
    "Welcome to your living forest."
  );

  const [gardenBloom, setGardenBloom] = useState(0);

  const audioRef = useRef(null);

  /* ----------------------------------------------------------
     SAVE GAME
  ---------------------------------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "greenpulse_forest_points",
      String(points)
    );

    localStorage.setItem(
      "greenpulse_forest_trees",
      String(trees)
    );
  }, [points, trees]);

  /* ----------------------------------------------------------
     DAILY RESET
  ---------------------------------------------------------- */

  useEffect(() => {
    const today = new Date().toDateString();

    if (
      localStorage.getItem("greenpulse_fed_date") !== today
    ) {
      setFedToday(false);
    }
  }, []);

  /* ----------------------------------------------------------
     GROWTH
  ---------------------------------------------------------- */

  const level = Math.floor(points / 100) + 1;

  const growthStage = useMemo(() => {
    if (points >= 1000) return "Ancient Sanctuary";
    if (points >= 700) return "Wild Garden";
    if (points >= 500) return "Deep Forest";
    if (points >= 300) return "Young Forest";
    if (points >= 100) return "Growing Grove";
    return "Seedling Grove";
  }, [points]);

  const nextGoal = Math.ceil((points + 1) / 100) * 100;

  /* ----------------------------------------------------------
     MESSAGE
  ---------------------------------------------------------- */

  const say = (text) => {
    setMessage(text);

    window.clearTimeout(window.__gpForestMessage);

    window.__gpForestMessage = window.setTimeout(() => {
      setMessage("The forest is alive...");
    }, 3500);
  };

  /* ----------------------------------------------------------
     SOUND
  ---------------------------------------------------------- */

  const toggleSound = async () => {
    if (!audioRef.current) return;

    try {
      if (!sound) {
        audioRef.current.volume = 0.28;
        await audioRef.current.play();
        setSound(true);
        say("Forest sounds are now playing.");
      } else {
        audioRef.current.pause();
        setSound(false);
      }
    } catch {
      setSound(false);
      say(
        "Your browser blocked the online audio. Try SOUND again."
      );
    }
  };

  /* ----------------------------------------------------------
     FEED DOG
  ---------------------------------------------------------- */

  const feedDog = () => {
    if (fedToday) {
      say(`${dogName} has already been fed today ❤️`);
      return;
    }

    setFedToday(true);

    localStorage.setItem(
      "greenpulse_fed_date",
      new Date().toDateString()
    );

    setPoints((p) => p + 25);

    setGardenBloom((b) => Math.min(100, b + 10));

    say(
      `${dogName} loved the food! +25 Green Points 🌱`
    );
  };

  /* ----------------------------------------------------------
     FEED FOREST
  ---------------------------------------------------------- */

  const feedForest = () => {
    setPoints((p) => p + 10);

    setGardenBloom((b) => Math.min(100, b + 5));

    say("You cared for the forest. +10 Green Points 🌿");
  };

  /* ----------------------------------------------------------
     PLANT TREE
  ---------------------------------------------------------- */

  const plantTree = () => {
    if (points < 30) {
      say("You need 30 Green Points to grow another tree.");
      return;
    }

    setPoints((p) => p - 30);

    setTrees((t) => t + 1);

    say("A new tree has grown in your forest! 🌳");
  };

  /* ----------------------------------------------------------
     DOG NAME
  ---------------------------------------------------------- */

  const saveDogName = () => {
    const clean = dogName.trim() || "Buddy";

    setDogName(clean);

    localStorage.setItem(
      "greenpulse_dog_name",
      clean
    );

    setEditingDog(false);

    say(`Meet ${clean}, your forest companion! 🐕`);
  };

  /* ----------------------------------------------------------
     CAVE
  ---------------------------------------------------------- */

  const enterCave = () => {
    setCaveOpen(true);
    say("You entered the hidden cave...");
  };

  /* ----------------------------------------------------------
     LION
  ---------------------------------------------------------- */

  const wakeLion = () => {
    setLionAwake(true);

    setPoints((p) => p + 5);

    say(
      "The sleeping lion slowly opened its eyes... 🦁"
    );
  };

  /* ----------------------------------------------------------
     PARTICLES
  ---------------------------------------------------------- */

  const leaves = Array.from({ length: 45 });

  const butterflies = Array.from({ length: 8 });

  const birds = Array.from({ length: 12 });

  const rain = Array.from({ length: 90 });

  const snow = Array.from({ length: 70 });

  /* ----------------------------------------------------------
     CLASS
  ---------------------------------------------------------- */

  const sceneClass = [
    "forest-game",
    `season-${season.toLowerCase()}`,
    `weather-${weather.toLowerCase()}`,
    caveOpen ? "cave-mode" : "",
    campfire ? "campfire-mode" : "",
  ].join(" ");

  return (
    <div className={sceneClass}>

      {/* =====================================================
          ONLINE AUDIO
      ===================================================== */}

      <audio
        ref={audioRef}
        src={MEDIA.forestSound}
        loop
        preload="none"
        onError={() => setSound(false)}
      />

      {/* =====================================================
          SKY
      ===================================================== */}

      <div className="world-sky" />

      <div className="sun-orb" />

      <div className="moon-orb" />

      <div className="stars-layer">
        {Array.from({ length: 75 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>

      {/* =====================================================
          BACKGROUND IMAGE
      ===================================================== */}

      <SafeImage
        src={MEDIA.forest}
        className="remote-forest"
      />

      <div className="cinematic-fog" />

      <div className="light-rays" />

      {/* =====================================================
          TREES
      ===================================================== */}

      <div className="forest-trees">

        {Array.from({
          length: Math.min(34, 10 + trees),
        }).map((_, i) => (
          <div
            className={`game-tree ${
              i % 3 === 0 ? "large" : ""
            }`}
            key={i}
            style={{
              "--tree-x": `${(i * 3.7) % 100}%`,
              "--tree-depth": `${
                0.55 + ((i * 17) % 50) / 100
              }`,
              "--tree-delay": `${(i % 6) * 0.2}s`,
            }}
          >
            <div className="tree-shadow" />

            <div className="tree-trunk" />

            <div className="tree-crown crown-a" />
            <div className="tree-crown crown-b" />
            <div className="tree-crown crown-c" />
          </div>
        ))}

      </div>

      {/* =====================================================
          GROUND
      ===================================================== */}

      <div className="forest-ground">

        <div className="ground-path" />

        <div className="grass-field">

          {Array.from({ length: 140 }).map((_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 7.7) % 100}%`,
                height: `${10 + (i % 6) * 5}px`,
                animationDelay: `${(i % 8) / 3}s`,
              }}
            />
          ))}

        </div>

      </div>

      {/* =====================================================
          BUTTERFLIES
      ===================================================== */}

      <div className="butterfly-layer">

        {butterflies.map((_, i) => (
          <div
            className="real-butterfly"
            key={i}
            style={{
              "--bx": `${8 + i * 11}%`,
              "--by": `${35 + (i % 5) * 7}%`,
              "--bd": `${8 + i * 1.2}s`,
            }}
          >
            <span>🦋</span>
          </div>
        ))}

      </div>

      {/* =====================================================
          BIRDS
      ===================================================== */}

      <div className="bird-layer">

        {birds.map((_, i) => (
          <span
            key={i}
            className="real-bird"
            style={{
              "--bird-y": `${13 + (i % 5) * 7}%`,
              "--bird-delay": `${i * 1.7}s`,
              "--bird-speed": `${18 + i}s`,
            }}
          >
            🐦
          </span>
        ))}

      </div>

      {/* =====================================================
          BIRD NESTS
      ===================================================== */}

      <div className="bird-nests">

        <button
          className="nest nest-one"
          onClick={() =>
            say(
              "A little nest is hidden between the branches. 🪺"
            )
          }
        >
          🪺
        </button>

        <button
          className="nest nest-two"
          onClick={() =>
            say(
              "You found another bird nest! The forest is growing."
            )
          }
        >
          🪺
        </button>

      </div>

      {/* =====================================================
          SIDE WALL / MENU
      ===================================================== */}

      <aside
        className={`forest-sidebar ${
          menuOpen ? "open" : "closed"
        }`}
      >

        <div className="sidebar-logo">
          <span>🌿</span>
          <div>
            <strong>GREEN PULSE</strong>
            <small>FOREST WORLD</small>
          </div>
        </div>

        <button
          className="sidebar-item active"
          onClick={() => {
            setCaveOpen(false);
            say("You are exploring the forest.");
          }}
        >
          <span>🌲</span>
          Forest
        </button>

        <button
          className="sidebar-item"
          onClick={() => {
            setWeather("Night");
            say("Night mode activated. 🌙");
          }}
        >
          <span>🌙</span>
          Night
        </button>

        <button
          className="sidebar-item"
          onClick={() => setCampfire((v) => !v)}
        >
          <span>🔥</span>
          Campfire
        </button>

        <button
          className="sidebar-item"
          onClick={enterCave}
        >
          <span>🪨</span>
          Caves
        </button>

        <button
          className="sidebar-item"
          onClick={() => {
            document
              .querySelector(".growth-section")
              ?.scrollIntoView({
                behavior: "smooth",
              });
          }}
        >
          <span>🌱</span>
          My Garden
        </button>

        <div className="sidebar-divider" />

        <div className="sidebar-stat">
          <small>GREEN POINTS</small>
          <strong>{points}</strong>
        </div>

        <div className="sidebar-stat">
          <small>FOREST LEVEL</small>
          <strong>{level}</strong>
        </div>

      </aside>

      <button
        className={`wall-menu-button ${
          menuOpen ? "hide-button" : ""
        }`}
        onClick={() => setMenuOpen(true)}
        aria-label="Open forest menu"
      >
        <span />
        <span />
        <span />
      </button>

      <button
        className="sidebar-close"
        onClick={() => setMenuOpen(false)}
      >
        ‹
      </button>

      {/* =====================================================
          TOP HUD
      ===================================================== */}

      <header className="forest-topbar">

        <div className="top-title">
          <span className="green-pulse-dot" />
          <div>
            <strong>GREEN PULSE</strong>
            <small>LIVING FOREST</small>
          </div>
        </div>

        <div className="points-display">
          <span>🌱</span>
          <strong>{points}</strong>
          <small>POINTS</small>
        </div>

        <div className="top-actions">

          <button
            className={sound ? "active" : ""}
            onClick={toggleSound}
          >
            {sound ? "🔊" : "🔇"}
          </button>

          <button
            onClick={() => setCampfire((v) => !v)}
          >
            🔥
          </button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
          >
            ☰
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN HERO
      ===================================================== */}

      {!caveOpen && (
        <main className="forest-content">

          <section className="forest-hero">

            <span className="hero-kicker">
              YOUR DIGITAL WILDERNESS
            </span>

            <h1>
              Grow your
              <span> forest.</span>
            </h1>

            <p>
              Every green action can make this world
              more alive.
            </p>

            <div className="hero-message">
              <span>●</span>
              {message}
            </div>

          </section>

          {/* =================================================
              INTERACTION DECK
          ================================================= */}

          <section className="interaction-deck">

            <div className="interaction-card dog-card">

              <div className="animal-image-wrap">

                <SafeImage
                  src={MEDIA.dog}
                  className="dog-photo"
                />

                <div className="dog-fallback">
                  🐕
                </div>

                <div className="animal-glow" />

              </div>

              <div className="animal-info">

                <span>YOUR FOREST COMPANION</span>

                {editingDog ? (
                  <div className="dog-name-edit">

                    <input
                      value={dogName}
                      onChange={(e) =>
                        setDogName(e.target.value)
                      }
                      autoFocus
                    />

                    <button onClick={saveDogName}>
                      ✓
                    </button>

                  </div>
                ) : (
                  <h2>
                    {dogName}
                    <button
                      onClick={() =>
                        setEditingDog(true)
                      }
                    >
                      ✎
                    </button>
                  </h2>
                )}

                <p>
                  {fedToday
                    ? `${dogName} is happy and full.`
                    : `${dogName} is waiting for today's meal.`}
                </p>

                <button
                  className="feed-button"
                  onClick={feedDog}
                  disabled={fedToday}
                >
                  {fedToday
                    ? "✓ FED TODAY"
                    : "🍎 FEED COMPANION +25"}
                </button>

              </div>

            </div>

            <div className="interaction-card forest-care-card">

              <div className="care-icon">
                🌳
              </div>

              <div>
                <span>CARE FOR FOREST</span>

                <h2>
                  {growthStage}
                </h2>

                <p>
                  {trees} living trees are currently
                  growing.
                </p>

                <button
                  className="feed-button"
                  onClick={feedForest}
                >
                  💧 WATER FOREST +10
                </button>

              </div>

            </div>

          </section>

          {/* =================================================
              WORLD CONTROLS
          ================================================= */}

          <section className="world-controls">

            <div className="control-panel">

              <div className="control-heading">
                <span>SEASON</span>
                <small>
                  {SEASONS[season].description}
                </small>
              </div>

              <div className="control-options">

                {Object.entries(SEASONS).map(
                  ([name, data]) => (
                    <button
                      key={name}
                      className={
                        season === name
                          ? "selected"
                          : ""
                      }
                      onClick={() => {
                        setSeason(name);
                        say(
                          `${name} has arrived in the forest. ${data.icon}`
                        );
                      }}
                    >
                      <span>{data.icon}</span>
                      {name}
                    </button>
                  )
                )}

              </div>

            </div>

            <div className="control-panel">

              <div className="control-heading">
                <span>WEATHER</span>
                <small>
                  Change the atmosphere.
                </small>
              </div>

              <div className="control-options">

                {Object.entries(WEATHER).map(
                  ([name, icon]) => (
                    <button
                      key={name}
                      className={
                        weather === name
                          ? "selected"
                          : ""
                      }
                      onClick={() => {
                        setWeather(name);
                        say(
                          `${name} weather activated. ${icon}`
                        );
                      }}
                    >
                      <span>{icon}</span>
                      {name}
                    </button>
                  )
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              CAMPFIRE
          ================================================= */}

          {campfire && (
            <section className="campfire-section">

              <div className="campfire-scene">

                <div className="campfire-glow" />

                <div className="fire">

                  <i />
                  <i />
                  <i />

                </div>

                <div className="logs">
                  <span />
                  <span />
                </div>

              </div>

              <div className="campfire-info">

                <span>NIGHT FOREST</span>

                <h2>
                  Stay awhile.
                </h2>

                <p>
                  A quiet digital campfire for studying,
                  relaxing or simply listening to the forest.
                </p>

                <div className="campfire-player">
                  <button
                    onClick={toggleSound}
                  >
                    {sound ? "⏸" : "▶"}
                  </button>

                  <div>
                    <small>FOREST AMBIENCE</small>
                    <strong>
                      {sound
                        ? "PLAYING"
                        : "PRESS PLAY"}
                    </strong>
                  </div>
                </div>

              </div>

            </section>
          )}

          {/* =================================================
              GROWTH SECTION
          ================================================= */}

          <section className="growth-section">

            <div className="growth-header">

              <div>
                <span>YOUR WORLD</span>

                <h2>
                  Watch it grow.
                </h2>

                <p>
                  Use Green Points to turn a tiny grove
                  into a living sanctuary.
                </p>
              </div>

              <div className="growth-level">
                <small>LEVEL</small>
                <strong>{level}</strong>
              </div>

            </div>

            <div className="growth-progress">

              <div className="progress-label">
                <span>
                  {points} POINTS
                </span>

                <span>
                  NEXT GROWTH {nextGoal}
                </span>
              </div>

              <div className="progress-track">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      (points % 100)
                    )}%`,
                  }}
                />
              </div>

            </div>

            <div className="garden-preview">

              {Array.from({
                length: Math.min(25, 5 + Math.floor(points / 40)),
              }).map((_, i) => (
                <div
                  className="garden-tree"
                  key={i}
                  style={{
                    left: `${5 + ((i * 17) % 90)}%`,
                    bottom: `${5 + ((i * 13) % 18)}%`,
                    transform: `scale(${
                      0.55 + ((i * 23) % 60) / 100
                    })`,
                  }}
                >
                  🌳
                </div>
              ))}

              {Array.from({
                length: Math.min(
                  18,
                  Math.floor(points / 35)
                ),
              }).map((_, i) => (
                <div
                  className="garden-flower"
                  key={`f${i}`}
                  style={{
                    left: `${8 + ((i * 21) % 84)}%`,
                    bottom: `${3 + ((i * 9) % 14)}%`,
                  }}
                >
                  {i % 2 ? "🌼" : "🌷"}
                </div>
              ))}

              <div className="garden-title">
                <span>{growthStage}</span>
                <strong>
                  {trees} TREES
                </strong>
              </div>

            </div>

            <button
              className="plant-button"
              onClick={plantTree}
            >
              🌱 GROW A NEW TREE — 30 POINTS
            </button>

          </section>

          {/* =================================================
              LION
          ================================================= */}

          <section className="wildlife-section">

            <div className="sleeping-lion">

              <div
                className={`lion ${
                  lionAwake ? "awake" : ""
                }`}
                onClick={wakeLion}
              >
                🦁
              </div>

              <div className="sleep-z">
                {lionAwake ? "👀" : "Zzz..."}
              </div>

            </div>

            <div className="wildlife-text">

              <span>WILDLIFE DISCOVERY</span>

              <h2>
                {lionAwake
                  ? "The lion is watching."
                  : "Something is sleeping nearby..."}
              </h2>

              <p>
                {lionAwake
                  ? "You discovered a hidden resident of the forest."
                  : "Approach carefully and wake it."}
              </p>

              <button
                onClick={wakeLion}
              >
                {lionAwake
                  ? "✓ DISCOVERED"
                  : "👆 WAKE LION +5"}
              </button>

            </div>

          </section>

          {/* =================================================
              CAVE ENTRY
          ================================================= */}

          <section className="cave-entry">

            <div className="cave-art">

              <div className="cave-mouth">

                <div className="cave-eye">
                  ✨
                </div>

              </div>

            </div>

            <div>

              <span>HIDDEN LOCATION</span>

              <h2>
                The Whispering Cave
              </h2>

              <p>
                Nobody knows what lives beyond the
                entrance.
              </p>

              <button onClick={enterCave}>
                ENTER CAVE →
              </button>

            </div>

          </section>

          <div className="forest-end">
            <span>🌲</span>
            <p>
              The forest keeps growing when you leave.
            </p>
          </div>

        </main>
      )}

      {/* =====================================================
          CAVE WORLD
      ===================================================== */}

      {caveOpen && (
        <section className="cave-world">

          <button
            className="cave-back"
            onClick={() => setCaveOpen(false)}
          >
            ← EXIT CAVE
          </button>

          <div className="cave-stars">
            ✦　　✧　　 ✦　　　✧
          </div>

          <div className="cave-title">

            <span>HIDDEN WORLD</span>

            <h1>
              The Whispering Cave
            </h1>

            <p>
              A secret place beneath your forest.
            </p>

          </div>

          <div className="cave-chamber">

            <div className="stalactite s1" />
            <div className="stalactite s2" />
            <div className="stalactite s3" />

            <div className="cave-water">
              ✦ ✦ ✦ ✦ ✦
            </div>

            <button
              className="cave-crystal"
              onClick={() => {
                setPoints((p) => p + 15);
                say("You discovered a crystal! +15 points.");
              }}
            >
              💎
              <small>
                DISCOVER
              </small>
            </button>

            <div className="cave-creature">
              🦇
            </div>

          </div>

        </section>
      )}

      {/* =====================================================
          WEATHER PARTICLES
      ===================================================== */}

      {weather === "Rain" ||
      weather === "Storm" ? (
        <div className="rain-layer">
          {rain.map((_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 13.7) % 100}%`,
                animationDelay: `${(i % 17) / 4}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      {weather === "Snow" && (
        <div className="snow-layer">
          {snow.map((_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 11.3) % 100}%`,
                animationDelay: `${(i % 13) / 3}s`,
              }}
            >
              ❄
            </i>
          ))}
        </div>
      )}

      {/* =====================================================
          FINAL VIGNETTE
      ===================================================== */}

      <div className="forest-vignette" />

    </div>
  );
}

export default Forest;