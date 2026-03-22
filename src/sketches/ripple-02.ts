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
  chevronSpacing: number;
  chevronSize: number;
  colorPasses: number;
  lineThickness: number;
  circularity: number;
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
  bandWidthMin: 10,
  bandWidthMax: 25,
  gapMin: 0,
  gapMax: 5,
  chevronSpacing: 8,
  chevronSize: 7,
  colorPasses: 3,
  lineThickness: 0.4,
  circularity: 1,
  direction: "clockwise",
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  bandWidthMin: { min: 5, max: 60, step: 5 },
  bandWidthMax: { min: 10, max: 100, step: 5 },
  gapMin: { min: 0, max: 20, step: 1 },
  gapMax: { min: 0, max: 40, step: 1 },
  chevronSpacing: { min: 3, max: 30, step: 1 },
  chevronSize: { min: 2, max: 20, step: 1 },
  colorPasses: { min: 1, max: 4, step: 1 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  circularity: { min: 0, max: 1, step: 0.05 },
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
      const startX = marginX;
      const startY = marginY;

      const bandWidthMin = vars.bandWidthMin ?? constants.bandWidthMin;
      const bandWidthMax = vars.bandWidthMax ?? constants.bandWidthMax;
      const gapMin = vars.gapMin ?? constants.gapMin;
      const gapMax = vars.gapMax ?? constants.gapMax;
      const chevronSpacing = vars.chevronSpacing ?? constants.chevronSpacing;
      const chevronSize = vars.chevronSize ?? constants.chevronSize;
      const colorPasses = Math.round(vars.colorPasses ?? constants.colorPasses);
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const directionStr = (vars.direction ?? constants.direction) as string;
      const dir = directionStr === "clockwise" ? 1 : -1;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      const cxCanvas = startX + drawW / 2;
      const cyCanvas = startY + drawH / 2;

      // Build asymmetric bands: each side advances independently
      const maxInset = Math.min(drawW, drawH) / 2;

      interface BandEdge {
        leftOuter: number;
        leftInner: number;
        rightOuter: number;
        rightInner: number;
        topOuter: number;
        topInner: number;
        botOuter: number;
        botInner: number;
      }

      const bands: BandEdge[] = [];
      let leftCursor = 0,
        rightCursor = 0,
        topCursor = 0,
        botCursor = 0;

      while (
        Math.min(leftCursor, rightCursor, topCursor, botCursor) < maxInset
      ) {
        const leftInner = Math.min(
          leftCursor + p.random(bandWidthMin, bandWidthMax),
          maxInset,
        );
        const rightInner = Math.min(
          rightCursor + p.random(bandWidthMin, bandWidthMax),
          maxInset,
        );
        const topInner = Math.min(
          topCursor + p.random(bandWidthMin, bandWidthMax),
          maxInset,
        );
        const botInner = Math.min(
          botCursor + p.random(bandWidthMin, bandWidthMax),
          maxInset,
        );

        bands.push({
          leftOuter: leftCursor,
          leftInner,
          rightOuter: rightCursor,
          rightInner,
          topOuter: topCursor,
          topInner,
          botOuter: botCursor,
          botInner,
        });

        leftCursor = leftInner + p.random(gapMin, gapMax);
        rightCursor = rightInner + p.random(gapMin, gapMax);
        topCursor = topInner + p.random(gapMin, gapMax);
        botCursor = botInner + p.random(gapMin, gapMax);
      }

      // Render bands
      for (let i = 0; i < bands.length; i++) {
        const band = bands[i];

        // Use left-side average as the representative ring radius (midline)
        const rMid = (band.leftOuter + band.leftInner) / 2;

        // Skip degenerate bands
        if (rMid <= 0) continue;

        const circumference = 2 * Math.PI * rMid;
        const count = Math.max(3, Math.round(circumference / chevronSpacing));

        const armLen = chevronSize * 0.7;
        const armSpread = chevronSize * 0.4;

        p.strokeWeight(lineThickness);
        p.strokeCap(p.ROUND);

        for (let pass = 0; pass < colorPasses; pass++) {
          const color = p.random(colors) as DotPen;
          setStroke(color, p);

          // Offset the starting angle per pass so passes don't perfectly overlap
          const startAngle = (pass / colorPasses) * ((2 * Math.PI) / count);

          for (let j = 0; j < count; j++) {
            const angle = startAngle + (j / count) * 2 * Math.PI;

            // Position on the ring midline
            const px = cxCanvas + Math.cos(angle) * rMid;
            const py = cyCanvas + Math.sin(angle) * rMid;

            // Tangent direction (clockwise or counter-clockwise)
            // CW tangent (rotate radial 90deg CW): (sin(a), -cos(a))
            // CCW tangent (rotate radial 90deg CCW): (-sin(a), cos(a))
            const tx = Math.sin(angle) * dir;
            const ty = -Math.cos(angle) * dir;

            // Radial outward direction
            const rx = Math.cos(angle);
            const ry = Math.sin(angle);

            // Tip is behind the midpoint (against tangent direction)
            const tipX = px - tx * armLen * 0.5;
            const tipY = py - ty * armLen * 0.5;

            // Two arm endpoints: forward along tangent, spread radially
            const arm1X = px + tx * armLen * 0.5 + rx * armSpread;
            const arm1Y = py + ty * armLen * 0.5 + ry * armSpread;
            const arm2X = px + tx * armLen * 0.5 - rx * armSpread;
            const arm2Y = py + ty * armLen * 0.5 - ry * armSpread;

            p.line(tipX, tipY, arm1X, arm1Y);
            p.line(tipX, tipY, arm2X, arm2Y);
          }
        }
      }
    };
  };

export default ripple02Sketch;
