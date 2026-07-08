import * as THREE from "three";

export const SCORE_KEYS = [
  "romance",
  "scifi",
  "thriller",
  "action",
  "drama",
  "mystery",
  "fantasy",
  "horror",
  "comedy",
  "historical",
  "gravitas",
  "visualSpectacle",
] as const;

export type MovieScores = number[];

export interface Movie {
  id: string;
  title: string;
  favorite: boolean;
  posterUrl: string;
  description: string;
  scores: MovieScores;
}

export interface SpatialMovie extends Movie {
  x: number;
  y: number;
  z: number;
}

export interface CardEntry {
  instanceId: string;
  movieId: string;
  group: THREE.Group;
  borderMesh: THREE.Mesh;
  posterMesh: THREE.Mesh | null;
  particleMesh: THREE.Points | null;
  worldZ: number;
  textureLoaded: boolean;
  tunnelCenterX: number;
  tunnelCenterY: number;
  seed: number;
}

