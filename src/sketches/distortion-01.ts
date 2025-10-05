import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { all, DotPen } from "@/pens";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { calculateDrawArea } from "@/utils/drawingArea";
import { drawZigzagLine } from "@/utils/linePatterns";

export const meta: Meta = {
  id: "distortion-01",
  title: "Distortion 01",
  description: "Distorted lines",
  thumbnail: "/distortion-01.png",
};

type Constants = BaseConstants & {
  lines: number;
};

export const constants: Constants = {
  width: 600,
  height: 600,
  marginX: 120,
  marginY: 120,
  lines: 280,
  debug: false,
};

const distortionSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const marginX = vars.marginX ?? constants.marginX;
    const marginY = vars.marginY ?? constants.marginY;
    const lines = vars.lines ?? constants.lines;
    const colors: DotPen[] = all("staedtlerPens");

    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        debug: vars.debug ?? constants.debug,
        marginX,
        marginY,
      });

      const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);
      const cellH = drawH / lines;

      for (let row = 0; row < lines; row++) {
        const bx = marginX + 1;
        const by = marginY + row * cellH + 1;

        // how "wavy" each line is
        const maxYOffset = 0.2 * row + 1;
        // how many zig-zags per row
        const segmentCount = p.floor(p.random(100, 200));

        // pick a color and set once
        const col = p.random(colors);

        // segment length spans full draw width
        const segmentLen = drawW / segmentCount;

        drawZigzagLine(p, {
          startX: bx,
          startY: by,
          segmentLen,
          segments: segmentCount,
          maxYOffset,
          color: col,
        });
      }
    };
  };

export default distortionSketch;
