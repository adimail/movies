"use client";

import { useEffect, useRef, useState } from "react";
import { useMovieStore } from "../store";
import { SpatialMovie, MovieScores, SCORE_KEYS } from "../types";
import { getTasteVectorFromCursor } from "../math";
import { X } from "lucide-react";

interface TastePanelProps {
  movies: SpatialMovie[];
}

function getCardColor(movie: SpatialMovie): string {
  return movie.favorite ? "#f59e0b" : "#ffffff";
}

export function TastePanel({ movies }: TastePanelProps) {
  const { cursorNDC, isPanelExpanded, setPanelExpanded, hoveredMovieId, visibleMovies } =
    useMovieStore();
  const [cursorVector, setCursorVector] = useState<MovieScores | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const sourceMovies = visibleMovies.length > 0 ? visibleMovies : movies;
    if (!sourceMovies.length) return;

    const now = performance.now();
    if (now - lastUpdateRef.current < 90) {
      const timeout = setTimeout(() => {
        setCursorVector(getTasteVectorFromCursor(cursorNDC, sourceMovies, 7));
        lastUpdateRef.current = performance.now();
      }, 90 - (now - lastUpdateRef.current));
      return () => clearTimeout(timeout);
    }

    lastUpdateRef.current = now;
    setCursorVector(getTasteVectorFromCursor(cursorNDC, sourceMovies, 7));
  }, [cursorNDC, visibleMovies, movies]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isPanelExpanded && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelExpanded, setPanelExpanded]);

  const hoveredMovie = hoveredMovieId
    ? (movies.find((m) => m.id === hoveredMovieId) ?? null)
    : null;
  const glowColor = hoveredMovie ? getCardColor(hoveredMovie) : null;

  const hoveredScores = hoveredMovie
    ? SCORE_KEYS.map((key, i) => ({ label: key, value: hoveredMovie.scores[i] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
    : null;

  if (!cursorVector) return null;

  const allScores = SCORE_KEYS.map((key, i) => ({ label: key, value: cursorVector[i] })).sort(
    (a, b) => b.value - a.value
  );

  const displayScores = isPanelExpanded ? allScores : allScores.slice(0, 3);
  const isHoverMode = !!hoveredMovie && !isPanelExpanded;

  const reality = cursorVector[4] + cursorVector[9] + cursorVector[10];
  const fantasy = cursorVector[1] + cursorVector[6] + cursorVector[11];
  const realityFantasyPct = Math.max(5, Math.min(95, (fantasy / (reality + fantasy || 1)) * 100));

  const dark = cursorVector[2] + cursorVector[5] + cursorVector[7];
  const light = cursorVector[0] + cursorVector[3] + cursorVector[8];
  const darkLightPct = Math.max(5, Math.min(95, (light / (dark + light || 1)) * 100));

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "1.5rem",
        zIndex: 40,
        width: "17rem",
        overflow: isPanelExpanded ? "auto" : "hidden",
        maxHeight: isPanelExpanded ? "80vh" : "auto",
        borderRadius: "0.75rem",
        border: `1px solid ${glowColor ? `${glowColor}55` : "rgba(255,255,255,0.15)"}`,
        background: "rgba(8,8,8,0.85)",
        padding: "1.25rem",
        fontFamily: "monospace",
        fontSize: "0.75rem",
        color: "#d1d5db",
        backdropFilter: "blur(16px)",
        boxShadow: glowColor
          ? `0 0 18px 2px ${glowColor}33, 0 0 40px 4px ${glowColor}18`
          : "0 10px 30px rgba(0,0,0,0.5)",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontWeight: "bold",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: glowColor ? `${glowColor}cc` : "rgba(255,255,255,0.5)",
            fontSize: "0.65rem",
            transition: "color 0.25s ease",
          }}
        >
          {isHoverMode ? hoveredMovie!.title : "Taste Vector"}
        </span>
        {isPanelExpanded && (
          <button
            onClick={() => setPanelExpanded(false)}
            style={{
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {!isHoverMode && (
        <div
          style={{
            marginBottom: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <SpectrumBar leftLabel="Reality" rightLabel="Fantasy" percentage={realityFantasyPct} />
          <SpectrumBar leftLabel="Dark" rightLabel="Light" percentage={darkLightPct} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {isHoverMode
          ? hoveredScores!.map((s) => (
              <ScoreRow key={s.label} label={s.label} value={s.value} accentColor={glowColor!} />
            ))
          : displayScores.map((s) => (
              <ScoreRow key={s.label} label={s.label} value={s.value} accentColor={null} />
            ))}
      </div>

      {!isPanelExpanded && !isHoverMode && (
        <button
          onClick={() => setPanelExpanded(true)}
          style={{
            marginTop: "1rem",
            width: "100%",
            textAlign: "center",
            color: "rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "4px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.65rem",
            padding: "0.4rem 0",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.35)";
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
        >
          View Full Breakdown
        </button>
      )}
    </div>
  );
}

function SpectrumBar({
  leftLabel,
  rightLabel,
  percentage,
}: {
  leftLabel: string;
  rightLabel: string;
  percentage: number;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.55rem",
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          marginBottom: "0.3rem",
        }}
      >
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "3px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "2px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${percentage}%`,
            transform: "translate(-50%, -50%)",
            width: "6px",
            height: "10px",
            background: "#d7a050",
            borderRadius: "1px",
            boxShadow: "0 0 6px rgba(215,160,80,0.6)",
            transition: "left 0.3s ease-out",
          }}
        />
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: number;
  accentColor: string | null;
}) {
  const displayLabel = label.replace(/([A-Z])/g, " $1").trim();
  const pct = `${(value / 10) * 100}%`;
  const barColor = accentColor ?? "rgba(255,255,255,0.6)";
  const numberColor = accentColor ?? "rgba(255,255,255,0.6)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
      }}
    >
      <span
        style={{
          width: "6rem",
          textTransform: "capitalize",
          flexShrink: 0,
          color: accentColor ? `${accentColor}cc` : "rgba(255,255,255,0.6)",
          fontSize: "0.65rem",
          transition: "color 0.25s ease",
        }}
      >
        {displayLabel}
      </span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            flex: 1,
            height: "0.375rem",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: pct,
              background: barColor,
              borderRadius: "9999px",
              transition: "width 0.25s ease, background 0.25s ease",
              boxShadow: accentColor ? `0 0 6px 1px ${accentColor}88` : "none",
            }}
          />
        </div>
        <span
          style={{
            width: "0.75rem",
            textAlign: "right",
            color: numberColor,
            fontSize: "0.65rem",
            transition: "color 0.25s ease",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
