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
  id: "diagonal-01",
  title: "Diagonal 01",
  description: "Two families of crossing diagonal bands with hatching",
  thumbnail: "/diagonal-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  bandWidthMin: 10,
  bandWidthMax: 80,
  gapMin: 5,
  gapMax: 35,
  lineSpacing: 2.5,
  jitter: 1,
  lineThickness: 0.4,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  bandWidthMin: { min: 5, max: 150, step: 5 },
  bandWidthMax: { min: 10, max: 200, step: 5 },
  gapMin: { min: 0, max: 60, step: 1 },
  gapMax: { min: 0, max: 100, step: 1 },
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

const diagonal01Sketch =
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

      p.blendMode(p.MULTIPLY);

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const rx = marginX;
      const ry = marginY;

      const bandWidthMin = vars.bandWidthMin ?? constants.bandWidthMin;
      const bandWidthMax = vars.bandWidthMax ?? constants.bandWidthMax;
      const gapMin = vars.gapMin ?? constants.gapMin;
      const gapMax = vars.gapMax ?? constants.gapMax;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const jitter = vars.jitter ?? constants.jitter;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      // Jitter function: perpendicular displacement with edge tapering (from tartan-01)
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

      // Clip a 45° line (y = x + b) to the draw rect [rx, ry, rx+drawW, ry+drawH].
      // Returns [x1, y1, x2, y2] or null if the line doesn't intersect.
      function clip45(
        b: number,
      ): [number, number, number, number] | null {
        const pts: [number, number][] = [];

        const yLeft = rx + b;
        if (yLeft >= ry && yLeft <= ry + drawH) pts.push([rx, yLeft]);

        const yRight = rx + drawW + b;
        if (yRight >= ry && yRight <= ry + drawH) pts.push([rx + drawW, yRight]);

        const xTop = ry - b;
        if (xTop > rx && xTop < rx + drawW) pts.push([xTop, ry]);

        const xBot = ry + drawH - b;
        if (xBot > rx && xBot < rx + drawW) pts.push([xBot, ry + drawH]);

        if (pts.length < 2) return null;
        // Sort by x so the line always goes left → right
        pts.sort((a, b_) => a[0] - b_[0]);
        return [pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1]];
      }

      // Clip a 135° line (y = −x + b) to the draw rect.
      function clip135(
        b: number,
      ): [number, number, number, number] | null {
        const pts: [number, number][] = [];

        const yLeft = -rx + b;
        if (yLeft >= ry && yLeft <= ry + drawH) pts.push([rx, yLeft]);

        const yRight = -(rx + drawW) + b;
        if (yRight >= ry && yRight <= ry + drawH) pts.push([rx + drawW, yRight]);

        const xTop = b - ry;
        if (xTop > rx && xTop < rx + drawW) pts.push([xTop, ry]);

        const xBot = b - (ry + drawH);
        if (xBot > rx && xBot < rx + drawW) pts.push([xBot, ry + drawH]);

        if (pts.length < 2) return null;
        pts.sort((a, b_) => a[0] - b_[0]);
        return [pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1]];
      }

      // Band widths in pixel space; b-space width = pixelWidth * √2
      // because the perpendicular distance between y=x+b and y=x+(b+Δb) is Δb/√2.
      const sqrt2 = Math.sqrt(2);

      // Generate band edges in b-space for a given range
      function generateBands(
        bMin: number,
        bMax: number,
      ): { b0: number; b1: number }[] {
        const bands: { b0: number; b1: number }[] = [];
        let cur = bMin;
        while (cur < bMax) {
          const bw = p.random(bandWidthMin, bandWidthMax) * sqrt2;
          const b1 = cur + bw;
          if (b1 > bMax) break;
          bands.push({ b0: cur, b1 });
          cur = b1 + p.random(gapMin, gapMax) * sqrt2;
        }
        return bands;
      }

      // Draw a band of 45° lines between b0 and b1
      function drawBand45(b0: number, b1: number, color: DotPen) {
        setStroke(color, p);
        p.strokeWeight(lineThickness);
        const bStep = p.random(lineSpacing * 0.7, lineSpacing * 1.5) * sqrt2;
        for (let b = b0; b <= b1; b += bStep) {
          const seg = clip45(b);
          if (seg) drawJitteryLine(seg[0], seg[1], seg[2], seg[3]);
        }
      }

      // Draw a band of 135° lines between b0 and b1
      function drawBand135(b0: number, b1: number, color: DotPen) {
        setStroke(color, p);
        p.strokeWeight(lineThickness);
        const bStep = p.random(lineSpacing * 0.7, lineSpacing * 1.5) * sqrt2;
        for (let b = b0; b <= b1; b += bStep) {
          const seg = clip135(b);
          if (seg) drawJitteryLine(seg[0], seg[1], seg[2], seg[3]);
        }
      }

      // 45° family: y = x + b
      // b range for the full draw rect
      const b45Min = ry - (rx + drawW);
      const b45Max = ry + drawH - rx;
      const bands45 = generateBands(b45Min, b45Max);

      // 135° family: y = −x + b
      // b range for the full draw rect
      const b135Min = ry + rx;
      const b135Max = ry + drawH + rx + drawW;
      const bands135 = generateBands(b135Min, b135Max);

      // Draw 45° bands
      let colorIdx = 0;
      for (const band of bands45) {
        drawBand45(band.b0, band.b1, colors[colorIdx % colors.length]);
        colorIdx++;
      }

      // Draw 135° bands — offset color index so crossing bands tend to differ
      colorIdx = Math.floor(colors.length / 2);
      for (const band of bands135) {
        drawBand135(band.b0, band.b1, colors[colorIdx % colors.length]);
        colorIdx++;
      }
    };
  };

export default diagonal01Sketch;
