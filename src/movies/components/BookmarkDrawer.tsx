import { useEffect, useRef } from "react";
import { useMovieStore } from "../store";
import { SpatialMovie } from "../types";
import { Bookmark, Trash2 } from "lucide-react";

interface BookmarkDrawerProps {
  movies: SpatialMovie[];
}

export function BookmarkDrawer({ movies }: BookmarkDrawerProps) {
  const {
    bookmarkedMovieIds,
    setBookmarkDrawerOpen,
    toggleBookmark,
    setJumpTargetMovieId,
    isMobile,
  } = useMovieStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const bookmarkedMovies = bookmarkedMovieIds
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is SpatialMovie => m !== undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBookmarkDrawerOpen(false);
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (!(e.target as Element).closest("#bookmark-btn")) {
          setBookmarkDrawerOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [setBookmarkDrawerOpen]);

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: "4rem",
        right: isMobile ? "1rem" : "7rem",
        zIndex: 45,
        width: "min(20rem, 90vw)",
        maxHeight: "80vh",
        overflowY: "auto",
        borderRadius: "6px",
        background: "rgba(10,10,10,0.96)",
        border: "1px solid rgba(255,255,255,0.35)",
        backdropFilter: "blur(20px)",
        padding: "1.25rem",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.1) transparent",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bookmark size={14} color="#d7a050" />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.8)",
              textTransform: "uppercase",
            }}
          >
            Bookmarks
          </span>
        </div>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {bookmarkedMovies.length} Saved
        </span>
      </div>

      {bookmarkedMovies.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 0",
            fontFamily: "monospace",
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          No bookmarks yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {bookmarkedMovies.map((movie) => (
            <div
              key={movie.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => {
                setJumpTargetMovieId(movie.id, true);
                setBookmarkDrawerOpen(false);
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "2.5rem",
                  height: "3.5rem",
                  flexShrink: 0,
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.9)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: "0.25rem",
                  }}
                >
                  {movie.title}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(movie.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.5rem",
                  color: "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
