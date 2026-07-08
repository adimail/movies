import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SpatialMovie } from "../types";
import { useMovieStore } from "../store";
import { CardEntry } from "../types";
import { createCard, disposeCard } from "../utils/cardBuilder";
import { seededRandom, rankMoviesByDirection } from "../math";
import {
  SPAWN_LOOKAHEAD,
  CULL_BEHIND,
  WAVE_DEPTH,
  CARDS_PER_WAVE,
  BASE_SPREAD_X,
  BASE_SPREAD_Y,
  EVAL_THRESHOLD,
} from "../constants";

export function useInfiniteSpawner(
  moviesRef: React.RefObject<SpatialMovie[]>,
  cards: React.RefObject<Map<string, CardEntry>>,
  containerRef: React.RefObject<THREE.Group | null>
) {
  const waveCounter = useRef(0);
  const lastEvalZ = useRef<number>(Infinity);
  const lastEvalCursor = useRef(new THREE.Vector2(0, 0));
  const lastSpawnedWave = useRef<Map<string, number>>(new Map());
  const waveCounterReset = useMovieStore((s) => s.waveCounterReset);

  useEffect(() => {
    if (waveCounterReset === 0 || !cards.current) return;
    cards.current.forEach((entry) => {
      disposeCard(entry);
      containerRef.current?.remove(entry.group);
    });
    cards.current.clear();
    lastSpawnedWave.current.clear();
    waveCounter.current = 0;
    lastEvalZ.current = Infinity;
    lastEvalCursor.current.set(0, 0);
  }, [waveCounterReset, cards, containerRef]);

  useFrame(({ camera: cam }) => {
    if (!containerRef.current || !cards.current) return;

    const state = useMovieStore.getState();
    const cursor = state.cursorNDC;
    const s = state.settings;
    const currentHoveredId = state.hoveredMovieId;
    const reduceMotion = s.reduceMotion;
    const camX = cam.position.x;
    const camY = cam.position.y;
    const currentZ = cam.position.z;

    const spreadX = BASE_SPREAD_X * s.density;
    const spreadY = BASE_SPREAD_Y * s.density;

    for (const entry of cards.current.values()) {
      entry.group.lookAt(cam.position);
      if (!reduceMotion) {
        const targetScale = entry.movieId === currentHoveredId ? 1.05 * s.cardScale : s.cardScale;
        entry.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      }
      if (entry.particleMesh) {
        entry.particleMesh.rotation.z -= 0.001;
      }

      const jitterX = (seededRandom(entry.seed) - 0.5) * spreadX;
      const jitterY = (seededRandom(entry.seed + 100) - 0.5) * spreadY;
      const targetX = entry.tunnelCenterX + jitterX;
      const targetY = entry.tunnelCenterY + jitterY;

      entry.group.position.x += (targetX - entry.group.position.x) * 0.1;
      entry.group.position.y += (targetY - entry.group.position.y) * 0.1;
    }

    const zChanged = Math.abs(currentZ - lastEvalZ.current) >= EVAL_THRESHOLD;
    const cursorChanged =
      lastEvalCursor.current.distanceTo(new THREE.Vector2(cursor.x, cursor.y)) >= 0.15;

    if (!zChanged && !cursorChanged) return;

    lastEvalZ.current = currentZ;
    lastEvalCursor.current.set(cursor.x, cursor.y);

    const allMovies = moviesRef.current;
    if (!allMovies || allMovies.length === 0) return;

    for (const [id, entry] of cards.current.entries()) {
      if (entry.worldZ > currentZ + CULL_BEHIND) {
        disposeCard(entry);
        containerRef.current.remove(entry.group);
        cards.current.delete(id);
      }
    }

    const camDir = new THREE.Vector3();
    cam.getWorldDirection(camDir);

    let furthestZ = currentZ - 5;
    for (const entry of cards.current.values()) {
      const dirToCard = new THREE.Vector3(
        entry.group.position.x - camX,
        entry.group.position.y - camY,
        entry.group.position.z - currentZ
      );
      if (dirToCard.lengthSq() > 0.001) {
        dirToCard.normalize();
        if (camDir.dot(dirToCard) > 0.75) {
          if (entry.worldZ < furthestZ) furthestZ = entry.worldZ;
        }
      }
    }

    const ranked = rankMoviesByDirection(allMovies, cursor);
    const safeDirZ = camDir.z === 0 ? -1 : camDir.z;
    const cardScale = s.cardScale;

    let nextWaveZ = furthestZ - WAVE_DEPTH;

    while (nextWaveZ > currentZ - SPAWN_LOOKAHEAD) {
      const wave = waveCounter.current++;
      const waveMemoryThreshold = Math.min(10, Math.floor(ranked.length / CARDS_PER_WAVE) - 1);

      for (let slot = 0; slot < CARDS_PER_WAVE; slot++) {
        const instanceId = `wave:${wave}:slot:${slot}`;
        if (cards.current.has(instanceId)) continue;

        let baseMovie = ranked[0];
        for (let i = 0; i < ranked.length; i++) {
          const checkIndex = (wave * CARDS_PER_WAVE + slot + i) % ranked.length;
          const checkMovie = ranked[checkIndex];
          const lastSpawned = lastSpawnedWave.current.get(checkMovie.id) ?? -999;

          if (wave - lastSpawned > waveMemoryThreshold) {
            baseMovie = checkMovie;
            lastSpawnedWave.current.set(checkMovie.id, wave);
            break;
          }
        }

        const seed = wave * 31 + slot * 7;
        const jitterX = (seededRandom(seed) - 0.5) * spreadX;
        const jitterY = (seededRandom(seed + 100) - 0.5) * spreadY;
        const zScatter = (seededRandom(seed + 200) - 0.5) * WAVE_DEPTH * 0.5;

        const worldZ = nextWaveZ + zScatter;
        const t = (worldZ - currentZ) / safeDirZ;
        const tunnelCenterX = camX + camDir.x * t;
        const tunnelCenterY = camY + camDir.y * t;

        const worldX = tunnelCenterX + jitterX;
        const worldY = tunnelCenterY + jitterY;

        const entry = createCard(
          baseMovie,
          instanceId,
          worldX,
          worldY,
          worldZ,
          cardScale,
          tunnelCenterX,
          tunnelCenterY,
          seed
        );
        containerRef.current.add(entry.group);
        cards.current.set(instanceId, entry);
      }

      nextWaveZ -= WAVE_DEPTH;
    }

    if (cards.current.size > 200) {
      const sorted = Array.from(cards.current.entries()).map(([id, entry]) => {
        const dirToCard = new THREE.Vector3(
          entry.group.position.x - camX,
          entry.group.position.y - camY,
          entry.group.position.z - currentZ
        );
        let dot = -1;
        if (dirToCard.lengthSq() > 0.001) {
          dot = camDir.dot(dirToCard.normalize());
        }
        return { id, entry, dot };
      });
      sorted.sort((a, b) => a.dot - b.dot);

      const toRemove = sorted.slice(0, cards.current.size - 200);
      for (const item of toRemove) {
        disposeCard(item.entry);
        containerRef.current.remove(item.entry.group);
        cards.current.delete(item.id);
      }
    }

    const visibleIds = new Set(Array.from(cards.current.values()).map((c) => c.movieId));
    const visibleMovies = allMovies.filter((m) => visibleIds.has(m.id));
    state.setVisibleMovies(visibleMovies);
  });
}

