import type { p5SVG } from "p5.js-svg";
import { DotPen } from "@/pens";
import { setStroke } from "./setStroke";

/**
 * Draw a spiral pattern within a bounding box
 */
export interface SpiralConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  turns?: number; // Number of rotations (default: random 3 to size/10)
  points?: number; // Number of points in spiral (default: 200)
}

export function drawSpiral(p: p5SVG, config: SpiralConfig): void {
  setStroke(config.color, p);
  p.noFill();

  const turns = config.turns ?? p.random(3, config.size / 10);
  const points = config.points ?? 200;
  const centerX = config.x + config.size / 2;
  const centerY = config.y + config.size / 2;
  const maxR = config.size / 2;

  p.beginShape();
  for (let i = 0; i < points; i++) {
    const t = (i / points) * turns * p.TWO_PI;
    const r = (i / points) * maxR;
    p.vertex(centerX + r * Math.cos(t), centerY + r * Math.sin(t));
  }
  p.endShape();
}

/**
 * Draw concentric circles or rings
 */
export interface ConcentricCirclesConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  rings?: number; // Number of rings (default: random 3-8)
  minRadius?: number; // Minimum radius as fraction of size (default: 0)
  maxRadius?: number; // Maximum radius as fraction of size (default: 0.5)
}

export function drawConcentricCircles(
  p: p5SVG,
  config: ConcentricCirclesConfig
): void {
  setStroke(config.color, p);
  p.noFill();

  const centerX = config.x + config.size / 2;
  const centerY = config.y + config.size / 2;
  const rings = config.rings ?? p.floor(p.random(3, 8));
  const minRadius = (config.minRadius ?? 0) * config.size;
  const maxRadius = (config.maxRadius ?? 0.5) * config.size;

  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const r = p.lerp(minRadius, maxRadius, t);
    p.circle(centerX, centerY, r * 2);
  }
}

/**
 * Draw concentric squares
 */
export interface ConcentricSquaresConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  layers?: number; // Number of layers (default: random 3-6)
}

export function drawConcentricSquares(
  p: p5SVG,
  config: ConcentricSquaresConfig
): void {
  setStroke(config.color, p);
  p.noFill();

  const centerX = config.x + config.size / 2;
  const centerY = config.y + config.size / 2;
  const layers = config.layers ?? p.floor(p.random(3, 6));

  for (let i = 1; i <= layers; i++) {
    const s = (i / layers) * config.size;
    p.rect(centerX - s / 2, centerY - s / 2, s, s);
  }
}

/**
 * Draw concentric diamonds (rotated squares)
 */
export interface ConcentricDiamondsConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  layers?: number;
}

export function drawConcentricDiamonds(
  p: p5SVG,
  config: ConcentricDiamondsConfig
): void {
  setStroke(config.color, p);
  p.noFill();

  const centerX = config.x + config.size / 2;
  const centerY = config.y + config.size / 2;
  const layers = config.layers ?? p.floor(p.random(3, 6));

  for (let i = 1; i <= layers; i++) {
    const s = (i / layers) * (config.size / 2);
    p.beginShape();
    p.vertex(centerX, centerY - s);
    p.vertex(centerX + s, centerY);
    p.vertex(centerX, centerY + s);
    p.vertex(centerX - s, centerY);
    p.endShape(p.CLOSE);
  }
}

/**
 * Draw radial lines from center
 */
export interface RadialLinesConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  rays?: number; // Number of rays (default: random 12 to size/3)
}

export function drawRadialLines(p: p5SVG, config: RadialLinesConfig): void {
  setStroke(config.color, p);
  p.noFill();

  const centerX = config.x + config.size / 2;
  const centerY = config.y + config.size / 2;
  const rays = config.rays ?? p.floor(p.random(12, config.size / 3));

  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * p.TWO_PI;
    p.line(
      centerX,
      centerY,
      centerX + (config.size / 2) * Math.cos(angle),
      centerY + (config.size / 2) * Math.sin(angle)
    );
  }
}

/**
 * Draw a polygon web (concentric polygons)
 */
export interface PolygonWebConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  sides?: number; // Number of polygon sides (default: random 3-8)
  layers?: number; // Number of layers (default: random 2-5)
}

export function drawPolygonWeb(p: p5SVG, config: PolygonWebConfig): void {
  setStroke(config.color, p);
  p.noFill();

  const sides = config.sides ?? p.floor(p.random(3, 8));
  const centerX = config.x + config.size / 2;
  const centerY = config.y + config.size / 2;
  const layers = config.layers ?? p.floor(p.random(2, 5));

  for (let l = 1; l <= layers; l++) {
    const r = (l / layers) * (config.size / 2);
    p.beginShape();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * p.TWO_PI - p.HALF_PI;
      p.vertex(centerX + r * Math.cos(angle), centerY + r * Math.sin(angle));
    }
    p.endShape(p.CLOSE);
  }
}

/**
 * Draw wavy horizontal lines
 */
export interface WavyLinesConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  lines?: number; // Number of lines (default: random 4 to size/10)
  amplitude?: number; // Wave amplitude (default: random 2-7)
  frequency?: number; // Wave frequency (default: random 1-3)
}

export function drawWavyLines(p: p5SVG, config: WavyLinesConfig): void {
  setStroke(config.color, p);
  p.noFill();

  const lines = config.lines ?? p.floor(p.random(4, config.size / 10));
  const amp = config.amplitude ?? p.random(2, 7);
  const freq = config.frequency ?? p.random(1, 3);

  for (let i = 0; i < lines; i++) {
    const yPos = config.y + (i / (lines - 1)) * config.size;
    p.beginShape();
    for (let j = 0; j <= config.size; j += 2) {
      const xPos = config.x + j;
      const wave = Math.sin((j / config.size) * freq * p.TWO_PI + i) * amp;
      if (!isNaN(xPos) && !isNaN(yPos + wave)) {
        p.vertex(xPos, yPos + wave);
      }
    }
    p.endShape();
  }
}

/**
 * Draw a bullseye pattern (alternating filled/unfilled circles)
 */
export interface BullseyeConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  rings?: number; // Number of rings (default: random 3-6)
}

export function drawBullseye(p: p5SVG, config: BullseyeConfig): void {
  setStroke(config.color, p);

  const centerX = config.x + config.size / 2;
  const centerY = config.y + config.size / 2;
  const rings = config.rings ?? p.floor(p.random(3, 6));
  const maxRadius = config.size / 2;

  for (let i = rings; i > 0; i--) {
    const r = (i / rings) * maxRadius;

    if (i % 2 === 0) {
      p.fill(config.color);
      p.noStroke();
    } else {
      p.noFill();
      setStroke(config.color, p);
    }

    p.circle(centerX, centerY, r * 2);
  }

  // Reset to default
  p.noFill();
}

/**
 * Draw a checkerboard pattern
 */
export interface CheckerboardConfig {
  x: number;
  y: number;
  size: number;
  color: DotPen;
  divisions?: number; // Number of divisions per side (default: random 3-6)
}

export function drawCheckerboard(p: p5SVG, config: CheckerboardConfig): void {
  setStroke(config.color, p);

  const divisions = config.divisions ?? p.floor(p.random(3, 6));
  const cellSize = config.size / divisions;

  for (let i = 0; i < divisions; i++) {
    for (let j = 0; j < divisions; j++) {
      if ((i + j) % 2 === 0) {
        p.fill(config.color);
        p.noStroke();
      } else {
        p.noFill();
        setStroke(config.color, p);
      }

      p.rect(
        config.x + i * cellSize,
        config.y + j * cellSize,
        cellSize,
        cellSize
      );
    }
  }

  // Reset to default
  p.noFill();
}
