import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  numPetals: number;
  petalLength: number;
  petalWidth: number;
  concentricSpacing: number;
  lineThickness: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "z-rotated-petal-ellipses-01",
  title: "Rotated Petal Ellipses 01",
  description:
    "N ellipses centered at canvas center, each rotated at equal angular steps, filled with concentric shrinking ellipses. MULTIPLY blending creates darker tones where petals overlap.",
  thumbnail: "/z-rotated-petal-ellipses-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  numPetals: 8,
  petalLength: 220,
  petalWidth: 60,
  concentricSpacing: 5,
  lineThickness: 0.3,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  numPetals: { min: 3, max: 16, step: 1 },
  petalLength: { min: 50, max: 400, step: 10 },
  petalWidth: { min: 10, max: 200, step: 5 },
  concentricSpacing: { min: 1, max: 20, step: 1 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const zRotatedPetalEllipses01 =
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

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      const numPetals = vars.numPetals ?? constants.numPetals;
      const petalLength = vars.petalLength ?? constants.petalLength;
      const petalWidth = vars.petalWidth ?? constants.petalWidth;
      const concentricSpacing =
        vars.concentricSpacing ?? constants.concentricSpacing;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      // Enable MULTIPLY blending so overlapping petals deepen in color
      (p.drawingContext as any).globalCompositeOperation = "multiply";

      p.strokeWeight(lineThickness);
      p.noFill();

      for (let i = 0; i < numPetals; i++) {
        // Half rotation gives full coverage due to ellipse symmetry
        const angle = (i / numPetals) * Math.PI;
        const petalA = petalLength / 2; // semi-major axis
        const petalB = petalWidth / 2; // semi-minor axis

        const color = colors[i % colors.length];
        setStroke(color, p);
        p.strokeWeight(lineThickness);

        ctx.save();

        // Clip to petal ellipse boundary
        ctx.beginPath();
        ctx.ellipse(cx, cy, petalA, petalB, angle, 0, Math.PI * 2);
        ctx.clip();

        // Draw concentric ellipses from outer to center
        for (let a = petalA; a > 0; a -= concentricSpacing) {
          const b = petalB * (a / petalA);
          ctx.beginPath();
          ctx.ellipse(cx, cy, a, b, angle, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Restore default blending
      (p.drawingContext as any).globalCompositeOperation = "source-over";
    };
  };

export default zRotatedPetalEllipses01;
