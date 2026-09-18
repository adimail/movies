import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMovieStore } from "../store";
import { CardEntry } from "../types";
import { PARALLAX_RANGE } from "../constants";

const _currentLookAt = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();
const _blended = new THREE.Vector3();
const _targetPos = new THREE.Vector3();

export function useCameraMotion(
  cards: React.RefObject<Map<string, CardEntry>>,
  entryAnimDone: React.RefObject<boolean>,
  fadeIn?: boolean
) {
  useFrame(({ camera: cam, pointer }) => {
    if (!entryAnimDone.current && fadeIn) {
      cam.position.z += (15 - cam.position.z) * 0.04;
      if (Math.abs(cam.position.z - 15) < 0.1) entryAnimDone.current = true;
    }

    const state = useMovieStore.getState();
    const target = state.cameraTarget;
    const cursor = state.cursorNDC;
    const s = state.settings;
    const menuOpen = state.isSettingsOpen || state.isHelpOpen;
    const motionMultiplier = menuOpen ? 0.5 : 1;

    let jumpTargetCard: CardEntry | null = null;
    if (state.jumpTargetMovieId && cards.current) {
      const jumpId = state.jumpTargetMovieId;
      let minDist = Infinity;

      for (const entry of cards.current.values()) {
        if (entry.movieId === jumpId) {
          const dist = entry.worldZ - cam.position.z;
          if (entry.worldZ < cam.position.z && Math.abs(dist) < minDist) {
            minDist = Math.abs(dist);
            jumpTargetCard = entry;
          }
        }
      }

      if (jumpTargetCard) {
        const destX = jumpTargetCard.group.position.x;
        const destY = jumpTargetCard.group.position.y;
        const destZ = jumpTargetCard.group.position.z + 14;

        const dx = destX - target.x;
        const dy = destY - target.y;
        const dz = destZ - target.z;

        state.setCameraTarget(target.x + dx * 0.1, target.y + dy * 0.1, target.z + dz * 0.1);

        const distToCam = Math.sqrt(
          Math.pow(destX - cam.position.x, 2) +
            Math.pow(destY - cam.position.y, 2) +
            Math.pow(destZ - cam.position.z, 2)
        );

        if (distToCam < 2.5 || (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(dz) < 0.5)) {
          if (state.openDetailsOnJump) {
            state.setSelectedMovieId(jumpId);
          }
          state.setJumpTargetMovieId(null);
        }
      } else {
        state.nudgeCameraTarget(0, 0, -3 * 1.5);
      }
    }

    if (!state.selectedMovieId) {
      const parallaxX = s.reduceMotion ? 0 : pointer.x * PARALLAX_RANGE * motionMultiplier;
      const parallaxY = s.reduceMotion ? 0 : pointer.y * PARALLAX_RANGE * motionMultiplier;

      cam.position.x += target.x + parallaxX - cam.position.x;
      cam.position.y += target.y + parallaxY - cam.position.y;
      cam.position.z += target.z - cam.position.z;

      if (!s.reduceMotion) {
        cam.getWorldDirection(_currentLookAt);

        if (state.jumpTargetMovieId && jumpTargetCard) {
          _desiredLookAt
            .set(
              jumpTargetCard.group.position.x,
              jumpTargetCard.group.position.y,
              jumpTargetCard.group.position.z
            )
            .sub(cam.position)
            .normalize();
        } else {
          const lookAtX = target.x + cursor.x * 8 * motionMultiplier;
          const lookAtY = target.y + cursor.y * 8 * motionMultiplier;
          const lookAtZ = target.z - 20;
          _desiredLookAt.set(lookAtX, lookAtY, lookAtZ).sub(cam.position).normalize();
        }

        _blended.copy(_currentLookAt).lerp(_desiredLookAt, 0.05).normalize();
        _targetPos.copy(cam.position).add(_blended);
        cam.lookAt(_targetPos);
      } else if (state.jumpTargetMovieId && jumpTargetCard) {
        cam.lookAt(jumpTargetCard.group.position);
      }
    }
  });
}
