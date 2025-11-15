import { p5SVG } from "p5.js-svg";

export interface CanvasConfig {
  width: number;
  height: number;
  marginX?: number;
  marginY?: number;
  seed?: number | null;
  noFill?: boolean;
  noLoop?: boolean;
  smooth?: boolean;
  colorMode?: "RGB" | "HSB";
  angleMode?: "DEGREES" | "RADIANS";
  strokeWeight?: number;
  debug?: boolean;
  optimizeSVG?: boolean; // Enable SVG optimization (default: true)
  useSVG?: boolean; // Use SVG renderer (default: true), set to false to use Canvas for performance
  zoomLevel?: number; // Current zoom level to adjust pixelDensity dynamically
}

/**
 * Calculate optimal pixelDensity based on zoom level
 * Higher zoom = higher detail needed
 * @param zoomLevel - Current zoom level (1 = 100%, 1.5 = 150%, etc.)
 * @returns pixelDensity value
 */
const calculatePixelDensity = (zoomLevel: number | undefined): number => {
  console.log("Calculating pixel density for zoom level:", zoomLevel);
  if (!zoomLevel) return 2; // Default when no zoom info available

  // Zoom thresholds for pixelDensity adjustment
  if (zoomLevel >= 10.0) return 10; // 1000%+ zoom = 10x density
  if (zoomLevel >= 7.5) return 8; // 750%+ zoom = 8x density
  if (zoomLevel >= 5.0) return 6; // 500%+ zoom = 6x density
  if (zoomLevel >= 3.5) return 5; // 350%+ zoom = 5x density
  if (zoomLevel >= 2.5) return 4; // 250%+ zoom = 4x density
  if (zoomLevel >= 1.5) return 3; // 150%+ zoom = 3x density
  if (zoomLevel >= 1.0) return 2; // 100%+ zoom = 2x density (default)

  return 1; // Below 100% zoom = 1x density (save performance when zoomed out)
};

/**
 * Standard canvas setup that most sketches use
 */
export const setupCanvas = (p: p5SVG, config: CanvasConfig) => {
  if (config.seed !== null && config.seed !== undefined) {
    p.randomSeed(config.seed);
  }

  // Create canvas with SVG or Canvas renderer
  const useSVG = config.useSVG !== false; // Default to SVG
  if (useSVG) {
    p.createCanvas(config.width, config.height, p.SVG);
    // SVG Optimization - enabled by default unless explicitly disabled
    if (config.optimizeSVG !== false) {
      optimizeSVGRendering(p);
    }
  } else {
    // Use default Canvas2D renderer for better performance with heavy sketches
    // Adjust pixelDensity based on zoom level for optimal quality/performance
    const pixelDensity = calculatePixelDensity(config.zoomLevel);
    p.pixelDensity(pixelDensity);
    p.createCanvas(config.width, config.height, p.P2D);
  }

  if (config.colorMode) {
    p.colorMode(p[config.colorMode]);
  }

  if (config.angleMode) {
    p.angleMode(p[config.angleMode]);
  }

  if (config.noFill !== false) {
    p.noFill();
  }

  if (config.noLoop) {
    p.noLoop();
  }

  if (config.smooth) {
    p.smooth();
  }

  if (config.strokeWeight) {
    p.strokeWeight(config.strokeWeight);
  }

  if (config.debug) {
    p.stroke("red");
    p.noFill();
    p.rect(0, 0, p.width, p.height);
    if (config.marginX && config.marginY) {
      p.rect(
        config.marginX,
        config.marginY,
        p.width - 2 * config.marginX,
        p.height - 2 * config.marginY
      );
    }
  }
};

/**
 * Optimize SVG rendering for better browser performance
 * This reduces the load on the browser when rendering complex SVGs
 */
const optimizeSVGRendering = (p: p5SVG) => {
  const svg = (p as any)._renderer.svg;

  if (svg) {
    // 1. Use CSS transform instead of individual element transforms when possible
    svg.style.willChange = "transform";

    // 2. Add shape-rendering for crisp edges at any zoom level
    // geometricPrecision provides the best quality for zooming
    svg.setAttribute("shape-rendering", "geometricPrecision");

    // 3. Disable unnecessary features for static sketches
    svg.setAttribute("pointer-events", "none");

    // 4. Add CSS optimization hints
    svg.style.transform = "translateZ(0)"; // Force GPU acceleration
    svg.style.backfaceVisibility = "hidden";

    // 5. Optimize text rendering if present
    svg.setAttribute("text-rendering", "geometricPrecision");

    // 6. Ensure crisp rendering at all zoom levels
    svg.style.imageRendering = "crisp-edges";

    // 7. Prevent anti-aliasing blur when scaled
    svg.style.setProperty("-webkit-font-smoothing", "antialiased");
    svg.style.setProperty("-moz-osx-font-smoothing", "grayscale");
  }
};
