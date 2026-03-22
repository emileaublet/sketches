import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  gridSpacing: number;
  dotCount: number;
  dotSpacing: number;
  dotRadius: number;
  noiseScale: number;
  blobRadius: number;
  blobRoughness: number;
  blobNoiseScale: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "beaded-flow-01",
  title: "Beaded Flow 01",
  description: "Flow field of beaded dot-chain strokes within a noise blob",
  thumbnail: "/beaded-flow-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 560,
  marginX: 40,
  marginY: 40,
  debug: false,
  gridSpacing: 7,
  dotCount: 7,
  dotSpacing: 2.2,
  dotRadius: 0.7,
  noiseScale: 0.003,
  blobRadius: 200,
  blobRoughness: 0.35,
  blobNoiseScale: 1.2,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  gridSpacing: { min: 3, max: 20, step: 1 },
  dotCount: { min: 2, max: 16, step: 1 },
  dotSpacing: { min: 1, max: 6, step: 0.1 },
  dotRadius: { min: 0.3, max: 2.5, step: 0.1 },
  noiseScale: { min: 0.001, max: 0.012, step: 0.001 },
  blobRadius: { min: 50, max: 280, step: 10 },
  blobRoughness: { min: 0, max: 0.8, step: 0.05 },
  blobNoiseScale: { min: 0.3, max: 3, step: 0.1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const beadedFlow01Sketch =
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
      const dotCount = vars.dotCount ?? constants.dotCount;
      const dotSpacing = vars.dotSpacing ?? constants.dotSpacing;
      const dotRadius = vars.dotRadius ?? constants.dotRadius;
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const blobRadius = vars.blobRadius ?? constants.blobRadius;
      const blobRoughness = vars.blobRoughness ?? constants.blobRoughness;
      const blobNoiseScale = vars.blobNoiseScale ?? constants.blobNoiseScale;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      // Independent noise offsets
      const noiseOffX = p.random(1000);
      const noiseOffY = p.random(1000);
      const blobOffX = p.random(1000);
      const blobOffY = p.random(1000);

      const blobR = (angle: number): number => {
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const n = p.noise(
          blobOffX + cosA * blobNoiseScale,
          blobOffY + sinA * blobNoiseScale
        );
        return blobRadius * (1 + (n - 0.5) * 2 * blobRoughness);
      };

      const isInsideBlob = (px: number, py: number): boolean => {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        return dist < blobR(angle);
      };

      p.strokeCap(p.ROUND);

      const startX = marginX;
      const startY = marginY;

      for (let x = startX; x <= startX + drawW; x += gridSpacing) {
        for (let y = startY; y <= startY + drawH; y += gridSpacing) {
          if (!isInsideBlob(x, y)) continue;

          const angle =
            p.noise(noiseOffX + x * noiseScale, noiseOffY + y * noiseScale) *
            p.TWO_PI;

          const color = p.random(colors) as DotPen;
          setStroke(color, p);

          let bx = x;
          let by = y;
          for (let i = 0; i < dotCount; i++) {
            p.ellipse(bx, by, dotRadius * 2, dotRadius * 2);
            // Re-sample the flow angle at the current bead position
            const localAngle =
              p.noise(noiseOffX + bx * noiseScale, noiseOffY + by * noiseScale) *
              p.TWO_PI;
            bx += Math.cos(localAngle) * dotSpacing;
            by += Math.sin(localAngle) * dotSpacing;
            // Stop if the bead exits the draw area
            if (bx < marginX || bx > marginX + drawW || by < marginY || by > marginY + drawH) break;
          }
        }
      }
    };
  };

export default beadedFlow01Sketch;
