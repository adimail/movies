import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SpatialMovie } from "../types";
import { useMovieStore } from "../store";
import { loadTexture } from "../utils/textureUtils";

interface MovieCard3DProps {
  movie: SpatialMovie;
  worldX?: number;
  worldY?: number;
  worldZ?: number;
}

export function MovieCard3D({ movie, worldX, worldY, worldZ }: MovieCard3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const setSelectedMovieId = useMovieStore((state) => state.setSelectedMovieId);

  const posX = worldX ?? movie.x;
  const posY = worldY ?? movie.y;
  const posZ = worldZ ?? movie.z;

  const borderColor = movie.favorite ? "#f59e0b" : "#ffffff";
  const emissiveIntensity = movie.favorite ? 0.8 : 0;

  useEffect(() => {
    let isMounted = true;
    loadTexture(movie.posterUrl, movie.title, (tex) => {
      if (isMounted) {
        setTexture(tex);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [movie.posterUrl, movie.title]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const targetScale = hovered ? 1.05 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    meshRef.current.lookAt(state.camera.position);
  });

  return (
    <group
      ref={meshRef}
      position={[posX, posY, posZ]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedMovieId(movie.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "none";
      }}
    >
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[4.2, 6.2]} />
        <meshStandardMaterial
          color={borderColor}
          emissive={borderColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {texture && (
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[4, 6]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      )}
    </group>
  );
}
