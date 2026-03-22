import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  bandHeight: number;
  lineSpacing: number;
  angle: number;
  jitter: number;
  strokeWeight: number;
  colorCycles: number;
  penColors: DotPen[];
  bandHeightVariation: number;
  overallAngle: number;
  mirrorColumns: number;
};

export const meta: Meta = {
  id: "herringbone-01",
  title: "Herringbone 01",
  description: "Herringbone bands of dense colored parallel lines",
  thumbnail: "/herringbone-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  bandHeight: 30,
  lineSpacing: 2.5,
  angle: 50,
  jitter: 0.5,
  strokeWeight: 0.4,
  colorCycles: 3,
  penColors: all("lePenPens"),
  bandHeightVariation: 0.4,
  overallAngle: 0,
  mirrorColumns: 1,
};

export const constantsProps = {
  bandHeight: { min: 8, max: 100, step: 2 },
  lineSpacing: { min: 0.5, max: 10, step: 0.5 },
  angle: { min: 10, max: 80, step: 1 },
  jitter: { min: 0, max: 5, step: 0.1 },
  strokeWeight: { min: 0.1, max: 1.5, step: 0.1 },
  colorCycles: { min: 1, max: 6, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "lePenPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
  bandHeightVariation: { min: 0, max: 1, step: 0.05 },
  overallAngle: { min: -45, max: 45, step: 1 },
  mirrorColumns: { min: 1, max: 4, step: 1 },
};

const herringbone01Sketch =
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

      const palette = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = palette.length > 0 ? palette : all("lePenPens");

      const bandHeight = vars.bandHeight ?? constants.bandHeight;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const angle = vars.angle ?? constants.angle;
      const jitter = vars.jitter ?? constants.jitter;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const colorCycles = vars.colorCycles ?? constants.colorCycles;
      const bandHeightVariation =
        vars.bandHeightVariation ?? constants.bandHeightVariation;
      const overallAngle = vars.overallAngle ?? constants.overallAngle;
      const mirrorColumns = vars.mirrorColumns ?? constants.mirrorColumns;

      p.strokeWeight(strokeWeight);
      p.strokeCap(p.ROUND);

      const startX = marginX;
      const startY = marginY;

      // Pre-generate variable band heights
      const bandHeights: number[] = [];
      let totalH = 0;
      while (totalH < drawH * 1.2) {
        const variation = 1 + p.random(-bandHeightVariation, bandHeightVariation);
        const h = Math.max(bandHeight * 0.3, bandHeight * variation);
        bandHeights.push(h);
        totalH += h;
      }

      const totalBands = bandHeights.length;

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      // Apply overall rotation around draw area center
      const overallRad = (overallAngle * Math.PI) / 180;
      ctx.save();
      ctx.translate(marginX + drawW / 2, marginY + drawH / 2);
      ctx.rotate(overallRad);
      ctx.translate(-(marginX + drawW / 2), -(marginY + drawH / 2));

      // Outer clip to margin area
      ctx.beginPath();
      ctx.rect(startX, startY, drawW, drawH);
      ctx.clip();

      let cumulativeY = 0;
      for (let bandIdx = 0; bandIdx < totalBands; bandIdx++) {
        const bandH = bandHeights[bandIdx];
        const bandY = startY + cumulativeY;
        cumulativeY += bandH;

        if (bandY >= startY + drawH) break;
        if (bandH <= 0) continue;

        const isEven = bandIdx % 2 === 0;
        const angleRad = ((isEven ? angle : -angle) * Math.PI) / 180;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);

        const colorT = (bandIdx / totalBands) * colors.length * colorCycles;
        const colorIdx = Math.floor(colorT) % colors.length;
        const colorIdx2 =
          (colorIdx + Math.floor(colors.length / 2)) % colors.length;

        const perpX = -sinA;
        const perpY = cosA;

        const colW = drawW / mirrorColumns;
        const diag = Math.sqrt(drawW * drawW + bandH * bandH) + bandHeight;
        const numLines = Math.ceil(diag / lineSpacing) + 2;

        for (let col = 0; col < mirrorColumns; col++) {
          const colX = startX + col * colW;
          const mirrored = col % 2 === 1;
          const colCenterX = colX + colW / 2;
          const bandCenterY = bandY + bandH / 2;

          ctx.save();
          ctx.beginPath();
          ctx.rect(colX, bandY, colW, bandH);
          ctx.clip();

          // First pass
          setStroke(colors[colorIdx], p);

          for (let i = -numLines; i <= numLines; i++) {
            const offsetDist = i * lineSpacing;
            const ox = mirrored
              ? colCenterX - perpX * offsetDist
              : colCenterX + perpX * offsetDist;
            const oy = bandCenterY + perpY * offsetDist;

            const jitterAmt = p.random(-jitter, jitter);
            const jx = ox + (mirrored ? -perpX : perpX) * jitterAmt;
            const jy = oy + perpY * jitterAmt;

            const drawCosA = mirrored ? -cosA : cosA;

            p.line(
              jx - drawCosA * diag,
              jy - sinA * diag,
              jx + drawCosA * diag,
              jy + sinA * diag
            );
          }

          // Second pass with shifted color and half-spacing offset
          setStroke(colors[colorIdx2], p);

          for (let i = -numLines; i <= numLines; i++) {
            const offsetDist = i * lineSpacing + lineSpacing * 0.5;
            const ox = mirrored
              ? colCenterX - perpX * offsetDist
              : colCenterX + perpX * offsetDist;
            const oy = bandCenterY + perpY * offsetDist;

            const jitterAmt = p.random(-jitter, jitter);
            const jx = ox + (mirrored ? -perpX : perpX) * jitterAmt;
            const jy = oy + perpY * jitterAmt;

            const drawCosA = mirrored ? -cosA : cosA;

            p.line(
              jx - drawCosA * diag,
              jy - sinA * diag,
              jx + drawCosA * diag,
              jy + sinA * diag
            );
          }

          ctx.restore();
        }
      }

      ctx.restore();
    };
  };

export default herringbone01Sketch;
