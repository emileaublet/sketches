import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  noiseScale: number;
  lineSpacing: number;
  warpStrength: number;
  warpScale: number;
  strokeWeight: number;
  colorBands: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "field-lines-01",
  title: "Field Lines 01",
  description:
    "Contour streamlines following a Perlin noise gradient — horizontal scanlines warped to follow noise terrain, with elevation-banded coloring",
  thumbnail: "/field-lines-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  noiseScale: 0.004,
  lineSpacing: 4,
  warpStrength: 40,
  warpScale: 0.003,
  strokeWeight: 0.4,
  colorBands: 6,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  noiseScale: { min: 0.001, max: 0.015, step: 0.001 },
  lineSpacing: { min: 1, max: 12, step: 0.5 },
  warpStrength: { min: 0, max: 200, step: 5 },
  warpScale: { min: 0.001, max: 0.01, step: 0.001 },
  strokeWeight: { min: 0.1, max: 1.5, step: 0.1 },
  colorBands: { min: 2, max: 12, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const fieldLines01Sketch =
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

      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const warpStrength = vars.warpStrength ?? constants.warpStrength;
      const warpScale = vars.warpScale ?? constants.warpScale;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const colorBands = Math.round(vars.colorBands ?? constants.colorBands);

      const penColors = vars.penColors ?? constants.penColors;
      const colors: DotPen[] =
        penColors && penColors.length > 0 ? penColors : all("zebraSarasa");

      const noiseOffX = p.random(1000);
      const noiseOffY = p.random(1000);
      const warpOffX = p.random(5000);
      const warpOffY = p.random(5000);

      p.strokeWeight(strokeWeight);
      p.strokeCap(p.ROUND);
      p.noFill();

      const stepX = 4;

      for (
        let baseY = marginY;
        baseY <= marginY + drawH;
        baseY += lineSpacing
      ) {
        const centerNoiseVal = p.noise(
          noiseOffX + (marginX + drawW / 2) * noiseScale,
          noiseOffY + baseY * noiseScale,
        );
        const bandIdx = Math.floor(centerNoiseVal * colorBands) % colorBands;
        const colorIdx = bandIdx % colors.length;
        setStroke(colors[colorIdx], p);

        p.beginShape();
        for (let x = marginX; x <= marginX + drawW; x += stepX) {
          const warpVal = p.noise(
            warpOffX + x * warpScale,
            warpOffY + baseY * warpScale,
          );
          const warpY = (warpVal - 0.5) * 2 * warpStrength;
          const y = baseY + warpY;
          p.vertex(x, y);
        }
        p.endShape();
      }
    };
  };

export default fieldLines01Sketch;
