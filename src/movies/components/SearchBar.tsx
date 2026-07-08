import { useState, useRef, useEffect } from "react";
import { SpatialMovie } from "../types";
import { useMovieStore } from "../store";
import { Search, X, ArrowLeft } from "lucide-react";

interface SearchBarProps {
  allMovies: SpatialMovie[];
  filteredMovies: SpatialMovie[];
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 1) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} style={{ color: "#d7a050", fontWeight: "bold" }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

function getSnippet(text: string | null | undefined, query: string, context = 35): string | null {
  if (!text || !query) return null;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return null;

  const start = Math.max(0, index - context);
  const end = Math.min(text.length, index + query.length + context);

  let snippet = text.substring(start, end).replace(/\n/g, " ");
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

function getBestSnippet(movie: SpatialMovie, query: string) {
  const descSnippet = getSnippet(movie.description, query);
  if (descSnippet) return { type: "Desc", text: descSnippet };
  return null;
}

export function SearchBar({ allMovies, filteredMovies }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { setJumpTargetMovieId, isMobile, updateSettings, viewMode, setSelectedMovieId } = useMovieStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results =
    query.length > 1
      ? allMovies
          .filter((m) => {
            const q = query.toLowerCase();
            return (
              m.title.toLowerCase().includes(q) ||
              m.description.toLowerCase().includes(q)
            );
          })
          .slice(0, 8)
      : [];

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const jump = (movie: SpatialMovie, isFilteredOut: boolean) => {
    if (isFilteredOut) {
      updateSettings({
        selectedGenres: [],
        favoritesOnly: false,
      });
    }
    setQuery("");
    setOpen(false);
    setMobileExpanded(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();

    if (viewMode === "grid") {
      setSelectedMovieId(movie.id);
      setTimeout(() => {
        const el = document.getElementById(`movie-card-${movie.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      setJumpTargetMovieId(movie.id, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || query.length <= 1) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const m = results[selectedIndex];
        const isFilteredOut = !filteredMovies.some((fm) => fm.id === m.id);
        jump(m, isFilteredOut);
      } else if (results.length > 0) {
        const m = results[0];
        const isFilteredOut = !filteredMovies.some((fm) => fm.id === m.id);
        jump(m, isFilteredOut);
      }
    }
  };

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isMobile) setMobileExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setMobileExpanded(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onGlobalKeyDown);
    return () => document.removeEventListener("keydown", onGlobalKeyDown);
  }, [isMobile]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMobileExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {isMobile && !mobileExpanded && (
        <button
          onClick={() => {
            setMobileExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          style={{
            position: "fixed",
            top: "1rem",
            left: "1rem",
            zIndex: 60,
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "8px",
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <Search size={18} />
        </button>
      )}

      {(!isMobile || mobileExpanded) && (
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: "1rem",
            left: isMobile ? "1rem" : "50%",
            right: isMobile ? "1rem" : "auto",
            transform: isMobile ? "none" : "translateX(-50%)",
            zIndex: 70,
            width: isMobile ? "auto" : "min(24rem, 90vw)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              height: "2.5rem",
              background: "rgba(0,0,0,0.8)",
              border: `1px solid ${focused ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: open && query.length > 1 ? "8px 8px 0 0" : "8px",
              backdropFilter: "blur(16px)",
              padding: "0 0.75rem",
              transition: "all 0.2s ease",
            }}
          >
            {isMobile ? (
              <button
                onClick={() => {
                  setMobileExpanded(false);
                  setQuery("");
                  setOpen(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <Search size={14} color="rgba(255,255,255,0.4)" />
            )}

            <input
              ref={inputRef}
              value={query}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setFocused(true);
                setOpen(true);
              }}
              onBlur={() => setFocused(false)}
              placeholder="Search entire database..."
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#fff",
                height: "100%",
                letterSpacing: "0.04em",
              }}
            />
            {!query && !isMobile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "sans-serif",
                  fontSize: "0.65rem",
                  pointerEvents: "none",
                  letterSpacing: "0.05em",
                }}
              >
                ⌘K
              </div>
            )}
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

            {open && query.length > 1 && (
            <div
              style={{
                background: "rgba(10,10,10,0.95)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                backdropFilter: "blur(16px)",
                overflow: "hidden",
                maxHeight: "60vh",
                overflowY: "auto"
              }}
            >
              {results.length > 0 ? (
                results.map((m, idx) => {
                  const isFilteredOut = !filteredMovies.some((fm) => fm.id === m.id);
                  const snippetInfo = getBestSnippet(m, query);

                  return (
                    <button
                      key={m.id}
                      onClick={() => jump(m, isFilteredOut)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        padding: "0.75rem",
                        background: idx === selectedIndex ? "rgba(255,255,255,0.1)" : "none",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        textAlign: "left",
                        cursor: "pointer",
                        opacity: isFilteredOut ? 0.6 : 1,
                      }}
                    >
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#fff" }}>
                        <HighlightText text={m.title} query={query} />
                      </span>

                      {snippetInfo && (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.6rem",
                            color: "rgba(255,255,255,0.55)",
                            marginTop: "0.35rem",
                            lineHeight: 1.4,
                          }}
                        >
                          <span style={{ color: "rgba(255,255,255,0.3)", marginRight: "0.3rem" }}>
                            {snippetInfo.type}:
                          </span>
                          <HighlightText text={snippetInfo.text} query={query} />
                        </span>
                      )}

                      {(m.favorite || isFilteredOut) && (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.55rem",
                            color: isFilteredOut ? "#d7a050" : "rgba(255,255,255,0.3)",
                            marginTop: "0.35rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {m.favorite ? "Favorite " : ""}
                          {m.favorite && isFilteredOut ? "· " : ""}
                          {isFilteredOut ? "Filtered Out (Click to Clear & Jump)" : ""}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                  }}
                >
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
