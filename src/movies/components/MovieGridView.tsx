import { useRef, useState, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SpatialMovie } from "../types";
import { useMovieStore } from "../store";
import { Star, Bookmark } from "lucide-react";

interface MovieGridViewProps {
  movies: SpatialMovie[];
}

export function MovieGridView({ movies }: MovieGridViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const {
    setSelectedMovieId,
    selectedMovieId,
    jumpTargetMovieId,
    bookmarkedMovieIds,
    toggleBookmark,
    isMobile,
  } = useMovieStore();

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = useMemo(() => {
    if (isMobile) return 2;
    if (containerWidth <= 0) return 4;
    const horizontalPadding = 64;
    const gap = 32;
    const minColWidth = 200;
    const available = Math.max(minColWidth, containerWidth - horizontalPadding);
    return Math.max(1, Math.floor((available + gap) / (minColWidth + gap)));
  }, [containerWidth, isMobile]);

  const rows = useMemo(() => {
    const res: SpatialMovie[][] = [];
    for (let i = 0; i < movies.length; i += columns) {
      res.push(movies.slice(i, i + columns));
    }
    return res;
  }, [movies, columns]);

  const estimatedRowHeight = useMemo(() => {
    const horizontalPadding = isMobile ? 32 : 64;
    const gap = isMobile ? 12 : 32;
    const available = (containerWidth > 0 ? containerWidth : 800) - horizontalPadding;
    const colWidth = (available - (columns - 1) * gap) / columns;
    return colWidth * 1.5 + (isMobile ? 54 : 68) + gap;
  }, [containerWidth, columns, isMobile]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 2,
    paddingStart: 80,
    paddingEnd: 32,
  });

  useEffect(() => {
    const targetId = jumpTargetMovieId || selectedMovieId;
    if (!targetId || columns <= 0) return;
    const index = movies.findIndex((m) => m.id === targetId);
    if (index !== -1) {
      const rowIndex = Math.floor(index / columns);
      rowVirtualizer.scrollToIndex(rowIndex, { align: "center" });
    }
  }, [jumpTargetMovieId, selectedMovieId, movies, columns, rowVirtualizer]);

  return (
    <div
      ref={parentRef}
      style={{
        padding: isMobile ? "0 1rem" : "0 2rem",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {movies.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "8rem 2rem",
            color: "rgba(255,255,255,0.5)",
            fontFamily: "monospace",
          }}
        >
          No movies match your filters.
        </div>
      ) : (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowMovies = rows[virtualRow.index];
            if (!rowMovies) return null;

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gap: isMobile ? "0.75rem" : "2rem",
                }}
              >
                {rowMovies.map((movie) => {
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
                        position: "relative",
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
                          loading="lazy"
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
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          <Bookmark size={isMobile ? 14 : 16} fill={isBookmarked ? "#d7a050" : "none"} />
                        </button>
                      </div>
                      <div style={{ padding: isMobile ? "0.75rem" : "1rem" }}>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: isMobile ? "0.75rem" : "0.85rem",
                            color: "#fff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {movie.title}
                        </div>
                        {movie.favorite && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b" }}>
                            <Star size={isMobile ? 10 : 12} fill="#f59e0b" />
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: isMobile ? "0.55rem" : "0.6rem",
                                textTransform: "uppercase",
                              }}
                            >
                              Favorite
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
