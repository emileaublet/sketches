import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  markCount: number;
  markSize: number;
  blobRadius: number;
  blobRoughness: number;
  blobNoiseScale: number;
  densityFalloff: number;
  colorNoiseScale: number;
  strokeWeight: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "micro-squiggle-01",
  title: "Micro Squiggle 01",
  description: "Dense blob of tiny cursive loop marks with center-weighted density",
  thumbnail: "/micro-squiggle-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 60,
  marginY: 60,
  debug: false,
  markCount: 12000,
  markSize: 4,
  blobRadius: 220,
  blobRoughness: 0.3,
  blobNoiseScale: 1.0,
  densityFalloff: 1.8,
  colorNoiseScale: 0.006,
  strokeWeight: 0.35,
  penColors: all("lePenPens"),
};

export const constantsProps = {
  markCount: { min: 1000, max: 30000, step: 500 },
  markSize: { min: 1, max: 12, step: 0.5 },
  blobRadius: { min: 50, max: 320, step: 10 },
  blobRoughness: { min: 0, max: 0.7, step: 0.05 },
  blobNoiseScale: { min: 0.2, max: 3, step: 0.1 },
  densityFalloff: { min: 0.5, max: 4, step: 0.1 },
  colorNoiseScale: { min: 0.001, max: 0.02, step: 0.001 },
  strokeWeight: { min: 0.1, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "lePenPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const microSquiggle01 =
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

      const markCount = vars.markCount ?? constants.markCount;
      const markSize = vars.markSize ?? constants.markSize;
      const blobRadius = vars.blobRadius ?? constants.blobRadius;
      const blobRoughness = vars.blobRoughness ?? constants.blobRoughness;
      const blobNoiseScale = vars.blobNoiseScale ?? constants.blobNoiseScale;
      const densityFalloff = vars.densityFalloff ?? constants.densityFalloff;
      const colorNoiseScale = vars.colorNoiseScale ?? constants.colorNoiseScale;
      const sw = vars.strokeWeight ?? constants.strokeWeight;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("lePenPens");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      const blobOffX = p.random(1000);
      const blobOffY = p.random(1000);
      const colorOffX = p.random(1000);
      const colorOffY = p.random(1000);

      const blobR = (angle: number): number => {
        const nx = blobOffX + Math.cos(angle) * blobNoiseScale;
        const ny = blobOffY + Math.sin(angle) * blobNoiseScale;
        return blobRadius * (1 + (p.noise(nx, ny) - 0.5) * 2 * blobRoughness);
      };

      const isInsideBlob = (px: number, py: number): boolean => {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        return dist < blobR(angle);
      };

      p.strokeCap(p.ROUND);
      p.strokeWeight(sw);

      for (let i = 0; i < markCount; i++) {
        const r = blobRadius * Math.pow(p.random(1), densityFalloff);
        const theta = p.random(p.TWO_PI);
        const px = cx + Math.cos(theta) * r;
        const py = cy + Math.sin(theta) * r;

        if (!isInsideBlob(px, py)) continue;

        const noiseVal = p.noise(
          colorOffX + px * colorNoiseScale,
          colorOffY + py * colorNoiseScale
        );
        const colorIdx = Math.floor(noiseVal * colors.length) % colors.length;
        setStroke(colors[colorIdx], p);

        const dir = p.random(p.TWO_PI);
        const sz = markSize * p.random(0.6, 1.4);

        p.beginShape();
        p.curveVertex(px, py);
        p.curveVertex(
          px + Math.cos(dir) * sz * 0.3,
          py + Math.sin(dir) * sz * 0.3
        );
        p.curveVertex(
          px + Math.cos(dir + 1.2) * sz,
          py + Math.sin(dir + 1.2) * sz
        );
        p.curveVertex(
          px + Math.cos(dir + 2.5) * sz * 0.7,
          py + Math.sin(dir + 2.5) * sz * 0.7
        );
        p.curveVertex(
          px + Math.cos(dir + 3.8) * sz * 0.3,
          py + Math.sin(dir + 3.8) * sz * 0.3
        );
        p.curveVertex(px, py);
        p.endShape();
      }
    };
  };

export default microSquiggle01;
