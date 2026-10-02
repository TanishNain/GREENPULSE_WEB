import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

/*
  GREEN PULSE — FOREST
  ----------------------------------------------------
  Game-style animated forest.
  Only Forest.jsx + Forest.css are required.

  IMPORTANT:
  - Remote assets are optional.
  - Every remote visual/audio asset has failure protection.
  - No Web Audio API / oscillator beeps.
  - System time controls the forest lighting.
*/

const WORLD_WIDTH = 9000;

const ASSETS = {
  // Large cinematic environmental footage.
  jungleVideo:
    "https://cdn.pixabay.com/video/2020/05/24/40211-424006545_large.mp4",

  // Real ambient recordings.
  forestSound:
    "https://upload.wikimedia.org/wikipedia/commons/4/4e/Amazon_Rainforest_Ambience.ogg",

  rainSound:
    "https://upload.wikimedia.org/wikipedia/commons/0/09/Rain_on_leaves.ogg",

  birdsSound:
    "https://upload.wikimedia.org/wikipedia/commons/2/2d/Bird_songs_in_the_jungle.ogg",

  // Animated wildlife videos/assets.
  deerVideo:
    "https://cdn.pixabay.com/video/2020/05/24/40215-424006630_large.mp4",

  elephantVideo:
    "https://cdn.pixabay.com/video/2020/05/24/40218-424006710_large.mp4",

  tigerVideo:
    "https://cdn.pixabay.com/video/2020/05/24/40213-424006580_large.mp4",

  monkeyVideo:
    "https://cdn.pixabay.com/video/2020/05/24/40216-424006655_large.mp4",
};

/* ----------------------------------------------------
   TIME
---------------------------------------------------- */

function getForestPhase(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;

  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "noon";
  if (hour >= 16 && hour < 19) return "evening";

  return "night";
}

function phaseLabel(phase) {
  return {
    dawn: "Dawn",
    morning: "Morning",
    noon: "Noon",
    evening: "Golden Evening",
    night: "Night",
  }[phase];
}

/* ----------------------------------------------------
   SAFE MEDIA
---------------------------------------------------- */

function SafeVideo({
  src,
  className = "",
  poster,
  muted = true,
  loop = true,
  autoPlay = true,
  onFail,
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) return null;

  return (
    <video
      className={className}
      src={src}
      poster={poster}
      muted={muted}
      loop={loop}
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
      onError={() => {
        setFailed(true);
        onFail?.();
      }}
    />
  );
}

function SafeAudio({ src, enabled, volume = 0.35 }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = "none";
    audioRef.current = audio;

    if (enabled) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [enabled]);

  return null;
}

/* ----------------------------------------------------
   WORLD DATA
---------------------------------------------------- */

const ZONES = [
  {
    name: "Forest Entrance",
    start: 0,
    description: "The quiet entrance to GreenPulse Forest.",
  },
  {
    name: "Emerald Grove",
    start: 1450,
    description: "Dense vegetation and hidden wildlife.",
  },
  {
    name: "River Bend",
    start: 3050,
    description: "A clear river crossing the forest.",
  },
  {
    name: "Deer Meadow",
    start: 4700,
    description: "Open grassland surrounded by old trees.",
  },
  {
    name: "Ancient Woods",
    start: 6250,
    description: "Huge old trees and deeper wildlife.",
  },
  {
    name: "Moonlit Grove",
    start: 7800,
    description: "The quietest part of the forest.",
  },
];

const ANIMALS = [
  {
    id: "deer-1",
    name: "Sambar Deer",
    type: "deer",
    x: 1200,
    size: "large",
    video: ASSETS.deerVideo,
    habitat: "Forest edges, grasslands and river areas",
    diet: "Grass, leaves, shoots and fruit",
    region: "Indian subcontinent and Southeast Asia",
    facts: [
      "Sambar deer are among the largest deer species in Asia.",
      "They are strong swimmers and are commonly associated with forest water sources.",
      "They are mostly active during dawn, dusk and night.",
    ],
  },
  {
    id: "monkey-1",
    name: "Hanuman Langur",
    type: "monkey",
    x: 2250,
    size: "medium",
    video: ASSETS.monkeyVideo,
    habitat: "Woodlands and forest canopies",
    diet: "Leaves, fruit, flowers and seeds",
    region: "South Asia",
    facts: [
      "Langurs spend a large amount of their time in trees.",
      "Their long tails help with balance while moving through branches.",
      "They live in social groups.",
    ],
  },
  {
    id: "elephant-1",
    name: "Asian Elephant",
    type: "elephant",
    x: 3850,
    size: "huge",
    video: ASSETS.elephantVideo,
    habitat: "Forests, grasslands and river corridors",
    diet: "Grass, leaves, bark, roots and fruit",
    region: "South and Southeast Asia",
    facts: [
      "Asian elephants are highly social animals.",
      "Water sources are extremely important to elephant populations.",
      "Elephants can significantly alter forest structure while feeding.",
    ],
  },
  {
    id: "tiger-1",
    name: "Bengal Tiger",
    type: "tiger",
    x: 5750,
    size: "large",
    video: ASSETS.tigerVideo,
    habitat: "Forests, grasslands and mangrove landscapes",
    diet: "Carnivorous",
    region: "Indian subcontinent",
    facts: [
      "The Bengal tiger is India's national animal.",
      "Tigers are generally solitary.",
      "They depend on healthy prey populations and large connected habitats.",
    ],
  },
  {
    id: "deer-2",
    name: "Spotted Deer",
    type: "deer",
    x: 6900,
    size: "medium",
    video: ASSETS.deerVideo,
    habitat: "Grasslands and open woodland",
    diet: "Grass, leaves and fallen fruit",
    region: "Indian subcontinent",
    facts: [
      "Spotted deer are also known as chital.",
      "Their spotted coat helps break up their outline in woodland.",
      "They often remain close to water.",
    ],
  },
  {
    id: "elephant-2",
    name: "Forest Elephant",
    type: "elephant",
    x: 8150,
    size: "huge",
    video: ASSETS.elephantVideo,
    habitat: "Deep forest and river corridors",
    diet: "Vegetation",
    region: "South Asia",
    facts: [
      "Elephants disperse seeds through their movement and feeding.",
      "Their trails can become important pathways for other animals.",
    ],
  },
];

/* ----------------------------------------------------
   INTERACTIVE OBJECTS
---------------------------------------------------- */

const OBJECTS = [
  {
    id: "neem",
    x: 820,
    type: "tree",
    icon: "🌳",
    name: "Neem Tree",
    facts: [
      "Scientific name: Azadirachta indica",
      "Native to the Indian subcontinent.",
      "Neem is widely valued for its traditional uses.",
      "It is drought tolerant and can grow in challenging conditions.",
      "Its foliage provides shade and habitat.",
    ],
  },
  {
    id: "banyan",
    x: 1900,
    type: "tree",
    icon: "🌳",
    name: "Banyan Tree",
    facts: [
      "Scientific name: Ficus benghalensis",
      "India's national tree.",
      "Banyans can develop aerial roots that become supporting trunks.",
      "Their fruits provide food for many animals.",
    ],
  },
  {
    id: "river-rock",
    x: 3300,
    type: "rock",
    icon: "🪨",
    name: "River Stone",
    facts: [
      "River rocks are shaped and smoothed by moving water.",
      "Rivers create habitats for fish, insects, amphibians and plants.",
    ],
  },
  {
    id: "sal",
    x: 5350,
    type: "tree",
    icon: "🌳",
    name: "Sal Tree",
    facts: [
      "Scientific name: Shorea robusta",
      "A major tree of northern and central Indian forests.",
      "Sal forests support a wide range of wildlife.",
    ],
  },
  {
    id: "old-log",
    x: 7350,
    type: "log",
    icon: "🪵",
    name: "Fallen Log",
    facts: [
      "Dead wood is an important part of forest ecosystems.",
      "Fallen logs can shelter insects, fungi, reptiles and small mammals.",
      "Decomposition returns nutrients to the soil.",
    ],
  },
];

/* ----------------------------------------------------
   HELPERS
---------------------------------------------------- */

function zoneForPosition(position) {
  let selected = ZONES[0];

  for (const zone of ZONES) {
    if (position >= zone.start) selected = zone;
  }

  return selected;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/* ----------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------- */

export default function Forest() {
  const [now, setNow] = useState(new Date());
  const [position, setPosition] = useState(350);
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [weather, setWeather] = useState("clear");
  const [inspected, setInspected] = useState(null);
  const [petNames, setPetNames] = useState({});
  const [fed, setFed] = useState({});
  const [movingAnimal, setMovingAnimal] = useState({});
  const [discovered, setDiscovered] = useState([]);
  const [assetFailures, setAssetFailures] = useState(0);

  const phase = getForestPhase(now);
  const zone = zoneForPosition(position);

  /* Real system time */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* Keyboard movement */
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "ArrowRight") {
        setPosition((p) => clamp(p + 90, 0, WORLD_WIDTH - 1000));
      }

      if (event.key === "ArrowLeft") {
        setPosition((p) => clamp(p - 90, 0, WORLD_WIDTH - 1000));
      }

      if (event.key === "Escape") {
        setMenuOpen(false);
        setInspected(null);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* Saved pet names */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("greenpulse_forest_pets");

      if (saved) {
        setPetNames(JSON.parse(saved));
      }
    } catch {
      // Never allow local storage failure to break Forest.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "greenpulse_forest_pets",
        JSON.stringify(petNames)
      );
    } catch {
      // Ignore storage failure.
    }
  }, [petNames]);

  const visibleAnimals = useMemo(() => {
    return ANIMALS.filter(
      (animal) =>
        animal.x >= position - 900 &&
        animal.x <= position + 1900
    );
  }, [position]);

  const discoverAnimal = (animal) => {
    setDiscovered((old) =>
      old.includes(animal.id) ? old : [...old, animal.id]
    );

    setInspected({
      kind: "animal",
      data: animal,
    });
  };

  const moveAnimal = (animal) => {
    setMovingAnimal((old) => ({
      ...old,
      [animal.id]: true,
    }));

    window.setTimeout(() => {
      setMovingAnimal((old) => ({
        ...old,
        [animal.id]: false,
      }));
    }, 2500);
  };

  const feedAnimal = (animal) => {
    setFed((old) => ({
      ...old,
      [animal.id]: true,
    }));

    moveAnimal(animal);
  };

  const renamePet = (animal) => {
    const current = petNames[animal.id] || animal.name;

    const name = window.prompt(
      `Give your ${animal.name} a name:`,
      current
    );

    if (!name?.trim()) return;

    setPetNames((old) => ({
      ...old,
      [animal.id]: name.trim(),
    }));
  };

  const cycleWeather = () => {
    const list = ["clear", "cloudy", "rain", "mist"];
    const index = list.indexOf(weather);

    setWeather(list[(index + 1) % list.length]);
  };

  const jumpToZone = (target) => {
    setPosition(target);
    setMenuOpen(false);
  };

  const formattedTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const environmentClass = [
    "forest-app",
    `phase-${phase}`,
    `weather-${weather}`,
  ].join(" ");

  return (
    <div className={environmentClass}>
      {/* REAL AUDIO */}
      <SafeAudio
        src={
          weather === "rain"
            ? ASSETS.rainSound
            : phase === "night"
            ? ASSETS.forestSound
            : ASSETS.birdsSound
        }
        enabled={soundOn}
        volume={weather === "rain" ? 0.28 : 0.22}
      />

      {/* CINEMATIC VIDEO BACKGROUND */}
      <SafeVideo
        src={ASSETS.jungleVideo}
        className="cinematic-bg-video"
        onFail={() => setAssetFailures((n) => n + 1)}
      />

      <div className="forest-vignette" />

      {/* TOP BAR */}
      <header className="forest-topbar">
        <button
          className="menu-button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Open forest menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="forest-title">
          <strong>GREEN PULSE</strong>
          <span>FOREST</span>
        </div>

        <div className="forest-location">
          <span>{zone.name}</span>
          <small>{phaseLabel(phase)}</small>
        </div>

        <div className="forest-clock">
          {formattedTime}
        </div>
      </header>

      {/* SIDE MENU */}
      <aside className={`forest-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div>
            <span>GREEN PULSE</span>
            <strong>Forest Explorer</strong>
          </div>

          <button onClick={() => setMenuOpen(false)}>×</button>
        </div>

        <div className="sidebar-section">
          <p>EXPLORE</p>

          {ZONES.map((item) => (
            <button
              key={item.name}
              className={item.name === zone.name ? "active" : ""}
              onClick={() => jumpToZone(item.start)}
            >
              <span>⌁</span>
              {item.name}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <p>ENVIRONMENT</p>

          <button onClick={cycleWeather}>
            <span>☁</span>
            Weather: {weather}
          </button>

          <button onClick={() => setSoundOn((v) => !v)}>
            <span>{soundOn ? "🔊" : "🔇"}</span>
            Forest sounds: {soundOn ? "ON" : "OFF"}
          </button>
        </div>

        <div className="sidebar-stats">
          <div>
            <strong>{discovered.length}</strong>
            <span>Wildlife found</span>
          </div>

          <div>
            <strong>{Object.keys(petNames).length}</strong>
            <span>Named animals</span>
          </div>
        </div>
      </aside>

      {/* GAME VIEWPORT */}
      <main className="forest-viewport">
        <div
          className="forest-world"
          style={{
            width: WORLD_WIDTH,
            transform: `translate3d(-${position}px, 0, 0)`,
          }}
        >
          {/* DISTANT ATMOSPHERE */}
          <div className="distant-haze" />

          <div className="mountain-layer">
            <div />
            <div />
            <div />
          </div>

          {/* DEEP FOREST */}
          <div className="deep-canopy">
            {Array.from({ length: 22 }).map((_, index) => (
              <div
                className="canopy-tree"
                key={index}
                style={{
                  left: `${index * 440 - 100}px`,
                  height: `${260 + (index % 5) * 65}px`,
                }}
              >
                <i />
                <b />
              </div>
            ))}
          </div>

          {/* RIVER */}
          <div className="river-zone">
            <div className="river-surface">
              <div className="river-highlight" />
              <div className="river-highlight second" />
              <div className="river-reflection" />
            </div>

            <div className="river-bank left-bank" />
            <div className="river-bank right-bank" />
          </div>

          {/* MID TREES */}
          <div className="mid-tree-layer">
            {Array.from({ length: 28 }).map((_, index) => (
              <div
                className="realistic-tree"
                key={index}
                style={{
                  left: `${index * 330 - 120}px`,
                  transform: `scale(${0.72 + (index % 4) * 0.08})`,
                }}
              >
                <div className="tree-trunk" />
                <div className="tree-crown crown-a" />
                <div className="tree-crown crown-b" />
                <div className="tree-crown crown-c" />
              </div>
            ))}
          </div>

          {/* GROUND */}
          <div className="forest-ground">
            <div className="ground-dirt" />

            {Array.from({ length: 75 }).map((_, index) => (
              <div
                key={index}
                className="grass-clump"
                style={{
                  left: `${index * 125 + (index % 4) * 15}px`,
                  bottom: `${12 + (index % 5) * 5}px`,
                }}
              >
                <i />
                <i />
                <i />
              </div>
            ))}

            {Array.from({ length: 24 }).map((_, index) => (
              <div
                key={index}
                className="fern"
                style={{
                  left: `${index * 375 + 50}px`,
                }}
              >
                <b />
                <b />
                <b />
                <b />
              </div>
            ))}
          </div>

          {/* INTERACTIVE FOREST OBJECTS */}
          {OBJECTS.map((object) => (
            <button
              key={object.id}
              className={`world-object ${object.type}`}
              style={{ left: object.x }}
              onClick={() =>
                setInspected({
                  kind: "object",
                  data: object,
                })
              }
              title={`Inspect ${object.name}`}
            >
              <div className="object-visual">
                {object.type === "tree" && (
                  <>
                    <div className="object-trunk" />
                    <div className="object-crown one" />
                    <div className="object-crown two" />
                    <div className="object-crown three" />
                  </>
                )}

                {object.type === "rock" && (
                  <div className="rock-shape" />
                )}

                {object.type === "log" && (
                  <div className="fallen-log-shape" />
                )}
              </div>

              <span>{object.icon}</span>
            </button>
          ))}

          {/* ANIMATED WILDLIFE */}
          {ANIMALS.map((animal) => {
            const relativeX = animal.x;

            return (
              <button
                key={animal.id}
                className={[
                  "wildlife",
                  `animal-${animal.type}`,
                  `animal-${animal.size}`,
                  movingAnimal[animal.id] ? "escaping" : "",
                ].join(" ")}
                style={{
                  left: relativeX,
                }}
                onClick={() => discoverAnimal(animal)}
                onDoubleClick={() => moveAnimal(animal)}
                title={`Meet ${animal.name}`}
              >
                <div className="animal-shadow" />

                <SafeVideo
                  src={animal.video}
                  className="animal-video"
                  onFail={() =>
                    setAssetFailures((n) => n + 1)
                  }
                />

                {/* Fallback silhouette */}
                <div className="animal-fallback">
                  <div className="fallback-body" />
                  <div className="fallback-head" />
                  <div className="fallback-leg a" />
                  <div className="fallback-leg b" />
                  <div className="fallback-leg c" />
                  <div className="fallback-leg d" />
                </div>

                <span className="animal-name">
                  {petNames[animal.id] || animal.name}
                </span>

                {fed[animal.id] && (
                  <span className="fed-label">FED ♥</span>
                )}
              </button>
            );
          })}

          {/* BIRDS */}
          <div className="sky-birds">
            <span className="bird bird-one">⌁</span>
            <span className="bird bird-two">⌁</span>
            <span className="bird bird-three">⌁</span>
          </div>

          {/* FALLING LEAVES */}
          <div className="leaf-field">
            {Array.from({ length: 30 }).map((_, index) => (
              <i
                key={index}
                style={{
                  left: `${index * 310 + 30}px`,
                  animationDelay: `${(index % 9) * 0.7}s`,
                }}
              />
            ))}
          </div>

          {/* FIREFLIES */}
          {phase === "night" && (
            <div className="firefly-field">
              {Array.from({ length: 42 }).map((_, index) => (
                <i
                  key={index}
                  style={{
                    left: `${index * 215 + 80}px`,
                    top: `${18 + (index * 17) % 65}%`,
                    animationDelay: `${(index % 12) * 0.45}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* RAIN */}
          {weather === "rain" && (
            <div className="rain-field">
              {Array.from({ length: 120 }).map((_, index) => (
                <i
                  key={index}
                  style={{
                    left: `${(index * 73) % 100}%`,
                    animationDelay: `${(index % 17) * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* MIST */}
          {weather === "mist" && (
            <div className="mist-field">
              <div />
              <div />
              <div />
            </div>
          )}
        </div>
      </main>

      {/* LIGHTING */}
      <div className={`lighting-overlay lighting-${phase}`} />

      {/* CONTROLS */}
      <div className="explore-controls">
        <button
          onClick={() =>
            setPosition((p) => clamp(p - 350, 0, WORLD_WIDTH - 1000))
          }
        >
          ←
        </button>

        <div>
          <span>EXPLORE</span>
          <small>
            {Math.round(
              (position / (WORLD_WIDTH - 1000)) * 100
            )}
            %
          </small>
        </div>

        <button
          onClick={() =>
            setPosition((p) =>
              clamp(p + 350, 0, WORLD_WIDTH - 1000)
            )
          }
        >
          →
        </button>
      </div>

      {/* STATUS */}
      <div className="forest-status">
        <span className="status-dot" />
        <span>{zone.description}</span>
        {assetFailures > 0 && (
          <small>
            Some optional remote assets unavailable — forest still running.
          </small>
        )}
      </div>

      {/* INFORMATION MODAL */}
      {inspected && (
        <div
          className="forest-modal-backdrop"
          onClick={() => setInspected(null)}
        >
          <section
            className="forest-info-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-info"
              onClick={() => setInspected(null)}
            >
              ×
            </button>

            {inspected.kind === "object" ? (
              <>
                <div className="info-icon">
                  {inspected.data.icon}
                </div>

                <span className="info-kicker">
                  FOREST DISCOVERY
                </span>

                <h2>{inspected.data.name}</h2>

                <div className="fact-list">
                  {inspected.data.facts.map((fact) => (
                    <p key={fact}>• {fact}</p>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="info-kicker">
                  WILDLIFE DISCOVERY
                </span>

                <h2>
                  {petNames[inspected.data.id] ||
                    inspected.data.name}
                </h2>

                <div className="animal-meta">
                  <span>
                    <strong>Habitat</strong>
                    {inspected.data.habitat}
                  </span>

                  <span>
                    <strong>Diet</strong>
                    {inspected.data.diet}
                  </span>

                  <span>
                    <strong>Region</strong>
                    {inspected.data.region}
                  </span>
                </div>

                <div className="fact-list">
                  {inspected.data.facts.map((fact) => (
                    <p key={fact}>• {fact}</p>
                  ))}
                </div>

                <div className="pet-actions">
                  <button
                    onClick={() =>
                      renamePet(inspected.data)
                    }
                  >
                    ✎ Name
                  </button>

                  <button
                    onClick={() =>
                      feedAnimal(inspected.data)
                    }
                  >
                    🍃 Feed
                  </button>

                  <button
                    onClick={() =>
                      moveAnimal(inspected.data)
                    }
                  >
                    ↗ Move
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* MINI HELP */}
      <div className="forest-help">
        <span>← →</span> Explore
        <span>•</span>
        <span>Click</span> Wildlife / Objects
        <span>•</span>
        <span>Double-click</span> Animal
      </div>
    </div>
  );
}