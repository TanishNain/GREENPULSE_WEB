import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

/*
  GREEN PULSE — FOREST
  ------------------------------------------------------------
  IMPORTANT:
  The wildlife layer is intentionally separated from the
  environment. Do NOT put ordinary wildlife footage inside
  these cards.

  For production-quality wildlife, replace the sprite URLs
  below with transparent animated WebP/APNG/GIF assets.

  Recommended asset format:
      transparent animated WebP
      512–1024 px
      full body
      feet visible
      no background
      side/profile view
*/

const WORLD_WIDTH = 11000;

const ASSETS = {
  /*
    These are placeholders for CLEAN transparent animated assets.

    The component safely hides an asset if the URL fails.
    Nothing else on the Forest page crashes.
  */

  animals: {
    deer:
      "https://www.rawpixel.com/image/14580014/animated-deer-gif-png-05062024",
    elephant:
      "https://www.rawpixel.com/image/14580015/animated-elephant-gif",
    tiger:
      "https://www.rawpixel.com/image/14580016/animated-tiger-gif",
    langur:
      "https://www.rawpixel.com/image/14580017/animated-monkey-gif",
  },

  /*
    Environmental ambience only.
    Wildlife itself is NOT represented by these background videos.
  */
  ambience:
    "https://cdn.pixabay.com/video/2020/05/24/40211-424006545_large.mp4",

  sounds: {
    forest:
      "https://upload.wikimedia.org/wikipedia/commons/2/2b/Amazon_Rainforest_Ambience.ogg",
    rain:
      "https://upload.wikimedia.org/wikipedia/commons/0/0e/Rain_on_leaves.ogg",
  },
};

function getPhase() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "noon";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

function getWeather() {
  const options = ["Clear", "Cloudy", "Mist", "Rain"];
  return options[Math.floor(Date.now() / 900000) % options.length];
}

const ZONES = [
  { x: 300, name: "Forest Entrance" },
  { x: 1700, name: "Emerald Grove" },
  { x: 3300, name: "River Bend" },
  { x: 5000, name: "Deer Meadow" },
  { x: 6800, name: "Ancient Woods" },
  { x: 8600, name: "Moonlit Grove" },
  { x: 10100, name: "Deep Forest" },
];

const ANIMALS = [
  {
    id: "sambar-01",
    species: "Sambar Deer",
    type: "deer",
    x: 2200,
    size: 155,
    speed: 0.55,
    habitat: "Forest edges, grasslands and woodland clearings",
    diet: "Leaves, grass, shoots, fruits and aquatic plants",
    region: "Indian subcontinent and Southeast Asia",
    facts: [
      "One of India's largest deer species.",
      "Males develop impressive antlers.",
      "They are particularly active around dawn and dusk.",
    ],
  },
  {
    id: "langur-01",
    species: "Hanuman Langur",
    type: "langur",
    x: 3000,
    size: 125,
    speed: 0.85,
    habitat: "Forests, woodland and rocky areas",
    diet: "Leaves, fruits, flowers and seeds",
    region: "Indian subcontinent",
    facts: [
      "Known for their long tails.",
      "They spend substantial time in trees.",
      "They communicate using many vocalisations.",
    ],
  },
  {
    id: "elephant-01",
    species: "Asian Elephant",
    type: "elephant",
    x: 4400,
    size: 230,
    speed: 0.28,
    habitat: "Forests, grasslands and river corridors",
    diet: "Grass, leaves, bark, roots and fruit",
    region: "South and Southeast Asia",
    facts: [
      "Asian elephants are highly social mammals.",
      "Their trunks are used for breathing, feeding and drinking.",
      "Water sources are important parts of their habitat.",
    ],
  },
  {
    id: "tiger-01",
    species: "Bengal Tiger",
    type: "tiger",
    x: 6100,
    size: 190,
    speed: 0.72,
    habitat: "Dense forests, grasslands and wetlands",
    diet: "Primarily large and medium-sized mammals",
    region: "Indian subcontinent",
    facts: [
      "Every tiger has a unique stripe pattern.",
      "Tigers are powerful solitary predators.",
      "They can move quietly through dense vegetation.",
    ],
  },
  {
    id: "deer-02",
    species: "Spotted Deer",
    type: "deer",
    x: 7600,
    size: 135,
    speed: 0.62,
    habitat: "Open woodland and forest clearings",
    diet: "Grass, leaves, shoots and fallen fruit",
    region: "Indian subcontinent",
    facts: [
      "Their white spots remain visible throughout life.",
      "They often stay close to water.",
      "They use alarm calls when predators are detected.",
    ],
  },
  {
    id: "elephant-02",
    species: "Forest Elephant",
    type: "elephant",
    x: 9300,
    size: 205,
    speed: 0.25,
    habitat: "Dense woodland near water",
    diet: "Leaves, grass, bark, roots and fruit",
    region: "Forest habitat",
    facts: [
      "Elephants strongly influence forest structure.",
      "They create paths through dense vegetation.",
      "They are important seed dispersers.",
    ],
  },
];

const OBJECTS = [
  {
    id: "neem",
    x: 1150,
    icon: "🌳",
    title: "Neem Tree",
    text: "Azadirachta indica",
    facts: [
      "Neem is native to the Indian subcontinent.",
      "Different parts of the tree have traditional uses.",
      "It is well adapted to warm and relatively dry conditions.",
    ],
  },
  {
    id: "banyan",
    x: 2550,
    icon: "🌳",
    title: "Banyan Tree",
    text: "Ficus benghalensis",
    facts: [
      "Banyan trees can develop aerial prop roots.",
      "A mature tree can occupy a very large area.",
      "Its fruits provide food for many animals.",
    ],
  },
  {
    id: "riverstone",
    x: 3650,
    icon: "🪨",
    title: "River Stone",
    text: "A smooth stone shaped by flowing water.",
    facts: [
      "Moving water gradually wears down rocks.",
      "River stones often become rounded through erosion.",
      "Small organisms can live around stones in streams.",
    ],
  },
  {
    id: "sal",
    x: 5650,
    icon: "🌲",
    title: "Sal Tree",
    text: "Shorea robusta",
    facts: [
      "Sal is an important tree of northern and central Indian forests.",
      "It can form extensive natural forests.",
      "Its wood is widely valued.",
    ],
  },
  {
    id: "fallen",
    x: 8050,
    icon: "🪵",
    title: "Fallen Log",
    text: "Dead wood is part of a living forest.",
    facts: [
      "Fallen wood returns nutrients to the soil.",
      "Fungi and insects break down dead material.",
      "Logs provide shelter for many organisms.",
    ],
  },
];

function SafeImage({ src, alt, className, onBroken }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable="false"
      onError={() => {
        setFailed(true);
        onBroken?.();
      }}
    />
  );
}

function SafeVideo({ src, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return null;

  return (
    <video
      className={className}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      onError={() => setFailed(true)}
    />
  );
}

function AnimalSprite({
  animal,
  onClick,
  onDoubleClick,
  fed,
  named,
  moving,
}) {
  /*
    This component intentionally DOES NOT draw a fake animal.

    If a clean transparent sprite isn't available, the animal
    simply doesn't render instead of becoming a muddy rectangle
    or a CSS blob.
  */

  const src = ASSETS.animals[animal.type];

  return (
    <button
      type="button"
      className={[
        "wildlife",
        `wildlife--${animal.type}`,
        moving ? "wildlife--moving" : "",
        fed ? "wildlife--fed" : "",
      ].join(" ")}
      style={{
        left: `${animal.x}px`,
        width: `${animal.size}px`,
        height: `${animal.size}px`,
      }}
      onClick={onClick}
      onDoubleClick={(e) => {
        e.preventDefault();
        onDoubleClick();
      }}
      aria-label={`Discover ${animal.species}`}
    >
      <span className="wildlife-ground-shadow" />

      <SafeImage
        src={src}
        alt={animal.species}
        className="wildlife-sprite"
      />

      <span className="wildlife-name">
        {named || animal.species}
      </span>

      {fed && <span className="wildlife-fed">FED</span>}
    </button>
  );
}

function InfoPanel({ selected, onClose, onFeed, onName }) {
  if (!selected) return null;

  const isAnimal = selected.kind === "animal";

  return (
    <div className="forest-modal-backdrop" onClick={onClose}>
      <section
        className="forest-info-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {isAnimal ? (
          <>
            <div className="info-kicker">WILDLIFE DISCOVERY</div>

            <h2>{selected.data.species}</h2>

            <p className="info-subtitle">
              {selected.data.habitat}
            </p>

            <div className="animal-fact-grid">
              <div>
                <small>DIET</small>
                <strong>{selected.data.diet}</strong>
              </div>

              <div>
                <small>REGION</small>
                <strong>{selected.data.region}</strong>
              </div>
            </div>

            <ul className="fact-list">
              {selected.data.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>

            <div className="animal-actions">
              <button onClick={onFeed}>
                🍎 Feed
              </button>

              <button onClick={onName}>
                ✏️ Give a name
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="info-kicker">FOREST DISCOVERY</div>

            <h2>
              {selected.data.icon} {selected.data.title}
            </h2>

            <p className="info-subtitle">
              {selected.data.text}
            </p>

            <ul className="fact-list">
              {selected.data.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

export default function Forest() {
  const [phase, setPhase] = useState(getPhase);
  const [weather, setWeather] = useState(getWeather);

  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const [selected, setSelected] = useState(null);

  const [worldX, setWorldX] = useState(0);
  const [moving, setMoving] = useState(false);

  const [animals, setAnimals] = useState(ANIMALS);

  const [namedAnimals, setNamedAnimals] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("greenpulse_forest_names") || "{}"
      );
    } catch {
      return {};
    }
  });

  const [fedAnimals, setFedAnimals] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("greenpulse_forest_fed") || "{}"
      );
    } catch {
      return {};
    }
  });

  const [audioError, setAudioError] = useState(false);

  const forestAudioRef = useRef(null);
  const rainAudioRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(getPhase());
      setWeather(getWeather());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "greenpulse_forest_names",
        JSON.stringify(namedAnimals)
      );
    } catch {}
  }, [namedAnimals]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "greenpulse_forest_fed",
        JSON.stringify(fedAnimals)
      );
    } catch {}
  }, [fedAnimals]);

  useEffect(() => {
    const down = (event) => {
      if (event.key === "ArrowLeft") {
        setWorldX((x) => Math.max(0, x - 32));
        setMoving(true);
      }

      if (event.key === "ArrowRight") {
        setWorldX((x) => Math.min(WORLD_WIDTH - 1000, x + 32));
        setMoving(true);
      }

      if (event.key === "Escape") {
        setMenuOpen(false);
        setSelected(null);
      }
    };

    const up = () => setMoving(false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!soundOn) {
      forestAudioRef.current?.pause();
      rainAudioRef.current?.pause();
      return;
    }

    const forest = forestAudioRef.current;

    if (forest) {
      forest.volume = 0.22;

      forest
        .play()
        .catch(() => setAudioError(true));
    }

    const rain = rainAudioRef.current;

    if (rain) {
      rain.volume = weather === "Rain" ? 0.28 : 0;

      if (weather === "Rain") {
        rain
          .play()
          .catch(() => setAudioError(true));
      } else {
        rain.pause();
      }
    }
  }, [soundOn, weather]);

  const visibleAnimals = useMemo(() => {
    return animals.map((animal) => {
      const direction =
        animal.id.charCodeAt(animal.id.length - 1) % 2 === 0
          ? 1
          : -1;

      let nextX = animal.x;

      if (moving) {
        nextX += direction * animal.speed * 8;
      }

      nextX = Math.max(500, Math.min(WORLD_WIDTH - 700, nextX));

      return {
        ...animal,
        x: nextX,
      };
    });
  }, [animals, moving]);

  function discoverAnimal(animal) {
    setSelected({
      kind: "animal",
      data: animal,
    });
  }

  function discoverObject(object) {
    setSelected({
      kind: "object",
      data: object,
    });
  }

  function feedSelected() {
    if (!selected || selected.kind !== "animal") return;

    const id = selected.data.id;

    setFedAnimals((old) => ({
      ...old,
      [id]: true,
    }));

    setAnimals((old) =>
      old.map((animal) =>
        animal.id === id
          ? {
              ...animal,
              x: Math.min(
                WORLD_WIDTH - 700,
                animal.x + 180
              ),
            }
          : animal
      )
    );
  }

  function nameSelected() {
    if (!selected || selected.kind !== "animal") return;

    const current =
      namedAnimals[selected.data.id] ||
      selected.data.species;

    const value = window.prompt(
      `Give this ${selected.data.species} a name:`,
      current
    );

    if (!value?.trim()) return;

    setNamedAnimals((old) => ({
      ...old,
      [selected.data.id]: value.trim(),
    }));
  }

  function jumpToZone(zoneX) {
    setWorldX(
      Math.max(
        0,
        Math.min(WORLD_WIDTH - 1000, zoneX - 400)
      )
    );

    setMenuOpen(false);
  }

  const phaseLabel = {
    dawn: "Dawn",
    morning: "Morning",
    noon: "Noon",
    evening: "Golden Evening",
    night: "Night",
  }[phase];

  return (
    <main
      className={[
        "forest-app",
        `forest-phase-${phase}`,
        `forest-weather-${weather.toLowerCase()}`,
      ].join(" ")}
    >
      <SafeVideo
        src={ASSETS.ambience}
        className="forest-cinematic"
      />

      <audio
        ref={forestAudioRef}
        src={ASSETS.sounds.forest}
        loop
        preload="none"
        onError={() => setAudioError(true)}
      />

      <audio
        ref={rainAudioRef}
        src={ASSETS.sounds.rain}
        loop
        preload="none"
        onError={() => setAudioError(true)}
      />

      <div className="forest-light-layer" />
      <div className="forest-vignette" />

      <header className="forest-topbar">
        <button
          className="hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Open forest menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="forest-brand">
          <strong>GREEN PULSE</strong>
          <span>WILDERNESS</span>
        </div>

        <div className="forest-status">
          <span>{phaseLabel}</span>
          <span>•</span>
          <span>{weather}</span>
        </div>
      </header>

      <aside
        className={[
          "forest-sidebar",
          menuOpen ? "forest-sidebar-open" : "",
        ].join(" ")}
      >
        <div className="sidebar-heading">
          <span>EXPLORE</span>
          <button onClick={() => setMenuOpen(false)}>×</button>
        </div>

        <button onClick={() => jumpToZone(300)}>
          🧭 Entrance
        </button>

        <button onClick={() => jumpToZone(1700)}>
          🌿 Emerald Grove
        </button>

        <button onClick={() => jumpToZone(3300)}>
          💧 River Bend
        </button>

        <button onClick={() => jumpToZone(5000)}>
          🦌 Deer Meadow
        </button>

        <button onClick={() => jumpToZone(6800)}>
          🌲 Ancient Woods
        </button>

        <button onClick={() => jumpToZone(8600)}>
          🌙 Moonlit Grove
        </button>

        <div className="sidebar-divider" />

        <button onClick={() => setSoundOn((v) => !v)}>
          {soundOn ? "🔊 Sounds ON" : "🔇 Sounds OFF"}
        </button>

        <div className="sidebar-tip">
          <strong>Explorer controls</strong>
          <span>← → Walk through the forest</span>
          <span>Click wildlife to discover</span>
          <span>Double-click wildlife to startle it</span>
        </div>
      </aside>

      <section className="forest-world-window">
        <div
          className="forest-world"
          style={{
            width: `${WORLD_WIDTH}px`,
            transform: `translateX(-${worldX}px)`,
          }}
        >
          <div className="distant-hills" />

          <div className="deep-canopy canopy-a" />
          <div className="deep-canopy canopy-b" />

          {Array.from({ length: 28 }).map((_, index) => (
            <div
              className={`forest-tree tree-${index % 6}`}
              key={`tree-${index}`}
              style={{
                left: `${250 + index * 390}px`,
                height: `${240 + (index % 5) * 55}px`,
              }}
            >
              <div className="tree-trunk" />
              <div className="tree-crown">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          ))}

          <div className="river">
            <div className="river-highlight" />
            <div className="river-highlight river-highlight-2" />
          </div>

          <div className="river-bank river-bank-a" />
          <div className="river-bank river-bank-b" />

          <div className="forest-ground" />

          {Array.from({ length: 90 }).map((_, index) => (
            <span
              key={`grass-${index}`}
              className="grass-blade"
              style={{
                left: `${index * 120 + 30}px`,
                bottom: `${10 + (index % 3) * 5}px`,
                transform: `rotate(${(index % 5) - 2}deg)`,
              }}
            />
          ))}

          {OBJECTS.map((object) => (
            <button
              key={object.id}
              className="forest-object"
              style={{ left: `${object.x}px` }}
              onClick={() => discoverObject(object)}
            >
              <span>{object.icon}</span>
              <small>{object.title}</small>
            </button>
          ))}

          {visibleAnimals.map((animal) => (
            <AnimalSprite
              key={animal.id}
              animal={animal}
              moving={moving}
              fed={!!fedAnimals[animal.id]}
              named={namedAnimals[animal.id]}
              onClick={() => discoverAnimal(animal)}
              onDoubleClick={() => {
                setAnimals((old) =>
                  old.map((a) =>
                    a.id === animal.id
                      ? {
                          ...a,
                          x: Math.min(
                            WORLD_WIDTH - 700,
                            a.x + 450
                          ),
                        }
                      : a
                  )
                );
              }}
            />
          ))}

          <div className="bird bird-1">◆</div>
          <div className="bird bird-2">◆</div>
          <div className="bird bird-3">◆</div>

          {Array.from({ length: 35 }).map((_, i) => (
            <span
              key={`firefly-${i}`}
              className="firefly"
              style={{
                left: `${300 + ((i * 317) % 10000)}px`,
                top: `${180 + ((i * 113) % 330)}px`,
                animationDelay: `${(i % 8) * 0.7}s`,
              }}
            />
          ))}

          {weather === "Rain" &&
            Array.from({ length: 80 }).map((_, i) => (
              <span
                key={`rain-${i}`}
                className="rain-drop"
                style={{
                  left: `${(i * 137) % 100}%`,
                  animationDelay: `${(i % 15) * 0.09}s`,
                }}
              />
            ))}

          {weather === "Mist" && (
            <>
              <div className="mist-layer mist-one" />
              <div className="mist-layer mist-two" />
            </>
          )}
        </div>
      </section>

      <div className="forest-hud">
        <div className="hud-zone">
          {ZONES.reduce((nearest, zone) => {
            return Math.abs(zone.x - worldX - 450) <
              Math.abs(nearest.x - worldX - 450)
              ? zone
              : nearest;
          }, ZONES[0]).name}
        </div>

        <div className="hud-controls">
          <button
            onMouseDown={() => setMoving(true)}
            onMouseUp={() => setMoving(false)}
            onMouseLeave={() => setMoving(false)}
            onClick={() =>
              setWorldX((x) => Math.max(0, x - 150))
            }
          >
            ←
          </button>

          <button
            onMouseDown={() => setMoving(true)}
            onMouseUp={() => setMoving(false)}
            onMouseLeave={() => setMoving(false)}
            onClick={() =>
              setWorldX((x) =>
                Math.min(WORLD_WIDTH - 1000, x + 150)
              )
            }
          >
            →
          </button>
        </div>
      </div>

      {audioError && (
        <div className="asset-warning">
          Some remote ambience could not load. Forest gameplay
          continues normally.
        </div>
      )}

      <InfoPanel
        selected={selected}
        onClose={() => setSelected(null)}
        onFeed={feedSelected}
        onName={nameSelected}
      />
    </main>
  );
}