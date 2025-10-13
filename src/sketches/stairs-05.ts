import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setupCanvas } from "@/utils/canvasSetup";
import { generateGridPoints } from "@/utils/gridUtils";
import {
  createBezierRoundedPath,
  drawPath as drawSafePath,
} from "@/utils/pathUtils";
import { drawPerpendicularLines, resetDrawnLines } from "@/utils/linePatterns";
import { drawDebugPoints } from "@/utils/debugUtils";
import { BaseConstants } from "../utils/constants";

export const meta: Meta = {
  id: "stairs-05",
  title: "Stairs 05",
  description: "A new generative sketch",
  thumbnail: "/stairs-05.png",
};

type Constants = BaseConstants & {
  // Path generation
  bezierSteps: number;
  numPoints: number;
  radius: number;
  pathSmoothness: number;

  // Segment configuration
  segmentLengthMin: number;
  segmentLengthMax: number;
  segmentGapMin: number;
  segmentGapMax: number;

  // Line density and appearance
  lineDensityMin: number;
  lineDensityMax: number;
  lineThickness: number;
  lineLengthMin: number;
  lineLengthMax: number;

  // Color zoning
  drawInZone: number;
  drawOutsideZone: number;

  // Options
  linesStartOnPath: boolean;
  avoidIntersections: boolean;
};
export const constants: Constants = {
  width: 500,
  height: 500,
  marginX: 50,
  marginY: 50,
  rotate: 0,

  // Path generation
  bezierSteps: 10,
  numPoints: 12,
  radius: 25,
  pathSmoothness: 80,

  // Segment configuration
  segmentLengthMin: 20,
  segmentLengthMax: 60,
  segmentGapMin: 5,
  segmentGapMax: 15,

  // Line density and appearance
  lineDensityMin: 3,
  lineDensityMax: 8,
  lineThickness: 0.5,
  lineLengthMin: 8,
  lineLengthMax: 14,

  // Color zoning
  drawInZone: 90,
  drawOutsideZone: 10,

  // Options
  linesStartOnPath: false,
  avoidIntersections: true,
  debug: false,
};
const newSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    if (seed !== null) p.randomSeed(seed);

    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        noLoop: true,
        smooth: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
      });

      // Your sketch code goes here
      drawSketch();
    };

    const drawSketch = () => {
      // Reset the drawn lines tracker at the start of each sketch
      resetDrawnLines();

      const points = generateGridPoints(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        numPoints: vars.numPoints ?? constants.numPoints,
        centerPoints: false,
        pathSmoothness: vars.pathSmoothness ?? constants.pathSmoothness,
      });

      const pathPoints = createBezierRoundedPath(
        points,
        vars.radius ?? constants.radius,
        vars.bezierSteps ?? constants.bezierSteps
      );

      // sort points on the grid from top-left to bottom-right
      if (vars.debug ?? constants.debug) {
        drawDebugPoints(p, points);
        p.noFill();
        p.stroke("yellow");
        drawSafePath(p, pathPoints);
      }

      const colors: DotPen[] = [
        "staedtlerPensNew.teal",
        "staedtlerPensNew.yellow",
        "staedtlerPensNew.orange",
        "staedtlerPensNew.red",
        "staedtlerPensNew.blue",
        "staedtlerPensNew.crimson",
        "staedtlerPensNew.brightOrange",
        "staedtlerPensNew.gold",
        "staedtlerPensNew.lightPink",
      ];

      colors.forEach((color, index) => {
        drawPerpendicularLines(
          p,
          pathPoints,
          color,
          {
            segmentLengthMin:
              vars.segmentLengthMin ?? constants.segmentLengthMin,
            segmentLengthMax:
              vars.segmentLengthMax ?? constants.segmentLengthMax,
            segmentGapMin: vars.segmentGapMin ?? constants.segmentGapMin,
            segmentGapMax: vars.segmentGapMax ?? constants.segmentGapMax,
            lineDensityMin: vars.lineDensityMin ?? constants.lineDensityMin,
            lineDensityMax: vars.lineDensityMax ?? constants.lineDensityMax,
            lineThickness: vars.lineThickness ?? constants.lineThickness,
            lineLengthMin: vars.lineLengthMin ?? constants.lineLengthMin,
            lineLengthMax: vars.lineLengthMax ?? constants.lineLengthMax,
            drawInZone: vars.drawInZone ?? constants.drawInZone,
            drawOutsideZone: vars.drawOutsideZone ?? constants.drawOutsideZone,
            linesStartOnPath:
              vars.linesStartOnPath ?? constants.linesStartOnPath,
            avoidIntersections:
              vars.avoidIntersections ?? constants.avoidIntersections,
          },
          index,
          colors.length
        );
      });
    };
  };

export default newSketch;
