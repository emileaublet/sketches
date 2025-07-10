import React, { useRef, useEffect, useState } from "react";
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
} from "lucide-react";
import { useClipboard } from "@custom-react-hooks/use-clipboard";

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

const P5Wrapper: React.FC<P5WrapperProps> = ({
  slug,
  className,
  handleViewFullscreen = () => {},
  handleModeToggle = () => {},
  isFullscreen = false,
  mode = "dark",
}) => {
  const [pos, setPos] = useState(0);
  const [seed, setSeed] = useState<number[]>([]);
  const [sketch, setSketch] = useState();
  const { copyToClipboard } = useClipboard();
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  const getRandomSeed = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
  };
  // Set a random seed for the sketch on mount and on redraw
  useEffect(() => {
    setSeed((s) => [getRandomSeed(), ...s]);
  }, [slug]);

  useEffect(() => {
    // Dynamically import the sketch module
    const loadSketch = async () => {
      try {
        const { default: sketchModule } = await import(
          `../sketches/${slug}.ts`
        );
        setSketch(() => sketchModule(seed[pos]));
      } catch (error) {
        console.error("Error loading sketch:", error);
      }
    };

    if (seed !== undefined) {
      loadSketch();
    }
  }, [slug, seed, pos]);
  useEffect(() => {
    // wait for the container to be available
    if (!containerRef.current || !sketch) {
      return;
    }

    // Create p5 instance
    if (containerRef.current) {
      containerRef.current.innerHTML = ""; // Clear previous sketch
      p5InstanceRef.current = new p5(sketch, containerRef.current);
    }

    // Cleanup
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [sketch]);

  const handleRedraw = () => {
    // Change seed for new randomization, which will trigger sketch reload
    setSeed((s) => [getRandomSeed(), ...s]);
    setIsRedrawing(true);
    setTimeout(() => {
      setIsRedrawing(false);
    }, 100);
  };

  const handleCopy = async (textToCopy: string) => {
    setCopying(true);
    copyToClipboard(textToCopy)
      .catch((error) => {
        console.error("Failed to copy:", error);
      })
      .finally(() => {
        setCopying(false);
        setCopied(true);
      });
  };

  const handleViewCode = () => {
    // Find the SVG element created by p5.js
    if (containerRef.current) {
      const svgElement = containerRef.current.querySelector("svg");

      if (svgElement) {
        handleCopy(svgElement.outerHTML);
      } else {
        console.log("No SVG found");
      }
    }
  };

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
  const handleBack = () => {
    setPos((prev) => {
      const nextPos = prev + 1;
      if (nextPos >= seed.length) {
        return seed.length - 1; // Wrap to oldest
      }
      return nextPos;
    });
  };

  const handleNext = () => {
    setPos((prev) => {
      const nextPos = prev - 1;
      if (nextPos < 0) {
        return 0; // Wrap to newest
      }
      return nextPos;
    });
  };

  const canBack = pos < seed.length - 1;
  const canNext = pos > 0;

  return (
    <>
      <div className="relative w-full h-full">
        <div id="sketch-canvas" ref={containerRef} className={className} />
      </div>
      <div className="absolute bottom-0 left-0 z-50 flex items-center justify-between w-full p-4 bg-background/80 backdrop-blur-md">
        {process.env.NODE_ENV === "development" ? (
          <input
            onChange={(e) => setSeed((s) => [Number(e.target.value), ...s])}
            value={seed[pos]}
            className="text-sm text-muted-foreground"
          />
        ) : (
          <span className="text-sm text-muted-foreground">{seed[pos]}</span>
        )}
      </div>
      <div className="absolute top-0 right-0 z-50 flex items-center justify-end p-4 w-full">
        {process.env.NODE_ENV === "development" && (
          <div className="flex-grow">
            <Button
              disabled={isRedrawing || !canBack}
              size={"icon"}
              variant={"ghost"}
              className={cx(
                "cursor-pointer",
                mode === "dark" ? "text-white" : "text-black"
              )}
              onClick={handleBack}
              aria-label={`Back`}
            >
              <ArrowLeft />
            </Button>
            <Button
              disabled={isRedrawing || !canNext}
              size={"icon"}
              variant={"ghost"}
              className={cx(
                "cursor-pointer",
                mode === "dark" ? "text-white" : "text-black"
              )}
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
          className={cx(
            "cursor-pointer",
            mode === "dark" ? "text-white" : "text-black"
          )}
          onClick={handleModeToggle}
          aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        >
          {mode === "dark" ? <Sun /> : <Moon />}
        </Button>
        <Button
          disabled={isRedrawing}
          size={"icon"}
          variant={"ghost"}
          className={cx(
            "cursor-pointer",
            mode === "dark" ? "text-white" : "text-black"
          )}
          onClick={handleRedraw}
          aria-label={"Refresh sketch"}
        >
          <RefreshCw className={cx(isRedrawing && "animate-spin")} />
        </Button>
        <Button
          disabled={isRedrawing || copying || copied}
          size={"icon"}
          variant={"ghost"}
          className={cx(
            "cursor-pointer",
            mode === "dark" ? "text-white" : "text-black"
          )}
          onClick={handleViewCode}
          aria-label={"View code"}
        >
          {copied ? <Check /> : <Code2Icon />}
        </Button>
        <Button
          disabled={isRedrawing}
          size={"icon"}
          variant={"ghost"}
          className={cx(
            "cursor-pointer",
            mode === "dark" ? "text-white" : "text-black"
          )}
          onClick={handleViewFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize /> : <Maximize />}
        </Button>
      </div>
    </>
  );
};

export default P5Wrapper;
