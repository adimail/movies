import { useEffect, useRef, useState } from "react";
import { SpatialMovie, SCORE_KEYS } from "../types";
import { useMovieStore } from "../store";
import { X, Star, Bookmark, Share2, Check } from "lucide-react";
import { motion, useMotionValue, animate as framerAnimate } from "framer-motion";

interface MovieDetailProps {
  movie: SpatialMovie;
  allMovies: SpatialMovie[];
}

const springTransition = { type: "spring", bounce: 0.15, duration: 0.5 } as const;

export function MovieDetail({ movie, allMovies }: MovieDetailProps) {
  const { setSelectedMovieId, isMobile, toggleBookmark, bookmarkedMovieIds } = useMovieStore();
  const [visible, setVisible] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const y = useMotionValue(30);
  const scale = useMotionValue(0.95);
  const touchStartY = useRef<number | null>(null);

  const isBookmarked = bookmarkedMovieIds.includes(movie.id);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (visible) {
      framerAnimate(y, 0, springTransition);
      framerAnimate(scale, 1, springTransition);
    } else if (y.get() < 150) {
      framerAnimate(y, 30, springTransition);
      framerAnimate(scale, 0.95, springTransition);
    }
  }, [visible, y, scale]);

  const handleClose = (swipedDown = false) => {
    setVisible(false);
    if (swipedDown) {
      const screenHeight = typeof window !== "undefined" ? window.innerHeight : 800;
      framerAnimate(y, screenHeight, { duration: 0.3, ease: "easeIn" });
    }
    setTimeout(() => setSelectedMovieId(null), 320);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (panelRef.current && panelRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      y.set(deltaY * 0.85);
    } else {
      y.set(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || touchStartY.current === null) return;
    touchStartY.current = null;
    if (y.get() > 150) {
      handleClose(true);
    } else {
      framerAnimate(y, 0, springTransition);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  const handleImageToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageExpanded((prev) => {
      if (!prev && panelRef.current) {
        panelRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      return !prev;
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicates = allMovies.filter((m) => m.title === movie.title);
    const url = new URL(window.location.href);
    url.searchParams.set("movie", movie.title);
    if (duplicates.length > 1) {
      url.searchParams.set("id", movie.id);
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: `Check out this movie: ${movie.title}`,
          url: url.toString(),
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpanded = isMobile || imageExpanded;
  const desktopPadding = { pt: "2.5rem", pr: "2rem", pb: "2rem", pl: "2.5rem" };
  const mobilePadding = { pt: "1.5rem", pr: "1.25rem", pb: "5rem", pl: "1.25rem" };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "0" : "2rem",
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.32s ease",
        cursor: isMobile ? "default" : "none",
      }}
    >
      <motion.div
        layout
        transition={springTransition}
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: isExpanded ? "column" : "row",
          height: isMobile ? "100dvh" : "min(640px, 90vh)",
          width: "100%",
          maxWidth: "960px",
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehaviorY: "none",
          borderRadius: isMobile ? "0" : "12px",
          background: "#0a0a0a",
          border: isMobile ? "none" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.9)",
          y,
          scale,
        }}
      >
        <motion.div
          layout
          transition={springTransition}
          onClick={handleImageToggle}
          style={{
            position: isExpanded ? "relative" : "sticky",
            top: 0,
            alignSelf: "flex-start",
            width: isExpanded ? "100%" : "42%",
            height: imageExpanded ? "auto" : isMobile ? "50vh" : "min(640px, 90vh)",
            aspectRatio: imageExpanded ? "2/3" : "auto",
            flexShrink: 0,
            overflow: "hidden",
            cursor: isMobile ? "default" : imageExpanded ? "zoom-out" : "zoom-in",
          }}
        >
          <img
            src={movie.posterUrl}
            alt={movie.title}
            style={{ objectFit: "cover", objectPosition: "center 20%", width: "100%", height: "100%" }}
          />

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "80px",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "1.25rem",
              right: "1.25rem",
              display: "flex",
              gap: "0.5rem",
              zIndex: 50,
            }}
          >
            <button
              onClick={handleShare}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? "3.2rem" : "2.5rem",
                height: isMobile ? "3.2rem" : "2.5rem",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(12px)",
                cursor: "pointer",
                color: copied ? "#10b981" : "#fff",
                transition: "all 0.2s",
              }}
            >
              {copied ? <Check size={isMobile ? 22 : 16} /> : <Share2 size={isMobile ? 22 : 16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(movie.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? "3.2rem" : "2.5rem",
                height: isMobile ? "3.2rem" : "2.5rem",
                borderRadius: "50%",
                background: isBookmarked ? "rgba(215,160,80,0.2)" : "rgba(0,0,0,0.5)",
                border: isBookmarked ? "1px solid #d7a050" : "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(12px)",
                cursor: "pointer",
                color: isBookmarked ? "#d7a050" : "#fff",
                transition: "all 0.2s",
              }}
            >
              <Bookmark size={isMobile ? 22 : 16} fill={isBookmarked ? "#d7a050" : "none"} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? "3.2rem" : "2.5rem",
                height: isMobile ? "3.2rem" : "2.5rem",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(12px)",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <X size={isMobile ? 24 : 18} />
            </button>
          </div>

          {isExpanded && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 70%, #0a0a0a 100%)",
                pointerEvents: "none",
              }}
            />
          )}
        </motion.div>

        <motion.div
          layout
          transition={springTransition}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            color: "#e8e4dc",
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: "#0a0a0a",
              paddingTop: isExpanded ? mobilePadding.pt : desktopPadding.pt,
              paddingRight: isExpanded ? mobilePadding.pr : desktopPadding.pr,
              paddingBottom: "1rem",
              paddingLeft: isExpanded ? mobilePadding.pl : desktopPadding.pl,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              {movie.favorite && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Star size={12} fill="#d7a050" color="#d7a050" />
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: isMobile ? "0.75rem" : "0.65rem",
                      letterSpacing: "0.15em",
                      color: "#d7a050",
                      textTransform: "uppercase",
                    }}
                  >
                    FAVORITE
                  </span>
                </div>
              )}
            </div>
            <h1
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: isMobile ? "2.1rem" : "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
                color: "#f0ece4",
              }}
            >
              {movie.title}
            </h1>
          </div>

          <div
            style={{
              paddingRight: isExpanded ? mobilePadding.pr : desktopPadding.pr,
              paddingBottom: isExpanded ? mobilePadding.pb : desktopPadding.pb,
              paddingLeft: isExpanded ? mobilePadding.pl : desktopPadding.pl,
            }}
          >
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontSize: isMobile ? "1rem" : "0.85rem",
                lineHeight: 1.7,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.6)",
                marginTop: "1.25rem",
                marginBottom: "1.75rem",
                paddingBottom: "1.75rem",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              &ldquo;{movie.description}&rdquo;
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "1.25rem" : "0.75rem 2.5rem",
              }}
            >
              {SCORE_KEYS.map((key, i) => (
                <ScoreRow key={key} label={key} value={movie.scores[i]} isMobile={isMobile} />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ScoreRow({ label, value, isMobile }: { label: string; value: number; isMobile: boolean }) {
  const display = label.replace(/([A-Z])/g, " $1").trim();
  const pct = `${(value / 10) * 100}%`;
  const isHigh = value >= 7;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        fontSize: isMobile ? "0.8rem" : "0.7rem",
      }}
    >
      <span
        style={{
          width: isMobile ? "7.5rem" : "6rem",
          flexShrink: 0,
          textTransform: "capitalize",
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.02em",
        }}
      >
        {display}
      </span>
      <div
        style={{
          flex: 1,
          height: isMobile ? "4px" : "2px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: pct }}
          transition={{ ...springTransition, delay: 0.2 }}
          style={{
            height: "100%",
            background: isHigh ? "rgba(215,160,80,0.9)" : "rgba(255,255,255,0.4)",
            borderRadius: "4px",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "monospace",
          width: "1.5rem",
          textAlign: "right",
          color: isHigh ? "#d7a050" : "rgba(255,255,255,0.5)",
          fontWeight: isHigh ? "bold" : "normal",
        }}
      >
        {value}
      </span>
    </div>
  );
}

