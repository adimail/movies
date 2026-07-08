import { useMovieStore } from "../store";

export function GenreCompass() {
  const { cursorNDC, isPanelExpanded, selectedMovieId } = useMovieStore();

  if (isPanelExpanded || selectedMovieId) return null;

  const getOpacity = (value: number, direction: 1 | -1) => {
    const intensity = value * direction;
    return intensity > 0 ? 0.15 + intensity * 0.6 : 0.15;
  };

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    fontFamily: "monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#EBE8E1",
    pointerEvents: "none",
    transition: "opacity 0.1s ease-out",
    zIndex: 20,
    textShadow: "0 2px 10px rgba(0,0,0,0.8)",
  };

  return (
    <>
      <div
        style={{
          ...baseStyle,
          top: "4.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: getOpacity(cursorNDC.y, 1),
        }}
      >
        LIGHT / COMEDIC
      </div>

      <div
        style={{
          ...baseStyle,
          bottom: "4.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: getOpacity(cursorNDC.y, -1),
        }}
      >
        DARK / TENSE
      </div>

      <div
        style={{
          ...baseStyle,
          left: "2.5rem",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          transformOrigin: "center",
          opacity: getOpacity(cursorNDC.x, -1),
        }}
      >
        GROUNDED / REALITY
      </div>

      <div
        style={{
          ...baseStyle,
          right: "2.5rem",
          top: "50%",
          transform: "translateY(-50%) rotate(90deg)",
          transformOrigin: "center",
          opacity: getOpacity(cursorNDC.x, 1),
        }}
      >
        FANTASY / SCI-FI
      </div>
    </>
  );
}
