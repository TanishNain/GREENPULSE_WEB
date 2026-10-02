import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const randomBetween = (min, max) =>
  Math.random() * (max - min) + min;

const WEATHER = {
  CLEAR: "clear",
  RAIN: "rain",
  STORM: "storm",
  SNOW: "snow",
  FOG: "fog",
};

const SEASONS = {
  SPRING: "spring",
  SUMMER: "summer",
  AUTUMN: "autumn",
  WINTER: "winter",
};

function SafeImage({ src, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function Forest() {
  const [entered, setEntered] = useState(false);
  const [weather, setWeather] = useState(WEATHER.CLEAR);
  const [season, setSeason] = useState(SEASONS.SUMMER);

  const [menuOpen, setMenuOpen] = useState(true);
  const [campfire, setCampfire] = useState(false);
  const [caveOpen, setCaveOpen] = useState(false);
  const [gardenOpen, setGardenOpen] = useState(false);

  const [dogName, setDogName] = useState(
    localStorage.getItem("greenpulse_dog_name") || "Buddy"
  );

  const [editingDog, setEditingDog] = useState(false);
  const [fedToday, setFedToday] = useState(
    localStorage.getItem("greenpulse_dog_fed") ===
      new Date().toDateString()
  );

  const [forestPoints, setForestPoints] = useState(
    Number(localStorage.getItem("greenpulse_forest_points") || 72)
  );

  const [trees, setTrees] = useState(
    Number(localStorage.getItem("greenpulse_forest_trees") || 4)
  );

  const [flowers, setFlowers] = useState(
    Number(localStorage.getItem("greenpulse_forest_flowers") || 8)
  );

  const [animalAwake, setAnimalAwake] = useState(false);
  const [deerVisible, setDeerVisible] = useState(true);
  const [explorerVisible, setExplorerVisible] = useState(true);

  const [time, setTime] = useState(new Date());
  const [worldX, setWorldX] = useState(0);

  const forestRef = useRef(null);

  /* ---------------------------------------------------------
     REAL TIME
  --------------------------------------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  /* ---------------------------------------------------------
     SAVE DATA
  --------------------------------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "greenpulse_forest_points",
      forestPoints
    );
  }, [forestPoints]);

  useEffect(() => {
    localStorage.setItem(
      "greenpulse_forest_trees",
      trees
    );
  }, [trees]);

  useEffect(() => {
    localStorage.setItem(
      "greenpulse_forest_flowers",
      flowers
    );
  }, [flowers]);

  useEffect(() => {
    localStorage.setItem(
      "greenpulse_dog_name",
      dogName
    );
  }, [dogName]);

  /* ---------------------------------------------------------
     TIME PHASE
  --------------------------------------------------------- */

  const hour =
    time.getHours() + time.getMinutes() / 60;

  const minute = time.getMinutes();

  const isNight = hour >= 19 || hour < 5.5;

  const isMorning =
    hour >= 5.5 && hour < 9;

  const isDay =
    hour >= 9 && hour < 17;

  const isGoldenHour =
    (hour >= 17 && hour < 19) ||
    (hour >= 5.5 && hour < 7);

  const isSunset =
    hour >= 17 && hour < 19;

  const isDawn =
    hour >= 5.5 && hour < 7;

  const timeLabel = isNight
    ? "Night"
    : isGoldenHour
      ? "Golden Hour"
      : isMorning
        ? "Morning"
        : isDay
          ? "Daytime"
          : "Evening";

  /* ---------------------------------------------------------
     SUN POSITION
  --------------------------------------------------------- */

  const sunProgress = (() => {
    const sunrise = 5.5;
    const sunset = 19;

    if (hour < sunrise) return 0;
    if (hour > sunset) return 1;

    return (hour - sunrise) / (sunset - sunrise);
  })();

  const sunX = `${8 + sunProgress * 84}%`;

  const sunY =
    58 -
    Math.sin(sunProgress * Math.PI) * 48;

  /* ---------------------------------------------------------
     WORLD MOVEMENT
  --------------------------------------------------------- */

  const moveWorld = (direction) => {
    setWorldX((old) =>
      clamp(old + direction * 520, -1560, 0)
    );
  };

  const enterForest = () => {
    setEntered(true);

    setTimeout(() => {
      forestRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  /* ---------------------------------------------------------
     CAMPFIRE
  --------------------------------------------------------- */

  const toggleCampfire = () => {
    setCampfire((v) => !v);

    if (!campfire) {
      setForestPoints((p) => p + 2);
    }
  };

  /* ---------------------------------------------------------
     DOG
  --------------------------------------------------------- */

  const feedDog = () => {
    if (fedToday) return;

    setFedToday(true);
    setForestPoints((p) => p + 5);

    localStorage.setItem(
      "greenpulse_dog_fed",
      new Date().toDateString()
    );
  };

  /* ---------------------------------------------------------
     LION
  --------------------------------------------------------- */

  const wakeLion = () => {
    setAnimalAwake(true);

    setForestPoints((p) => p + 3);

    setTimeout(() => {
      setAnimalAwake(false);
    }, 7000);
  };

  /* ---------------------------------------------------------
     DEER
  --------------------------------------------------------- */

  const interactDeer = () => {
    setDeerVisible(false);
    setForestPoints((p) => p + 3);

    setTimeout(() => {
      setDeerVisible(true);
    }, 15000);
  };

  /* ---------------------------------------------------------
     CAVE
  --------------------------------------------------------- */

  const enterCave = () => {
    setCaveOpen(true);
  };

  /* ---------------------------------------------------------
     GARDEN
  --------------------------------------------------------- */

  const addGardenPlant = () => {
    if (forestPoints < 5) return;

    setForestPoints((p) => p - 5);

    if (flowers < 40) {
      setFlowers((f) => f + 1);
    }

    if (flowers % 5 === 0 && trees < 20) {
      setTrees((t) => t + 1);
    }
  };

  /* ---------------------------------------------------------
     WEATHER PARTICLES
  --------------------------------------------------------- */

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 95 }, (_, i) => ({
        id: i,
        left: randomBetween(0, 100),
        delay: randomBetween(0, 2),
        duration: randomBetween(0.35, 0.9),
      })),
    []
  );

  const snowFlakes = useMemo(
    () =>
      Array.from({ length: 55 }, (_, i) => ({
        id: i,
        left: randomBetween(0, 100),
        delay: randomBetween(0, 4),
        duration: randomBetween(5, 11),
        size: randomBetween(3, 8),
      })),
    []
  );

  const fireflies = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        id: i,
        left: randomBetween(5, 95),
        top: randomBetween(30, 85),
        delay: randomBetween(0, 5),
        duration: randomBetween(2, 5),
      })),
    []
  );

  const birds = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        top: randomBetween(15, 37),
        delay: randomBetween(0, 10),
        duration: randomBetween(12, 24),
      })),
    []
  );

  const flowersArray = useMemo(
    () =>
      Array.from(
        { length: Math.min(flowers, 40) },
        (_, i) => ({
          id: i,
          left: `${5 + ((i * 37) % 90)}%`,
          bottom: `${8 + ((i * 19) % 32)}px`,
          delay: `${(i % 7) * 0.3}s`,
          size: `${15 + (i % 4) * 4}px`,
        })
      ),
    [flowers]
  );

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */

  return (
    <main
      className={[
        "forest-page",
        `weather-${weather}`,
        `season-${season}`,
        isNight ? "is-night" : "",
        isGoldenHour ? "is-golden" : "",
        isDawn ? "is-dawn" : "",
        campfire ? "campfire-active" : "",
      ].join(" ")}
    >
      {/* =====================================================
          INTRO
      ===================================================== */}

      {!entered && (
        <section className="forest-intro">

          <div className="intro-stars">
            {Array.from({ length: 45 }).map((_, i) => (
              <i key={i} />
            ))}
          </div>

          <div className="intro-moon" />

          <div className="intro-content">

            <div className="intro-brand">
              GREEN PULSE
            </div>

            <div className="intro-leaf">
              🌿
            </div>

            <h1>
              THE LIVING
              <br />
              FOREST
            </h1>

            <p>
              A small world shaped by your
              green actions.
            </p>

            <button
              className="enter-forest-btn"
              onClick={enterForest}
            >
              <span>ENTER FOREST</span>
              <b>→</b>
            </button>

            <div className="intro-hint">
              Explore • Discover • Protect
            </div>

          </div>

          <div className="intro-ground">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

        </section>
      )}

      {/* =====================================================
          FOREST WORLD
      ===================================================== */}

      {entered && (
        <section
          ref={forestRef}
          className="forest-world"
        >

          {/* SKY */}

          <div className="sky">

            <div
              className="sun"
              style={{
                left: sunX,
                top: `${sunY}%`,
              }}
            >
              <div className="sun-rays" />
            </div>

            <div className="moon">
              <div className="moon-shadow" />
            </div>

            {Array.from({ length: 50 }).map(
              (_, i) => (
                <span
                  className="star"
                  key={i}
                  style={{
                    left: `${(i * 29) % 100}%`,
                    top: `${5 + ((i * 17) % 42)}%`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              )
            )}

            {birds.map((bird) => (
              <div
                key={bird.id}
                className="bird"
                style={{
                  top: `${bird.top}%`,
                  animationDelay: `${bird.delay}s`,
                  animationDuration: `${bird.duration}s`,
                }}
              >
                <span />
                <span />
              </div>
            ))}

          </div>

          {/* DISTANT MOUNTAINS */}

          <div className="mountains">
            <div className="mountain m1" />
            <div className="mountain m2" />
            <div className="mountain m3" />
            <div className="mountain m4" />
          </div>

          {/* WORLD CONTENT */}

          <div
            className="world-track"
            style={{
              transform: `translateX(${worldX}px)`,
            }}
          >

            {/* FOREST ZONE */}

            <section className="world-zone zone-one">

              <div className="zone-title">
                <small>ZONE 01</small>
                <h2>THE WILD</h2>
              </div>

              <div className="pine forest-tree tree-a">
                <i />
                <i />
                <i />
              </div>

              <div className="pine forest-tree tree-b">
                <i />
                <i />
                <i />
              </div>

              <div className="pine forest-tree tree-c">
                <i />
                <i />
                <i />
              </div>

              <div className="pine forest-tree tree-d">
                <i />
                <i />
                <i />
              </div>

              <div className="bush bush-one" />
              <div className="bush bush-two" />
              <div className="bush bush-three" />

              {/* LION */}

              <button
                className={[
                  "lion",
                  animalAwake ? "lion-awake" : "",
                ].join(" ")}
                onClick={wakeLion}
                aria-label="Sleeping lion"
              >
                <div className="lion-body">
                  <span className="lion-head">
                    <i />
                    <i />
                  </span>
                  <span className="lion-tail" />
                  <span className="lion-leg l1" />
                  <span className="lion-leg l2" />
                  <span className="lion-leg l3" />
                  <span className="lion-leg l4" />
                </div>

                {!animalAwake && (
                  <small>Zzz...</small>
                )}
              </button>

              {/* DEER */}

              {deerVisible && (
                <button
                  className="deer"
                  onClick={interactDeer}
                >
                  <span className="deer-body" />
                  <span className="deer-neck" />
                  <span className="deer-head" />
                  <span className="antlers">♣</span>
                  <i className="deer-leg dl1" />
                  <i className="deer-leg dl2" />
                  <i className="deer-leg dl3" />
                  <i className="deer-leg dl4" />
                </button>
              )}

              {/* DOG */}

              <div className="dog">

                <div className="dog-body">
                  <span className="dog-head">
                    <i className="dog-ear left" />
                    <i className="dog-ear right" />
                    <i className="dog-eye" />
                    <i className="dog-nose" />
                  </span>

                  <span className="dog-tail" />

                  <i className="dog-leg one" />
                  <i className="dog-leg two" />
                  <i className="dog-leg three" />
                  <i className="dog-leg four" />
                </div>

                <div className="dog-name">
                  {dogName}
                </div>

              </div>

              {/* FLOWERS */}

              <div className="flowers">

                {flowersArray.map((flower) => (
                  <span
                    key={flower.id}
                    style={{
                      "--flower-x": flower.left,
                      "--flower-y":
                        flower.bottom,
                      "--flower-size":
                        flower.size,
                      "--flower-delay":
                        flower.delay,
                    }}
                  >
                    {flower.id % 4 === 0
                      ? "🌷"
                      : flower.id % 4 === 1
                        ? "🌼"
                        : flower.id % 4 === 2
                          ? "🌻"
                          : "🌸"}
                  </span>
                ))}

              </div>

            </section>

            {/* RIVER ZONE */}

            <section className="world-zone zone-two">

              <div className="zone-title">
                <small>ZONE 02</small>
                <h2>THE RIVER</h2>
              </div>

              <div className="river">

                {Array.from({ length: 14 }).map(
                  (_, i) => (
                    <span
                      key={i}
                      style={{
                        top: `${5 + i * 7}%`,
                        width: `${120 + (i % 4) * 80}px`,
                        left: `${10 + ((i * 13) % 75)}%`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  )
                )}

              </div>

              <div className="river-rock r1" />
              <div className="river-rock r2" />
              <div className="river-rock r3" />

              <div className="bridge">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="heron">
                <span />
                <i />
                <b />
              </div>

            </section>

            {/* CAVE ZONE */}

            <section className="world-zone zone-three">

              <div className="zone-title">
                <small>ZONE 03</small>
                <h2>THE CAVE</h2>
              </div>

              <button
                className="cave-entrance"
                onClick={enterCave}
              >

                <div className="cave-mouth">
                  <div className="cave-dark" />

                  <span className="crystal c1" />
                  <span className="crystal c2" />
                  <span className="crystal c3" />
                </div>

                <div className="cave-sign">
                  ENTER CAVE
                </div>

              </button>

              {/* EXPLORER */}

              {explorerVisible && (
                <div className="explorer">

                  <div className="explorer-body">
                    <span className="explorer-head" />
                    <span className="explorer-pack" />
                    <span className="lantern">
                      <i />
                    </span>
                    <i className="explorer-leg one" />
                    <i className="explorer-leg two" />
                  </div>

                </div>
              )}

              {/* BAT */}

              <div className="bat">
                <span />
                <span />
                <i />
              </div>

            </section>

            {/* CAMP ZONE */}

            <section className="world-zone zone-four">

              <div className="zone-title">
                <small>ZONE 04</small>
                <h2>THE CAMP</h2>
              </div>

              <div className="camp">

                <div className="tent">
                  <span className="tent-door" />
                  <span className="tent-pole" />
                </div>

                <div className="campfire-wrap">

                  <button
                    className="campfire"
                    onClick={toggleCampfire}
                    aria-label="Toggle campfire"
                  >

                    <div className="flame flame-one" />
                    <div className="flame flame-two" />
                    <div className="flame flame-three" />

                    <div className="embers">
                      {Array.from({
                        length: 12,
                      }).map((_, i) => (
                        <i
                          key={i}
                          style={{
                            "--ember-x":
                              `${randomBetween(-50, 50)}px`,
                            "--ember-delay":
                              `${randomBetween(0, 2)}s`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="logs">
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="fire-smoke">
                      <i />
                      <i />
                      <i />
                    </div>

                  </button>

                  <div className="campfire-label">
                    {campfire
                      ? "CAMPFIRE BURNING"
                      : "LIGHT CAMPFIRE"}
                  </div>

                </div>

                <div className="sleeping-bag" />

              </div>

            </section>

            {/* GARDEN ZONE */}

            <section className="world-zone zone-five">

              <div className="zone-title">
                <small>ZONE 05</small>
                <h2>YOUR GARDEN</h2>
              </div>

              <div className="garden">

                {Array.from({
                  length: Math.min(trees, 20),
                }).map((_, i) => (
                  <div
                    className="garden-tree"
                    key={i}
                    style={{
                      left: `${5 + ((i * 23) % 88)}%`,
                      bottom: `${15 + ((i * 11) % 15)}%`,
                    }}
                  >
                    <span />
                    <i />
                    <b />
                  </div>
                ))}

                {Array.from({
                  length: Math.min(
                    flowers,
                    45
                  ),
                }).map((_, i) => (
                  <span
                    className="garden-flower"
                    key={i}
                    style={{
                      left: `${4 + ((i * 17) % 92)}%`,
                      bottom: `${8 + ((i * 7) % 28)}%`,
                      animationDelay:
                        `${i * 0.12}s`,
                    }}
                  >
                    {i % 3 === 0
                      ? "🌸"
                      : i % 3 === 1
                        ? "🌼"
                        : "🌷"}
                  </span>
                ))}

              </div>

            </section>

          </div>

          {/* =================================================
              FIRELIGHT
          ================================================= */}

          {campfire && (
            <div className="firelight" />
          )}

          {/* =================================================
              FIRELIES
          ================================================= */}

          {isNight && (
            <div className="fireflies">

              {fireflies.map((fly) => (
                <span
                  key={fly.id}
                  style={{
                    left: `${fly.left}%`,
                    top: `${fly.top}%`,
                    animationDelay:
                      `${fly.delay}s`,
                    animationDuration:
                      `${fly.duration}s`,
                  }}
                />
              ))}

            </div>
          )}

          {/* =================================================
              WEATHER
          ================================================= */}

          {weather === WEATHER.RAIN ||
            weather === WEATHER.STORM ? (
            <div className="rain-layer">

              {rainDrops.map((drop) => (
                <span
                  key={drop.id}
                  style={{
                    left: `${drop.left}%`,
                    animationDelay:
                      `${drop.delay}s`,
                    animationDuration:
                      `${drop.duration}s`,
                  }}
                />
              ))}

            </div>
          ) : null}

          {weather === WEATHER.SNOW && (
            <div className="snow-layer">

              {snowFlakes.map((snow) => (
                <span
                  key={snow.id}
                  style={{
                    left: `${snow.left}%`,
                    width: `${snow.size}px`,
                    height: `${snow.size}px`,
                    animationDelay:
                      `${snow.delay}s`,
                    animationDuration:
                      `${snow.duration}s`,
                  }}
                />
              ))}

            </div>
          )}

          {weather === WEATHER.FOG && (
            <div className="fog-layer" />
          )}

          {/* STORM LIGHTNING */}

          {weather === WEATHER.STORM && (
            <div className="lightning" />
          )}

          {/* WIND */}

          <div className="wind-layer">
            {Array.from({ length: 16 }).map(
              (_, i) => (
                <span
                  key={i}
                  style={{
                    top: `${10 + i * 5}%`,
                    animationDelay:
                      `${i * 0.35}s`,
                  }}
                />
              )
            )}
          </div>

          {/* GROUND */}

          <div className="ground">

            {Array.from({ length: 25 }).map(
              (_, i) => (
                <span
                  className="grass"
                  key={i}
                  style={{
                    left: `${i * 4.3}%`,
                    animationDelay:
                      `${i * 0.12}s`,
                  }}
                />
              )
            )}

          </div>

          {/* =================================================
              SIDE MENU
          ================================================= */}

          <aside
            className={[
              "forest-menu",
              menuOpen
                ? "menu-open"
                : "menu-closed",
            ].join(" ")}
          >

            <button
              className="menu-toggle"
              onClick={() =>
                setMenuOpen((v) => !v)
              }
            >
              {menuOpen ? "‹" : "☰"}
            </button>

            {menuOpen && (
              <div className="menu-inner">

                <div className="menu-heading">
                  <span>GREEN PULSE</span>
                  <h3>FOREST</h3>
                </div>

                <div className="world-status">

                  <div>
                    <small>TIME</small>
                    <strong>
                      {timeLabel}
                    </strong>
                  </div>

                  <div>
                    <small>POINTS</small>
                    <strong>
                      {forestPoints}
                    </strong>
                  </div>

                </div>

                <div className="menu-section">

                  <label>
                    WEATHER
                  </label>

                  <div className="option-grid">

                    <button
                      className={
                        weather === WEATHER.CLEAR
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setWeather(
                          WEATHER.CLEAR
                        )
                      }
                    >
                      ☀️
                      <span>Clear</span>
                    </button>

                    <button
                      className={
                        weather === WEATHER.RAIN
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setWeather(
                          WEATHER.RAIN
                        )
                      }
                    >
                      🌧️
                      <span>Rain</span>
                    </button>

                    <button
                      className={
                        weather === WEATHER.STORM
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setWeather(
                          WEATHER.STORM
                        )
                      }
                    >
                      ⛈️
                      <span>Storm</span>
                    </button>

                    <button
                      className={
                        weather === WEATHER.SNOW
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setWeather(
                          WEATHER.SNOW
                        )
                      }
                    >
                      ❄️
                      <span>Snow</span>
                    </button>

                    <button
                      className={
                        weather === WEATHER.FOG
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setWeather(
                          WEATHER.FOG
                        )
                      }
                    >
                      🌫️
                      <span>Fog</span>
                    </button>

                  </div>

                </div>

                <div className="menu-section">

                  <label>
                    SEASON
                  </label>

                  <div className="season-buttons">

                    <button
                      className={
                        season ===
                        SEASONS.SPRING
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setSeason(
                          SEASONS.SPRING
                        )
                      }
                    >
                      🌸 Spring
                    </button>

                    <button
                      className={
                        season ===
                        SEASONS.SUMMER
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setSeason(
                          SEASONS.SUMMER
                        )
                      }
                    >
                      🌿 Summer
                    </button>

                    <button
                      className={
                        season ===
                        SEASONS.AUTUMN
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setSeason(
                          SEASONS.AUTUMN
                        )
                      }
                    >
                      🍂 Autumn
                    </button>

                    <button
                      className={
                        season ===
                        SEASONS.WINTER
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setSeason(
                          SEASONS.WINTER
                        )
                      }
                    >
                      ❄️ Winter
                    </button>

                  </div>

                </div>

                <div className="menu-actions">

                  <button
                    onClick={toggleCampfire}
                  >
                    🔥{" "}
                    {campfire
                      ? "Extinguish Fire"
                      : "Light Campfire"}
                  </button>

                  <button
                    onClick={() =>
                      setGardenOpen(true)
                    }
                  >
                    🌱 My Garden
                  </button>

                  <button
                    onClick={enterCave}
                  >
                    🕯️ Explore Cave
                  </button>

                </div>

                <div className="menu-dog">

                  <div className="dog-menu-title">
                    🐕 {dogName}
                  </div>

                  {editingDog ? (
                    <div className="dog-edit">

                      <input
                        value={dogName}
                        onChange={(e) =>
                          setDogName(
                            e.target.value.slice(
                              0,
                              16
                            )
                          )
                        }
                      />

                      <button
                        onClick={() =>
                          setEditingDog(false)
                        }
                      >
                        ✓
                      </button>

                    </div>
                  ) : (
                    <button
                      className="rename-btn"
                      onClick={() =>
                        setEditingDog(true)
                      }
                    >
                      Rename
                    </button>
                  )}

                  <button
                    className="feed-btn"
                    disabled={fedToday}
                    onClick={feedDog}
                  >
                    {fedToday
                      ? "✓ Fed Today"
                      : "🥩 Feed Dog +5"}
                  </button>

                </div>

              </div>
            )}

          </aside>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <div className="world-navigation">

            <button
              onClick={() => moveWorld(1)}
              disabled={worldX >= 0}
            >
              ←
            </button>

            <div className="navigation-track">

              <span
                className={
                  worldX === 0
                    ? "active"
                    : ""
                }
              />

              <span
                className={
                  worldX === -520
                    ? "active"
                    : ""
                }
              />

              <span
                className={
                  worldX === -1040
                    ? "active"
                    : ""
                }
              />

              <span
                className={
                  worldX === -1560
                    ? "active"
                    : ""
                }
              />

            </div>

            <button
              onClick={() => moveWorld(-1)}
              disabled={worldX <= -1560}
            >
              →
            </button>

          </div>

          {/* =================================================
              TOP STATUS
          ================================================= */}

          <div className="top-status">

            <div className="clock">
              {time.toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>

            <div className="weather-status">
              {weather === WEATHER.CLEAR &&
                "☀️ Clear"}

              {weather === WEATHER.RAIN &&
                "🌧️ Rain"}

              {weather === WEATHER.STORM &&
                "⛈️ Storm"}

              {weather === WEATHER.SNOW &&
                "❄️ Snow"}

              {weather === WEATHER.FOG &&
                "🌫️ Fog"}
            </div>

          </div>

          {/* =================================================
              GARDEN POPUP
          ================================================= */}

          {gardenOpen && (
            <div className="overlay">

              <div className="popup garden-popup">

                <button
                  className="close-popup"
                  onClick={() =>
                    setGardenOpen(false)
                  }
                >
                  ×
                </button>

                <span className="popup-icon">
                  🌱
                </span>

                <h2>
                  YOUR GARDEN
                </h2>

                <p>
                  Every action you take
                  helps your little world
                  grow.
                </p>

                <div className="garden-stats">

                  <div>
                    <strong>
                      {trees}
                    </strong>
                    <span>Trees</span>
                  </div>

                  <div>
                    <strong>
                      {flowers}
                    </strong>
                    <span>Flowers</span>
                  </div>

                  <div>
                    <strong>
                      {forestPoints}
                    </strong>
                    <span>Points</span>
                  </div>

                </div>

                <button
                  className="plant-btn"
                  onClick={addGardenPlant}
                  disabled={forestPoints < 5}
                >
                  🌼 Plant Something
                  <small>
                    5 points
                  </small>
                </button>

              </div>

            </div>
          )}

          {/* =================================================
              CAVE POPUP
          ================================================= */}

          {caveOpen && (
            <div className="cave-overlay">

              <div className="deep-cave">

                <button
                  className="cave-close"
                  onClick={() =>
                    setCaveOpen(false)
                  }
                >
                  ×
                </button>

                <div className="cave-ceiling" />

                <div className="deep-crystal dc1" />
                <div className="deep-crystal dc2" />
                <div className="deep-crystal dc3" />

                <div className="cave-explorer-large">

                  <div className="large-head" />

                  <div className="large-body">
                    <span className="large-lantern">
                      <i />
                    </span>
                  </div>

                  <i className="large-leg left" />
                  <i className="large-leg right" />

                </div>

                <div className="cave-bat-large">
                  <span />
                  <span />
                  <i />
                </div>

                <div className="cave-message">

                  <small>
                    THE DEEP FOREST
                  </small>

                  <h2>
                    SOMETHING LIVES
                    <br />
                    BEYOND THE TREES
                  </h2>

                  <p>
                    Keep exploring.
                  </p>

                </div>

              </div>

            </div>
          )}

        </section>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      {entered && (
        <footer className="forest-footer">
          GREEN PULSE CSEAIML
          <span>•</span>
          Digital Green Challenge 2026
        </footer>
      )}

    </main>
  );
}

export default Forest;