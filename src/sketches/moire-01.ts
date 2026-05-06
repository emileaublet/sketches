import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  centerOffsetMin: number;
  centerOffsetMax: number;
  ringSpacingMin: number;
  ringSpacingMax: number;
  ringSpacing2Min: number;
  ringSpacing2Max: number;
  lineThickness: number;
  radiusJitter: number;
  vertexJitter: number;
  vertexCount: number;
  passOffsetJitter: number;
  clipRoundness: number;
  showThirdSet: boolean;
  thirdSpacingMin: number;
  thirdSpacingMax: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "moire-01",
  title: "Moiré 01",
  description:
    "Overlapping concentric circles creating moiré interference patterns",
  thumbnail: "/moire-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  centerOffsetMin: 25,
  centerOffsetMax: 35,
  ringSpacingMin: 2.8,
  ringSpacingMax: 3.2,
  ringSpacing2Min: 3.0,
  ringSpacing2Max: 3.4,
  lineThickness: 0.3,
  radiusJitter: 0.15,
  vertexJitter: 0.3,
  vertexCount: 120,
  passOffsetJitter: 0.4,
  clipRoundness: 3,
  showThirdSet: false,
  thirdSpacingMin: 3.8,
  thirdSpacingMax: 4.2,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  centerOffsetMin: { min: 5, max: 150, step: 1 },
  centerOffsetMax: { min: 5, max: 150, step: 1 },
  ringSpacingMin: { min: 1, max: 10, step: 0.1 },
  ringSpacingMax: { min: 1, max: 10, step: 0.1 },
  ringSpacing2Min: { min: 1, max: 10, step: 0.1 },
  ringSpacing2Max: { min: 1, max: 10, step: 0.1 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  radiusJitter: { min: 0, max: 1, step: 0.05 },
  vertexJitter: { min: 0, max: 2, step: 0.05 },
  vertexCount: { min: 36, max: 360, step: 6 },
  passOffsetJitter: { min: 0, max: 2, step: 0.1 },
  clipRoundness: { min: 1, max: 10, step: 0.5 },
  showThirdSet: {},
  thirdSpacingMin: { min: 1, max: 10, step: 0.1 },
  thirdSpacingMax: { min: 1, max: 10, step: 0.1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

/** Draw a ring as a many-sided polygon with optional vertex jitter */
function drawRing(
  p: p5SVG,
  cx: number,
  cy: number,
  radius: number,
  vertexCount: number,
  vertexJitter: number
) {
  p.beginShape();
  for (let v = 0; v <= vertexCount; v++) {
    const a = (v / vertexCount) * Math.PI * 2;
    const jx = vertexJitter > 0 ? p.random(-vertexJitter, vertexJitter) : 0;
    const jy = vertexJitter > 0 ? p.random(-vertexJitter, vertexJitter) : 0;
    const x = cx + Math.cos(a) * radius + jx;
    const y = cy + Math.sin(a) * radius + jy;
    p.vertex(x, y);
  }
  p.endShape();
}

const moireSketch =
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

      if (seed !== null) p.randomSeed(seed);

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const centerOffsetMin =
        vars.centerOffsetMin ?? constants.centerOffsetMin;
      const centerOffsetMax =
        vars.centerOffsetMax ?? constants.centerOffsetMax;
      const ringSpacingMin = vars.ringSpacingMin ?? constants.ringSpacingMin;
      const ringSpacingMax = vars.ringSpacingMax ?? constants.ringSpacingMax;
      const ringSpacing2Min =
        vars.ringSpacing2Min ?? constants.ringSpacing2Min;
      const ringSpacing2Max =
        vars.ringSpacing2Max ?? constants.ringSpacing2Max;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const radiusJitter = vars.radiusJitter ?? constants.radiusJitter;
      const vertexJitterAmt = vars.vertexJitter ?? constants.vertexJitter;
      const vtxCount = vars.vertexCount ?? constants.vertexCount;
      const passOffsetJitter =
        vars.passOffsetJitter ?? constants.passOffsetJitter;
      const clipRoundness = vars.clipRoundness ?? constants.clipRoundness;
      const showThirdSet = vars.showThirdSet ?? constants.showThirdSet;
      const thirdSpacingMin =
        vars.thirdSpacingMin ?? constants.thirdSpacingMin;
      const thirdSpacingMax =
        vars.thirdSpacingMax ?? constants.thirdSpacingMax;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("staedtlerPens");

      const canvasCx = p.width / 2;
      const canvasCy = p.height / 2;

      // Random center offset within min/max range
      const centerOffset = p.random(centerOffsetMin, centerOffsetMax);
      const offsetAngle = p.random(Math.PI * 2);
      const ax = canvasCx + Math.cos(offsetAngle) * centerOffset;
      const ay = canvasCy + Math.sin(offsetAngle) * centerOffset;
      // Misalign pass B: add slight jitter to its center position
      const bOffsetJitterX = p.random(-passOffsetJitter, passOffsetJitter);
      const bOffsetJitterY = p.random(-passOffsetJitter, passOffsetJitter);
      const bx =
        canvasCx - Math.cos(offsetAngle) * centerOffset + bOffsetJitterX;
      const by =
        canvasCy - Math.sin(offsetAngle) * centerOffset + bOffsetJitterY;

      // Max radius: enough to cover entire canvas from either center
      const diagonal = Math.sqrt(p.width * p.width + p.height * p.height);
      const maxRadius = diagonal;

      p.noFill();

      // Clip to a deformed polygon — roughly rectangular but with
      // noise-perturbed edges and slightly rounded corners
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.save();
      ctx.beginPath();

      const clipCx = marginX + drawW / 2;
      const clipCy = marginY + drawH / 2;
      const clipHalfW = drawW / 2;
      const clipHalfH = drawH / 2;
      const noiseOffClip = p.random(1000);
      const clipRoughness = 0.06; // subtle deformation
      const clipPts = 80;

      // Superellipse shape: low exponent = round, high = rectangular
      for (let i = 0; i <= clipPts; i++) {
        const a = (i / clipPts) * Math.PI * 2;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const exp = clipRoundness;
        const superR = Math.pow(
          Math.pow(Math.abs(cosA), exp) + Math.pow(Math.abs(sinA), exp),
          -1 / exp,
        );
        const noiseFactor =
          1 +
          (p.noise(noiseOffClip + Math.cos(a) * 1.5, noiseOffClip + Math.sin(a) * 1.5) - 0.5) *
            2 *
            clipRoughness;
        const px = clipCx + cosA * clipHalfW * superR * noiseFactor;
        const py = clipCy + sinA * clipHalfH * superR * noiseFactor;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();

      // Pick distinct colors spread across the palette
      const colorIdxA = Math.floor(p.random(colors.length));
      const colorIdxB = (colorIdxA + Math.floor(colors.length / 3) + Math.floor(p.random(2))) % colors.length;
      const colorIdxC = (colorIdxB + Math.floor(colors.length / 3) + Math.floor(p.random(2))) % colors.length;

      // Set A: concentric rings from center A
      setStroke(colors[colorIdxA], p);

      const ringSpacingA = p.random(ringSpacingMin, ringSpacingMax);
      const ringsA = Math.ceil(maxRadius / ringSpacingA);
      for (let i = 1; i <= ringsA; i++) {
        const baseR = i * ringSpacingA;
        const r = baseR + p.random(-radiusJitter, radiusJitter);
        p.strokeWeight(lineThickness);
        drawRing(p, ax, ay, r, vtxCount, vertexJitterAmt);
      }

      // Set B: concentric rings from center B with slightly different spacing
      setStroke(colors[colorIdxB], p);

      const ringSpacingB = p.random(ringSpacing2Min, ringSpacing2Max);
      const ringsB = Math.ceil(maxRadius / ringSpacingB);
      for (let i = 1; i <= ringsB; i++) {
        const baseR = i * ringSpacingB;
        const r = baseR + p.random(-radiusJitter, radiusJitter);
        p.strokeWeight(lineThickness);
        drawRing(p, bx, by, r, vtxCount, vertexJitterAmt);
      }

      // Optional set C: third center with misaligned offset and own spacing
      if (showThirdSet) {
        setStroke(colors[colorIdxC], p);

        const cOffsetJitterX = p.random(-passOffsetJitter, passOffsetJitter);
        const cOffsetJitterY = p.random(-passOffsetJitter, passOffsetJitter);
        const cx = canvasCx + cOffsetJitterX;
        const cy = canvasCy + cOffsetJitterY;

        const thirdSpacing = p.random(thirdSpacingMin, thirdSpacingMax);
        const ringsC = Math.ceil(maxRadius / thirdSpacing);
        for (let i = 1; i <= ringsC; i++) {
          const baseR = i * thirdSpacing;
          const r = baseR + p.random(-radiusJitter, radiusJitter);
          p.strokeWeight(lineThickness);
          drawRing(p, cx, cy, r, vtxCount, vertexJitterAmt);
        }
      }

      ctx.restore();
    };
  };

export default moireSketch;
