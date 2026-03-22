import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  numFibers: number;
  numObstacles: number;
  obstacleRadius: number;
  influenceRadius: number;
  forceScale: number;
  restoreStrength: number;
  damping: number;
  stepSize: number;
  lineThickness: number;
  colorPasses: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "z-line-disruption-01",
  title: "Line Disruption 01",
  description:
    "Dense vertical fiber lines bent smoothly around circular obstacles using a spring-damper simulation, then restoring to vertical. Multiple color passes.",
  thumbnail: "/z-line-disruption-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  numFibers: 150,
  numObstacles: 3,
  obstacleRadius: 40,
  influenceRadius: 80,
  forceScale: 10,
  restoreStrength: 0.05,
  damping: 0.85,
  stepSize: 2,
  lineThickness: 0.3,
  colorPasses: 2,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  numFibers: { min: 20, max: 400, step: 10 },
  numObstacles: { min: 1, max: 8, step: 1 },
  obstacleRadius: { min: 10, max: 100, step: 5 },
  influenceRadius: { min: 10, max: 150, step: 5 },
  forceScale: { min: 1, max: 30, step: 1 },
  restoreStrength: { min: 0.01, max: 0.2, step: 0.01 },
  damping: { min: 0.7, max: 0.99, step: 0.01 },
  stepSize: { min: 1, max: 6, step: 1 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  colorPasses: { min: 1, max: 4, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const zLineDisruption01 =
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

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      const numFibers = vars.numFibers ?? constants.numFibers;
      const numObstacles = vars.numObstacles ?? constants.numObstacles;
      const obstacleRadius = vars.obstacleRadius ?? constants.obstacleRadius;
      const influenceRadius = vars.influenceRadius ?? constants.influenceRadius;
      const forceScale = vars.forceScale ?? constants.forceScale;
      const restoreStrength = vars.restoreStrength ?? constants.restoreStrength;
      const damping = vars.damping ?? constants.damping;
      const stepSize = vars.stepSize ?? constants.stepSize;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const colorPasses = vars.colorPasses ?? constants.colorPasses;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");

      // Place obstacles once — shared across all color passes
      const obstacles: Array<{ x: number; y: number; r: number }> = [];
      for (let i = 0; i < numObstacles; i++) {
        obstacles.push({
          x: p.random(
            marginX + obstacleRadius,
            marginX + drawW - obstacleRadius
          ),
          y: p.random(
            marginY + obstacleRadius * 2,
            marginY + drawH - obstacleRadius * 2
          ),
          r: obstacleRadius,
        });
      }

      p.strokeWeight(lineThickness);
      p.strokeCap(p.ROUND);
      p.noFill();

      for (let pass = 0; pass < colorPasses; pass++) {
        const color = p.random(colors) as DotPen;
        setStroke(color, p);

        for (let i = 0; i < numFibers; i++) {
          const xBase =
            numFibers > 1
              ? marginX + (i / (numFibers - 1)) * drawW
              : marginX + drawW / 2;

          let x = xBase;
          let xVel = 0;

          p.beginShape();
          for (let y = marginY; y <= marginY + drawH; y += stepSize) {
            let fx = 0;
            for (const obs of obstacles) {
              const dx = x - obs.x;
              const dy = y - obs.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < obs.r + influenceRadius && dist > 0) {
                const strength = Math.max(
                  0,
                  1 - dist / (obs.r + influenceRadius)
                );
                fx += (dx / dist) * strength * forceScale;
              }
            }
            // Spring restore toward xBase
            fx += (xBase - x) * restoreStrength;
            xVel = (xVel + fx) * damping;
            x += xVel;
            p.curveVertex(x, y);
          }
          p.endShape();
        }
      }
    };
  };

export default zLineDisruption01;
