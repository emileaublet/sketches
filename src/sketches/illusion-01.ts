import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

// Fraser Spiral / Twisted Cord Illusion
// The concentric circles are perfectly round but appear to spiral inward
// due to alternating diagonal segments — a classic pen plotter illusion.

type Constants = BaseConstants & {
  numRings: number;
  innerRadius: number;
  outerRadius: number;
  segmentLength: number;
  tiltAngle: number;
  lineThickness: number;
  colors: DotPen[];
};

export const meta: Meta = {
  id: "illusion-01",
  title: "Illusion 01",
  description: "Fraser spiral: concentric circles that appear to spiral inward",
  thumbnail: "/illusion-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 560,
  marginX: 40,
  marginY: 40,
  debug: false,
  numRings: 18,
  innerRadius: 20,
  outerRadius: 230,
  segmentLength: 12,
  tiltAngle: 30,
  lineThickness: 0.5,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  numRings: { min: 2, max: 40, step: 1 },
  innerRadius: { min: 5, max: 200, step: 5 },
  outerRadius: { min: 50, max: 400, step: 5 },
  segmentLength: { min: 4, max: 40, step: 1 },
  tiltAngle: { min: 5, max: 60, step: 5 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  colors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const illusion01Sketch =
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
      const numRings = Math.round(vars.numRings ?? constants.numRings);
      const innerRadius = vars.innerRadius ?? constants.innerRadius;
      const outerRadius = vars.outerRadius ?? constants.outerRadius;
      const segmentLength = vars.segmentLength ?? constants.segmentLength;
      const tiltAngle = ((vars.tiltAngle ?? constants.tiltAngle) * Math.PI) / 180;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      const cx = marginX + (p.width - 2 * marginX) / 2;
      const cy = marginY + (p.height - 2 * marginY) / 2;

      p.blendMode(p.MULTIPLY);

      for (let ri = 0; ri < numRings; ri++) {
        const t = numRings > 1 ? ri / (numRings - 1) : 0;
        const radius = p.lerp(innerRadius, outerRadius, t);
        const circumference = 2 * Math.PI * radius;
        const numSegments = Math.max(4, Math.floor(circumference / segmentLength));

        // Each ring alternates phase to create twisted cord effect
        // Also alternate per-ring to enhance the spiral illusion
        const phaseOffset = ri % 2 === 0 ? 0 : Math.PI / numSegments;
        const color = colors[ri % colors.length];

        setStroke(color, p);
        p.strokeWeight(lineThickness);

        for (let si = 0; si < numSegments; si++) {
          const angle = phaseOffset + (si / numSegments) * 2 * Math.PI;
          // Center of this segment on the circle
          const px = cx + radius * Math.cos(angle);
          const py = cy + radius * Math.sin(angle);

          // Tangent direction at this point
          const tangentAngle = angle + Math.PI / 2;

          // Alternate tilt direction every segment
          const tiltDir = si % 2 === 0 ? 1 : -1;
          const segAngle = tangentAngle + tiltDir * tiltAngle;

          const half = segmentLength / 2;
          const x1 = px - half * Math.cos(segAngle);
          const y1 = py - half * Math.sin(segAngle);
          const x2 = px + half * Math.cos(segAngle);
          const y2 = py + half * Math.sin(segAngle);

          p.line(x1, y1, x2, y2);
        }
      }
    };
  };

export default illusion01Sketch;
