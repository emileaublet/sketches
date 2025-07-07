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
  const [sketch, setSketch] = useState();
  const { copyToClipboard } = useClipboard();
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    // Dynamically import the sketch module
    const loadSketch = async () => {
      try {
        const { default: sketchModule } = await import(
          `../sketches/${slug}.ts`
        );
        setSketch(() => sketchModule);
      } catch (error) {
        console.error("Error loading sketch:", error);
      }
    };

    loadSketch();
  }, [slug]);
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
    if (!containerRef.current || !sketch) {
      return;
    }

    setIsRedrawing(true);

    // Use setTimeout with 0ms to ensure the state update is processed first
    setTimeout(() => {
      if (!containerRef.current || !sketch) {
        setIsRedrawing(false);
        return;
      }

      // Clean up existing instance
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }

      // Clear the container
      containerRef.current.innerHTML = "";

      // Create new p5 instance
      const newInstance = new p5(sketch, containerRef.current);
      p5InstanceRef.current = newInstance;

      // Show spinning animation for at least 600ms
      setTimeout(() => {
        setIsRedrawing(false);
      }, 100);
    }, 0);
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

  return (
    <>
      <div className="relative w-full h-full">
        <div id="sketch-canvas" ref={containerRef} className={className} />
      </div>
      <div className="absolute top-0 right-0 z-50 flex items-center justify-between p-4">
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
