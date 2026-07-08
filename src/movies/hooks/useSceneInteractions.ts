import { useEffect } from "react";
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

  useEffect(() => {
    const getTargets = () => {
      const targets: { mesh: THREE.Object3D; movieId: string }[] = [];
      if (!cards.current) return targets;

      cards.current.forEach((entry) => {
        if (entry.posterMesh) targets.push({ mesh: entry.posterMesh, movieId: entry.movieId });
        targets.push({ mesh: entry.borderMesh, movieId: entry.movieId });
      });
      return targets;
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const targets = getTargets();
      const hits = raycaster.intersectObjects(
        targets.map((t) => t.mesh),
        false
      );
      if (hits.length > 0) {
        const found = targets.find((t) => t.mesh === hits[0].object);
        if (found) setJumpTargetMovieId(found.movieId, true);
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => {
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, camera, setJumpTargetMovieId, cards, containerRef]);

  useFrame(({ pointer, raycaster, camera: cam }) => {
    if (!containerRef.current || !cards.current) return;
    const state = useMovieStore.getState();
    if (state.selectedMovieId || state.isMobile) return;

    raycaster.setFromCamera(pointer, cam);
    const targets: { mesh: THREE.Object3D; movieId: string }[] = [];
    cards.current.forEach((entry) => {
      if (entry.posterMesh) targets.push({ mesh: entry.posterMesh, movieId: entry.movieId });
      targets.push({ mesh: entry.borderMesh, movieId: entry.movieId });
    });

    const hits = raycaster.intersectObjects(
      targets.map((t) => t.mesh),
      false
    );

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
