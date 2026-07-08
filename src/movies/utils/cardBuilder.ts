import * as THREE from "three";
import { SpatialMovie } from "../types";
import { CardEntry } from "../types";
import { getBorderColor, getEmissiveIntensity } from "./cardStyles";
import { loadTexture } from "./textureUtils";

export function createCard(
  movie: SpatialMovie,
  instanceId: string,
  worldX: number,
  worldY: number,
  worldZ: number,
  cardScale: number,
  tunnelCenterX: number,
  tunnelCenterY: number,
  seed: number
): CardEntry {
  const group = new THREE.Group();
  group.position.set(worldX, worldY, worldZ);
  group.scale.setScalar(cardScale);

  const borderColor = new THREE.Color(getBorderColor(movie.favorite));

  const borderGeo = new THREE.PlaneGeometry(4.2, 6.2);
  const borderMat = new THREE.MeshStandardMaterial({
    color: borderColor,
    emissive: borderColor,
    emissiveIntensity: getEmissiveIntensity(movie.favorite),
  });
  const borderMesh = new THREE.Mesh(borderGeo, borderMat);
  borderMesh.position.set(0, 0, -0.05);
  group.add(borderMesh);

  const entry: CardEntry = {
    instanceId,
    movieId: movie.id,
    group,
    borderMesh,
    posterMesh: null,
    particleMesh: null,
    worldZ,
    textureLoaded: false,
    tunnelCenterX,
    tunnelCenterY,
    seed,
  };

  if (movie.favorite) {
    const particleGeo = new THREE.BufferGeometry();
    const pCount = 50;
    const posArray = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const radius = 2.5 + Math.random() * 1.5;
      const angle = Math.random() * Math.PI * 2;
      posArray[i * 3] = Math.cos(angle) * radius;
      posArray[i * 3 + 1] = Math.sin(angle) * radius;
      posArray[i * 3 + 2] = -0.2 - Math.random() * 1.0;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      color: borderColor,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleMesh = new THREE.Points(particleGeo, particleMat);
    group.add(particleMesh);
    entry.particleMesh = particleMesh;
  }

  loadTexture(movie.posterUrl, movie.title, (tex) => {
    if (entry.textureLoaded) return;
    entry.textureLoaded = true;
    const posterGeo = new THREE.PlaneGeometry(4, 6);
    const posterMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const posterMesh = new THREE.Mesh(posterGeo, posterMat);
    posterMesh.position.set(0, 0, 0);
    group.add(posterMesh);
    entry.posterMesh = posterMesh;
  });

  return entry;
}

export function disposeCard(entry: CardEntry) {
  entry.borderMesh.geometry.dispose();
  (entry.borderMesh.material as THREE.Material).dispose();
  if (entry.posterMesh) {
    entry.posterMesh.geometry.dispose();
    (entry.posterMesh.material as THREE.Material).dispose();
  }
  if (entry.particleMesh) {
    entry.particleMesh.geometry.dispose();
    (entry.particleMesh.material as THREE.Material).dispose();
  }
}

