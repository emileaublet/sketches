import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  levels: number;
  lineSpacing: number;
  noiseScale: number;
  warpStrength: number;
  strokeWeight: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "contour-01",
  title: "Contour 01",
  description: "Noise-warped concentric contour rings, fingerprint-like",
  thumbnail: "/contour-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 560,
  marginX: 40,
  marginY: 40,
  debug: false,
  levels: 50,
  lineSpacing: 5,
  noiseScale: 0.008,
  warpStrength: 0.5,
  strokeWeight: 0.4,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  levels: { min: 10, max: 120, step: 5 },
  lineSpacing: { min: 2, max: 15, step: 0.5 },
  noiseScale: { min: 0.001, max: 0.03, step: 0.001 },
  warpStrength: { min: 0, max: 1.5, step: 0.05 },
  strokeWeight: { min: 0.1, max: 1.5, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const contourSketch =
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

      const levels = vars.levels ?? constants.levels;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const warpStrength = vars.warpStrength ?? constants.warpStrength;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;
      const maxRadius = Math.min(drawW, drawH) / 2;

      const noiseOffX = p.random(1000);
      const noiseOffY = p.random(1000);

      const TWO_PI = Math.PI * 2;

      p.strokeWeight(strokeWeight);
      p.strokeCap(p.ROUND);

      for (let level = 0; level < levels; level++) {
        const r = (level + 1) * lineSpacing;
        if (r > maxRadius) break;

        const color = colors[level % colors.length];
        setStroke(color, p);

        const steps = Math.max(60, Math.round(r * 0.5));

        p.beginShape();

        for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * TWO_PI;
          const nx = noiseOffX + Math.cos(angle) * noiseScale * r;
          const ny = noiseOffY + Math.sin(angle) * noiseScale * r;
          const warp = (p.noise(nx, ny) - 0.5) * 2 * warpStrength * r;
          const rx = r + warp;
          const px = cx + Math.cos(angle) * rx;
          const py = cy + Math.sin(angle) * rx;
          p.curveVertex(px, py);
        }

        // Repeat first 3 vertices to close the curve smoothly
        for (let i = 0; i < 3; i++) {
          const angle = (i / steps) * TWO_PI;
          const nx = noiseOffX + Math.cos(angle) * noiseScale * r;
          const ny = noiseOffY + Math.sin(angle) * noiseScale * r;
          const warp = (p.noise(nx, ny) - 0.5) * 2 * warpStrength * r;
          const rx = r + warp;
          const px = cx + Math.cos(angle) * rx;
          const py = cy + Math.sin(angle) * rx;
          p.curveVertex(px, py);
        }

        p.endShape();
      }
    };
  };

export default contourSketch;
