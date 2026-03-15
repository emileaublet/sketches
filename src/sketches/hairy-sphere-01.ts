import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";

type Constants = BaseConstants & {
  sphereRadius: number;
  hairCount: number;
  hairLength: number;
  hairLengthVariation: number;
  hairCurviness: number;
  hairSegments: number;
  gravity: number;
  blobiness: number;
};

export const meta: Meta = {
  id: "hairy-sphere-01",
  title: "Hairy Sphere 01",
  description: "A sphere with hairs emanating from its surface",
  thumbnail: "/hairy-sphere-01.png",
};

export const constants: Constants = {
  width: 572,
  height: 762,
  marginX: 80,
  marginY: 80,
  debug: false,
  sphereRadius: 120,
  hairCount: 3000,
  hairLength: 60,
  hairLengthVariation: 5,
  hairCurviness: 0.3,
  hairSegments: 8,
  gravity: 0.5,
  blobiness: 0.3,
};

export const constantsProps = {
  sphereRadius: { min: 40, max: 200, step: 5 },
  hairCount: { min: 500, max: 8000, step: 100 },
  hairLength: { min: 10, max: 150, step: 5 },
  hairLengthVariation: { min: 0, max: 50, step: 5 },
  hairCurviness: { min: 0, max: 1, step: 0.05 },
  hairSegments: { min: 2, max: 20, step: 1 },
  gravity: { min: 0, max: 2, step: 0.05 },
  blobiness: { min: 0, max: 1, step: 0.05 },
};

const hairySphere01Sketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        colorMode: "RGB",
        angleMode: "RADIANS",
        noFill: true,
        noLoop: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      const centerX = p.width / 2;
      const centerY = p.height / 2;

      const sphereRadius = vars.sphereRadius ?? constants.sphereRadius;
      const hairCount = vars.hairCount ?? constants.hairCount;
      const hairLength = vars.hairLength ?? constants.hairLength;
      const hairLengthVariation =
        vars.hairLengthVariation ?? constants.hairLengthVariation;
      const hairCurviness = vars.hairCurviness ?? constants.hairCurviness;
      const hairSegments = vars.hairSegments ?? constants.hairSegments;
      const gravity = vars.gravity ?? constants.gravity;
      const blobiness = vars.blobiness ?? constants.blobiness;

      // Get colors
      const colors = all("staedtlerPens");

      // Generate points evenly distributed on a circle
      const points: { x: number; y: number; nx: number; ny: number }[] = [];
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle for even distribution

      for (let i = 0; i < hairCount; i++) {
        // Use sunflower/Vogel spiral for even distribution on a disc
        const r = Math.sqrt(i / hairCount) * sphereRadius;
        const theta = i * goldenAngle;

        // Position on disc
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        // Random direction for hair (not radial)
        const randomAngle = p.random(0, Math.PI * 2);
        const nx = Math.cos(randomAngle);
        const ny = Math.sin(randomAngle);

        // Apply blobiness using 2D noise to vary radius
        const noiseScale = 2;
        const noiseVal = p.noise(nx * noiseScale + 100, ny * noiseScale + 100);
        // Add random variation on top of the noise
        const randomBump = p.random(-0.15, 0.15) * blobiness;
        const radiusVariation = 1 + (noiseVal - 0.5) * blobiness + randomBump;

        const finalX = x * radiusVariation;
        const finalY = y * radiusVariation;

        points.push({ x: finalX, y: finalY, nx, ny });
      }

      // Draw each hair
      for (const point of points) {
        // Calculate hair length with variation
        const thisHairLength =
          hairLength + p.random(-hairLengthVariation, hairLengthVariation);

        // Hair grows outward from surface along normal
        // Add some random curl/wave to the hair
        const curlOffset = p.random(0, Math.PI * 2);
        const curlFreq = p.random(0.5, 4);
        const curlIntensity = p.random(0.5, 1.5); // Random curl strength per hair

        // Random hair direction offset (makes hairs point slightly off-normal)
        const dirJitterX = p.random(-0.2, 0.2);
        const dirJitterY = p.random(-0.2, 0.2);

        // Normalize the jittered direction (2D)
        const jnx = point.nx + dirJitterX;
        const jny = point.ny + dirJitterY;
        const jLen = Math.sqrt(jnx * jnx + jny * jny);
        const hairDirX = jLen > 0.001 ? jnx / jLen : 0;
        const hairDirY = jLen > 0.001 ? jny / jLen : 1;

        // Build hair path as curved line
        const hairPoints: { x: number; y: number }[] = [];

        for (let s = 0; s <= hairSegments; s++) {
          const t = s / hairSegments;
          const dist = t * thisHairLength;

          // Base position along jittered hair direction
          let hx = point.x + hairDirX * dist;
          let hy = point.y + hairDirY * dist;

          // Add curl perpendicular to the normal (2D tangent)
          const tangentX = -point.ny;
          const tangentY = point.nx;
          const tangentLen = Math.sqrt(
            tangentX * tangentX + tangentY * tangentY,
          );

          if (tangentLen > 0.001) {
            const curl =
              Math.sin(t * Math.PI * curlFreq + curlOffset) *
              hairCurviness *
              curlIntensity *
              dist *
              0.3;
            hx += (tangentX / tangentLen) * curl;
            hy += (tangentY / tangentLen) * curl;
          }

          // Add per-segment random jitter for wispy look
          const segmentJitter = t * 3; // Increases along hair
          hx += p.random(-segmentJitter, segmentJitter);
          hy += p.random(-segmentJitter, segmentJitter);

          // Apply gravity - pulls hair downward (positive Y)
          // Effect increases quadratically along hair length
          const gravityEffect = gravity * t * t * thisHairLength * 0.5;
          hy += gravityEffect;

          // Add to path
          hairPoints.push({
            x: centerX + hx,
            y: centerY + hy,
          });
        }

        // Pick color - vary based on position for visual interest
        const colorIndex = Math.floor(p.random(colors.length));
        setStroke(colors[colorIndex], p);

        // Uniform stroke weight
        p.strokeWeight(0.5);

        // Draw the hair as a smooth curve
        p.beginShape();
        for (const hp of hairPoints) {
          p.curveVertex(hp.x, hp.y);
        }
        // Duplicate first and last for curveVertex
        if (hairPoints.length > 0) {
          p.curveVertex(
            hairPoints[hairPoints.length - 1].x,
            hairPoints[hairPoints.length - 1].y,
          );
        }
        p.endShape();
      }
    };
  };

export default hairySphere01Sketch;
