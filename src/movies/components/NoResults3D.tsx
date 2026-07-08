import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMovieStore } from "../store";
import { getActiveFiltersText } from "../utils/filterUtils";

export function NoResults3D({ z }: { z: number }) {
  const { settings, updateSettings, cameraTarget } = useMovieStore();
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const panelTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "rgba(10, 10, 10, 0.9)";
    ctx.fillRect(0, 0, 1024, 512);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 1020, 508);

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 48px monospace";
    ctx.textAlign = "center";
    ctx.fillText("EMPTY VOID", 512, 100);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "32px monospace";
    ctx.fillText("No movies match the currently applied filters.", 512, 160);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "24px monospace";
    ctx.fillText("ACTIVE FILTERS:", 512, 240);

    const filters = getActiveFiltersText(settings);
    ctx.fillStyle = "#d7a050";
    ctx.font = "28px monospace";
    filters.forEach((f, i) => {
      ctx.fillText(`• ${f}`, 512, 290 + i * 40);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [settings]);

  const buttonTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = hovered ? "rgba(215, 160, 80, 0.25)" : "rgba(215, 160, 80, 0.15)";
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "rgba(215, 160, 80, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 124);

    ctx.fillStyle = "#d7a050";
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RESET FILTERS", 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [hovered]);

  const handleReset = () => {
    updateSettings({
      favoritesOnly: false,
      selectedGenres: [],
    });
  };

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x += (cameraTarget.x - groupRef.current.position.x) * 0.1;
      groupRef.current.position.y += (cameraTarget.y - groupRef.current.position.y) * 0.1;
      groupRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group ref={groupRef} position={[cameraTarget.x, cameraTarget.y, z]}>
      <mesh position={[0, 1.5, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshBasicMaterial map={panelTexture} transparent />
      </mesh>
      <mesh
        position={[0, -2.5, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "none";
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleReset();
        }}
      >
        <planeGeometry args={[6, 1.5]} />
        <meshBasicMaterial map={buttonTexture} transparent />
      </mesh>
    </group>
  );
}

