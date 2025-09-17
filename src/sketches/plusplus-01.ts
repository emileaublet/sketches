import { p5SVG } from "p5.js-svg";

import { DotPen } from "@/pens";

import { Meta } from "../types";
import { setStroke } from "@/utils/setStroke";

export const meta: Meta = {
  id: "plusplus-01",
  title: "PlusPlus 01",
  description: "",
  thumbnail: "plusplus-01.png",
};

const dark = "micronPens.blue_036";
const light = "micronPens.red_019";
const medium = "micronPens.green_029";

export const constants = {
  canvasMargin: 200,
  lineCount: 6,
  width: 700,
  height: 850,
};
// Add asymmetry parameter (default 1) and region settings
const plusPlusSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const canvasMargin = vars.canvasMargin ?? constants.canvasMargin;
    const lineCount = vars.lineCount ?? constants.lineCount;

    p.setup = () => {
      if (seed !== null) p.randomSeed(seed);
      p.createCanvas(
        vars.width ?? constants.width,
        vars.height ?? constants.height,
        p.SVG
      );
      //p.background(255);

      const plusSize = 20;
      drawGrid(plusSize, dark);
      drawGrid(plusSize, medium);
      drawGrid(plusSize, light);

      p.noLoop();
    };

    function drawGrid(plusSize: number, color: DotPen) {
      setStroke(color, p);
      const gradientInfo = getGradientInfo(plusSize);
      const horizontalSpacing = plusSize;
      const cols = Math.floor((p.width - canvasMargin) / horizontalSpacing);
      const rows = Math.floor(
        (p.height - canvasMargin) / ((plusSize / 3) * 2) - 1
      );

      const totalGridWidth = (cols - 1) * horizontalSpacing;
      const totalGridHeight = (rows - 1) * ((plusSize / 3) * 2);

      const leftPadding = (p.width - totalGridWidth) / 2;
      const topPadding = (p.height - totalGridHeight) / 2;
      let j = 0;
      while (j < rows) {
        for (let i = 0; i < cols; i++) {
          // Simple grid without complex offsets
          let x = leftPadding + i * horizontalSpacing;
          let y = topPadding + ((plusSize * j) / 3) * 2;

          // rows should be red, green, blue, red, green, blue etc.
          const rowPos = j % 3;

          if (rowPos === 1) {
            x += horizontalSpacing / 3;
          }
          if (rowPos === 2) {
            x -= horizontalSpacing / 3;
          }

          // Check if plus sign should be rendered based on gradient
          const shouldRender = shouldRenderPlusAtPosition(
            x,
            y,
            plusSize,
            gradientInfo
          );

          if (shouldRender) {
            drawOnePlus(x, y, plusSize, lineCount);
          }
        }
        j++;
      }
    }

    function getGradientInfo(pixelSize: number) {
      // Random gradient angle
      const angle = p.random(0, p.TWO_PI);
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Random midpoint for the gradient - make it more central for visibility
      const midPoint = {
        x: p.random(p.width * -0.25, p.width * 0.75),
        y: p.random(p.height * -0.25, p.height * 0.75),
      };

      // Calculate the actual min and max projection values for the canvas corners
      const corners = [
        { x: 0, y: 0 },
        { x: p.width, y: 0 },
        { x: 0, y: p.height },
        { x: p.width, y: p.height },
      ];

      const projections = corners.map(
        (corner) =>
          (corner.x - midPoint.x) * cosAngle +
          (corner.y - midPoint.y) * sinAngle
      );
      const minProjection = Math.min(...projections);
      const maxProjection = Math.max(...projections);

      return {
        angle,
        cosAngle,
        sinAngle,
        minProjection,
        maxProjection,
        midPoint,
        pixelSize,
      };
    }

    function shouldRenderPlusAtPosition(
      x: number,
      y: number,
      plusSize: number,
      gradientInfo: any
    ): boolean {
      const { cosAngle, sinAngle, minProjection, maxProjection, midPoint } =
        gradientInfo;

      // Sample several points within the plus sign area
      const samplePoints = [
        { x: x, y: y }, // center
        { x: x - plusSize / 2, y: y }, // left
        { x: x + plusSize / 2, y: y }, // right
        { x: x, y: y - plusSize / 2 }, // top
        { x: x, y: y + plusSize / 2 }, // bottom
      ];

      let blackCount = 0;

      for (const point of samplePoints) {
        // Calculate gradient value at this point using midpoint offset
        // Distance from midpoint along the gradient direction
        const projectedDistance =
          (point.x - midPoint.x) * cosAngle + (point.y - midPoint.y) * sinAngle;

        // Map the projection to 0-1, but center it around the midpoint
        let gradientValue = p.map(
          projectedDistance,
          minProjection,
          maxProjection,
          0,
          1
        );

        // Clamp to ensure we stay in 0-1 range
        gradientValue = p.constrain(gradientValue, 0, 1);

        // Simple random dithering - more natural looking
        const randomThreshold = p.random(0.1, 0.9);
        const threshold = p.lerp(randomThreshold, gradientValue, 0.7);

        const isBlack = p.random() < threshold;
        if (isBlack) blackCount++;
      }

      // Render if most sample points are black (at least 3 out of 5)
      return blackCount >= 3;
    }

    function drawOnePlus(
      x: number,
      y: number,
      size: number,
      lineCount: number
    ) {
      p.rectMode(p.CENTER);

      // Draw vertical rectangle with vertical lines
      const vertRectWidth = size / 3;
      const vertRectHeight = size;
      const vertRectLeft = x - vertRectWidth / 2;
      const vertRectTop = y - vertRectHeight / 2;
      const vertRectBottom = y + vertRectHeight / 2;

      // Fill vertical rectangle with vertical lines
      const vertLineSpacing = vertRectWidth / (lineCount - 1);
      for (let i = 0; i < lineCount; i++) {
        const lineX = vertRectLeft + i * vertLineSpacing;
        p.line(lineX, vertRectTop, lineX, vertRectBottom);
      }

      // Draw horizontal rectangle with horizontal lines
      const horzRectWidth = size;
      const horzRectHeight = size / 3;
      const horzRectLeft = x - horzRectWidth / 2;
      const horzRectRight = x + horzRectWidth / 2;
      const horzRectTop = y - horzRectHeight / 2;

      // Fill horizontal rectangle with horizontal lines
      const horzLineSpacing = horzRectHeight / (lineCount - 1);
      for (let i = 0; i < lineCount; i++) {
        const lineY = horzRectTop + i * horzLineSpacing;
        p.line(horzRectLeft, lineY, horzRectRight, lineY);
      }
    }
  };

export default plusPlusSketch;
