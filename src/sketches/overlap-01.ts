import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

// Multiple rotated ellipses, each filled with dense parallel scan lines
// perpendicular to the major axis — like latitude lines on a lens.
// Overlapping areas show color mixing via MULTIPLY blend.

type Constants = BaseConstants & {
  numShapes: number;
  widthMin: number;
  widthMax: number;
  heightMin: number;
  heightMax: number;
  spread: number;
  lineSpacing: number;
  jitter: number;
  jitterSegmentLength: number;
  lineThickness: number;
  colors: DotPen[];
};

export const meta: Meta = {
  id: "overlap-01",
  title: "Overlap 01",
  description: "Overlapping hatched ellipses with MULTIPLY color blending",
  thumbnail: "/overlap-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 20,
  marginY: 20,
  debug: false,
  numShapes: 5,
  widthMin: 150,
  widthMax: 400,
  heightMin: 80,
  heightMax: 220,
  spread: 0.3,
  lineSpacing: 2,
  jitter: 1.5,
  jitterSegmentLength: 0.1,
  lineThickness: 0.4,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  numShapes: { min: 2, max: 10, step: 1 },
  widthMin: { min: 20, max: 600, step: 10 },
  widthMax: { min: 40, max: 800, step: 10 },
  heightMin: { min: 10, max: 300, step: 10 },
  heightMax: { min: 20, max: 400, step: 10 },
  spread: { min: 0, max: 1, step: 0.05 },
  lineSpacing: { min: 0.5, max: 8, step: 0.25 },
  jitter: { min: 0, max: 15, step: 0.5 },
  jitterSegmentLength: { min: 0.01, max: 0.5, step: 0.01 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  colors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const overlap01Sketch =
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
      const centerX = marginX + drawW / 2;
      const centerY = marginY + drawH / 2;

      const numShapes = Math.round(vars.numShapes ?? constants.numShapes);
      const widthMin = vars.widthMin ?? constants.widthMin;
      const widthMax = vars.widthMax ?? constants.widthMax;
      const heightMin = vars.heightMin ?? constants.heightMin;
      const heightMax = vars.heightMax ?? constants.heightMax;
      const spread = vars.spread ?? constants.spread;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const jitter = vars.jitter ?? constants.jitter;
      const jitterSegmentLength =
        vars.jitterSegmentLength ?? constants.jitterSegmentLength;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      p.blendMode(p.MULTIPLY);

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

        const dx = (x2 - x1) / len;
        const dy = (y2 - y1) / len;
        const perpX = -dy;
        const perpY = dx;

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
          const j = jitter * edge * p.random(0.6, 1.4);
          const d = p.random(-j, j);
          p.vertex(x + perpX * d, y + perpY * d);
        }
        p.endShape();
      }

      // Build shapes
      const spreadX = drawW * spread * 0.5;
      const spreadY = drawH * spread * 0.5;

      for (let i = 0; i < numShapes; i++) {
        const cx = centerX + p.random(-spreadX, spreadX);
        const cy = centerY + p.random(-spreadY, spreadY);
        const a = p.random(widthMin, widthMax) / 2; // semi-major axis
        const b = p.random(heightMin, heightMax) / 2; // semi-minor axis
        const angle = p.random(0, Math.PI); // rotation of major axis

        const color = colors[i % colors.length];
        setStroke(color, p);
        p.strokeWeight(lineThickness);

        const ca = Math.cos(angle);
        const sa = Math.sin(angle);

        // Scan perpendicular to major axis: step along minor axis in local frame
        const spacing = p.random(lineSpacing * 0.85, lineSpacing * 1.15);
        let ly = -b;
        while (ly <= b) {
          // Half-width at this local y along the ellipse
          const hx = a * Math.sqrt(Math.max(0, 1 - (ly / b) ** 2));
          if (hx > 0.5) {
            // Transform local (-hx, ly) and (hx, ly) to global coords
            const x1 = cx - hx * ca - ly * sa;
            const y1 = cy - hx * sa + ly * ca;
            const x2 = cx + hx * ca - ly * sa;
            const y2 = cy + hx * sa + ly * ca;
            drawJitteryLine(x1, y1, x2, y2);
          }
          ly += spacing;
        }
      }
    };
  };

export default overlap01Sketch;
