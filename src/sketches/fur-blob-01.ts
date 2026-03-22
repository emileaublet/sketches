import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  blobRadius: number;
  blobRoughness: number;
  blobNoiseScale: number;
  furSpacing: number;
  furLength: number;
  furJitter: number;
  eyeRadius: number;
  eyeOffsetX: number;
  eyeOffsetY: number;
  strokeWeight: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "fur-blob-01",
  title: "Fur Blob 01",
  description: "Blob shape filled with dense radial fur strokes and optional eye holes",
  thumbnail: "/fur-blob-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 560,
  marginX: 60,
  marginY: 60,
  debug: false,
  blobRadius: 180,
  blobRoughness: 0.25,
  blobNoiseScale: 1.0,
  furSpacing: 2.5,
  furLength: 10,
  furJitter: 0.25,
  eyeRadius: 22,
  eyeOffsetX: 35,
  eyeOffsetY: -15,
  strokeWeight: 0.35,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  blobRadius: { min: 60, max: 260, step: 10 },
  blobRoughness: { min: 0, max: 0.7, step: 0.05 },
  blobNoiseScale: { min: 0.2, max: 3, step: 0.1 },
  furSpacing: { min: 1, max: 8, step: 0.5 },
  furLength: { min: 3, max: 25, step: 1 },
  furJitter: { min: 0, max: 1, step: 0.05 },
  eyeRadius: { min: 0, max: 60, step: 2 },
  eyeOffsetX: { min: 0, max: 80, step: 5 },
  eyeOffsetY: { min: -80, max: 40, step: 5 },
  strokeWeight: { min: 0.1, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const furBlob01 =
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

      const blobRadius = vars.blobRadius ?? constants.blobRadius;
      const blobRoughness = vars.blobRoughness ?? constants.blobRoughness;
      const blobNoiseScale = vars.blobNoiseScale ?? constants.blobNoiseScale;
      const furSpacing = vars.furSpacing ?? constants.furSpacing;
      const furLength = vars.furLength ?? constants.furLength;
      const furJitter = vars.furJitter ?? constants.furJitter;
      const eyeRadius = vars.eyeRadius ?? constants.eyeRadius;
      const eyeOffsetX = vars.eyeOffsetX ?? constants.eyeOffsetX;
      const eyeOffsetY = vars.eyeOffsetY ?? constants.eyeOffsetY;
      const sw = vars.strokeWeight ?? constants.strokeWeight;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("staedtlerPens");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      const blobOffX = p.random(1000);
      const blobOffY = p.random(1000);

      const blobR = (angle: number): number => {
        const nx = Math.cos(angle) * blobNoiseScale;
        const ny = Math.sin(angle) * blobNoiseScale;
        const n = p.noise(blobOffX + nx, blobOffY + ny);
        return blobRadius * (1 + (n - 0.5) * 2 * blobRoughness);
      };

      const isInsideBlob = (px: number, py: number): boolean => {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        return dist < blobR(angle);
      };

      const isInEye = (px: number, py: number): boolean => {
        if (eyeRadius <= 0) return false;
        const dx1 = px - (cx - eyeOffsetX);
        const dy1 = py - (cy + eyeOffsetY);
        const dx2 = px - (cx + eyeOffsetX);
        const dy2 = py - (cy + eyeOffsetY);
        return (
          dx1 * dx1 + dy1 * dy1 < eyeRadius * eyeRadius ||
          dx2 * dx2 + dy2 * dy2 < eyeRadius * eyeRadius
        );
      };

      p.strokeWeight(sw);
      p.strokeCap(p.ROUND);

      const startX = marginX;
      const startY = marginY;

      for (let x = startX; x <= startX + drawW; x += furSpacing) {
        for (let y = startY; y <= startY + drawH; y += furSpacing) {
          if (!isInsideBlob(x, y)) continue;
          if (isInEye(x, y)) continue;

          const angle =
            Math.atan2(y - cy, x - cx) + p.random(-furJitter, furJitter);
          const len = furLength * p.random(0.5, 1.5);

          setStroke(p.random(colors) as DotPen, p);
          p.line(
            x,
            y,
            x + Math.cos(angle) * len,
            y + Math.sin(angle) * len
          );
        }
      }
    };
  };

export default furBlob01;
