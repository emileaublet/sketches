import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  bandWidthMin: number;
  bandWidthMax: number;
  gapMin: number;
  gapMax: number;
  chevronDensity: number;
  chevronFill: number;
  colorPasses: number;
  lineThickness: number;
  direction: string;
  colors: DotPen[];
};

export const meta: Meta = {
  id: "ripple-02",
  title: "Ripple 02",
  description: "Concentric rings of chevron marks, clockwise or counter-clockwise",
  thumbnail: "/ripple-02.png",
};

export const constants: Constants = {
  width: 500,
  height: 500,
  marginX: 40,
  marginY: 40,
  debug: false,
  bandWidthMin: 8,
  bandWidthMax: 24,
  gapMin: 0,
  gapMax: 4,
  chevronDensity: 1.0,
  chevronFill: 0.75,
  colorPasses: 3,
  lineThickness: 0.4,
  direction: "clockwise",
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  bandWidthMin: { min: 3, max: 60, step: 1 },
  bandWidthMax: { min: 5, max: 100, step: 1 },
  gapMin: { min: 0, max: 20, step: 1 },
  gapMax: { min: 0, max: 40, step: 1 },
  chevronDensity: { min: 0.2, max: 3, step: 0.1 },
  chevronFill: { min: 0.1, max: 1.0, step: 0.05 },
  colorPasses: { min: 1, max: 4, step: 1 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  direction: { value: "clockwise", options: ["clockwise", "counter-clockwise"] },
  colors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const ripple02Sketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      if (seed !== null) p.noiseSeed(seed);

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      const bandWidthMin = vars.bandWidthMin ?? constants.bandWidthMin;
      const bandWidthMax = vars.bandWidthMax ?? constants.bandWidthMax;
      const gapMin = vars.gapMin ?? constants.gapMin;
      const gapMax = vars.gapMax ?? constants.gapMax;
      const chevronDensity = vars.chevronDensity ?? constants.chevronDensity;
      const chevronFill = vars.chevronFill ?? constants.chevronFill;
      const colorPasses = Math.round(vars.colorPasses ?? constants.colorPasses);
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const directionStr = (vars.direction ?? constants.direction) as string;
      const dir = directionStr === "clockwise" ? 1 : -1;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      // Rings contained within the inscribed circle
      const maxRadius = Math.min(drawW, drawH) / 2;

      p.strokeWeight(lineThickness);
      p.strokeCap(p.ROUND);

      // Clip to circle so arm tips don't bleed outside
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      ctx.clip();

      // Build concentric circular rings with a single radius cursor
      let r = 0;
      while (r < maxRadius) {
        const bandW = p.random(bandWidthMin, bandWidthMax);
        const rInner = r;
        const rOuter = Math.min(r + bandW, maxRadius);
        const rMid = (rInner + rOuter) / 2;
        const actualBandW = rOuter - rInner;

        if (rMid > 0) {
          const circumference = 2 * Math.PI * rMid;

          // armSize = armSpread = armLen → enforces exactly 90° at the tip
          const armSize = (actualBandW / 2) * chevronFill;

          // count: density=1 means chevrons just touching (spacing = armSize*2)
          const count = Math.max(3, Math.round((circumference / (armSize * 2)) * chevronDensity));

          for (let pass = 0; pass < colorPasses; pass++) {
            const color = p.random(colors) as DotPen;
            setStroke(color, p);

            // Each pass gets a fully random start angle — they overlap
            // imperfectly because count varies per ring width
            const startAngle = p.random(Math.PI * 2);

            for (let j = 0; j < count; j++) {
              const angle = startAngle + (j / count) * 2 * Math.PI;

              const px = cx + Math.cos(angle) * rMid;
              const py = cy + Math.sin(angle) * rMid;

              // Tangent (CW or CCW)
              const tx = Math.sin(angle) * dir;
              const ty = -Math.cos(angle) * dir;

              // Radial outward
              const rx = Math.cos(angle);
              const ry = Math.sin(angle);

              // Tip: behind the chevron (against direction of travel)
              const tipX = px - tx * armSize * 0.5;
              const tipY = py - ty * armSize * 0.5;

              // Two arm endpoints: forward along tangent, spread radially
              // armSpread = armLen = armSize → 90° angle at tip
              const arm1X = px + tx * armSize * 0.5 + rx * armSize;
              const arm1Y = py + ty * armSize * 0.5 + ry * armSize;
              const arm2X = px + tx * armSize * 0.5 - rx * armSize;
              const arm2Y = py + ty * armSize * 0.5 - ry * armSize;

              p.line(tipX, tipY, arm1X, arm1Y);
              p.line(tipX, tipY, arm2X, arm2Y);
            }
          }
        }

        r = rOuter + p.random(gapMin, gapMax);
      }

      ctx.restore();
    };
  };

export default ripple02Sketch;
