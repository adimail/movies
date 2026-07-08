import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Settings {
  selectedGenres: string[];
  favoritesOnly: boolean;
  density: number;
  cardScale: number;
  flightSpeed: number;
  reduceMotion: boolean;
  invertScroll: boolean;
  muted: boolean;
}

interface MovieStore {
  scrollTarget: number;
  cameraTarget: { x: number; y: number; z: number };
  cursorWorld: { x: number; y: number; z: number };
  cursorNDC: { x: number; y: number };
  selectedMovieId: string | null;
  hoveredMovieId: string | null;
  hoveredMovieClientPos: { x: number; y: number } | null;
  isPanelExpanded: boolean;
  isSettingsOpen: boolean;
  isHelpOpen: boolean;
  isBookmarkDrawerOpen: boolean;
  isMobile: boolean;
  hasSeenTutorial: boolean;
  waveCounterReset: number;
  settings: Settings;
  jumpTargetMovieId: string | null;
  openDetailsOnJump: boolean;
  visibleMovies: import("./types").SpatialMovie[];
  endOfUniverseZ: number | null;
  voidLimitZ: number;
  bookmarkedMovieIds: string[];

  setScrollTarget: (z: number) => void;
  setCameraTarget: (x: number, y: number, z: number) => void;
  nudgeCameraTarget: (dx: number, dy: number, dz: number) => void;
  setCursorWorld: (x: number, y: number, z: number) => void;
  setCursorNDC: (x: number, y: number) => void;
  setSelectedMovieId: (id: string | null) => void;
  setHoveredMovieId: (id: string | null) => void;
  setHoveredMovieClientPos: (pos: { x: number; y: number } | null) => void;
  setPanelExpanded: (expanded: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  setBookmarkDrawerOpen: (open: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setHasSeenTutorial: (seen: boolean) => void;
  setJumpTargetMovieId: (id: string | null, openDetails?: boolean) => void;
  setVisibleMovies: (movies: import("./types").SpatialMovie[]) => void;
  setEndOfUniverseZ: (z: number | null) => void;
  setVoidLimitZ: (z: number) => void;
  resetCamera: () => void;
  triggerWaveReset: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleBookmark: (id: string) => void;
}

export const defaultSettings: Settings = {
  selectedGenres: [],
  favoritesOnly: false,
  density: 1.5,
  cardScale: 1,
  flightSpeed: 1,
  reduceMotion: false,
  invertScroll: false,
  muted: true,
};

export const useMovieStore = create<MovieStore>()(
  persist(
    (set) => ({
      scrollTarget: 15,
      cameraTarget: { x: 0, y: 0, z: 15 },
      cursorWorld: { x: 0, y: 0, z: 0 },
      cursorNDC: { x: 0, y: 0 },
      selectedMovieId: null,
      hoveredMovieId: null,
      hoveredMovieClientPos: null,
      isPanelExpanded: false,
      isSettingsOpen: false,
      isHelpOpen: false,
      isBookmarkDrawerOpen: false,
      isMobile: false,
      hasSeenTutorial: false,
      waveCounterReset: 0,
      settings: defaultSettings,
      jumpTargetMovieId: null,
      openDetailsOnJump: true,
      visibleMovies: [],
      endOfUniverseZ: null,
      voidLimitZ: 15,
      bookmarkedMovieIds: [],

      setScrollTarget: (z) => set({ scrollTarget: z }),
      setCameraTarget: (x, y, z) => set({ cameraTarget: { x, y, z } }),
      nudgeCameraTarget: (dx, dy, dz) =>
        set((state) => ({
          cameraTarget: {
            x: state.cameraTarget.x + dx,
            y: state.cameraTarget.y + dy,
            z: state.cameraTarget.z + dz,
          },
        })),
      setCursorWorld: (x, y, z) => set({ cursorWorld: { x, y, z } }),
      setCursorNDC: (x, y) => set({ cursorNDC: { x, y } }),
      setSelectedMovieId: (id) => set({ selectedMovieId: id }),
      setHoveredMovieId: (id) => set({ hoveredMovieId: id }),
      setHoveredMovieClientPos: (pos) => set({ hoveredMovieClientPos: pos }),
      setPanelExpanded: (expanded) => set({ isPanelExpanded: expanded }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setHelpOpen: (open) => set({ isHelpOpen: open }),
      setBookmarkDrawerOpen: (open) => set({ isBookmarkDrawerOpen: open }),
      setIsMobile: (mobile) => set({ isMobile: mobile }),
      setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),
      setJumpTargetMovieId: (id, openDetails = true) =>
        set({ jumpTargetMovieId: id, openDetailsOnJump: openDetails }),
      setVisibleMovies: (movies) => set({ visibleMovies: movies }),
      setEndOfUniverseZ: (z) => set({ endOfUniverseZ: z }),
      setVoidLimitZ: (z) => set({ voidLimitZ: z }),
      resetCamera: () =>
        set({
          cameraTarget: { x: 0, y: 0, z: 15 },
          waveCounterReset: Date.now(),
          jumpTargetMovieId: null,
          openDetailsOnJump: true,
        }),
      triggerWaveReset: () => set({ waveCounterReset: Date.now() }),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      toggleBookmark: (id) =>
        set((state) => {
          const exists = state.bookmarkedMovieIds.includes(id);
          return {
            bookmarkedMovieIds: exists
              ? state.bookmarkedMovieIds.filter((bId) => bId !== id)
              : [...state.bookmarkedMovieIds, id],
          };
        }),
    }),
    {
      name: "movies-universe-prefs",
      partialize: (state) => ({
        settings: state.settings,
        hasSeenTutorial: state.hasSeenTutorial,
        bookmarkedMovieIds: state.bookmarkedMovieIds,
      }),
    }
  )
);

