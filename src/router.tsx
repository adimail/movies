import { useEffect } from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
} from "@tanstack/react-router";
import { RootLayout } from "./movies/components/RootLayout";
import { Home3DView } from "./movies/components/Home3DView";
import { MovieGridView } from "./movies/components/MovieGridView";
import { MovieShelfView } from "./movies/components/MovieShelfView";
import { useMoviesContext } from "./movies/context";
import { useMovieStore } from "./movies/store";

function GridRouteComponent() {
  const { filteredMovies } = useMoviesContext();
  const setViewMode = useMovieStore((s) => s.setViewMode);

  useEffect(() => {
    setViewMode("grid");
  }, [setViewMode]);

  return <MovieGridView movies={filteredMovies} />;
}

function ShelfRouteComponent() {
  const { filteredMovies } = useMoviesContext();
  const setViewMode = useMovieStore((s) => s.setViewMode);

  useEffect(() => {
    setViewMode("shelf");
  }, [setViewMode]);

  return <MovieShelfView movies={filteredMovies} />;
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home3DView,
});

const gridRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/grid",
  component: GridRouteComponent,
});

const shelfRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shelf",
  component: ShelfRouteComponent,
});

const routeTree = rootRoute.addChildren([indexRoute, gridRoute, shelfRoute]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

