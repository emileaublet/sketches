import React, { useRef, useEffect, useState, useMemo } from "react";
import p5 from "p5";
import { Button } from "./ui/button";
import { cx } from "class-variance-authority";

import {
  Sun,
  Moon,
  RefreshCw,
  Code2Icon,
  Minimize,
  Maximize,
  Check,
  ArrowLeft,
  ArrowRight,
  DownloadIcon,
  ZoomIn,
  ZoomOut,
  FileUpIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useClipboard } from "@custom-react-hooks/use-clipboard";
import { Leva, useControls } from "leva";
import { createControls } from "../utils/constants";

interface P5WrapperProps {
  slug: string;
  className?: string;
  handleViewCode?: () => void;
  handleRefresh?: () => void;
  handleViewFullscreen?: () => void;
  handleModeToggle?: () => void;
  isFullscreen?: boolean;
  mode?: "dark" | "light";
}

const Controls = ({
  controls,
  setControls,
  externalUpdate,
}: {
  controls: any;
  setControls: (c: any) => void;
  externalUpdate?: any;
  cback?: () => void;
}) => {
  const [controlValues, set]: any = useControls(
    () => ({
      ...controls,
      /*  export: button((get) =>
        exportConfig(
          Object.fromEntries(
            Object.entries(controls).map(([key, _]) => [key, get(key)])
          )
        )
      ), */
    }),
    [JSON.stringify(controls)]
  );

  /*   function exportConfig(config: any) {
    console.log(config);
  } */

  // Apply external updates to Leva when they change
  useEffect(() => {
    if (externalUpdate && Object.keys(externalUpdate).length > 0) {
      set(externalUpdate);
    }
  }, [externalUpdate, set]);

  useEffect(() => {
    if (
      controlValues &&
      controlValues.paperSize &&
      controlValues.paperSize !== "Custom" &&
      controlValues.paperSizeRatio
    ) {
      const [w, h] = controlValues.paperSize.split(" -- ")[1].split("x");
      const width = w * controlValues.paperSizeRatio;
      const height = h * controlValues.paperSizeRatio;
      if (width < 2000 && height < 2000) {
        set({
          width,
          height,
        });
      }
    }
    setControls(controlValues);
  }, [controlValues]);

  return <Leva />;
};

const P5Wrapper: React.FC<P5WrapperProps> = ({
  slug,
  className,
  handleViewFullscreen = () => {},
  handleModeToggle = () => {},
  isFullscreen = false,
  mode = "dark",
}) => {
  const [controls, setControls] = useState({});
  const [controlValues, setControlValues] = useState({});
  const [externalControlUpdate, setExternalControlUpdate] = useState({});
  const [pos, setPos] = useState(0);
  const [seed, setSeed] = useState<number[]>([0]);
  const [sketch, setSketch] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const { copyToClipboard } = useClipboard();
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  // Zoom/pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom controls handlers (must be inside component)
  // Helper to zoom from center of viewport (with transform-origin: center)
  const zoomFromCenter = (scaleAmount: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.max(0.1, Math.min(prevZoom * scaleAmount, 10));
      return newZoom;
    });
  };
  const handleZoomIn = () => {
    zoomFromCenter(1.2);
  };
  const handleZoomOut = () => {
    zoomFromCenter(1 / 1.2);
  };
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getRandomSeed = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
  };
  // Set a random seed for the sketch on mount and on redraw
  useEffect(() => {
    setSeed((s) => [getRandomSeed(), ...s]);
  }, [slug]);

  // Calculate pixelDensity threshold tier for zoom level
  // This ensures we only re-render when crossing meaningful thresholds
  // Must match the thresholds in canvasSetup.ts calculatePixelDensity()

  const zoomTier = useMemo(() => {
    if ((controlValues as any).useSVG === false) {
      return Math.round(zoom);
    }
  }, [zoom]);

  useEffect(() => {
    // Dynamically import the sketch module
    const loadSketch = async () => {
      setIsLoading(true);
      try {
        const {
          default: sketchModule,
          constants,
          constantsProps = {},
        } = await import(`../sketches/${slug}.ts`);

        // Convert constants to Leva controls using the standardized utility
        const levaControls = createControls(constants || {}, constantsProps);
        setControls(levaControls);
        // Pass zoom level to sketch via controlValues
        setSketch(() =>
          sketchModule(seed[pos], { ...controlValues, zoomLevel: zoomTier })
        );
      } catch (error) {
        console.error("Failed to load sketch:", error);
      }
    };
    loadSketch();
  }, [slug, seed, pos, controlValues, zoomTier]);

  useEffect(() => {
    if (!containerRef.current || !sketch) {
      return;
    }

    // Create p5 instance in the content wrapper
    if (contentRef.current) {
      contentRef.current.innerHTML = ""; // Clear previous sketch
      p5InstanceRef.current = new p5(sketch, contentRef.current);
      // Mark loading as complete after a short delay to ensure sketch is rendered
      setTimeout(() => setIsLoading(false), 100);
    }

    // Cleanup
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [sketch]);

  // Zoom/pan logic using CSS transforms on the content wrapper
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wheel to zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleAmount = e.deltaY < 0 ? 1.1 : 0.9;
      zoomFromCenter(scaleAmount);
    };

    // Drag to pan
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [zoom, pan]);

  // Clean up SVG inline styles when zoom is reset to 1
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const svg = content.querySelector("svg");
    if (!svg) return;

    if (zoom === 1 && pan.x === 0 && pan.y === 0) {
      // Remove transform-related inline styles when at default zoom
      svg.style.removeProperty("transform");
      svg.style.removeProperty("will-change");
      svg.style.removeProperty("backface-visibility");
      svg.style.removeProperty("-webkit-font-smoothing");
      svg.style.removeProperty("-moz-osx-font-smoothing");
    }
  }, [zoom, pan]);

  const handleRedraw = React.useCallback(() => {
    // Change seed for new randomization, which will trigger sketch reload
    setSeed((s) => [getRandomSeed(), ...s]);
    setPos(0); // Reset to the newest sketch
    setIsRedrawing(true);
    handleZoomReset();
    setTimeout(() => {
      setIsRedrawing(false);
    }, 100);
  }, []);

  const handleCopy = React.useCallback(
    async (textToCopy: string) => {
      setCopying(true);
      copyToClipboard(textToCopy)
        .catch((error) => {
          console.error("Failed to copy:", error);
        })
        .finally(() => {
          setCopying(false);
          setCopied(true);
        });
    },
    [copyToClipboard]
  );

  const handleViewCode = React.useCallback(() => {
    // Find the SVG element created by p5.js
    if (contentRef.current) {
      const svgElement = contentRef.current.querySelector("svg");

      if (svgElement) {
        handleCopy(svgElement.outerHTML);
      } else {
        console.log("No SVG found");
      }
    }
  }, [contentRef, handleCopy]);

  useEffect(() => {
    // Reset copied state after 2 seconds
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Back = older (higher index), Next = newer (lower index)
  const handleBack = React.useCallback(() => {
    setPos((prev) => {
      const nextPos = prev + 1;
      if (nextPos >= seed.length) {
        return seed.length - 1; // Wrap to oldest
      }
      return nextPos;
    });
  }, [seed.length]);

  const handleNext = React.useCallback(() => {
    setPos((prev) => {
      const nextPos = prev - 1;
      if (nextPos < 0) {
        return 0; // Wrap to newest
      }
      return nextPos;
    });
  }, []);

  const handleUploadSVG = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate it's an SVG file
      if (!file.type.includes("svg") && !file.name.endsWith(".svg")) {
        alert("Please upload an SVG file");
        return;
      }

      // Read the file
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgContent = e.target?.result as string;

        // Replace the current SVG in the content wrapper
        if (contentRef.current) {
          contentRef.current.innerHTML = svgContent;

          // Reset zoom/pan
          handleZoomReset();

          // Try to extract seed and config from the uploaded SVG if they exist
          const svgElement = contentRef.current.querySelector("svg");
          if (svgElement) {
            const seedAttr = svgElement.getAttribute("seed");
            const configAttr = svgElement.getAttribute("sketch-config");

            if (seedAttr) {
              const uploadedSeed = Number(seedAttr);
              setSeed((s) => [uploadedSeed, ...s]);
              setPos(0);
            }

            if (configAttr) {
              try {
                const config = JSON.parse(configAttr);
                // Update control values
                setControlValues(config);
                // Trigger external update to Leva
                setExternalControlUpdate(config);
              } catch (error) {
                console.error("Failed to parse sketch config:", error);
              }
            }
          }
        }
      };

      reader.readAsText(file);

      // Reset the input so the same file can be uploaded again
      event.target.value = "";
    },
    [handleZoomReset]
  );
  const handleDownloadSVG = React.useCallback(() => {
    const performDownload = () => {
      if (contentRef.current) {
        const svgElement = contentRef.current.querySelector("svg");
        svgElement?.setAttribute(
          "sketch-config",
          JSON.stringify(controlValues)
        );
        svgElement?.setAttribute("seed", String(seed[pos]));
        if (svgElement) {
          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(svgElement);
          const blob = new Blob([svgString], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${slug}-${seed[pos]}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          console.error("No SVG element found to download.");
        }
      }
    };

    // Check if useSVG is currently enabled
    const currentUseSVG = (controlValues as any).useSVG;

    if (currentUseSVG === false) {
      // SVG is disabled, need to temporarily enable it
      console.log("Temporarily enabling SVG for download...");

      // Store original value
      const originalUseSVG = currentUseSVG;

      // Enable SVG
      setControlValues((prev) => ({ ...prev, useSVG: true }));

      // Wait for sketch to re-render with SVG, then download and restore
      setTimeout(() => {
        performDownload();

        // Restore original useSVG value
        setTimeout(() => {
          setControlValues((prev) => ({ ...prev, useSVG: originalUseSVG }));
        }, 100);
      }, 500); // Give enough time for sketch to re-render
    } else {
      // Already in SVG mode, download immediately
      performDownload();
    }
  }, [slug, seed, pos, controlValues]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          if (pos < seed.length - 1) handleBack();
          break;
        case "ArrowRight":
          if (pos > 0) handleNext();
          break;
        case "m":
          handleModeToggle();
          break;
        case "r":
          handleRedraw();
          break;
        case "c":
          handleViewCode();
          break;
        case "d":
          handleDownloadSVG();
          break;
        case "f":
          handleViewFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    seed,
    pos,
    handleModeToggle,
    handleRedraw,
    handleViewCode,
    handleViewFullscreen,
    handleBack,
    handleNext,
    handleDownloadSVG,
  ]);

  const canBack = pos < seed.length - 1;
  const canNext = pos > 0;

  return (
    <div className="w-full h-full grid grid-cols-1 grid-rows-[auto_1fr_auto]">
      {/* Hidden file input for SVG upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <div className="flex items-center justify-end p-2 w-full border-b-2">
        {process.env.NODE_ENV === "development" && (
          <div className="flex-grow flex items-center justify-start">
            <Controls
              controls={controls}
              setControls={setControlValues}
              externalUpdate={externalControlUpdate}
            />
            <Button
              disabled={isRedrawing || !canBack}
              size={"icon"}
              variant={"ghost"}
              className={cx("cursor-pointer", "text-white")}
              onClick={handleBack}
              aria-label={`Back`}
            >
              <ArrowLeft />
            </Button>
            <span className="text-sm text-muted-foreground mt-px tabular-nums">
              <span className="text-white">
                {String(pos + 1).padStart(2, "0")}
              </span>{" "}
              / {String(seed.length).padStart(2, "0")}
            </span>
            <Button
              disabled={isRedrawing || !canNext}
              size={"icon"}
              variant={"ghost"}
              className={cx("cursor-pointer", "text-white")}
              onClick={handleNext}
              aria-label={`Next`}
            >
              <ArrowRight />
            </Button>
          </div>
        )}
        <Button
          disabled={isRedrawing}
          size={"icon"}
          variant={"ghost"}
          className={cx("cursor-pointer", "text-white")}
          onClick={handleModeToggle}
          aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        >
          {mode === "dark" ? <Sun /> : <Moon />}
        </Button>
        <Button
          disabled={isRedrawing}
          size={"icon"}
          variant={"ghost"}
          className={cx("cursor-pointer", "text-white")}
          onClick={handleRedraw}
          aria-label={"Refresh sketch"}
        >
          <RefreshCw className={cx(isRedrawing && "animate-spin")} />
        </Button>
        <Button
          disabled={isRedrawing || copying || copied}
          size={"icon"}
          variant={"ghost"}
          className={cx("cursor-pointer", "text-white")}
          onClick={handleViewCode}
          aria-label={"View code"}
        >
          {copied ? <Check /> : <Code2Icon />}
        </Button>
        {process.env.NODE_ENV === "development" && (
          <Button
            disabled={isRedrawing}
            size={"icon"}
            variant={"ghost"}
            className={cx("cursor-pointer", "text-white")}
            onClick={handleDownloadSVG}
            aria-label={"Download SVG"}
          >
            <DownloadIcon />
          </Button>
        )}
        {process.env.NODE_ENV === "development" && (
          <Button
            disabled={isRedrawing}
            size={"icon"}
            variant={"ghost"}
            className={cx("cursor-pointer", "text-white")}
            onClick={handleUploadSVG}
            aria-label={"Upload SVG"}
          >
            <FileUpIcon />
          </Button>
        )}
        <Button
          disabled={isRedrawing}
          size={"icon"}
          variant={"ghost"}
          className={cx("cursor-pointer", "text-white")}
          onClick={handleViewFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize /> : <Maximize />}
        </Button>
      </div>
      <div
        id="sketch-canvas"
        className={cx(
          className,
          "aspect-[8/7] overflow-hidden relative flex items-center justify-center"
        )}
        ref={containerRef}
        style={{
          cursor: isDragging.current
            ? "grabbing"
            : zoom !== 1
            ? "grab"
            : "default",
        }}
      >
        <div
          ref={contentRef}
          className="flex items-center justify-center"
          style={{
            ...(zoom !== 1 || pan.x !== 0 || pan.y !== 0
              ? {
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: isDragging.current
                    ? "none"
                    : "transform 0.1s ease-out",
                  imageRendering: zoom > 1 ? "crisp-edges" : "auto",
                  willChange: "transform",
                }
              : {}),
          }}
        />
      </div>
      <div className="flex items-center justify-between p-2 w-full border-t-2">
        <div className="flex items-center gap-2 ml-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          )}
          {process.env.NODE_ENV === "development" ? (
            <input
              onChange={(e) => setSeed((s) => [Number(e.target.value), ...s])}
              value={seed[pos] ?? 0}
              className="text-sm text-muted-foreground pt-0.5"
            />
          ) : (
            <span className="text-sm text-muted-foreground">{seed[pos]}</span>
          )}
        </div>

        <div className="flex flex-row justify-center items-center">
          <Button
            size="icon"
            variant="ghost"
            className={cx("text-white")}
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn />
          </Button>

          <Button
            variant="ghost"
            className={cx("text-white", "min-w-16")}
            onClick={handleZoomReset}
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            {Math.round(zoom * 10) / 10}&thinsp;x
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cx("text-white")}
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default P5Wrapper;
