import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

// Concentric arcs packed into vertical slices of a sphere.
// Adjacent slices alternate arc orientation (opening up vs down),
// creating the illusion of a 3D globe when plotted.

type Constants = BaseConstants & {
  numSlices: number;
  lineSpacing: number;
  sliceGap: number;
  circleRadius: number;
  lineThickness: number;
  colors: DotPen[];
};

export const meta: Meta = {
  id: "orb-01",
  title: "Orb 01",
  description: "Sphere-like slices of tightly packed concentric arcs",
  thumbnail: "/orb-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 560,
  marginX: 30,
  marginY: 30,
  debug: false,
  numSlices: 10,
  lineSpacing: 2.5,
  sliceGap: 3,
  circleRadius: 240,
  lineThickness: 0.4,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  numSlices: { min: 3, max: 20, step: 1 },
  lineSpacing: { min: 0.5, max: 8, step: 0.25 },
  sliceGap: { min: 0, max: 20, step: 1 },
  circleRadius: { min: 50, max: 400, step: 5 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  colors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const orb01Sketch =
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

      const numSlices = Math.max(1, Math.round(vars.numSlices ?? constants.numSlices));
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const sliceGap = vars.sliceGap ?? constants.sliceGap;
      const R = vars.circleRadius ?? constants.circleRadius;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      p.blendMode(p.MULTIPLY);

      const sliceWidth = (2 * R) / numSlices;

      for (let i = 0; i < numSlices; i++) {
        // Slice x bounds (with gap on both sides)
        const rawX1 = cx - R + i * sliceWidth;
        const rawX2 = rawX1 + sliceWidth;
        const x1 = rawX1 + sliceGap / 2;
        const x2 = rawX2 - sliceGap / 2;
        const sliceMidX = (x1 + x2) / 2;
        const sliceHalfWidth = (x2 - x1) / 2;

        if (sliceHalfWidth <= 0) continue;

        // Find the top and bottom of this slice inside the overall circle
        const distFromCenter = Math.abs(sliceMidX - cx);
        if (distFromCenter >= R) continue;
        const halfH = Math.sqrt(R * R - distFromCenter * distFromCenter);
        const yTop = cy - halfH;
        const yBottom = cy + halfH;

        // Even slices: arc center at top → arcs open downward
        // Odd slices: arc center at bottom → arcs open upward
        const isEven = i % 2 === 0;
        const arcCy = isEven ? yTop : yBottom;

        const color = colors[i % colors.length];
        setStroke(color, p);
        p.strokeWeight(lineThickness);

        // Concentric arcs from radius = sliceHalfWidth outward until nothing is visible
        const rMax = 2 * halfH + sliceHalfWidth;

        for (let r = sliceHalfWidth; r <= rMax; r += lineSpacing) {
          // For even slices, sweep the downward semicircle (theta 0→PI)
          // For odd slices, sweep the upward semicircle (theta PI→2PI)
          const numSamples = Math.max(16, Math.ceil(Math.PI * r / 1.5));

          let inShape = false;

          for (let s = 0; s <= numSamples; s++) {
            const t = s / numSamples;
            const theta = isEven ? t * Math.PI : Math.PI + t * Math.PI;

            const x = sliceMidX + r * Math.cos(theta);
            const y = arcCy + r * Math.sin(theta);

            const inSlice = x >= x1 && x <= x2;
            const ddx = x - cx;
            const ddy = y - cy;
            const inCircle = ddx * ddx + ddy * ddy <= R * R;
            const visible = inSlice && inCircle;

            if (visible && !inShape) {
              p.beginShape();
              p.vertex(x, y);
              inShape = true;
            } else if (visible && inShape) {
              p.vertex(x, y);
            } else if (!visible && inShape) {
              p.endShape();
              inShape = false;
            }
          }

          if (inShape) {
            p.endShape();
          }
        }
      }
    };
  };

export default orb01Sketch;
