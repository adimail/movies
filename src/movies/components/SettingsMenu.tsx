import { useEffect, useRef } from "react";
import { useMovieStore, defaultSettings } from "../store";
import { SCORE_KEYS } from "../types";
import { Star, RefreshCcw } from "lucide-react";

const label: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "0.6rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
  marginBottom: "0.4rem",
  display: "block",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "0.55rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.2)",
};

const sliderStyle: React.CSSProperties = {
  width: "100%",
  accentColor: "#d7a050",
  cursor: "pointer",
};

const checkboxRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  marginBottom: "0.6rem",
  cursor: "pointer",
};

const checkboxLabel: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "0.65rem",
  color: "rgba(255,255,255,0.7)",
};

function Toggle({
  value,
  onChange,
  label: l,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label style={checkboxRow}>
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#d7a050", cursor: "pointer", width: "1rem", height: "1rem" }}
      />
      <span style={checkboxLabel}>{l}</span>
    </label>
  );
}

function SliderRow({
  label: l,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={label as React.CSSProperties}>{l}</span>
        <span
          style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
        >
          {fmt ? fmt(value) : value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={sliderStyle}
      />
    </div>
  );
}

const GENRES = SCORE_KEYS.map((k) => k.replace(/([A-Z])/g, " $1").trim());

export function SettingsMenu() {
  const { settings, updateSettings, setSettingsOpen } = useMovieStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    selectedGenres,
    favoritesOnly,
    density,
    cardScale,
    flightSpeed,
    reduceMotion,
    invertScroll,
    muted,
  } = settings;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (!(e.target as Element).closest("#settings-btn")) {
          setSettingsOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [setSettingsOpen]);

  const handleResetSettings = () => {
    updateSettings(defaultSettings);
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: "4rem",
        right: "1rem",
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
          Settings
        </span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            marginBottom: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={sectionTitle}>Universe Content</span>
        </div>

        <button
          onClick={() => updateSettings({ favoritesOnly: !favoritesOnly })}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem",
            background: favoritesOnly ? "rgba(215,160,80,0.15)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${favoritesOnly ? "rgba(215,160,80,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Star
              size={16}
              color={favoritesOnly ? "#d7a050" : "rgba(255,255,255,0.4)"}
              fill={favoritesOnly ? "#d7a050" : "none"}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.65rem",
                color: favoritesOnly ? "#d7a050" : "rgba(255,255,255,0.7)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Only Show Favorites
            </span>
          </div>
          <div
            style={{
              width: "2rem",
              height: "1.1rem",
              borderRadius: "999px",
              background: favoritesOnly ? "#d7a050" : "rgba(255,255,255,0.2)",
              position: "relative",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "2px",
                left: favoritesOnly ? "calc(100% - 16px)" : "2px",
                width: "13.6px",
                height: "13.6px",
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={sectionTitle}>Genre Filter</span>
          {selectedGenres.length > 0 && (
            <button
              onClick={() => updateSettings({ selectedGenres: [] })}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "rgba(215,160,80,0.9)",
                fontFamily: "monospace",
                fontSize: "0.55rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {GENRES.map((g, i) => {
            const key = SCORE_KEYS[i];
            const active = selectedGenres.includes(key);
            return (
              <button
                key={key}
                onClick={() => {
                  const next = active
                    ? selectedGenres.filter((x) => x !== key)
                    : [...selectedGenres, key];
                  updateSettings({
                    selectedGenres: next,
                  });
                }}
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.05em",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "4px",
                  border: `1px solid ${active ? "rgba(215,160,80,0.6)" : "rgba(255,255,255,0.2)"}`,
                  background: active ? "rgba(215,160,80,0.15)" : "rgba(255,255,255,0.02)",
                  color: active ? "#d7a050" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            marginBottom: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={sectionTitle}>Layout</span>
        </div>
        <SliderRow
          label="Universe Density"
          value={density}
          min={0.3}
          max={2.5}
          onChange={(v) => updateSettings({ density: v })}
        />
        <SliderRow
          label="Card Size"
          value={cardScale}
          min={0.4}
          max={2.0}
          onChange={(v) => updateSettings({ cardScale: v })}
        />
        <SliderRow
          label="Flight Speed"
          value={flightSpeed}
          min={0.2}
          max={3.0}
          onChange={(v) => updateSettings({ flightSpeed: v })}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            marginBottom: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={sectionTitle}>Accessibility</span>
        </div>
        <Toggle
          value={reduceMotion}
          onChange={(v) => updateSettings({ reduceMotion: v })}
          label="Reduce motion"
        />
        <Toggle
          value={invertScroll}
          onChange={(v) => updateSettings({ invertScroll: v })}
          label="Invert scroll direction"
        />
        <Toggle
          value={!muted}
          onChange={(v) => updateSettings({ muted: !v })}
          label="Enable ambient audio"
        />
      </div>

      <div>
        <button
          onClick={handleResetSettings}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.75rem",
            background: "rgba(255, 107, 107, 0.1)",
            border: "1px solid rgba(255, 107, 107, 0.3)",
            borderRadius: "6px",
            color: "#ff6b6b",
            fontFamily: "monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 107, 107, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 107, 107, 0.1)";
          }}
        >
          <RefreshCcw size={14} />
          Reset All Settings
        </button>
      </div>
    </div>
  );
}

