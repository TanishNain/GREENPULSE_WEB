import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Forest.css";

/*
  GREEN PULSE — FOREST
  ------------------------------------------------
  Previous Forest concept preserved + upgraded with:

  • Automatic system-time atmosphere
  • Dawn / Day / Dusk / Night
  • Rain / Mystic atmosphere modes
  • Cave
  • Campfire
  • Invisible Guardian storyteller
  • Temporary 3–5 line dialogue
  • Long story progression
  • Guardian voice using browser SpeechSynthesis
  • Forest ambience using Web Audio
  • Live Calculator data
  • Trees based on progress
*/

const DATA_KEY = "greenpulse_year_data";

const LEVELS = [
  { min: 0, name: "Eco Starter", icon: "🌱" },
  { min: 100, name: "Green Explorer", icon: "🍃" },
  { min: 250, name: "Eco Learner", icon: "🌿" },
  { min: 500, name: "Climate Champion", icon: "🌳" },
  { min: 1000, name: "Planet Protector", icon: "🌲" },
  { min: 2000, name: "Green Leader", icon: "🌎" },
  { min: 5000, name: "Earth Guardian", icon: "🌍" },
];

/* ------------------------------------------------
   GUARDIAN STORY
   The story is long, but the interface only
   reveals a few lines at a time.
------------------------------------------------ */

const STORY = [
  {
    speaker: "The Guardian",
    lines: [
      "Long before your roads reached these trees, the forest already knew your footsteps.",
      "It remembered every traveller who came quietly...",
      "and every traveller who took more than they needed.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "Do not look toward the cave.",
      "There is nothing there that wishes to be seen.",
      "Listen instead.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "You hear the fire, don't you?",
      "That fire has burned beneath these stones longer than your oldest stories.",
      "It burns because someone remembers to feed it.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "A forest is not made from trees alone.",
      "It is made from everything that happens between them.",
      "Rain. Silence. Roots. Footsteps. Breath.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "Once, a young traveller came here carrying a bright lantern.",
      "He believed light would make him fearless.",
      "The forest taught him otherwise.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "He walked until the lantern became useless.",
      "Then he sat beneath an old tree.",
      "For the first time, he heard the forest breathing.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "He asked, 'Who is there?'",
      "I did not answer.",
      "He asked again.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "Still, I remained silent.",
      "Some answers become smaller when spoken aloud.",
      "Some mysteries are meant to be experienced.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "At midnight he finally understood.",
      "The forest had never been empty.",
      "He was simply too loud to notice it.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "So he extinguished his lantern.",
      "And beneath the darkness, thousands of tiny lives appeared.",
      "Fireflies. Owls. Beetles. Leaves moving in the wind.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "That was the night he stopped asking what the forest could give him.",
      "He began asking what he could give back.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "Remember this when you leave.",
      "A tree does not ask who planted it.",
      "It simply grows where it is given a chance.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "Your smallest choices are roots.",
      "You may never see how far they travel.",
      "But somewhere, something may grow from them.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "You calculated your footprint.",
      "Good.",
      "But numbers are only the beginning of understanding.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "The real question is what you do after seeing the number.",
      "Will tomorrow repeat today?",
      "Or will something change?",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "Listen carefully.",
      "The wind is changing.",
      "Even the forest knows that nothing remains the same forever.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "If you return here tomorrow, perhaps I will speak again.",
      "Perhaps I will remain silent.",
      "Perhaps you will finally hear me without needing words.",
    ],
  },
  {
    speaker: "The Guardian",
    lines: [
      "I am everywhere.",
      "Never try to see me.",
      "The forest is enough.",
    ],
  },
];

/* ------------------------------------------------
   HELPERS
------------------------------------------------ */

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function readData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getSystemAtmosphere() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

function getLevel(points) {
  let current = LEVELS[0];

  for (const level of LEVELS) {
    if (points >= level.min) {
      current = level;
    }
  }

  return current;
}

function getNextLevel(points) {
  return LEVELS.find((level) => level.min > points) || null;
}

function formatTime() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

/* ------------------------------------------------
   TREE
------------------------------------------------ */

function ForestTree({ size = "normal", x, y, delay = 0, onClick }) {
  return (
    <button
      className={`forest-tree forest-tree-${size}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
      }}
      onClick={onClick}
      aria-label="Forest tree"
    >
      <span className="tree-glow" />
      <span className="tree-crown crown-one" />
      <span className="tree-crown crown-two" />
      <span className="tree-crown crown-three" />
      <span className="tree-trunk" />
    </button>
  );
}

/* ------------------------------------------------
   MAIN COMPONENT
------------------------------------------------ */

export default function Forest() {
  const navigate = useNavigate();

  const [data, setData] = useState(() => readData());

  const [atmosphere, setAtmosphere] = useState(() =>
    getSystemAtmosphere()
  );

  const [manualMode, setManualMode] = useState(false);

  const [selectedTree, setSelectedTree] = useState(null);

  const [guardianSpeaking, setGuardianSpeaking] = useState(false);

  const [storyIndex, setStoryIndex] = useState(-1);

  const [storyLines, setStoryLines] = useState([]);

  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [ambientOn, setAmbientOn] = useState(true);

  const [fireOn, setFireOn] = useState(true);

  const [firePulse, setFirePulse] = useState(false);

  const [rainDrops, setRainDrops] = useState([]);

  const [campfireOpen, setCampfireOpen] = useState(false);

  const audioContextRef = useRef(null);

  const ambientGainRef = useRef(null);

  const fireGainRef = useRef(null);

  const voiceTimerRef = useRef(null);

  /* ---------------------------------------------
     DATA REFRESH
  --------------------------------------------- */

  useEffect(() => {
    const refresh = () => {
      setData(readData());
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("greenpulse:data-updated", refresh);

    const timer = window.setInterval(refresh, 2500);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(
        "greenpulse:data-updated",
        refresh
      );

      window.clearInterval(timer);
    };
  }, []);

  /* ---------------------------------------------
     SYSTEM TIME
  --------------------------------------------- */

  useEffect(() => {
    if (manualMode) return;

    const update = () => {
      setAtmosphere(getSystemAtmosphere());
    };

    update();

    const timer = window.setInterval(update, 60000);

    return () => window.clearInterval(timer);
  }, [manualMode]);

  /* ---------------------------------------------
     DATA
  --------------------------------------------- */

  const points = number(data.total_points);

  const completedDays = number(data.completed_days);

  const streak = number(data.streak);

  const totalCO2 = number(
    data.total_co2e ??
      data.totalCO2 ??
      data.total_saved_co2e
  );

  const level = getLevel(points);

  const nextLevel = getNextLevel(points);

  const levelProgress = nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((points - level.min) /
            (nextLevel.min - level.min)) *
            100
        )
      )
    : 100;

  const treeCount = Math.min(
    42,
    Math.max(
      5,
      Math.floor(completedDays / 2) + Math.floor(points / 150)
    )
  );

  /* ---------------------------------------------
     TREE POSITIONS
  --------------------------------------------- */

  const trees = useMemo(() => {
    const base = [
      [7, 48],
      [13, 34],
      [18, 56],
      [24, 30],
      [29, 49],
      [35, 25],
      [40, 40],
      [46, 20],
      [52, 33],
      [57, 18],
      [63, 38],
      [68, 25],
      [74, 45],
      [80, 30],
      [87, 50],
      [93, 35],
      [10, 67],
      [20, 72],
      [31, 64],
      [43, 70],
      [55, 62],
      [66, 69],
      [78, 65],
      [90, 70],
      [4, 78],
      [15, 82],
      [28, 79],
      [41, 83],
      [58, 81],
      [72, 84],
      [86, 80],
      [96, 76],
      [34, 57],
      [61, 52],
      [76, 55],
      [89, 58],
      [12, 44],
      [48, 55],
      [70, 50],
      [82, 42],
      [95, 53],
    ];

    return base.slice(0, treeCount).map((position, index) => ({
      id: index,
      x: position[0],
      y: position[1],
      size:
        index % 7 === 0
          ? "large"
          : index % 3 === 0
          ? "small"
          : "normal",
    }));
  }, [treeCount]);

  /* ---------------------------------------------
     RAIN
  --------------------------------------------- */

  useEffect(() => {
    if (atmosphere !== "rain") {
      setRainDrops([]);
      return;
    }

    const drops = Array.from({ length: 80 }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 0.6 + Math.random() * 0.8,
    }));

    setRainDrops(drops);
  }, [atmosphere]);

  /* ---------------------------------------------
     WEB AUDIO AMBIENCE
  --------------------------------------------- */

  function createAudio() {
    if (audioContextRef.current) {
      return audioContextRef.current;
    }

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return null;

    const ctx = new AudioContext();

    audioContextRef.current = ctx;

    return ctx;
  }

  function startAmbient() {
    const ctx = createAudio();

    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    if (ambientGainRef.current) return;

    const master = ctx.createGain();

    master.gain.value = 0.025;

    master.connect(ctx.destination);

    const oscillator = ctx.createOscillator();

    oscillator.type = "sine";

    oscillator.frequency.value = 96;

    const filter = ctx.createBiquadFilter();

    filter.type = "lowpass";

    filter.frequency.value = 240;

    oscillator.connect(filter);
    filter.connect(master);

    oscillator.start();

    ambientGainRef.current = master;
  }

  function stopAmbient() {
    if (ambientGainRef.current) {
      ambientGainRef.current.gain.exponentialRampToValueAtTime(
        0.0001,
        (audioContextRef.current?.currentTime || 0) + 0.4
      );

      window.setTimeout(() => {
        ambientGainRef.current = null;
      }, 450);
    }
  }

  function playFireSound() {
    const ctx = createAudio();

    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "triangle";

    oscillator.frequency.value =
      80 + Math.random() * 100;

    gain.gain.value = 0.0001;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    gain.gain.exponentialRampToValueAtTime(
      0.04,
      now + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.25
    );

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  useEffect(() => {
    if (ambientOn) {
      startAmbient();
    } else {
      stopAmbient();
    }
  }, [ambientOn]);

  useEffect(() => {
    if (!fireOn) return;

    const interval = window.setInterval(() => {
      playFireSound();
      setFirePulse(true);

      window.setTimeout(() => {
        setFirePulse(false);
      }, 280);
    }, 1100);

    return () => window.clearInterval(interval);
  }, [fireOn]);

  /* ---------------------------------------------
     CLEANUP AUDIO / SPEECH
  --------------------------------------------- */

  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) {
        window.clearTimeout(voiceTimerRef.current);
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /* ---------------------------------------------
     GUARDIAN VOICE
  --------------------------------------------- */

  function speakGuardian(text) {
    if (!voiceEnabled) return;

    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 0.72;
    utterance.pitch = 0.55;
    utterance.volume = 0.9;
    utterance.lang = "en-IN";

    const voices =
      window.speechSynthesis.getVoices();

    const preferred =
      voices.find((voice) =>
        /en.*(IN|GB|US)/i.test(voice.lang)
      ) || voices.find((voice) =>
        /^en/i.test(voice.lang)
      );

    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onstart = () => {
      setGuardianSpeaking(true);
    };

    utterance.onend = () => {
      setGuardianSpeaking(false);
    };

    utterance.onerror = () => {
      setGuardianSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  /* ---------------------------------------------
     GUARDIAN STORY
  --------------------------------------------- */

  function revealGuardianStory(index) {
    const safeIndex =
      index >= 0 && index < STORY.length
        ? index
        : 0;

    const entry = STORY[safeIndex];

    setStoryIndex(safeIndex);

    setStoryLines(entry.lines);

    speakGuardian(entry.lines.join(" "));

    if (voiceTimerRef.current) {
      window.clearTimeout(voiceTimerRef.current);
    }

    voiceTimerRef.current = window.setTimeout(() => {
      setStoryLines([]);
    }, Math.max(9000, entry.lines.join(" ").length * 65));
  }

  function awakenGuardian() {
    const next =
      storyIndex < 0
        ? 0
        : (storyIndex + 1) % STORY.length;

    revealGuardianStory(next);
  }

  function nextStory() {
    const next =
      storyIndex < 0
        ? 0
        : (storyIndex + 1) % STORY.length;

    revealGuardianStory(next);
  }

  function previousStory() {
    const previous =
      storyIndex <= 0
        ? STORY.length - 1
        : storyIndex - 1;

    revealGuardianStory(previous);
  }

  function stopGuardian() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setGuardianSpeaking(false);
    setStoryLines([]);

    if (voiceTimerRef.current) {
      window.clearTimeout(voiceTimerRef.current);
    }
  }

  /* ---------------------------------------------
     CAMPFIRE
  --------------------------------------------- */

  function interactWithFire() {
    setCampfireOpen((value) => !value);

    if (fireOn) {
      playFireSound();
    }

    if (!guardianSpeaking) {
      revealGuardianStory(
        storyIndex < 0
          ? 2
          : (storyIndex + 1) % STORY.length
      );
    }
  }

  /* ---------------------------------------------
     TREE MESSAGE
  --------------------------------------------- */

  function clickTree(tree) {
    setSelectedTree(tree);

    if (!guardianSpeaking) {
      const messages = [
        "The roots remember what the leaves forget.",
        "Every tree here began as something small.",
        "Growth is quiet. That is why people often miss it.",
        "Stand still long enough and the forest will speak.",
        "Your progress has roots now.",
      ];

      const message =
        messages[tree.id % messages.length];

      setStoryLines([message]);

      speakGuardian(message);

      window.setTimeout(() => {
        setStoryLines([]);
      }, 6500);
    }
  }

  /* ---------------------------------------------
     ATMOSPHERE
  --------------------------------------------- */

  const atmosphereInfo = {
    dawn: {
      title: "Dawn Forest",
      subtitle:
        "The forest is waking with you.",
      icon: "🌅",
    },

    day: {
      title: "Living Forest",
      subtitle:
        "Sunlight moves between the leaves.",
      icon: "☀️",
    },

    dusk: {
      title: "Twilight Forest",
      subtitle:
        "The forest grows quiet as evening arrives.",
      icon: "🌇",
    },

    night: {
      title: "Moonlit Forest",
      subtitle:
        "The trees are listening tonight.",
      icon: "🌙",
    },

    rain: {
      title: "Rain Forest",
      subtitle:
        "Let the rain wash the noise away.",
      icon: "🌧️",
    },

    mystic: {
      title: "Mystic Forest",
      subtitle:
        "Some paths are better left unexplained.",
      icon: "🌌",
    },
  };

  const currentAtmosphere =
    atmosphereInfo[atmosphere] ||
    atmosphereInfo.night;

  /* ---------------------------------------------
     NAV
  --------------------------------------------- */

  function go(path) {
    navigate(path);
  }

  return (
    <main
      className={`forest-page atmosphere-${atmosphere}`}
    >
      {/* BACKGROUND LAYERS */}

      <div className="forest-background">
        <div className="forest-sky" />

        <div className="forest-moon">
          <span />
        </div>

        <div className="forest-stars">
          {Array.from({ length: 35 }).map((_, i) => (
            <i key={i} />
          ))}
        </div>

        <div className="forest-cloud cloud-one" />
        <div className="forest-cloud cloud-two" />

        <div className="mountain mountain-back" />
        <div className="mountain mountain-middle" />
        <div className="mountain mountain-front" />

        <div className="forest-mist mist-one" />
        <div className="forest-mist mist-two" />
      </div>

      {/* RAIN */}

      {atmosphere === "rain" && (
        <div className="rain-layer">
          {rainDrops.map((drop) => (
            <i
              key={drop.id}
              style={{
                left: `${drop.left}%`,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* NAVIGATION */}

      <header className="forest-nav">
        <button
          className="forest-brand"
          onClick={() => go("/dashboard")}
        >
          <span className="brand-symbol">🌿</span>

          <span>
            <strong>GREEN PULSE</strong>
            <small>THE LIVING FOREST</small>
          </span>
        </button>

        <div className="forest-nav-right">
          <div className="time-pill">
            <span>{currentAtmosphere.icon}</span>
            <span>{formatTime()}</span>
          </div>

          <button
            className="nav-back"
            onClick={() => go("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </header>

      {/* INTRO */}

      <section className="forest-intro">
        <div>
          <p className="eyebrow">
            A QUIET PLACE BETWEEN THE TREES
          </p>

          <h1>
            Welcome back to
            <span> the Forest.</span>
          </h1>

          <p className="forest-intro-text">
            {currentAtmosphere.subtitle}
            <br />
            Your choices outside this forest shape
            what grows inside it.
          </p>
        </div>

        <div className="level-card">
          <div className="level-icon">
            {level.icon}
          </div>

          <div className="level-copy">
            <span>Your Forest Level</span>

            <strong>{level.name}</strong>

            <div className="level-progress">
              <i
                style={{
                  width: `${levelProgress}%`,
                }}
              />
            </div>

            <small>
              {nextLevel
                ? `${Math.max(
                    0,
                    nextLevel.min - points
                  )} points until ${nextLevel.name}`
                : "The highest path has been reached."}
            </small>
          </div>
        </div>
      </section>

      {/* ATMOSPHERE CONTROLS */}

      <section className="forest-controls">
        <div className="controls-label">
          <span>🌲</span>
          <div>
            <strong>Change the atmosphere</strong>
            <small>
              System time is currently setting the
              forest mood.
            </small>
          </div>
        </div>

        <div className="mode-buttons">
          {[
            ["dawn", "🌅", "Dawn"],
            ["day", "☀️", "Day"],
            ["dusk", "🌇", "Dusk"],
            ["night", "🌙", "Night"],
            ["rain", "🌧️", "Rain"],
            ["mystic", "🌌", "Mystic"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={
                atmosphere === id
                  ? "active"
                  : ""
              }
              onClick={() => {
                setManualMode(true);
                setAtmosphere(id);
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}

          {manualMode && (
            <button
              className="system-mode"
              onClick={() => {
                setManualMode(false);
                setAtmosphere(
                  getSystemAtmosphere()
                );
              }}
            >
              🕐 System
            </button>
          )}
        </div>
      </section>

      {/* MAIN FOREST */}

      <section className="forest-world">

        {/* FIRELIGHT */}

        <div
          className={`firelight ${
            firePulse ? "fire-pulse" : ""
          }`}
        />

        {/* TREES */}

        <div className="tree-field">
          {trees.map((tree, index) => (
            <ForestTree
              key={tree.id}
              {...tree}
              delay={index * 0.12}
              onClick={() => clickTree(tree)}
            />
          ))}
        </div>

        {/* DISTANT PATH */}

        <div className="forest-path">
          <span />
        </div>

        {/* CAVE */}

        <button
          className="forest-cave"
          onClick={awakenGuardian}
          aria-label="Enter the mysterious cave"
        >
          <div className="cave-rock cave-rock-one" />
          <div className="cave-rock cave-rock-two" />
          <div className="cave-rock cave-rock-three" />

          <div className="cave-mouth">
            <div className="cave-inner" />

            <div className="cave-glow" />

            <span className="cave-eyes-glow" />
          </div>

          <div className="cave-ground" />

          <span className="cave-label">
            THE OLD CAVE
          </span>
        </button>

        {/* MAIN ANCIENT TREE */}

        <div className="ancient-tree">
          <div className="ancient-tree-aura" />

          <div className="ancient-crown crown-a" />
          <div className="ancient-crown crown-b" />
          <div className="ancient-crown crown-c" />
          <div className="ancient-crown crown-d" />

          <div className="ancient-trunk">
            <span />
            <span />
            <span />
          </div>

          <div className="root root-one" />
          <div className="root root-two" />
          <div className="root root-three" />
          <div className="root root-four" />
        </div>

        {/* CAMPFIRE */}

        <button
          className={`campfire ${
            campfireOpen ? "campfire-open" : ""
          }`}
          onClick={interactWithFire}
          aria-label="Campfire"
        >
          <div className="fire-glow" />

          <div className="fire">
            <span className="flame flame-back" />
            <span className="flame flame-main" />
            <span className="flame flame-front" />
          </div>

          <div className="logs">
            <span />
            <span />
          </div>

          <small>
            {campfireOpen
              ? "THE FIRE REMEMBERS"
              : "sit by the fire"}
          </small>
        </button>

        {/* INVISIBLE GUARDIAN PRESENCE */}

        <div
          className={`guardian-presence ${
            guardianSpeaking
              ? "guardian-speaking"
              : ""
          }`}
        >
          <div className="presence-ring ring-one" />
          <div className="presence-ring ring-two" />
          <div className="presence-ring ring-three" />

          <span className="guardian-whisper-dot" />
        </div>

        {/* TEMPORARY GUARDIAN DIALOGUE */}

        {storyLines.length > 0 && (
          <div className="guardian-dialogue">
            <div className="dialogue-top">
              <span className="voice-indicator">
                {guardianSpeaking ? "◉" : "○"}
              </span>

              <span>
                THE GUARDIAN
              </span>

              <button
                onClick={stopGuardian}
                aria-label="Close Guardian dialogue"
              >
                ×
              </button>
            </div>

            <div className="dialogue-lines">
              {storyLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>

            <div className="dialogue-bottom">
              <span>
                {guardianSpeaking
                  ? "A voice moves through the trees..."
                  : "The forest has gone quiet."}
              </span>

              <button onClick={nextStory}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STORY CONTROLS */}

        <div className="story-console">
          <div className="story-console-title">
            <span>◌</span>

            <div>
              <strong>
                The Guardian's Story
              </strong>

              <small>
                You will never see him.
              </small>
            </div>
          </div>

          <div className="story-buttons">
            <button onClick={previousStory}>
              ←
            </button>

            <button
              className="story-main-button"
              onClick={awakenGuardian}
            >
              {guardianSpeaking
                ? "Listen..."
                : "Listen to the forest"}
            </button>

            <button onClick={nextStory}>
              →
            </button>
          </div>
        </div>

        {/* SOUND CONTROLS */}

        <div className="sound-console">
          <button
            className={ambientOn ? "on" : ""}
            onClick={() =>
              setAmbientOn((value) => !value)
            }
          >
            {ambientOn ? "🌬️" : "🔇"} Forest
          </button>

          <button
            className={fireOn ? "on" : ""}
            onClick={() =>
              setFireOn((value) => !value)
            }
          >
            {fireOn ? "🔥" : "○"} Fire
          </button>

          <button
            className={voiceEnabled ? "on" : ""}
            onClick={() =>
              setVoiceEnabled((value) => !value)
            }
          >
            {voiceEnabled ? "🗣️" : "🔇"} Voice
          </button>
        </div>

      </section>

      {/* SELECTED TREE MESSAGE */}

      {selectedTree && (
        <div className="tree-message">
          <span>🌿</span>

          <div>
            <strong>
              A tree noticed you.
            </strong>

            <p>
              The forest has grown to{" "}
              <b>{treeCount} living trees</b>.
              Every small action gives it another
              reason to grow.
            </p>
          </div>

          <button
            onClick={() => setSelectedTree(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* FOREST STATS */}

      <section className="forest-stats">
        <article>
          <span className="stat-icon">🌳</span>
          <div>
            <small>Living Trees</small>
            <strong>{treeCount}</strong>
          </div>
        </article>

        <article>
          <span className="stat-icon">🔥</span>
          <div>
            <small>Green Points</small>
            <strong>{points}</strong>
          </div>
        </article>

        <article>
          <span className="stat-icon">📅</span>
          <div>
            <small>Days Recorded</small>
            <strong>{completedDays}</strong>
          </div>
        </article>

        <article>
          <span className="stat-icon">⚡</span>
          <div>
            <small>Current Streak</small>
            <strong>{streak} days</strong>
          </div>
        </article>

        <article>
          <span className="stat-icon">🌍</span>
          <div>
            <small>Tracked CO₂e</small>
            <strong>
              {totalCO2.toFixed(2)} kg
            </strong>
          </div>
        </article>
      </section>

      {/* BOTTOM ACTIONS */}

      <section className="forest-actions">

        <div className="forest-action-card primary">
          <div className="action-icon">🧮</div>

          <div>
            <small>KEEP GROWING</small>

            <h2>
              Add today's footprint
            </h2>

            <p>
              Every calculation gives your forest
              another chance to grow.
            </p>
          </div>

          <button
            onClick={() => go("/calculator")}
          >
            Open Calculator →
          </button>
        </div>

        <div className="forest-action-grid">

          <button
            className="forest-action-small"
            onClick={() => go("/focus")}
          >
            <span>🌲</span>

            <div>
              <strong>
                Forest Focus
              </strong>

              <small>
                Study inside the forest.
              </small>
            </div>

            <b>→</b>
          </button>

          <button
            className="forest-action-small"
            onClick={() => go("/challenges")}
          >
            <span>🏆</span>

            <div>
              <strong>
                Forest Challenges
              </strong>

              <small>
                Give your forest new roots.
              </small>
            </div>

            <b>→</b>
          </button>

          <button
            className="forest-action-small"
            onClick={() => go("/rewards")}
          >
            <span>🌱</span>

            <div>
              <strong>
                Your Growth
              </strong>

              <small>
                See your badges and milestones.
              </small>
            </div>

            <b>→</b>
          </button>

          <button
            className="forest-action-small"
            onClick={() => go("/feedback")}
          >
            <span>💬</span>

            <div>
              <strong>
                Speak to GreenPulse
              </strong>

              <small>
                Tell us how the forest feels.
              </small>
            </div>

            <b>→</b>
          </button>

        </div>
      </section>

      {/* STORY FOOTER */}

      <section className="forest-ending">

        <div className="ending-line" />

        <p>
          “You do not need to find the Guardian.”
        </p>

        <span>
          “If you are quiet enough, you may already
          be hearing him.”
        </span>

        <button onClick={awakenGuardian}>
          Listen again
        </button>

      </section>

      <footer className="forest-footer">
        <span>
          GREEN PULSE CSEAIML
        </span>

        <span>
          Digital Green Challenge 2026
        </span>

        <button onClick={() => go("/dashboard")}>
          Dashboard
        </button>
      </footer>
    </main>
  );
}