import React, { useEffect, useRef, type RefObject } from "react";
import p5 from "p5";
import { cx } from "class-variance-authority";

interface SketchCanvasProps {
  sketchFn: ((p: p5) => void) | null;
  containerRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  isDragging: boolean;
  p5InstanceRef: RefObject<p5 | null>;
  setIsLoading: (v: boolean) => void;
  setZoom: (v: number | ((prev: number) => number)) => void;
  setPan: (
    v:
      | { x: number; y: number }
      | ((prev: { x: number; y: number }) => { x: number; y: number }),
  ) => void;
  setIsDragging: (v: boolean) => void;
  className?: string;
}

export function SketchCanvas({
  sketchFn,
  containerRef,
  contentRef,
  zoom,
  pan,
  rotation,
  isDragging,
  p5InstanceRef,
  setIsLoading,
  setZoom,
  setPan,
  setIsDragging,
  className,
}: SketchCanvasProps) {
  const isDraggingRef = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // ── p5 lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!contentRef.current || !sketchFn) return;
    contentRef.current.innerHTML = "";
    p5InstanceRef.current = new p5(sketchFn, contentRef.current);
    const t = setTimeout(() => setIsLoading(false), 100);
    return () => {
      clearTimeout(t);
      p5InstanceRef.current?.remove();
      p5InstanceRef.current = null;
    };
  }, [sketchFn]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ refs and setIsLoading are stable — intentionally omitted

  // ── Wheel / drag event handlers ───────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const zoomBy = (scale: number) =>
      setZoom((z) => Math.max(0.1, Math.min(z * scale, 10)));

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.1 : 0.9);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ setters from useState are stable — intentionally omitted

  // ── Clean up inline styles when transform is identity ─────────────
  useEffect(() => {
    const svg = contentRef.current?.querySelector("svg");
    if (!svg) return;
    if (zoom === 1 && pan.x === 0 && pan.y === 0) {
      svg.style.removeProperty("transform");
      svg.style.removeProperty("will-change");
      svg.style.removeProperty("backface-visibility");
    }
  }, [zoom, pan]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasTransform = zoom !== 1 || pan.x !== 0 || pan.y !== 0 || rotation !== 0;

  return (
    <div
      id="sketch-canvas"
      ref={containerRef}
      className={cx(
        "overflow-hidden relative flex items-center justify-center",
        className,
      )}
      style={{ cursor: isDragging ? "grabbing" : zoom !== 1 ? "grab" : "default" }}
    >
      <div
        ref={contentRef}
        className="flex items-center justify-center"
        style={
          hasTransform
            ? {
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.1s ease-out",
                willChange: "transform",
              }
            : {}
        }
      />
    </div>
  );
}
