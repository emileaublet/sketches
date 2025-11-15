import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { drawNoiseRect } from "@/utils/noiseUtils";
import { BaseConstants } from "../utils/constants";
import { calculateDrawArea } from "@/utils/drawingArea";
import { splitSpace } from "@/utils/cartesianUtils";
import { all, DotPen } from "@/pens";
import { setColor } from "@/utils/setColor";

export const meta: Meta = {
  id: "noise-01",
  title: "Noise 01",
  description: "A grid of noise",
  thumbnail: "/noise-01.png",
};

type Constants = BaseConstants & {
  noiseDensity: number;
  pointSize: number;
};

export const constants: Constants = {
  width: 700,
  height: 850,
  marginX: 120,
  marginY: 120,
  debug: false,
  noiseDensity: 50,
  pointSize: 1,
};

const NoiseSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    // overall canvas padding
    const marginX = vars.marginX ?? constants.marginX;
    const marginY = vars.marginY ?? constants.marginY;

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

      //p.background(255);

      // Get noise parameters
      const noiseDensity = vars.noiseDensity ?? constants.noiseDensity;
      const pointSize = vars.pointSize ?? constants.pointSize;

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

      const colors: DotPen[] = [
        "staedtlerPensNew.teal",
        "staedtlerPensNew.limeGreen",
        "staedtlerPensNew.yellow",
        "staedtlerPensNew.orange",
        "staedtlerPensNew.red",
        "staedtlerPensNew.crimson",
        "staedtlerPensNew.darkPurple",
        "staedtlerPensNew.blue",
        "staedtlerPensNew.slate",
      ];

      function getRandomColor() {
        const colorName = colors[p.floor(p.random(colors.length))];
        return setColor(colorName, p);
      }

      for (const [_i, rect] of rectsH.entries()) {
        const shouldDraw = p.random() < 0.5;
        if (vars.debug ?? constants.debug) {
          p.stroke("red");
          p.text("Horizontal", rect.x + 6, rect.y + 18);
          p.noFill();
          p.rect(rect.x, rect.y, rect.w, rect.h);
        }
        if (!shouldDraw) continue;
        // Draw noise within the rectangle
        drawNoiseRect(p, {
          x1: rect.x,
          y1: rect.y,
          x2: rect.x + rect.w,
          y2: rect.y + rect.h,
          density: p.random(0, noiseDensity * 2),
          pointSize: pointSize,
          color: getRandomColor(),
        });
      }
      for (const [_i, rect] of rectsV.entries()) {
        const shouldDraw = p.random() < 0.5;
        if (vars.debug ?? constants.debug) {
          p.stroke("blue");
          // rotate text for vertical rectangles
          p.push();
          p.translate(rect.x + 6, rect.y + 6);
          p.rotate(p.HALF_PI);
          p.text("Vertical", 0, 0);
          p.pop();

          p.noFill();
          p.rect(rect.x, rect.y, rect.w, rect.h);
        }
        if (!shouldDraw) continue;
        // Draw noise within the rectangle
        drawNoiseRect(p, {
          x1: rect.x,
          y1: rect.y,
          x2: rect.x + rect.w,
          y2: rect.y + rect.h,
          density: p.random(0, noiseDensity * 2),
          pointSize: pointSize,
          color: getRandomColor(),
        });
      }

      // Use the utility function to draw noise
      /*  drawNoiseRect(p, {
        x1: marginX,
        y1: marginY,
        x2: marginX + drawW,
        y2: marginY + drawH,
        density: noiseDensity,
        pointSize: pointSize,
        color: 0, // Black
      }); */
    };
  };

export default NoiseSketch;
