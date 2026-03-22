import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  numSections: number;
  ovalScaleX: number;
  ovalScaleY: number;
  hatchSpacing: number;
  lineThickness: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "z-sectioned-oval-01",
  title: "Sectioned Oval 01",
  description:
    "A large oval divided into pie-wedge sections, each hatched with dense parallel lines in a different pen color.",
  thumbnail: "/z-sectioned-oval-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  numSections: 8,
  ovalScaleX: 0.9,
  ovalScaleY: 0.9,
  hatchSpacing: 2.5,
  lineThickness: 0.35,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  numSections: { min: 3, max: 24, step: 1 },
  ovalScaleX: { min: 0.3, max: 1.0, step: 0.05 },
  ovalScaleY: { min: 0.3, max: 1.0, step: 0.05 },
  hatchSpacing: { min: 1, max: 10, step: 0.5 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const zSectionedOval01 =
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

      const numSections = vars.numSections ?? constants.numSections;
      const ovalScaleX = vars.ovalScaleX ?? constants.ovalScaleX;
      const ovalScaleY = vars.ovalScaleY ?? constants.ovalScaleY;
      const hatchSpacing = vars.hatchSpacing ?? constants.hatchSpacing;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("staedtlerPens");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;
      const rx = (drawW / 2) * ovalScaleX;
      const ry = (drawH / 2) * ovalScaleY;

      p.strokeWeight(lineThickness);
      p.strokeCap(p.ROUND);
      p.noFill();

      // Generate N random cut angles in [0, 2π], sorted
      const angles: number[] = [];
      for (let i = 0; i < numSections; i++) {
        angles.push(p.random(0, Math.PI * 2));
      }
      angles.sort((a, b) => a - b);

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      // Hatching bounds: cover the full oval extent
      const hatchLeft = cx - rx;
      const hatchRight = cx + rx;
      const hatchTop = cy - ry;
      const hatchBottom = cy + ry;

      for (let i = 0; i < numSections; i++) {
        const angleStart = angles[i];
        const angleEnd = angles[(i + 1) % numSections];

        // Determine the actual arc sweep — handle wrap-around for the last section
        const sweepEnd = i < numSections - 1 ? angleEnd : angleEnd + Math.PI * 2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);

        for (let a = angleStart; a <= sweepEnd + 0.001; a += 0.02) {
          const clampedA = Math.min(a, sweepEnd);
          ctx.lineTo(cx + rx * Math.cos(clampedA), cy + ry * Math.sin(clampedA));
        }

        ctx.closePath();
        ctx.clip();

        // Pick a random color for this section
        setStroke(p.random(colors) as DotPen, p);

        // Draw vertical hatching lines across the full oval bounding box
        for (let x = hatchLeft; x <= hatchRight; x += hatchSpacing) {
          p.line(x, hatchTop, x, hatchBottom);
        }

        ctx.restore();
      }
    };
  };

export default zSectionedOval01;
