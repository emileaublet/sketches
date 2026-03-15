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
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      // Jitter function adapted from tartan-01: perpendicular jitter with edge tapering
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

        const scaledJitter = jitter * (len / 100);
        const dx = (x2 - x1) / len;
        const dy = (y2 - y1) / len;
        const perpX = -dy;
        const perpY = dx;

        const tValues: number[] = [0];
        let t = 0;
        const avgStep = 0.1;
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

      // Build band edges as insets from the draw area.
      // Band i occupies [bandEdges[2i], bandEdges[2i+1]].
      const maxInset = Math.min(drawW, drawH) / 2;
      const bandEdges: number[] = [];
      let cursor = 0;

      while (cursor < maxInset) {
        const bw = p.random(bandWidthMin, bandWidthMax);
        const inner = cursor + bw;
        if (inner >= maxInset) {
          bandEdges.push(cursor, maxInset);
          break;
        }
        bandEdges.push(cursor, inner);
        cursor = inner + p.random(gapMin, gapMax);
      }

      // Render bands: even-indexed band → horizontal lines; odd-indexed → vertical lines.
      // This alternation makes adjacent bands "weave" visually.
      for (let i = 0; i < bandEdges.length - 1; i += 2) {
        const outerInset = bandEdges[i];
        const innerInset = bandEdges[i + 1];
        const color = colors[(i / 2) % colors.length];

        setStroke(color, p);
        p.strokeWeight(lineThickness);

        // Outer rect
        const ox = startX + outerInset;
        const oy = startY + outerInset;
        const ow = drawW - 2 * outerInset;
        const oh = drawH - 2 * outerInset;

        // Inner rect (the hollow center of this band)
        const ix = startX + innerInset;
        const iy = startY + innerInset;
        const iw = drawW - 2 * innerInset;
        const ih = drawH - 2 * innerInset;

        const isHorizontal = (i / 2) % 2 === 0;
        const spacing = p.random(lineSpacing * 0.7, lineSpacing * 1.5);

        if (isHorizontal) {
          // Horizontal lines, clipped to the band ring
          let y = oy;
          while (y <= oy + oh) {
            if (y < iy || y > iy + ih) {
              drawJitteryLine(ox, y, ox + ow, y);
            } else {
              // Left segment
              drawJitteryLine(ox, y, ix, y);
              // Right segment
              drawJitteryLine(ix + iw, y, ox + ow, y);
            }
            y += spacing;
          }
        } else {
          // Vertical lines, clipped to the band ring
          let x = ox;
          while (x <= ox + ow) {
            if (x < ix || x > ix + iw) {
              drawJitteryLine(x, oy, x, oy + oh);
            } else {
              // Top segment
              drawJitteryLine(x, oy, x, iy);
              // Bottom segment
              drawJitteryLine(x, iy + ih, x, oy + oh);
            }
            x += spacing;
          }
        }
      }
    };
  };

export default ripple01Sketch;
