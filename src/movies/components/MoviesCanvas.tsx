"use client";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useMovies } from "../hooks/useMovies";
import { useMovieStore } from "../store";
import { generateSpatialData } from "../math";
import { SpatialMovie } from "../types";
import { CustomCursor } from "./CustomCursor";
import { TastePanel } from "./TastePanel";
import { MovieDetail } from "./MovieDetail";
import { MoviesScene } from "./MoviesScene";
import { GenreCompass } from "./GenreCompass";
import { SettingsMenu } from "./SettingsMenu";
import { HelpMenu } from "./HelpMenu";
import { BookmarkDrawer } from "./BookmarkDrawer";
import { MobileControls } from "./MobileControls";
import { SearchBar } from "./SearchBar";
import { OnboardingOverlay } from "./OnboardingOverlay";
import { HoverTooltip } from "./HoverTooltip";
import { MovieGridView } from "./MovieGridView";
import { Settings, HelpCircle, X, Bookmark, LayoutGrid, Box } from "lucide-react";
import { SCORE_KEYS } from "../types";

const DIRECTION_SCALE_X = 0.55;
const DIRECTION_SCALE_Y = 0.35;

export function MoviesCanvas() {
  const { data, isLoading, isError } = useMovies();
  const {
    viewMode,
    setViewMode,
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
    setHasSeenTutorial,
    setHoveredMovieClientPos,
    setJumpTargetMovieId,
  } = useMovieStore();

  const [spatialMovies, setSpatialMovies] = useState<SpatialMovie[]>([]);
  const [canvasReady, setCanvasReady] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const boostRef = useRef(false);
  const boostRafRef = useRef<number>(0);
  const urlParsed = useRef(false);

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
    if (!canvasReady || spatialMovies.length === 0 || urlParsed.current) return;
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
  }, [canvasReady, spatialMovies, setJumpTargetMovieId]);

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
    if (!isLoading && data) {
      setTimeout(() => {
        setCanvasReady(true);
        setTimeout(() => setFadeIn(true), 50);
      }, 100);
    }
  }, [isLoading, data]);

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

  const handleRandomJump = useCallback(() => {
    if (filteredMovies.length > 0) {
      const randomMovie = filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
      setJumpTargetMovieId(randomMovie.id, false);
    }
  }, [filteredMovies, setJumpTargetMovieId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Escape") {
        setSelectedMovieId(null);
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

      if (e.code === "Space") {
        e.preventDefault();
        if (!selectedMovieId && !isSettingsOpen && !isHelpOpen && !isBookmarkDrawerOpen) {
          handleRandomJump();
        } else {
          setSelectedMovieId(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    setSelectedMovieId,
    setSettingsOpen,
    isSettingsOpen,
    isHelpOpen,
    setHelpOpen,
    isBookmarkDrawerOpen,
    isMobile,
    handleRandomJump,
    selectedMovieId,
  ]);

  const handleWheel = (e: React.WheelEvent) => {
    const state = useMovieStore.getState();
    if (
      state.viewMode === "grid" ||
      state.selectedMovieId ||
      state.jumpTargetMovieId ||
      state.isSettingsOpen ||
      state.isHelpOpen ||
      state.isBookmarkDrawerOpen
    )
      return;
    if (!hasSeenTutorial) setHasSeenTutorial(true);

    const invertMul = state.settings.invertScroll ? -1 : 1;
    const thrust = e.deltaY * 0.05 * state.settings.flightSpeed * invertMul;

    const rawX = state.cursorNDC.x;
    const rawY = state.cursorNDC.y;
    const mag = Math.sqrt(rawX * rawX + rawY * rawY) || 0;
    const deadzone = 0.15;
    const effectiveMag = Math.max(0, mag - deadzone) / (1 - deadzone);
    const dirX = mag > 0 ? rawX / mag : 0;
    const dirY = mag > 0 ? rawY / mag : 0;

    const dz = -thrust;
    const dx = dirX * effectiveMag * Math.abs(thrust) * DIRECTION_SCALE_X;
    const dy = dirY * effectiveMag * Math.abs(thrust) * DIRECTION_SCALE_Y;

    const nextZ = state.cameraTarget.z + dz;
    const limitZ = state.endOfUniverseZ;
    const maxBackZ = Math.min(15, state.voidLimitZ);

    if (nextZ > maxBackZ) {
      if (state.cameraTarget.z < maxBackZ) {
        state.nudgeCameraTarget(dx, dy, maxBackZ - state.cameraTarget.z);
      }
      return;
    }

    if (limitZ !== null && nextZ < limitZ) {
      state.nudgeCameraTarget(dx, dy, limitZ - state.cameraTarget.z);
    } else {
      state.nudgeCameraTarget(dx, dy, dz);
    }
  };

  const startBoost = () => {
    if (!hasSeenTutorial) setHasSeenTutorial(true);
    boostRef.current = true;
    const loop = () => {
      if (!boostRef.current) return;
      const state = useMovieStore.getState();
      if (
        state.viewMode === "grid" ||
        state.jumpTargetMovieId ||
        state.isSettingsOpen ||
        state.isHelpOpen ||
        state.isBookmarkDrawerOpen
      ) {
        boostRafRef.current = requestAnimationFrame(loop);
        return;
      }

      const baseSpeed = state.isMobile ? 0.35 : 0.15;
      const thrust = baseSpeed * state.settings.flightSpeed;

      const rawX = state.cursorNDC.x;
      const rawY = state.cursorNDC.y;
      const mag = Math.sqrt(rawX * rawX + rawY * rawY) || 0;

      const dirX = mag > 0 ? rawX / mag : 0;
      const dirY = mag > 0 ? rawY / mag : 0;

      const dx = dirX * mag * Math.abs(thrust) * DIRECTION_SCALE_X;
      const dy = dirY * mag * Math.abs(thrust) * DIRECTION_SCALE_Y;
      const dz = -thrust;

      const nextZ = state.cameraTarget.z + dz;
      const limitZ = state.endOfUniverseZ;
      const maxBackZ = Math.min(15, state.voidLimitZ);

      if (nextZ > maxBackZ) {
        if (state.cameraTarget.z < maxBackZ) {
          state.nudgeCameraTarget(dx, dy, maxBackZ - state.cameraTarget.z);
        }
      } else if (limitZ !== null && nextZ < limitZ) {
        state.nudgeCameraTarget(dx, dy, limitZ - state.cameraTarget.z);
      } else {
        state.nudgeCameraTarget(dx, dy, dz);
      }
      boostRafRef.current = requestAnimationFrame(loop);
    };
    boostRafRef.current = requestAnimationFrame(loop);
  };

  const stopBoost = () => {
    boostRef.current = false;
    cancelAnimationFrame(boostRafRef.current);
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

  const showSystemCursor = isMobile || viewMode === "grid" || !!(selectedMovieId || isSettingsOpen || isHelpOpen || isBookmarkDrawerOpen);

  return (
    <div
      onWheel={handleWheel}
      className="relative h-screen w-screen overflow-hidden bg-[#050505]"
      style={{
        cursor: showSystemCursor ? "default" : "none",
        transition: "background-color 1s ease",
        backgroundColor: isPanelExpanded ? "#010101" : "#050505",
      }}
    >
      {!showSystemCursor && <CustomCursor />}
      {!isMobile && viewMode === "3d" && <GenreCompass />}
      {viewMode === "3d" && <HoverTooltip movies={filteredMovies} />}

      {viewMode === "3d" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: fadeIn ? (isPanelExpanded ? 0.1 : 1) : 0,
            transition: fadeIn ? "opacity 1s ease" : "opacity 1.2s cubic-bezier(0.16,1,0.3,1)",
            pointerEvents: isPanelExpanded ? "none" : "auto",
          }}
        >
          {canvasReady && (
            <Canvas camera={{ position: [0, 0, 30], fov: 60 }} gl={{ antialias: true }}>
              <MoviesScene movies={filteredMovies} fadeIn={fadeIn} />
            </Canvas>
          )}
        </div>
      )}

      {viewMode === "grid" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "#050505" }}>
          <MovieGridView movies={filteredMovies} />
        </div>
      )}

      <SearchBar allMovies={spatialMovies} filteredMovies={filteredMovies} />

      <button
        onClick={() => setViewMode(viewMode === "3d" ? "grid" : "3d")}
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
        {viewMode === "3d" ? <LayoutGrid size={18} /> : <Box size={18} />}
      </button>

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
      {!isMobile && viewMode === "3d" && <TastePanel movies={filteredMovies} />}
      {selectedMovie && <MovieDetail movie={selectedMovie} allMovies={spatialMovies} />}
      {isMobile && viewMode === "3d" && (
        <MobileControls
          onBoostStart={startBoost}
          onBoostEnd={stopBoost}
          onRandomJump={handleRandomJump}
        />
      )}
      {!hasSeenTutorial && viewMode === "3d" && <OnboardingOverlay isMobile={isMobile} />}
    </div>
  );
}
