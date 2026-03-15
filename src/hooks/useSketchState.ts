import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import p5 from "p5";
import { useClipboard } from "@custom-react-hooks/use-clipboard";
import { createControls } from "@/utils/constants";
import type { Meta } from "@/types";
import type { ControlSchemaEntry } from "@/components/SketchControls";
import type React from "react";

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
    return () => {
      cancelled = true;
    };
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
  const zoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);
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
  const getSVGElement = useCallback(
    () =>
      contentRef.current?.querySelector("svg") ??
      containerRef.current?.querySelector("svg") ??
      null,
    [],
  );

  const withSVGMode = useCallback(
    (then: () => void, onFail: () => void, currentValues: Record<string, unknown>) => {
      const currentUseSVG = currentValues.useSVG;
      const currentDebug = currentValues.debug;
      const needRerender = currentUseSVG === false || currentDebug === true;

      if (!needRerender) {
        then();
        return;
      }

      setControlValues({ ...currentValues, useSVG: true, debug: false });
      const deadline = Date.now() + 3500;
      const poll = () => {
        if (getSVGElement()) {
          then();
          setTimeout(() => {
            setControlValues({
              ...currentValues,
              useSVG: currentUseSVG,
              debug: currentDebug,
            });
          }, 100);
          return;
        }
        if (Date.now() < deadline) {
          setTimeout(poll, 50);
        } else {
          console.error("SVG did not appear in time");
          setControlValues({ ...currentValues, useSVG: currentUseSVG, debug: currentDebug });
          onFail();
        }
      };
      setTimeout(poll, 500);
    },
    [getSVGElement],
  );

  const copySVG = useCallback(() => {
    const currentValues = controlValues;
    withSVGMode(
      () => {
        const svg = getSVGElement();
        if (!svg) return;
        setCopying(true);
        copyToClipboard(svg.outerHTML)
          .catch(console.error)
          .finally(() => {
            setCopying(false);
            setCopied(true);
          });
      },
      () => {},
      currentValues,
    );
  }, [controlValues, withSVGMode, getSVGElement, copyToClipboard]);

  const downloadSVG = useCallback(() => {
    // Capture current seed/rotation before async work
    const currentSeed = seeds[pos];
    const currentRotation = rotation;
    const currentValues = controlValues;

    const perform = () => {
      const liveSvg = getSVGElement();
      if (!liveSvg) return;

      const clone = liveSvg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("sketch-config", JSON.stringify(currentValues));
      clone.setAttribute("seed", String(currentSeed));

      if (currentRotation !== 0) {
        const w =
          Number(clone.getAttribute("width")) ||
          clone.viewBox?.baseVal?.width ||
          100;
        const h =
          Number(clone.getAttribute("height")) ||
          clone.viewBox?.baseVal?.height ||
          100;
        const cx = w / 2;
        const cy = h / 2;
        const existing = clone.innerHTML;
        if (currentRotation === 90 || currentRotation === 270) {
          clone.setAttribute("width", String(h));
          clone.setAttribute("height", String(w));
          if (clone.hasAttribute("viewBox"))
            clone.setAttribute("viewBox", `0 0 ${h} ${w}`);
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

    withSVGMode(perform, () => {}, currentValues);
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
          try {
            setControlValues(JSON.parse(configAttr));
          } catch (err) {
            console.error("Failed to parse sketch config:", err);
          }
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

    // ── DOM refs (assign to SketchCanvas props) ───────────────────────
    containerRef,
    contentRef,
    fileInputRef,
    p5InstanceRef,
  };
}
