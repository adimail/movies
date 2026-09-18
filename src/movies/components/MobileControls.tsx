import { useEffect, useRef } from "react";
import { useMovieStore } from "../store";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Target,
  Navigation,
  Shuffle,
} from "lucide-react";

interface MobileControlsProps {
  onBoostStart: () => void;
  onBoostEnd: () => void;
  onRandomJump: () => void;
}

const STEER_SPEED = 0.05;

const btnStyle = (active?: boolean): React.CSSProperties => ({
  width: "3rem",
  height: "3rem",
  borderRadius: "4px",
  background: active ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.6)",
  cursor: "pointer",
  userSelect: "none",
  WebkitUserSelect: "none",
  KhtmlUserSelect: "none",
  MozUserSelect: "none",
  msUserSelect: "none",
  WebkitTouchCallout: "none",
  touchAction: "none",
  transition: "background 0.1s",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
});

export function MobileControls({ onBoostStart, onBoostEnd, onRandomJump }: MobileControlsProps) {
  const { setCursorNDC } = useMovieStore();
  const pressedRef = useRef({ up: false, down: false, left: false, right: false });
  const rafRef = useRef<number>(0);

  const unlock = () => {
    const state = useMovieStore.getState();
    if (state.jumpTargetMovieId) state.setJumpTargetMovieId(null);
    if (state.selectedMovieId) state.setSelectedMovieId(null);
  };

  useEffect(() => {
    const loop = () => {
      const p = pressedRef.current;
      if (p.up || p.down || p.left || p.right) {
        const state = useMovieStore.getState();
        let nx = state.cursorNDC.x;
        let ny = state.cursorNDC.y;

        if (p.up) ny = Math.min(1, ny + STEER_SPEED);
        if (p.down) ny = Math.max(-1, ny - STEER_SPEED);
        if (p.left) nx = Math.max(-1, nx - STEER_SPEED);
        if (p.right) nx = Math.min(1, nx + STEER_SPEED);

        setCursorNDC(nx, ny);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [setCursorNDC]);

  const press = (dir: keyof typeof pressedRef.current) => {
    unlock();
    pressedRef.current[dir] = true;
  };

  const release = (dir: keyof typeof pressedRef.current) => {
    pressedRef.current[dir] = false;
  };

  const center = () => {
    unlock();
    setCursorNDC(0, 0);
  };

  const makeDir = (dir: keyof typeof pressedRef.current, icon: React.ReactNode) => (
    <button
      style={btnStyle()}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        press(dir);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        release(dir);
      }}
      onPointerLeave={(e) => {
        e.preventDefault();
        release(dir);
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
        release(dir);
      }}
    >
      {icon}
    </button>
  );

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: 0,
        right: 0,
        zIndex: 35,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        padding: "0 1.5rem",
        pointerEvents: "none",
        WebkitTouchCallout: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 3rem)",
          gridTemplateRows: "repeat(3, 3rem)",
          gap: "0.3rem",
          pointerEvents: "auto",
        }}
      >
        <div />
        {makeDir("up", <ChevronUp size={16} />)}
        <div />

        {makeDir("left", <ChevronLeft size={16} />)}
        <button
          style={btnStyle()}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            e.preventDefault();
            center();
          }}
        >
          <Target size={16} />
        </button>
        {makeDir("right", <ChevronRight size={16} />)}

        <div />
        {makeDir("down", <ChevronDown size={16} />)}
        <div />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
        <button
          style={{
            ...btnStyle(),
            width: "5rem",
            height: "5rem",
            borderRadius: "50%",
            border: "1.5px solid rgba(215,160,80,0.4)",
            color: "#d7a050",
            pointerEvents: "auto",
            flexDirection: "column",
            gap: "0.2rem",
            fontSize: "0.5rem",
            fontFamily: "monospace",
            letterSpacing: "0.1em",
          }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            e.preventDefault();
            unlock();
            onBoostStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onBoostEnd();
          }}
          onPointerLeave={(e) => {
            e.preventDefault();
            onBoostEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onBoostEnd();
          }}
        >
          <Navigation size={22} style={{ transform: "rotate(-45deg)", marginBottom: "2px" }} />
          <span>FLY</span>
        </button>

        <button
          style={{
            ...btnStyle(),
            width: "5rem",
            height: "3rem",
            border: "1.5px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.8)",
            pointerEvents: "auto",
            flexDirection: "row",
            gap: "0.2rem",
            fontSize: "0.45rem",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
          }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            e.preventDefault();
            unlock();
            onRandomJump();
          }}
        >
          <Shuffle size={14} />
          <span>JUMP</span>
        </button>
      </div>
    </div>
  );
}
