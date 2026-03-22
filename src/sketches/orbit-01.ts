import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  blobCount: number;
  arrangementRadius: number;
  blobRadius: number;
  blobRoughness: number;
  lineSpacing: number;
  strokeWeight: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "orbit-01",
  title: "Orbit 01",
  description: "Overlapping blobs filled with hatching, MULTIPLY blend",
  thumbnail: "/orbit-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  blobCount: 5,
  arrangementRadius: 140,
  blobRadius: 120,
  blobRoughness: 0.3,
  lineSpacing: 2.5,
  strokeWeight: 0.4,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  blobCount: { min: 2, max: 8, step: 1 },
  arrangementRadius: { min: 0, max: 280, step: 5 },
  blobRadius: { min: 30, max: 240, step: 5 },
  blobRoughness: { min: 0, max: 0.8, step: 0.05 },
  lineSpacing: { min: 0.5, max: 10, step: 0.5 },
  strokeWeight: { min: 0.1, max: 1.5, step: 0.1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const orbit01Sketch =
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

      if (seed !== null) p.noiseSeed(seed);

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      const blobCount = Math.round(vars.blobCount ?? constants.blobCount);
      const arrangementRadius =
        vars.arrangementRadius ?? constants.arrangementRadius;
      const blobRadius = vars.blobRadius ?? constants.blobRadius;
      const blobRoughness = vars.blobRoughness ?? constants.blobRoughness;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const palette = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = palette.length > 0 ? palette : all("staedtlerPens");

      p.strokeWeight(strokeWeight);
      p.strokeCap(p.ROUND);

      const blobs: {
        x: number;
        y: number;
        noiseOffX: number;
        noiseOffY: number;
        colorIdx: number;
      }[] = [];

      for (let i = 0; i < blobCount; i++) {
        const angle =
          (i / blobCount) * Math.PI * 2 + p.random(-0.2, 0.2);
        blobs.push({
          x: cx + Math.cos(angle) * arrangementRadius,
          y: cy + Math.sin(angle) * arrangementRadius,
          noiseOffX: p.random(1000),
          noiseOffY: p.random(1000),
          colorIdx: i % colors.length,
        });
      }

      for (let b = 0; b < blobs.length; b++) {
        const blob = blobs[b];
        setStroke(colors[blob.colorIdx], p);

        const toBlobAngle = Math.atan2(blob.y - cy, blob.x - cx);
        const hatchAngle = toBlobAngle + Math.PI / 2;
        const cosH = Math.cos(hatchAngle);
        const sinH = Math.sin(hatchAngle);
        const perpH = { x: -sinH, y: cosH };

        const numBoundaryPts = 180;
        const boundaryPts: { x: number; y: number }[] = [];
        for (let i = 0; i < numBoundaryPts; i++) {
          const a = (i / numBoundaryPts) * Math.PI * 2;
          const noiseVal = p.noise(
            blob.noiseOffX + Math.cos(a) * 1.5,
            blob.noiseOffY + Math.sin(a) * 1.5,
          );
          const r = blobRadius * (1 + (noiseVal - 0.5) * 2 * blobRoughness);
          boundaryPts.push({
            x: blob.x + Math.cos(a) * r,
            y: blob.y + Math.sin(a) * r,
          });
        }

        const ctx = p.drawingContext as CanvasRenderingContext2D;
        ctx.save();

        (ctx as any).globalCompositeOperation = "multiply";

        ctx.beginPath();
        ctx.moveTo(boundaryPts[0].x, boundaryPts[0].y);
        for (let i = 1; i < boundaryPts.length; i++) {
          ctx.lineTo(boundaryPts[i].x, boundaryPts[i].y);
        }
        ctx.closePath();
        ctx.clip();

        const diag = blobRadius * 2.5;
        const steps = Math.ceil(diag / lineSpacing) + 2;

        for (let s = -steps; s <= steps; s++) {
          const offsetDist = s * lineSpacing;
          const ox = blob.x + perpH.x * offsetDist;
          const oy = blob.y + perpH.y * offsetDist;
          p.line(
            ox - cosH * diag,
            oy - sinH * diag,
            ox + cosH * diag,
            oy + sinH * diag,
          );
        }

        ctx.restore();
      }
    };
  };

export default orbit01Sketch;
