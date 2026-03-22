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
  lineSpacing: number;
  jitter: number;
  jitterSegmentLength: number;
  colorPasses: number;
  lineThickness: number;
  circularity: number;
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
  bandWidthMin: 5,
  bandWidthMax: 5,
  gapMin: 0,
  gapMax: 0,
  lineSpacing: 1.75,
  jitter: 0,
  jitterSegmentLength: 0.14,
  colorPasses: 3,
  lineThickness: 0.4,
  circularity: 1,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  bandWidthMin: { min: 5, max: 150, step: 5 },
  bandWidthMax: { min: 10, max: 200, step: 5 },
  gapMin: { min: 0, max: 40, step: 1 },
  gapMax: { min: 0, max: 80, step: 1 },
  lineSpacing: { min: 0.5, max: 10, step: 0.25 },
  jitter: { min: 0, max: 15, step: 0.5 },
  jitterSegmentLength: { min: 0.01, max: 0.5, step: 0.01 },
  colorPasses: { min: 1, max: 4, step: 1 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  circularity: { min: 0, max: 1, step: 0.05 },
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
      const startX = marginX;
      const startY = marginY;

      const bandWidthMin = vars.bandWidthMin ?? constants.bandWidthMin;
      const bandWidthMax = vars.bandWidthMax ?? constants.bandWidthMax;
      const gapMin = vars.gapMin ?? constants.gapMin;
      const gapMax = vars.gapMax ?? constants.gapMax;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const jitter = vars.jitter ?? constants.jitter;
      const jitterSegmentLength =
        vars.jitterSegmentLength ?? constants.jitterSegmentLength;
      const colorPasses = Math.round(vars.colorPasses ?? constants.colorPasses);
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const circularity = vars.circularity ?? constants.circularity;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      const cxCanvas = startX + drawW / 2;
      const cyCanvas = startY + drawH / 2;

      function drawJitteryLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
      ) {
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        if (len < 0.5) return;

        if (jitter <= 0) {
          p.line(x1, y1, x2, y2);
          return;
        }

        // jitter is absolute pixel displacement (no len scaling)
        const scaledJitter = jitter;
        const dx = (x2 - x1) / len;
        const dy = (y2 - y1) / len;
        const perpX = -dy;
        const perpY = dx;

        // jitterSegmentLength is a fraction of path length
        const avgStep = jitterSegmentLength;
        const tValues: number[] = [0];
        let t = 0;
        while (t < 1) {
          t += avgStep * p.random(0.5, 1.5);
          tValues.push(t >= 1 ? 1 : t + p.random(-0.02, 0.02));
        }

        p.beginShape();
        for (const tv of tValues) {
          const tc = Math.max(0, Math.min(1, tv));
          const x = p.lerp(x1, x2, tc);
          const y = p.lerp(y1, y2, tc);
          const edge = 0.3 + 0.7 * Math.sin(tc * Math.PI);
          const j = scaledJitter * edge * p.random(0.6, 1.4);
          const d = p.random(-j, j);
          p.vertex(x + perpX * d, y + perpY * d);
        }
        p.endShape();
      }

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

      // Helper: blend between rectangular and elliptical bounds
      function blendX(
        rectX: number,
        rxEllip: number,
        ryEllip: number,
        yRel: number,
        sign: 1 | -1,
      ): number {
        if (ryEllip <= 0) return rectX;
        const frac = Math.max(0, 1 - (yRel / ryEllip) ** 2);
        const ellipX = cxCanvas + sign * rxEllip * Math.sqrt(frac);
        return p.lerp(rectX, ellipX, circularity);
      }

      function blendY(
        rectY: number,
        rxEllip: number,
        ryEllip: number,
        xRel: number,
        sign: 1 | -1,
      ): number {
        if (rxEllip <= 0) return rectY;
        const frac = Math.max(0, 1 - (xRel / rxEllip) ** 2);
        const ellipY = cyCanvas + sign * ryEllip * Math.sqrt(frac);
        return p.lerp(rectY, ellipY, circularity);
      }

      // Render bands
      for (let i = 0; i < bands.length; i++) {
        const band = bands[i];
        const isHorizontal = i % 2 === 0;

        // Rectangular bounds
        const ox = startX + band.leftOuter;
        const oy = startY + band.topOuter;
        const ox2 = startX + drawW - band.rightOuter;
        const oy2 = startY + drawH - band.botOuter;
        const ix = startX + band.leftInner;
        const iy = startY + band.topInner;
        const ix2 = startX + drawW - band.rightInner;
        const iy2 = startY + drawH - band.botInner;

        // Ellipse semi-axes (averaged for symmetry)
        const rxOuter = drawW / 2 - (band.leftOuter + band.rightOuter) / 2;
        const ryOuter = drawH / 2 - (band.topOuter + band.botOuter) / 2;
        const rxInner = drawW / 2 - (band.leftInner + band.rightInner) / 2;
        const ryInner = drawH / 2 - (band.topInner + band.botInner) / 2;

        // Blended Y sweep range
        const outerYMin = p.lerp(oy, cyCanvas - ryOuter, circularity);
        const outerYMax = p.lerp(oy2, cyCanvas + ryOuter, circularity);
        const outerXMin = p.lerp(ox, cxCanvas - rxOuter, circularity);
        const outerXMax = p.lerp(ox2, cxCanvas + rxOuter, circularity);

        const spacing = p.random(lineSpacing * 0.7, lineSpacing * 1.5);

        for (let pass = 0; pass < colorPasses; pass++) {
          const color = p.random(colors) as DotPen;
          setStroke(color, p);
          p.strokeWeight(lineThickness);

          const passOffset =
            pass === 0 ? 0 : p.random(-spacing * 0.4, spacing * 0.4);

          if (isHorizontal) {
            let y = outerYMin + passOffset;
            while (y <= outerYMax) {
              const yRel = y - cyCanvas;

              // Blended outer x bounds at this y
              const x1 = blendX(ox, rxOuter, ryOuter, yRel, -1);
              const x2 = blendX(ox2, rxOuter, ryOuter, yRel, 1);
              if (x1 >= x2) {
                y += spacing;
                continue;
              }

              // Is y inside inner y range (blended)?
              const innerYMin = p.lerp(iy, cyCanvas - ryInner, circularity);
              const innerYMax = p.lerp(iy2, cyCanvas + ryInner, circularity);
              const inInnerY = y >= innerYMin && y <= innerYMax;

              if (!inInnerY) {
                drawJitteryLine(x1, y, x2, y);
              } else {
                // Blended inner x bounds
                const xi1 = blendX(ix, rxInner, ryInner, yRel, -1);
                const xi2 = blendX(ix2, rxInner, ryInner, yRel, 1);
                if (xi1 > x1) drawJitteryLine(x1, y, xi1, y);
                if (x2 > xi2) drawJitteryLine(xi2, y, x2, y);
              }
              y += spacing;
            }
          } else {
            let x = outerXMin + passOffset;
            while (x <= outerXMax) {
              const xRel = x - cxCanvas;

              // Blended outer y bounds at this x
              const y1 = blendY(oy, rxOuter, ryOuter, xRel, -1);
              const y2 = blendY(oy2, rxOuter, ryOuter, xRel, 1);
              if (y1 >= y2) {
                x += spacing;
                continue;
              }

              // Is x inside inner x range (blended)?
              const innerXMin = p.lerp(ix, cxCanvas - rxInner, circularity);
              const innerXMax = p.lerp(ix2, cxCanvas + rxInner, circularity);
              const inInnerX = x >= innerXMin && x <= innerXMax;

              if (!inInnerX) {
                drawJitteryLine(x, y1, x, y2);
              } else {
                // Blended inner y bounds
                const yi1 = blendY(iy, rxInner, ryInner, xRel, -1);
                const yi2 = blendY(iy2, rxInner, ryInner, xRel, 1);
                if (yi1 > y1) drawJitteryLine(x, y1, x, yi1);
                if (y2 > yi2) drawJitteryLine(x, yi2, x, y2);
              }
              x += spacing;
            }
          }
        }
      }
    };
  };

export default ripple01Sketch;
