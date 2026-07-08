import { useEffect, useRef } from "react";
import { useMovieStore } from "../store";
import { MousePointer2, Settings2, Sparkles, Move, Command } from "lucide-react";

const sectionTitle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "0.55rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.2)",
};

export function HelpMenu() {
  const { setHelpOpen } = useMovieStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHelpOpen(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (!(e.target as Element).closest("#help-btn")) {
          setHelpOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [setHelpOpen]);

  const Item = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
    <div
      style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}
    >
      <div style={{ color: "rgba(215,160,80,0.8)", marginTop: "0.1rem" }}>{icon}</div>
      <div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.9)",
            marginBottom: "0.2rem",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.4,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: "4rem",
        right: "4rem",
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
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.8)",
            textTransform: "uppercase",
          }}
        >
          How to Navigate
        </span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            marginBottom: "1rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={sectionTitle}>Controls</span>
        </div>

        <Item
          icon={<MousePointer2 size={16} />}
          title="Look Around"
          desc="Move your mouse cursor to point the camera towards different areas of the universe."
        />
        <Item
          icon={<Move size={16} />}
          title="Fly Through Space"
          desc="Scroll up or down with your mouse wheel or trackpad to fly forward or backward."
        />
        <Item
          icon={<Sparkles size={16} />}
          title="Inspect Movie"
          desc="Click on any movie card to fly directly to it and open its details."
        />
      </div>

      <div>
        <div
          style={{
            marginBottom: "1rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={sectionTitle}>Keyboard Shortcuts</span>
        </div>

        <Item
          icon={
            <div style={{ fontFamily: "monospace", fontSize: "0.7rem", fontWeight: "bold" }}>␣</div>
          }
          title="Random Jump (Spacebar)"
          desc="Press the Spacebar to instantly jump to a random movie in the current filtered view."
        />
        <Item
          icon={<Command size={16} />}
          title="Search (⌘K or Ctrl+K)"
          desc="Quickly open the search bar to find a movie by title, description, or notes."
        />
        <Item
          icon={<Settings2 size={16} />}
          title="Settings (S or ,)"
          desc="Toggle the settings menu to adjust filters, layout density, and accessibility."
        />
        <Item
          icon={
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.6rem",
                fontWeight: "bold",
                marginTop: "0.15rem",
              }}
            >
              ESC
            </div>
          }
          title="Close / Deselect (Escape)"
          desc="Close an open movie, exit menus, or clear your current selection."
        />
        <Item
          icon={
            <div style={{ fontFamily: "monospace", fontSize: "0.7rem", fontWeight: "bold" }}>?</div>
          }
          title="Help Menu"
          desc="Toggle this instruction panel."
        />
      </div>
    </div>
  );
}
