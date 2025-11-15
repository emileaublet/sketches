import { p5SVG } from "p5.js-svg";
import { all, DotPen } from "@/pens";

import { Meta } from "../types";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { calculateDrawArea } from "@/utils/drawingArea";
import {
  drawHorizontalWavyLine,
  drawVerticalWavyLine,
  splitSpace,
} from "@/utils/cartesianUtils";

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
        useSVG: vars.useSVG ?? false,
        zoomLevel: (vars as any).zoomLevel,
      });

      const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);
      const cellSize = 2;

      // Split the canvas into random rectangles
      const rectCount = p.floor(p.random(4, 8));
      const rectsH = splitSpace(
        p,
        marginX,
        marginY,
        drawW,
        drawH,
        rectCount,
        cellSize
      );

      const rectsV = splitSpace(
        p,
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

          drawHorizontalWavyLine(
            p,
            bx,
            by,
            segmentLen,
            segmentCount,
            maxYOffset
          );
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

          drawVerticalWavyLine(p, bx, by, segmentLen, segmentCount, maxXOffset);
        }
      }
    };
  };

export default cartesianSketch;
