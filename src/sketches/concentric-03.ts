import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { all, DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";

type Constants = BaseConstants & {
  ringSpacing: number;
  startRadius: number;
  densityMultiplier: number;
  jitter: number;
};

export const meta: Meta = {
  id: "concentric-03",
  title: "Concentric 03",
  description: "Concentric rings filled with gradient point density",
  thumbnail: "/concentric-03.png",
};

export const constants: Constants = {
  width: 600,
  height: 600,
  marginX: 80,
  marginY: 80,
  debug: false,
  ringSpacing: 30,
  startRadius: 20,
  densityMultiplier: 0.5,
  jitter: 0.5,
};

const concentricSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const ringSpacing = vars.ringSpacing ?? constants.ringSpacing;
    const startRadius = vars.startRadius ?? constants.startRadius;
    const densityMultiplier =
      vars.densityMultiplier ?? constants.densityMultiplier;

    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        colorMode: "RGB",
        angleMode: "DEGREES",
        noFill: true,
        noLoop: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? false,
        zoomLevel: (vars as any).zoomLevel,
      });

      // Calculate available drawing area
      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const size = Math.min(drawW, drawH);

      // Draw one concentric at the center
      const centerX = p.width / 2;
      const centerY = p.height / 2;
      // size determines the max radius for this instance
      const maxRadius = size / 2;

      // Calculate number of rings that fit
      const rings = Math.floor((maxRadius - startRadius) / ringSpacing);

      // Choose one color for all points
      const color = p.random(all("gellyRollPens"));
      drawConcentric(centerX, centerY, rings, color);
    };

    // Function to draw concentric rings at specific coordinates
    const drawConcentric = (
      centerX: number,
      centerY: number,
      rings: number,
      color: DotPen
    ) => {
      setStroke(color, p);

      for (let ring = 0; ring < rings; ring++) {
        const innerRadius = startRadius + ring * ringSpacing;
        const outerRadius = innerRadius + ringSpacing;
        const ringWidth = outerRadius - innerRadius;
        const jitter = vars.jitter ?? constants.jitter;

        // Calculate total ring area
        const ringArea =
          Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);
        const totalPoints = Math.floor(ringArea * densityMultiplier); // Base density

        // Divide ring into sub-bands for gradient effect
        const numSubBands = 20; // More bands = smoother gradient

        for (let subBand = 0; subBand < numSubBands; subBand++) {
          const subInnerRadius =
            innerRadius + (subBand / numSubBands) * ringWidth;
          const subOuterRadius =
            innerRadius + ((subBand + 1) / numSubBands) * ringWidth;

          // t = 0 at outer edge of ring, 1 at inner edge (center of ring)
          const t = (subBand + 0.5) / numSubBands;

          let density;
          if (t <= 0.2) {
            // From outer edge (0) to 20%: dark to light
            density = p.map(t, 0, 0.2, 1.0, 0.3);
          } else {
            // From 20% to inner edge (100%): light to extra light
            density = p.map(t, 0.2, 1.0, 0.3, 0.05);
          }

          // Calculate points for this sub-band
          const numPoints = Math.max(
            1,
            Math.floor((totalPoints / numSubBands) * density)
          );

          // Place points in this sub-band
          for (let i = 0; i < numPoints; i++) {
            const angle = p.random(0, 360);
            const r = p.random(subInnerRadius, subOuterRadius);

            const x = centerX + r * p.cos(angle) + p.random(-jitter, jitter);
            const y = centerY + r * p.sin(angle) + p.random(-jitter, jitter);

            p.line(x, y, x + 0.01, y + 0.01);
          }
        }
      }
    };
  };

export default concentricSketch;
