"use client";

import { useState } from "react";

interface FeedbackRatingProps {
  userId: string;
  question: string;
  response: string;
  onFeedbackSubmitted?: () => void;
}

export default function FeedbackRating({
  userId,
  question,
  response,
  onFeedbackSubmitted,
}: FeedbackRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showComment, setShowComment] = useState(false);

  const handleRatingClick = async (selectedRating: number) => {
    setRating(selectedRating);

    // Si rating >= 4, soumettre directement sans commentaire
    if (selectedRating >= 4) {
      await submitFeedback(selectedRating, "");
    } else {
      // Sinon, afficher le champ commentaire
      setShowComment(true);
    }
  };

  const submitFeedback = async (finalRating: number, finalComment: string) => {
    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/chat/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          question: question,
          response: response,
          rating: finalRating,
          comment: finalComment || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        onFeedbackSubmitted?.();
      } else {
        console.error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating) {
      await submitFeedback(rating, comment);
    }
  };

  if (submitted) {
    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">✅ Merci pour votre feedback !</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-sm text-gray-600 mb-2">Cette réponse vous a-t-elle été utile ?</p>

      {/* Stars rating */}
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingClick(star)}
            disabled={isSubmitting || rating !== null}
            className={`text-2xl transition-all ${
              rating !== null && star <= rating
                ? "text-yellow-500"
                : "text-gray-300 hover:text-yellow-400"
            } ${isSubmitting || rating !== null ? "cursor-not-allowed" : "cursor-pointer"}`}
            title={`${star} étoile${star > 1 ? "s" : ""}`}
          >
            ⭐
          </button>
        ))}
      </div>

      {/* Comment form (shown for ratings < 4) */}
      {showComment && !submitted && (
        <form onSubmit={handleCommentSubmit} className="mt-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment pouvons-nous améliorer cette réponse ? (optionnel)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Envoi..." : "Envoyer"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (rating) {
                  submitFeedback(rating, "");
                }
              }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Ignorer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
