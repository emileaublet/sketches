import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setupCanvas } from "@/utils/canvasSetup";
import { generateGridPoints, drawDebugGrid } from "@/utils/gridUtils";
import {
  createBezierRoundedPath,
  drawPath as drawSafePath,
} from "@/utils/pathUtils";
import { drawPerpendicularLines } from "@/utils/linePatterns";
import { drawDebugPoints } from "@/utils/debugUtils";
import { BaseConstants } from "../utils/constants";

export const meta: Meta = {
  id: "stairs-05",
  title: "Stairs 05",
  description: "A new generative sketch",
  thumbnail: "/stairs-05.png",
};

type Constants = BaseConstants & {
  bezierSteps: number;
  numPoints: number;
  gridSize: number;
  radius: number;
  linesPerSegment: number;
  lineThickness: number;
  lineLengthMin: number;
  lineLengthMax: number;
  drawPatternLengthMin: number;
  drawPatternLengthMax: number;
  skipPatternLengthMin: number;
  skipPatternLengthMax: number;
  maxGapInPattern: number;
  insideRangeProbability: number;
  outsideRangeProbability: number;
  linesStartOnPath: boolean;
};

export const constants: Constants = {
  width: 500,
  height: 500,
  marginX: 50,
  marginY: 50,
  bezierSteps: 10,
  numPoints: 12,
  gridSize: 10,
  radius: 25,
  linesPerSegment: 4,
  lineThickness: 0.5,
  lineLengthMin: 8,
  lineLengthMax: 14,
  drawPatternLengthMin: 5,
  drawPatternLengthMax: 15,
  skipPatternLengthMin: 3,
  skipPatternLengthMax: 10,
  maxGapInPattern: 3,
  insideRangeProbability: 0.1,
  outsideRangeProbability: 0.9,
  rotate: 0,
  debug: false,
  linesStartOnPath: false, // true = lines start on path, false = lines centered on path
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
      p.stroke(100, 150, 255); // Light blue color
      p.strokeWeight(1);

      if (vars.debug ?? constants.debug) {
        // show grid (squares) of width / gridSize x height / gridSize
        drawDebugGrid(
          p,
          {
            width: vars.width ?? constants.width,
            height: vars.height ?? constants.height,
            marginX: vars.marginX ?? constants.marginX,
            marginY: vars.marginY ?? constants.marginY,
          },
          vars.gridSize ?? constants.gridSize
        );
      }

      const points = generateGridPoints(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        numPoints: vars.numPoints ?? constants.numPoints,
        centerPoints: false,
      });
      const pathPoints = createBezierRoundedPath(
        points,
        vars.radius ?? constants.radius,
        vars.bezierSteps ?? constants.bezierSteps
      );

      if (vars.debug ?? constants.debug) {
        drawDebugPoints(p, points);
        p.noFill();
        p.stroke("yellow");
        drawSafePath(p, pathPoints);
      }

      const colors: DotPen[] = [
        "lePenPastelPens.rose",
        "lePenPastelPens.yellow",
        "lePenPastelPens.baby_blue",
        "lePenPastelPens.mauve",
        "lePenPastelPens.orange",
        "lePenPens.red",
        "lePenPens.wine",
      ];

      colors.forEach((color, index) => {
        drawPerpendicularLines(
          p,
          pathPoints,
          color,
          {
            linesPerSegment: vars.linesPerSegment ?? constants.linesPerSegment,
            lineThickness: vars.lineThickness ?? constants.lineThickness,
            lineLengthMin: vars.lineLengthMin ?? constants.lineLengthMin,
            lineLengthMax: vars.lineLengthMax ?? constants.lineLengthMax,
            drawPatternLengthMin:
              vars.drawPatternLengthMin ?? constants.drawPatternLengthMin,
            drawPatternLengthMax:
              vars.drawPatternLengthMax ?? constants.drawPatternLengthMax,
            skipPatternLengthMin:
              vars.skipPatternLengthMin ?? constants.skipPatternLengthMin,
            skipPatternLengthMax:
              vars.skipPatternLengthMax ?? constants.skipPatternLengthMax,
            maxGapInPattern: vars.maxGapInPattern ?? constants.maxGapInPattern,
            insideRangeProbability:
              vars.insideRangeProbability ?? constants.insideRangeProbability,
            outsideRangeProbability:
              vars.outsideRangeProbability ?? constants.outsideRangeProbability,
            linesStartOnPath:
              vars.linesStartOnPath ?? constants.linesStartOnPath,
          },
          index,
          colors.length
        );
      });
    };
  };

export default newSketch;
