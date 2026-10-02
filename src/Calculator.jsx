import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Calculator.css";

// ============================================================
// GREEN PULSE — CARBON CALCULATOR
// ============================================================

const STORAGE_KEY = "greenpulse_year_data";

// Carbon factors used by the GreenPulse desktop version.
const FACTORS = {
  electricity: 0.82,
  lpg: 2.98,
  waste: 0.50,

  transport: {
    Car: 0.192,
    Bike: 0.103,
    Bus: 0.089,
    Train: 0.041,
    "Walking / Cycling": 0,
  },

  meals: {
    Vegetarian: 0.80,
    Mixed: 1.70,
    "Non-Vegetarian": 2.50,
  },
};


// ============================================================
// HELPERS
// ============================================================

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}


function todayKey() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function readData() {

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object") {
      return parsed;
    }

  } catch (error) {
    console.warn("GreenPulse data could not be read.", error);
  }

  return {};
}


function calculateStreak(history) {

  if (!history.length) {
    return 0;
  }

  const dates = history
    .map((item) => item.date)
    .filter(Boolean)
    .sort()
    .reverse();

  const uniqueDates = [...new Set(dates)];

  if (!uniqueDates.length) {
    return 0;
  }

  let streak = 1;

  const first = new Date(`${uniqueDates[0]}T00:00:00`);

  for (let i = 1; i < uniqueDates.length; i++) {

    const current = new Date(
      `${uniqueDates[i]}T00:00:00`
    );

    const previous = new Date(
      `${uniqueDates[i - 1]}T00:00:00`
    );

    const difference =
      Math.round(
        (previous - current) /
        (1000 * 60 * 60 * 24)
      );

    if (difference === 1) {
      streak++;
    } else {
      break;
    }
  }

  // Only call it an active streak if the latest entry is today
  // or yesterday.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latest = new Date(first);
  latest.setHours(0, 0, 0, 0);

  const daysSinceLatest =
    Math.round(
      (today - latest) /
      (1000 * 60 * 60 * 24)
    );

  if (daysSinceLatest > 1) {
    return 0;
  }

  return streak;
}


// ============================================================
// COMPONENT
// ============================================================

export default function Calculator() {

  const navigate = useNavigate();

  const [electricity, setElectricity] = useState("");
  const [lpg, setLpg] = useState("");
  const [water, setWater] = useState("");
  const [travel, setTravel] = useState("");
  const [transportMode, setTransportMode] = useState("Car");
  const [meals, setMeals] = useState("");
  const [diet, setDiet] = useState("Mixed");
  const [waste, setWaste] = useState("");

  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");


  // ==========================================================
  // CALCULATION
  // ==========================================================

  const result = useMemo(() => {

    const electricityCO2 =
      number(electricity) *
      FACTORS.electricity;

    const lpgCO2 =
      number(lpg) *
      FACTORS.lpg;

    const transportCO2 =
      number(travel) *
      FACTORS.transport[transportMode];

    const foodCO2 =
      number(meals) *
      FACTORS.meals[diet];

    const wasteCO2 =
      number(waste) *
      FACTORS.waste;

    const total =
      electricityCO2 +
      lpgCO2 +
      transportCO2 +
      foodCO2 +
      wasteCO2;

    return {
      electricityCO2,
      lpgCO2,
      transportCO2,
      foodCO2,
      wasteCO2,
      total,
      water: number(water),
    };

  }, [
    electricity,
    lpg,
    water,
    travel,
    transportMode,
    meals,
    diet,
    waste,
  ]);


  // ==========================================================
  // SAVE TODAY
  // ==========================================================

  function saveToday() {

    const data = readData();

    const existingHistory = Array.isArray(data.history)
      ? data.history
      : [];

    const date = todayKey();

    const dailyPoints = 25;

    const entry = {
      date,
      co2e: Number(result.total.toFixed(3)),
      points: dailyPoints,

      categories: {
        electricity: Number(
          result.electricityCO2.toFixed(3)
        ),

        lpg: Number(
          result.lpgCO2.toFixed(3)
        ),

        transport: Number(
          result.transportCO2.toFixed(3)
        ),

        food: Number(
          result.foodCO2.toFixed(3)
        ),

        waste: Number(
          result.wasteCO2.toFixed(3)
        ),

        // Water is tracked but intentionally not
        // converted into CO2 without an established
        // GreenPulse water factor.
        water: number(water),
      },

      inputs: {
        electricity: number(electricity),
        lpg: number(lpg),
        water: number(water),
        travel: number(travel),
        transportMode,
        meals: number(meals),
        diet,
        waste: number(waste),
      },
    };


    // --------------------------------------------------------
    // Update today's record instead of creating duplicates.
    // --------------------------------------------------------

    const withoutToday = existingHistory.filter(
      (item) => item.date !== date
    );

    const history = [
      ...withoutToday,
      entry,
    ].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );


    // --------------------------------------------------------
    // Recalculate totals from history.
    // --------------------------------------------------------

    const totalCalculations = history.length;

    const totalCO2 = history.reduce(
      (sum, item) =>
        sum + number(item.co2e),
      0
    );

    const totalPoints = history.reduce(
      (sum, item) =>
        sum + number(item.points),
      0
    );


    const categoryTotals = history.reduce(
      (totals, item) => {

        const categories =
          item.categories || {};

        totals.electricity +=
          number(categories.electricity);

        totals.lpg +=
          number(categories.lpg);

        totals.transport +=
          number(categories.transport);

        totals.food +=
          number(categories.food);

        totals.waste +=
          number(categories.waste);

        totals.water +=
          number(categories.water);

        return totals;
      },
      {
        electricity: 0,
        lpg: 0,
        transport: 0,
        food: 0,
        waste: 0,
        water: 0,
      }
    );


    const completedDays =
      history.length;

    const streak =
      calculateStreak(history);


    // --------------------------------------------------------
    // Preserve any existing GreenPulse data.
    // --------------------------------------------------------

    const updatedData = {

      ...data,

      total_points: totalPoints,

      total_calculations:
        totalCalculations,

      total_saved_co2e:
        number(data.total_saved_co2e),

      streak,

      completed_days:
        completedDays,

      total_co2e:
        Number(totalCO2.toFixed(3)),

      electricity:
        Number(categoryTotals.electricity.toFixed(3)),

      lpg:
        Number(categoryTotals.lpg.toFixed(3)),

      transport:
        Number(categoryTotals.transport.toFixed(3)),

      food:
        Number(categoryTotals.food.toFixed(3)),

      waste:
        Number(categoryTotals.waste.toFixed(3)),

      water:
        Number(categoryTotals.water.toFixed(3)),

      history,
    };


    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedData)
      );

      // Tell Dashboard and other GreenPulse pages
      // that fresh data is available.
      window.dispatchEvent(
        new CustomEvent(
          "greenpulse:data-updated"
        )
      );

      setSaved(true);

      setMessage(
        `Today's footprint was saved. +${dailyPoints} Green Points 🌱`
      );

      setTimeout(() => {
        setMessage("");
      }, 4000);

    } catch (error) {

      console.error(
        "GreenPulse data could not be saved.",
        error
      );

      setSaved(false);

      setMessage(
        "Could not save your GreenPulse data."
      );
    }
  }


  // ==========================================================
  // CLEAR FORM
  // ==========================================================

  function clearForm() {

    setElectricity("");
    setLpg("");
    setWater("");
    setTravel("");
    setTransportMode("Car");
    setMeals("");
    setDiet("Mixed");
    setWaste("");

    setSaved(false);
    setMessage("");
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="calculator-page">

      {/* ====================================================
          TOP NAVIGATION
      ==================================================== */}

      <header className="calculator-header">

        <button
          className="calculator-brand"
          onClick={() => navigate("/dashboard")}
          type="button"
          title="Back to Dashboard"
        >

          <span className="calculator-brand-icon">
            🌱
          </span>

          <span>
            GREEN<span>PULSE</span>
          </span>

        </button>


        <div className="calculator-header-actions">

          <button
            className="nav-back-button"
            onClick={() => navigate("/dashboard")}
            type="button"
          >
            <span>←</span>
            <span>Dashboard</span>
          </button>


          <button
            className="nav-explore-button"
            onClick={() => navigate("/explore")}
            type="button"
          >
            <span>⌂</span>
            <span>Explore GreenPulse</span>
          </button>

        </div>

      </header>


      {/* ====================================================
          HERO
      ==================================================== */}

      <main className="calculator-main">

        <section className="calculator-hero">

          <div className="hero-badge">
            <span>🌍</span>
            DAILY IMPACT TRACKER
          </div>

          <h1>
            Carbon Footprint
            <span>Calculator</span>
          </h1>

          <p>
            Record the choices you made today and turn them
            into a simple environmental snapshot.
          </p>

        </section>


        {/* ==================================================
            INPUT GRID
        ================================================== */}

        <section className="input-grid">


          {/* ELECTRICITY */}

          <article className="input-card">

            <div className="input-card-heading">

              <div className="input-icon electricity-icon">
                ⚡
              </div>

              <div>
                <h2>
                  Electricity
                </h2>

                <p>
                  Energy used today
                </p>
              </div>

            </div>

            <label>
              Units consumed
            </label>

            <div className="input-with-unit">

              <input
                type="number"
                min="0"
                step="0.1"
                value={electricity}
                onChange={(e) =>
                  setElectricity(e.target.value)
                }
                placeholder="0"
              />

              <span>
                kWh
              </span>

            </div>

            <small>
              Enter today's electricity usage if you know it.
            </small>

          </article>


          {/* LPG */}

          <article className="input-card">

            <div className="input-card-heading">

              <div className="input-icon lpg-icon">
                🔥
              </div>

              <div>
                <h2>
                  LPG
                </h2>

                <p>
                  Cooking fuel used
                </p>
              </div>

            </div>

            <label>
              LPG consumed
            </label>

            <div className="input-with-unit">

              <input
                type="number"
                min="0"
                step="0.1"
                value={lpg}
                onChange={(e) =>
                  setLpg(e.target.value)
                }
                placeholder="0"
              />

              <span>
                kg
              </span>

            </div>

            <small>
              Leave 0 if you didn't use or don't want to track it.
            </small>

          </article>


          {/* WATER */}

          <article className="input-card">

            <div className="input-card-heading">

              <div className="input-icon water-icon">
                💧
              </div>

              <div>
                <h2>
                  Water
                </h2>

                <p>
                  Water used today
                </p>
              </div>

            </div>

            <label>
              Water usage
            </label>

            <div className="input-with-unit">

              <input
                type="number"
                min="0"
                step="1"
                value={water}
                onChange={(e) =>
                  setWater(e.target.value)
                }
                placeholder="0"
              />

              <span>
                litres
              </span>

            </div>

            <small>
              Tracked separately — not added to CO₂ without a verified factor.
            </small>

          </article>


          {/* TRANSPORT */}

          <article className="input-card">

            <div className="input-card-heading">

              <div className="input-icon travel-icon">
                🚗
              </div>

              <div>
                <h2>
                  Travel
                </h2>

                <p>
                  Distance travelled
                </p>
              </div>

            </div>

            <label>
              Travel mode
            </label>

            <select
              value={transportMode}
              onChange={(e) =>
                setTransportMode(e.target.value)
              }
            >

              <option>
                Car
              </option>

              <option>
                Bike
              </option>

              <option>
                Bus
              </option>

              <option>
                Train
              </option>

              <option>
                Walking / Cycling
              </option>

            </select>

            <div className="input-with-unit travel-input">

              <input
                type="number"
                min="0"
                step="0.1"
                value={travel}
                onChange={(e) =>
                  setTravel(e.target.value)
                }
                placeholder="0"
              />

              <span>
                km
              </span>

            </div>

          </article>


          {/* MEALS */}

          <article className="input-card">

            <div className="input-card-heading">

              <div className="input-icon food-icon">
                🥗
              </div>

              <div>
                <h2>
                  Meals
                </h2>

                <p>
                  Food choices today
                </p>
              </div>

            </div>

            <label>
              Diet type
            </label>

            <select
              value={diet}
              onChange={(e) =>
                setDiet(e.target.value)
              }
            >

              <option>
                Vegetarian
              </option>

              <option>
                Mixed
              </option>

              <option>
                Non-Vegetarian
              </option>

            </select>

            <div className="input-with-unit travel-input">

              <input
                type="number"
                min="0"
                step="1"
                value={meals}
                onChange={(e) =>
                  setMeals(e.target.value)
                }
                placeholder="0"
              />

              <span>
                meals
              </span>

            </div>

          </article>


          {/* WASTE */}

          <article className="input-card">

            <div className="input-card-heading">

              <div className="input-icon waste-icon">
                ♻️
              </div>

              <div>
                <h2>
                  Waste
                </h2>

                <p>
                  Waste generated
                </p>
              </div>

            </div>

            <label>
              Waste amount
            </label>

            <div className="input-with-unit">

              <input
                type="number"
                min="0"
                step="0.1"
                value={waste}
                onChange={(e) =>
                  setWaste(e.target.value)
                }
                placeholder="0"
              />

              <span>
                kg
              </span>

            </div>

            <small>
              A simple estimate is enough.
            </small>

          </article>

        </section>


        {/* ==================================================
            RESULT
        ================================================== */}

        <section className="result-section">

          <div className="result-header">

            <div>

              <span className="result-label">
                TODAY'S GREEN PULSE
              </span>

              <h2>
                Your estimated impact
              </h2>

            </div>

            <div className="result-main-number">

              <strong>
                {result.total.toFixed(2)}
              </strong>

              <span>
                kg CO₂e
              </span>

            </div>

          </div>


          {/* BREAKDOWN */}

          <div className="breakdown-grid">

            <div className="breakdown-item">

              <span>⚡</span>

              <div>
                <strong>
                  {result.electricityCO2.toFixed(2)}
                </strong>

                <small>
                  Electricity
                </small>
              </div>

            </div>


            <div className="breakdown-item">

              <span>🔥</span>

              <div>
                <strong>
                  {result.lpgCO2.toFixed(2)}
                </strong>

                <small>
                  LPG
                </small>
              </div>

            </div>


            <div className="breakdown-item">

              <span>🚗</span>

              <div>
                <strong>
                  {result.transportCO2.toFixed(2)}
                </strong>

                <small>
                  Transport
                </small>
              </div>

            </div>


            <div className="breakdown-item">

              <span>🥗</span>

              <div>
                <strong>
                  {result.foodCO2.toFixed(2)}
                </strong>

                <small>
                  Food
                </small>
              </div>

            </div>


            <div className="breakdown-item">

              <span>♻️</span>

              <div>
                <strong>
                  {result.wasteCO2.toFixed(2)}
                </strong>

                <small>
                  Waste
                </small>
              </div>

            </div>


            <div className="breakdown-item water-breakdown">

              <span>💧</span>

              <div>
                <strong>
                  {result.water.toFixed(0)}
                </strong>

                <small>
                  Litres tracked
                </small>
              </div>

            </div>

          </div>


          {/* SAVE */}

          <div className="save-area">

            <button
              className="save-button"
              onClick={saveToday}
              type="button"
            >
              <span>🌱</span>
              Save Today's GreenPulse
            </button>


            <button
              className="clear-button"
              onClick={clearForm}
              type="button"
            >
              Clear
            </button>

          </div>


          {message && (

            <div
              className={`save-message ${
                saved
                  ? "success"
                  : "error"
              }`}
            >
              {message}
            </div>

          )}

        </section>


        {/* ==================================================
            BOTTOM NAVIGATION
        ================================================== */}

        <section className="bottom-navigation">

          <button
            onClick={() => navigate("/dashboard")}
            type="button"
          >
            <span className="bottom-nav-icon">
              ←
            </span>

            <span>
              Back to Dashboard
            </span>
          </button>


          <button
            onClick={() => navigate("/explore")}
            type="button"
          >
            <span className="bottom-nav-icon">
              🌍
            </span>

            <span>
              Explore GreenPulse
            </span>
          </button>


          <button
            onClick={() => navigate("/forest")}
            type="button"
          >
            <span className="bottom-nav-icon">
              🌲
            </span>

            <span>
              Enter the Forest
            </span>
          </button>

        </section>

      </main>


      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="calculator-footer">

        <div>
          🌱 GREEN PULSE
        </div>

        <span>
          GREEN PULSE CSEAIML • Digital Green Challenge 2026
        </span>

      </footer>

    </div>
  );
}