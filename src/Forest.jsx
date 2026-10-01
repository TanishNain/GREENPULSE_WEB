import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";

/* =========================================================
   TIME
========================================================= */

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

/* =========================================================
   ONLINE MEDIA
   If an image/audio fails, the relevant object disappears
   or audio simply does nothing.
========================================================= */

const ONLINE = {
  deer:
    "https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=700&q=85",

  fox:
    "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=700&q=85",

  owl:
    "https://images.unsplash.com/photo-1470118082306-1f2b6b7a7f3b?auto=format&fit=crop&w=700&q=85",

  bird:
    "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=700&q=85",

  frog:
    "https://images.unsplash.com/photo-1559253664-ca249d4608c6?auto=format&fit=crop&w=700&q=85",

  forest:
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1800&q=90",
};

/*
  These are external recordings.
  If a provider/browser refuses playback, the application
  catches the error and continues normally.
*/
const SOUNDS = {
  forestDay:
    "https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3",

  forestNight:
    "https://assets.mixkit.co/active_storage/sfx/2463/2463-preview.mp3",

  rain:
    "https://assets.mixkit.co/active_storage/sfx/2398/2398-preview.mp3",

  deer:
    "https://assets.mixkit.co/active_storage/sfx/2494/2494-preview.mp3",

  bird:
    "https://assets.mixkit.co/active_storage/sfx/2433/2433-preview.mp3",

  frog:
    "https://assets.mixkit.co/active_storage/sfx/2421/2421-preview.mp3",

  owl:
    "https://assets.mixkit.co/active_storage/sfx/2495/2495-preview.mp3",
};

/* =========================================================
   WORLD OBJECTS
========================================================= */

const INITIAL_ANIMALS = [
  {
    id: "deer-1",
    species: "Deer",
    type: "deer",
    x: 22,
    y: 64,
    scale: 0.92,
    zone: "Meadow",
    info: {
      title: "Indian Deer",
      subtitle: "Forest herbivore",
      region: "Indian forests and grasslands",
      perks:
        "Helps spread seeds and forms an important part of the forest food web.",
      diet: "Grass, leaves, shoots and fallen fruits",
      fact: "Deer are especially alert to movement and unfamiliar sounds.",
    },
  },
  {
    id: "deer-2",
    species: "Deer",
    type: "deer",
    x: 72,
    y: 57,
    scale: 0.72,
    zone: "River Meadow",
    info: {
      title: "Spotted Deer",
      subtitle: "Chital",
      region: "Much of the Indian subcontinent",
      perks:
        "Grazing and seed movement contribute to the balance of forest ecosystems.",
      diet: "Grass, leaves, flowers and fallen fruit",
      fact: "Chital commonly live in herds and are often associated with water sources.",
    },
  },
  {
    id: "fox-1",
    species: "Fox",
    type: "fox",
    x: 47,
    y: 71,
    scale: 0.55,
    zone: "Rocky Trail",
    info: {
      title: "Indian Fox",
      subtitle: "Small forest predator",
      region: "Grasslands, scrub and dry regions of India",
      perks:
        "Predators help keep prey populations and ecosystems in balance.",
      diet: "Rodents, insects, birds, reptiles and fruit",
      fact: "Foxes can adapt to a wide variety of landscapes.",
    },
  },
  {
    id: "owl-1",
    species: "Owl",
    type: "owl",
    x: 83,
    y: 25,
    scale: 0.42,
    zone: "Old Trees",
    nightOnly: true,
    info: {
      title: "Forest Owl",
      subtitle: "Nocturnal bird",
      region: "Forested regions across India",
      perks:
        "Owls naturally control populations of rodents and other small animals.",
      diet: "Small mammals, insects, reptiles and birds",
      fact: "Many owl species are most active after sunset.",
    },
  },
  {
    id: "frog-1",
    species: "Frog",
    type: "frog",
    x: 64,
    y: 82,
    scale: 0.32,
    zone: "River Bank",
    info: {
      title: "Forest Frog",
      subtitle: "Amphibian",
      region: "Wetlands, forests and freshwater habitats",
      perks:
        "Frogs eat insects and are useful indicators of environmental health.",
      diet: "Insects and other small invertebrates",
      fact: "Amphibians are highly sensitive to changes in water and habitat quality.",
    },
  },
];

const FOREST_OBJECTS = [
  {
    id: "neem",
    type: "tree",
    name: "Neem",
    x: 11,
    y: 39,
    icon: "🌳",
    info: {
      title: "Neem",
      subtitle: "Azadirachta indica",
      region: "Indian subcontinent",
      perks:
        "Known for traditional medicinal uses, natural compounds and shade.",
      habitat: "Warm tropical and subtropical regions",
      fact: "Neem is a hardy tree that can tolerate relatively dry conditions.",
    },
  },
  {
    id: "banyan",
    type: "tree",
    name: "Banyan",
    x: 35,
    y: 34,
    icon: "🌳",
    info: {
      title: "Banyan",
      subtitle: "Ficus benghalensis",
      region: "Indian subcontinent",
      perks:
        "Provides food and shelter for many organisms and can create large habitat structures.",
      habitat: "Tropical and subtropical regions",
      fact: "Its aerial roots can grow down from branches and become additional trunks.",
    },
  },
  {
    id: "sal",
    type: "tree",
    name: "Sal",
    x: 58,
    y: 31,
    icon: "🌲",
    info: {
      title: "Sal",
      subtitle: "Shorea robusta",
      region: "Northern, central and eastern India",
      perks:
        "A major native forest tree that supports biodiversity and provides valuable habitat.",
      habitat: "Moist and dry deciduous forests",
      fact: "Sal forests occur extensively across parts of northern and central India.",
    },
  },
  {
    id: "peepal",
    type: "tree",
    name: "Peepal",
    x: 91,
    y: 40,
    icon: "🌳",
    info: {
      title: "Peepal",
      subtitle: "Ficus religiosa",
      region: "Indian subcontinent and Southeast Asia",
      perks:
        "Its fruit and foliage support wildlife, while mature trees provide shade and habitat.",
      habitat: "Warm regions and human settlements",
      fact: "Peepal belongs to the fig family and produces small fig-like fruits.",
    },
  },
  {
    id: "stone-1",
    type: "stone",
    name: "River Stone",
    x: 57,
    y: 88,
    icon: "🪨",
    info: {
      title: "River Stone",
      subtitle: "Natural geological feature",
      region: "River and stream environments",
      perks:
        "Provides microhabitats for insects, mosses and small organisms.",
      habitat: "Stream and river margins",
      fact: "Water gradually rounds exposed stones through erosion and transport.",
    },
  },
  {
    id: "stone-2",
    type: "stone",
    name: "Forest Rock",
    x: 29,
    y: 85,
    icon: "🪨",
    info: {
      title: "Forest Rock",
      subtitle: "Rocky habitat",
      region: "Forest floor",
      perks:
        "Rocks create shelter, shade and small habitats for insects and reptiles.",
      habitat: "Forest floor and rocky slopes",
      fact: "A single rock can create several tiny temperature and moisture zones.",
    },
  },
];

/* =========================================================
   FIREFLIES
========================================================= */

function Fireflies({ count = 70 }) {
  const flies = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${2 + Math.random() * 96}%`,
        top: `${35 + Math.random() * 55}%`,
        delay: `${Math.random() * 7}s`,
        duration: `${3 + Math.random() * 6}s`,
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

/* =========================================================
   RAIN
========================================================= */

function Rain() {
  const drops = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 1.5}s`,
        duration: `${0.55 + Math.random() * 0.55}s`,
      })),
    []
  );

  return (
    <div className="rain-layer" aria-hidden="true">
      {drops.map((drop) => (
        <i
          key={drop.id}
          style={{
            left: drop.left,
            animationDelay: drop.delay,
            animationDuration: drop.duration,
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   REAL AUDIO MANAGER
========================================================= */

function ForestAudio({ phase, weather, enabled }) {
  const ambientRef = useRef(null);
  const rainRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      [ambientRef.current, rainRef.current].forEach((audio) => {
        if (!audio) return;

        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
      });

      return;
    }

    const ambientUrl =
      phase === "night" ? SOUNDS.forestNight : SOUNDS.forestDay;

    const ambient = new Audio(ambientUrl);
    ambient.loop = true;
    ambient.volume = 0.28;
    ambientRef.current = ambient;

    const rain = new Audio(SOUNDS.rain);
    rain.loop = true;
    rain.volume = 0.2;
    rainRef.current = rain;

    ambient.play().catch(() => {});

    if (weather === "Rain") {
      rain.play().catch(() => {});
    }

    return () => {
      try {
        ambient.pause();
      } catch {}

      try {
        rain.pause();
      } catch {}

      ambientRef.current = null;
      rainRef.current = null;
    };
  }, [phase, weather, enabled]);

  return null;
}

/* =========================================================
   IMAGE WITH FAIL-SAFE
========================================================= */

function OnlineImage({
  src,
  alt,
  className = "",
  onError,
  ...props
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      draggable="false"
      onError={() => {
        setFailed(true);
        onError?.();
      }}
      {...props}
    />
  );
}

/* =========================================================
   ANIMAL
========================================================= */

function Animal({
  animal,
  phase,
  petName,
  onInteract,
  onInfo,
  disabled,
}) {
  if (animal.nightOnly && phase !== "night") return null;

  return (
    <button
      className={[
        "forest-animal",
        `animal-${animal.type}`,
        animal.running ? "animal-running" : "",
        disabled ? "animal-disabled" : "",
      ].join(" ")}
      style={{
        left: `${animal.x}%`,
        top: `${animal.y}%`,
        "--animal-scale": animal.scale,
      }}
      onClick={() => onInteract(animal)}
      disabled={disabled}
      title={`Interact with ${petName || animal.species}`}
    >
      <OnlineImage
        src={ONLINE[animal.type]}
        alt={animal.species}
        className="animal-photo"
      />

      <span className="animal-shadow" />

      {petName && (
        <span className="animal-name">
          {petName}
        </span>
      )}

      <span
        className="animal-info-dot"
        onClick={(event) => {
          event.stopPropagation();
          onInfo(animal);
        }}
      >
        i
      </span>
    </button>
  );
}

/* =========================================================
   INFORMATION CARD
========================================================= */

function InfoCard({ item, onClose }) {
  if (!item) return null;

  const data = item.info;

  return (
    <div className="info-card-wrap">
      <div className="info-card">
        <button
          className="info-close"
          onClick={onClose}
          aria-label="Close information"
        >
          ×
        </button>

        <div className="info-card-icon">
          {item.type === "tree"
            ? "🌳"
            : item.type === "stone"
            ? "🪨"
            : "🐾"}
        </div>

        <div className="info-card-kicker">
          GREEN PULSE • FOREST GUIDE
        </div>

        <h2>{data.title}</h2>
        <p className="info-subtitle">{data.subtitle}</p>

        <div className="info-row">
          <span>REGION</span>
          <strong>{data.region}</strong>
        </div>

        {data.perks && (
          <div className="info-row">
            <span>PERKS</span>
            <strong>{data.perks}</strong>
          </div>
        )}

        {data.diet && (
          <div className="info-row">
            <span>DIET</span>
            <strong>{data.diet}</strong>
          </div>
        )}

        {data.habitat && (
          <div className="info-row">
            <span>HABITAT</span>
            <strong>{data.habitat}</strong>
          </div>
        )}

        <div className="info-fact">
          <span>🌿</span>
          <p>{data.fact}</p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PET PANEL
========================================================= */

function PetPanel({
  selectedAnimal,
  petName,
  setPetName,
  food,
  setFood,
  onFeed,
}) {
  if (!selectedAnimal) return null;

  return (
    <div className="pet-panel">
      <div className="pet-panel-title">
        <span>🐾</span>
        <div>
          <strong>
            {petName || selectedAnimal.species}
          </strong>
          <small>{selectedAnimal.zone}</small>
        </div>
      </div>

      <div className="pet-actions">
        <input
          value={petName}
          maxLength={18}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Give this animal a name"
        />

        <select
          value={food}
          onChange={(e) => setFood(e.target.value)}
        >
          <option>Fruit</option>
          <option>Leaves</option>
          <option>Seeds</option>
          <option>Grass</option>
        </select>

        <button onClick={onFeed}>
          Feed
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   WORLD
========================================================= */

function WorldTrees({ onInfo }) {
  return (
    <div className="world-trees">
      {FOREST_OBJECTS.map((object) => (
        <button
          key={object.id}
          className={`world-object world-${object.type}`}
          style={{
            left: `${object.x}%`,
            top: `${object.y}%`,
          }}
          onClick={() => onInfo(object)}
          title={`Learn about ${object.name}`}
        >
          {object.type === "tree" ? (
            <>
              <div className="photo-tree">
                <OnlineImage
                  src={ONLINE.forest}
                  alt={object.name}
                  className="tree-photo"
                />
              </div>
              <span className="object-label">
                {object.name}
              </span>
            </>
          ) : (
            <>
              <span className="stone-photo">{object.icon}</span>
              <span className="object-label">
                {object.name}
              </span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function Forest() {
  const [phase, setPhase] = useState(getTimePhase());
  const [weather, setWeather] = useState("Clear");

  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [showAnimals, setShowAnimals] = useState(true);
  const [showMist, setShowMist] = useState(true);

  const [worldPosition, setWorldPosition] = useState(50);

  const [animals, setAnimals] = useState(INITIAL_ANIMALS);

  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);

  const [petNames, setPetNames] = useState({});
  const [food, setFood] = useState("Fruit");
  const [message, setMessage] = useState("");

  const [currentTime, setCurrentTime] = useState(
    new Date()
  );

  /* -------------------------------------------------------
     REAL SYSTEM CLOCK
  ------------------------------------------------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setPhase(getTimePhase());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isNight = phase === "night";
  const isEvening = phase === "evening";
  const isMorning =
    phase === "morning" || phase === "dawn";

  const isRain = weather === "Rain";
  const isFog = weather === "Fog";

  /* -------------------------------------------------------
     WEATHER
  ------------------------------------------------------- */

  const updateWeather = () => {
    const next =
      weatherTypes[
        Math.floor(Math.random() * weatherTypes.length)
      ];

    setWeather(next);
  };

  /* -------------------------------------------------------
     EXPLORE
  ------------------------------------------------------- */

  const moveWorld = (direction) => {
    setWorldPosition((current) => {
      const amount = direction === "left" ? -18 : 18;

      return Math.max(
        8,
        Math.min(92, current + amount)
      );
    });

    setMessage(
      direction === "left"
        ? "You turned left into the forest."
        : "You turned right deeper into the forest."
    );

    setTimeout(() => setMessage(""), 1800);
  };

  /* -------------------------------------------------------
     ANIMAL INTERACTION
  ------------------------------------------------------- */

  const playAnimalSound = (type) => {
    const url = SOUNDS[type];

    if (!url) return;

    try {
      const audio = new Audio(url);
      audio.volume = 0.55;
      audio.play().catch(() => {});
    } catch {}
  };

  const interactAnimal = (animal) => {
    if (animal.running) return;

    setSelectedAnimal(animal);
    playAnimalSound(animal.type);

    setAnimals((current) =>
      current.map((item) =>
        item.id === animal.id
          ? {
              ...item,
              running: true,
              x: Math.max(
                3,
                Math.min(
                  95,
                  item.x +
                    (Math.random() > 0.5 ? 9 : -9)
                )
              ),
              y: Math.max(
                35,
                Math.min(
                  82,
                  item.y +
                    (Math.random() > 0.5 ? 3 : -3)
                )
              ),
            }
          : item
      )
    );

    setMessage(
      `${petNames[animal.id] || animal.species} noticed you!`
    );

    setTimeout(() => {
      setAnimals((current) =>
        current.map((item) =>
          item.id === animal.id
            ? {
                ...item,
                running: false,
              }
            : item
        )
      );

      setMessage("");
    }, 1900);
  };

  /* -------------------------------------------------------
     PET NAMING
  ------------------------------------------------------- */

  const currentPetName = selectedAnimal
    ? petNames[selectedAnimal.id] || ""
    : "";

  const setCurrentPetName = (value) => {
    if (!selectedAnimal) return;

    setPetNames((current) => ({
      ...current,
      [selectedAnimal.id]: value,
    }));
  };

  /* -------------------------------------------------------
     FEED
  ------------------------------------------------------- */

  const feedAnimal = () => {
    if (!selectedAnimal) return;

    playAnimalSound(selectedAnimal.type);

    setMessage(
      `${currentPetName || selectedAnimal.species} enjoyed the ${food.toLowerCase()}! 🌿`
    );

    setTimeout(() => setMessage(""), 2200);
  };

  return (
    <div
      className={[
        "forest-app",
        `phase-${phase}`,
        `weather-${weather.toLowerCase()}`,
      ].join(" ")}
    >
      <ForestAudio
        phase={phase}
        weather={weather}
        enabled={soundOn}
      />

      {/* ===================================================
          MENU BUTTON
      =================================================== */}

      <button
        className={`forest-menu-toggle ${
          menuOpen ? "open" : ""
        }`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Open forest menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`forest-sidebar ${
          menuOpen ? "visible" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-leaf">🌿</div>

          <div>
            <strong>GREEN PULSE</strong>
            <small>FOREST WORLD</small>
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
          <small>WORLD</small>

          <button
            className={`menu-link ${
              soundOn ? "enabled" : ""
            }`}
            onClick={() => setSoundOn((v) => !v)}
          >
            <span>{soundOn ? "🔊" : "🔇"}</span>
            Forest sounds
          </button>

          <button
            className={`menu-link ${
              showAnimals ? "enabled" : ""
            }`}
            onClick={() => setShowAnimals((v) => !v)}
          >
            <span>🦌</span>
            Wildlife
          </button>

          <button
            className={`menu-link ${
              showMist ? "enabled" : ""
            }`}
            onClick={() => setShowMist((v) => !v)}
          >
            <span>〰</span>
            Atmosphere
          </button>

          <button
            className="menu-link"
            onClick={updateWeather}
          >
            <span>☁</span>
            Change weather
          </button>
        </div>

        <div className="sidebar-time">
          <span>LOCAL TIME</span>

          <strong>
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>

          <em>{phaseText[phase]}</em>
        </div>
      </aside>

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="forest-header">
        <div>
          <div className="forest-kicker">
            GREEN PULSE • DIGITAL FOREST
          </div>

          <h1>The Living Forest</h1>

          <p>
            Turn left or right. Explore. Discover wildlife.
            Learn about nature.
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

      {/* ===================================================
          GAME WORLD
      =================================================== */}

      <main className="forest-game">
        <div
          className="forest-world"
          style={{
            "--world-shift": `${worldPosition}%`,
          }}
        >
          {/* SKY */}

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

          {/* DISTANT FOREST */}

          <div className="far-forest">
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={i}
                style={{
                  left: `${i * 6}%`,
                  height: `${30 + (i % 5) * 9}%`,
                }}
              />
            ))}
          </div>

          {/* MAIN TREE CANOPY */}

          <div className="deep-canopy">
            {Array.from({ length: 15 }, (_, i) => (
              <span
                key={i}
                style={{
                  left: `${i * 7}%`,
                  transform: `scale(${
                    0.65 + (i % 4) * 0.12
                  })`,
                }}
              />
            ))}
          </div>

          {/* WALKING PATH */}

          <div className="forest-path">
            <div className="path-light" />
          </div>

          {/* RIVER */}

          <div className="river">
            <div className="river-shimmer shimmer-1" />
            <div className="river-shimmer shimmer-2" />
            <div className="river-shimmer shimmer-3" />

            <span className="river-label">
              River
            </span>
          </div>

          {/* WORLD OBJECTS */}

          <WorldTrees
            onInfo={(object) => setSelectedInfo(object)}
          />

          {/* ANIMALS */}

          {showAnimals && (
            <div className="animal-layer">
              {animals.map((animal) => (
                <Animal
                  key={animal.id}
                  animal={animal}
                  phase={phase}
                  petName={petNames[animal.id]}
                  onInteract={interactAnimal}
                  onInfo={(item) =>
                    setSelectedInfo(item)
                  }
                />
              ))}
            </div>
          )}

          {/* GROUND DETAILS */}

          <div className="ground-details">
            {Array.from({ length: 30 }, (_, i) => (
              <span
                key={i}
                className="grass-blade"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: `${4 + Math.random() * 12}%`,
                  transform: `rotate(${
                    -25 + Math.random() * 50
                  }deg)`,
                }}
              />
            ))}
          </div>

          {/* ATMOSPHERE */}

          {showMist && (
            <>
              <div className="mist mist-one" />
              <div className="mist mist-two" />
              <div className="mist mist-three" />
            </>
          )}

          {isNight && <Fireflies count={80} />}

          {isRain && <Rain />}

          {isFog && <div className="heavy-fog" />}

          <div className="night-overlay" />
          <div className="world-vignette" />
        </div>

        {/* =================================================
            EXPLORATION CONTROLS
        ================================================= */}

        <div className="explore-controls">
          <button
            onClick={() => moveWorld("left")}
          >
            <span>←</span>
            Turn Left
          </button>

          <div className="explore-location">
            <small>FOREST PATH</small>
            <strong>
              {worldPosition < 35
                ? "Western Trail"
                : worldPosition > 65
                ? "Eastern Trail"
                : "Central Forest"}
            </strong>
          </div>

          <button
            onClick={() => moveWorld("right")}
          >
            Turn Right
            <span>→</span>
          </button>
        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="game-message">
            {message}
          </div>
        )}

        {/* =================================================
            PET PANEL
        ================================================= */}

        <PetPanel
          selectedAnimal={selectedAnimal}
          petName={currentPetName}
          setPetName={setCurrentPetName}
          food={food}
          setFood={setFood}
          onFeed={feedAnimal}
        />

        {/* =================================================
            INFO CARD
        ================================================= */}

        <InfoCard
          item={selectedInfo}
          onClose={() => setSelectedInfo(null)}
        />
      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="forest-footer">
        <span>🌿 GREEN PULSE</span>

        <span>
          Explore • Discover • Learn • Protect
        </span>

        <button
          onClick={() => setSoundOn((v) => !v)}
        >
          {soundOn
            ? "🔊 Sound ON"
            : "🔇 Enable forest sounds"}
        </button>
      </footer>
    </div>
  );
}