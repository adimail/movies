import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SpatialMovie } from "../types";
import { useMovieStore } from "../store";
import { CardEntry } from "../types";
import { NoResults3D } from "./NoResults3D";
import { disposeCard } from "../utils/cardBuilder";
import { useSceneInteractions } from "../hooks/useSceneInteractions";
import { useCameraMotion } from "../hooks/useCameraMotion";
import { useInfiniteSpawner } from "../hooks/useInfiniteSpawner";

interface MoviesSceneProps {
  movies: SpatialMovie[];
  fadeIn?: boolean;
}

export function MoviesScene({ movies, fadeIn }: MoviesSceneProps) {
  const { setEndOfUniverseZ } = useMovieStore();
  const { scene, camera } = useThree();

  const containerRef = useRef<THREE.Group | null>(null);
  const cards = useRef<Map<string, CardEntry>>(new Map());
  const entryAnimDone = useRef(false);
  const [signZ, setSignZ] = useState<number | null>(null);

  const moviesRef = useRef(movies);

  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  useEffect(() => {
    const container = new THREE.Group();
    containerRef.current = container;
    scene.add(container);
    return () => {
      cards.current.forEach((entry) => disposeCard(entry));
      cards.current.clear();
      scene.remove(container);
    };
  }, [scene]);

  useEffect(() => {
    if (movies.length === 0) {
      let minZ = camera.position.z;
      cards.current.forEach((c) => {
        if (c.worldZ < minZ) minZ = c.worldZ;
      });
      const targetZ = minZ - 30;
      setSignZ(targetZ);
      setEndOfUniverseZ(targetZ + 15);
    } else {
      setSignZ(null);
      setEndOfUniverseZ(null);
    }
  }, [movies, camera, setEndOfUniverseZ]);

  useFrame(() => {
    if (!cards.current) return;

    let maxZ = -Infinity;
    cards.current.forEach((c) => {
      if (c.worldZ > maxZ) maxZ = c.worldZ;
    });

    const store = useMovieStore.getState();

    if (maxZ === -Infinity) {
      if (store.voidLimitZ !== 15) {
        store.setVoidLimitZ(15);
      }
    } else {
      const targetLimit = maxZ + 60;
      if (Math.abs(store.voidLimitZ - targetLimit) > 0.5) {
        store.setVoidLimitZ(targetLimit);
      }
    }
  });

  useSceneInteractions(cards, containerRef);
  useCameraMotion(cards, entryAnimDone, fadeIn);
  useInfiniteSpawner(moviesRef, cards, containerRef);

  return (
    <>
      <fog attach="fog" args={["#050505", 15, 100]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[0, 0, 10]} intensity={1} />
      {signZ !== null && <NoResults3D z={signZ} />}
    </>
  );
}
