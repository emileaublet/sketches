import { p5SVG } from "p5.js-svg";
import { all, DotPen } from "@/pens";

import { Meta } from "../types";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { calculateDrawArea } from "@/utils/drawingArea";

type Constants = BaseConstants;

export const meta: Meta = {
  id: "cartesian-01",
  title: "Cartesian 01",
  description: "Cartesian grid",
  thumbnail: "/cartesian-01.png",
};

export const constants: Constants = {
  width: 700,
  height: 850,
  marginX: 120,
  marginY: 120,
  debug: false,
};

const cartesianSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const marginX = vars.marginX ?? constants.marginX;
    const marginY = vars.marginY ?? constants.marginY;
    const colors: DotPen[] = all("staedtlerPens");

    if (seed !== null) p.randomSeed(seed);
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        strokeWeight: 1,
        noFill: true,
        debug: vars.debug ?? constants.debug,
        marginX,
        marginY,
      });

      const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);
      const cellSize = 2;

      // Split the canvas into random rectangles
      const rectCount = p.floor(p.random(4, 8));
      const rectsH = splitSpace(
        marginX,
        marginY,
        drawW,
        drawH,
        rectCount,
        cellSize
      );

      const rectsV = splitSpace(
        marginX,
        marginY,
        drawW,
        drawH,
        rectCount,
        cellSize
      );

      for (const [i, rect] of rectsH.entries()) {
        const lines = p.floor(rect.h / cellSize);
        const color = colors[i % colors.length];

        if (vars.debug ?? constants.debug) {
          p.stroke("red");
          p.noFill();
          p.rect(rect.x, rect.y, rect.w, rect.h);
        }
        for (let row = 0; row < lines; row++) {
          const bx = rect.x;
          const by = rect.y + row * cellSize;

          const maxYOffset = 0.2;
          const segmentCount = p.floor(p.random(100, 200));

          setStroke(color, p);

          // segment length spans full draw width
          const segmentLen = rect.w / segmentCount;

          drawHorizontal(bx, by, segmentLen, segmentCount, maxYOffset);
        }
      }

      for (const rect of rectsV) {
        const lines = p.floor(rect.w / cellSize);

        if (vars.debug ?? constants.debug) {
          p.stroke("red");
          p.noFill();
          p.rect(rect.x, rect.y, rect.w, rect.h);
        }
        const color = p.random(colors);
        for (let col = 0; col < lines; col++) {
          const bx = rect.x + col * cellSize;
          const by = rect.y;

          const maxXOffset = 0.2;
          const segmentCount = p.floor(p.random(100, 200));

          setStroke(color, p);

          // segment length spans full draw height
          const segmentLen = rect.h / segmentCount;

          drawVertical(bx, by, segmentLen, segmentCount, maxXOffset);
        }
      }
    };

    function drawHorizontal(
      startX: number,
      startY: number,
      segmentLen: number,
      segments: number,
      maxYOffset: number
    ) {
      p.push();
      p.translate(startX, startY);
      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const x = i * segmentLen;
        const y = p.random(-maxYOffset, maxYOffset);
        p.vertex(x, y);
      }
      p.endShape();
      p.pop();
    }

    function drawVertical(
      startX: number,
      startY: number,
      segmentLen: number,
      segments: number,
      maxXOffset: number
    ) {
      p.push();
      p.translate(startX, startY);
      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const x = p.random(-maxXOffset, maxXOffset);
        const y = i * segmentLen;
        p.vertex(x, y);
      }
      p.endShape();
      p.pop();
    }

    function splitSpace(
      x: number,
      y: number,
      w: number,
      h: number,
      count: number,
      cellSize: number
    ): { x: number; y: number; w: number; h: number }[] {
      // Enforce snapping to cellSize
      x = snapToGrid(x, cellSize);
      y = snapToGrid(y, cellSize);
      w = snapToGrid(w, cellSize);
      h = snapToGrid(h, cellSize);

      if (count <= 1) {
        return [{ x, y, w, h }];
      }

      let splitVertically = p.random() < 0.5;

      // Force split direction to avoid skinny slices
      if (w > h * 1.5) splitVertically = true;
      if (h > w * 1.5) splitVertically = false;

      if (splitVertically && w >= 2 * cellSize) {
        const split = snapToGrid(randomBetween(w * 0.3, w * 0.7), cellSize);
        const countA = Math.floor(randomBetween(1, count));
        const countB = count - countA;

        return [
          ...splitSpace(x, y, split, h, countA, cellSize),
          ...splitSpace(x + split, y, w - split, h, countB, cellSize),
        ];
      } else if (!splitVertically && h >= 2 * cellSize) {
        const split = snapToGrid(randomBetween(h * 0.3, h * 0.7), cellSize);
        const countA = Math.floor(randomBetween(1, count));
        const countB = count - countA;

        return [
          ...splitSpace(x, y, w, split, countA, cellSize),
          ...splitSpace(x, y + split, w, h - split, countB, cellSize),
        ];
      }

      // If unable to split further (e.g., too small), return as is
      return [{ x, y, w, h }];
    }
    function randomBetween(min: number, max: number): number {
      return p.random() * (max - min) + min;
    }
    function snapToGrid(value: number, cellSize: number): number {
      return p.round(value / cellSize) * cellSize;
    }
  };

export default cartesianSketch;
