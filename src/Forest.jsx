import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

/* =========================================================
   GREEN PULSE — FOREST EXPERIENCE
   ========================================================= */

const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
const WEATHER = ["Clear", "Rain", "Storm", "Snow", "Fog"];

const ANIMALS = [
  { id: "deer", name: "Deer", emoji: "🦌", points: 5 },
  { id: "rabbit", name: "Rabbit", emoji: "🐇", points: 3 },
  { id: "fox", name: "Fox", emoji: "🦊", points: 7 },
  { id: "bird", name: "Bird", emoji: "🦜", points: 2 },
  { id: "butterfly", name: "Butterfly", emoji: "🦋", points: 2 },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getTimePhase(hour, minute) {
  const t = hour + minute / 60;

  if (t >= 5 && t < 7) return "Dawn";
  if (t >= 7 && t < 10) return "Morning";
  if (t >= 10 && t < 16) return "Day";
  if (t >= 16 && t < 18.5) return "Golden Hour";
  if (t >= 18.5 && t < 20) return "Dusk";
  return "Night";
}

function getSkyClass(phase) {
  return phase.toLowerCase().replace(" ", "-");
}

function SafeImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`image-fallback ${className}`}>
        <span>🌿</span>
      </div>
    );
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

/* =========================================================
   ANIMAL COMPONENTS
   ========================================================= */

function CSSDeer({ fed, onFeed }) {
  return (
    <button
      className={`css-animal deer-animal ${fed ? "animal-fed" : ""}`}
      onClick={onFeed}
      title="Feed the deer"
    >
      <span className="deer-antler left-antler">♣</span>
      <span className="deer-antler right-antler">♣</span>
      <span className="deer-head">
        <span className="deer-ear left-ear" />
        <span className="deer-ear right-ear" />
        <span className="deer-eye" />
        <span className="deer-nose" />
      </span>
      <span className="deer-body" />
      <span className="deer-leg leg-1" />
      <span className="deer-leg leg-2" />
      <span className="deer-leg leg-3" />
      <span className="deer-leg leg-4" />
      <span className="deer-tail">◆</span>
      {fed && <span className="animal-heart">♥</span>}
    </button>
  );
}

function CSSFox({ fed, onFeed }) {
  return (
    <button
      className={`css-animal fox-animal ${fed ? "animal-fed" : ""}`}
      onClick={onFeed}
      title="Feed the fox"
    >
      <span className="fox-tail">〰</span>
      <span className="fox-body" />
      <span className="fox-head">
        <span className="fox-ear fox-ear-left" />
        <span className="fox-ear fox-ear-right" />
        <span className="fox-eye fox-eye-left" />
        <span className="fox-eye fox-eye-right" />
        <span className="fox-muzzle" />
      </span>
      <span className="fox-leg fox-leg-1" />
      <span className="fox-leg fox-leg-2" />
      <span className="fox-leg fox-leg-3" />
      <span className="fox-leg fox-leg-4" />
      {fed && <span className="animal-heart">♥</span>}
    </button>
  );
}

function CSSRabbit({ onFeed }) {
  return (
    <button
      className="css-animal rabbit-animal"
      onClick={onFeed}
      title="Feed the rabbit"
    >
      <span className="rabbit-ear rabbit-ear-1" />
      <span className="rabbit-ear rabbit-ear-2" />
      <span className="rabbit-head">
        <span className="rabbit-eye" />
        <span className="rabbit-nose" />
      </span>
      <span className="rabbit-body" />
      <span className="rabbit-foot" />
      <span className="rabbit-tail">●</span>
    </button>
  );
}

/* =========================================================
   CAMEL
   IMPORTANT: camel is ALWAYS rendered.
   It does not depend on scroll position.
   ========================================================= */

function CSSCamel({ onFeed }) {
  return (
    <button
      className="css-camel"
      onClick={onFeed}
      title="Feed the camel"
      aria-label="Camel"
    >
      <span className="camel-hump camel-hump-one" />
      <span className="camel-hump camel-hump-two" />

      <span className="camel-body" />

      <span className="camel-neck" />

      <span className="camel-head">
        <span className="camel-ear camel-ear-one" />
        <span className="camel-ear camel-ear-two" />
        <span className="camel-eye" />
        <span className="camel-muzzle" />
      </span>

      <span className="camel-leg camel-leg-one" />
      <span className="camel-leg camel-leg-two" />
      <span className="camel-leg camel-leg-three" />
      <span className="camel-leg camel-leg-four" />

      <span className="camel-tail">〰</span>
    </button>
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function Forest() {
  const [now, setNow] = useState(new Date());

  const [season, setSeason] = useState(
    () => localStorage.getItem("gp_forest_season") || "Spring"
  );

  const [weather, setWeather] = useState(
    () => localStorage.getItem("gp_forest_weather") || "Clear"
  );

  const [forestEntered, setForestEntered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [caveOpen, setCaveOpen] = useState(false);
  const [gardenOpen, setGardenOpen] = useState(false);
  const [campfire, setCampfire] = useState(false);

  const [dogName, setDogName] = useState(
    () => localStorage.getItem("gp_dog_name") || "Buddy"
  );

  const [dogFed, setDogFed] = useState(false);
  const [animalFed, setAnimalFed] = useState({});
  const [lionAwake, setLionAwake] = useState(false);

  const [points, setPoints] = useState(
    () => Number(localStorage.getItem("gp_forest_points") || 0)
  );

  const [gardenGrowth, setGardenGrowth] = useState(
    () => Number(localStorage.getItem("gp_garden_growth") || 15)
  );

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [rainEnabled, setRainEnabled] = useState(false);

  const [toast, setToast] = useState("");

  const audioContextRef = useRef(null);
  const ambientRef = useRef(null);
  const chirpTimerRef = useRef(null);

  /* =======================================================
     CLOCK
     ======================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const phase = getTimePhase(hour, minute);

  /* =======================================================
     PERSISTENCE
     ======================================================= */

  useEffect(() => {
    localStorage.setItem("gp_forest_season", season);
  }, [season]);

  useEffect(() => {
    localStorage.setItem("gp_forest_weather", weather);
  }, [weather]);

  useEffect(() => {
    localStorage.setItem("gp_dog_name", dogName);
  }, [dogName]);

  useEffect(() => {
    localStorage.setItem("gp_forest_points", points);
  }, [points]);

  useEffect(() => {
    localStorage.setItem("gp_garden_growth", gardenGrowth);
  }, [gardenGrowth]);

  /* =======================================================
     TOAST
     ======================================================= */

  const showToast = (message) => {
    setToast(message);

    window.clearTimeout(showToast.timer);

    showToast.timer = window.setTimeout(() => {
      setToast("");
    }, 2200);
  };

  /* =======================================================
     POINTS
     ======================================================= */

  const addPoints = (amount, message) => {
    setPoints((value) => value + amount);
    setGardenGrowth((value) => clamp(value + amount * 0.7, 0, 100));

    if (message) {
      showToast(`+${amount} Green Points • ${message}`);
    }
  };

  /* =======================================================
     DOG
     ======================================================= */

  const feedDog = () => {
    if (dogFed) {
      showToast(`${dogName} has already been fed today 🐕`);
      return;
    }

    setDogFed(true);
    addPoints(5, `${dogName} enjoyed the meal`);
  };

  /* =======================================================
     ANIMALS
     ======================================================= */

  const feedAnimal = (id) => {
    if (animalFed[id]) {
      showToast("This animal has already been fed today.");
      return;
    }

    const animal = ANIMALS.find((item) => item.id === id);

    setAnimalFed((old) => ({
      ...old,
      [id]: true,
    }));

    addPoints(animal?.points || 2, `${animal?.name || "Animal"} fed`);
  };

  /* =======================================================
     CAMEL
     ======================================================= */

  const feedCamel = () => {
    addPoints(4, "The camel enjoyed some food 🐪");
  };

  /* =======================================================
     LION
     ======================================================= */

  const wakeLion = () => {
    setLionAwake(true);
    addPoints(3, "You woke the lion carefully");
    showToast("The lion slowly wakes up... 🦁");
  };

  /* =======================================================
     WEATHER
     ======================================================= */

  const changeWeather = (value) => {
    setWeather(value);
    setRainEnabled(value === "Rain" || value === "Storm");

    showToast(`${value} weather activated`);
  };

  /* =======================================================
     WEB AUDIO AMBIENCE
     ======================================================= */

  const stopAmbientSound = () => {
    if (chirpTimerRef.current) {
      clearTimeout(chirpTimerRef.current);
      chirpTimerRef.current = null;
    }

    if (ambientRef.current) {
      try {
        ambientRef.current.stop();
      } catch {
        // already stopped
      }

      ambientRef.current = null;
    }
  };

  const playChirp = () => {
    const ctx = audioContextRef.current;

    if (!ctx || !soundEnabled) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";

    const base = 1500 + Math.random() * 900;
    const end = base + 500 + Math.random() * 700;

    oscillator.frequency.setValueAtTime(base, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      end,
      ctx.currentTime + 0.11
    );

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.035,
      ctx.currentTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 0.2
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.21);

    chirpTimerRef.current = setTimeout(
      playChirp,
      1200 + Math.random() * 3500
    );
  };

  const startAmbientSound = async () => {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      showToast("Ambient sound is not supported by this browser.");
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    setSoundEnabled(true);

    if (!ambientRef.current) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = "sine";
      oscillator.frequency.value = 90;

      filter.type = "lowpass";
      filter.frequency.value = 420;

      gain.gain.value = 0.008;

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();

      ambientRef.current = oscillator;
    }

    playChirp();
  };

  const toggleSound = async () => {
    if (soundEnabled) {
      stopAmbientSound();
      setSoundEnabled(false);
      return;
    }

    await startAmbientSound();
  };

  useEffect(() => {
    return () => {
      stopAmbientSound();

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const enterForest = () => {
    setForestEntered(true);

    setTimeout(() => {
      document
        .getElementById("forest-world")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 80);
  };

  const scrollWorld = (direction) => {
    const world = document.getElementById("forest-world");

    if (!world) return;

    world.scrollBy({
      left: direction * 900,
      behavior: "smooth",
    });
  };

  const openCave = () => {
    setCaveOpen(true);
    showToast("You entered the hidden cave...");
  };

  const openGarden = () => {
    setGardenOpen(true);
  };

  /* =======================================================
     SUN POSITION
     ======================================================= */

  const daylightStart = 5;
  const daylightEnd = 20;

  const daylightProgress = clamp(
    ((hour + minute / 60 + second / 3600) - daylightStart) /
      (daylightEnd - daylightStart),
    0,
    1
  );

  const sunAngle = daylightProgress * 180;

  const sunStyle = {
    "--sun-angle": `${sunAngle}deg`,
    "--sun-progress": daylightProgress,
  };

  /* =======================================================
     STARS
     ======================================================= */

  const stars = useMemo(
    () =>
      Array.from({ length: 80 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        top: `${(index * 53) % 65}%`,
        delay: `${(index % 9) * 0.35}s`,
        size: `${1 + (index % 3)}px`,
      })),
    []
  );

  /* =======================================================
     FLOWERS
     ======================================================= */

  const flowers = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        id: index,
        left: `${4 + ((index * 29) % 92)}%`,
        bottom: `${6 + ((index * 17) % 34)}px`,
        size: `${14 + (index % 4) * 3}px`,
        delay: `${(index % 7) * 0.35}s`,
        symbol: ["🌼", "🌸", "🌺", "🌷", "💮"][index % 5],
      })),
    []
  );

  /* =======================================================
     RAIN
     ======================================================= */

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 110 }, (_, index) => ({
        id: index,
        left: `${(index * 17) % 100}%`,
        delay: `${(index % 25) * 0.07}s`,
        duration: `${0.55 + (index % 7) * 0.08}s`,
      })),
    []
  );

  return (
    <main
      className={`forest-page season-${season.toLowerCase()} weather-${weather.toLowerCase()} phase-${getSkyClass(
        phase
      )}`}
    >
      {/* =====================================================
          INTRO
          ===================================================== */}

      <section className="forest-intro">
        <div className="intro-stars">
          {stars.map((star) => (
            <i
              key={star.id}
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>

        <div className="intro-moon" />

        <div className="intro-mountains mountain-back" />
        <div className="intro-mountains mountain-front" />

        <div className="intro-title">
          <span className="intro-small">WELCOME TO</span>
          <h1>GREEN PULSE</h1>
          <p>A living digital forest powered by your green actions.</p>

          <button className="enter-forest-button" onClick={enterForest}>
            ENTER FOREST
            <span>→</span>
          </button>
        </div>

        <div className="intro-grass">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      {/* =====================================================
          FOREST WORLD
          ===================================================== */}

      <section
        id="forest-world"
        className={`forest-world ${forestEntered ? "entered" : ""}`}
      >
        {/* SKY */}
        <div className="forest-sky">
          <div className="sky-stars">
            {stars.map((star) => (
              <i
                key={`sky-${star.id}`}
                style={{
                  left: star.left,
                  top: star.top,
                  animationDelay: star.delay,
                }}
              />
            ))}
          </div>

          <div className="sun-orbit">
            <div className="sun" style={sunStyle}>
              <span className="sun-ray ray-1" />
              <span className="sun-ray ray-2" />
              <span className="sun-ray ray-3" />
              <span className="sun-ray ray-4" />
              <span className="sun-ray ray-5" />
              <span className="sun-ray ray-6" />
            </div>
          </div>

          <div className="moon-world" />

          <div className="cloud cloud-one" />
          <div className="cloud cloud-two" />
          <div className="cloud cloud-three" />
        </div>

        {/* WEATHER */}
        {rainEnabled && (
          <div className="rain-layer">
            {rainDrops.map((drop) => (
              <span
                key={drop.id}
                style={{
                  left: drop.left,
                  animationDelay: drop.delay,
                  animationDuration: drop.duration,
                }}
              />
            ))}
          </div>
        )}

        {weather === "Snow" && (
          <div className="snow-layer">
            {Array.from({ length: 70 }, (_, index) => (
              <span
                key={index}
                style={{
                  left: `${(index * 23) % 100}%`,
                  animationDelay: `${(index % 20) * 0.2}s`,
                }}
              >
                ❄
              </span>
            ))}
          </div>
        )}

        {weather === "Fog" && <div className="fog-layer" />}

        {/* =================================================
            SIDE MENU
            ================================================= */}

        <aside className={`forest-menu ${menuOpen ? "open" : "closed"}`}>
          <button
            className="menu-close"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>

          <div className="menu-brand">
            <span>🌿</span>
            <strong>GREEN PULSE</strong>
          </div>

          <div className="menu-clock">
            <strong>
              {now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </strong>
            <small>{phase}</small>
          </div>

          <div className="menu-stat">
            <span>🌱 Green Points</span>
            <strong>{Math.floor(points)}</strong>
          </div>

          <div className="menu-stat">
            <span>🌳 Garden</span>
            <strong>{Math.floor(gardenGrowth)}%</strong>
          </div>

          <div className="menu-section">
            <button onClick={openGarden}>🌷 My Garden</button>
            <button onClick={() => setCampfire((value) => !value)}>
              🔥 Campfire
            </button>
            <button onClick={openCave}>🪨 Explore Cave</button>
          </div>

          <div className="menu-section">
            <label>Season</label>

            <div className="season-buttons">
              {SEASONS.map((item) => (
                <button
                  key={item}
                  className={season === item ? "selected" : ""}
                  onClick={() => setSeason(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-section">
            <label>Weather</label>

            <div className="weather-buttons">
              {WEATHER.map((item) => (
                <button
                  key={item}
                  className={weather === item ? "selected" : ""}
                  onClick={() => changeWeather(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            className={`sound-button ${soundEnabled ? "active" : ""}`}
            onClick={toggleSound}
          >
            {soundEnabled ? "🔊 Forest Sound ON" : "🔇 Forest Sound OFF"}
          </button>
        </aside>

        {!menuOpen && (
          <button
            className="menu-wall-button"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
        )}

        {/* =================================================
            NAV ARROWS
            ================================================= */}

        <button
          className="world-arrow world-arrow-left"
          onClick={() => scrollWorld(-1)}
          aria-label="Scroll forest left"
        >
          ‹
        </button>

        <button
          className="world-arrow world-arrow-right"
          onClick={() => scrollWorld(1)}
          aria-label="Scroll forest right"
        >
          ›
        </button>

        {/* =================================================
            HORIZONTAL WORLD
            ================================================= */}

        <div className="forest-scroll">
          <div className="forest-zone zone-1">
            <div className="distant-trees">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="forest-ground" />

            <div className="bird bird-one">🕊️</div>
            <div className="bird bird-two">🦜</div>
            <div className="butterfly butterfly-one">🦋</div>
            <div className="butterfly butterfly-two">🦋</div>

            <div className="flower-field">
              {flowers.map((flower) => (
                <span
                  key={flower.id}
                  style={{
                    "--flower-x": flower.left,
                    "--flower-y": flower.bottom,
                    "--flower-size": flower.size,
                    "--flower-delay": flower.delay,
                  }}
                >
                  {flower.symbol}
                </span>
              ))}
            </div>

            <div className="tree tree-large tree-a" />
            <div className="tree tree-large tree-b" />
            <div className="tree tree-medium tree-c" />

            <div className="nest nest-one">🪺</div>

            <CSSDeer
              fed={animalFed.deer}
              onFeed={() => feedAnimal("deer")}
            />

            <CSSRabbit onFeed={() => feedAnimal("rabbit")} />

            <div className="zone-sign">
              <span>ZONE 01</span>
              <strong>MEADOW</strong>
              <small>Feed the wildlife</small>
            </div>
          </div>

          {/* =================================================
              DOG AREA
              ================================================= */}

          <div className="forest-zone zone-2">
            <div className="forest-ground" />

            <div className="dog-area">
              <div className="dog-shadow" />

              <div className="dog-body">
                <span className="dog-head">
                  <span className="dog-ear dog-ear-left" />
                  <span className="dog-ear dog-ear-right" />
                  <span className="dog-eye" />
                  <span className="dog-nose" />
                </span>

                <span className="dog-tail">〰</span>

                <span className="dog-leg dog-leg-one" />
                <span className="dog-leg dog-leg-two" />
                <span className="dog-leg dog-leg-three" />
                <span className="dog-leg dog-leg-four" />
              </div>

              <div className="dog-name">
                <input
                  value={dogName}
                  maxLength={16}
                  onChange={(event) => setDogName(event.target.value)}
                  aria-label="Dog name"
                />

                <button onClick={feedDog}>
                  {dogFed ? "Fed ✓" : "Feed"}
                </button>
              </div>
            </div>

            <div className="pond">
              <span className="pond-ripple ripple-one" />
              <span className="pond-ripple ripple-two" />
              <span className="pond-ripple ripple-three" />
            </div>

            <div className="reeds">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="zone-sign">
              <span>ZONE 02</span>
              <strong>WOODLAND</strong>
              <small>Your companion lives here</small>
            </div>
          </div>

          {/* =================================================
              CAMEL AREA
              ================================================= */}

          <div className="forest-zone zone-3">
            <div className="desert-ground" />

            <div className="desert-rock rock-one" />
            <div className="desert-rock rock-two" />
            <div className="desert-rock rock-three" />

            {/* CAMEL IS DIRECTLY INSIDE THE ZONE.
                It is NOT tied to any scroll condition. */}
            <CSSCamel onFeed={feedCamel} />

            <div className="cactus cactus-one">
              <span />
              <span />
            </div>

            <div className="cactus cactus-two">
              <span />
              <span />
            </div>

            <div className="zone-sign">
              <span>ZONE 03</span>
              <strong>DRYLAND</strong>
              <small>The camel never disappears</small>
            </div>
          </div>

          {/* =================================================
              LION AREA
              ================================================= */}

          <div className="forest-zone zone-4">
            <div className="forest-ground" />

            <div
              className={`lion ${lionAwake ? "awake" : "sleeping"}`}
              onClick={wakeLion}
              role="button"
              tabIndex={0}
            >
              <span className="lion-mane" />
              <span className="lion-face">
                <span className="lion-eye left" />
                <span className="lion-eye right" />
                <span className="lion-muzzle" />
              </span>

              <span className="lion-body" />
              <span className="lion-tail" />

              <span className="lion-leg l1" />
              <span className="lion-leg l2" />
              <span className="lion-leg l3" />
              <span className="lion-leg l4" />

              {!lionAwake && (
                <span className="sleep-z">
                  Z
                  <small>Z</small>
                  <b>Z</b>
                </span>
              )}
            </div>

            <div className="owl">🦉</div>

            <div className="tree tree-large lion-tree" />

            <div className="zone-sign">
              <span>ZONE 04</span>
              <strong>WILD GROVE</strong>
              <small>Click the sleeping lion</small>
            </div>
          </div>

          {/* =================================================
              CAVE
              ================================================= */}

          <div className="forest-zone zone-5">
            <div className="cave-mountain">
              <div className="cave-opening">
                <div className="cave-person">
                  <span className="explorer-head" />
                  <span className="explorer-body" />
                  <span className="explorer-arm" />
                  <span className="explorer-lamp">
                    <i />
                  </span>
                </div>

                <div className="crystal crystal-a">◆</div>
                <div className="crystal crystal-b">◆</div>
                <div className="crystal crystal-c">◆</div>

                <div className="cave-bat">🦇</div>

                <button
                  className="cave-enter-button"
                  onClick={openCave}
                >
                  ENTER CAVE
                </button>
              </div>
            </div>

            <div className="cave-vines">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="zone-sign">
              <span>ZONE 05</span>
              <strong>HIDDEN CAVE</strong>
              <small>Someone is exploring inside...</small>
            </div>
          </div>

          {/* =================================================
              CAMPFIRE
              ================================================= */}

          <div className="forest-zone zone-6">
            <div className="night-clearing" />

            <div className="campfire-area">
              <div className="fire-glow" />

              <div className={`campfire ${campfire ? "lit" : ""}`}>
                <div className="logs">
                  <span />
                  <span />
                  <span />
                </div>

                {campfire && (
                  <>
                    <div className="flame flame-back" />
                    <div className="flame flame-middle" />
                    <div className="flame flame-front" />

                    <div className="ember ember-one">•</div>
                    <div className="ember ember-two">•</div>
                    <div className="ember ember-three">•</div>
                    <div className="ember ember-four">•</div>

                    <div className="smoke smoke-one" />
                    <div className="smoke smoke-two" />
                  </>
                )}
              </div>

              <button
                className="campfire-button"
                onClick={() => {
                  setCampfire((value) => !value);
                  addPoints(1, "Campfire moment");
                }}
              >
                {campfire ? "EXTINGUISH FIRE" : "LIGHT CAMPFIRE"}
              </button>
            </div>

            <div className="fireflies">
              {Array.from({ length: 20 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    left: `${(index * 31) % 92}%`,
                    top: `${15 + ((index * 19) % 70)}%`,
                    animationDelay: `${(index % 9) * 0.4}s`,
                  }}
                />
              ))}
            </div>

            <div className="zone-sign">
              <span>ZONE 06</span>
              <strong>NIGHT CLEARING</strong>
              <small>Stay a while</small>
            </div>
          </div>
        </div>

        {/* =================================================
            BOTTOM INFO
            ================================================= */}

        <div className="forest-bottom-bar">
          <div>
            <strong>{phase}</strong>
            <span>
              {now.toLocaleDateString([], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>

          <div className="bottom-hint">
            ← → Explore the forest
          </div>

          <div>
            <strong>{Math.floor(points)}</strong>
            <span>Green Points</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          CAVE OVERLAY
          ===================================================== */}

      {caveOpen && (
        <div className="overlay cave-overlay">
          <div className="cave-modal">
            <button
              className="overlay-close"
              onClick={() => setCaveOpen(false)}
            >
              ×
            </button>

            <div className="cave-modal-art">
              <div className="modal-explorer">
                🧑‍🚀
              </div>

              <div className="modal-crystal">💎</div>
              <div className="modal-bat">🦇</div>
            </div>

            <span className="modal-kicker">HIDDEN DISCOVERY</span>
            <h2>The Forest Cave</h2>

            <p>
              A small explorer has reached the deepest chamber.
              Crystal formations glow against the rock while bats
              circle above.
            </p>

            <button
              className="primary-modal-button"
              onClick={() => {
                addPoints(10, "Cave discovered");
                setCaveOpen(false);
              }}
            >
              COLLECT DISCOVERY +10
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          GARDEN OVERLAY
          ===================================================== */}

      {gardenOpen && (
        <div className="overlay garden-overlay">
          <div className="garden-modal">
            <button
              className="overlay-close"
              onClick={() => setGardenOpen(false)}
            >
              ×
            </button>

            <span className="modal-kicker">YOUR LIVING SPACE</span>
            <h2>My Garden</h2>

            <div
              className="garden-progress"
              style={{
                "--growth": `${gardenGrowth}%`,
              }}
            >
              <div className="garden-sky" />

              <div className="garden-soil" />

              <div className="garden-plants">
                {Array.from(
                  {
                    length: Math.max(
                      5,
                      Math.floor(gardenGrowth / 8)
                    ),
                  },
                  (_, index) => (
                    <span
                      key={index}
                      className="garden-flower"
                      style={{
                        left: `${7 + ((index * 17) % 88)}%`,
                        animationDelay: `${index * 0.15}s`,
                      }}
                    >
                      {["🌷", "🌼", "🌸", "🌺", "🌻"][index % 5]}
                    </span>
                  )
                )}
              </div>
            </div>

            <p>
              Your garden grows as your Green Points increase.
            </p>

            <strong>{Math.floor(gardenGrowth)}% grown</strong>
          </div>
        </div>
      )}

      {/* =====================================================
          TOAST
          ===================================================== */}

      {toast && <div className="forest-toast">{toast}</div>}

      {/* =====================================================
          FOOTER BRANDING
          ===================================================== */}

      <footer className="forest-footer">
        <span>GREEN PULSE CSEAIML</span>
        <small>Digital Green Challenge 2026</small>
      </footer>
    </main>
  );
}