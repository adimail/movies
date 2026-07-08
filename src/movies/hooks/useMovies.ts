import { useState, useEffect } from "react";
import { Movie } from "../types";

const CACHE_KEY = "movies_api_cache";
const CACHE_DURATION_MS = 3 * 60 * 1000;

export function useMovies() {
  const [data, setData] = useState<{ movies: Movie[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
          setData({ movies: parsed.movies });
          setIsLoading(false);
          return;
        }
      } catch (e) {}
    }

    const API_URL = import.meta.env.PROD
      ? "https://zip-courtroom-dragonwarrior.vercel.app/api/movies"
      : "/api/movies";

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((json) => {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ movies: json.movies, timestamp: Date.now() })
        );
        setData(json);
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setIsLoading(false);
      });
  }, []);

  return { data, isLoading, isError };
}
