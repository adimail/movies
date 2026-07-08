import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useEffect(() => {
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x - 16}px, ${pos.current.y - 16}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        pointerEvents: "none",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 110,
        width: "2rem",
        height: "2rem",
        borderRadius: "9999px",
        border: "1.5px solid rgba(255,255,255,0.7)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 0 12px rgba(255,255,255,0.25)",
        willChange: "transform",
      }}
    />
  );
}
