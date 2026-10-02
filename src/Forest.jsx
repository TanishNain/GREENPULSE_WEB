import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

/*
  GREEN PULSE — FOREST
  ----------------------------------------------------
  - Large side-scrolling jungle world
  - Real photographic wildlife
  - Real forest / river photography
  - Parallax movement
  - Day → evening → night
  - Real online wildlife / rainforest recordings
  - Weather
  - Click animals / trees / river / rocks
  - Name + feed friendly animals
  - Failed remote assets simply disappear
  - No Web Audio API / no generated beeps
*/

const ASSETS = {
  jungleDay:
    "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2400&q=88",

  river:
    "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=2200&q=88",

  tiger:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Tiger,%20India.jpg",

  elephant:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian%20Elephant%20.jpg",

  deer:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sambar%20Deer.jpg",

  langur:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hanuman%20Langur%20.jpg",

  nightForest:
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=82",

  rainforestAmbience:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/20090610_0_ambience.ogg",

  rainforestWalk:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Walk_in_the_rainforest.ogg",

  dawnBirds:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/RainforestDawnChorus_Selaliparai_DM.ogg",

  jungleNightBird:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jungle_nightjar_Mt_Abu.ogg",

  jungleFowl:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Grey_jungle_fowl_20220311_130228.ogg",

  elephantSound:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Elephant_voice_-_trumpeting.ogg",

  tigerSound:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Tiger_Mad.ogg",

  toucan:
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/404114_felix-blume_toucans-singing-in-the-amazonian-rainforest-brazil.ogg",
};

const WORLD_WIDTH = 6200;

const ZONES = [
  {
    id: "entrance",
    name: "Forest Entrance",
    description: "A dense forest trail beneath the upper canopy.",
    start: 0,
    end: 850,
  },
  {
    id: "grove",
    name: "Deep Green Grove",
    description: "Thick vegetation, ancient trees and hidden wildlife.",
    start: 850,
    end: 1750,
  },
  {
    id: "river",
    name: "River Bend",
    description: "A natural waterway cutting through the forest.",
    start: 1750,
    end: 2850,
  },
  {
    id: "clearing",
    name: "Deer Clearing",
    description: "A quieter clearing where herbivores come to feed.",
    start: 2850,
    end: 4000,
  },
  {
    id: "oldwoods",
    name: "Old Woods",
    description: "Older trees, fallen branches and deeper shade.",
    start: 4000,
    end: 5100,
  },
  {
    id: "nightgrove",
    name: "Moonlit Grove",
    description: "At night the forest becomes almost completely dark.",
    start: 5100,
    end: 6200,
  },
];

const CREATURES = [
  {
    id: "deer-1",
    name: "Sambar Deer",
    species: "Sambar Deer",
    type: "animal",
    image: ASSETS.deer,
    x: 680,
    y: 64,
    width: 290,
    direction: 1,
    speed: 7,
    friendly: true,
    habitat: "Indian forests, grassland edges and riverbanks.",
    diet: "Leaves, grass, shoots, fruits and aquatic plants.",
    region: "Indian subcontinent and parts of South & Southeast Asia.",
    fact: "Sambar are excellent swimmers and often stay close to water.",
    sound: null,
  },
  {
    id: "langur-1",
    name: "Hanuman Langur",
    species: "Gray / Hanuman Langur",
    type: "animal",
    image: ASSETS.langur,
    x: 1220,
    y: 18,
    width: 190,
    direction: -1,
    speed: 12,
    friendly: true,
    habitat: "Woodlands, dry forests and tropical forest edges.",
    diet: "Leaves, fruits, flowers and seeds.",
    region: "Northern, central and southern India.",
    fact: "Langurs spend much of their lives moving through trees.",
    sound: null,
  },
  {
    id: "tiger-1",
    name: "Bengal Tiger",
    species: "Bengal Tiger",
    type: "animal",
    image: ASSETS.tiger,
    x: 2450,
    y: 72,
    width: 330,
    direction: 1,
    speed: 5,
    friendly: false,
    habitat: "Dense forests, grasslands and mangrove landscapes.",
    diet: "Carnivorous — deer and other suitable prey.",
    region: "India, Bangladesh, Bhutan and Nepal.",
    fact: "Tigers are strong swimmers and often use rivers and streams.",
    sound: ASSETS.tigerSound,
  },
  {
    id: "elephant-1",
    name: "Asian Elephant",
    species: "Asian Elephant",
    type: "animal",
    image: ASSETS.elephant,
    x: 3370,
    y: 44,
    width: 350,
    direction: -1,
    speed: 4,
    friendly: true,
    habitat: "Forests, grasslands and areas close to water.",
    diet: "Grass, bark, roots, leaves, fruit and other vegetation.",
    region: "India and other parts of South & Southeast Asia.",
    fact: "Elephants can communicate over surprisingly long distances.",
    sound: ASSETS.elephantSound,
  },
  {
    id: "deer-2",
    name: "Forest Deer",
    species: "Sambar Deer",
    type: "animal",
    image: ASSETS.deer,
    x: 4100,
    y: 76,
    width: 255,
    direction: 1,
    speed: 8,
    friendly: true,
    habitat: "Forest clearings and river valleys.",
    diet: "Grass, leaves and young shoots.",
    region: "South and Southeast Asia.",
    fact: "A sambar can remain alert while feeding by constantly listening.",
    sound: null,
  },
  {
    id: "langur-2",
    name: "Canopy Langur",
    species: "Hanuman Langur",
    type: "animal",
    image: ASSETS.langur,
    x: 4700,
    y: 20,
    width: 210,
    direction: -1,
    speed: 13,
    friendly: true,
    habitat: "Forest canopy and woodland.",
    diet: "Leaves, fruit and flowers.",
    region: "Indian subcontinent.",
    fact: "Their long tails help with balance when moving between branches.",
    sound: null,
  },
];

const INTERACTIVES = [
  {
    id: "neem",
    type: "tree",
    name: "Neem Tree",
    x: 390,
    y: 15,
    width: 310,
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=80",
    title: "Neem Tree",
    text: "Neem is a hardy tree widely grown across India.",
    facts: [
      "Known scientifically as Azadirachta indica.",
      "Leaves, seeds and bark have long been used in traditional practices.",
      "It is well adapted to warm and relatively dry conditions.",
    ],
  },
  {
    id: "old-tree",
    type: "tree",
    name: "Ancient Forest Tree",
    x: 1530,
    y: 4,
    width: 360,
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=80",
    title: "Ancient Forest Tree",
    text: "Large mature trees form the upper structure of a forest.",
    facts: [
      "Large trees provide nesting and shelter sites.",
      "Their roots stabilize soil.",
      "Canopy leaves intercept sunlight and rainfall.",
    ],
  },
  {
    id: "river-rock",
    type: "rock",
    name: "River Rock",
    x: 2210,
    y: 150,
    width: 190,
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
    title: "River Rock",
    text: "Rocks in streams become habitats for algae, insects and microorganisms.",
    facts: [
      "Moving water gradually changes rock surfaces.",
      "Small aquatic organisms can live underneath stones.",
      "River rocks can create small areas of slower water.",
    ],
  },
  {
    id: "river",
    type: "river",
    name: "Forest River",
    x: 2480,
    y: 190,
    width: 350,
    image: ASSETS.river,
    title: "Forest River",
    text: "Waterways are among the most important ecological corridors in forests.",
    facts: [
      "Rivers provide drinking water for wildlife.",
      "Riverbanks can support dense vegetation.",
      "Aquatic ecosystems connect many habitats.",
    ],
  },
  {
    id: "fallen-log",
    type: "tree",
    name: "Fallen Log",
    x: 4380,
    y: 164,
    width: 280,
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80",
    title: "Fallen Forest Log",
    text: "Dead wood is still part of a living forest ecosystem.",
    facts: [
      "Fallen wood returns nutrients to the soil.",
      "Insects and fungi colonize decaying wood.",
      "Small animals can use logs as shelter.",
    ],
  },
];

function getPhase(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "noon";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

function getPhaseName(phase) {
  return {
    dawn: "Dawn",
    morning: "Morning",
    noon: "Noon",
    evening: "Evening",
    night: "Night",
  }[phase];
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function RemoteImage({
  src,
  alt,
  className = "",
  style,
  onFail,
  ...props
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      draggable="false"
      onError={() => {
        setFailed(true);
        onFail?.();
      }}
      {...props}
    />
  );
}

function Forest() {
  const [now, setNow] = useState(new Date());
  const [phase, setPhase] = useState(getPhase());
  const [weather, setWeather] = useState("Clear");

  const [position, setPosition] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const [soundOn, setSoundOn] = useState(false);
  const [inspected, setInspected] = useState(null);

  const [petNames, setPetNames] = useState({});
  const [fed, setFed] = useState({});

  const [moving, setMoving] = useState({});
  const [failedImages, setFailedImages] = useState({});

  const ambientRef = useRef(null);
  const soundObjects = useRef({});

  const maxPosition = WORLD_WIDTH - window.innerWidth;

  const safeMaxPosition = Math.max(0, maxPosition);

  const zone = useMemo(() => {
    const currentX = position + window.innerWidth / 2;

    return (
      ZONES.find(
        (item) => currentX >= item.start && currentX < item.end
      ) || ZONES[ZONES.length - 1]
    );
  }, [position]);

  useEffect(() => {
    try {
      const storedNames = localStorage.getItem("greenpulse_forest_pets");

      if (storedNames) {
        setPetNames(JSON.parse(storedNames));
      }
    } catch {
      // Storage failure must never break Forest.
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const date = new Date();

      setNow(date);
      setPhase(getPhase(date));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const resize = () => {
      setPosition((old) =>
        Math.min(old, Math.max(0, WORLD_WIDTH - window.innerWidth))
      );
    };

    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const keyboard = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveWorld(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveWorld(1);
      }

      if (event.key === "Escape") {
        setInspected(null);
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", keyboard);

    return () => window.removeEventListener("keydown", keyboard);
  });

  useEffect(() => {
    if (!soundOn) {
      if (ambientRef.current) {
        try {
          ambientRef.current.pause();
          ambientRef.current.currentTime = 0;
        } catch {}
      }

      return;
    }

    const ambient =
      phase === "night"
        ? ASSETS.jungleNightBird
        : phase === "dawn"
        ? ASSETS.dawnBirds
        : weather === "Rain"
        ? ASSETS.rainforestWalk
        : ASSETS.rainforestAmbience;

    try {
      if (ambientRef.current) {
        ambientRef.current.pause();
      }

      const audio = new Audio(ambient);

      audio.loop = true;
      audio.volume = weather === "Rain" ? 0.42 : 0.32;

      audio.onerror = () => {
        ambientRef.current = null;
      };

      ambientRef.current = audio;

      audio.play().catch(() => {
        // Browser autoplay policy.
      });
    } catch {
      ambientRef.current = null;
    }

    return () => {
      try {
        ambientRef.current?.pause();
      } catch {}
    };
  }, [soundOn, phase, weather]);

  useEffect(() => {
    return () => {
      Object.values(soundObjects.current).forEach((audio) => {
        try {
          audio.pause();
        } catch {}
      });

      try {
        ambientRef.current?.pause();
      } catch {}
    };
  }, []);

  function moveWorld(direction) {
    const amount = Math.max(260, window.innerWidth * 0.58);

    setPosition((old) => {
      const next = old + direction * amount;
      return Math.max(0, Math.min(safeMaxPosition, next));
    });
  }

  function inspect(item) {
    setInspected(item);

    if (item.type === "animal" && item.sound) {
      playSound(item.sound, item.id);
    }
  }

  function playSound(url, id = "sound") {
    if (!soundOn || !url) return;

    try {
      const old = soundObjects.current[id];

      if (old) {
        try {
          old.pause();
        } catch {}
      }

      const audio = new Audio(url);

      audio.volume = 0.65;

      audio.onerror = () => {
        delete soundObjects.current[id];
      };

      soundObjects.current[id] = audio;

      audio.play().catch(() => {});
    } catch {
      // Never allow an external audio failure to crash React.
    }
  }

  function chooseWeather() {
    const list = ["Clear", "Cloudy", "Rain", "Fog"];

    const current = list.indexOf(weather);
    setWeather(list[(current + 1) % list.length]);
  }

  function toggleSound() {
    setSoundOn((old) => !old);
  }

  function namePet(id, value) {
    const clean = value.trim().slice(0, 22);

    setPetNames((old) => {
      const next = {
        ...old,
        [id]: clean,
      };

      try {
        localStorage.setItem(
          "greenpulse_forest_pets",
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });
  }

  function feedAnimal(id) {
    setFed((old) => ({
      ...old,
      [id]: (old[id] || 0) + 1,
    }));

    setMoving((old) => ({
      ...old,
      [id]: true,
    }));

    const animal = CREATURES.find((item) => item.id === id);

    if (animal?.sound) {
      playSound(animal.sound, `feed-${id}`);
    }

    setTimeout(() => {
      setMoving((old) => ({
        ...old,
        [id]: false,
      }));
    }, 900);
  }

  const progress =
    safeMaxPosition === 0 ? 0 : (position / safeMaxPosition) * 100;

  return (
    <div
      className={`forest-app phase-${phase} weather-${weather.toLowerCase()}`}
    >
      <div className="forest-topbar">
        <button
          className={`forest-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((old) => !old)}
          aria-label="Open forest menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="forest-location">
          <strong>{zone.name}</strong>
          <small>{zone.description}</small>
        </div>

        <div className="forest-clock">
          <span>{formatTime(now)}</span>
          <small>{getPhaseName(phase)}</small>
        </div>
      </div>

      <aside className={`forest-menu ${menuOpen ? "visible" : ""}`}>
        <div className="menu-brand">
          <div className="brand-leaf">🌿</div>
          <div>
            <strong>GREEN PULSE</strong>
            <span>Living Forest</span>
          </div>
        </div>

        <div className="menu-divider" />

        <button onClick={() => setPosition(0)}>
          <span>⌂</span>
          Forest Entrance
        </button>

        <button onClick={() => setPosition(1750)}>
          <span>≋</span>
          River Bend
        </button>

        <button onClick={() => setPosition(2850)}>
          <span>◌</span>
          Deer Clearing
        </button>

        <button onClick={() => setPosition(5100)}>
          <span>☾</span>
          Moonlit Grove
        </button>

        <div className="menu-divider" />

        <button onClick={chooseWeather}>
          <span>☁</span>
          Weather: {weather}
        </button>

        <button onClick={toggleSound}>
          <span>{soundOn ? "🔊" : "🔇"}</span>
          Forest Sound: {soundOn ? "ON" : "OFF"}
        </button>

        <div className="menu-tip">
          <strong>Explore</strong>
          <span>
            Use the arrows, keyboard, or swipe across the jungle.
          </span>
        </div>
      </aside>

      <main
        className="forest-viewport"
        onTouchStart={(event) => {
          event.currentTarget.dataset.touchX =
            event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          const start = Number(
            event.currentTarget.dataset.touchX || 0
          );

          const end = event.changedTouches[0].clientX;

          if (Math.abs(end - start) < 45) return;

          moveWorld(end < start ? 1 : -1);
        }}
      >
        <div
          className="forest-world"
          style={{
            width: `${WORLD_WIDTH}px`,
            transform: `translate3d(${-position}px,0,0)`,
          }}
        >
          <div className="jungle-photo-background" />

          <div className="far-canopy">
            {Array.from({ length: 22 }).map((_, index) => (
              <div
                className="canopy-mass"
                key={index}
                style={{
                  left: `${index * 285 - 80}px`,
                  height: `${260 + ((index * 71) % 160)}px`,
                }}
              />
            ))}
          </div>

          <div className="distant-hills">
            {Array.from({ length: 9 }).map((_, index) => (
              <span
                key={index}
                style={{
                  left: `${index * 760}px`,
                }}
              />
            ))}
          </div>

          <div className="deep-tree-line">
            {Array.from({ length: 28 }).map((_, index) => (
              <div
                className="deep-tree"
                key={index}
                style={{
                  left: `${index * 225 - 90}px`,
                  height: `${300 + ((index * 53) % 230)}px`,
                }}
              >
                <i />
                <b />
              </div>
            ))}
          </div>

          <div className="real-river">
            <div className="river-surface" />
            <div className="river-highlight" />
            <div className="river-current current-one" />
            <div className="river-current current-two" />
            <div className="river-bank bank-left" />
            <div className="river-bank bank-right" />
          </div>

          <div className="ground-shadow" />

          <div className="forest-ground">
            {Array.from({ length: 42 }).map((_, index) => (
              <span
                className="grass-clump"
                key={index}
                style={{
                  left: `${index * 150 + 20}px`,
                  bottom: `${15 + ((index * 19) % 38)}px`,
                  transform: `scale(${0.7 + ((index * 17) % 45) / 100})`,
                }}
              />
            ))}
          </div>

          <div className="foreground-plants">
            {Array.from({ length: 34 }).map((_, index) => (
              <div
                className="plant"
                key={index}
                style={{
                  left: `${index * 190 - 50}px`,
                  bottom: `${18 + ((index * 13) % 30)}px`,
                  transform: `scale(${0.8 + ((index * 23) % 50) / 100})`,
                }}
              >
                <i />
                <b />
                <em />
              </div>
            ))}
          </div>

          <div className="forest-objects">
            {INTERACTIVES.map((item) => {
              if (failedImages[item.id]) return null;

              return (
                <button
                  className={`forest-object object-${item.type}`}
                  key={item.id}
                  style={{
                    left: `${item.x}px`,
                    bottom: `${item.y}px`,
                    width: `${item.width}px`,
                  }}
                  onClick={() => inspect(item)}
                >
                  <RemoteImage
                    src={item.image}
                    alt={item.name}
                    onFail={() =>
                      setFailedImages((old) => ({
                        ...old,
                        [item.id]: true,
                      }))
                    }
                  />

                  <span className="object-glow" />

                  <span className="object-label">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="wildlife-layer">
            {CREATURES.map((animal) => {
              if (failedImages[animal.id]) return null;

              const extraMovement = moving[animal.id]
                ? 180
                : 0;

              return (
                <button
                  className={`wildlife wildlife-${animal.id} ${
                    moving[animal.id] ? "reacting" : ""
                  }`}
                  key={animal.id}
                  style={{
                    left: `${animal.x + extraMovement}px`,
                    bottom: `${animal.y}px`,
                    width: `${animal.width}px`,
                    transform: `scaleX(${animal.direction})`,
                  }}
                  onClick={() => inspect(animal)}
                >
                  <RemoteImage
                    src={animal.image}
                    alt={animal.name}
                    onFail={() =>
                      setFailedImages((old) => ({
                        ...old,
                        [animal.id]: true,
                      }))
                    }
                  />

                  <span className="wildlife-shadow" />

                  <span className="wildlife-name">
                    {petNames[animal.id] || animal.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flying-wildlife">
            <span className="bird bird-a" />
            <span className="bird bird-b" />
            <span className="bird bird-c" />
            <span className="bird bird-d" />
          </div>

          <div className="floating-leaves">
            {Array.from({ length: 17 }).map((_, index) => (
              <i
                key={index}
                style={{
                  left: `${index * 390 + 90}px`,
                  animationDelay: `${index * 1.4}s`,
                }}
              />
            ))}
          </div>

          <div className="fireflies">
            {Array.from({ length: 48 }).map((_, index) => (
              <i
                key={index}
                style={{
                  left: `${index * 127 + 50}px`,
                  top: `${90 + ((index * 47) % 330)}px`,
                  animationDelay: `${(index % 12) * 0.35}s`,
                }}
              />
            ))}
          </div>

          <div className="rain-layer">
            {Array.from({ length: 130 }).map((_, index) => (
              <i
                key={index}
                style={{
                  left: `${(index * 47) % 100}%`,
                  animationDelay: `${(index % 15) * -0.08}s`,
                }}
              />
            ))}
          </div>

          <div className="fog-layer">
            <span />
            <span />
            <span />
          </div>

          <div className="world-vignette" />
          <div className="night-overlay" />
          <div className="weather-overlay" />
        </div>
      </main>

      <div className="forest-controls">
        <button
          className="turn-button"
          onClick={() => moveWorld(-1)}
          aria-label="Explore left"
        >
          ‹
        </button>

        <div className="explore-progress">
          <div className="progress-label">
            <span>{zone.name}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="progress-track">
            <span style={{ width: `${Math.max(3, progress)}%` }} />
          </div>

          <small>
            ← / → explore the forest
          </small>
        </div>

        <button
          className="turn-button"
          onClick={() => moveWorld(1)}
          aria-label="Explore right"
        >
          ›
        </button>
      </div>

      <div className="forest-status">
        <span className="status-dot" />
        <span>{weather}</span>
        <span>•</span>
        <span>{getPhaseName(phase)}</span>
        <span>•</span>
        <span>{soundOn ? "Wildlife audio ON" : "Audio OFF"}</span>
      </div>

      {inspected && (
        <div
          className="info-backdrop"
          onClick={() => setInspected(null)}
        >
          <section
            className="forest-info-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="info-close"
              onClick={() => setInspected(null)}
            >
              ×
            </button>

            {inspected.image && (
              <div className="info-image">
                <RemoteImage
                  src={inspected.image}
                  alt={inspected.name}
                />
              </div>
            )}

            <div className="info-content">
              <span className="info-type">
                {inspected.type === "animal"
                  ? "WILDLIFE"
                  : inspected.type === "tree"
                  ? "FOREST"
                  : "NATURE"}
              </span>

              <h2>{inspected.title || inspected.name}</h2>

              <p>
                {inspected.text ||
                  inspected.habitat ||
                  inspected.description}
              </p>

              {inspected.type === "animal" ? (
                <>
                  <div className="animal-facts">
                    <div>
                      <strong>Habitat</strong>
                      <span>{inspected.habitat}</span>
                    </div>

                    <div>
                      <strong>Diet</strong>
                      <span>{inspected.diet}</span>
                    </div>

                    <div>
                      <strong>Region</strong>
                      <span>{inspected.region}</span>
                    </div>

                    <div>
                      <strong>Did you know?</strong>
                      <span>{inspected.fact}</span>
                    </div>
                  </div>

                  {inspected.friendly && (
                    <div className="pet-panel">
                      <label>
                        Give this animal a name
                      </label>

                      <div className="pet-input-row">
                        <input
                          defaultValue={
                            petNames[inspected.id] || ""
                          }
                          maxLength={22}
                          placeholder="e.g. Moti"
                          onBlur={(event) =>
                            namePet(
                              inspected.id,
                              event.target.value
                            )
                          }
                        />

                        <button
                          onClick={() =>
                            feedAnimal(inspected.id)
                          }
                        >
                          Feed
                        </button>
                      </div>

                      <small>
                        Fed {fed[inspected.id] || 0} time
                        {(fed[inspected.id] || 0) === 1
                          ? ""
                          : "s"}
                      </small>
                    </div>
                  )}

                  {!inspected.friendly && (
                    <div className="wild-warning">
                      Observe from a safe distance. This is a
                      wild animal.
                    </div>
                  )}
                </>
              ) : (
                <ul className="fact-list">
                  {(inspected.facts || []).map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Forest;