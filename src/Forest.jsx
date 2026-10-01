import { useEffect, useMemo, useRef, useState } from "react";
import "./Forest.css";
import { getToken, logout } from "./auth.js";

const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://greenpulse-web-tc0g.onrender.com";

/*
  ============================================================
  GREEN PULSE — LIVING FOREST ENGINE
  ============================================================

  Visual assets live in:

  public/
    forest/
      scenes/
      animals/
      ambience/
      ui/

  The React code controls:
    - world progression
    - day/night
    - weather
    - parallax
    - animal appearances
    - fireflies
    - butterflies
    - birds
    - ambient sound
    - animal sound
    - narrator voice
    - existing GreenPulse API
*/

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
    return stage;
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
  return (
    forest?.stats?.forest_actions ??
    forest?.progress?.forest_actions ??
    forest?.forest_actions ??
    forest?.actions ??
    0
  );
}

function getWeatherClass(weather) {
  if (!weather) return "";

  const condition = String(
    weather.condition ||
      weather.weather ||
      weather.description ||
      ""
  ).toLowerCase();

  if (
    condition.includes("storm") ||
    condition.includes("thunder")
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

  if (condition.includes("fog")) {
    return "weather-fog";
  }

  if (condition.includes("cloud")) {
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

function getWeatherIcon(weather, isNight) {
  if (isNight) return "🌙";

  const value = String(
    weather?.condition ||
      weather?.weather ||
      weather?.description ||
      ""
  ).toLowerCase();

  if (value.includes("storm")) return "⛈️";
  if (value.includes("rain")) return "🌧️";
  if (value.includes("cloud")) return "☁️";
  if (value.includes("fog")) return "🌫️";

  return "☀️";
}

function isUnlocked(item, actions, stage) {
  return (
    actions >= item.unlock ||
    stage >= Math.ceil(item.unlock / 15) ||
    item.unlock === 0
  );
}

/* ============================================================
   DAY / NIGHT
   ============================================================ */

function getDayPhase() {
  const now = new Date();
  const minutes =
    now.getHours() * 60 +
    now.getMinutes();

  if (minutes < 330) return "night";
  if (minutes < 420) return "dawn";
  if (minutes < 720) return "morning";
  if (minutes < 1020) return "day";
  if (minutes < 1140) return "sunset";

  return "night";
}

/* ============================================================
   AMBIENT AUDIO
   ============================================================ */

function AmbientAudio({ scene, muted }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!scene?.ambient) return;

    const audio = new Audio(scene.ambient);
    audio.loop = true;
    audio.volume = 0.28;
    audioRef.current = audio;

    if (!muted) {
      audio.play().catch(() => {
        // Browser autoplay protection.
      });
    }

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (muted) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .catch(() => {});
    }
  }, [muted]);

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
  if (!visible) return null;

  return (
    <div className="fireflies" aria-hidden="true">
      {Array.from({ length: 55 }).map((_, index) => (
        <i
          key={index}
          style={{
            left: `${3 + ((index * 29) % 94)}%`,
            top: `${12 + ((index * 47) % 76)}%`,
            animationDelay: `${(index % 13) * -0.7}s`,
            animationDuration: `${2.8 + (index % 6) * 0.55}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   RAIN
   ============================================================ */

function Rain({ active, storm }) {
  if (!active) return null;

  return (
    <div
      className={`rain-system ${
        storm ? "rain-heavy" : ""
      }`}
      aria-hidden="true"
    >
      {Array.from({ length: storm ? 130 : 85 }).map(
        (_, index) => (
          <i
            key={index}
            style={{
              left: `${(index * 17) % 100}%`,
              animationDelay: `${-(index % 20) * 0.15}s`,
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

function BirdFlock({ active }) {
  if (!active) return null;

  return (
    <div className="bird-flock" aria-hidden="true">
      <span className="bird bird-a">⌁</span>
      <span className="bird bird-b">⌁</span>
      <span className="bird bird-c">⌁</span>
      <span className="bird bird-d">⌁</span>
      <span className="bird bird-e">⌁</span>
    </div>
  );
}

/* ============================================================
   BUTTERFLIES
   ============================================================ */

function ButterflyLayer({ active }) {
  if (!active) return null;

  return (
    <div className="butterfly-layer" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          style={{
            left: `${5 + ((index * 31) % 88)}%`,
            top: `${30 + ((index * 19) % 55)}%`,
            animationDelay: `${-(index * 1.2)}s`,
          }}
        >
          🦋
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   WEATHER
   ============================================================ */

function WeatherEffects({
  weather,
  isNight,
}) {
  const weatherClass = getWeatherClass(weather);

  const raining =
    weatherClass === "weather-rain" ||
    weatherClass === "weather-storm";

  const storm =
    weatherClass === "weather-storm";

  return (
    <>
      <div
        className={`weather-overlay ${weatherClass}`}
      />

      <Rain
        active={raining}
        storm={storm}
      />

      {weatherClass === "weather-fog" && (
        <div className="heavy-fog" />
      )}

      {isNight && (
        <div className="moonlight" />
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
  onAnimalSound,
}) {
  const unlocked =
    actions >= scene.unlock ||
    stage >= index + 1 ||
    index === 0;

  const animalsForScene = animals.filter(
    (animal) =>
      animal.scene.includes(scene.id)
  );

  return (
    <section
      id={`scene-${scene.id}`}
      className={`living-scene scene-${scene.id} ${
        unlocked
          ? "scene-alive"
          : "scene-locked"
      }`}
    >
      {/* BACKGROUND */}
      <div className="scene-background">
        <img
          src={scene.background}
          alt=""
          draggable="false"
        />
      </div>

      {/* DEPTH LAYER */}
      <div className="scene-depth">
        <img
          src={scene.depth}
          alt=""
          draggable="false"
        />
      </div>

      {/* COLOR / LIGHT ATMOSPHERE */}
      <div className="scene-light" />

      {/* REAL FOREGROUND ART */}
      <div className="scene-foreground">
        <img
          src={scene.foreground}
          alt=""
          draggable="false"
        />
      </div>

      {/* WILDLIFE */}
      <div className="wildlife-layer">
        {animalsForScene.map(
          (animal) => (
            <Animal
              key={animal.id}
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

      {/* SPECIAL ATMOSPHERE */}
      <Fireflies
        visible={
          isNight &&
          ["deep", "ancient", "sanctuary"].includes(
            scene.id
          )
        }
      />

      <BirdFlock
        active={
          !isNight &&
          ["meadow", "woodland", "clearing"].includes(
            scene.id
          )
        }
      />

      <ButterflyLayer
        active={
          !isNight &&
          ["meadow", "woodland", "clearing"].includes(
            scene.id
          ) &&
          actions >= 3
        }
      />

      {/* SCENE CONTENT */}
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
                {scene.unlock - actions} more
                actions to discover this region
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIVER INFORMATION */}
      {scene.id === "river" && unlocked && (
        <div className="ecosystem-card river-card">
          <small>WATER SYSTEM</small>
          <strong>FLOWING</strong>
          <span>
            A healthy stream has entered your
            ecosystem.
          </span>
        </div>
      )}

      {/* ANCIENT FOREST INFORMATION */}
      {scene.id === "ancient" && unlocked && (
        <div className="ecosystem-card ancient-card">
          <small>FOREST STAGE</small>
          <strong>{stage}/6</strong>
          <span>
            Mature habitat unlocked.
          </span>
        </div>
      )}

      {/* NIGHT INFORMATION */}
      {scene.id === "sanctuary" && unlocked && (
        <div className="night-card">
          <span className="night-card-icon">
            ✦
          </span>

          <div>
            <small>NIGHT SANCTUARY</small>
            <strong>
              The forest is still alive.
            </strong>
          </div>
        </div>
      )}

      {!unlocked && (
        <div className="locked-scene">
          <span>🔒</span>
          <strong>Region undiscovered</strong>
          <small>
            Continue your GreenPulse actions
          </small>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   MAIN FOREST
   ============================================================ */

export default function Forest() {
  const [forest, setForest] = useState(null);
  const [weather, setWeather] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [dayPhase, setDayPhase] = useState(
    getDayPhase()
  );
  const [selectedAnimal, setSelectedAnimal] =
    useState(null);

  const worldRef = useRef(null);

  async function loadForest() {
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const forestResponse = await fetch(
        `${API}/api/forest?token=${encodeURIComponent(
          token
        )}`
      );

      if (forestResponse.status === 401) {
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

      try {
        const weatherResponse =
          await fetch(
            `${API}/api/forest/weather?token=${encodeURIComponent(
              token
            )}`
          );

        if (weatherResponse.ok) {
          setWeather(
            await weatherResponse.json()
          );
        }
      } catch {
        console.warn(
          "Weather unavailable"
        );
      }

      try {
        const seasonResponse =
          await fetch(
            `${API}/api/forest/season?token=${encodeURIComponent(
              token
            )}`
          );

        if (seasonResponse.ok) {
          setSeason(
            await seasonResponse.json()
          );
        }
      } catch {
        console.warn(
          "Season unavailable"
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        "Your forest could not be loaded right now."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForest();
  }, []);

  /* Update real local day phase */
  useEffect(() => {
    const timer = setInterval(() => {
      setDayPhase(getDayPhase());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const stage = getStageNumber(forest);
  const actions = getActions(forest);

  const isNight =
    weather?.is_day === 0 ||
    weather?.is_day === false ||
    dayPhase === "night";

  const currentScene = useMemo(() => {
    let current = scenes[0];

    scenes.forEach((scene) => {
      if (
        actions >= scene.unlock
      ) {
        current = scene;
      }
    });

    return current;
  }, [actions]);

  const progress = Math.min(
    100,
    Math.round(
      (actions / 100) * 100
    )
  );

  const unlockedAnimals = animals.filter(
    (animal) =>
      isUnlocked(
        animal,
        actions,
        stage
      )
  );

  function scrollTo(id) {
    document
      .getElementById(`scene-${id}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    setMenuOpen(false);
  }

  function playAnimalSound(animal) {
    setSelectedAnimal(animal);

    if (!animal.sound) {
      return;
    }

    const sound = new Audio(
      animal.sound
    );

    sound.volume = 0.75;

    sound.play().catch(() => {
      console.warn(
        "Animal audio needs a user interaction."
      );
    });
  }

  function speakForest() {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const message =
      `Welcome back to your Green Pulse forest. ` +
      `You have completed ${actions} forest actions. ` +
      `Your ecosystem is currently at stage ${stage} of 6. ` +
      `You have discovered ${unlockedAnimals.length} living species.`;

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

  if (loading) {
    return (
      <div className="forest-loading-screen">
        <div className="loading-forest-image" />

        <div className="loading-content">
          <div className="loading-seed">
            🌱
          </div>

          <span>
            GREEN PULSE
          </span>

          <h1>
            Growing your forest...
          </h1>

          <p>
            Connecting to your living ecosystem
          </p>

          <div className="loading-progress">
            <i />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forest-error-screen">
        <div className="forest-error-panel">
          <div className="error-tree">
            🌲
          </div>

          <span>
            GREEN PULSE
          </span>

          <h1>
            Forest temporarily unavailable
          </h1>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadForest}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`living-forest-app phase-${dayPhase} ${
        isNight
          ? "forest-is-night"
          : "forest-is-day"
      }`}
    >
      {/* =====================================================
          FIXED SIDEBAR
         ===================================================== */}

      <button
        type="button"
        className="forest-mobile-button"
        onClick={() =>
          setMenuOpen((value) => !value)
        }
        aria-label="Open forest menu"
      >
        <span />
        <span />
        <span />
      </button>

      <aside
        className={`forest-sidebar ${
          menuOpen ? "sidebar-open" : ""
        }`}
      >
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
            <span>Home</span>
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
            <span>Forest</span>
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
            <span>Challenges</span>
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
            <span>Impact</span>
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
            <span>Profile</span>
          </button>
        </nav>

        <div className="sidebar-world-status">
          <div className="status-heading">
            YOUR ECOSYSTEM
          </div>

          <div className="sidebar-stat">
            <div>
              <span>Actions</span>
              <strong>{actions}</strong>
            </div>

            <div>
              <span>Stage</span>
              <strong>
                {stage}/6
              </strong>
            </div>
          </div>

          <div className="sidebar-progress">
            <span
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <small>
            {unlockedAnimals.length} species
            discovered
          </small>
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sound-button"
            onClick={() =>
              setMuted((value) => !value)
            }
          >
            <span>
              {muted ? "◼" : "◉"}
            </span>

            {muted
              ? "Sound off"
              : "Sound on"}
          </button>

          <button
            type="button"
            className="voice-button"
            onClick={speakForest}
          >
            <span>◌</span>
            Forest voice
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

      {/* =====================================================
          WORLD
         ===================================================== */}

      <main
        ref={worldRef}
        className="forest-world"
      >
        {/* TOP HUD */}

        <header className="forest-hud">
          <div className="hud-title">
            <span>
              MY FOREST
            </span>

            <h1>
              A living record of your impact.
            </h1>
          </div>

          <div className="hud-controls">
            <div className="hud-weather">
              <span>
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
              </div>
            </div>

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

            <div className="hud-item">
              <small>
                ACTIONS
              </small>

              <strong>
                {actions}
              </strong>
            </div>
          </div>
        </header>

        {/* DAY / NIGHT ATMOSPHERE */}

        <div className="global-sky">
          <div className="sun-orb" />
          <div className="moon-orb" />

          <div className="stars">
            {Array.from({
              length: 80,
            }).map((_, index) => (
              <i
                key={index}
                style={{
                  left: `${(index * 37) % 100}%`,
                  top: `${(index * 17) % 70}%`,
                  animationDelay: `${
                    -(index % 10)
                  }s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="forest-scroll-hint">
          <span>
            SCROLL TO EXPLORE
          </span>

          <i />
        </div>

        {/* SCENES */}

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
                onAnimalSound={
                  playAnimalSound
                }
              />
            )
          )}
        </div>

        {/* WEATHER */}

        <WeatherEffects
          weather={weather}
          isNight={isNight}
        />

        {/* ANIMAL POPUP */}

        {selectedAnimal && (
          <div className="animal-popup">
            <button
              type="button"
              onClick={() =>
                setSelectedAnimal(null)
              }
            >
              ×
            </button>

            <span>
              WILDLIFE DISCOVERED
            </span>

            <strong>
              {selectedAnimal.name}
            </strong>

            {selectedAnimal.sound && (
              <small>
                🔊 Listen to its sound
              </small>
            )}
          </div>
        )}

        {/* FOOTER */}

        <footer className="forest-footer">
          <div>
            <strong>
              GREEN PULSE
            </strong>

            <span>
              SMALL ACTIONS. LIVING IMPACT.
            </span>
          </div>

          <div>
            <span>
              {actions} ecosystem actions
            </span>

            <span>
              •
            </span>

            <span>
              {unlockedAnimals.length} species
            </span>
          </div>
        </footer>
      </main>

      {/* AUDIO */}

      <AmbientAudio
        scene={currentScene}
        muted={muted}
      />
    </div>
  );
}