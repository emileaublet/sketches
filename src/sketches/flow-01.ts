import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  gridSpacing: number;
  dashLength: number;
  strokeWeight: number;
  noiseScale: number;
  noiseStrength: number;
  jitter: number;
  penColors: DotPen[];
  maskShape: number;
  maskSize: number;
  maskRoughness: number;
};

export const meta: Meta = {
  id: "flow-01",
  title: "Flow 01",
  description: "Flow field of short colored dashes driven by Perlin noise",
  thumbnail: "/flow-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  gridSpacing: 8,
  dashLength: 12,
  strokeWeight: 0.5,
  noiseScale: 0.005,
  noiseStrength: 1.5,
  jitter: 2,
  penColors: all("staedtlerPens"),
  maskShape: 0,
  maskSize: 0.7,
  maskRoughness: 0.4,
};

export const constantsProps = {
  gridSpacing: { min: 3, max: 30, step: 1 },
  dashLength: { min: 2, max: 50, step: 1 },
  strokeWeight: { min: 0.1, max: 2, step: 0.1 },
  noiseScale: { min: 0.001, max: 0.02, step: 0.001 },
  noiseStrength: { min: 0.5, max: 4, step: 0.1 },
  jitter: { min: 0, max: 15, step: 0.5 },
  penColors: (value: DotPen[]) => penColorMultiselect({ family: "staedtlerPens", selected: value?.length ? value : undefined, label: "Colors" }),
  maskShape: { min: 0, max: 3, step: 1 },
  maskSize: { min: 0.2, max: 1.0, step: 0.05 },
  maskRoughness: { min: 0, max: 1, step: 0.05 },
};

const flow01Sketch =
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

      const gridSpacing = vars.gridSpacing ?? constants.gridSpacing;
      const dashLength = vars.dashLength ?? constants.dashLength;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const noiseStrength = vars.noiseStrength ?? constants.noiseStrength;
      const jitter = vars.jitter ?? constants.jitter;

      const colors = (vars.penColors ?? constants.penColors) as DotPen[];
      const palette = colors.length > 0 ? colors : all("staedtlerPens");

      const startX = marginX;
      const startY = marginY;

      const noiseOffX = p.random(1000);
      const noiseOffY = p.random(1000);
      const colorNoiseOffX = p.random(10000);
      const colorNoiseOffY = p.random(10000);

      const maskShape = Math.round(vars.maskShape ?? constants.maskShape);
      const maskSize = vars.maskSize ?? constants.maskSize;
      const maskRoughness = vars.maskRoughness ?? constants.maskRoughness;
      const maskCx = marginX + drawW / 2;
      const maskCy = marginY + drawH / 2;
      const maskRadius = Math.min(drawW, drawH) / 2 * maskSize;
      const maskHalfW = drawW / 2 * maskSize;
      const maskHalfH = drawH / 2 * maskSize;

      // Noise offset for blob mask (stable per seed)
      const blobOffX = p.random(20000);
      const blobOffY = p.random(20000);

      function isInsideMask(px: number, py: number): boolean {
        if (maskShape === 0) return true; // no mask
        const dx = px - maskCx;
        const dy = py - maskCy;
        if (maskShape === 1) {
          // rectangle
          return Math.abs(dx) <= maskHalfW && Math.abs(dy) <= maskHalfH;
        }
        if (maskShape === 2) {
          // circle
          return dx * dx + dy * dy <= maskRadius * maskRadius;
        }
        if (maskShape === 3) {
          // blob: noise-perturbed circle
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const noiseVal = p.noise(blobOffX + Math.cos(angle) * 1.5, blobOffY + Math.sin(angle) * 1.5);
          const blobR = maskRadius * (1 + (noiseVal - 0.5) * 2 * maskRoughness);
          return dist <= blobR;
        }
        return true;
      }

      p.strokeWeight(strokeWeight);

      for (let gx = startX; gx <= startX + drawW; gx += gridSpacing) {
        for (let gy = startY; gy <= startY + drawH; gy += gridSpacing) {
          const x = gx + p.random(-jitter, jitter);
          const y = gy + p.random(-jitter, jitter);

          if (!isInsideMask(x, y)) continue;

          const angle = p.noise(noiseOffX + x * noiseScale, noiseOffY + y * noiseScale) * Math.PI * 2 * noiseStrength;

          const colorNoise = p.noise(colorNoiseOffX + x * noiseScale * 0.5, colorNoiseOffY + y * noiseScale * 0.5);
          const colorIndex = Math.floor(colorNoise * palette.length) % palette.length;
          setStroke(palette[colorIndex], p);

          const dx = Math.cos(angle) * dashLength / 2;
          const dy = Math.sin(angle) * dashLength / 2;
          p.line(x - dx, y - dy, x + dx, y + dy);
        }
      }
    };
  };

export default flow01Sketch;
