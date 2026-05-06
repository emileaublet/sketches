import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  bandThicknessMin: number;
  bandThicknessMax: number;
  gapMin: number;
  gapMax: number;
  lineSpacingMin: number;
  lineSpacingMax: number;
  colorPassesMin: number;
  colorPassesMax: number;
  lineThickness: number;
  colors: DotPen[];
};

export const meta: Meta = {
  id: "ripple-01",
  title: "Ripple 01",
  description: "Concentric bands with alternating hatching",
  thumbnail: "/ripple-01.png",
};

export const constants: Constants = {
  width: 500,
  height: 500,
  marginX: 40,
  marginY: 40,
  debug: false,
  bandThicknessMin: 4,
  bandThicknessMax: 8,
  gapMin: 0,
  gapMax: 0,
  lineSpacingMin: 1.25,
  lineSpacingMax: 2.5,
  colorPassesMin: 2,
  colorPassesMax: 5,
  lineThickness: 0.2,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  bandThicknessMin: { min: 1, max: 100, step: 1 },
  bandThicknessMax: { min: 1, max: 100, step: 1 },
  gapMin: { min: 0, max: 40, step: 1 },
  gapMax: { min: 0, max: 80, step: 1 },
  lineSpacingMin: { min: 0.5, max: 10, step: 0.25 },
  lineSpacingMax: { min: 0.5, max: 10, step: 0.25 },
  colorPassesMin: { min: 1, max: 8, step: 1 },
  colorPassesMax: { min: 1, max: 8, step: 1 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  colors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const ripple01Sketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        strokeWeight: vars.lineThickness ?? constants.lineThickness,
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

      const bandThicknessMin = vars.bandThicknessMin ?? constants.bandThicknessMin;
      const bandThicknessMax = vars.bandThicknessMax ?? constants.bandThicknessMax;
      const gapMin = vars.gapMin ?? constants.gapMin;
      const gapMax = vars.gapMax ?? constants.gapMax;
      const lineSpacingMin = vars.lineSpacingMin ?? constants.lineSpacingMin;
      const lineSpacingMax = vars.lineSpacingMax ?? constants.lineSpacingMax;
      const colorPassesMin = Math.round(vars.colorPassesMin ?? constants.colorPassesMin);
      const colorPassesMax = Math.round(vars.colorPassesMax ?? constants.colorPassesMax);
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      const cxCanvas = marginX + drawW / 2;
      const cyCanvas = marginY + drawH / 2;

      // Build concentric circular bands using a single radius cursor
      const maxRadius = Math.min(drawW, drawH) / 2;

      interface Band {
        rOuter: number;
        rInner: number;
      }

      const bands: Band[] = [];
      let cursor = 0;

      while (cursor < maxRadius) {
        const rOuter = cursor;
        const rInner = Math.min(
          cursor + p.random(bandThicknessMin, bandThicknessMax),
          maxRadius,
        );
        bands.push({ rOuter, rInner });
        cursor = rInner + p.random(gapMin, gapMax);
      }

      // Helper: elliptical bounds
      function ellipX(
        rxEllip: number,
        ryEllip: number,
        yRel: number,
        sign: 1 | -1,
      ): number {
        if (ryEllip <= 0) return cxCanvas;
        const frac = Math.max(0, 1 - (yRel / ryEllip) ** 2);
        return cxCanvas + sign * rxEllip * Math.sqrt(frac);
      }

      function ellipY(
        rxEllip: number,
        ryEllip: number,
        xRel: number,
        sign: 1 | -1,
      ): number {
        if (rxEllip <= 0) return cyCanvas;
        const frac = Math.max(0, 1 - (xRel / rxEllip) ** 2);
        return cyCanvas + sign * ryEllip * Math.sqrt(frac);
      }

      // Render bands
      for (let i = 0; i < bands.length; i++) {
        const band = bands[i];
        const isHorizontal = i % 2 === 0;

        // Circular bands: radius is inset from center
        const rxOuter = maxRadius - band.rOuter;
        const ryOuter = rxOuter;
        const rxInner = maxRadius - band.rInner;
        const ryInner = rxInner;

        const outerYMin = cyCanvas - ryOuter;
        const outerYMax = cyCanvas + ryOuter;
        const outerXMin = cxCanvas - rxOuter;
        const outerXMax = cxCanvas + rxOuter;

        const colorPasses = Math.round(p.random(colorPassesMin, colorPassesMax + 1));
        const shuffled = p.shuffle([...colors]) as DotPen[];

        for (let pass = 0; pass < colorPasses; pass++) {
          setStroke(shuffled[pass % shuffled.length], p);
          p.strokeWeight(lineThickness);

          const spacing = p.random(lineSpacingMin, lineSpacingMax);
          const passOffset =
            pass === 0 ? 0 : p.random(-spacing * 0.4, spacing * 0.4);

          if (isHorizontal) {
            let y = outerYMin + passOffset;
            while (y <= outerYMax) {
              const yRel = y - cyCanvas;

              const x1 = ellipX(rxOuter, ryOuter, yRel, -1);
              const x2 = ellipX(rxOuter, ryOuter, yRel, 1);
              if (x1 >= x2) {
                y += spacing;
                continue;
              }

              const innerYMin = cyCanvas - ryInner;
              const innerYMax = cyCanvas + ryInner;
              const inInnerY = y >= innerYMin && y <= innerYMax;

              if (!inInnerY) {
                p.line(x1, y, x2, y);
              } else {
                const xi1 = ellipX(rxInner, ryInner, yRel, -1);
                const xi2 = ellipX(rxInner, ryInner, yRel, 1);
                if (xi1 > x1) p.line(x1, y, xi1, y);
                if (x2 > xi2) p.line(xi2, y, x2, y);
              }
              y += spacing;
            }
          } else {
            let x = outerXMin + passOffset;
            while (x <= outerXMax) {
              const xRel = x - cxCanvas;

              const y1 = ellipY(rxOuter, ryOuter, xRel, -1);
              const y2 = ellipY(rxOuter, ryOuter, xRel, 1);
              if (y1 >= y2) {
                x += spacing;
                continue;
              }

              const innerXMin = cxCanvas - rxInner;
              const innerXMax = cxCanvas + rxInner;
              const inInnerX = x >= innerXMin && x <= innerXMax;

              if (!inInnerX) {
                p.line(x, y1, x, y2);
              } else {
                const yi1 = ellipY(rxInner, ryInner, xRel, -1);
                const yi2 = ellipY(rxInner, ryInner, xRel, 1);
                if (yi1 > y1) p.line(x, y1, x, yi1);
                if (y2 > yi2) p.line(x, yi2, x, y2);
              }
              x += spacing;
            }
          }
        }
      }
    };
  };

export default ripple01Sketch;
