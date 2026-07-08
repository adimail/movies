import { useEffect, useState } from "react";
import { useMovieStore } from "../store";

interface OnboardingOverlayProps {
  isMobile: boolean;
}

export function OnboardingOverlay({ isMobile }: OnboardingOverlayProps) {
  const { setHasSeenTutorial } = useMovieStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const dismiss = () => {
      setVisible(false);
      setTimeout(() => setHasSeenTutorial(true), 400);
    };

    const onWheel = () => dismiss();

    window.addEventListener("wheel", onWheel, { once: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, [setHasSeenTutorial]);

  const instructions = isMobile
    ? [
        { icon: "◈", text: "Use the D-Pad to steer" },
        { icon: "⚡", text: "Hold FLY button to fly forward" },
        { icon: "◻", text: "Tap a card to inspect" },
      ]
    : [
        { icon: "◈", text: "Move mouse to look around" },
        { icon: "⟳", text: "Scroll to fly through space" },
        { icon: "◻", text: "Click a card to inspect" },
      ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
          backdropFilter: "blur(20px)",
          padding: "2rem 2.5rem",
          textAlign: "center",
          maxWidth: "22rem",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.55rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            marginBottom: "1.25rem",
          }}
        >
          Welcome to the Universe
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {instructions.map((inst) => (
            <div key={inst.text} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "1rem",
                  color: "rgba(215,160,80,0.7)",
                  width: "1.5rem",
                  flexShrink: 0,
                  textAlign: "center",
                }}
              >
                {inst.icon}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.5)",
                  textAlign: "left",
                  letterSpacing: "0.04em",
                }}
              >
                {inst.text}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.55rem",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.18)",
            textTransform: "uppercase",
          }}
        >
          {isMobile ? "Hold FLY to begin" : "Scroll to begin"}
        </div>
      </div>
    </div>
  );
}

