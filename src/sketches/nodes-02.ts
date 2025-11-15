import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { createGrid } from "@/utils/gridUtils";
import { BaseConstants, GridConstants } from "../utils/constants";
import { generatePivotPath } from "@/utils/pathGeneration";

export const meta: Meta = {
  id: "nodes-02",
  title: "Nodes 02",
  description: "A grid of nodes",
  thumbnail: "/nodes-02.png",
};

type Constants = BaseConstants &
  GridConstants & {
    numSegments: number;
    pivotMin: number;
    pivotMax: number;
    relativeMin: number;
    relativeMax: number;
    innerJitterFrac: number;
  };

export const constants: Constants = {
  width: 700,
  height: 850,
  marginX: 120,
  marginY: 120,
  debug: false,
  cols: 20,
  rows: 27,
  padding: 1,
  numSegments: 30,
  pivotMin: 200,
  pivotMax: 210,
  relativeMin: 0.2,
  relativeMax: 0.8,
  innerJitterFrac: 0.05,
};

const nodesSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    // overall canvas padding
    const marginX = vars.marginX ?? constants.marginX;
    const marginY = vars.marginY ?? constants.marginY;

    // grid settings
    const cols = vars.cols ?? constants.cols;
    const rows = vars.rows ?? constants.rows;
    const padding = vars.padding ?? constants.padding ?? 0;

    // pivot-path settings
    const numSegments = vars.numSegments ?? constants.numSegments;
    const pivotMin = vars.pivotMin ?? constants.pivotMin;
    const pivotMax = vars.pivotMax ?? constants.pivotMax;

    // length scaling (fractions of cell size)
    const relativeMin = vars.relativeMin ?? constants.relativeMin;
    const relativeMax = vars.relativeMax ?? constants.relativeMax;

    // how much to jitter start away from perfect center
    const innerJitterFrac = vars.innerJitterFrac ?? constants.innerJitterFrac;

    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        debug: vars.debug ?? constants.debug,
        marginX,
        marginY,
        useSVG: vars.useSVG ?? false,
        zoomLevel: (vars as any).zoomLevel,
      });

      const grid = createGrid({
        width: constants.width,
        height: constants.height,
        marginX,
        marginY,
        cols,
        rows,
      });

      for (const cell of grid.cells) {
        // inset by per-cell padding
        const bx = cell.x + padding;
        const by = cell.y + padding;
        const bw = cell.width - 2 * padding;
        const bh = cell.height - 2 * padding;

        const minLen = bw * relativeMin;
        const maxLen = bw * relativeMax;

        randomPivotPath(
          numSegments,
          minLen,
          maxLen,
          bx,
          by,
          bw,
          bh,
          innerJitterFrac
        );
      }
    };

    function randomPivotPath(
      steps: number,
      minLength: number,
      maxLength: number,
      bx: number,
      by: number,
      bw: number,
      bh: number,
      jitterFrac: number
    ) {
      // Generate the pivot path using utility function
      const pts = generatePivotPath(p, {
        steps,
        minLength,
        maxLength,
        boundingBox: { x: bx, y: by, width: bw, height: bh },
        innerJitterFrac: jitterFrac,
        pivotAngleMin: pivotMin,
        pivotAngleMax: pivotMax,
      });

      const chance = p.random();
      if (chance < 0.99) {
        setStroke("staedtlerPens.baby_blue", p);
      } else {
        setStroke("staedtlerPens.red", p);
      }

      p.beginShape();
      p.curveVertex(pts[0].x, pts[0].y); // extra vertex for curve start
      for (const pt of pts) {
        p.curveVertex(pt.x, pt.y);
      }
      p.curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].y); // extra vertex for curve end
      p.endShape();
    }
  };

export default nodesSketch;
