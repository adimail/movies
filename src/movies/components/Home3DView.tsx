import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useMovieStore } from "../store";
import { useMoviesContext } from "../context";
import { CustomCursor } from "./CustomCursor";
import { MoviesScene } from "./MoviesScene";
import { GenreCompass } from "./GenreCompass";
import { TastePanel } from "./TastePanel";
import { HoverTooltip } from "./HoverTooltip";
import { MobileControls } from "./MobileControls";
import { OnboardingOverlay } from "./OnboardingOverlay";

const DIRECTION_SCALE_X = 0.55;
const DIRECTION_SCALE_Y = 0.35;

export function Home3DView() {
  const { filteredMovies } = useMoviesContext();
  const {
    setViewMode,
    selectedMovieId,
    isPanelExpanded,
    isSettingsOpen,
    isHelpOpen,
    isBookmarkDrawerOpen,
    isMobile,
    hasSeenTutorial,
    setHasSeenTutorial,
    setJumpTargetMovieId,
  } = useMovieStore();

  const [canvasReady, setCanvasReady] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const boostRef = useRef(false);
  const boostRafRef = useRef<number>(0);

  useEffect(() => {
    setViewMode("3d");
  }, [setViewMode]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setCanvasReady(true);
      const t2 = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(t2);
    }, 100);
    return () => clearTimeout(t1);
  }, []);

  const handleRandomJump = () => {
    if (filteredMovies.length > 0) {
      const randomMovie = filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
      setJumpTargetMovieId(randomMovie.id, false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const state = useMovieStore.getState();
    if (state.jumpTargetMovieId) {
      state.setJumpTargetMovieId(null);
    }
    if (
      state.selectedMovieId ||
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
    const state = useMovieStore.getState();
    if (state.jumpTargetMovieId) state.setJumpTargetMovieId(null);
    if (state.selectedMovieId) state.setSelectedMovieId(null);

    boostRef.current = true;
    const loop = () => {
      if (!boostRef.current) return;
      const s = useMovieStore.getState();
      if (s.isSettingsOpen || s.isHelpOpen || s.isBookmarkDrawerOpen) {
        boostRafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (s.jumpTargetMovieId) s.setJumpTargetMovieId(null);

      const baseSpeed = s.isMobile ? 0.35 : 0.15;
      const thrust = baseSpeed * s.settings.flightSpeed;

      const rawX = s.cursorNDC.x;
      const rawY = s.cursorNDC.y;
      const mag = Math.sqrt(rawX * rawX + rawY * rawY) || 0;

      const dirX = mag > 0 ? rawX / mag : 0;
      const dirY = mag > 0 ? rawY / mag : 0;

      const dx = dirX * mag * Math.abs(thrust) * DIRECTION_SCALE_X;
      const dy = dirY * mag * Math.abs(thrust) * DIRECTION_SCALE_Y;
      const dz = -thrust;

      const nextZ = s.cameraTarget.z + dz;
      const limitZ = s.endOfUniverseZ;
      const maxBackZ = Math.min(15, s.voidLimitZ);

      if (nextZ > maxBackZ) {
        if (s.cameraTarget.z < maxBackZ) {
          s.nudgeCameraTarget(dx, dy, maxBackZ - s.cameraTarget.z);
        }
      } else if (limitZ !== null && nextZ < limitZ) {
        s.nudgeCameraTarget(dx, dy, limitZ - s.cameraTarget.z);
      } else {
        s.nudgeCameraTarget(dx, dy, dz);
      }
      boostRafRef.current = requestAnimationFrame(loop);
    };
    boostRafRef.current = requestAnimationFrame(loop);
  };

  const stopBoost = () => {
    boostRef.current = false;
    cancelAnimationFrame(boostRafRef.current);
  };

  const showSystemCursor =
    isMobile || !!(selectedMovieId || isSettingsOpen || isHelpOpen || isBookmarkDrawerOpen);

  return (
    <div
      onWheel={handleWheel}
      style={{
        position: "absolute",
        inset: 0,
        cursor: showSystemCursor ? "default" : "none",
        touchAction: "none",
      }}
    >
      {!showSystemCursor && <CustomCursor />}
      {!isMobile && <GenreCompass />}
      <HoverTooltip movies={filteredMovies} />

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
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 30], fov: 60 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <MoviesScene movies={filteredMovies} fadeIn={fadeIn} />
          </Canvas>
        )}
      </div>

      {!isMobile && <TastePanel movies={filteredMovies} />}
      {isMobile && (
        <MobileControls
          onBoostStart={startBoost}
          onBoostEnd={stopBoost}
          onRandomJump={handleRandomJump}
        />
      )}
      {!hasSeenTutorial && <OnboardingOverlay isMobile={isMobile} />}
    </div>
  );
}
