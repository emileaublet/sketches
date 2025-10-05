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
}

/**
 * Standard canvas setup that most sketches use
 */
export const setupCanvas = (p: p5SVG, config: CanvasConfig) => {
  if (config.seed !== null && config.seed !== undefined) {
    p.randomSeed(config.seed);
  }

  p.createCanvas(config.width, config.height, p.SVG);

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
