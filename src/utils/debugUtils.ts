import { p5SVG } from "p5.js-svg";
import { Point } from "./pathUtils";

/**
 * Draw debug points with numbered labels
 */
export const drawDebugPoints = (
  p: p5SVG,
  points: Point[],
  options: {
    circleSize?: number;
    circleColor?: [number, number, number];
    textColor?: [number, number, number];
    textSize?: number;
    showNumbers?: boolean;
  } = {}
) => {
  const {
    circleSize = 20,
    circleColor = [255, 0, 0],
    textColor = [0, 0, 0],
    textSize = 10,
    showNumbers = true,
  } = options;

  p.fill(circleColor[0], circleColor[1], circleColor[2]);
  p.noStroke();

  points.forEach((pt, idx) => {
    p.circle(pt.x, pt.y, circleSize);

    if (showNumbers) {
      p.fill(textColor[0], textColor[1], textColor[2]);
      p.textSize(textSize);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(idx + 1, pt.x, pt.y);
      p.fill(circleColor[0], circleColor[1], circleColor[2]);
    }
  });

  // Reset to default state
  p.noFill();
};

/**
 * Draw debug information as text overlay
 */
export const drawDebugInfo = (
  p: p5SVG,
  info: Record<string, any>,
  position: { x: number; y: number } = { x: 10, y: 20 }
) => {
  p.fill(0);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);

  let y = position.y;
  Object.entries(info).forEach(([key, value]) => {
    p.text(`${key}: ${value}`, position.x, y);
    y += 15;
  });

  // Reset to default state
  p.noFill();
};
