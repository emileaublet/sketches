import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { createGrid } from "@/utils/gridUtils";
import { BaseConstants, GridConstants } from "../utils/constants";
import { generatePivotPath } from "@/utils/pathGeneration";

export const meta: Meta = {
  id: "nodes-01",
  title: "Nodes 01",
  description: "A grid of nodes",
  thumbnail: "/nodes-01.png",
};

type Constants = BaseConstants &
  GridConstants & {
    numNodes: number;
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
  numNodes: 25,
  debug: false,
  cols: 20,
  rows: 27,
  padding: 1,
  numSegments: 30,
  pivotMin: 200,
  pivotMax: 210,
  relativeMin: 0.2,
  relativeMax: 0.8,
  innerJitterFrac: 0.2,
};

export const nodesSketch =
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

    // define a 4-color palette
    const colors: DotPen[] = [
      "staedtlerPens.teal",
      "staedtlerPens.mauve",
      "staedtlerPens.rose",
      "staedtlerPens.yellow",
    ];

    p.setup = () => {
      setupCanvas(p, {
        width: constants.width,
        height: constants.height,
        seed,
        noFill: true,
        debug: vars.debug ?? constants.debug,
        marginX,
        marginY,
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

        // draw segments with random colors
        for (let i = 1; i < pts.length; i++) {
          const c = p.random(colors);
          setStroke(c, p);
          p.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        }
      }
    };
  };

export default nodesSketch;
