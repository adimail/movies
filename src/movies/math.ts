import { Movie, SpatialMovie, MovieScores, SCORE_KEYS } from "./types";

const SESSION_SEED = Math.random() * 10000;

export function seededRandom(index: number): number {
  const x = Math.sin(SESSION_SEED + index * 127.1) * 43758.5453123;
  return x - Math.floor(x);
}

export function calculateCoordinates(movie: Movie): { x: number; y: number } {
  const s = movie.scores;

  const fantasyAxis = s[1] + s[6] + s[11];
  const realityAxis = s[4] + s[9] + s[10];
  const x = (fantasyAxis - realityAxis) * 0.8;

  const lightAxis = s[0] + s[3] + s[8];
  const darkAxis = s[2] + s[5] + s[7];
  const y = (lightAxis - darkAxis) * 0.8;

  return { x, y };
}

export function generateSpatialData(movies: Movie[]): SpatialMovie[] {
  return movies.map((movie, index) => {
    const { x, y } = calculateCoordinates(movie);
    const zBase = -(seededRandom(index * 3) * 75 + 5);
    const xJitter = (seededRandom(index * 7 + 1) - 0.5) * 4;
    const yJitter = (seededRandom(index * 11 + 2) - 0.5) * 4;
    return { ...movie, x: x + xJitter, y: y + yJitter, z: zBase };
  });
}

export function rankMoviesByDirection(
  movies: SpatialMovie[],
  cursorNDC: { x: number; y: number }
): SpatialMovie[] {
  const dirX = cursorNDC.x;
  const dirY = cursorNDC.y;
  const mag = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const normDirX = dirX / mag;
  const normDirY = dirY / mag;

  const scored = movies.map((m) => {
    const mMag = Math.sqrt(m.x * m.x + m.y * m.y) || 0.001;
    const dot = (m.x / mMag) * normDirX + (m.y / mMag) * normDirY;

    const coneWeight = dot > 0.2 ? 1 : Math.max(0, dot + 1);
    const score = coneWeight * (1 + mMag * 0.05) + seededRandom(m.x * m.y) * 0.5;

    return { movie: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.movie);
}

export function getTasteVectorFromCursor(
  cursorNDC: { x: number; y: number },
  movies: SpatialMovie[],
  count: number = 7
): MovieScores {
  if (movies.length === 0 || (cursorNDC.x === 0 && cursorNDC.y === 0)) {
    return new Array(SCORE_KEYS.length).fill(0);
  }

  const dirX = cursorNDC.x;
  const dirY = cursorNDC.y;
  const dirMag = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const normDirX = dirX / dirMag;
  const normDirY = dirY / dirMag;

  const scored = movies.map((m) => {
    const mMag = Math.sqrt(m.x * m.x + m.y * m.y) || 0.001;
    const dot = (m.x / mMag) * normDirX + (m.y / mMag) * normDirY;
    const weight = ((dot + 1) / 2) * (1 + mMag * 0.05);
    return { movie: m, weight };
  });

  scored.sort((a, b) => b.weight - a.weight);
  const top = scored.slice(0, count);
  const totalWeight = top.reduce((acc, s) => acc + s.weight, 0) || 1;

  return SCORE_KEYS.map((_, i) => {
    const weightedSum = top.reduce((acc, s) => acc + s.movie.scores[i] * s.weight, 0);
    return Math.round(weightedSum / totalWeight);
  });
}
