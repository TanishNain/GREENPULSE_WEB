import "./Reviews.css";
import { useEffect, useState } from "react";

const OWNER_TOKENS_KEY = "greenpulse_review_tokens";

function getOwnerTokens() {
  try {
    return JSON.parse(localStorage.getItem(OWNER_TOKENS_KEY)) || {};
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


function Reviews() {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [review, setReview] = useState("");

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);


  const loadReviews = async () => {
    try {
      const response = await fetch("/api/reviews");
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load reviews.");
      }

      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };


  useEffect(() => {
    loadReviews();
  }, []);


  const resetForm = () => {
    setName("");
    setReview("");
    setRating(0);
    setEditingId(null);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating) {
      alert("Please select a rating.");
      return;
    }

    if (!name.trim() || !review.trim()) {
      alert("Please enter your name and review.");
      return;
    }

    setSubmitting(true);

    try {
      /*
       * EDIT EXISTING REVIEW
       */
      if (editingId !== null) {
        const ownerToken = getOwnerToken(editingId);

        if (!ownerToken) {
          alert(
            "This review cannot be edited from this browser because its ownership information is unavailable."
          );
          setSubmitting(false);
          return;
        }

        const response = await fetch(
          `/api/reviews/${editingId}`,
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
            data.detail || "Failed to update review."
          );
        }

        alert("Review updated successfully! 🌱");

        resetForm();

        await loadReviews();

        return;
      }


      /*
       * CREATE NEW REVIEW
       */
      const response = await fetch(
        "/api/reviews",
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
          data.detail || "Failed to submit review."
        );
      }

      /*
       * Save the ownership token returned
       * by the backend for this browser.
       */
      if (data.owner_token && data.review?.id) {
        saveOwnerToken(
          data.review.id,
          data.owner_token
        );
      }

      alert("Review submitted successfully! 🌱");

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


  const handleEdit = (item) => {
    const ownerToken = getOwnerToken(item.id);

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


  const handleDelete = async (item) => {
    const ownerToken = getOwnerToken(item.id);

    if (!ownerToken) {
      alert(
        "This review cannot be deleted from this browser because its ownership information is unavailable."
      );

      return;
    }

    const confirmed = window.confirm(
      "Delete this review permanently?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/reviews/${item.id}`,
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
          data.detail || "Failed to delete review."
        );
      }

      removeOwnerToken(item.id);

      if (editingId === item.id) {
        resetForm();
      }

      alert("Review deleted successfully.");

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


  const reviewCount = reviews.length;

  const averageRating =
    reviewCount > 0
      ? (
          reviews.reduce(
            (total, item) =>
              total + item.rating,
            0
          ) / reviewCount
        ).toFixed(1)
      : "—";


  const ratingCounts = {
    5: reviews.filter(
      (item) => item.rating === 5
    ).length,

    4: reviews.filter(
      (item) => item.rating === 4
    ).length,

    3: reviews.filter(
      (item) => item.rating === 3
    ).length,

    2: reviews.filter(
      (item) => item.rating === 2
    ).length,

    1: reviews.filter(
      (item) => item.rating === 1
    ).length,
  };


  return (
    <div className="reviews-page">

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
          Tell us what you think about GreenPulse.
          Your feedback helps shape what the project
          becomes next.
        </p>

      </section>


      <section className="review-layout">

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
              {editingId !== null
                ? (
                  <>
                    Make your
                    <br />
                    <span>changes.</span>
                  </>
                )
                : (
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


          <div className="form-field">

            <label>
              Your name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter your name"
            />

          </div>


          <div className="form-field">

            <label>
              Your review
            </label>

            <textarea
              rows="6"
              value={review}
              onChange={(event) =>
                setReview(event.target.value)
              }
              placeholder="Tell us what you think about GreenPulse..."
            />

          </div>


          <div className="review-form-actions">

            <button
              type="submit"
              className="submit-review"
              disabled={submitting}
            >

              {submitting
                ? "Saving..."
                : editingId !== null
                  ? "Save changes"
                  : "Submit review"}

              <span>↗</span>

            </button>


            {editingId !== null && (
              <button
                type="button"
                className="cancel-edit"
                onClick={resetForm}
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


            <div className="summary-stars">

              {reviewCount > 0
                ? [1, 2, 3, 4, 5]
                    .map((star) =>
                      star <=
                      Math.round(
                        Number(averageRating)
                      )
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
                    Be the first to share your experience.
                  </>
                )}

            </p>

          </div>


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
                      ></i>
                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </section>


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


        {loadingReviews ? (

          <div className="empty-reviews">

            <div>🌱</div>

            <h3>
              Loading reviews...
            </h3>

          </div>

        ) : reviews.length === 0 ? (

          <div className="empty-reviews">

            <div>🌱</div>

            <h3>
              No reviews yet
            </h3>

            <p>
              Be the first person to leave
              feedback about GreenPulse.
            </p>

          </div>

        ) : (

          <div className="reviews-list">

            {reviews.map((item) => {

              const isOwner =
                Boolean(
                  getOwnerToken(item.id)
                );

              return (
                <article
                  className="review-item"
                  key={item.id}
                >

                  <div className="review-item-top">

                    <div>

                      <h3>
                        {item.name}
                      </h3>

                      <span>
                        {new Date(
                          item.created_at
                        ).toLocaleDateString()}
                      </span>

                    </div>


                    <div className="review-item-stars">

                      {"★".repeat(
                        item.rating
                      )}

                      {"☆".repeat(
                        5 - item.rating
                      )}

                    </div>

                  </div>


                  <p>
                    {item.review}
                  </p>


                  {isOwner && (
                    <div className="review-actions">

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(item)
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(item)
                        }
                      >
                        🗑️ Delete
                      </button>

                    </div>
                  )}

                </article>
              );
            })}

          </div>

        )}

      </section>


      <section className="reviews-final">

        <span>🌱</span>

        <h2>
          Help GreenPulse
          <br />
          <span>grow.</span>
        </h2>

        <p>
          Every piece of feedback gives the
          project another direction to grow.
        </p>

        <a
          href="/explore"
          className="reviews-explore-button"
        >
          Explore GreenPulse
          <span>→</span>
        </a>

      </section>


      <footer className="reviews-footer">

        <div>
          <span>🌱</span>
          GREENPULSE
        </div>

        <p>
          Making environmental impact easier
          to understand.
        </p>

        <span>
          © 2026 GreenPulse
        </span>

      </footer>

    </div>
  );
}


export default Reviews;
