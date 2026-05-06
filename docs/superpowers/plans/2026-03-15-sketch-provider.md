# SketchState Hook + SketchCanvas Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize all sketch logic in a single `useSketchState` hook, and reduce `P5Wrapper` to a pure rendering engine (`SketchCanvas`) with no business logic.

**Architecture:** `useSketchState({ meta, prev, next })` owns all state and actions — sketch loading, seed history, viewport, controls, copy/download/upload, mode. It returns a flat object that `SketchPage` destructures to compose any UI it wants. `SketchCanvas` receives what it needs as props and handles only p5 instantiation + wheel/drag events. No context, no prop-drilling through a combined component.

**Tech Stack:** React hooks, TypeScript, p5.js, existing shadcn/ui components, `@custom-react-hooks/use-clipboard`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| **Create** | `src/hooks/useSketchState.ts` | All sketch logic: loading, seeds, viewport, controls, copy/download/upload, mode |
| **Create** | `src/components/SketchCanvas.tsx` | Pure p5 rendering: instantiate p5, wheel/drag events, apply CSS transform |
| **Modify** | `src/pages/SketchPage.tsx` | Call `useSketchState`, compose UI freely |
| **Delete** | `src/components/P5Wrapper.tsx` | Replaced by `SketchCanvas` + `useSketchState` |

`SketchControls.tsx`, `App.tsx`, `constants.ts` — **untouched**.

---

## Chunk 1: `useSketchState` hook

### Task 1: Create `src/hooks/useSketchState.ts`

This hook is the single source of truth for the sketch page. It owns all state, creates DOM refs, and implements every action.

**Files:**
- Create: `src/hooks/useSketchState.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/useSketchState.ts
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import p5 from "p5";
import { useClipboard } from "@custom-react-hooks/use-clipboard";
import { createControls } from "@/utils/constants";
import type { Meta } from "@/types";
import type { ControlSchemaEntry } from "@/components/SketchControls";

interface UseSketchStateOptions {
  meta: Meta;
  prev?: Meta;
  next?: Meta;
}

function getRandomSeed(): number {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return arr[0];
}

function extractDefaultValues(
  schema: Record<string, { value?: unknown }>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(schema).map(([k, v]) => [k, v?.value]),
  );
}

export function useSketchState({ meta, prev, next }: UseSketchStateOptions) {
  const slug = meta.slug ?? "";

  // ── Loading ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isRedrawing, setIsRedrawing] = useState(false);

  // ── Seed / history ─────────────────────────────────────────────────
  // seeds[0] is always the newest; pos=0 means "show newest"
  const [seeds, setSeeds] = useState<number[]>(() => [getRandomSeed()]);
  const [pos, setPos] = useState(0);

  const pushSeed = useCallback((seed: number) => {
    setSeeds((s) => [seed, ...s]);
    setPos(0);
  }, []);

  const canBack = pos < seeds.length - 1;
  const canNext = pos > 0;

  // ── Viewport ───────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // ── Controls ───────────────────────────────────────────────────────
  const [controlSchema, setControlSchemaRaw] = useState<Record<string, ControlSchemaEntry>>({});
  const [controlValues, setControlValues] = useState<Record<string, unknown>>({});

  const setControlSchema = useCallback((schema: Record<string, unknown>) => {
    setControlSchemaRaw(schema as Record<string, ControlSchemaEntry>);
    setControlValues((prev) => ({
      ...extractDefaultValues(schema as Record<string, { value?: unknown }>),
      ...prev,
    }));
  }, []);

  // ── Mode ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState<"dark" | "light">("dark");

  // ── Copy state ─────────────────────────────────────────────────────
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const { copyToClipboard } = useClipboard();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  // ── DOM refs (assigned by SketchCanvas via ref props) ──────────────
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  // ── Sketch loading ─────────────────────────────────────────────────
  const sketchModuleRef = useRef<
    ((seed: number | null, vars: Record<string, unknown>) => (p: unknown) => void) | null
  >(null);
  const [sketchFn, setSketchFn] = useState<((p: p5) => void) | null>(null);

  // Recompute zoomTier only when it crosses a meaningful threshold
  // (avoids re-rendering canvas on every small zoom step in canvas mode)
  const zoomTier = useMemo(() => {
    if ((controlValues as Record<string, unknown>).useSVG === false) {
      return Math.round(zoom);
    }
    return undefined;
  }, [zoom, controlValues]);

  // Reset all sketch state when slug changes
  useEffect(() => {
    setControlSchemaRaw({});
    setControlValues({});
    setSeeds([getRandomSeed()]);
    setPos(0);
    setSketchFn(null);
    sketchModuleRef.current = null;
  }, [slug]);

  // Load the sketch module
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const load = async () => {
      try {
        const {
          default: sketchModule,
          constants,
          constantsProps = {},
        } = await import(`../sketches/${slug}.ts`);
        if (cancelled) return;
        const schema = createControls(constants || {}, constantsProps);
        sketchModuleRef.current = sketchModule;
        setControlSchema(schema);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load sketch:", err);
          setIsLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug, setControlSchema]);

  // Rebuild the sketch function when seed, pos, or control values change
  useEffect(() => {
    const mod = sketchModuleRef.current;
    if (!mod) return;
    setSketchFn(() => mod(seeds[pos], { ...controlValues, zoomLevel: zoomTier }));
  }, [seeds, pos, controlValues, zoomTier]);

  // ── Actions ────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    setSeeds((s) => [getRandomSeed(), ...s]);
    setPos(0);
    setIsRedrawing(true);
    setTimeout(() => setIsRedrawing(false), 100);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.2, 10)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.2, 0.1)), []);
  const zoomReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const rotateCW = useCallback(() => setRotation((r) => (r + 90) % 360), []);
  const rotateCCW = useCallback(() => setRotation((r) => (r - 90 + 360) % 360), []);
  const rotateReset = useCallback(() => setRotation(0), []);

  const historyBack = useCallback(() => {
    setPos((p) => Math.min(p + 1, seeds.length - 1));
  }, [seeds.length]);

  const historyForward = useCallback(() => {
    setPos((p) => Math.max(p - 1, 0));
  }, []);

  // SVG helpers — shared by copySVG and downloadSVG
  const getSVGElement = useCallback(() =>
    contentRef.current?.querySelector("svg") ??
    containerRef.current?.querySelector("svg") ??
    null,
  []);

  const withSVGMode = useCallback(
    (then: () => void, restore: () => void) => {
      const currentUseSVG = (controlValues as Record<string, unknown>).useSVG;
      const currentDebug = (controlValues as Record<string, unknown>).debug;
      const needRerender = currentUseSVG === false || currentDebug === true;

      if (!needRerender) {
        then();
        return;
      }

      setControlValues({ ...controlValues, useSVG: true, debug: false });
      const deadline = Date.now() + 3500;
      const poll = () => {
        if (getSVGElement()) {
          then();
          setTimeout(() => {
            setControlValues({ ...controlValues, useSVG: currentUseSVG, debug: currentDebug });
            restore();
          }, 100);
          return;
        }
        if (Date.now() < deadline) setTimeout(poll, 50);
        else {
          console.error("SVG did not appear in time");
          setControlValues({ ...controlValues, useSVG: currentUseSVG, debug: currentDebug });
          restore();
        }
      };
      setTimeout(poll, 500);
    },
    [controlValues, getSVGElement],
  );

  const copySVG = useCallback(() => {
    withSVGMode(
      () => {
        const svg = getSVGElement();
        if (!svg) return;
        setCopying(true);
        copyToClipboard(svg.outerHTML)
          .catch(console.error)
          .finally(() => { setCopying(false); setCopied(true); });
      },
      () => {},
    );
  }, [withSVGMode, getSVGElement, copyToClipboard]);

  const downloadSVG = useCallback(() => {
    // Capture current seed/rotation before async work
    const currentSeed = seeds[pos];
    const currentRotation = rotation;

    const perform = () => {
      const liveSvg = getSVGElement();
      if (!liveSvg) return;

      const clone = liveSvg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("sketch-config", JSON.stringify(controlValues));
      clone.setAttribute("seed", String(currentSeed));

      if (currentRotation !== 0) {
        const w = Number(clone.getAttribute("width")) || clone.viewBox?.baseVal?.width || 100;
        const h = Number(clone.getAttribute("height")) || clone.viewBox?.baseVal?.height || 100;
        const cx = w / 2;
        const cy = h / 2;
        const existing = clone.innerHTML;
        if (currentRotation === 90 || currentRotation === 270) {
          clone.setAttribute("width", String(h));
          clone.setAttribute("height", String(w));
          if (clone.hasAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${h} ${w}`);
          clone.innerHTML = `<g transform="translate(${h / 2},${w / 2}) rotate(${currentRotation}) translate(${-cx},${-cy})">${existing}</g>`;
        } else {
          clone.innerHTML = `<g transform="rotate(${currentRotation},${cx},${cy})">${existing}</g>`;
        }
      }

      const svgStr = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-${currentSeed ?? "sketch"}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    withSVGMode(perform, () => {});
  }, [slug, seeds, pos, rotation, controlValues, getSVGElement, withSVGMode]);

  const importConfig = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.includes("svg") && !file.name.endsWith(".svg")) {
        alert("Please upload an SVG file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const svgContent = ev.target?.result as string;
        if (!contentRef.current) return;
        contentRef.current.innerHTML = svgContent;
        setZoom(1);
        setPan({ x: 0, y: 0 });
        const svgEl = contentRef.current.querySelector("svg");
        if (!svgEl) return;
        const seedAttr = svgEl.getAttribute("seed");
        if (seedAttr) pushSeed(Number(seedAttr));
        const configAttr = svgEl.getAttribute("sketch-config");
        if (configAttr) {
          try { setControlValues(JSON.parse(configAttr)); }
          catch (err) { console.error("Failed to parse sketch config:", err); }
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [pushSeed],
  );

  return {
    // ── Meta ──────────────────────────────────────────────────────────
    meta,
    prev,
    next,

    // ── Loading ───────────────────────────────────────────────────────
    isLoading,
    setIsLoading,
    isRedrawing,

    // ── Sketch function (pass to SketchCanvas) ────────────────────────
    sketchFn,

    // ── Seed / history ────────────────────────────────────────────────
    seeds,
    pos,
    setPos,
    pushSeed,
    currentSeed: seeds[pos] ?? 0,
    canBack,
    canNext,
    historyBack,
    historyForward,

    // ── Viewport ──────────────────────────────────────────────────────
    zoom,
    setZoom,
    pan,
    setPan,
    rotation,
    setRotation,
    isDragging,
    setIsDragging,
    zoomIn,
    zoomOut,
    zoomReset,
    rotateCW,
    rotateCCW,
    rotateReset,

    // ── Controls ──────────────────────────────────────────────────────
    controlSchema,
    controlValues,
    setControlValues,

    // ── Mode ──────────────────────────────────────────────────────────
    mode,
    toggleMode,

    // ── Actions ───────────────────────────────────────────────────────
    refresh,
    copySVG,
    downloadSVG,
    importConfig,
    handleFileChange,
    copying,
    copied,

    // ── DOM refs (assign these to SketchCanvas props) ─────────────────
    containerRef,
    contentRef,
    fileInputRef,
    p5InstanceRef,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

---

## Chunk 2: `SketchCanvas` pure rendering component

### Task 2: Create `src/components/SketchCanvas.tsx`

No state. No actions. No toolbar. Just: mount p5, update transform, handle wheel/drag.

**Files:**
- Create: `src/components/SketchCanvas.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/SketchCanvas.tsx
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
  setPan: (v: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
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
  // ^ refs are stable — intentionally omitted from deps

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
  // ^ setters from useState are stable — intentionally omitted from deps

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
      className={cx("overflow-hidden relative flex items-center justify-center", className)}
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

---

## Chunk 3: Wire up `SketchPage` + delete `P5Wrapper`

### Task 3: Rewrite `src/pages/SketchPage.tsx`

`SketchPage` calls `useSketchState`, owns the layout, and composes every UI piece.
The toolbar JSX that was in `P5Wrapper` moves here — this is the "freedom to build UI" payoff.

**Files:**
- Modify: `src/pages/SketchPage.tsx`

- [ ] **Step 1: Rewrite SketchPage**

```tsx
// src/pages/SketchPage.tsx
import React, { useEffect } from "react";
import { SketchCanvas } from "@/components/SketchCanvas";
import { SketchControls } from "@/components/SketchControls";
import { useSketchState } from "@/hooks/useSketchState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cx } from "class-variance-authority";
import { Helmet } from "react-helmet-async";
import {
  Sun, Moon, RefreshCw, Copy, Check,
  ArrowLeft, ArrowRight, DownloadIcon,
  ZoomIn, ZoomOut, FileUpIcon, Loader2,
  CheckCircle2, RotateCcw,
} from "lucide-react";
import type { Meta } from "@/types";

interface SketchPageProps {
  sketch: Meta;
  prev?: Meta;
  next?: Meta;
}

const SketchPage: React.FC<SketchPageProps> = ({ sketch, prev, next }) => {
  const s = useSketchState({ meta: sketch, prev, next });

  // ── Keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft": if (s.canBack) s.historyBack(); break;
        case "ArrowRight": if (s.canNext) s.historyForward(); break;
        case "m": s.toggleMode(); break;
        case "r": s.refresh(); break;
        case "c": s.copySVG(); break;
        case "d": s.downloadSVG(); break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [s.canBack, s.canNext, s.historyBack, s.historyForward, s.toggleMode, s.refresh, s.copySVG, s.downloadSVG]);

  const ogImage = window.location.origin + (sketch.thumbnail ?? "");

  return (
    <>
      <Helmet>
        <title>{sketch.title} — Émile's Sketches</title>
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Hidden file input for SVG import */}
      <input
        ref={s.fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={s.handleFileChange}
        style={{ display: "none" }}
      />

      <div className="w-full h-full grid grid-cols-1 grid-rows-[auto_1fr_auto]">

        {/* ── Top toolbar ───────────────────────────────────────── */}
        <div className="flex flex-col w-full">
          <div className="px-4 py-2 border-b flex flex-row items-baseline gap-4 flex-nowrap">
            <h1 className="text-sm font-medium shrink-0">{sketch.title}</h1>
            <p className="text-sm text-muted-foreground grow truncate">{sketch.description}</p>
          </div>
          <div className="flex items-center justify-end px-2 w-full border-b border-white/10">
            {process.env.NODE_ENV === "development" && (
              <div className="flex-grow flex items-center justify-start">
                <Button
                  disabled={s.isRedrawing || !s.canBack}
                  size="icon" variant="ghost" className="cursor-pointer text-white"
                  onClick={s.historyBack} aria-label="Back"
                >
                  <ArrowLeft />
                </Button>
                <span className="text-sm text-muted-foreground mt-px tabular-nums">
                  <span className="text-white">{String(s.pos + 1).padStart(2, "0")}</span>
                  {" "}/ {String(s.seeds.length).padStart(2, "0")}
                </span>
                <Button
                  disabled={s.isRedrawing || !s.canNext}
                  size="icon" variant="ghost" className="cursor-pointer text-white"
                  onClick={s.historyForward} aria-label="Next"
                >
                  <ArrowRight />
                </Button>
              </div>
            )}
            <Button
              disabled={s.isRedrawing} size="icon" variant="ghost" className="cursor-pointer text-white"
              onClick={s.toggleMode}
              aria-label={`Switch to ${s.mode === "dark" ? "light" : "dark"} mode`}
            >
              {s.mode === "dark" ? <Sun /> : <Moon />}
            </Button>
            <Button
              disabled={s.isRedrawing} size="icon" variant="ghost" className="cursor-pointer text-white"
              onClick={s.refresh} aria-label="Refresh sketch"
            >
              <RefreshCw className={cx(s.isRedrawing && "animate-spin")} />
            </Button>
            <Button
              disabled={s.isRedrawing || s.copying || s.copied}
              size="icon" variant="ghost" className="cursor-pointer text-white"
              onClick={s.copySVG} aria-label="Copy SVG to clipboard"
            >
              {s.copied ? <Check /> : <Copy />}
            </Button>
            {process.env.NODE_ENV === "development" && (
              <>
                <Button
                  disabled={s.isRedrawing} size="icon" variant="ghost" className="cursor-pointer text-white"
                  onClick={s.downloadSVG} aria-label="Download SVG"
                >
                  <DownloadIcon />
                </Button>
                <Button
                  disabled={s.isRedrawing} size="icon" variant="ghost" className="cursor-pointer text-white"
                  onClick={s.importConfig} aria-label="Upload SVG"
                >
                  <FileUpIcon />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── Canvas ────────────────────────────────────────────── */}
        <div className="relative">
          <SketchCanvas
            sketchFn={s.sketchFn}
            containerRef={s.containerRef}
            contentRef={s.contentRef}
            p5InstanceRef={s.p5InstanceRef}
            zoom={s.zoom}
            pan={s.pan}
            rotation={s.rotation}
            isDragging={s.isDragging}
            setIsLoading={s.setIsLoading}
            setZoom={s.setZoom}
            setPan={s.setPan}
            setIsDragging={s.setIsDragging}
            className={cx(
              "w-full h-full transition-colors",
              s.mode === "dark" ? "bg-background" : "bg-foreground",
            )}
          />

          {s.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Skeleton className="w-full h-full" />
            </div>
          )}

          {Object.keys(s.controlSchema).length > 0 && (
            <div className="absolute top-4 right-4 z-20">
              <SketchControls
                schema={s.controlSchema}
                values={s.controlValues}
                onChange={(key, value) =>
                  s.setControlValues((prev) => ({ ...prev, [key]: value }))
                }
              />
            </div>
          )}
        </div>

        {/* ── Bottom toolbar ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-2 w-full border-t border-white/10">
          <div className="flex items-center gap-2 ml-2">
            {s.isLoading
              ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              : <CheckCircle2 className="w-4 h-4 text-muted-foreground" />}
            {process.env.NODE_ENV === "development" ? (
              <input
                onChange={(e) => s.pushSeed(Number(e.target.value))}
                value={s.currentSeed}
                className="text-sm text-muted-foreground pt-0.5"
              />
            ) : (
              <span className="text-sm text-muted-foreground">{s.currentSeed}</span>
            )}
          </div>

          <div className="flex flex-row justify-center items-center">
            <Button size="icon" variant="ghost" className="text-white"
              onClick={s.rotateCCW} aria-label="Rotate counterclockwise">
              <RotateCcw />
            </Button>
            {s.rotation !== 0 && (
              <Button variant="ghost" className="text-white min-w-12"
                onClick={s.rotateReset} aria-label="Reset rotation">
                {s.rotation}°
              </Button>
            )}
            <Button size="icon" variant="ghost" className="text-white"
              onClick={s.zoomIn} aria-label="Zoom in">
              <ZoomIn />
            </Button>
            <Button variant="ghost" className="text-white min-w-16"
              onClick={s.zoomReset} aria-label="Reset zoom">
              {Math.round(s.zoom * 10) / 10}&thinsp;x
            </Button>
            <Button size="icon" variant="ghost" className="text-white"
              onClick={s.zoomOut} aria-label="Zoom out">
              <ZoomOut />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SketchPage;
```

- [ ] **Step 2: Delete P5Wrapper**

```bash
rm src/components/P5Wrapper.tsx
```

- [ ] **Step 3: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Smoke-test in browser**

```bash
npm run dev
```

Check:
- [ ] Sketch loads and renders
- [ ] Refresh button + `r` key generates new drawing
- [ ] Mode toggle button + `m` key switches dark/light
- [ ] Sliders/controls update drawing
- [ ] Scroll to zoom, drag to pan
- [ ] Rotate button, reset rotation
- [ ] `c` key copies SVG to clipboard
- [ ] Seed history arrows work (dev mode)
- [ ] Download SVG works (dev mode)
- [ ] Upload SVG restores config (dev mode)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSketchState.ts src/components/SketchCanvas.tsx src/pages/SketchPage.tsx
git rm src/components/P5Wrapper.tsx
git commit -m "refactor: centralize sketch logic in useSketchState, extract SketchCanvas as pure renderer"
```
