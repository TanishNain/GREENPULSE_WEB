import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

const getTimePhase = () => {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "noon";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
};

const phaseText = {
  dawn: "Dawn",
  morning: "Morning",
  noon: "Noon",
  evening: "Evening",
  night: "Night",
};

const weatherTypes = ["Clear", "Cloudy", "Rain", "Fog"];

function Fireflies({ count = 45 }) {
  const flies = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${4 + Math.random() * 92}%`,
        top: `${35 + Math.random() * 55}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${3 + Math.random() * 5}s`,
        size: `${2 + Math.random() * 3}px`,
      })),
    [count]
  );

  return (
    <div className="fireflies" aria-hidden="true">
      {flies.map((fly) => (
        <span
          key={fly.id}
          className="firefly"
          style={{
            left: fly.left,
            top: fly.top,
            width: fly.size,
            height: fly.size,
            animationDelay: fly.delay,
            animationDuration: fly.duration,
          }}
        />
      ))}
    </div>
  );
}

function Birds() {
  return (
    <div className="birds" aria-hidden="true">
      <span className="bird bird-one" />
      <span className="bird bird-two" />
      <span className="bird bird-three" />
    </div>
  );
}

function Deer({ className = "" }) {
  return (
    <div className={`deer ${className}`} aria-hidden="true">
      <div className="deer-body" />
      <div className="deer-neck" />
      <div className="deer-head">
        <span className="deer-ear deer-ear-left" />
        <span className="deer-ear deer-ear-right" />
      </div>
      <span className="deer-leg deer-leg-1" />
      <span className="deer-leg deer-leg-2" />
      <span className="deer-leg deer-leg-3" />
      <span className="deer-leg deer-leg-4" />
      <span className="deer-tail" />
    </div>
  );
}

function Rain() {
  return (
    <div className="rain-layer" aria-hidden="true">
      {Array.from({ length: 90 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 1.8}s`,
            animationDuration: `${0.55 + Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

function AmbientSound({ phase, enabled }) {
  const audioContextRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    if (!enabled) {
      nodesRef.current.forEach((node) => {
        try {
          node.stop?.();
        } catch {}
        try {
          node.disconnect?.();
        } catch {}
      });

      nodesRef.current = [];

      try {
        audioContextRef.current?.close();
      } catch {}

      audioContextRef.current = null;
      return;
    }

    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.035;
    master.connect(ctx.destination);

    /*
      These are deliberately subtle procedural ambience layers:
      wind + night insects + occasional animal-like tones.
      Browser audio requires a user interaction, hence the sound button.
    */

    const createWind = () => {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.18;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;

      const gain = ctx.createGain();
      gain.gain.value = 0.22;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      source.start();
      nodesRef.current.push(source);
    };

    const createTone = (frequency, duration, delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(
        0.08,
        ctx.currentTime + delay + 0.08
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + duration
      );

      osc.connect(gain);
      gain.connect(master);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.1);

      nodesRef.current.push(osc);
    };

    createWind();

    if (phase === "night") {
      createTone(1750, 0.35, 1.5);
      createTone(2200, 0.25, 3.1);
      createTone(1650, 0.4, 5.2);
    } else if (phase === "dawn") {
      createTone(950, 0.7, 1.2);
      createTone(1150, 0.55, 2.6);
      createTone(1300, 0.45, 4);
    } else if (phase === "morning") {
      createTone(1200, 0.35, 1.1);
      createTone(1450, 0.4, 2.7);
    } else if (phase === "evening") {
      createTone(800, 0.55, 1.5);
      createTone(1050, 0.5, 3.5);
    }

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    return () => {
      nodesRef.current.forEach((node) => {
        try {
          node.stop?.();
        } catch {}
        try {
          node.disconnect?.();
        } catch {}
      });

      nodesRef.current = [];

      try {
        ctx.close();
      } catch {}

      audioContextRef.current = null;
    };
  }, [phase, enabled]);

  return null;
}

export default function Forest() {
  const [phase, setPhase] = useState(getTimePhase());
  const [weather, setWeather] = useState("Clear");
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [showAnimals, setShowAnimals] = useState(true);
  const [showMist, setShowMist] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(getTimePhase());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const isNight = phase === "night";
  const isEvening = phase === "evening";
  const isMorning = phase === "morning" || phase === "dawn";
  const isRain = weather === "Rain";
  const isFog = weather === "Fog";

  const updateWeather = () => {
    const next = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    setWeather(next);
  };

  return (
    <div
      className={[
        "forest-app",
        `phase-${phase}`,
        `weather-${weather.toLowerCase()}`,
      ].join(" ")}
    >
      <AmbientSound phase={phase} enabled={soundOn} />

      {/* Compact menu button */}
      <button
        className={`forest-menu-toggle ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Open forest menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* Hidden until menu button is clicked */}
      <aside className={`forest-sidebar ${menuOpen ? "visible" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-leaf">🌿</div>
          <div>
            <strong>GREEN PULSE</strong>
            <small>FOREST</small>
          </div>
        </div>

        <div className="sidebar-section">
          <small>EXPLORE</small>

          <button
            className="menu-link"
            onClick={() => window.history.back()}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button className="menu-link active">
            <span>🌲</span>
            Forest
          </button>

          <button className="menu-link">
            <span>🌍</span>
            Earth
          </button>

          <button className="menu-link">
            <span>📊</span>
            Progress
          </button>
        </div>

        <div className="sidebar-section controls">
          <small>FOREST</small>

          <button
            className={`menu-link ${soundOn ? "enabled" : ""}`}
            onClick={() => setSoundOn((v) => !v)}
          >
            <span>{soundOn ? "🔊" : "🔇"}</span>
            Forest sounds
          </button>

          <button
            className={`menu-link ${showAnimals ? "enabled" : ""}`}
            onClick={() => setShowAnimals((v) => !v)}
          >
            <span>🦌</span>
            Wildlife
          </button>

          <button
            className={`menu-link ${showMist ? "enabled" : ""}`}
            onClick={() => setShowMist((v) => !v)}
          >
            <span>〰</span>
            Atmosphere
          </button>

          <button className="menu-link" onClick={updateWeather}>
            <span>☁</span>
            Change weather
          </button>
        </div>

        <div className="sidebar-time">
          <span>LOCAL TIME</span>
          <strong>
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
          <em>{phaseText[phase]}</em>
        </div>
      </aside>

      <header className="forest-header">
        <div>
          <div className="forest-kicker">GREEN PULSE • DIGITAL FOREST</div>
          <h1>The Living Forest</h1>
          <p>
            {phase === "night"
              ? "The forest has gone quiet. Look closely."
              : phase === "evening"
              ? "The last sunlight is moving through the trees."
              : phase === "dawn"
              ? "The forest is waking up."
              : "A living forest, changing with the day."}
          </p>
        </div>

        <div className="forest-status">
          <span className="status-dot" />
          <div>
            <strong>{phaseText[phase]}</strong>
            <small>{weather}</small>
          </div>
        </div>
      </header>

      <main className="forest-scene">
        {/* Sky */}
        <div className="forest-sky">
          <div className="sky-stars" />
          <div className="moon" />
          <div className="sun-glow" />
          <div className="sun" />
          <div className="sun-rays" />

          <div className="cloud cloud-a" />
          <div className="cloud cloud-b" />
          <div className="cloud cloud-c" />
        </div>

        {/* Far mountains */}
        <div className="mountains mountains-far" />
        <div className="mountains mountains-mid" />

        {/* Forest depth */}
        <div className="tree-line tree-line-far">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="tree-line tree-line-mid">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        {/* Main trees */}
        <div className="forest-tree tree-a">
          <div className="trunk" />
          <div className="crown crown-a" />
          <div className="crown crown-b" />
          <div className="crown crown-c" />
        </div>

        <div className="forest-tree tree-b">
          <div className="trunk" />
          <div className="crown crown-a" />
          <div className="crown crown-b" />
          <div className="crown crown-c" />
        </div>

        <div className="forest-tree tree-c">
          <div className="trunk" />
          <div className="crown crown-a" />
          <div className="crown crown-b" />
          <div className="crown crown-c" />
        </div>

        <div className="forest-tree tree-d">
          <div className="trunk" />
          <div className="crown crown-a" />
          <div className="crown crown-b" />
          <div className="crown crown-c" />
        </div>

        {/* Birds in daylight */}
        {!isNight && <Birds />}

        {/* Wildlife */}
        {showAnimals && (
          <div className="wildlife">
            <Deer className="deer-left" />
            <Deer className="deer-right" />
          </div>
        )}

        {/* Water */}
        <div className="stream">
          <div className="water-reflection" />
          <div className="water-ripple ripple-a" />
          <div className="water-ripple ripple-b" />
          <div className="water-ripple ripple-c" />
        </div>

        {/* Ground */}
        <div className="forest-ground">
          <div className="fern fern-a" />
          <div className="fern fern-b" />
          <div className="fern fern-c" />

          <div className="grass grass-a" />
          <div className="grass grass-b" />
          <div className="grass grass-c" />

          <div className="rock rock-a" />
          <div className="rock rock-b" />
          <div className="rock rock-c" />
        </div>

        {/* Atmospheric mist */}
        {showMist && (
          <>
            <div className="mist mist-one" />
            <div className="mist mist-two" />
            <div className="mist mist-three" />
          </>
        )}

        {/* Fireflies only after sunset */}
        {isNight && <Fireflies count={65} />}

        {/* Rain */}
        {isRain && <Rain />}

        {/* Fog */}
        {isFog && <div className="heavy-fog" />}

        {/* Foreground cinematic shadow */}
        <div className="foreground-vignette" />

        <div className="scene-caption">
          <span>●</span>
          {phase === "night"
            ? "Night wildlife is active"
            : isEvening
            ? "Golden hour"
            : isMorning
            ? "Morning light"
            : "Daylight forest"}
        </div>
      </main>

      <footer className="forest-footer">
        <span>🌿 GREEN PULSE</span>
        <span>Forest environment changes automatically with system time</span>
        <button onClick={() => setSoundOn((v) => !v)}>
          {soundOn ? "Sound ON" : "Enable forest sounds"}
        </button>
      </footer>
    </div>
  );
}