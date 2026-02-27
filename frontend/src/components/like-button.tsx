"use client";

import { useState, useCallback, useEffect } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLikes } from "@/lib/likes-context";
import { AuthModal } from "./auth-modal";

interface LikeButtonProps {
  tourId?: number | null;
  accommodationId?: number | null;
  initialLikes: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LikeButton({
  tourId,
  accommodationId,
  initialLikes,
  size = "md",
  className = "",
}: LikeButtonProps) {
  const { user } = useAuth();
  const { likes, mutate } = useLikes();
  const [localLikes, setLocalLikes] = useState(initialLikes);
  const [optimisticLikes, setOptimisticLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setLocalLikes(initialLikes);
  }, [initialLikes]);

  // Check if user has liked this item
  const liked = likes.some((l: { tourId?: number; accommodationId?: number }) =>
    (tourId != null && l.tourId === tourId) ||
    (accommodationId != null && l.accommodationId === accommodationId)
  );

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const btnSizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
  };

  const handleLike = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (loading) return;

    // Nothing to like (e.g. card from static data with no DB id)
    if (tourId == null && accommodationId == null) return;
    // OPTIMISTIC UPDATE: Update UI immediately
    const newLikedState = !liked;
    const likesDelta = newLikedState ? 1 : -1;
    setLocalLikes(prev => Math.max(0, prev + likesDelta));
    setLoading(true);

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tourId: tourId ?? undefined, 
          accommodationId: accommodationId ?? undefined 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert on error
        setLocalLikes(prev => Math.max(0, prev - likesDelta));
        throw new Error(data.error || "Failed to toggle like");
      }

      mutate();

      // Update displayed count from server only (no client-side +1 to avoid double count)
      if (data.likesCount !== undefined) {
        setLocalLikes(data.likesCount);
      }
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setLoading(false);
    }
  }, [user, loading, liked, tourId, accommodationId, mutate]);

  return (
    <>
      <button
        type="button"
        onClick={handleLike}
        disabled={loading || (tourId == null && accommodationId == null)}
        className={`
          group flex items-center gap-1.5 rounded-full transition-all duration-200
          ${btnSizes[size]}
          ${liked 
            ? "bg-red-50 text-red-500 hover:bg-red-100" 
            : "bg-white/90 text-gray-600 hover:text-red-500 hover:bg-red-50"
          }
          ${loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <Heart
          className={`
            ${sizeClasses[size]} 
            transition-all duration-200 
            ${liked ? "fill-current scale-110" : "fill-none group-hover:scale-110"}
            ${loading ? "animate-pulse" : ""}
          `}
        />
        {localLikes > 0 && (
          <span className="text-xs font-medium tabular-nums">
            {localLikes}
          </span>
        )}
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
      />
    </>
  );
}