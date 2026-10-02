import React, { useEffect, useRef, useState } from "react";
import "./Forest.css";

/*
  GREEN PULSE — CINEMATIC FOREST
  --------------------------------
  No local image/audio/GIF paths.
  External assets are OPTIONAL.
  If an asset fails, the forest keeps running.

  Replace/add URLs in ONLINE_ASSETS if you later want different media.
*/

const ONLINE_ASSETS = {
  forest:
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=90",

  deer:
    "https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/giphy.gif",

  bird:
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",

  ambient:
    "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2c9d2e3f52.mp3",
};

const animals = [
  {
    id: "deer",
    emoji: "🦌",
    name: "Deer",
    x: 17,
    y: 68,
    size: 72,
    delay: "0s",
    speed: "18s",
  },
  {
    id: "fox",
    emoji: "🦊",
    name: "Fox",
    x: 70,
    y: 74,
    size: 55,
    delay: "4s",
    speed: "21s",
  },
  {
    id: "wolf",
    emoji: "🐺",
    name: "Wolf",
    x: 84,
    y: 58,
    size: 68,
    delay: "8s",
    speed: "25s",
  },
  {
    id: "rabbit",
    emoji: "🐇",
    name: "Rabbit",
    x: 39,
    y: 79,
    size: 38,
    delay: "2s",
    speed: "13s",
  },
];

function SafeMedia({ src, type = "img", className = "", ...props }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) return null;

  if (type === "img") {
    return (
      <img
        src={src}
        className={className}
        onError={() => setFailed(true)}
        alt=""
        {...props}
      />
    );
  }

  return (
    <video
      src={src}
      className={className}
      onError={() => setFailed(true)}
      muted
      loop
      playsInline
      {...props}
    />
  );
}

function Fireflies() {
  const dots = Array.from({ length: 65 });

  return (
    <div className="firefly-layer">
      {dots.map((_, i) => (
        <span
          key={i}
          className="firefly"
          style={{
            "--x": `${Math.random() * 100}%`,
            "--y": `${38 + Math.random() * 54}%`,
            "--delay": `${Math.random() * 8}s`,
            "--duration": `${4 + Math.random() * 7}s`,
          }}
        />
      ))}
    </div>
  );
}

function Birds() {
  return (
    <div className="bird-layer">
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="flying-bird"
          style={{
            "--bird-delay": `${i * 2.2}s`,
            "--bird-speed": `${18 + i * 2}s`,
            "--bird-y": `${12 + (i % 4) * 8}%`,
          }}
        >
          🐦
        </span>
      ))}
    </div>
  );
}

function Forest({ onBack }) {
  const forestRef = useRef(null);
  const audioRef = useRef(null);

  const [soundOn, setSoundOn] = useState(false);
  const [time, setTime] = useState(0.32);
  const [rain, setRain] = useState(false);
  const [mist, setMist] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  /* ---------------------------------------------------------
     DAY/NIGHT CYCLE
  --------------------------------------------------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((old) => (old + 0.0007) % 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hour = Math.floor(time * 24);

  let atmosphere = "Morning";

  if (hour >= 6 && hour < 11) atmosphere = "Morning";
  else if (hour >= 11 && hour < 17) atmosphere = "Day";
  else if (hour >= 17 && hour < 20) atmosphere = "Golden Hour";
  else atmosphere = "Night";

  /* ---------------------------------------------------------
     PARALLAX
  --------------------------------------------------------- */

  useEffect(() => {
    const handleMouse = (e) => {
      if (!forestRef.current) return;

      const rect = forestRef.current.getBoundingClientRect();

      setMouse({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      });
    };

    window.addEventListener("mousemove", handleMouse);

    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  /* ---------------------------------------------------------
     AUDIO
  --------------------------------------------------------- */

  const toggleSound = async () => {
    if (!audioRef.current) return;

    try {
      if (!soundOn) {
        audioRef.current.volume = 0.32;
        await audioRef.current.play();
        setSoundOn(true);
      } else {
        audioRef.current.pause();
        setSoundOn(false);
      }
    } catch {
      /*
        Browser blocked remote audio.
        Do NOT crash the forest.
        We simply switch back to off.
      */
      setSoundOn(false);
    }
  };

  /* ---------------------------------------------------------
     FULLSCREEN
  --------------------------------------------------------- */

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await forestRef.current?.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {
      setFullscreen(false);
    }
  };

  const skyClass =
    hour >= 20 || hour < 5
      ? "night"
      : hour >= 17
      ? "sunset"
      : hour < 8
      ? "dawn"
      : "day";

  return (
    <div
      ref={forestRef}
      className={`forest-game ${skyClass} ${rain ? "rain-mode" : ""}`}
      style={{
        "--mx": `${mouse.x}px`,
        "--my": `${mouse.y}px`,
      }}
    >
      {/* =====================================================
          BACKGROUND SKY
      ===================================================== */}

      <div className="sky" />

      <div className="moon" />

      <div className="sun" />

      <div className="stars">
        {Array.from({ length: 100 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>

      {/* =====================================================
          CINEMATIC LIGHT
      ===================================================== */}

      <div className="god-rays" />

      <div className="light-haze" />

      {/* =====================================================
          DISTANT MOUNTAINS
      ===================================================== */}

      <div className="mountains mountains-far" />

      <div className="mountains mountains-mid" />

      {/* =====================================================
          FOREST BACKGROUND
      ===================================================== */}

      <div
        className="forest-photo"
        style={{
          backgroundImage: `url("${ONLINE_ASSETS.forest}")`,
          transform: `translate3d(calc(-50% + ${mouse.x * 0.35}px), ${mouse.y *
            0.2}px, 0) scale(1.08)`,
        }}
      />

      {/* =====================================================
          TREE LAYERS
      ===================================================== */}

      <div
        className="tree-layer tree-layer-back"
        style={{
          transform: `translate3d(${mouse.x * 0.8}px, ${mouse.y * 0.4}px, 0)`,
        }}
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="generated-tree"
            style={{
              left: `${i * 4.3 - 2}%`,
              transform: `scale(${0.65 + ((i * 17) % 40) / 100})`,
            }}
          >
            <div className="tree-crown" />
            <div className="tree-trunk" />
          </div>
        ))}
      </div>

      <div
        className="tree-layer tree-layer-front"
        style={{
          transform: `translate3d(${mouse.x * -1.5}px, ${mouse.y * -0.7}px, 0)`,
        }}
      >
        {Array.from({ length: 17 }).map((_, i) => (
          <div
            key={i}
            className="giant-tree"
            style={{
              left: `${i * 6.2 - 6}%`,
              "--tree-scale": `${0.85 + ((i * 31) % 55) / 100}`,
            }}
          >
            <div className="giant-crown" />
            <div className="giant-trunk" />
          </div>
        ))}
      </div>

      {/* =====================================================
          GROUND
      ===================================================== */}

      <div className="ground">

        <div className="grass-blades">
          {Array.from({ length: 180 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: `${Math.random() * 100}%`,
                height: `${10 + Math.random() * 35}px`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="forest-path" />

        <div className="ground-glow" />
      </div>

      {/* =====================================================
          ATMOSPHERE
      ===================================================== */}

      {mist && <div className="mist-layer" />}

      <Fireflies />

      <Birds />

      {/* =====================================================
          ANIMALS
      ===================================================== */}

      <div className="animals">

        {animals.map((animal) => (
          <button
            key={animal.id}
            className={`forest-animal animal-${animal.id}`}
            style={{
              left: `${animal.x}%`,
              top: `${animal.y}%`,
              "--animal-size": `${animal.size}px`,
              "--animal-delay": animal.delay,
              "--animal-speed": animal.speed,
            }}
            onClick={() => setSelectedAnimal(animal)}
            aria-label={`Meet the ${animal.name}`}
          >
            <span className="animal-shadow" />

            <span className="animal-body">
              {animal.emoji}
            </span>

            <span className="animal-name">
              {animal.name}
            </span>
          </button>
        ))}

      </div>

      {/* =====================================================
          RAIN
      ===================================================== */}

      {rain && (
        <div className="rain">
          {Array.from({ length: 180 }).map((_, i) => (
            <i
              key={i}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.45 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* =====================================================
          VIGNETTE
      ===================================================== */}

      <div className="vignette" />

      {/* =====================================================
          TOP HUD
      ===================================================== */}

      <header className="forest-hud">

        <div className="hud-brand">
          <span className="pulse-dot" />
          <div>
            <strong>GREEN PULSE</strong>
            <small>WILD FOREST</small>
          </div>
        </div>

        <div className="hud-status">
          <span>🌲</span>
          <strong>{atmosphere}</strong>
          <small>{String(hour).padStart(2, "0")}:00</small>
        </div>

        <div className="hud-actions">

          <button
            className={`hud-button ${soundOn ? "active" : ""}`}
            onClick={toggleSound}
            title="Forest sound"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>

          <button
            className={`hud-button ${mist ? "active" : ""}`}
            onClick={() => setMist((v) => !v)}
            title="Mist"
          >
            🌫️
          </button>

          <button
            className={`hud-button ${rain ? "active" : ""}`}
            onClick={() => setRain((v) => !v)}
            title="Rain"
          >
            🌧️
          </button>

          <button
            className="hud-button"
            onClick={toggleFullscreen}
            title="Fullscreen"
          >
            {fullscreen ? "↙" : "⛶"}
          </button>

          {onBack && (
            <button className="hud-back" onClick={onBack}>
              ← Back
            </button>
          )}

        </div>

      </header>

      {/* =====================================================
          CENTER MESSAGE
      ===================================================== */}

      <section className="forest-title">

        <span className="eyebrow">
          DIGITAL WILDERNESS • GREEN PULSE
        </span>

        <h1>
          Enter the
          <span> Wild.</span>
        </h1>

        <p>
          Explore a living forest. Watch. Listen. Interact.
        </p>

        <div className="explore-hint">
          <span className="mouse-icon">⌁</span>
          Move your cursor through the forest
        </div>

      </section>

      {/* =====================================================
          BOTTOM HUD
      ===================================================== */}

      <div className="bottom-hud">

        <div className="eco-card">
          <span className="eco-icon">🌎</span>

          <div>
            <small>ECOSYSTEM</small>
            <strong>ALIVE</strong>
          </div>
        </div>

        <div className="species-card">
          <small>DISCOVER</small>
          <strong>{animals.length} SPECIES</strong>
        </div>

        <div className="sound-card">
          <span className={`sound-bars ${soundOn ? "playing" : ""}`}>
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>

          <div>
            <small>FOREST AUDIO</small>
            <strong>{soundOn ? "PLAYING" : "OFF"}</strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          ANIMAL INFORMATION
      ===================================================== */}

      {selectedAnimal && (
        <div
          className="animal-modal-backdrop"
          onClick={() => setSelectedAnimal(null)}
        >
          <div
            className="animal-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedAnimal(null)}
            >
              ×
            </button>

            <div className="modal-animal">
              {selectedAnimal.emoji}
            </div>

            <span>FOREST SPECIES</span>

            <h2>{selectedAnimal.name}</h2>

            <p>
              A resident of the Green Pulse digital wilderness.
              Keep exploring to discover more life.
            </p>

            <button
              className="modal-button"
              onClick={() => setSelectedAnimal(null)}
            >
              Continue Exploring
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          AUDIO
      ===================================================== */}

      <audio
        ref={audioRef}
        src={ONLINE_ASSETS.ambient}
        loop
        preload="none"
        onError={() => setSoundOn(false)}
      />

      {/* =====================================================
          ONLINE MEDIA — OPTIONAL / NON-BLOCKING
      ===================================================== */}

      <SafeMedia
        src={ONLINE_ASSETS.deer}
        type="img"
        className="hidden-online-asset"
      />

      <SafeMedia
        src={ONLINE_ASSETS.bird}
        type="img"
        className="hidden-online-asset"
      />

    </div>
  );
}

export default Forest;