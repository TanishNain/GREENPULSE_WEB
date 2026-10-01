import { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";
import { getToken, logout } from "./auth.js";

/*
============================================================
GREEN PULSE — LIVING FOREST ENGINE
============================================================

Visual assets:

public/
└── forest/
    ├── scenes/
    │   ├── meadow-4k.webp
    │   ├── meadow-depth.webp
    │   ├── meadow-foreground.webp
    │   ├── woodland-4k.webp
    │   ├── woodland-depth.webp
    │   ├── woodland-foreground.webp
    │   ├── river-4k.webp
    │   ├── river-depth.webp
    │   ├── river-foreground.webp
    │   ├── deep-forest-4k.webp
    │   ├── deep-forest-depth.webp
    │   ├── deep-forest-foreground.webp
    │   ├── clearing-4k.webp
    │   ├── clearing-depth.webp
    │   ├── clearing-foreground.webp
    │   ├── ancient-forest-4k.webp
    │   ├── ancient-forest-depth.webp
    │   ├── ancient-forest-foreground.webp
    │   ├── night-sanctuary-4k.webp
    │   ├── night-sanctuary-depth.webp
    │   └── night-sanctuary-foreground.webp
    │
    ├── animals/
    │   ├── deer.webp
    │   ├── deer.mp3
    │   ├── peacock.webp
    │   ├── peacock.mp3
    │   ├── squirrel.webp
    │   ├── squirrel.mp3
    │   ├── rabbit.webp
    │   ├── rabbit.mp3
    │   ├── owl.webp
    │   ├── owl.mp3
    │   ├── fox.webp
    │   ├── fox.mp3
    │   ├── elephant.webp
    │   ├── elephant.mp3
    │   ├── butterfly.webp
    │   └── firefly.webp
    │
    └── ambience/
        ├── meadow.mp3
        ├── woodland.mp3
        ├── river.mp3
        ├── deep-forest.mp3
        ├── clearing.mp3
        ├── ancient-forest.mp3
        └── night.mp3

React controls:
- ecosystem progression
- forest stages
- action unlocks
- day/night
- sunrise / sunset
- weather
- rain
- fog
- storm
- clouds
- wildlife
- fireflies
- butterflies
- birds
- ambient audio
- animal sounds
- forest voice
- existing GreenPulse API
- responsive navigation
============================================================
*/

const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://greenpulse-web-tc0g.onrender.com";

/* ============================================================
   WORLD DATA
============================================================ */

const scenes = [
  {
    id: "meadow",
    number: "01",
    title: "The Meadow",
    subtitle: "Every forest begins with a small beginning.",
    background: "/forest/scenes/meadow-4k.webp",
    depth: "/forest/scenes/meadow-depth.webp",
    foreground: "/forest/scenes/meadow-foreground.webp",
    ambient: "/forest/ambience/meadow.mp3",
    unlock: 0,
  },

  {
    id: "woodland",
    number: "02",
    title: "The Woodland",
    subtitle: "Small actions begin to create a living ecosystem.",
    background: "/forest/scenes/woodland-4k.webp",
    depth: "/forest/scenes/woodland-depth.webp",
    foreground: "/forest/scenes/woodland-foreground.webp",
    ambient: "/forest/ambience/woodland.mp3",
    unlock: 10,
  },

  {
    id: "river",
    number: "03",
    title: "The Living Stream",
    subtitle: "Water carries life deeper into your forest.",
    background: "/forest/scenes/river-4k.webp",
    depth: "/forest/scenes/river-depth.webp",
    foreground: "/forest/scenes/river-foreground.webp",
    ambient: "/forest/ambience/river.mp3",
    unlock: 20,
  },

  {
    id: "deep",
    number: "04",
    title: "Deep Forest",
    subtitle: "Your ecosystem is becoming richer and more resilient.",
    background: "/forest/scenes/deep-forest-4k.webp",
    depth: "/forest/scenes/deep-forest-depth.webp",
    foreground: "/forest/scenes/deep-forest-foreground.webp",
    ambient: "/forest/ambience/deep-forest.mp3",
    unlock: 30,
  },

  {
    id: "clearing",
    number: "05",
    title: "The Clearing",
    subtitle: "Sunlight reaches everything you've helped grow.",
    background: "/forest/scenes/clearing-4k.webp",
    depth: "/forest/scenes/clearing-depth.webp",
    foreground: "/forest/scenes/clearing-foreground.webp",
    ambient: "/forest/ambience/clearing.mp3",
    unlock: 40,
  },

  {
    id: "ancient",
    number: "06",
    title: "Ancient Forest",
    subtitle: "Your forest has become a world of its own.",
    background: "/forest/scenes/ancient-forest-4k.webp",
    depth: "/forest/scenes/ancient-forest-depth.webp",
    foreground: "/forest/scenes/ancient-forest-foreground.webp",
    ambient: "/forest/ambience/ancient-forest.mp3",
    unlock: 60,
  },

  {
    id: "sanctuary",
    number: "07",
    title: "Night Sanctuary",
    subtitle: "When the world goes quiet, your forest keeps living.",
    background: "/forest/scenes/night-sanctuary-4k.webp",
    depth: "/forest/scenes/night-sanctuary-depth.webp",
    foreground: "/forest/scenes/night-sanctuary-foreground.webp",
    ambient: "/forest/ambience/night.mp3",
    unlock: 75,
  },
];

/* ============================================================
   ANIMALS
============================================================ */

const animals = [
  {
    id: "deer",
    name: "Spotted Deer",
    image: "/forest/animals/deer.webp",
    sound: "/forest/animals/deer.mp3",
    unlock: 15,
    scene: ["woodland", "deep", "ancient"],
    className: "animal-deer",
  },

  {
    id: "peacock",
    name: "Indian Peafowl",
    image: "/forest/animals/peacock.webp",
    sound: "/forest/animals/peacock.mp3",
    unlock: 10,
    scene: ["meadow", "woodland", "clearing"],
    className: "animal-peacock",
  },

  {
    id: "squirrel",
    name: "Squirrel",
    image: "/forest/animals/squirrel.webp",
    sound: "/forest/animals/squirrel.mp3",
    unlock: 5,
    scene: ["meadow", "woodland", "clearing"],
    className: "animal-squirrel",
  },

  {
    id: "rabbit",
    name: "Rabbit",
    image: "/forest/animals/rabbit.webp",
    sound: "/forest/animals/rabbit.mp3",
    unlock: 8,
    scene: ["meadow", "clearing"],
    className: "animal-rabbit",
  },

  {
    id: "owl",
    name: "Forest Owl",
    image: "/forest/animals/owl.webp",
    sound: "/forest/animals/owl.mp3",
    unlock: 30,
    scene: ["deep", "ancient", "sanctuary"],
    className: "animal-owl",
    nightOnly: true,
  },

  {
    id: "fox",
    name: "Red Fox",
    image: "/forest/animals/fox.webp",
    sound: "/forest/animals/fox.mp3",
    unlock: 40,
    scene: ["deep", "ancient", "sanctuary"],
    className: "animal-fox",
  },

  {
    id: "elephant",
    name: "Asian Elephant",
    image: "/forest/animals/elephant.webp",
    sound: "/forest/animals/elephant.mp3",
    unlock: 60,
    scene: ["ancient"],
    className: "animal-elephant",
  },

  {
    id: "butterfly",
    name: "Butterfly",
    image: "/forest/animals/butterfly.webp",
    sound: null,
    unlock: 3,
    scene: ["meadow", "clearing", "woodland"],
    className: "animal-butterfly",
  },

  {
    id: "firefly",
    name: "Fireflies",
    image: "/forest/animals/firefly.webp",
    sound: null,
    unlock: 25,
    scene: ["deep", "ancient", "sanctuary"],
    className: "animal-firefly",
    nightOnly: true,
  },
];

/* ============================================================
   HELPERS
============================================================ */

function getStageNumber(forest) {
  const stage =
    forest?.stage ??
    forest?.forest_stage ??
    forest?.current_stage ??
    1;

  if (typeof stage === "number") {
    return Math.max(1, Math.min(6, stage));
  }

  const value = String(stage).toLowerCase();

  if (value.includes("guardian")) return 6;
  if (value.includes("thriving")) return 5;
  if (value.includes("deep")) return 4;
  if (value.includes("growing")) return 3;
  if (value.includes("young")) return 2;

  return 1;
}

function getActions(forest) {
  const value =
    forest?.stats?.forest_actions ??
    forest?.progress?.forest_actions ??
    forest?.forest_actions ??
    forest?.actions ??
    0;

  const numeric = Number(value);

  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

function getWeatherClass(weather) {
  if (!weather) {
    return "weather-clear";
  }

  const condition = String(
    weather.condition ||
      weather.weather ||
      weather.description ||
      ""
  ).toLowerCase();

  if (
    condition.includes("storm") ||
    condition.includes("thunder") ||
    condition.includes("lightning")
  ) {
    return "weather-storm";
  }

  if (
    condition.includes("rain") ||
    condition.includes("drizzle") ||
    condition.includes("shower")
  ) {
    return "weather-rain";
  }

  if (
    condition.includes("fog") ||
    condition.includes("mist")
  ) {
    return "weather-fog";
  }

  if (
    condition.includes("cloud") ||
    condition.includes("overcast")
  ) {
    return "weather-cloudy";
  }

  return "weather-clear";
}

function getWeatherLabel(weather) {
  if (!weather) {
    return "Weather unavailable";
  }

  return (
    weather.condition ||
    weather.description ||
    weather.weather ||
    "Clear"
  );
}

function getTemperature(weather) {
  if (!weather) {
    return null;
  }

  const temperature =
    weather.temperature ??
    weather.temperature_2m ??
    weather.temp ??
    weather.temp_c;

  const numeric = Number(temperature);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.round(numeric);
}

function getWeatherIcon(weather, isNight) {
  if (isNight) {
    const value = String(
      weather?.condition ||
        weather?.weather ||
        weather?.description ||
        ""
    ).toLowerCase();

    if (
      value.includes("storm") ||
      value.includes("rain")
    ) {
      return "🌧️";
    }

    return "🌙";
  }

  const value = String(
    weather?.condition ||
      weather?.weather ||
      weather?.description ||
      ""
  ).toLowerCase();

  if (
    value.includes("storm") ||
    value.includes("thunder")
  ) {
    return "⛈️";
  }

  if (
    value.includes("rain") ||
    value.includes("drizzle") ||
    value.includes("shower")
  ) {
    return "🌧️";
  }

  if (
    value.includes("fog") ||
    value.includes("mist")
  ) {
    return "🌫️";
  }

  if (
    value.includes("cloud") ||
    value.includes("overcast")
  ) {
    return "☁️";
  }

  return "☀️";
}

function isUnlocked(item, actions, stage) {
  return (
    item.unlock === 0 ||
    actions >= item.unlock ||
    stage >= Math.ceil(item.unlock / 15)
  );
}

/* ============================================================
   REAL LOCAL DAY / NIGHT PHASE
============================================================ */

function getDayPhase() {
  const now = new Date();

  const minutes =
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60;

  /*
    Approximate natural phases:

    05:30 - 07:00 = dawn
    07:00 - 12:00 = morning
    12:00 - 17:00 = day
    17:00 - 19:00 = sunset
    19:00 - 05:30 = night
  */

  if (minutes < 330) {
    return "night";
  }

  if (minutes < 420) {
    return "dawn";
  }

  if (minutes < 720) {
    return "morning";
  }

  if (minutes < 1020) {
    return "day";
  }

  if (minutes < 1140) {
    return "sunset";
  }

  return "night";
}

/* ============================================================
   AMBIENT AUDIO
============================================================ */

function AmbientAudio({
  scene,
  muted,
  volume = 0.28,
}) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!scene?.ambient) {
      return undefined;
    }

    const audio = new Audio(scene.ambient);

    audio.loop = true;
    audio.preload = "auto";
    audio.volume = muted ? 0 : volume;

    audioRef.current = audio;

    if (!muted) {
      audio
        .play()
        .catch(() => {
          /*
            Browser autoplay protection.
            User can enable sound with the sound button.
          */
        });
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
      audioRef.current = null;
    };
  }, [scene, volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (muted) {
      audio.pause();
      return;
    }

    audio.volume = volume;

    audio
      .play()
      .catch(() => {});
  }, [muted, volume]);

  return null;
}

/* ============================================================
   ANIMAL
============================================================ */

function Animal({
  animal,
  scene,
  actions,
  stage,
  isNight,
  onSound,
}) {
  if (!animal.scene.includes(scene.id)) {
    return null;
  }

  if (!isUnlocked(animal, actions, stage)) {
    return null;
  }

  if (animal.nightOnly && !isNight) {
    return null;
  }

  return (
    <button
      type="button"
      className={`forest-animal ${animal.className}`}
      aria-label={`See ${animal.name}`}
      onClick={() => onSound(animal)}
    >
      <img
        src={animal.image}
        alt=""
        draggable="false"
      />

      <span className="animal-name">
        {animal.name}
      </span>
    </button>
  );
}

/* ============================================================
   FIREFLIES
============================================================ */

function Fireflies({ visible }) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="fireflies"
      aria-hidden="true"
    >
      {Array.from({ length: 55 }).map(
        (_, index) => (
          <i
            key={index}
            style={{
              left: `${3 + ((index * 29) % 94)}%`,
              top: `${12 + ((index * 47) % 76)}%`,
              animationDelay: `${(index % 13) * -0.7}s`,
              animationDuration: `${
                2.8 + (index % 6) * 0.55
              }s`,
            }}
          />
        )
      )}
    </div>
  );
}

/* ============================================================
   RAIN
============================================================ */

function Rain({
  active,
  storm = false,
}) {
  if (!active) {
    return null;
  }

  const count = storm ? 130 : 85;

  return (
    <div
      className={`rain-system ${
        storm ? "rain-heavy" : ""
      }`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map(
        (_, index) => (
          <i
            key={index}
            style={{
              left: `${(index * 17) % 100}%`,
              animationDelay: `${
                -(index % 20) * 0.15
              }s`,
              animationDuration: `${
                0.55 + (index % 8) * 0.08
              }s`,
            }}
          />
        )
      )}
    </div>
  );
}

/* ============================================================
   BIRDS
============================================================ */

function BirdFlock({
  active,
  count = 7,
}) {
  if (!active) {
    return null;
  }

  return (
    <div
      className="bird-flock"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map(
        (_, index) => (
          <span
            key={index}
            className={`bird bird-${String.fromCharCode(
              97 + index
            )}`}
          >
            ⌁
          </span>
        )
      )}
    </div>
  );
}

/* ============================================================
   BUTTERFLIES
============================================================ */

function ButterflyLayer({
  active,
  count = 12,
}) {
  if (!active) {
    return null;
  }

  return (
    <div
      className="butterfly-layer"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map(
        (_, index) => (
          <span
            key={index}
            style={{
              left: `${5 + ((index * 31) % 88)}%`,
              top: `${30 + ((index * 19) % 55)}%`,
              animationDelay: `${-(index * 1.2)}s`,
              animationDuration: `${
                7 + (index % 5) * 1.4
              }s`,
            }}
          >
            🦋
          </span>
        )
      )}
    </div>
  );
}

/* ============================================================
   WEATHER EFFECTS
============================================================ */

function WeatherEffects({
  weather,
  isNight,
}) {
  const weatherClass =
    getWeatherClass(weather);

  const raining =
    weatherClass === "weather-rain" ||
    weatherClass === "weather-storm";

  const storm =
    weatherClass === "weather-storm";

  return (
    <>
      <div
        className={`weather-overlay ${weatherClass}`}
        aria-hidden="true"
      />

      <Rain
        active={raining}
        storm={storm}
      />

      {weatherClass === "weather-fog" && (
        <div
          className="heavy-fog"
          aria-hidden="true"
        />
      )}

      {weatherClass === "weather-cloudy" && (
        <div
          className="weather-cloud-bank"
          aria-hidden="true"
        />
      )}

      {isNight && (
        <div
          className="moonlight"
          aria-hidden="true"
        />
      )}

      {storm && (
        <div
          className="storm-vignette"
          aria-hidden="true"
        />
      )}
    </>
  );
}

/* ============================================================
   SCENE
============================================================ */

function ForestScene({
  scene,
  index,
  actions,
  stage,
  weather,
  isNight,
  dayPhase,
  onAnimalSound,
}) {
  const unlocked =
    actions >= scene.unlock ||
    stage >= index + 1 ||
    index === 0;

  const animalsForScene =
    animals.filter((animal) =>
      animal.scene.includes(scene.id)
    );

  const hasButterflies =
    !isNight &&
    ["meadow", "woodland", "clearing"].includes(
      scene.id
    ) &&
    actions >= 3;

  const hasBirds =
    !isNight &&
    ["meadow", "woodland", "clearing"].includes(
      scene.id
    );

  const hasFireflies =
    isNight &&
    ["deep", "ancient", "sanctuary"].includes(
      scene.id
    ) &&
    actions >= 25;

  const remainingActions = Math.max(
    0,
    scene.unlock - actions
  );

  return (
    <section
      id={`scene-${scene.id}`}
      className={[
        "living-scene",
        `scene-${scene.id}`,
        `scene-index-${index}`,
        `scene-phase-${dayPhase}`,
        unlocked
          ? "scene-alive"
          : "scene-locked",
      ].join(" ")}
      data-scene={scene.id}
    >
      {/* ==================================================
          REAL BACKGROUND ART
         ================================================== */}

      <div
        className="scene-background"
        aria-hidden="true"
      >
        <img
          src={scene.background}
          alt=""
          draggable="false"
          loading={index > 1 ? "lazy" : "eager"}
        />
      </div>

      {/* ==================================================
          DEPTH ART
         ================================================== */}

      <div
        className="scene-depth"
        aria-hidden="true"
      >
        <img
          src={scene.depth}
          alt=""
          draggable="false"
          loading="lazy"
        />
      </div>

      {/* ==================================================
          ATMOSPHERIC LIGHT
         ================================================== */}

      <div
        className="scene-light"
        aria-hidden="true"
      />

      <div
        className="scene-haze"
        aria-hidden="true"
      />

      {/* ==================================================
          REAL FOREGROUND ART
         ================================================== */}

      <div
        className="scene-foreground"
        aria-hidden="true"
      >
        <img
          src={scene.foreground}
          alt=""
          draggable="false"
          loading="lazy"
        />
      </div>

      {/* ==================================================
          WILDLIFE
         ================================================== */}

      <div
        className="wildlife-layer"
        aria-label="Forest wildlife"
      >
        {animalsForScene.map(
          (animal) => (
            <Animal
              key={`${scene.id}-${animal.id}`}
              animal={animal}
              scene={scene}
              actions={actions}
              stage={stage}
              isNight={isNight}
              onSound={onAnimalSound}
            />
          )
        )}
      </div>

      {/* ==================================================
          FIREFLIES
         ================================================== */}

      <Fireflies
        visible={hasFireflies}
      />

      {/* ==================================================
          BIRDS
         ================================================== */}

      <BirdFlock
        active={hasBirds}
        count={7}
      />

      {/* ==================================================
          BUTTERFLIES
         ================================================== */}

      <ButterflyLayer
        active={hasButterflies}
        count={12}
      />

      {/* ==================================================
          SCENE UI
         ================================================== */}

      <div className="scene-ui">
        <div className="scene-index">
          {scene.number}
        </div>

        <div className="scene-copy">
          <span className="scene-kicker">
            GREEN PULSE ECOSYSTEM
          </span>

          <h2>{scene.title}</h2>

          <p>{scene.subtitle}</p>

          <div className="scene-state">
            {unlocked ? (
              <>
                <span className="state-dot" />
                ECOSYSTEM ALIVE
              </>
            ) : (
              <>
                <span>🔒</span>
                {remainingActions} more actions
                to discover this region
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          RIVER INFORMATION
         ================================================== */}

      {scene.id === "river" &&
        unlocked && (
          <div className="ecosystem-card river-card">
            <small>WATER SYSTEM</small>

            <strong>FLOWING</strong>

            <span>
              A healthy stream has entered
              your ecosystem.
            </span>
          </div>
        )}

      {/* ==================================================
          ANCIENT FOREST INFORMATION
         ================================================== */}

      {scene.id === "ancient" &&
        unlocked && (
          <div className="ecosystem-card ancient-card">
            <small>FOREST STAGE</small>

            <strong>
              {stage}/6
            </strong>

            <span>
              Mature habitat unlocked.
            </span>
          </div>
        )}

      {/* ==================================================
          NIGHT INFORMATION
         ================================================== */}

      {scene.id === "sanctuary" &&
        unlocked && (
          <div className="night-card">
            <span className="night-card-icon">
              ✦
            </span>

            <div>
              <small>
                NIGHT SANCTUARY
              </small>

              <strong>
                The forest is still alive.
              </strong>
            </div>
          </div>
        )}

      {/* ==================================================
          LOCKED REGION
         ================================================== */}

      {!unlocked && (
        <div className="locked-scene">
          <span>🔒</span>

          <strong>
            Region undiscovered
          </strong>

          <small>
            Continue your GreenPulse actions
          </small>
        </div>
      )}

      {/* ==================================================
          SCENE EDGE / TRANSITION
         ================================================== */}

      {index < scenes.length - 1 && (
        <div
          className="scene-transition"
          aria-hidden="true"
        >
          <span />
        </div>
      )}

      {/* ==================================================
          SCENE NUMBER MARKER
         ================================================== */}

      <div
        className="scene-location-marker"
        aria-hidden="true"
      >
        <span>REGION</span>
        <strong>{scene.number}</strong>
      </div>

      {/* ==================================================
          WEATHER TEMPERATURE
         ================================================== */}

      {weather &&
        getTemperature(weather) !== null && (
          <div
            className="scene-temperature"
            aria-label={`Temperature ${getTemperature(
              weather
            )} degrees`}
          >
            {getTemperature(weather)}°
          </div>
        )}
    </section>
  );
}

/* ============================================================
   LOADING SCREEN
============================================================ */

function LoadingScreen() {
  return (
    <div className="forest-loading-screen">
      <div
        className="loading-forest-image"
        aria-hidden="true"
      />

      <div className="loading-atmosphere" />

      <div className="loading-content">
        <div className="loading-seed">
          🌱
        </div>

        <span className="loading-brand">
          GREEN PULSE
        </span>

        <h1>
          Growing your forest...
        </h1>

        <p>
          Connecting to your living ecosystem
        </p>

        <div
          className="loading-progress"
          aria-hidden="true"
        >
          <i />
        </div>

        <small>
          Preparing wildlife • atmosphere •
          weather
        </small>
      </div>
    </div>
  );
}

/* ============================================================
   ERROR SCREEN
============================================================ */

function ErrorScreen({
  error,
  onRetry,
}) {
  return (
    <div className="forest-error-screen">
      <div className="forest-error-panel">
        <div className="error-tree">
          🌲
        </div>

        <span className="error-brand">
          GREEN PULSE
        </span>

        <h1>
          Forest temporarily unavailable
        </h1>

        <p>{error}</p>

        <button
          type="button"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN FOREST
============================================================ */

export default function Forest() {
  const [forest, setForest] =
    useState(null);

  const [weather, setWeather] =
    useState(null);

  const [season, setSeason] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [muted, setMuted] =
    useState(true);

  const [volume, setVolume] =
    useState(0.28);

  const [dayPhase, setDayPhase] =
    useState(getDayPhase());

  const [selectedAnimal, setSelectedAnimal] =
    useState(null);

  const [currentSceneId, setCurrentSceneId] =
    useState("meadow");

  const worldRef = useRef(null);

  const sceneObserverRef =
    useRef(null);

  /* ========================================================
     LOAD FOREST DATA
  ======================================================== */

  async function loadForest() {
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    setLoading(true);
    setError("");

    try {
      /* ----------------------------------------------------
         FOREST
      ---------------------------------------------------- */

      const forestResponse =
        await fetch(
          `${API}/api/forest?token=${encodeURIComponent(
            token
          )}`
        );

      if (
        forestResponse.status === 401
      ) {
        logout();
        return;
      }

      if (!forestResponse.ok) {
        throw new Error(
          "Forest request failed"
        );
      }

      const forestData =
        await forestResponse.json();

      setForest(forestData);

      /* ----------------------------------------------------
         WEATHER
      ---------------------------------------------------- */

      try {
        const weatherResponse =
          await fetch(
            `${API}/api/forest/weather?token=${encodeURIComponent(
              token
            )}`
          );

        if (weatherResponse.ok) {
          const weatherData =
            await weatherResponse.json();

          setWeather(weatherData);
        }
      } catch (weatherError) {
        console.warn(
          "Weather unavailable",
          weatherError
        );
      }

      /* ----------------------------------------------------
         SEASON
      ---------------------------------------------------- */

      try {
        const seasonResponse =
          await fetch(
            `${API}/api/forest/season?token=${encodeURIComponent(
              token
            )}`
          );

        if (seasonResponse.ok) {
          const seasonData =
            await seasonResponse.json();

          setSeason(seasonData);
        }
      } catch (seasonError) {
        console.warn(
          "Season unavailable",
          seasonError
        );
      }
    } catch (err) {
      console.error(
        "GreenPulse forest error:",
        err
      );

      setError(
        "Your forest could not be loaded right now."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadForest();
  }, []);

  /* ========================================================
     REAL-TIME DAY PHASE
  ======================================================== */

  useEffect(() => {
    const updatePhase = () => {
      setDayPhase(getDayPhase());
    };

    updatePhase();

    const timer =
      setInterval(
        updatePhase,
        30000
      );

    return () =>
      clearInterval(timer);
  }, []);

  /* ========================================================
     OBSERVE WHICH SCENE IS VISIBLE
  ======================================================== */

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    const world =
      worldRef.current;

    if (!world) {
      return undefined;
    }

    const sections =
      world.querySelectorAll(
        ".living-scene"
      );

    if (!sections.length) {
      return undefined;
    }

    sceneObserverRef.current =
      new IntersectionObserver(
        (entries) => {
          const visibleEntries =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting
              )
              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio
              );

          if (
            visibleEntries.length
          ) {
            const scene =
              visibleEntries[0].target.dataset
                .scene;

            if (scene) {
              setCurrentSceneId(
                scene
              );
            }
          }
        },
        {
          root: null,
          threshold: [
            0.2,
            0.4,
            0.6,
            0.8,
          ],
        }
      );

    sections.forEach(
      (section) => {
        sceneObserverRef.current.observe(
          section
        );
      }
    );

    return () => {
      sceneObserverRef.current?.disconnect();
      sceneObserverRef.current = null;
    };
  }, [loading]);

  /* ========================================================
     CLOSE MOBILE MENU WHEN ESC IS PRESSED
  ======================================================== */

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSelectedAnimal(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, []);

  /* ========================================================
     DERIVED FOREST VALUES
  ======================================================== */

  const stage =
    getStageNumber(forest);

  const actions =
    getActions(forest);

  /*
    Weather's is_day is respected when supplied.
    Otherwise local browser time controls
    day/night.
  */

  const weatherSaysNight =
    weather?.is_day === 0 ||
    weather?.is_day === false;

  const isNight =
    weatherSaysNight ||
    dayPhase === "night";

  const weatherClass =
    getWeatherClass(weather);

  /* ========================================================
     CURRENT SCENE
  ======================================================== */

  const currentScene =
    useMemo(() => {
      return (
        scenes.find(
          (scene) =>
            scene.id ===
            currentSceneId
        ) || scenes[0]
      );
    }, [currentSceneId]);

  /* ========================================================
     PROGRESS
  ======================================================== */

  const progress =
    Math.min(
      100,
      Math.round(
        (actions / 100) * 100
      )
    );

  /* ========================================================
     UNLOCKED ANIMALS
  ======================================================== */

  const unlockedAnimals =
    animals.filter(
      (animal) =>
        isUnlocked(
          animal,
          actions,
          stage
        )
    );

  /* ========================================================
     NEXT REGION
  ======================================================== */

  const nextScene =
    scenes.find(
      (scene) =>
        actions < scene.unlock
    );

  /* ========================================================
     SCROLL
  ======================================================== */

  function scrollTo(id) {
    const element =
      document.getElementById(
        `scene-${id}`
      );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setCurrentSceneId(id);
    setMenuOpen(false);
  }

  /* ========================================================
     ANIMAL SOUND
  ======================================================== */

  function playAnimalSound(
    animal
  ) {
    setSelectedAnimal(animal);

    if (!animal.sound) {
      return;
    }

    if (muted) {
      return;
    }

    const sound =
      new Audio(animal.sound);

    sound.volume =
      Math.min(
        1,
        volume + 0.25
      );

    sound
      .play()
      .catch(() => {
        console.warn(
          "Animal audio needs a user interaction."
        );
      });
  }

  /* ========================================================
     FOREST VOICE
  ======================================================== */

  function speakForest() {
    if (
      typeof window ===
        "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const currentRegion =
      currentScene?.title ||
      "your forest";

    const message =
      `Welcome back to your Green Pulse forest. ` +
      `You have completed ${actions} forest actions. ` +
      `Your ecosystem is currently at stage ${stage} of 6. ` +
      `You have discovered ${unlockedAnimals.length} living species. ` +
      `You are exploring ${currentRegion}.`;

    const speech =
      new SpeechSynthesisUtterance(
        message
      );

    speech.rate = 0.9;
    speech.pitch = 0.85;
    speech.volume = 0.85;

    window.speechSynthesis.speak(
      speech
    );
  }

  /* ========================================================
     FULLSCREEN
  ======================================================== */

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (fullscreenError) {
      console.warn(
        "Fullscreen unavailable",
        fullscreenError
      );
    }
  }

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return <LoadingScreen />;
  }

  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={loadForest}
      />
    );
  }

  /* ========================================================
     MAIN WORLD
  ======================================================== */

  return (
    <div
      className={[
        "living-forest-app",
        `phase-${dayPhase}`,
        isNight
          ? "forest-is-night"
          : "forest-is-day",
        weatherClass,
        currentScene
          ? `active-scene-${currentScene.id}`
          : "",
      ].join(" ")}
      data-stage={stage}
      data-actions={actions}
    >
      {/* ==================================================
          MOBILE MENU BUTTON
         ================================================== */}

      <button
        type="button"
        className="forest-mobile-button"
        onClick={() =>
          setMenuOpen(
            (value) => !value
          )
        }
        aria-label={
          menuOpen
            ? "Close forest menu"
            : "Open forest menu"
        }
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {/* ==================================================
          SIDEBAR
         ================================================== */}

      <aside
        className={[
          "forest-sidebar",
          menuOpen
            ? "sidebar-open"
            : "",
        ].join(" ")}
      >
        {/* ------------------------------------------------
           LOGO
        ------------------------------------------------ */}

        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>
              GREEN<span>PULSE</span>
            </strong>

            <small>
              LIVING ECOSYSTEM
            </small>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* ------------------------------------------------
           NAVIGATION
        ------------------------------------------------ */}

        <nav className="forest-navigation">
          <button
            type="button"
            onClick={() =>
              scrollTo("meadow")
            }
          >
            <span className="nav-icon">
              ⌂
            </span>

            <span>
              Home
            </span>
          </button>

          <button
            type="button"
            className="nav-active"
            onClick={() =>
              scrollTo("woodland")
            }
          >
            <span className="nav-icon">
              ◈
            </span>

            <span>
              Forest
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              scrollTo("clearing")
            }
          >
            <span className="nav-icon">
              ✦
            </span>

            <span>
              Challenges
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              scrollTo("river")
            }
          >
            <span className="nav-icon">
              ≋
            </span>

            <span>
              Impact
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              scrollTo("sanctuary")
            }
          >
            <span className="nav-icon">
              ◎
            </span>

            <span>
              Profile
            </span>
          </button>
        </nav>

        {/* ------------------------------------------------
           ECOSYSTEM STATUS
        ------------------------------------------------ */}

        <div className="sidebar-world-status">
          <div className="status-heading">
            YOUR ECOSYSTEM
          </div>

          <div className="sidebar-stat">
            <div>
              <span>
                Actions
              </span>

              <strong>
                {actions}
              </strong>
            </div>

            <div>
              <span>
                Stage
              </span>

              <strong>
                {stage}/6
              </strong>
            </div>
          </div>

          <div
            className="sidebar-progress"
            aria-label={`Forest progress ${progress}%`}
          >
            <span
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <small>
            {unlockedAnimals.length}{" "}
            species discovered
          </small>

          {nextScene && (
            <div className="next-region">
              <span>
                NEXT REGION
              </span>

              <strong>
                {nextScene.title}
              </strong>

              <small>
                {Math.max(
                  0,
                  nextScene.unlock -
                    actions
                )}{" "}
                actions needed
              </small>
            </div>
          )}
        </div>

        {/* ------------------------------------------------
           SIDEBAR CONTROLS
        ------------------------------------------------ */}

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sound-button"
            onClick={() =>
              setMuted(
                (value) => !value
              )
            }
            aria-pressed={!muted}
          >
            <span>
              {muted
                ? "◼"
                : "◉"}
            </span>

            {muted
              ? "Sound off"
              : "Sound on"}
          </button>

          {!muted && (
            <label className="volume-control">
              <span>
                Volume
              </span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) =>
                  setVolume(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                aria-label="Forest sound volume"
              />
            </label>
          )}

          <button
            type="button"
            className="voice-button"
            onClick={
              speakForest
            }
          >
            <span>
              ◌
            </span>

            Forest voice
          </button>

          <button
            type="button"
            className="fullscreen-button"
            onClick={
              toggleFullscreen
            }
          >
            <span>
              ⛶
            </span>

            Fullscreen
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </aside>

      {/* ==================================================
          WORLD
         ================================================== */}

      <main
        ref={worldRef}
        className="forest-world"
      >
        {/* ==================================================
            TOP HUD
           ================================================== */}

        <header className="forest-hud">
          <div className="hud-title">
            <span>
              MY FOREST
            </span>

            <h1>
              A living record
              of your impact.
            </h1>

            <p className="hud-current-region">
              Currently exploring{" "}
              <strong>
                {currentScene.title}
              </strong>
            </p>
          </div>

          <div className="hud-controls">
            {/* WEATHER */}

            <div className="hud-weather">
              <span className="weather-large-icon">
                {getWeatherIcon(
                  weather,
                  isNight
                )}
              </span>

              <div>
                <small>
                  WEATHER
                </small>

                <strong>
                  {getWeatherLabel(
                    weather
                  )}
                </strong>

                {getTemperature(
                  weather
                ) !== null && (
                  <em>
                    {
                      getTemperature(
                        weather
                      )
                    }
                    °C
                  </em>
                )}
              </div>
            </div>

            {/* SEASON */}

            <div className="hud-item">
              <small>
                SEASON
              </small>

              <strong>
                {season?.season ||
                  season?.name ||
                  "—"}
              </strong>
            </div>

            {/* ACTIONS */}

            <div className="hud-item">
              <small>
                ACTIONS
              </small>

              <strong>
                {actions}
              </strong>
            </div>

            {/* STAGE */}

            <div className="hud-item">
              <small>
                STAGE
              </small>

              <strong>
                {stage}/6
              </strong>
            </div>
          </div>
        </header>

        {/* ==================================================
            GLOBAL SKY
           ================================================== */}

        <div
          className="global-sky"
          aria-hidden="true"
        >
          <div className="sun-orb" />

          <div className="sun-rays" />

          <div className="moon-orb" />

          <div className="stars">
            {Array.from({
              length: 80,
            }).map(
              (_, index) => (
                <i
                  key={index}
                  style={{
                    left: `${
                      (index * 37) %
                      100
                    }%`,
                    top: `${
                      (index * 17) %
                      70
                    }%`,
                    animationDelay: `${
                      -(index % 10)
                    }s`,
                  }}
                />
              )
            )}
          </div>

          <div className="global-cloud cloud-one" />
          <div className="global-cloud cloud-two" />
          <div className="global-cloud cloud-three" />
        </div>

        {/* ==================================================
            FOREST STATUS BAR
           ================================================== */}

        <div className="forest-status-strip">
          <div className="status-live">
            <span />
            ECOSYSTEM LIVE
          </div>

          <div>
            {isNight
              ? "NIGHT"
              : "DAY"}
          </div>

          <div>
            {getWeatherLabel(
              weather
            )}
          </div>

          <div>
            {unlockedAnimals.length}{" "}
            SPECIES
          </div>
        </div>

        {/* ==================================================
            SCROLL HINT
           ================================================== */}

        <div className="forest-scroll-hint">
          <span>
            SCROLL TO EXPLORE
          </span>

          <i />
        </div>

        {/* ==================================================
            WORLD SCENES
           ================================================== */}

        <div className="world-scenes">
          {scenes.map(
            (scene, index) => (
              <ForestScene
                key={scene.id}
                scene={scene}
                index={index}
                actions={actions}
                stage={stage}
                weather={weather}
                isNight={isNight}
                dayPhase={dayPhase}
                onAnimalSound={
                  playAnimalSound
                }
              />
            )
          )}
        </div>

        {/* ==================================================
            WEATHER
           ================================================== */}

        <WeatherEffects
          weather={weather}
          isNight={isNight}
        />

        {/* ==================================================
            ANIMAL DISCOVERY POPUP
           ================================================== */}

        {selectedAnimal && (
          <div
            className="animal-popup"
            role="status"
          >
            <button
              type="button"
              className="animal-popup-close"
              onClick={() =>
                setSelectedAnimal(
                  null
                )
              }
              aria-label="Close wildlife information"
            >
              ×
            </button>

            <span>
              WILDLIFE DISCOVERED
            </span>

            <strong>
              {selectedAnimal.name}
            </strong>

            {selectedAnimal.sound ? (
              <small>
                🔊{" "}
                {muted
                  ? "Turn sound on to hear it"
                  : "Animal sound played"}
              </small>
            ) : (
              <small>
                A quiet part of your
                ecosystem.
              </small>
            )}
          </div>
        )}

        {/* ==================================================
            FLOATING ECOSYSTEM HUD
           ================================================== */}

        <div className="floating-ecosystem-card">
          <div className="floating-card-heading">
            <span>
              FOREST HEALTH
            </span>

            <strong>
              {progress}%
            </strong>
          </div>

          <div className="floating-health-bar">
            <span
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="floating-card-meta">
            <span>
              {actions} actions
            </span>

            <span>
              Stage {stage}/6
            </span>
          </div>
        </div>

        {/* ==================================================
            FOOTER
           ================================================== */}

        <footer className="forest-footer">
          <div>
            <strong>
              GREEN PULSE
            </strong>

            <span>
              SMALL ACTIONS. LIVING IMPACT.
            </span>
          </div>

          <div className="footer-stats">
            <span>
              {actions} ecosystem
              actions
            </span>

            <span>
              •
            </span>

            <span>
              {unlockedAnimals.length}{" "}
              species
            </span>

            <span>
              •
            </span>

            <span>
              Forest stage{" "}
              {stage}/6
            </span>
          </div>
        </footer>
      </main>

      {/* ==================================================
          AMBIENT AUDIO
         ================================================== */}

      <AmbientAudio
        scene={currentScene}
        muted={muted}
        volume={volume}
      />
    </div>
  );
}