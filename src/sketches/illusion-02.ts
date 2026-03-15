import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

// Hering Illusion
// Two perfectly straight parallel lines appear to bow outward
// when drawn over a fan of radiating lines from the center.

type Constants = BaseConstants & {
  numRays: number;
  lineOffset: number;
  rayThickness: number;
  lineThickness: number;
  colors: DotPen[];
};

export const meta: Meta = {
  id: "illusion-02",
  title: "Illusion 02",
  description: "Hering illusion: straight lines that appear curved",
  thumbnail: "/illusion-02.png",
};

export const constants: Constants = {
  width: 560,
  height: 560,
  marginX: 30,
  marginY: 30,
  debug: false,
  numRays: 64,
  lineOffset: 80,
  rayThickness: 0.4,
  lineThickness: 1.2,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  numRays: { min: 8, max: 120, step: 4 },
  lineOffset: { min: 10, max: 200, step: 5 },
  rayThickness: { min: 0.1, max: 1, step: 0.05 },
  lineThickness: { min: 0.3, max: 2, step: 0.1 },
  colors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const illusion02Sketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        strokeWeight: vars.rayThickness ?? constants.rayThickness,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const numRays = Math.round(vars.numRays ?? constants.numRays);
      const lineOffset = vars.lineOffset ?? constants.lineOffset;
      const rayThickness = vars.rayThickness ?? constants.rayThickness;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;
      // Make rays long enough to extend past canvas corners
      const maxLen = Math.sqrt(drawW * drawW + drawH * drawH) * 0.6;

      // Draw radiating background lines
      const rayColor = colors[0];
      setStroke(rayColor, p);
      p.strokeWeight(rayThickness);

      for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        const x2 = cx + maxLen * Math.cos(angle);
        const y2 = cy + maxLen * Math.sin(angle);
        p.line(cx, cy, x2, y2);
      }

      // Draw two perfectly straight horizontal lines over the rays
      // These lines are 100% straight — but they will appear to bow outward
      const lineColor = colors.length > 1 ? colors[1] : colors[0];
      setStroke(lineColor, p);
      p.strokeWeight(lineThickness);

      const leftX = marginX;
      const rightX = marginX + drawW;

      // Draw each line 3 times with slight offsets to make them thicker and more visible
      for (let pass = -1; pass <= 1; pass++) {
        const offset = pass * (lineThickness * 0.5);
        p.line(leftX, cy - lineOffset + offset, rightX, cy - lineOffset + offset);
        p.line(leftX, cy + lineOffset + offset, rightX, cy + lineOffset + offset);
      }
    };
  };

export default illusion02Sketch;
