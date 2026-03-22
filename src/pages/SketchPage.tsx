import React, { useEffect, useState } from "react";
import { SketchCanvas } from "@/components/SketchCanvas";
import { SketchControls } from "@/components/SketchControls";
import { useSketchState } from "@/hooks/useSketchState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cx } from "class-variance-authority";
import { Helmet } from "react-helmet-async";
import {
  Sun,
  Moon,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  DownloadIcon,
  ZoomIn,
  ZoomOut,
  FileUpIcon,
  Loader2,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import type { Meta } from "@/types";

interface SketchPageProps {
  sketch: Meta;
  prev?: Meta;
  next?: Meta;
}

const SketchPage: React.FC<SketchPageProps> = ({ sketch, prev, next }) => {
  const s = useSketchState({ meta: sketch, prev, next });
  const [controlsOpen, setControlsOpen] = useState(false);

  // ── Keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (s.canBack) s.historyBack();
          break;
        case "ArrowRight":
          if (s.canNext) s.historyForward();
          break;
        case "m":
          s.toggleMode();
          break;
        case "r":
          s.refresh();
          break;
        case "c":
          s.copySVG();
          break;
        case "d":
          s.downloadSVG();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    s.canBack,
    s.canNext,
    s.historyBack,
    s.historyForward,
    s.toggleMode,
    s.refresh,
    s.copySVG,
    s.downloadSVG,
  ]);

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
        {/* ── Top toolbar ─────────────────────────────────────────── */}
        <div className="flex flex-col w-full">
          <div className="px-4 py-2 border-b flex flex-row items-baseline gap-4 flex-nowrap">
            <h1 className="text-sm font-medium shrink-0">{sketch.title}</h1>
            <p className="text-sm text-muted-foreground grow truncate">
              {sketch.description}
            </p>
          </div>
          <div className="flex items-center justify-end px-2 w-full border-b border-white/10 overflow-x-auto">
            {process.env.NODE_ENV === "development" && (
              <div className="flex-grow flex items-center justify-start">
                <Button
                  disabled={s.isRedrawing || !s.canBack}
                  size="icon"
                  variant="ghost"
                  className="cursor-pointer text-white"
                  onClick={s.historyBack}
                  aria-label="Back"
                >
                  <ArrowLeft />
                </Button>
                <span className="text-sm text-muted-foreground mt-px tabular-nums">
                  <span className="text-white">
                    {String(s.pos + 1).padStart(2, "0")}
                  </span>{" "}
                  / {String(s.seeds.length).padStart(2, "0")}
                </span>
                <Button
                  disabled={s.isRedrawing || !s.canNext}
                  size="icon"
                  variant="ghost"
                  className="cursor-pointer text-white"
                  onClick={s.historyForward}
                  aria-label="Next"
                >
                  <ArrowRight />
                </Button>
              </div>
            )}
            <Button
              disabled={s.isRedrawing}
              size="icon"
              variant="ghost"
              className="cursor-pointer text-white"
              onClick={s.toggleMode}
              aria-label={`Switch to ${s.mode === "dark" ? "light" : "dark"} mode`}
            >
              {s.mode === "dark" ? <Sun /> : <Moon />}
            </Button>
            <Button
              disabled={s.isRedrawing}
              size="icon"
              variant="ghost"
              className="cursor-pointer text-white"
              onClick={s.refresh}
              aria-label="Refresh sketch"
            >
              <RefreshCw className={cx(s.isRedrawing && "animate-spin")} />
            </Button>
            <Button
              disabled={s.isRedrawing || s.copying || s.copied}
              size="icon"
              variant="ghost"
              className="cursor-pointer text-white"
              onClick={s.copySVG}
              aria-label="Copy SVG to clipboard"
            >
              {s.copied ? <Check /> : <Copy />}
            </Button>
            {process.env.NODE_ENV === "development" && (
              <>
                <Button
                  disabled={s.isRedrawing}
                  size="icon"
                  variant="ghost"
                  className="cursor-pointer text-white"
                  onClick={s.downloadSVG}
                  aria-label="Download SVG"
                >
                  <DownloadIcon />
                </Button>
                <Button
                  disabled={s.isRedrawing}
                  size="icon"
                  variant="ghost"
                  className="cursor-pointer text-white"
                  onClick={s.importConfig}
                  aria-label="Upload SVG"
                >
                  <FileUpIcon />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── Canvas ──────────────────────────────────────────────── */}
        <div className="relative min-h-0">
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
            <>
              {/* Desktop: always-visible absolute panel */}
              <div className="hidden md:block absolute top-4 right-4 z-20 h-[calc(100%_-_2rem)]">
                <SketchControls
                  schema={s.controlSchema}
                  values={s.controlValues}
                  onChange={(key, value) =>
                    s.setControlValues((prev) => ({ ...prev, [key]: value }))
                  }
                />
              </div>

              {/* Mobile: floating toggle button */}
              <Button
                size="icon"
                variant="secondary"
                className="md:hidden absolute bottom-4 right-4 z-30 rounded-full shadow-lg"
                onClick={() => setControlsOpen((o) => !o)}
                aria-label="Toggle controls"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>

              {/* Mobile: backdrop */}
              {controlsOpen && (
                <div
                  className="md:hidden fixed inset-0 bg-black/40 z-40"
                  onClick={() => setControlsOpen(false)}
                />
              )}

              {/* Mobile: bottom sheet */}
              <div
                className={cx(
                  "md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 max-h-[40vh] overflow-y-auto bg-background/90 backdrop-blur-sm rounded-t-lg border-t border-border",
                  controlsOpen ? "translate-y-0" : "translate-y-full",
                )}
              >
                <SketchControls
                  schema={s.controlSchema}
                  values={s.controlValues}
                  onChange={(key, value) =>
                    s.setControlValues((prev) => ({ ...prev, [key]: value }))
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* ── Bottom toolbar ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-2 w-full border-t border-white/10">
          <div className="flex items-center gap-2 ml-2">
            {s.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            )}
            {process.env.NODE_ENV === "development" ? (
              <input
                onChange={(e) => s.pushSeed(Number(e.target.value))}
                value={s.currentSeed}
                className="text-sm text-muted-foreground pt-0.5"
              />
            ) : (
              <span className="text-sm text-muted-foreground">
                {s.currentSeed}
              </span>
            )}
          </div>

          <div className="flex flex-row justify-center items-center">
            <Button
              size="icon"
              variant="ghost"
              className="text-white"
              onClick={s.rotateCCW}
              aria-label="Rotate counterclockwise"
            >
              <RotateCcw />
            </Button>
            {s.rotation !== 0 && (
              <Button
                variant="ghost"
                className="text-white min-w-12"
                onClick={s.rotateReset}
                aria-label="Reset rotation"
              >
                {s.rotation}°
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="text-white"
              onClick={s.zoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn />
            </Button>
            <Button
              variant="ghost"
              className="text-white min-w-16"
              onClick={s.zoomReset}
              aria-label="Reset zoom"
            >
              {Math.round(s.zoom * 10) / 10}&thinsp;x
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white"
              onClick={s.zoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SketchPage;
