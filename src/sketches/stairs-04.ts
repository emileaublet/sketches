import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import {
  BaseConstants,
  LineConstants,
  PathConstants,
  PatternConstants,
} from "../utils/constants";
import { calculateDrawArea } from "@/utils/drawingArea";
import {
  calculatePathDistances,
  findPathSegmentIndex as binarySearchIndex,
} from "@/utils/pathUtils";

export const meta: Meta = {
  id: "stairs-04",
  title: "Stairs 04",
  description: "A stairs-like pattern",
  thumbnail: "/stairs-04.png",
};

type Constants = BaseConstants &
  LineConstants &
  PathConstants &
  PatternConstants & {
    targetGridSize: number;
    gridCoverage: number;
    allowTwoStepJumps: boolean;
    maxDeadEnds: number;
  };

export const constants: Constants = {
  // Canvas dimensions
  width: 700,
  height: 850,
  marginX: 80,
  marginY: 80,

  // Basic settings
  debug: false,
  rotate: 0,

  // Line properties
  lineThickness: 0.5,
  lineLengthMin: 8,
  lineLengthMax: 14,
  linesPerSegment: 1,

  // Grid settings
  targetGridSize: 12,
  gridCoverage: 0.8,
  allowTwoStepJumps: true,
  maxDeadEnds: 5,

  // Path properties
  cornerRadius: 0.3,
  bezierSteps: 10,

  // Pattern generation
  insideRangeProbability: 0.7,
  outsideRangeProbability: 0.3,
  drawPatternLengthMin: 5,
  drawPatternLengthMax: 15,
  skipPatternLengthMin: 2,
  skipPatternLengthMax: 8,
  maxGapInPattern: 3,
};

const stairsSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    let path: any[] = [];

    let lineThickness = vars.lineThickness ?? constants.lineThickness;
    let lineLen = p.random(
      vars.lineLengthMin ?? constants.lineLengthMin,
      vars.lineLengthMax ?? constants.lineLengthMax
    );
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noLoop: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
      });

      generateRandomPath();

      const rotateValue = vars.rotate ?? constants.rotate;
      if (rotateValue) {
        // rotate the path if needed
        const angle = (rotateValue * Math.PI) / 180;
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        path = path.map((v) => {
          const dx = v.x - centerX;
          const dy = v.y - centerY;
          const r = Math.sqrt(dx * dx + dy * dy);
          const a = Math.atan2(dy, dx) + angle;
          return {
            x: centerX + r * Math.cos(a),
            y: centerY + r * Math.sin(a),
          };
        });
      }

      p.noFill();

      // draw the path for debugging
      if (vars.debug ?? constants.debug) {
        p.stroke("yellow");
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        // Add first point twice for curveVertex
        if (path.length > 0) {
          p.curveVertex(path[0].x, path[0].y);
        }
        for (let v of path) {
          p.curveVertex(v.x, v.y);
        }
        // Add last point twice for curveVertex
        if (path.length > 0) {
          p.curveVertex(path[path.length - 1].x, path[path.length - 1].y);
        }
        p.endShape();
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
      let index = 0;
      for (let color of colors) {
        drawPath(color, index, colors.length);
        index++;
      }
    };

    function generateRandomPath() {
      // Advanced Hamiltonian path generation inspired by Roni Kaufman
      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);
      // Calculate optimal step size to maximize grid utilization
      const targetGridSize = vars.targetGridSize ?? constants.targetGridSize;
      const stepLenByWidth = drawW / targetGridSize;
      const stepLenByHeight = drawH / targetGridSize;
      const stepLen = Math.min(stepLenByWidth, stepLenByHeight);
      const M = Math.floor(drawW / stepLen); // cols - use full width
      const N = Math.floor(drawH / stepLen); // rows - use full height

      // Initialize path and current position
      let pathCells: [number, number, [number, number][]][] = [];
      let currentPos: [number, number] = [
        Math.floor(p.random(M)),
        Math.floor(p.random(N)),
      ];

      // Helper functions from Roni's code
      function possibleNeighbors([i, j]: [number, number]): [number, number][] {
        let possibilities: [number, number][] = [];
        if (j < N - 1) possibilities.push([i, j + 1]);
        if (j > 0) possibilities.push([i, j - 1]);
        if (i < M - 1) possibilities.push([i + 1, j]);
        if (i > 0) possibilities.push([i - 1, j]);
        return possibilities;
      }

      function inArray(
        [i, j]: [number, number],
        arr: [number, number][] | [number, number, [number, number][]][]
      ): boolean {
        for (let e of arr) {
          if (e[0] == i && e[1] == j) return true;
        }
        return false;
      }

      function disjointed(
        arr: [number, number][],
        m: number,
        n: number
      ): boolean {
        if (arr.length >= m * n) return false;

        // choose initial point
        let testPos: [number, number];
        do {
          testPos = [Math.floor(p.random(m)), Math.floor(p.random(n))];
        } while (inArray(testPos, arr));

        // traverse the m*n grid where arr was removed, through a DFS
        let discovered: [number, number][] = [];
        let stack: [number, number][] = [testPos];
        while (stack.length > 0) {
          let pos = stack.pop()!;
          if (!inArray(pos, discovered)) {
            discovered.push(pos);
            let neighbors = possibleNeighbors(pos);
            for (let neigh of neighbors) {
              if (!inArray(neigh, arr)) stack.push(neigh);
            }
          }
        }

        return discovered.length != m * n - arr.length;
      }

      function countDeadends(
        arr: [number, number][],
        ignoreMe: [number, number][]
      ): number {
        let count = 0;
        for (let i = 0; i < M; i++) {
          for (let j = 0; j < N; j++) {
            if (!inArray([i, j], arr) && !inArray([i, j], ignoreMe)) {
              let eventualNeighbors = possibleNeighbors([i, j]);
              let neighbors: [number, number][] = [];
              for (let neigh of eventualNeighbors) {
                if (!inArray(neigh, arr)) neighbors.push(neigh);
              }
              if (neighbors.length < 2) {
                count++;
              }
            }
          }
        }
        return count;
      }

      function cursedCorners(arr: [number, number][]): boolean {
        // Relaxed corner detection - only check if we have enough cells to worry about corners
        if (arr.length < M * N * 0.5) return false;

        let corner1 =
          M >= 3 &&
          N >= 3 &&
          !inArray([0, 0], arr) &&
          !inArray([1, 0], arr) &&
          !inArray([0, 1], arr) &&
          !inArray([1, 1], arr) &&
          !inArray([2, 0], arr) &&
          !inArray([0, 2], arr) &&
          inArray([2, 1], arr) &&
          inArray([1, 2], arr) &&
          inArray([2, 2], arr);
        let corner2 =
          M >= 3 &&
          N >= 3 &&
          !inArray([M - 1, 0], arr) &&
          !inArray([M - 2, 0], arr) &&
          !inArray([M - 1, 1], arr) &&
          !inArray([M - 2, 1], arr) &&
          !inArray([M - 3, 0], arr) &&
          !inArray([M - 1, 2], arr) &&
          inArray([M - 3, 1], arr) &&
          inArray([M - 2, 2], arr) &&
          inArray([M - 3, 2], arr);
        let corner3 =
          M >= 3 &&
          N >= 3 &&
          !inArray([M - 1, N - 1], arr) &&
          !inArray([M - 2, N - 1], arr) &&
          !inArray([M - 1, N - 2], arr) &&
          !inArray([M - 2, N - 2], arr) &&
          !inArray([M - 3, N - 1], arr) &&
          !inArray([M - 1, N - 3], arr) &&
          inArray([M - 3, N - 2], arr) &&
          inArray([M - 2, N - 3], arr) &&
          inArray([M - 3, N - 3], arr);
        let corner4 =
          M >= 3 &&
          N >= 3 &&
          !inArray([0, N - 1], arr) &&
          !inArray([1, N - 1], arr) &&
          !inArray([0, N - 2], arr) &&
          !inArray([1, N - 2], arr) &&
          !inArray([2, N - 1], arr) &&
          !inArray([0, N - 3], arr) &&
          inArray([2, N - 2], arr) &&
          inArray([1, N - 3], arr) &&
          inArray([2, N - 3], arr);

        return corner1 || corner2 || corner3 || corner4;
      }

      // Main generation loop with improved persistence
      let maxIterations = M * N * 5; // More iterations allowed
      let iterations = 0;
      let targetCoverage = Math.floor(
        M * N * (vars.gridCoverage ?? constants.gridCoverage)
      );

      while (pathCells.length < targetCoverage && iterations < maxIterations) {
        iterations++;

        let eventualNeighbors = possibleNeighbors(currentPos);
        let [i, j] = currentPos;

        // Add 2-step neighbors when appropriate (Roni's enhancement)
        if (vars.allowTwoStepJumps ?? constants.allowTwoStepJumps) {
          if (
            i < M - 2 &&
            j > 0 &&
            inArray([i + 1, j - 1], pathCells) &&
            inArray([i + 1, j], pathCells) &&
            j < N - 1 &&
            inArray([i + 1, j + 1], pathCells)
          ) {
            eventualNeighbors.push([i + 2, j]);
          }
          if (
            i > 1 &&
            j > 0 &&
            inArray([i - 1, j - 1], pathCells) &&
            inArray([i - 1, j], pathCells) &&
            j < N - 1 &&
            inArray([i - 1, j + 1], pathCells)
          ) {
            eventualNeighbors.push([i - 2, j]);
          }
          if (
            j < N - 2 &&
            i > 0 &&
            inArray([i - 1, j + 1], pathCells) &&
            inArray([i, j + 1], pathCells) &&
            i < M - 1 &&
            inArray([i + 1, j + 1], pathCells)
          ) {
            eventualNeighbors.push([i, j + 2]);
          }
          if (
            j > 1 &&
            i > 0 &&
            inArray([i - 1, j - 1], pathCells) &&
            inArray([i, j - 1], pathCells) &&
            i < M - 1 &&
            inArray([i + 1, j - 1], pathCells)
          ) {
            eventualNeighbors.push([i, j - 2]);
          }
        }

        // Shuffle for randomness
        for (let k = eventualNeighbors.length - 1; k > 0; k--) {
          const randIdx = Math.floor(p.random() * (k + 1));
          [eventualNeighbors[k], eventualNeighbors[randIdx]] = [
            eventualNeighbors[randIdx],
            eventualNeighbors[k],
          ];
        }

        // Smart filtering based on dead-ends and connectivity (relaxed for better coverage)
        let neighbors: [[number, number][], [number, number][]] = [[], []];
        for (let neigh of eventualNeighbors) {
          let projectedPath: [number, number][] = [
            ...pathCells.map((p) => [p[0], p[1]] as [number, number]),
            currentPos,
            neigh,
          ];
          let count = countDeadends(projectedPath, possibleNeighbors(neigh));
          // Relaxed constraints: allow more dead-ends as we get closer to target coverage
          let coverageRatio = pathCells.length / targetCoverage;
          let maxDeadends =
            coverageRatio > 0.7
              ? (vars.maxDeadEnds ?? constants.maxDeadEnds) * 2
              : vars.maxDeadEnds ?? constants.maxDeadEnds;

          if (
            !inArray(neigh, pathCells) &&
            !disjointed(projectedPath, M, N) &&
            count < maxDeadends &&
            !cursedCorners(projectedPath)
          ) {
            neighbors[count]?.push(neigh);
          }
        }
        let flatNeighbors = neighbors.flat();

        // Backtrack if stuck
        while (flatNeighbors.length == 0 && pathCells.length > 0) {
          let previous = pathCells.pop()!;
          currentPos = [previous[0], previous[1]];
          flatNeighbors = previous[2];
        }

        if (flatNeighbors.length > 0) {
          let nextPos = flatNeighbors.shift()!;
          pathCells.push([...currentPos, flatNeighbors] as [
            number,
            number,
            [number, number][]
          ]);
          currentPos = nextPos;
        } else {
          // If completely stuck but haven't reached good coverage, try a random restart
          if (pathCells.length < targetCoverage * 0.5) {
            // Find unvisited cells for restart
            let unvisitedCells: [number, number][] = [];
            for (let i = 0; i < M; i++) {
              for (let j = 0; j < N; j++) {
                if (
                  !inArray(
                    [i, j],
                    pathCells.map((p) => [p[0], p[1]] as [number, number])
                  )
                ) {
                  unvisitedCells.push([i, j]);
                }
              }
            }
            if (unvisitedCells.length > 0) {
              // Jump to a random unvisited cell and continue
              currentPos =
                unvisitedCells[Math.floor(p.random() * unvisitedCells.length)];
            } else {
              break;
            }
          } else {
            // Safety exit if completely stuck
            break;
          }
        }
      }

      // Convert to drawable path - ensure only grid-aligned moves
      let drawnPath: [number, number][] = [];
      for (let k = 0; k < pathCells.length - 1; k++) {
        let p0: [number, number] = [pathCells[k][0], pathCells[k][1]];
        let p1: [number, number] = [pathCells[k + 1][0], pathCells[k + 1][1]];
        drawnPath.push(p0);

        // For 2-step jumps, add intermediate point only if it maintains grid alignment
        let dx = p1[0] - p0[0];
        let dy = p1[1] - p0[1];
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          // Only add intermediate for pure horizontal/vertical 2-step moves
          if (dx !== 0 && dy === 0) {
            // Horizontal 2-step: add one intermediate point
            drawnPath.push([p0[0] + Math.sign(dx), p0[1]]);
          } else if (dy !== 0 && dx === 0) {
            // Vertical 2-step: add one intermediate point
            drawnPath.push([p0[0], p0[1] + Math.sign(dy)]);
          }
          // Skip diagonal or complex jumps to avoid weird angles
        }
      }
      if (pathCells.length > 0) {
        drawnPath.push([
          pathCells[pathCells.length - 1][0],
          pathCells[pathCells.length - 1][1],
        ]);
      }
      drawnPath.push(currentPos);

      // Convert cell path to coordinates
      let gridPoints: { x: number; y: number }[] = [];

      for (let k = 0; k < drawnPath.length; k++) {
        let [i, j] = drawnPath[k];
        let x = marginX + i * stepLen + stepLen / 2;
        let y = marginY + j * stepLen + stepLen / 2;
        gridPoints.push({ x, y });
      }

      // Create rounded path using Dave's Bezier method
      const cornerRadius =
        (vars.cornerRadius ?? constants.cornerRadius) * stepLen;
      path = createBezierRoundedPath(gridPoints, cornerRadius);
    }

    function createBezierRoundedPath(
      points: { x: number; y: number }[],
      radius: number
    ) {
      if (points.length < 3) return points;

      let roundedPath: { x: number; y: number }[] = [];

      // Add the first point as-is (no rounding at start)
      roundedPath.push(points[0]);

      // Process middle points (with rounding)
      for (let i = 1; i < points.length - 1; i++) {
        const a = points[i - 1];
        const b = points[i];
        const c = points[i + 1];

        // Create vectors (ba and bc)
        const baX = a.x - b.x;
        const baY = a.y - b.y;
        const bcX = c.x - b.x;
        const bcY = c.y - b.y;

        // Normalize vectors
        const baLen = Math.sqrt(baX * baX + baY * baY);
        const bcLen = Math.sqrt(bcX * bcX + bcY * bcY);

        if (baLen < 0.1 || bcLen < 0.1) {
          roundedPath.push(b);
          continue;
        }

        const baNormX = baX / baLen;
        const baNormY = baY / baLen;
        const bcNormX = bcX / bcLen;
        const bcNormY = bcY / bcLen;

        // Calculate angle between vectors
        const dot = baNormX * bcNormX + baNormY * bcNormY;
        const theta = Math.acos(Math.max(-1, Math.min(1, dot)));

        // Skip if it's nearly a straight line
        if (theta < 0.1) {
          roundedPath.push(b);
          continue;
        }

        // Calculate maximum radius and clamp
        const distAB = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        const distBC = Math.sqrt((c.x - b.x) ** 2 + (c.y - b.y) ** 2);
        const maxR =
          (Math.min(distAB, distBC) / 2) * Math.abs(Math.sin(theta / 2));
        const cornerR = Math.min(radius, maxR);

        // Calculate distance from corner
        const distance = Math.abs(cornerR / Math.sin(theta / 2));

        // Calculate control points for bezier
        const c1X = b.x + baNormX * distance;
        const c1Y = b.y + baNormY * distance;
        const c2X = b.x + bcNormX * distance;
        const c2Y = b.y + bcNormY * distance;

        // Bezier control point distance (magic number for circular approximation)
        const bezierDist = 0.5523;
        const p1X = c1X - baNormX * 2 * cornerR * bezierDist;
        const p1Y = c1Y - baNormY * 2 * cornerR * bezierDist;
        const p2X = c2X - bcNormX * 2 * cornerR * bezierDist;
        const p2Y = c2Y - bcNormY * 2 * cornerR * bezierDist;

        // Add start point
        roundedPath.push({ x: c1X, y: c1Y });

        // Generate bezier curve points
        const steps = vars.bezierSteps ?? constants.bezierSteps;
        for (let t = 1; t <= steps; t++) {
          const u = t / steps;
          const u2 = u * u;
          const u3 = u2 * u;
          const oneMinusU = 1 - u;
          const oneMinusU2 = oneMinusU * oneMinusU;
          const oneMinusU3 = oneMinusU2 * oneMinusU;

          const x =
            oneMinusU3 * c1X +
            3 * oneMinusU2 * u * p1X +
            3 * oneMinusU * u2 * p2X +
            u3 * c2X;
          const y =
            oneMinusU3 * c1Y +
            3 * oneMinusU2 * u * p1Y +
            3 * oneMinusU * u2 * p2Y +
            u3 * c2Y;

          roundedPath.push({ x, y });
        }
      }

      // Add the last point as-is (no rounding at end)
      roundedPath.push(points[points.length - 1]);

      return roundedPath;
    }

    function drawPath(color: DotPen, index = 0, totalColors = 1) {
      const dists = calculatePathDistances(path);
      let total = dists[dists.length - 1];

      // items must be adjusted to path length
      const linesPerSegment =
        vars.linesPerSegment ?? constants.linesPerSegment ?? 1;
      const items =
        dists.length * p.random(linesPerSegment * 0.75, linesPerSegment * 1.25);

      let offsetMin = 0;
      let offsetMax = items;

      if (index > 0) {
        offsetMin = Math.floor((index / totalColors) * items);
        offsetMax = Math.floor(((index + 1) / totalColors) * items);
      }

      if (index === 0) {
        offsetMin = 0;
        offsetMax = Math.floor(((index + 1) / totalColors) * items);
      }

      const patterns = generatePatterns(items, offsetMin, offsetMax);

      for (let k = 0; k < items; k++) {
        let u = (k + 0.5) / items;
        let target = u * total;

        let idx = binarySearchIndex(dists, target);
        let p0 = path[idx];
        let p1 = path[p.min(idx + 1, path.length - 1)];
        let segLen = dists[idx + 1] - dists[idx] || 1;
        let localT = (target - dists[idx]) / segLen;
        let px = p.lerp(p0.x, p1.x, localT);
        let py = p.lerp(p0.y, p1.y, localT);

        // Calculate direction from path segments, with smoothing for better results
        let dx = p1.x - p0.x;
        let dy = p1.y - p0.y;

        // If the segment is too short, look for a longer span
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          let span = Math.min(5, Math.floor(path.length / 10));
          let backIdx = Math.max(0, idx - span);
          let forwardIdx = Math.min(path.length - 1, idx + span);
          dx = path[forwardIdx].x - path[backIdx].x;
          dy = path[forwardIdx].y - path[backIdx].y;
        }

        // Final fallback
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          dx = 1;
          dy = 0;
        }

        // Calculate simple perpendicular vector (rotate 90° clockwise)
        let perpX = dy; // Simple rotation: x becomes y
        let perpY = -dx; // Simple rotation: y becomes -x

        // Normalize the perpendicular vector
        let perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
        if (perpLen > 0) {
          perpX /= perpLen;
          perpY /= perpLen;
        }

        // random color per line
        setStroke(color, p);
        p.strokeWeight(lineThickness);

        // compute endpoints of the line segment using perpendicular vector
        let x1 = px - (perpX * lineLen) / 2;
        let y1 = py - (perpY * lineLen) / 2;
        let x2 = px + (perpX * lineLen) / 2;
        let y2 = py + (perpY * lineLen) / 2;
        if (patterns[k] === 0) continue;
        p.line(x1, y1, x2, y2);
      }
    }

    const probabilityFactors = {
      insideRange:
        vars.insideRangeProbability ?? constants.insideRangeProbability,
      outsideRange:
        vars.outsideRangeProbability ?? constants.outsideRangeProbability,
    };

    function generatePatterns(
      items: number,
      offsetMin: number,
      offsetMax: number
    ) {
      let patterns: {
        type: "draw" | "skip";
        length: number;
        gap: number;
      }[] = [];
      let itemsLeft = items;
      let lastIsDraw = false;
      while (itemsLeft > 10) {
        let drawing = false;
        if (lastIsDraw) {
          drawing = false;
        } else {
          const distToOffset =
            Math.min(
              Math.abs(patterns.reduce((a, b) => a + b.length, 0) - offsetMin),
              Math.abs(patterns.reduce((a, b) => a + b.length, 0) - offsetMax)
            ) + 1;
          const probDraw = p.map(
            distToOffset,
            0,
            items / 2,
            probabilityFactors.insideRange,
            probabilityFactors.outsideRange
          );
          drawing = p.random() < probDraw;
        }
        let length = Math.floor(
          Math.min(
            p.random(
              drawing
                ? vars.drawPatternLengthMin ?? constants.drawPatternLengthMin
                : vars.skipPatternLengthMin ?? constants.skipPatternLengthMin,
              drawing
                ? vars.drawPatternLengthMax ?? constants.drawPatternLengthMax
                : vars.skipPatternLengthMax ?? constants.skipPatternLengthMax
            ),
            itemsLeft
          )
        );
        patterns.push({
          type: drawing ? "draw" : "skip",
          length,
          gap: !drawing
            ? 0
            : Math.floor(
                p.random(
                  0,
                  (vars.maxGapInPattern ?? constants.maxGapInPattern) + 1
                )
              ),
        });
        itemsLeft -= length;
        lastIsDraw = drawing;
      }

      return patterns.flatMap((p) => {
        if (p.type === "draw") {
          if (p.gap === 0) {
            return Array(p.length).fill(1);
          } else {
            let result = [];
            for (let i = 0; i < p.length; i++) {
              result.push(i % (p.gap + 1) === 0 ? 1 : 0);
            }
            return result;
          }
        } else {
          return Array(p.length).fill(0);
        }
      });
    }
  };

export default stairsSketch;
