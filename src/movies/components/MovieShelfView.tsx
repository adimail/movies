import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SpatialMovie, SCORE_KEYS } from "../types";
import { useMovieStore } from "../store";
import { Star, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import { loadTexture } from "../utils/textureUtils";

interface MovieShelfViewProps {
  movies: SpatialMovie[];
}

const CASE_HEIGHT = 4.4;
const CASE_DEPTH = 3.2;
const GAP = 0.34;

const spineTextureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateSpineTexture(movie: SpatialMovie): THREE.CanvasTexture {
  if (spineTextureCache.has(movie.id)) {
    return spineTextureCache.get(movie.id)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const bgColor = movie.favorite ? "#1f180d" : "#121214";
  const textColor = movie.favorite ? "#f59e0b" : "#ebe8e1";

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, "rgba(255,255,255,0.08)");
  grad.addColorStop(0.1, "rgba(255,255,255,0.02)");
  grad.addColorStop(0.9, "rgba(0,0,0,0.2)");
  grad.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = movie.favorite ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.15)";
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 24, canvas.width - 32, canvas.height - 48);

  if (movie.favorite) {
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.fillText("★", canvas.width / 2, 80);
    ctx.fillText("★", canvas.width / 2, canvas.height - 70);
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const rawTitle = movie.title.toUpperCase();
  const fontSize = rawTitle.length > 28 ? 26 : rawTitle.length > 18 ? 32 : 38;
  ctx.font = `600 ${fontSize}px Georgia, serif`;
  ctx.letterSpacing = "2px";
  ctx.fillText(rawTitle, 0, 0);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  spineTextureCache.set(movie.id, texture);
  return texture;
}

export function MovieShelfView({ movies }: MovieShelfViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const { bookmarkedMovieIds, toggleBookmark, isMobile } = useMovieStore();
  const [expandedMovieId, setExpandedMovieId] = useState<string | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const hoveredIndexRef = useRef<number | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const scrollXRef = useRef<number>(0);
  const targetScrollXRef = useRef<number>(0);
  const scrollToMovieRef = useRef<((index: number) => void) | null>(null);

  useEffect(() => {
    const updateMargin = () => {
      if (listContainerRef.current) {
        setScrollMargin(listContainerRef.current.offsetTop);
      }
    };
    updateMargin();
    window.addEventListener("resize", updateMargin);
    return () => window.removeEventListener("resize", updateMargin);
  }, [isMobile]);

  const rowVirtualizer = useVirtualizer({
    count: movies.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 58,
    scrollMargin,
    overscan: 5,
    getItemKey: (index) => movies[index].id,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [expandedMovieId, rowVirtualizer]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || movies.length === 0) return;

    let isMounted = true;
    let animationFrameId: number;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(
      28,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 8, 12);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-6, -2, 8);
    scene.add(fillLight);

    const shelfGroup = new THREE.Group();
    scene.add(shelfGroup);

    const regularGeo = new THREE.BoxGeometry(0.62, CASE_HEIGHT, CASE_DEPTH);
    const favoriteGeo = new THREE.BoxGeometry(0.72, CASE_HEIGHT, CASE_DEPTH);

    const caseEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x111113,
      roughness: 0.8,
      metalness: 0.2,
    });

    const defaultBackMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.6,
    });

    const favoriteBackMat = new THREE.MeshStandardMaterial({
      color: 0x221708,
      roughness: 0.6,
    });

    const thicknesses = movies.map((m) => (m.favorite ? 0.72 : 0.62));
    let currentX = 0;
    const rawPositions: number[] = [];
    thicknesses.forEach((t) => {
      rawPositions.push(currentX + t / 2);
      currentX += t + GAP;
    });

    const totalWidth = currentX - GAP;
    const basePositions: number[] = rawPositions.map((pos) => pos - totalWidth / 2);

    const minScroll = -basePositions[basePositions.length - 1];
    const maxScroll = -basePositions[0];

    const clampScroll = (val: number) => {
      return Math.max(Math.min(minScroll, maxScroll), Math.min(Math.max(minScroll, maxScroll), val));
    };

    scrollToMovieRef.current = (index: number) => {
      if (index >= 0 && index < movies.length) {
        selectedIndexRef.current = index;
        targetScrollXRef.current = clampScroll(-basePositions[index]);
        rowVirtualizer.scrollToIndex(index, { align: "center", behavior: "smooth" });
      }
    };

    const groups: THREE.Group[] = [];
    const meshes: THREE.Mesh[] = [];
    const coverMaterials: THREE.MeshStandardMaterial[] = [];
    const spineMaterials: THREE.MeshStandardMaterial[] = [];
    const texturesLoaded: boolean[] = new Array(movies.length).fill(false);
    const openProgress = new Float32Array(movies.length);
    const hoverProgress = new Float32Array(movies.length);

    movies.forEach((movie, index) => {
      const caseGroup = new THREE.Group();
      caseGroup.position.set(basePositions[index], 0, 0);

      const coverMat = new THREE.MeshStandardMaterial({
        color: movie.favorite ? 0x2a1d0d : 0x18181c,
        roughness: 0.35,
        metalness: 0.05,
      });

      const spineMat = new THREE.MeshStandardMaterial({
        color: movie.favorite ? 0x1f180d : 0x121214,
        roughness: 0.45,
        metalness: 0.05,
      });

      const backMat = movie.favorite ? favoriteBackMat : defaultBackMat;

      const materials = [
        coverMat,
        backMat,
        caseEdgeMaterial,
        caseEdgeMaterial,
        spineMat,
        caseEdgeMaterial,
      ];

      const geometry = movie.favorite ? favoriteGeo : regularGeo;
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.userData = { index };

      caseGroup.add(mesh);
      shelfGroup.add(caseGroup);
      groups.push(caseGroup);
      meshes.push(mesh);
      coverMaterials.push(coverMat);
      spineMaterials.push(spineMat);
    });

    const loadCaseTextures = (index: number) => {
      if (texturesLoaded[index]) return;
      texturesLoaded[index] = true;

      const movie = movies[index];
      const spineTex = getOrCreateSpineTexture(movie);
      spineMaterials[index].map = spineTex;
      spineMaterials[index].color.setHex(0xffffff);
      spineMaterials[index].needsUpdate = true;

      loadTexture(movie.posterUrl, movie.title, (tex) => {
        if (!isMounted) return;
        coverMaterials[index].map = tex;
        coverMaterials[index].color.setHex(0xffffff);
        coverMaterials[index].needsUpdate = true;
      });
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);

    const getHitIndex = (clientX: number, clientY: number): number | null => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const visibleMeshes = meshes.filter((m) => m.parent?.visible);
      const intersects = raycaster.intersectObjects(visibleMeshes);
      if (intersects.length > 0) {
        return intersects[0].object.userData.index;
      }
      return null;
    };

    let isPointerDown = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartScroll = 0;
    let didDrag = false;
    let isShelfDragActive = false;
    let isGestureDetermined = false;
    let lastMoveTime = 0;
    let lastMoveX = 0;
    let velocityX = 0;

    const getVisibleWorldWidth = () => {
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
      return visibleHeight * camera.aspect;
    };

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartScroll = targetScrollXRef.current;
      lastMoveX = e.clientX;
      lastMoveTime = performance.now();
      velocityX = 0;
      didDrag = false;
      isShelfDragActive = e.pointerType !== "touch";
      isGestureDetermined = e.pointerType !== "touch";

      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isPointerDown) {
        const now = performance.now();
        const dt = Math.max(1, now - lastMoveTime);
        const dx = e.clientX - lastMoveX;
        velocityX = (dx / dt) * 1000;
        lastMoveX = e.clientX;
        lastMoveTime = now;

        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        if (!isGestureDetermined) {
          if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
            isPointerDown = false;
            isShelfDragActive = false;
            isGestureDetermined = true;
            try {
              canvas.releasePointerCapture(e.pointerId);
            } catch (err) {}
            return;
          }
          if (Math.abs(deltaX) > 8 && Math.abs(deltaX) >= Math.abs(deltaY)) {
            isShelfDragActive = true;
            isGestureDetermined = true;
          }
        }

        if (isShelfDragActive) {
          if (Math.abs(deltaX) > 6) {
            didDrag = true;
          }
          const sensitivity = e.pointerType === "touch" ? 2.4 : 1.3;
          const worldWidth = getVisibleWorldWidth();
          const deltaWorld = (deltaX / canvas.clientWidth) * worldWidth * sensitivity;
          targetScrollXRef.current = clampScroll(dragStartScroll + deltaWorld);
        }
      } else {
        hoveredIndexRef.current = getHitIndex(e.clientX, e.clientY);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (isPointerDown && isShelfDragActive && Math.abs(velocityX) > 120) {
        const momentumFactor = e.pointerType === "touch" ? 0.009 : 0.004;
        const worldWidth = getVisibleWorldWidth();
        const momentumWorld = velocityX * worldWidth * momentumFactor;
        targetScrollXRef.current = clampScroll(targetScrollXRef.current + momentumWorld);
      }

      if (isPointerDown && !didDrag) {
        const hit = getHitIndex(e.clientX, e.clientY);
        if (hit === null) {
          selectedIndexRef.current = null;
        } else if (selectedIndexRef.current === hit) {
          const selectedMovie = movies[hit];
          setExpandedMovieId(selectedMovie.id);
          rowVirtualizer.scrollToIndex(hit, { align: "center", behavior: "smooth" });
        } else {
          selectedIndexRef.current = hit;
          targetScrollXRef.current = clampScroll(-basePositions[hit]);
          loadCaseTextures(hit);
        }
      }
      isPointerDown = false;
      isShelfDragActive = false;
      isGestureDetermined = false;
    };

    const onPointerCancel = (e: PointerEvent) => {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
      isPointerDown = false;
      isShelfDragActive = false;
      isGestureDetermined = false;
    };

    const onPointerLeave = (e: PointerEvent) => {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
      isPointerDown = false;
      isShelfDragActive = false;
      isGestureDetermined = false;
      mouse.set(-1000, -1000);
      hoveredIndexRef.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      e.preventDefault();
      const worldWidth = getVisibleWorldWidth();
      const deltaWorld = (delta / canvas.clientWidth) * worldWidth * 1.6;
      targetScrollXRef.current = clampScroll(targetScrollXRef.current - deltaWorld);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", onResize);

    let lastTime = performance.now();

    const animate = (time: number) => {
      if (!isMounted) return;
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const dampSpeed = isPointerDown ? 22 : 8;
      scrollXRef.current = THREE.MathUtils.damp(
        scrollXRef.current,
        targetScrollXRef.current,
        dampSpeed,
        delta
      );
      shelfGroup.position.x = scrollXRef.current;

      const worldW = getVisibleWorldWidth();
      const halfVisible = worldW / 2 + 5;
      const camCenterScreen = -scrollXRef.current;

      for (let i = 0; i < movies.length; i++) {
        const group = groups[i];
        const distFromCenter = Math.abs(basePositions[i] - camCenterScreen);
        const isVisibleInView = distFromCenter <= halfVisible;

        group.visible = isVisibleInView;

        if (isVisibleInView) {
          loadCaseTextures(i);
        }

        const targetOpen = selectedIndexRef.current === i ? 1.0 : 0.0;
        openProgress[i] = THREE.MathUtils.damp(openProgress[i], targetOpen, 6, delta);

        const targetHover =
          hoveredIndexRef.current === i && selectedIndexRef.current !== i && openProgress[i] < 0.1
            ? 1.0
            : 0.0;
        hoverProgress[i] = THREE.MathUtils.damp(hoverProgress[i], targetHover, 8, delta);
      }

      const extraSpacing = new Float32Array(movies.length);
      for (let i = 0; i < movies.length; i++) {
        const fullExpansion = CASE_DEPTH - thicknesses[i] + 0.35;
        extraSpacing[i] = fullExpansion * openProgress[i];
      }

      groups.forEach((group, i) => {
        if (!group.visible && openProgress[i] < 0.01 && hoverProgress[i] < 0.01) return;

        let shiftX = 0;
        for (let k = 0; k < movies.length; k++) {
          if (extraSpacing[k] > 0.001) {
            if (i < k) {
              shiftX -= extraSpacing[k] / 2;
            } else if (i > k) {
              shiftX += extraSpacing[k] / 2;
            }
          }
        }

        const pOpen = openProgress[i];
        const pHover = hoverProgress[i];

        const targetX = basePositions[i] + shiftX;
        const fullyExtendedZ = (CASE_DEPTH - thicknesses[i]) / 2 + 0.25;
        const forwardArc = Math.sin(pOpen * Math.PI) * 0.75;
        const targetZ = pOpen * fullyExtendedZ + forwardArc + pHover * 0.35;

        const targetRotY = -pOpen * (Math.PI / 2);
        const targetRotX = pHover * -0.12;
        const targetRotZ = pHover * 0.02;

        group.position.x = THREE.MathUtils.damp(group.position.x, targetX, 7, delta);
        group.position.y = THREE.MathUtils.damp(group.position.y, 0, 7, delta);
        group.position.z = THREE.MathUtils.damp(group.position.z, targetZ, 7, delta);

        group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetRotX, 7, delta);
        group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetRotY, 7, delta);
        group.rotation.z = THREE.MathUtils.damp(group.rotation.z, targetRotZ, 7, delta);
      });

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);

      regularGeo.dispose();
      favoriteGeo.dispose();
      caseEdgeMaterial.dispose();
      defaultBackMat.dispose();
      favoriteBackMat.dispose();
      coverMaterials.forEach((m) => m.dispose());
      spineMaterials.forEach((m) => m.dispose());

      renderer.dispose();
    };
  }, [movies, rowVirtualizer]);

  const handleMovieItemClick = useCallback(
    (movie: SpatialMovie, index: number) => {
      if (expandedMovieId === movie.id) {
        setExpandedMovieId(null);
      } else {
        setExpandedMovieId(movie.id);
        if (scrollToMovieRef.current) {
          scrollToMovieRef.current(index);
        }
      }
    },
    [expandedMovieId]
  );

  return (
    <div
      ref={scrollContainerRef}
      style={{ height: "100%", overflowY: "auto", background: "#050505" }}
    >
      <div style={{ paddingTop: isMobile ? "4.5rem" : "5rem", width: "100%" }}>
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: isMobile ? "340px" : "440px",
            background: "#050505",
            overflow: "hidden",
            cursor: "grab",
            position: "relative",
            touchAction: "pan-y",
          }}
        >
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", touchAction: "pan-y" }} />
        </div>

        <div
          style={{
            maxWidth: "52rem",
            margin: "0 auto",
            padding: isMobile ? "1.5rem 1rem 5rem 1rem" : "2rem 2rem 5rem 2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                fontSize: isMobile ? "1.4rem" : "1.8rem",
                color: "#ebe8e1",
                margin: 0,
                fontWeight: "normal",
              }}
            >
              Movie Shelf{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  fontStyle: "normal",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.35)",
                  marginLeft: "0.5rem",
                }}
              >
                ({movies.length})
              </span>
            </h2>
          </div>

          <div
            ref={listContainerRef}
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const movie = movies[virtualRow.index];
              const isExpanded = expandedMovieId === movie.id;
              const isBookmarked = bookmarkedMovieIds.includes(movie.id);

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                    paddingBottom: "0.5rem",
                  }}
                >
                  <div
                    id={`movie-shelf-item-${movie.id}`}
                    style={{
                      background: isExpanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                      border: isExpanded
                        ? "1px solid rgba(215,160,80,0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "6px",
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      data-header-toggle="true"
                      onClick={() => handleMovieItemClick(movie, virtualRow.index)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.85rem 1rem",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.65rem",
                            color: "rgba(255,255,255,0.3)",
                            width: "1.75rem",
                            flexShrink: 0,
                          }}
                        >
                          {String(virtualRow.index + 1).padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: isMobile ? "0.8rem" : "0.9rem",
                            color: movie.favorite ? "#f59e0b" : "#fff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {movie.title}
                        </span>
                        {movie.favorite && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", flexShrink: 0 }}>
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(movie.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: isBookmarked ? "#d7a050" : "rgba(255,255,255,0.3)",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Bookmark size={14} fill={isBookmarked ? "#d7a050" : "none"} />
                        </button>
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          padding: "1rem 1.25rem 1.25rem 1.25rem",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(0,0,0,0.3)",
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row",
                          gap: "1.25rem",
                        }}
                      >
                        <div
                          style={{
                            width: isMobile ? "5rem" : "6.5rem",
                            aspectRatio: "2/3",
                            borderRadius: "4px",
                            overflow: "hidden",
                            flexShrink: 0,
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>

                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <p
                            style={{
                              fontFamily: "Georgia, serif",
                              fontStyle: "italic",
                              fontSize: "0.85rem",
                              lineHeight: 1.6,
                              color: "rgba(255,255,255,0.7)",
                              margin: "0 0 1rem 0",
                            }}
                          >
                            &ldquo;{movie.description}&rdquo;
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                              gap: "0.4rem 1.5rem",
                            }}
                          >
                            {SCORE_KEYS.map((key, kIdx) => (
                              <div
                                key={key}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "0.65rem",
                                  fontFamily: "monospace",
                                  color: "rgba(255,255,255,0.5)",
                                }}
                              >
                                <span style={{ textTransform: "capitalize" }}>
                                  {key.replace(/([A-Z])/g, " $1")}
                                </span>
                                <span style={{ color: movie.scores[kIdx] >= 7 ? "#d7a050" : "inherit" }}>
                                  {movie.scores[kIdx]}/10
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {movies.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 0",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              No movies match the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
