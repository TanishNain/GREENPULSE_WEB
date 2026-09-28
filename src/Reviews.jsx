import "./Reviews.css";
import { useEffect, useState } from "react";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://greenpulse-web-tc0g.onrender.com";
const OWNER_TOKENS_KEY = "greenpulse_review_tokens";

/* =========================================================
   OWNER TOKEN HELPERS
   ========================================================= */

function getOwnerTokens() {
  try {
    return JSON.parse(
      localStorage.getItem(OWNER_TOKENS_KEY)
    ) || {};
  } catch {
    return {};
  }
}

function saveOwnerToken(reviewId, token) {
  const tokens = getOwnerTokens();

  tokens[reviewId] = token;

  localStorage.setItem(
    OWNER_TOKENS_KEY,
    JSON.stringify(tokens)
  );
}

function getOwnerToken(reviewId) {
  const tokens = getOwnerTokens();

  return tokens[reviewId] || null;
}

function removeOwnerToken(reviewId) {
  const tokens = getOwnerTokens();

  delete tokens[reviewId];

  localStorage.setItem(
    OWNER_TOKENS_KEY,
    JSON.stringify(tokens)
  );
}

/* =========================================================
   REVIEWS PAGE
   ========================================================= */

function Reviews() {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [review, setReview] = useState("");

  const [reviews, setReviews] = useState([]);

  const [loadingReviews, setLoadingReviews] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  /* =======================================================
     LOAD REVIEWS
     ======================================================= */

  const loadReviews = async () => {
  setLoadingReviews(true);

  try {
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load reviews (${response.status})`);
    }

    const data = await response.json();

    console.log("GREENPULSE REVIEWS API:", data);

    const reviewList = Array.isArray(data)
      ? data
      : Array.isArray(data.reviews)
        ? data.reviews
        : [];

    setReviews(reviewList);
  } catch (error) {
    console.error("Failed to load reviews:", error);
    setReviews([]);
  } finally {
    setLoadingReviews(false);
  }
};

  useEffect(() => {
    loadReviews();
  }, []);

  /* =======================================================
     RESET FORM
     ======================================================= */

  const resetForm = () => {
    setName("");
    setReview("");
    setRating(0);
    setEditingId(null);
  };

  /* =======================================================
     SUBMIT / UPDATE REVIEW
     ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating) {
      alert("Please select a rating.");
      return;
    }

    if (!name.trim() || !review.trim()) {
      alert(
        "Please enter your name and review."
      );
      return;
    }

    setSubmitting(true);

    try {
      /* ---------------------------------------------------
         EDIT EXISTING REVIEW
         --------------------------------------------------- */

      if (editingId !== null) {
        const ownerToken =
          getOwnerToken(editingId);

        if (!ownerToken) {
          alert(
            "This review cannot be edited from this browser because its ownership information is unavailable."
          );

          setSubmitting(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/api/reviews/${editingId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              name: name.trim(),
              rating: rating,
              review: review.trim(),
              owner_token: ownerToken,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
            "Failed to update review."
          );
        }

        alert(
          "Review updated successfully! 🌱"
        );

        resetForm();

        await loadReviews();

        return;
      }

      /* ---------------------------------------------------
         CREATE NEW REVIEW
         --------------------------------------------------- */

      const response = await fetch(
        `${API_URL}/api/reviews`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            rating: rating,
            review: review.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to submit review."
        );
      }

      /* ---------------------------------------------------
         SAVE OWNER TOKEN
         --------------------------------------------------- */

      if (
        data.owner_token &&
        data.review?.id
      ) {
        saveOwnerToken(
          data.review.id,
          data.owner_token
        );
      }

      alert(
        "Review submitted successfully! 🌱"
      );

      resetForm();

      await loadReviews();
    } catch (error) {
      console.error(
        "Error saving review:",
        error
      );

      alert(
        error.message ||
        "Could not save the review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     EDIT REVIEW
     ======================================================= */

  const handleEdit = (item) => {
    const ownerToken =
      getOwnerToken(item.id);

    if (!ownerToken) {
      alert(
        "This review was created before this browser started tracking review ownership, so it cannot be edited here."
      );

      return;
    }

    setEditingId(item.id);
    setName(item.name);
    setRating(item.rating);
    setReview(item.review);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     DELETE REVIEW
     ======================================================= */

  const handleDelete = async (item) => {
    const ownerToken =
      getOwnerToken(item.id);

    if (!ownerToken) {
      alert(
        "This review cannot be deleted from this browser because its ownership information is unavailable."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Delete this review permanently?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/reviews/${item.id}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            owner_token: ownerToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to delete review."
        );
      }

      removeOwnerToken(item.id);

      if (editingId === item.id) {
        resetForm();
      }

      alert(
        "Review deleted successfully."
      );

      await loadReviews();
    } catch (error) {
      console.error(
        "Error deleting review:",
        error
      );

      alert(
        error.message ||
        "Could not delete the review. Please try again."
      );
    }
  };

  /* =======================================================
     REVIEW STATISTICS
     ======================================================= */

  const reviewCount =
    reviews.length;

  const averageRating =
    reviewCount > 0
      ? (
          reviews.reduce(
            (total, item) =>
              total + Number(item.rating),
            0
          ) / reviewCount
        ).toFixed(1)
      : "—";

  const ratingCounts = {
    5: reviews.filter(
      (item) =>
        Number(item.rating) === 5
    ).length,

    4: reviews.filter(
      (item) =>
        Number(item.rating) === 4
    ).length,

    3: reviews.filter(
      (item) =>
        Number(item.rating) === 3
    ).length,

    2: reviews.filter(
      (item) =>
        Number(item.rating) === 2
    ).length,

    1: reviews.filter(
      (item) =>
        Number(item.rating) === 1
    ).length,
  };

  const roundedAverage =
    reviewCount > 0
      ? Math.round(
          Number(averageRating)
        )
      : 0;

  return (
    <div className="reviews-page">

      {/* ===================================================
          NAVBAR
          =================================================== */}

      <nav className="reviews-navbar">

        <a
          href="/"
          className="reviews-logo"
        >
          <span>🌱</span>

          <strong>
            GREEN<span>PULSE</span>
          </strong>
        </a>

        <a
          href="/explore"
          className="reviews-back"
        >
          ← Explore
        </a>

      </nav>

      {/* ===================================================
          HERO
          =================================================== */}

      <section className="reviews-hero">

        <span className="reviews-eyebrow">
          GREENPULSE — COMMUNITY
        </span>

        <h1>
          Your experience.
          <br />
          <span>Your voice.</span>
        </h1>

        <p>
          Tell us what you think about
          GreenPulse. Your feedback helps
          shape what the project becomes next.
        </p>

      </section>

      {/* ===================================================
          WRITE + SUMMARY
          =================================================== */}

      <section className="review-layout">

        {/* -------------------------------------------------
            WRITE REVIEW
            ------------------------------------------------- */}

        <form
          className="write-review-card"
          onSubmit={handleSubmit}
        >

          <div className="review-card-heading">

            <span className="reviews-label">
              {editingId !== null
                ? "EDIT YOUR REVIEW"
                : "WRITE A REVIEW"}
            </span>

            <h2>
              {editingId !== null ? (
                <>
                  Make your
                  <br />
                  <span>changes.</span>
                </>
              ) : (
                <>
                  How was your
                  <br />
                  <span>
                    GreenPulse experience?
                  </span>
                </>
              )}
            </h2>

          </div>

          {/* RATING */}

          <div className="rating-area">

            <span className="rating-title">
              Your rating
            </span>

            <div className="stars">

              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setRating(star)
                    }
                    className={
                      star <= rating
                        ? "selected"
                        : ""
                    }
                    aria-label={`${star} star rating`}
                    aria-pressed={
                      star <= rating
                    }
                  >
                    ★
                  </button>
                )
              )}

            </div>

            <span className="rating-hint">
              {rating
                ? `${rating} out of 5 stars`
                : "Select a rating from 1 to 5"}
            </span>

          </div>

          {/* NAME */}

          <div className="form-field">

            <label htmlFor="review-name">
              Your name
            </label>

            <input
              id="review-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Enter your name"
              autoComplete="name"
              maxLength={100}
            />

          </div>

          {/* REVIEW */}

          <div className="form-field">

            <label htmlFor="review-message">
              Your review
            </label>

            <textarea
              id="review-message"
              rows="6"
              value={review}
              onChange={(event) =>
                setReview(
                  event.target.value
                )
              }
              placeholder="Tell us what you think about GreenPulse..."
              maxLength={5000}
            />

          </div>

          {/* FORM BUTTONS */}

          <div className="review-form-actions">

            <button
              type="submit"
              className="submit-review"
              disabled={submitting}
            >
              <span>
                {submitting
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Submit review"}
              </span>

              <span>
                ↗
              </span>
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="cancel-edit"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
            )}

          </div>

          <p className="review-note">
            {editingId !== null
              ? "Your changes will be saved to your GreenPulse review."
              : "Your review will be visible to the GreenPulse community."}
          </p>

        </form>

        {/* -------------------------------------------------
            COMMUNITY SUMMARY
            ------------------------------------------------- */}

        <div className="review-summary">

          <div className="summary-top">

            <span className="reviews-label">
              COMMUNITY FEEDBACK
            </span>

            <div className="rating-number">

              <strong>
                {averageRating}
              </strong>

              <span>
                {" "} / 5
              </span>

            </div>

            <div
              className="summary-stars"
              aria-label={
                reviewCount > 0
                  ? `Average rating ${averageRating} out of 5`
                  : "No ratings yet"
              }
            >
              {reviewCount > 0
                ? [1, 2, 3, 4, 5]
                    .map((star) =>
                      star <=
                      roundedAverage
                        ? "★"
                        : "☆"
                    )
                    .join(" ")
                : "☆ ☆ ☆ ☆ ☆"}
            </div>

            <p>
              {reviewCount > 0
                ? `${reviewCount} ${
                    reviewCount === 1
                      ? "review"
                      : "reviews"
                  } from the GreenPulse community.`
                : (
                  <>
                    No reviews yet.
                    <br />
                    Be the first to share
                    your experience.
                  </>
                )}
            </p>

          </div>

          {/* RATING DISTRIBUTION */}

          <div className="rating-bars">

            {[5, 4, 3, 2, 1].map(
              (number) => {

                const percentage =
                  reviewCount > 0
                    ? (
                        ratingCounts[number] /
                        reviewCount
                      ) * 100
                    : 0;

                return (
                  <div
                    className="rating-bar"
                    key={number}
                  >

                    <span>
                      {number}
                    </span>

                    <div>
                      <i
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />
                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </section>

      {/* ===================================================
          EXISTING REVIEWS
          =================================================== */}

      <section className="existing-reviews">

        <div className="existing-heading">

          <span className="reviews-label">
            01 — REVIEWS
          </span>

          <h2>
            What people
            <br />
            <span>are saying.</span>
          </h2>

        </div>

        {/* LOADING */}

        {loadingReviews && (
          <div className="reviews-loading">
            Loading community reviews...
          </div>
        )}

        {/* EMPTY */}

        {!loadingReviews &&
          reviews.length === 0 && (
            <div className="empty-reviews">

              <div>🌱</div>

              <h3>
                No reviews yet
              </h3>

              <p>
                Be the first person to
                leave feedback about
                GreenPulse.
              </p>

            </div>
          )}

        {/* REVIEW LIST */}

        {!loadingReviews &&
          reviews.length > 0 && (
            <div className="review-list">

              {reviews.map((item) => {

                const isOwner =
                  Boolean(
                    getOwnerToken(item.id)
                  );

                const itemRating =
                  Number(item.rating);

                const formattedDate =
                  item.created_at
                    ? new Date(
                        item.created_at
                      ).toLocaleDateString(
                        undefined,
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "";

                return (
                  <article
                    className="review-item"
                    key={item.id}
                  >

                    {/* REVIEW HEADER */}

                    <div className="review-item-header">

                      <div className="review-author">

                        <h3 className="review-author-name">
                          {item.name}
                        </h3>

                        <div className="review-author-meta">
                          GreenPulse community
                          {formattedDate
                            ? ` • ${formattedDate}`
                            : ""}
                        </div>

                      </div>

                      <div
                        className="review-rating"
                        aria-label={`${itemRating} out of 5 stars`}
                      >
                        {"★".repeat(
                          itemRating
                        )}

                        {"☆".repeat(
                          Math.max(
                            0,
                            5 - itemRating
                          )
                        )}
                      </div>

                    </div>

                    {/* FULL REVIEW */}

                    <p className="review-text">
                      {item.review}
                    </p>

                    {/* REVIEW FOOTER */}

                    <div className="review-item-footer">

                      <span className="review-date">
                        {formattedDate
                          ? `Posted ${formattedDate}`
                          : "Community review"}
                      </span>

                      {isOwner && (
                        <div className="review-actions">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(item)
                            }
                            aria-label={`Edit review by ${item.name}`}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(item)
                            }
                            aria-label={`Delete review by ${item.name}`}
                          >
                            🗑️ Delete
                          </button>

                        </div>
                      )}

                    </div>

                  </article>
                );
              })}

            </div>
          )}

      </section>

      {/* ===================================================
          FINAL CTA
          =================================================== */}

      <section className="reviews-final">

        <span>🌱</span>

        <h2>
          Help GreenPulse
          <br />
          <span>grow.</span>
        </h2>

        <p>
          Every piece of feedback gives
          the project another direction
          to grow.
        </p>

        <a
          href="/explore"
          className="reviews-explore-button"
        >
          Explore GreenPulse
          <span>→</span>
        </a>

      </section>

      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer className="reviews-footer">

        <div>
          <span>🌱</span>
          GREENPULSE
        </div>

        <p>
          Making environmental impact
          easier to understand.
        </p>

        <span>
          © 2026 GreenPulse
        </span>

      </footer>

    </div>
  );
}

export default Reviews;
