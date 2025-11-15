import { p5SVG } from "p5.js-svg";
import { all, DotPen } from "@/pens";
import { Meta } from "../types";
import { setStroke } from "@/utils/setStroke";
import { findColor } from "@/utils/findColor";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { calculateDrawArea } from "@/utils/drawingArea";

export const meta: Meta = {
  id: "distortion-02",
  title: "Distortion 02",
  description: "Distorted lines",
  thumbnail: "/distortion-02.png",
};

type Constants = BaseConstants & {
  lines: number;
  dotsMin: number;
  dotsMax: number;
};

export const constants: Constants = {
  width: 700,
  height: 850,
  marginX: 120,
  marginY: 120,
  debug: false,
  lines: 280,
  dotsMin: 100,
  dotsMax: 200,
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
        useSVG: vars.useSVG ?? false,
        zoomLevel: (vars as any).zoomLevel,
      });

      const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);
      const cellH = drawH / lines;

      for (let row = 0; row < lines; row++) {
        const bx = marginX + 1;
        const by = marginY + row * cellH + 1;

        // how "wavy" each line is
        const maxYOffset = 0.1 * row + 1;
        // how many zig-zags per row
        const segmentCount = p.floor(p.random(100, 200));

        // segment length spans full draw width
        const segmentLen = drawW / segmentCount;

        drawZigzag(bx, by, segmentLen, segmentCount, maxYOffset);
      }
      drawDots([255, 255, 255, 255]); // white
      drawDots(findColor("staedtlerPens.yellow").color);
    };

    function drawDots(color: [number, number, number, number]) {
      // Add white dots
      const dotCount = p.random(
        vars.dotsMin ?? constants.dotsMin,
        vars.dotsMax ?? constants.dotsMax
      );
      p.strokeWeight(6);
      p.stroke(...color); // white
      for (let i = 0; i < dotCount; i++) {
        const x = p.random(marginX, p.width - marginX);
        const y = p.random(marginY, p.height - marginY);
        p.point(x, y);
      }
    }

    /**
     * @param startX     absolute x
     * @param startY     absolute y
     * @param segmentLen horizontal spacing between vertices
     * @param segments   number of segments
     * @param maxYOffset max random vertical perturbation
     */
    function drawZigzag(
      startX: number,
      startY: number,
      segmentLen: number,
      segments: number,
      maxYOffset: number
    ) {
      p.push();
      const xNoise = p.random(-3, 3);
      p.translate(startX + xNoise, startY);
      setStroke(p.random(colors), p);

      p.beginShape();
      for (let i = 0; i <= segments; i++) {
        const x = i * segmentLen;
        const y = p.random(-maxYOffset, maxYOffset);
        p.vertex(x, y);

        // ~10% chance to split the line here
        if (p.random() < 0.1 && i < segments - 1) {
          p.endShape();
          p.beginShape();
          p.vertex(x, y); // continue from the same point
        }
      }
      p.endShape();
      p.pop();
    }
  };

export default distortionSketch;
