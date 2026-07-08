import { useMovieStore } from "../store";

export function NoResultsFallback() {
  const { settings, updateSettings } = useMovieStore();

  const { favoritesOnly, selectedGenres } = settings;

  const activeFilters: string[] = [];

  if (favoritesOnly) {
    activeFilters.push("Favorites Only");
  }

  if (selectedGenres.length > 0) {
    activeFilters.push(
      ...selectedGenres.map((g) =>
        g
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/^./, (str) => str.toUpperCase())
      )
    );
  }

  const handleReset = () => {
    updateSettings({
      favoritesOnly: false,
      selectedGenres: [],
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 45,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "rgba(10,10,10,0.85)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "8px",
        backdropFilter: "blur(20px)",
        padding: "2.5rem 2rem",
        width: "min(24rem, 90vw)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "1rem",
          color: "rgba(255,255,255,0.9)",
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        Empty Void
      </div>

      <p
        style={{
          fontFamily: "monospace",
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "1.5rem",
          lineHeight: 1.5,
        }}
      >
        No movies match the currently applied filters.
      </p>

      <div
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "6px",
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "monospace",
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.75rem",
          }}
        >
          Active Filters
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {activeFilters.map((filter, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: "monospace",
                fontSize: "0.65rem",
                color: "#d7a050",
              }}
            >
              • {filter}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleReset}
        style={{
          background: "rgba(215,160,80,0.15)",
          border: "1px solid rgba(215,160,80,0.4)",
          color: "#d7a050",
          fontFamily: "monospace",
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          padding: "0.6rem 1.5rem",
          borderRadius: "4px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(215,160,80,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(215,160,80,0.15)";
        }}
      >
        Reset Filters
      </button>
    </div>
  );
}

