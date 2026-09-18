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

const _scaleVec = new THREE.Vector3();
const _dirToCard = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _cursorVec = new THREE.Vector2();

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
    const activeTargetId = state.jumpTargetMovieId || state.selectedMovieId;
    const reduceMotion = s.reduceMotion;
    const camX = cam.position.x;
    const camY = cam.position.y;
    const currentZ = cam.position.z;

    const spreadX = BASE_SPREAD_X * s.density;
    const spreadY = BASE_SPREAD_Y * s.density;

    let activeEntry: CardEntry | null = null;
    if (activeTargetId) {
      for (const entry of cards.current.values()) {
        if (entry.movieId === activeTargetId) {
          activeEntry = entry;
          break;
        }
      }
    }

    const activeX = activeEntry ? activeEntry.group.position.x : 0;
    const activeY = activeEntry ? activeEntry.group.position.y : 0;
    const activeZ = activeEntry ? activeEntry.worldZ : 0;

    for (const entry of cards.current.values()) {
      entry.group.lookAt(cam.position);
      if (!reduceMotion) {
        const targetScale = entry.movieId === currentHoveredId ? 1.05 * s.cardScale : s.cardScale;
        _scaleVec.set(targetScale, targetScale, targetScale);
        entry.group.scale.lerp(_scaleVec, 0.1);
      }
      if (entry.particleMesh) {
        entry.particleMesh.rotation.z -= 0.001;
      }

      const jitterX = (seededRandom(entry.seed) - 0.5) * spreadX;
      const jitterY = (seededRandom(entry.seed + 100) - 0.5) * spreadY;
      let targetX = entry.tunnelCenterX + jitterX;
      let targetY = entry.tunnelCenterY + jitterY;
      let targetZ = entry.worldZ;

      if (activeEntry) {
        if (entry === activeEntry) {
          targetZ = entry.worldZ + 1.8;
        } else {
          const dx = targetX - activeX;
          const dy = targetY - activeY;
          const distSq = dx * dx + dy * dy;
          const dz = Math.abs(entry.worldZ - activeZ);

          if (distSq < 196 && dz < 25) {
            const dist = Math.sqrt(distSq);
            const spatialFactor = (1 - dist / 14) * (1 - dz / 25);
            targetZ = entry.worldZ - 18 * spatialFactor;
            if (dist > 0.01) {
              targetX += (dx / dist) * 7.5 * spatialFactor;
              targetY += (dy / dist) * 7.5 * spatialFactor;
            }
          }
        }
      }

      entry.group.position.x += (targetX - entry.group.position.x) * 0.1;
      entry.group.position.y += (targetY - entry.group.position.y) * 0.1;
      entry.group.position.z += (targetZ - entry.group.position.z) * 0.1;
    }

    const zChanged = Math.abs(currentZ - lastEvalZ.current) >= EVAL_THRESHOLD;
    _cursorVec.set(cursor.x, cursor.y);
    const cursorChanged = lastEvalCursor.current.distanceTo(_cursorVec) >= 0.15;

    if (!zChanged && !cursorChanged) return;

    lastEvalZ.current = currentZ;
    lastEvalCursor.current.copy(_cursorVec);

    const allMovies = moviesRef.current;
    if (!allMovies || allMovies.length === 0) return;

    for (const [id, entry] of cards.current.entries()) {
      if (entry.worldZ > currentZ + CULL_BEHIND) {
        disposeCard(entry);
        containerRef.current.remove(entry.group);
        cards.current.delete(id);
      }
    }

    cam.getWorldDirection(_camDir);

    let furthestZ = currentZ - 5;
    for (const entry of cards.current.values()) {
      _dirToCard.set(
        entry.group.position.x - camX,
        entry.group.position.y - camY,
        entry.group.position.z - currentZ
      );
      if (_dirToCard.lengthSq() > 0.001) {
        _dirToCard.normalize();
        if (_camDir.dot(_dirToCard) > 0.75) {
          if (entry.worldZ < furthestZ) furthestZ = entry.worldZ;
        }
      }
    }

    const ranked = rankMoviesByDirection(allMovies, cursor, s.selectedGenres);
    const safeDirZ = _camDir.z === 0 ? -1 : _camDir.z;
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
        const tunnelCenterX = camX + _camDir.x * t;
        const tunnelCenterY = camY + _camDir.y * t;

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
        _dirToCard.set(
          entry.group.position.x - camX,
          entry.group.position.y - camY,
          entry.group.position.z - currentZ
        );
        let dot = -1;
        if (_dirToCard.lengthSq() > 0.001) {
          dot = _camDir.dot(_dirToCard.normalize());
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
