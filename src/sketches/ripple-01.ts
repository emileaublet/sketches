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
  colors: DotPen[];
};

export const meta: Meta = {
  id: "ripple-01",
  title: "Ripple 01",
  description: "Concentric rectangular bands with alternating hatching",
  thumbnail: "/ripple-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  bandWidthMin: 10,
  bandWidthMax: 60,
  gapMin: 2,
  gapMax: 18,
  lineSpacing: 2.5,
  jitter: 1,
  jitterSegmentLength: 10,
  colorPasses: 1,
  lineThickness: 0.4,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  bandWidthMin: { min: 5, max: 150, step: 5 },
  bandWidthMax: { min: 10, max: 200, step: 5 },
  gapMin: { min: 0, max: 40, step: 1 },
  gapMax: { min: 0, max: 80, step: 1 },
  lineSpacing: { min: 0.5, max: 10, step: 0.25 },
  jitter: { min: 0, max: 8, step: 0.25 },
  jitterSegmentLength: { min: 1, max: 50, step: 1 },
  colorPasses: { min: 1, max: 4, step: 1 },
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
      const startX = marginX;
      const startY = marginY;

      const bandWidthMin = vars.bandWidthMin ?? constants.bandWidthMin;
      const bandWidthMax = vars.bandWidthMax ?? constants.bandWidthMax;
      const gapMin = vars.gapMin ?? constants.gapMin;
      const gapMax = vars.gapMax ?? constants.gapMax;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const jitter = vars.jitter ?? constants.jitter;
      const jitterSegmentLength = vars.jitterSegmentLength ?? constants.jitterSegmentLength;
      const colorPasses = Math.round(vars.colorPasses ?? constants.colorPasses);
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      function drawJitteryLine(x1: number, y1: number, x2: number, y2: number) {
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        if (len < 0.5) return;

        if (jitter <= 0) {
          p.line(x1, y1, x2, y2);
          return;
        }

        const scaledJitter = jitter * (len / 100);
        const dx = (x2 - x1) / len;
        const dy = (y2 - y1) / len;
        const perpX = -dy;
        const perpY = dx;

        const avgStep = jitterSegmentLength / len;
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

      // Build asymmetric bands: each side has its own cursor advancing independently
      const maxInsetW = drawW / 2;
      const maxInsetH = drawH / 2;
      const maxInset = Math.min(maxInsetW, maxInsetH);

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

      while (Math.min(leftCursor, rightCursor, topCursor, botCursor) < maxInset) {
        const leftInner = Math.min(leftCursor + p.random(bandWidthMin, bandWidthMax), maxInset);
        const rightInner = Math.min(rightCursor + p.random(bandWidthMin, bandWidthMax), maxInset);
        const topInner = Math.min(topCursor + p.random(bandWidthMin, bandWidthMax), maxInset);
        const botInner = Math.min(botCursor + p.random(bandWidthMin, bandWidthMax), maxInset);

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

      // Render bands: even-indexed → horizontal lines, odd-indexed → vertical lines
      for (let i = 0; i < bands.length; i++) {
        const band = bands[i];
        const isHorizontal = i % 2 === 0;

        // Outer rect
        const ox = startX + band.leftOuter;
        const oy = startY + band.topOuter;
        const ox2 = startX + drawW - band.rightOuter;
        const oy2 = startY + drawH - band.botOuter;

        // Inner rect
        const ix = startX + band.leftInner;
        const iy = startY + band.topInner;
        const ix2 = startX + drawW - band.rightInner;
        const iy2 = startY + drawH - band.botInner;

        const spacing = p.random(lineSpacing * 0.7, lineSpacing * 1.5);

        // Draw colorPasses passes with random colors each time
        for (let pass = 0; pass < colorPasses; pass++) {
          const color = p.random(colors) as DotPen;
          setStroke(color, p);
          p.strokeWeight(lineThickness);

          // Slight per-pass offset so passes don't overlap perfectly
          const passOffset = pass === 0 ? 0 : p.random(-spacing * 0.4, spacing * 0.4);

          if (isHorizontal) {
            let y = oy + passOffset;
            while (y <= oy2) {
              if (y < iy || y > iy2) {
                // Outside inner rect: draw full width
                drawJitteryLine(ox, y, ox2, y);
              } else {
                // Inside inner rect Y range: draw left and right segments
                if (ix > ox) drawJitteryLine(ox, y, ix, y);
                if (ox2 > ix2) drawJitteryLine(ix2, y, ox2, y);
              }
              y += spacing;
            }
          } else {
            let x = ox + passOffset;
            while (x <= ox2) {
              if (x < ix || x > ix2) {
                // Outside inner rect: draw full height
                drawJitteryLine(x, oy, x, oy2);
              } else {
                // Inside inner rect X range: draw top and bottom segments
                if (iy > oy) drawJitteryLine(x, oy, x, iy);
                if (oy2 > iy2) drawJitteryLine(x, iy2, x, oy2);
              }
              x += spacing;
            }
          }
        }
      }
    };
  };

export default ripple01Sketch;
