import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  spiralSpacing: number;
  spiralSpacingJitter: number;
  blobNoiseScale: number;
  blobAmplitude: number;
  tickLengthMin: number;
  tickLengthMax: number;
  tickSpacingMin: number;
  tickSpacingMax: number;
  tickAngleJitter: number;
  tickPerpJitter: number;
  passSpacingJitter: number;
  lineThickness: number;
  decayPower: number;
  colorPasses: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "spiral-01",
  title: "Spiral 01",
  description: "Archimedean spiral with decaying perpendicular tick marks",
  thumbnail: "/spiral-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  spiralSpacing: 8,
  spiralSpacingJitter: 0.5,
  blobNoiseScale: 1.2,
  blobAmplitude: 0.25,
  tickLengthMin: 14,
  tickLengthMax: 24,
  tickSpacingMin: 2,
  tickSpacingMax: 4,
  tickAngleJitter: 0.15,
  tickPerpJitter: 0.5,
  passSpacingJitter: 0.4,
  lineThickness: 0.4,
  decayPower: 0.5,
  colorPasses: 3,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  spiralSpacing: { min: 2, max: 20, step: 0.5 },
  spiralSpacingJitter: { min: 0, max: 2, step: 0.05 },
  blobNoiseScale: { min: 0.2, max: 4, step: 0.1 },
  blobAmplitude: { min: 0, max: 0.8, step: 0.05 },
  tickLengthMin: { min: 1, max: 20, step: 0.5 },
  tickLengthMax: { min: 2, max: 30, step: 0.5 },
  tickSpacingMin: { min: 0.5, max: 10, step: 0.5 },
  tickSpacingMax: { min: 1, max: 15, step: 0.5 },
  tickAngleJitter: { min: 0, max: 1, step: 0.01 },
  tickPerpJitter: { min: 0, max: 3, step: 0.1 },
  passSpacingJitter: { min: 0, max: 2, step: 0.05 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  decayPower: { min: 0.1, max: 3, step: 0.1 },
  colorPasses: { min: 1, max: 5, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const spiralSketch =
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

      const spiralSpacing = vars.spiralSpacing ?? constants.spiralSpacing;
      const spiralSpacingJitter =
        vars.spiralSpacingJitter ?? constants.spiralSpacingJitter;
      const blobNoiseScale = vars.blobNoiseScale ?? constants.blobNoiseScale;
      const blobAmplitude = vars.blobAmplitude ?? constants.blobAmplitude;
      const noiseOffBlobX = p.random(1000);
      const noiseOffBlobY = p.random(1000);
      const tickLengthMin = vars.tickLengthMin ?? constants.tickLengthMin;
      const tickLengthMax = vars.tickLengthMax ?? constants.tickLengthMax;
      const tickSpacingMin = vars.tickSpacingMin ?? constants.tickSpacingMin;
      const tickSpacingMax = vars.tickSpacingMax ?? constants.tickSpacingMax;
      const tickAngleJitter = vars.tickAngleJitter ?? constants.tickAngleJitter;
      const tickPerpJitter = vars.tickPerpJitter ?? constants.tickPerpJitter;
      const passSpacingJitter =
        vars.passSpacingJitter ?? constants.passSpacingJitter;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const decayPower = vars.decayPower ?? constants.decayPower;
      const colorPasses = vars.colorPasses ?? constants.colorPasses;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;
      const maxRadius = Math.min(drawW, drawH) / 2;

      // Archimedean spiral: r = spiralSpacing * theta / (2 * PI)
      // Solve for maxTheta: maxRadius = spiralSpacing * maxTheta / (2 * PI)
      const maxTheta = (maxRadius * 2 * Math.PI) / spiralSpacing;

      // We use a minimum dTheta to avoid infinite density at center
      const minDTheta = 0.05;

      // Clip to drawable area
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.save();
      ctx.beginPath();
      ctx.rect(marginX, marginY, drawW, drawH);
      ctx.clip();

      p.strokeWeight(lineThickness);

      // Draw multiple color passes with phase offsets
      for (let pass = 0; pass < colorPasses; pass++) {
        const phaseOffset = p.random(0, 2 * Math.PI);
        // Per-pass spacing multiplier so ticks from different passes don't align
        const passSpacingMult = 1 + p.random(-passSpacingJitter, passSpacingJitter);

        let theta = 0.5; // start slightly away from center to avoid singularity

        while (theta < maxTheta) {
          // Vary spiral spacing slightly per revolution
          const localSpacing =
            spiralSpacing +
            p.random(-spiralSpacingJitter, spiralSpacingJitter);
          const baseR = (localSpacing * theta) / (2 * Math.PI);

          // Blob noise: perturb radius based on angle for organic, non-circular shape
          const blobNoise = p.noise(
            noiseOffBlobX + Math.cos(theta + phaseOffset) * blobNoiseScale,
            noiseOffBlobY + Math.sin(theta + phaseOffset) * blobNoiseScale,
          );
          const r = baseR * (1 + (blobNoise - 0.5) * 2 * blobAmplitude);

          // Position on spiral
          const x = cx + r * Math.cos(theta + phaseOffset);
          const y = cy + r * Math.sin(theta + phaseOffset);

          // Normalized distance from center
          const t = Math.min(r / maxRadius, 1);

          // Decay: long ticks at center, short at edges
          const decay = Math.pow(1 - t, decayPower);
          // Randomized tick length within min/max range, modulated by decay
          const baseLen = p.random(tickLengthMin, tickLengthMax);
          const len = baseLen * decay;

          // Perpendicular to the spiral at this point
          // Tangent of Archimedean spiral: dr/dtheta = spiralSpacing / (2*PI)
          const drDtheta = spiralSpacing / (2 * Math.PI);
          const tx =
            drDtheta * Math.cos(theta + phaseOffset) -
            r * Math.sin(theta + phaseOffset);
          const ty =
            drDtheta * Math.sin(theta + phaseOffset) +
            r * Math.cos(theta + phaseOffset);
          const tMag = Math.sqrt(tx * tx + ty * ty);

          if (tMag > 0 && len > 0.2) {
            // Perpendicular (normal) direction
            const nx = -ty / tMag;
            const ny = tx / tMag;

            // Small random angle offset so ticks aren't perfectly perpendicular
            const angleOff = p.random(-tickAngleJitter, tickAngleJitter);
            const cosA = Math.cos(angleOff);
            const sinA = Math.sin(angleOff);
            const rnx = nx * cosA - ny * sinA;
            const rny = nx * sinA + ny * cosA;

            // Perpendicular jitter shifts tick along the normal
            const perpShift = p.random(-tickPerpJitter, tickPerpJitter);
            const jx = x + rnx * perpShift;
            const jy = y + rny * perpShift;

            // Color cycles through palette based on theta
            const colorIdx =
              Math.floor(
                ((theta / (2 * Math.PI)) * colors.length + pass) %
                  colors.length
              );
            setStroke(colors[colorIdx], p);

            // Draw tick mark centered on (jittered) spiral point
            const halfLen = len / 2;
            p.line(
              jx - rnx * halfLen,
              jy - rny * halfLen,
              jx + rnx * halfLen,
              jy + rny * halfLen
            );
          }

          // Adaptive step: spacing increases naturally with radius
          // Randomized tick spacing within min/max, scaled by per-pass multiplier
          const tickSpacing = p.random(tickSpacingMin, tickSpacingMax) * passSpacingMult;
          const dTheta = Math.max(minDTheta, tickSpacing / Math.max(r, 1));
          theta += dTheta;
        }
      }

      ctx.restore();
    };
  };

export default spiralSketch;
