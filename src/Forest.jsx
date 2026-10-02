import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

/*
  ============================================================
  GREEN PULSE — FOREST EXPERIENCE
  ============================================================

  Self-contained:
  - No external images
  - No external videos
  - No external audio files
  - CSS animated environment
  - Web Audio forest ambience
  - Time-based sun
  - Golden hour
  - Scrollable zones
  - Keyboard arrows
  - LocalStorage progress
  - Garden / flowers
  - Campfire
  - Cave
  - Animals
  ============================================================
*/

const STORAGE_KEY = "greenpulse_forest_v2";

const ZONES = [
  {
    id: "gate",
    title: "Forest Gate",
    subtitle: "The beginning",
    description: "Step beyond the gate and enter your living forest.",
  },
  {
    id: "deep",
    title: "Deep Forest",
    subtitle: "Quiet paths",
    description: "Tall trees, birds, butterflies and hidden life.",
  },
  {
    id: "meadow",
    title: "River Meadow",
    subtitle: "Open wild",
    description: "A peaceful meadow beside a flowing river.",
  },
  {
    id: "cave",
    title: "Moon Cave",
    subtitle: "Hidden place",
    description: "Something ancient sleeps beneath the forest.",
  },
  {
    id: "garden",
    title: "Your Garden",
    subtitle: "Grows with you",
    description: "Your green points help your garden bloom.",
  },
  {
    id: "fire",
    title: "Campfire",
    subtitle: "Slow down",
    description: "Sit beside the fire and take a quiet moment.",
  },
];

const DEFAULT_DATA = {
  points: 0,
  flowers: 6,
  trees: 3,
  dogName: "Milo",
  fedToday: false,
  campfires: 0,
  caveVisits: 0,
  entered: false,
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_DATA;
    }

    return {
      ...DEFAULT_DATA,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // LocalStorage may be disabled in some browsers.
  }
}

function getCurrentTime() {
  const now = new Date();

  return {
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    total:
      now.getHours() * 60 +
      now.getMinutes() +
      now.getSeconds() / 60,
  };
}

function getPhase(totalMinutes) {
  if (totalMinutes >= 300 && totalMinutes < 420) {
    return "dawn";
  }

  if (totalMinutes >= 420 && totalMinutes < 600) {
    return "morning";
  }

  if (totalMinutes >= 600 && totalMinutes < 900) {
    return "day";
  }

  if (totalMinutes >= 900 && totalMinutes < 1080) {
    return "golden";
  }

  if (totalMinutes >= 1080 && totalMinutes < 1260) {
    return "dusk";
  }

  return "night";
}

function getSunPosition(totalMinutes) {
  const sunrise = 360;
  const sunset = 1080;

  if (totalMinutes < sunrise) {
    return {
      visible: false,
      left: 8,
      top: 82,
    };
  }

  if (totalMinutes > sunset) {
    return {
      visible: false,
      left: 92,
      top: 82,
    };
  }

  const progress =
    (totalMinutes - sunrise) /
    (sunset - sunrise);

  const x = 8 + progress * 84;

  const y =
    78 -
    Math.sin(progress * Math.PI) * 63;

  return {
    visible: true,
    left: x,
    top: y,
  };
}

function formatClock(hours, minutes) {
  const h = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";

  return `${h}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function ForestFlower({ index, grown }) {
  const positions = [
    [4, 12, 20],
    [10, 27, 25],
    [18, 8, 18],
    [27, 35, 24],
    [37, 16, 22],
    [46, 30, 19],
    [56, 10, 25],
    [65, 34, 20],
    [73, 18, 23],
    [83, 30, 21],
    [91, 12, 18],
    [97, 35, 24],
  ];

  const [x, y, size] =
    positions[index % positions.length];

  return (
    <span
      className={`forest-flower ${grown ? "grown" : ""}`}
      style={{
        "--flower-x": `${x}%`,
        "--flower-y": `${y}px`,
        "--flower-size": `${size}px`,
        "--flower-delay": `${index * 0.13}s`,
      }}
    >
      <i className="flower-stem" />
      <i className="flower-head">
        <b />
        <b />
        <b />
        <b />
        <b />
      </i>
    </span>
  );
}

function CSSBird({ index = 0 }) {
  return (
    <span
      className="css-bird"
      style={{
        "--bird-delay": `${index * 2.1}s`,
        "--bird-y": `${15 + index * 9}%`,
        "--bird-duration": `${16 + index * 2}s`,
      }}
    >
      <i />
      <i />
    </span>
  );
}

function CSSButterfly({ index = 0 }) {
  return (
    <span
      className="css-butterfly"
      style={{
        "--butterfly-delay": `${index * 1.7}s`,
        "--butterfly-y": `${35 + index * 7}%`,
        "--butterfly-duration": `${10 + index}s`,
      }}
    >
      <i />
      <i />
      <b />
    </span>
  );
}

function CSSFirefly({ index = 0 }) {
  return (
    <span
      className="firefly"
      style={{
        "--firefly-x": `${8 + ((index * 17) % 86)}%`,
        "--firefly-y": `${20 + ((index * 23) % 60)}%`,
        "--firefly-delay": `${index * 0.4}s`,
      }}
    />
  );
}

function Tree({ index, depth = 1 }) {
  const left = `${(index * 13 + depth * 7) % 100}%`;
  const scale = 0.72 + ((index * 17) % 40) / 100;

  return (
    <div
      className={`css-tree depth-${depth}`}
      style={{
        left,
        "--tree-scale": scale,
        "--tree-delay": `${index * 0.15}s`,
      }}
    >
      <div className="tree-trunk" />
      <div className="tree-crown crown-a" />
      <div className="tree-crown crown-b" />
      <div className="tree-crown crown-c" />
      <div className="tree-crown crown-d" />
    </div>
  );
}

function Grass({ count = 28 }) {
  return (
    <div className="grass-field">
      {Array.from({ length: count }).map((_, index) => (
        <i
          key={index}
          className="grass-blade"
          style={{
            left: `${(index * 29) % 100}%`,
            "--grass-delay": `${(index % 7) * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function CSSDeer() {
  return (
    <button
      type="button"
      className="animal animal-deer"
      aria-label="Deer"
      onClick={(e) => e.currentTarget.classList.toggle("alert")}
    >
      <span className="deer-body" />
      <span className="deer-neck" />
      <span className="deer-head" />
      <span className="deer-ear ear-one" />
      <span className="deer-ear ear-two" />
      <span className="deer-leg leg-one" />
      <span className="deer-leg leg-two" />
      <span className="deer-leg leg-three" />
      <span className="deer-leg leg-four" />
      <span className="deer-tail" />
    </button>
  );
}

function CSSRabbit() {
  return (
    <button
      type="button"
      className="animal animal-rabbit"
      aria-label="Rabbit"
    >
      <span className="rabbit-body" />
      <span className="rabbit-head" />
      <span className="rabbit-ear ear-one" />
      <span className="rabbit-ear ear-two" />
      <span className="rabbit-tail" />
    </button>
  );
}

function CSSDog({ name, fedToday, onFeed }) {
  return (
    <div className="pet-card">
      <div className={`css-dog ${fedToday ? "happy" : ""}`}>
        <span className="dog-body" />
        <span className="dog-head" />
        <span className="dog-ear dog-ear-left" />
        <span className="dog-ear dog-ear-right" />
        <span className="dog-eye" />
        <span className="dog-nose" />
        <span className="dog-leg dog-leg-a" />
        <span className="dog-leg dog-leg-b" />
        <span className="dog-tail" />
      </div>

      <div className="pet-info">
        <span className="eyebrow">YOUR COMPANION</span>
        <strong>{name}</strong>
        <small>
          {fedToday
            ? "Already fed today"
            : "Your friend is waiting"}
        </small>

        <button
          type="button"
          className="feed-button"
          disabled={fedToday}
          onClick={onFeed}
        >
          {fedToday ? "FED TODAY" : "FEED"}
        </button>
      </div>
    </div>
  );
}

function CSSLion({ awake, onWake }) {
  return (
    <button
      type="button"
      className={`sleeping-lion ${awake ? "awake" : ""}`}
      onClick={onWake}
      aria-label="Sleeping lion"
    >
      <span className="lion-body" />
      <span className="lion-head" />
      <span className="lion-mane" />
      <span className="lion-ear lion-ear-a" />
      <span className="lion-ear lion-ear-b" />
      <span className="lion-eye lion-eye-a" />
      <span className="lion-eye lion-eye-b" />
      <span className="lion-nose" />
      <span className="lion-tail" />
    </button>
  );
}

function AudioEngine({ enabled }) {
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    const engine = audioRef.current;

    if (!engine) return;

    try {
      engine.nodes.forEach((node) => {
        try {
          node.stop?.();
        } catch {}
      });

      engine.master?.disconnect();
      engine.context?.close();
    } catch {}

    audioRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (audioRef.current) return;

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return;

    const context = new AudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    const master = context.createGain();
    master.gain.value = 0.055;
    master.connect(context.destination);

    const nodes = [];

    const createAmbient = (
      frequency,
      type,
      volume,
      detune = 0
    ) => {
      const oscillator =
        context.createOscillator();

      const gain =
        context.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;

      gain.gain.value = volume;

      oscillator.connect(gain);
      gain.connect(master);

      oscillator.start();

      nodes.push(oscillator);

      return {
        oscillator,
        gain,
      };
    };

    createAmbient(72, "sine", 0.35);
    createAmbient(104, "sine", 0.08, 4);
    createAmbient(143, "triangle", 0.025, -3);

    const noiseBuffer =
      context.createBuffer(
        1,
        context.sampleRate * 2,
        context.sampleRate
      );

    const noiseData =
      noiseBuffer.getChannelData(0);

    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] =
        (Math.random() * 2 - 1) * 0.35;
    }

    const noise =
      context.createBufferSource();

    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter =
      context.createBiquadFilter();

    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 1800;

    const noiseGain =
      context.createGain();

    noiseGain.gain.value = 0.055;

    noise
      .connect(noiseFilter)
      .connect(noiseGain)
      .connect(master);

    noise.start();

    nodes.push(noise);

    const chirp = () => {
      if (!audioRef.current) return;

      const now = context.currentTime;

      const oscillator =
        context.createOscillator();

      const gain =
        context.createGain();

      const filter =
        context.createBiquadFilter();

      oscillator.type = "sine";

      const startFrequency =
        2200 + Math.random() * 1100;

      const endFrequency =
        3200 + Math.random() * 1800;

      oscillator.frequency.setValueAtTime(
        startFrequency,
        now
      );

      oscillator.frequency.exponentialRampToValueAtTime(
        endFrequency,
        now + 0.09
      );

      oscillator.frequency.exponentialRampToValueAtTime(
        startFrequency * 0.8,
        now + 0.22
      );

      filter.type = "bandpass";
      filter.frequency.value = 2600;
      filter.Q.value = 5;

      gain.gain.setValueAtTime(0.0001, now);

      gain.gain.exponentialRampToValueAtTime(
        0.16,
        now + 0.025
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.27
      );

      oscillator
        .connect(filter)
        .connect(gain)
        .connect(master);

      oscillator.start(now);
      oscillator.stop(now + 0.3);

      window.setTimeout(
        chirp,
        1800 + Math.random() * 6500
      );
    };

    window.setTimeout(chirp, 700);

    audioRef.current = {
      context,
      master,
      nodes,
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [enabled, start, stop]);

  return null;
}

export default function Forest() {
  const [data, setData] = useState(loadData);
  const [zoneIndex, setZoneIndex] = useState(0);
  const [entered, setEntered] = useState(
    loadData().entered
  );
  const [menuOpen, setMenuOpen] = useState(true);
  const [campfire, setCampfire] = useState(false);
  const [sound, setSound] = useState(false);
  const [lionAwake, setLionAwake] = useState(false);
  const [caveOpen, setCaveOpen] = useState(false);
  const [dogEditing, setDogEditing] = useState(false);
  const [dogNameInput, setDogNameInput] =
    useState(data.dogName);
  const [clock, setClock] = useState(
    getCurrentTime
  );
  const [toast, setToast] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const worldRef = useRef(null);
  const toastTimer = useRef(null);

  const zone = ZONES[zoneIndex];

  const phase = getPhase(clock.total);
  const sun = getSunPosition(clock.total);

  const displayFlowers = Math.min(
    12,
    Math.max(4, data.flowers)
  );

  const pointsLevel = useMemo(() => {
    if (data.points >= 500) return "EARTH GUARDIAN";
    if (data.points >= 250) return "CLIMATE CHAMPION";
    if (data.points >= 100) return "GREEN EXPLORER";
    return "ECO STARTER";
  }, [data.points]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "ArrowRight") {
        nextZone();
      }

      if (event.key === "ArrowLeft") {
        previousZone();
      }

      if (event.key === "Escape") {
        setCaveOpen(false);
        setShowHelp(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  });

  useEffect(() => {
    if (!toast) return;

    toastTimer.current =
      window.setTimeout(() => {
        setToast("");
      }, 2400);

    return () =>
      window.clearTimeout(
        toastTimer.current
      );
  }, [toast]);

  const announce = (message) => {
    setToast(message);
  };

  const scrollWorld = (direction) => {
    if (!worldRef.current) return;

    worldRef.current.scrollBy({
      left: direction * 650,
      behavior: "smooth",
    });
  };

  const goToZone = (index) => {
    const safeIndex =
      (index + ZONES.length) %
      ZONES.length;

    setZoneIndex(safeIndex);

    const target =
      document.getElementById(
        `forest-zone-${safeIndex}`
      );

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const nextZone = () => {
    goToZone(zoneIndex + 1);
  };

  const previousZone = () => {
    goToZone(zoneIndex - 1);
  };

  const enterForest = () => {
    setEntered(true);

    setData((previous) => ({
      ...previous,
      entered: true,
      points: previous.points + 2,
    }));

    announce("+2 Green Points — Forest entered");

    window.setTimeout(() => {
      document
        .getElementById("forest-world")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 150);
  };

  const feedDog = () => {
    if (data.fedToday) return;

    setData((previous) => ({
      ...previous,
      fedToday: true,
      points: previous.points + 5,
    }));

    announce("+5 Green Points — " + data.dogName + " was fed");
  };

  const saveDogName = () => {
    const clean =
      dogNameInput.trim().slice(0, 18);

    if (!clean) return;

    setData((previous) => ({
      ...previous,
      dogName: clean,
    }));

    setDogEditing(false);
    announce("Companion name updated");
  };

  const collectGarden = () => {
    setData((previous) => ({
      ...previous,
      points: previous.points + 3,
      flowers: Math.min(
        12,
        previous.flowers + 1
      ),
    }));

    announce(
      "+3 Green Points — Your garden grew"
    );
  };

  const visitCave = () => {
    setCaveOpen(true);

    setData((previous) => ({
      ...previous,
      points: previous.points + 4,
      caveVisits: previous.caveVisits + 1,
    }));

    announce(
      "+4 Green Points — Cave discovered"
    );
  };

  const lightCampfire = () => {
    setCampfire((previous) => !previous);

    if (!campfire) {
      setData((previous) => ({
        ...previous,
        points: previous.points + 1,
        campfires: previous.campfires + 1,
      }));

      announce(
        "Campfire lit — breathe and slow down"
      );
    }
  };

  const resetForest = () => {
    const fresh = {
      ...DEFAULT_DATA,
      entered: true,
    };

    setData(fresh);
    setDogNameInput(fresh.dogName);
    setCampfire(false);
    setLionAwake(false);
    announce("Forest progress reset");
  };

  const skyClass = [
    "forest-experience",
    `phase-${phase}`,
    `zone-${zone.id}`,
    entered ? "is-entered" : "not-entered",
    campfire ? "campfire-on" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={skyClass}>
      <AudioEngine enabled={sound} />

      <div className="forest-noise" />
      <div className="forest-vignette" />

      {/* ======================================================
          INTRO
          ====================================================== */}

      {!entered && (
        <section className="forest-intro">
          <div className="intro-sky" />

          <div className="intro-content">
            <div className="intro-mark">
              <span className="pulse-ring" />
              <span className="pulse-leaf">✦</span>
            </div>

            <span className="intro-kicker">
              GREEN PULSE
            </span>

            <h1>
              YOUR FOREST
            </h1>

            <p>
              A quiet digital world that grows
              with your green actions.
            </p>

            <button
              type="button"
              className="enter-button"
              onClick={enterForest}
            >
              <span>ENTER FOREST</span>
              <b>→</b>
            </button>

            <div className="intro-hint">
              <span>↑</span>
              <span>Use Arrow Keys</span>
              <span>•</span>
              <span>Explore every zone</span>
            </div>
          </div>

          <div className="intro-trees">
            <div className="intro-tree intro-tree-a" />
            <div className="intro-tree intro-tree-b" />
            <div className="intro-tree intro-tree-c" />
            <div className="intro-tree intro-tree-d" />
          </div>
        </section>
      )}

      {/* ======================================================
          TOP HUD
          ====================================================== */}

      {entered && (
        <>
          <header className="forest-hud">
            <div className="hud-time">
              <span className="hud-phase">
                {phase.toUpperCase()}
              </span>

              <strong>
                {formatClock(
                  clock.hours,
                  clock.minutes
                )}
              </strong>
            </div>

            <div className="hud-zone">
              <span>
                {String(zoneIndex + 1).padStart(
                  2,
                  "0"
                )}
              </span>

              <div>
                <b>{zone.title}</b>
                <small>
                  {zone.subtitle}
                </small>
              </div>
            </div>

            <div className="hud-points">
              <span className="point-icon">
                +
              </span>

              <div>
                <strong>{data.points}</strong>
                <small>GREEN POINTS</small>
              </div>
            </div>
          </header>

          {/* ==================================================
              LEFT MENU
              ================================================== */}

          <aside
            className={`forest-sidebar ${
              menuOpen ? "open" : "closed"
            }`}
          >
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() =>
                setMenuOpen(
                  (previous) => !previous
                )
              }
              aria-label="Toggle forest menu"
            >
              {menuOpen ? "‹" : "›"}
            </button>

            {menuOpen && (
              <div className="sidebar-inner">
                <div className="sidebar-brand">
                  <span className="brand-dot" />
                  <div>
                    <b>FOREST</b>
                    <small>LIVE WORLD</small>
                  </div>
                </div>

                <div className="sidebar-line" />

                <span className="menu-label">
                  EXPLORE
                </span>

                <nav className="zone-menu">
                  {ZONES.map(
                    (item, index) => (
                      <button
                        type="button"
                        key={item.id}
                        className={
                          zoneIndex === index
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          goToZone(index)
                        }
                      >
                        <span className="zone-number">
                          0{index + 1}
                        </span>

                        <span className="zone-copy">
                          <b>{item.title}</b>
                          <small>
                            {item.subtitle}
                          </small>
                        </span>

                        <i>→</i>
                      </button>
                    )
                  )}
                </nav>

                <div className="sidebar-line" />

                <div className="sidebar-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setSound(
                        (previous) =>
                          !previous
                      )
                    }
                    className={
                      sound ? "selected" : ""
                    }
                  >
                    <span>
                      {sound ? "◉" : "○"}
                    </span>
                    FOREST SOUND
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowHelp(true)
                    }
                  >
                    <span>?</span>
                    HOW TO EXPLORE
                  </button>
                </div>

                <div className="sidebar-footer">
                  <span>{pointsLevel}</span>
                  <small>
                    Keep growing your forest.
                  </small>
                </div>
              </div>
            )}
          </aside>

          {/* ==================================================
              WORLD NAVIGATION
              ================================================== */}

          <div className="world-controls">
            <button
              type="button"
              onClick={previousZone}
              aria-label="Previous forest zone"
            >
              ←
            </button>

            <div className="world-progress">
              {ZONES.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  className={
                    index === zoneIndex
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    goToZone(index)
                  }
                  aria-label={`Go to zone ${
                    index + 1
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextZone}
              aria-label="Next forest zone"
            >
              →
            </button>
          </div>

          {/* ==================================================
              WORLD
              ================================================== */}

          <section
            id="forest-world"
            className="forest-world"
            ref={worldRef}
          >
            {/* ==================================================
                ZONE 1 — GATE
                ================================================== */}

            <article
              id="forest-zone-0"
              className="forest-zone zone-gate"
            >
              <div className="sky">
                <div className="sun-track">
                  {sun.visible && (
                    <div
                      className="sun"
                      style={{
                        left: `${sun.left}%`,
                        top: `${sun.top}%`,
                      }}
                    >
                      <span />
                    </div>
                  )}
                </div>

                <div className="cloud cloud-one" />
                <div className="cloud cloud-two" />
                <div className="cloud cloud-three" />

                <div className="sky-stars">
                  {Array.from({
                    length: 34,
                  }).map((_, index) => (
                    <i
                      key={index}
                      style={{
                        left: `${
                          (index * 19) %
                          100
                        }%`,
                        top: `${
                          7 +
                          ((index * 13) %
                            45)
                        }%`,
                        "--star-delay": `${
                          index * 0.17
                        }s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="mountain mountain-back" />
              <div className="mountain mountain-mid" />
              <div className="mountain mountain-front" />

              <div className="far-forest">
                {Array.from({
                  length: 18,
                }).map((_, index) => (
                  <Tree
                    key={index}
                    index={index}
                    depth={1}
                  />
                ))}
              </div>

              <div className="gate-road">
                <div className="road-mark road-mark-a" />
                <div className="road-mark road-mark-b" />
                <div className="road-mark road-mark-c" />
              </div>

              <div className="forest-gate">
                <div className="gate-post gate-left" />
                <div className="gate-post gate-right" />
                <div className="gate-top" />
                <div className="gate-sign">
                  <span>THE FOREST</span>
                </div>
              </div>

              <div className="zone-title">
                <span>01 / 06</span>
                <h2>Forest Gate</h2>
                <p>
                  The world begins here.
                </p>
              </div>

              <div className="scroll-prompt">
                <span>SCROLL / ARROWS</span>
                <i />
              </div>
            </article>

            {/* ==================================================
                ZONE 2 — DEEP FOREST
                ================================================== */}

            <article
              id="forest-zone-1"
              className="forest-zone zone-deep"
            >
              <div className="deep-haze" />

              <div className="deep-back-trees">
                {Array.from({
                  length: 14,
                }).map((_, index) => (
                  <Tree
                    key={index}
                    index={index}
                    depth={1}
                  />
                ))}
              </div>

              <div className="deep-mid-trees">
                {Array.from({
                  length: 12,
                }).map((_, index) => (
                  <Tree
                    key={index}
                    index={index + 4}
                    depth={2}
                  />
                ))}
              </div>

              <div className="deep-front-trees">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <Tree
                    key={index}
                    index={index + 8}
                    depth={3}
                  />
                ))}
              </div>

              <div className="forest-path">
                <span />
                <span />
                <span />
                <span />
              </div>

              <Grass count={38} />

              <div className="deep-flowers">
                {Array.from({
                  length: 18,
                }).map((_, index) => (
                  <ForestFlower
                    key={index}
                    index={index}
                    grown={
                      data.points >= 20
                    }
                  />
                ))}
              </div>

              <div className="bird-layer">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <CSSBird
                    key={index}
                    index={index}
                  />
                ))}
              </div>

              <div className="butterfly-layer">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <CSSButterfly
                    key={index}
                    index={index}
                  />
                ))}
              </div>

              <div className="forest-deer-wrap">
                <CSSDeer />
              </div>

              <div className="forest-rabbit-wrap">
                <CSSRabbit />
              </div>

              <div className="lion-den">
                <CSSLion
                  awake={lionAwake}
                  onWake={() => {
                    setLionAwake(
                      (previous) =>
                        !previous
                    );

                    announce(
                      lionAwake
                        ? "The lion rests again."
                        : "The lion woke up."
                    );
                  }}
                />

                <span className="den-label">
                  {lionAwake
                    ? "AWAKE"
                    : "SLEEPING"}
                </span>
              </div>

              <div className="zone-title dark">
                <span>02 / 06</span>
                <h2>Deep Forest</h2>
                <p>
                  Listen. Something is always
                  moving.
                </p>
              </div>
            </article>

            {/* ==================================================
                ZONE 3 — MEADOW
                ================================================== */}

            <article
              id="forest-zone-2"
              className="forest-zone zone-meadow"
            >
              <div className="meadow-sky">
                <div className="sun-track">
                  {sun.visible && (
                    <div
                      className="sun meadow-sun"
                      style={{
                        left: `${sun.left}%`,
                        top: `${sun.top}%`,
                      }}
                    >
                      <span />
                    </div>
                  )}
                </div>
              </div>

              <div className="meadow-hills hill-one" />
              <div className="meadow-hills hill-two" />

              <div className="river">
                <div className="river-highlight r-one" />
                <div className="river-highlight r-two" />
                <div className="river-highlight r-three" />
                <div className="river-stone stone-one" />
                <div className="river-stone stone-two" />
                <div className="river-stone stone-three" />
              </div>

              <Grass count={44} />

              <div className="meadow-flowers">
                {Array.from({
                  length: 22,
                }).map((_, index) => (
                  <ForestFlower
                    key={index}
                    index={index + 2}
                    grown={true}
                  />
                ))}
              </div>

              <div className="meadow-birds">
                <CSSBird index={3} />
                <CSSBird index={5} />
                <CSSBird index={7} />
              </div>

              <div className="meadow-butterflies">
                <CSSButterfly index={1} />
                <CSSButterfly index={4} />
                <CSSButterfly index={6} />
              </div>

              <div className="meadow-rock rock-one" />
              <div className="meadow-rock rock-two" />

              <div className="zone-card">
                <span>03 / 06</span>
                <h2>River Meadow</h2>
                <p>
                  Open sky. Moving water.
                  Wild flowers.
                </p>

                <button
                  type="button"
                  onClick={collectGarden}
                >
                  <span>COLLECT GREEN MOMENT</span>
                  <b>+3</b>
                </button>
              </div>
            </article>

            {/* ==================================================
                ZONE 4 — CAVE
                ================================================== */}

            <article
              id="forest-zone-3"
              className="forest-zone zone-cave"
            >
              <div className="cave-forest-back">
                {Array.from({
                  length: 12,
                }).map((_, index) => (
                  <Tree
                    key={index}
                    index={index + 5}
                    depth={2}
                  />
                ))}
              </div>

              <div className="cave-ground" />

              <div className="cave-mouth">
                <div className="cave-rock rock-top" />
                <div className="cave-rock rock-left" />
                <div className="cave-rock rock-right" />
                <div className="cave-darkness">
                  <span className="cave-glow" />
                  <span className="cave-eyes" />
                </div>
              </div>

              <div className="cave-crystal crystal-one" />
              <div className="cave-crystal crystal-two" />
              <div className="cave-crystal crystal-three" />

              <div className="cave-bats">
                <span />
                <span />
                <span />
              </div>

              <div className="zone-card cave-card">
                <span>04 / 06</span>
                <h2>Moon Cave</h2>
                <p>
                  A hidden space beneath the
                  roots.
                </p>

                <button
                  type="button"
                  onClick={visitCave}
                >
                  ENTER CAVE
                  <b>→</b>
                </button>
              </div>
            </article>

            {/* ==================================================
                ZONE 5 — GARDEN
                ================================================== */}

            <article
              id="forest-zone-4"
              className="forest-zone zone-garden"
            >
              <div className="garden-sky" />

              <div className="garden-backdrop">
                <div className="garden-fence">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="garden-ground">
                <div className="garden-soil soil-one" />
                <div className="garden-soil soil-two" />
                <div className="garden-soil soil-three" />
              </div>

              <div className="garden-bed bed-one">
                {Array.from({
                  length: displayFlowers,
                }).map((_, index) => (
                  <ForestFlower
                    key={index}
                    index={index}
                    grown={true}
                  />
                ))}
              </div>

              <div className="garden-bed bed-two">
                {Array.from({
                  length: Math.max(
                    3,
                    Math.floor(
                      displayFlowers / 2
                    )
                  ),
                }).map((_, index) => (
                  <ForestFlower
                    key={index}
                    index={index + 5}
                    grown={true}
                  />
                ))}
              </div>

              <div className="garden-stones">
                <span />
                <span />
                <span />
                <span />
              </div>

              <CSSButterfly index={8} />
              <CSSButterfly index={9} />

              <div className="garden-card">
                <span>05 / 06</span>
                <h2>Your Garden</h2>
                <p>
                  {data.flowers} flowers are
                  growing from your progress.
                </p>

                <div className="garden-stats">
                  <div>
                    <strong>
                      {data.flowers}
                    </strong>
                    <small>FLOWERS</small>
                  </div>

                  <div>
                    <strong>
                      {data.trees}
                    </strong>
                    <small>TREES</small>
                  </div>

                  <div>
                    <strong>
                      {data.points}
                    </strong>
                    <small>POINTS</small>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={collectGarden}
                >
                  HELP IT BLOOM
                  <b>+</b>
                </button>
              </div>
            </article>

            {/* ==================================================
                ZONE 6 — CAMPFIRE
                ================================================== */}

            <article
              id="forest-zone-5"
              className="forest-zone zone-fire"
            >
              <div className="night-sky">
                {Array.from({
                  length: 70,
                }).map((_, index) => (
                  <i
                    key={index}
                    className="night-star"
                    style={{
                      left: `${
                        (index * 37) %
                        100
                      }%`,
                      top: `${
                        (index * 19) %
                        70
                      }%`,
                      "--star-delay": `${
                        index * 0.07
                      }s`,
                    }}
                  />
                ))}
              </div>

              <div className="night-mountains" />

              <div className="night-trees">
                {Array.from({
                  length: 14,
                }).map((_, index) => (
                  <Tree
                    key={index}
                    index={index + 9}
                    depth={3}
                  />
                ))}
              </div>

              <div className="campfire-area">
                <div
                  className={`campfire ${
                    campfire ? "lit" : ""
                  }`}
                >
                  <div className="fire-glow" />

                  <div className="logs">
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="flames">
                    <i className="flame flame-a" />
                    <i className="flame flame-b" />
                    <i className="flame flame-c" />
                    <i className="flame flame-d" />
                  </div>

                  <div className="embers">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>

                <button
                  type="button"
                  className={`campfire-button ${
                    campfire ? "active" : ""
                  }`}
                  onClick={lightCampfire}
                >
                  <span>
                    {campfire
                      ? "EXTINGUISH"
                      : "LIGHT CAMPFIRE"}
                  </span>
                  <b>
                    {campfire ? "×" : "✦"}
                  </b>
                </button>
              </div>

              <div className="fireflies">
                {Array.from({
                  length: 25,
                }).map((_, index) => (
                  <CSSFirefly
                    key={index}
                    index={index}
                  />
                ))}
              </div>

              <CSSDog
                name={data.dogName}
                fedToday={data.fedToday}
                onFeed={feedDog}
              />

              <div className="fire-card">
                <span>06 / 06</span>
                <h2>Campfire</h2>
                <p>
                  Stay for a moment.
                  The forest is quiet tonight.
                </p>

                <div className="fire-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setSound(
                        (previous) =>
                          !previous
                      )
                    }
                  >
                    {sound
                      ? "SOUND ON"
                      : "SOUND OFF"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowHelp(true)
                    }
                  >
                    HELP
                  </button>
                </div>
              </div>
            </article>
          </section>

          {/* ==================================================
              BOTTOM EXPERIENCE BAR
              ================================================== */}

          <div className="experience-bar">
            <div className="experience-copy">
              <span>
                {zoneIndex + 1} /{" "}
                {ZONES.length}
              </span>

              <div>
                <strong>
                  {zone.title}
                </strong>

                <small>
                  {zone.description}
                </small>
              </div>
            </div>

            <div className="experience-actions">
              <button
                type="button"
                onClick={previousZone}
              >
                ←
              </button>

              <button
                type="button"
                onClick={nextZone}
              >
                →
              </button>
            </div>
          </div>

          {/* ==================================================
              PET NAME EDIT
              ================================================== */}

          <div className="pet-name-trigger">
            <button
              type="button"
              onClick={() =>
                setDogEditing(true)
              }
            >
              COMPANION / {data.dogName}
            </button>
          </div>

          {/* ==================================================
              CAVE MODAL
              ================================================== */}

          {caveOpen && (
            <div className="overlay cave-overlay">
              <div className="cave-modal">
                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setCaveOpen(false)
                  }
                >
                  ×
                </button>

                <div className="modal-cave-art">
                  <div className="modal-crystal" />
                  <div className="modal-crystal two" />
                  <div className="modal-crystal three" />
                </div>

                <span>DISCOVERY</span>

                <h2>
                  You found the hidden
                  chamber.
                </h2>

                <p>
                  The cave is one of the
                  forest's quiet places.
                  Return whenever you want.
                </p>

                <div className="modal-stat">
                  <strong>
                    +4
                  </strong>
                  <small>
                    GREEN POINTS
                  </small>
                </div>

                <button
                  type="button"
                  className="modal-primary"
                  onClick={() =>
                    setCaveOpen(false)
                  }
                >
                  RETURN TO FOREST
                </button>
              </div>
            </div>
          )}

          {/* ==================================================
              DOG NAME MODAL
              ================================================== */}

          {dogEditing && (
            <div className="overlay">
              <div className="simple-modal">
                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setDogEditing(false)
                  }
                >
                  ×
                </button>

                <span>
                  YOUR COMPANION
                </span>

                <h2>
                  Name your dog
                </h2>

                <input
                  value={dogNameInput}
                  maxLength={18}
                  onChange={(event) =>
                    setDogNameInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      saveDogName();
                    }
                  }}
                  autoFocus
                />

                <button
                  type="button"
                  className="modal-primary"
                  onClick={
                    saveDogName
                  }
                >
                  SAVE NAME
                </button>
              </div>
            </div>
          )}

          {/* ==================================================
              HELP
              ================================================== */}

          {showHelp && (
            <div className="overlay">
              <div className="help-modal">
                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setShowHelp(false)
                  }
                >
                  ×
                </button>

                <span>
                  FOREST GUIDE
                </span>

                <h2>
                  Explore the world
                </h2>

                <div className="help-grid">
                  <div>
                    <b>← →</b>
                    <small>
                      Move between forest
                      zones.
                    </small>
                  </div>

                  <div>
                    <b>CLICK</b>
                    <small>
                      Interact with animals,
                      cave and garden.
                    </small>
                  </div>

                  <div>
                    <b>DAY / NIGHT</b>
                    <small>
                      The sun follows the
                      current local time.
                    </small>
                  </div>

                  <div>
                    <b>SOUND</b>
                    <small>
                      Enable forest ambience
                      after clicking the sound
                      button.
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  className="modal-primary"
                  onClick={() =>
                    setShowHelp(false)
                  }
                >
                  CONTINUE
                </button>

                <button
                  type="button"
                  className="reset-button"
                  onClick={resetForest}
                >
                  RESET FOREST PROGRESS
                </button>
              </div>
            </div>
          )}

          {/* ==================================================
              TOAST
              ================================================== */}

          {toast && (
            <div className="forest-toast">
              <span>✦</span>
              {toast}
            </div>
          )}

          {/* ==================================================
              END BRANDING
              ================================================== */}

          <footer className="forest-ending">
            <span>
              GREEN PULSE CSEAIML
            </span>

            <small>
              DIGITAL GREEN CHALLENGE 2026
            </small>
          </footer>
        </>
      )}
    </main>
  );
}