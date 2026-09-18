import { createContext, useContext } from "react";
import { SpatialMovie } from "./types";

export interface MoviesContextValue {
  spatialMovies: SpatialMovie[];
  filteredMovies: SpatialMovie[];
}

export const MoviesContext = createContext<MoviesContextValue>({
  spatialMovies: [],
  filteredMovies: [],
});

export const useMoviesContext = () => useContext(MoviesContext);

