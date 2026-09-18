import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMovieStore } from "../store";
import { CardEntry } from "../types";

export function useSceneInteractions(
  cards: React.RefObject<Map<string, CardEntry>>,
  containerRef: React.RefObject<THREE.Group | null>
) {
  const { gl, camera } = useThree();
  const setJumpTargetMovieId = useMovieStore((s) => s.setJumpTargetMovieId);
  const pointerMovedRef = useRef(false);
  const targetsRef = useRef<{ mesh: THREE.Object3D; movieId: string }[]>([]);
  const meshArrayRef = useRef<THREE.Object3D[]>([]);

  useEffect(() => {
    const onPointerMove = () => {
      pointerMovedRef.current = true;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current || !cards.current) return;
      if (e.button !== 0) return;
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const meshes: THREE.Object3D[] = [];
      const mapping = new Map<THREE.Object3D, string>();
      cards.current.forEach((entry) => {
        meshes.push(entry.borderMesh);
        mapping.set(entry.borderMesh, entry.movieId);
      });

      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const movieId = mapping.get(hits[0].object);
        if (movieId) setJumpTargetMovieId(movieId, true);
      } else {
        const state = useMovieStore.getState();
        if (state.jumpTargetMovieId || state.selectedMovieId) {
          state.setJumpTargetMovieId(null);
          state.setSelectedMovieId(null);
        }
      }
    };

    gl.domElement.addEventListener("pointerdown", handlePointerDown);
    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [gl, camera, setJumpTargetMovieId, cards, containerRef]);

  useFrame(({ pointer, raycaster, camera: cam }) => {
    if (!containerRef.current || !cards.current) return;
    const state = useMovieStore.getState();
    if (state.selectedMovieId || state.isMobile) return;

    if (!pointerMovedRef.current) return;
    pointerMovedRef.current = false;

    raycaster.setFromCamera(pointer, cam);

    const targets = targetsRef.current;
    const meshes = meshArrayRef.current;
    targets.length = 0;
    meshes.length = 0;

    cards.current.forEach((entry) => {
      targets.push({ mesh: entry.borderMesh, movieId: entry.movieId });
      meshes.push(entry.borderMesh);
    });

    const hits = raycaster.intersectObjects(meshes, false);

    if (hits.length > 0) {
      const found = targets.find((t) => t.mesh === hits[0].object);
      if (found && state.hoveredMovieId !== found.movieId) {
        state.setHoveredMovieId(found.movieId);
      }
    } else if (state.hoveredMovieId !== null) {
      state.setHoveredMovieId(null);
    }
  });
}
