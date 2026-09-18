import * as THREE from "three";
import { SpatialMovie } from "../types";
import { CardEntry } from "../types";
import { loadTexture } from "./textureUtils";

const sharedBorderGeometry = new THREE.PlaneGeometry(4.2, 6.2);
const sharedPosterGeometry = new THREE.PlaneGeometry(4, 6);

const regularBorderMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const favoriteBorderMaterial = new THREE.MeshBasicMaterial({
  color: 0xf59e0b,
});

const sharedParticleGeometry = (() => {
  const pCount = 35;
  const posArray = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const radius = 2.5 + Math.random() * 1.5;
    const angle = Math.random() * Math.PI * 2;
    posArray[i * 3] = Math.cos(angle) * radius;
    posArray[i * 3 + 1] = Math.sin(angle) * radius;
    posArray[i * 3 + 2] = -0.2 - Math.random() * 1.0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
  return geo;
})();

const sharedParticleMaterial = new THREE.PointsMaterial({
  color: 0xf59e0b,
  size: 0.15,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

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

  const borderMat = movie.favorite ? favoriteBorderMaterial : regularBorderMaterial;
  const borderMesh = new THREE.Mesh(sharedBorderGeometry, borderMat);
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
    const particleMesh = new THREE.Points(sharedParticleGeometry, sharedParticleMaterial);
    group.add(particleMesh);
    entry.particleMesh = particleMesh;
  }

  loadTexture(movie.posterUrl, movie.title, (tex) => {
    if (entry.textureLoaded) return;
    entry.textureLoaded = true;
    const posterMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const posterMesh = new THREE.Mesh(sharedPosterGeometry, posterMat);
    posterMesh.position.set(0, 0, 0);
    group.add(posterMesh);
    entry.posterMesh = posterMesh;
  });

  return entry;
}

export function disposeCard(entry: CardEntry) {
  if (entry.posterMesh) {
    (entry.posterMesh.material as THREE.Material).dispose();
  }
}
