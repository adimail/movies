import { useMemo } from "react";
import { SpatialMovie } from "../types";
import { useMovieStore } from "../store";

interface HoverTooltipProps {
  movies: SpatialMovie[];
}

export function HoverTooltip({ movies }: HoverTooltipProps) {
  const { hoveredMovieId, hoveredMovieClientPos, selectedMovieId, isMobile, bookmarkedMovieIds } =
    useMovieStore();

  const movie = useMemo(
    () => (hoveredMovieId ? movies.find((m) => m.id === hoveredMovieId) : null),
    [hoveredMovieId, movies]
  );

  if (!movie || !hoveredMovieClientPos || selectedMovieId || isMobile) return null;

  const { x, y } = hoveredMovieClientPos;
  const isBookmarked = bookmarkedMovieIds.includes(movie.id);

  return (
    <div
      style={{
        position: "fixed",
        left: x + 16,
        top: y - 12,
        zIndex: 55,
        pointerEvents: "none",
        background: "rgba(0,0,0,0.85)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "3px",
        backdropFilter: "blur(8px)",
        padding: "0.35rem 0.6rem",
        maxWidth: "12rem",
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.8)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        {movie.title}
        {isBookmarked && <span style={{ color: "#d7a050", fontSize: "0.5rem" }}>★</span>}
      </div>
      {movie.favorite && (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.55rem",
            color: "#d7a050",
            marginTop: "0.1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Favorite
        </div>
      )}
    </div>
  );
}
