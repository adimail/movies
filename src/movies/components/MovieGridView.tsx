import { SpatialMovie } from "../types";
import { useMovieStore } from "../store";
import { Star, Bookmark } from "lucide-react";

interface MovieGridViewProps {
  movies: SpatialMovie[];
}

export function MovieGridView({ movies }: MovieGridViewProps) {
  const { setSelectedMovieId, bookmarkedMovieIds, toggleBookmark, isMobile } = useMovieStore();

  return (
    <div style={{ padding: isMobile ? "5rem 1rem 2rem 1rem" : "5rem 2rem 2rem 2rem", height: "100%", overflowY: "auto" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(200px, 1fr))",
        gap: isMobile ? "0.75rem" : "2rem"
      }}>
        {movies.map((movie) => {
          const isBookmarked = bookmarkedMovieIds.includes(movie.id);
          return (
            <div
              id={`movie-card-${movie.id}`}
              key={movie.id}
              onClick={() => setSelectedMovieId(movie.id)}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: movie.favorite ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s",
                position: "relative"
              }}
              onMouseEnter={(e) => {
                if (!isMobile) e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                if (!isMobile) e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ aspectRatio: "2/3", position: "relative" }}>
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(movie.id);
                  }}
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    padding: "0.4rem",
                    color: isBookmarked ? "#d7a050" : "#fff",
                    cursor: "pointer",
                    backdropFilter: "blur(4px)"
                  }}
                >
                  <Bookmark size={isMobile ? 14 : 16} fill={isBookmarked ? "#d7a050" : "none"} />
                </button>
              </div>
              <div style={{ padding: isMobile ? "0.75rem" : "1rem" }}>
                <div style={{
                  fontFamily: "monospace",
                  fontSize: isMobile ? "0.75rem" : "0.85rem",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: "0.25rem"
                }}>
                  {movie.title}
                </div>
                {movie.favorite && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b" }}>
                    <Star size={isMobile ? 10 : 12} fill="#f59e0b" />
                    <span style={{ fontFamily: "monospace", fontSize: isMobile ? "0.55rem" : "0.6rem", textTransform: "uppercase" }}>
                      Favorite
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {movies.length === 0 && (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "4rem",
            color: "rgba(255,255,255,0.5)",
            fontFamily: "monospace"
          }}>
            No movies match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
