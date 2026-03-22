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
  markCount: number;
  markLength: number;
  markCurviness: number;
  strokeWeight: number;
  edgeFalloff: number;
  swirlStrength: number;
  noiseVariation: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "squiggle-01",
  title: "Squiggle 01",
  description: "Organic blob filled with dense tiny squiggle marks",
  thumbnail: "/squiggle-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  blobRadius: 180,
  blobRoughness: 0.35,
  blobNoiseScale: 1.5,
  markCount: 8000,
  markLength: 10,
  markCurviness: 4,
  strokeWeight: 0.35,
  edgeFalloff: 0.7,
  swirlStrength: 0.8,
  noiseVariation: 0.4,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  blobRadius: { min: 50, max: 300, step: 5 },
  blobRoughness: { min: 0, max: 0.8, step: 0.05 },
  blobNoiseScale: { min: 0.5, max: 5, step: 0.1 },
  markCount: { min: 1000, max: 20000, step: 500 },
  markLength: { min: 3, max: 30, step: 1 },
  markCurviness: { min: 0, max: 15, step: 0.5 },
  strokeWeight: { min: 0.1, max: 1.2, step: 0.05 },
  edgeFalloff: { min: 0, max: 1, step: 0.05 },
  swirlStrength: { min: 0, max: 1, step: 0.05 },
  noiseVariation: { min: 0, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const squiggle01Sketch =
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

      const blobRadius = vars.blobRadius ?? constants.blobRadius;
      const blobRoughness = vars.blobRoughness ?? constants.blobRoughness;
      const blobNoiseScale = vars.blobNoiseScale ?? constants.blobNoiseScale;
      const markCount = vars.markCount ?? constants.markCount;
      const markLength = vars.markLength ?? constants.markLength;
      const markCurviness = vars.markCurviness ?? constants.markCurviness;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const edgeFalloff = vars.edgeFalloff ?? constants.edgeFalloff;
      const swirlStrength = vars.swirlStrength ?? constants.swirlStrength;
      const noiseVariation = vars.noiseVariation ?? constants.noiseVariation;

      // Use only first 2 colors from palette
      const fullPalette = (vars.penColors ?? constants.penColors) as DotPen[];
      const palette = fullPalette.length > 0 ? fullPalette : all("staedtlerPens");
      const color1 = palette[0];
      const color2 = palette[Math.min(1, palette.length - 1)];

      const blobOffX = p.random(1000);
      const blobOffY = p.random(1000);
      const flowOffX = p.random(5000);
      const flowOffY = p.random(5000);

      p.strokeWeight(strokeWeight);
      p.strokeCap(p.ROUND);
      p.noFill();

      function getBlobRadius(a: number): number {
        const noiseVal = p.noise(
          blobOffX + Math.cos(a) * blobNoiseScale,
          blobOffY + Math.sin(a) * blobNoiseScale,
        );
        return blobRadius * (1 + (noiseVal - 0.5) * 2 * blobRoughness);
      }

      let drawn = 0;
      const maxAttempts = markCount * 8;
      let attempts = 0;

      while (drawn < markCount && attempts < maxAttempts) {
        attempts++;

        // Sample point near center (bias toward center using sqrt for uniform area sampling)
        const r = Math.sqrt(p.random()) * blobRadius * 1.15;
        const a = p.random(Math.PI * 2);
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;

        // Check if inside blob
        const blobR = getBlobRadius(a);
        if (r >= blobR) continue;

        // Edge falloff: reduce density near boundary
        const normalizedDist = r / blobR;
        const density = Math.pow(1 - normalizedDist * edgeFalloff, 0.5);
        if (p.random() > density) continue;

        // Direction: blend between tangential (swirl) and noise
        // Tangential direction at this point (perpendicular to radial)
        const tangentialAngle = a + Math.PI / 2;

        // Noise-based direction variation
        const noiseAngle =
          p.noise(flowOffX + px * 0.004, flowOffY + py * 0.004) * Math.PI * 2;

        // Blend: swirlStrength controls how much we follow the tangent vs noise
        const markAngle =
          tangentialAngle * swirlStrength +
          noiseAngle * (1 - swirlStrength) +
          p.random(-0.3, 0.3) * noiseVariation;

        const dirX = Math.cos(markAngle);
        const dirY = Math.sin(markAngle);
        const perpX = -dirY;
        const perpY = dirX;

        // Color: use color1 for inner half, color2 for outer half, with some noise
        const useColor1 = normalizedDist < 0.5 + p.random(-0.2, 0.2);
        setStroke(useColor1 ? color1 : color2, p);

        // Draw curved mark
        const numPts = 5;
        const pts: { x: number; y: number }[] = [];
        for (let s = 0; s <= numPts; s++) {
          const t = s / numPts - 0.5; // -0.5 to 0.5
          const along = t * markLength;
          // Curviness: sinusoidal perpendicular deviation
          const curve =
            Math.sin((s / numPts) * Math.PI) *
            p.random(-markCurviness, markCurviness);
          pts.push({
            x: px + dirX * along + perpX * curve,
            y: py + dirY * along + perpY * curve,
          });
        }

        p.beginShape();
        p.curveVertex(pts[0].x, pts[0].y); // duplicate first as control
        for (const pt of pts) p.curveVertex(pt.x, pt.y);
        p.curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].y); // duplicate last as control
        p.endShape();

        drawn++;
      }
    };
  };

export default squiggle01Sketch;
