import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMovies } from "../hooks/useMovies";
import { useMovieStore } from "../store";
import { generateSpatialData } from "../math";
import { SpatialMovie, SCORE_KEYS } from "../types";
import { MoviesContext } from "../context";
import { MovieDetail } from "./MovieDetail";
import { SettingsMenu } from "./SettingsMenu";
import { HelpMenu } from "./HelpMenu";
import { BookmarkDrawer } from "./BookmarkDrawer";
import { SearchBar } from "./SearchBar";
import { Settings, HelpCircle, X, Bookmark, LayoutGrid, Box, Library } from "lucide-react";

export function RootLayout() {
  const { data, isLoading, isError } = useMovies();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    selectedMovieId,
    setSelectedMovieId,
    isPanelExpanded,
    isSettingsOpen,
    setSettingsOpen,
    isHelpOpen,
    setHelpOpen,
    isBookmarkDrawerOpen,
    setBookmarkDrawerOpen,
    isMobile,
    setIsMobile,
    settings,
    hasSeenTutorial,
    hasSeenGridTutorial,
    setHasSeenGridTutorial,
    setHoveredMovieClientPos,
    setJumpTargetMovieId,
  } = useMovieStore();

  const [spatialMovies, setSpatialMovies] = useState<SpatialMovie[]>([]);
  const urlParsed = useRef(false);

  const currentPath = location.pathname;

  const selectedMovie = useMemo(
    () => spatialMovies.find((m) => m.id === selectedMovieId),
    [spatialMovies, selectedMovieId]
  );

  const filteredMovies = useMemo(() => {
    const { selectedGenres, favoritesOnly } = settings;
    const filtered = spatialMovies.filter((m) => {
      if (favoritesOnly && !m.favorite) return false;

      if (selectedGenres.length > 0) {
        const hasGenre = selectedGenres.some((key) => {
          const idx = SCORE_KEYS.indexOf(key as (typeof SCORE_KEYS)[number]);
          return idx !== -1 && m.scores[idx] >= 6;
        });
        if (!hasGenre) return false;
      }
      return true;
    });

    if (selectedGenres.length > 0) {
      filtered.sort((a, b) => {
        const scoreA = selectedGenres.reduce((acc, key) => {
          const idx = SCORE_KEYS.indexOf(key as (typeof SCORE_KEYS)[number]);
          return acc + (idx !== -1 ? a.scores[idx] : 0);
        }, 0);
        const scoreB = selectedGenres.reduce((acc, key) => {
          const idx = SCORE_KEYS.indexOf(key as (typeof SCORE_KEYS)[number]);
          return acc + (idx !== -1 ? b.scores[idx] : 0);
        }, 0);
        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [spatialMovies, settings]);

  const activeFilterCount = useMemo(() => {
    let count = settings.selectedGenres.length;
    if (settings.favoritesOnly) count++;
    return count;
  }, [settings]);

  useEffect(() => {
    if (data?.movies) setSpatialMovies(generateSpatialData(data.movies));
  }, [data]);

  useEffect(() => {
    if (spatialMovies.length === 0 || urlParsed.current) return;
    urlParsed.current = true;
    const params = new URLSearchParams(window.location.search);
    const title = params.get("movie");
    const id = params.get("id");
    if (title) {
      const matches = spatialMovies.filter((m) => m.title.toLowerCase() === title.toLowerCase());
      let target: SpatialMovie | null | undefined = null;
      if (matches.length === 1) target = matches[0];
      else if (matches.length > 1 && id) target = matches.find((m) => m.id === id);
      else if (matches.length > 1) target = matches[0];

      if (target) {
        setJumpTargetMovieId(target.id, true);
      }
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("movie");
      newUrl.searchParams.delete("id");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [spatialMovies, setJumpTargetMovieId]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [setIsMobile]);

  useEffect(() => {
    if (!isMobile) {
      const onMouseMove = (e: MouseEvent) => {
        const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
        const ndcY = -((e.clientY / window.innerHeight) * 2 - 1);
        useMovieStore.getState().setCursorNDC(ndcX, ndcY);
        setHoveredMovieClientPos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener("mousemove", onMouseMove);
      return () => window.removeEventListener("mousemove", onMouseMove);
    }
  }, [isMobile, setHoveredMovieClientPos]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (filteredMovies.length > 0) {
          const randomMovie =
            filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
          if (currentPath === "/") {
            setJumpTargetMovieId(randomMovie.id, false);
          } else {
            setSelectedMovieId(randomMovie.id);
          }
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedMovieId(null);
        setJumpTargetMovieId(null);
      }

      if (e.key === "s" || e.key === "S" || e.key === ",") {
        e.preventDefault();
        setSettingsOpen(!isSettingsOpen);
      }

      if (e.key === "?") {
        if (!isMobile) {
          e.preventDefault();
          setHelpOpen(!isHelpOpen);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    setSelectedMovieId,
    setJumpTargetMovieId,
    setSettingsOpen,
    isSettingsOpen,
    isHelpOpen,
    setHelpOpen,
    isMobile,
    filteredMovies,
    currentPath,
  ]);

  const cycleView = () => {
    if (currentPath === "/") {
      navigate({ to: "/grid" });
      if (!hasSeenGridTutorial) setHasSeenGridTutorial(true);
    } else if (currentPath === "/grid") {
      navigate({ to: "/shelf" });
    } else {
      navigate({ to: "/" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="h-4 w-4 animate-ping rounded-full bg-[#EBE8E1] opacity-75" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-center font-mono text-sm text-gray-500">
          The universe failed to load.
          <br />
          <button
            onClick={() => window.location.reload()}
            className="mt-4 underline hover:text-white"
          >
            Try again.
          </button>
        </div>
      </div>
    );
  }

  return (
    <MoviesContext.Provider value={{ spatialMovies, filteredMovies }}>
      <div
        className="relative h-screen w-screen overflow-hidden bg-[#050505]"
        style={{
          transition: "background-color 1s ease",
          backgroundColor: isPanelExpanded ? "#010101" : "#050505",
        }}
      >
        <a
          href="https://adimail.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            top: "1rem",
            left: "1rem",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "8px",
            overflow: "hidden",
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            transition: "all 0.2s ease",
          }}
        >
          <img
            src="https://adimail.github.io/sonchafa.png"
            alt="Sonchafa"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </a>

        <Outlet />

        <SearchBar allMovies={spatialMovies} filteredMovies={filteredMovies} />

        <button
          onClick={cycleView}
          title={
            currentPath === "/"
              ? "Switch to Grid View"
              : currentPath === "/grid"
                ? "Switch to Shelf View"
                : "Switch to 3D Space"
          }
          style={{
            position: "fixed",
            top: "1rem",
            right: isMobile ? "7rem" : "10rem",
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
          {currentPath === "/" ? (
            <LayoutGrid size={18} />
          ) : currentPath === "/grid" ? (
            <Library size={18} />
          ) : (
            <Box size={18} />
          )}
        </button>

        {hasSeenTutorial && !hasSeenGridTutorial && currentPath === "/" && (
          <div
            className="animate-bounce"
            style={{
              position: "fixed",
              top: "4.25rem",
              right: "10rem",
              zIndex: 60,
              background: "#d7a050",
              color: "#000",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-6px",
                right: "1.25rem",
                transform: "translateX(50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "6px solid #d7a050",
              }}
            />
            Click here for Grid &amp; Shelf View!
          </div>
        )}

        <button
          id="bookmark-btn"
          onClick={() => setBookmarkDrawerOpen(!isBookmarkDrawerOpen)}
          style={{
            position: "fixed",
            top: "1rem",
            right: isMobile ? "4rem" : "7rem",
            zIndex: 60,
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "8px",
            background: isBookmarkDrawerOpen ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.6)",
            border: `1px solid ${isBookmarkDrawerOpen ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}`,
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {isBookmarkDrawerOpen ? <X size={18} /> : <Bookmark size={18} />}
        </button>

        {!isMobile && (
          <button
            id="help-btn"
            onClick={() => setHelpOpen(!isHelpOpen)}
            style={{
              position: "fixed",
              top: "1rem",
              right: "4rem",
              zIndex: 60,
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "8px",
              background: isHelpOpen ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.6)",
              border: `1px solid ${isHelpOpen ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}`,
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {isHelpOpen ? <X size={18} /> : <HelpCircle size={18} />}
          </button>
        )}

        <button
          id="settings-btn"
          onClick={() => setSettingsOpen(!isSettingsOpen)}
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 60,
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "8px",
            background: isSettingsOpen ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.6)",
            border: `1px solid ${isSettingsOpen ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}`,
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {isSettingsOpen ? <X size={18} /> : <Settings size={18} />}
          {activeFilterCount > 0 && !isSettingsOpen && (
            <div
              style={{
                position: "absolute",
                top: "-0.25rem",
                right: "-0.25rem",
                background: "#d7a050",
                color: "#000",
                borderRadius: "50%",
                width: "1.1rem",
                height: "1.1rem",
                fontSize: "0.6rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "monospace",
                boxShadow: "0 0 4px rgba(0,0,0,0.5)",
              }}
            >
              {activeFilterCount}
            </div>
          )}
        </button>

        {isSettingsOpen && <SettingsMenu />}
        {isHelpOpen && !isMobile && <HelpMenu />}
        {isBookmarkDrawerOpen && <BookmarkDrawer movies={spatialMovies} />}
        {selectedMovie && currentPath !== "/shelf" && (
          <MovieDetail movie={selectedMovie} allMovies={spatialMovies} />
        )}
      </div>
    </MoviesContext.Provider>
  );
}
