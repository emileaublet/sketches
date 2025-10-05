import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";

export const meta: Meta = {
  id: "new-sketch-01",
  title: "New Sketch 01",
  description: "A new generative sketch",
  thumbnail: "/new-sketch-01.png",
};

export const constants = {
  width: 500,
  height: 500,
  marginX: 50,
  marginY: 50,
  bezierSteps: 10,
  numPoints: 12,
  gridSize: 10,
  radius: 25,
  linesPerSegment: 4,
  lineThickness: 1,
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
    let path: any[] = [];

    p.setup = () => {
      p.createCanvas(
        vars.width ?? constants.width,
        vars.height ?? constants.height,
        p.SVG
      );

      p.noFill();
      p.noLoop();
      p.smooth();

      // Your sketch code goes here
      drawSketch();
    };

    const drawSketch = () => {
      p.background(255); // White background
      p.stroke(100, 150, 255); // Light blue color
      p.strokeWeight(1);

      if (vars.debug ?? constants.debug) {
        // show grid (squares) of width / gridSize x height / gridSize
        p.stroke(200);
        for (
          let x = vars.marginX;
          x <= (vars.width ?? constants.width) - vars.marginX;
          x +=
            ((vars.width ?? constants.width) - 2 * vars.marginX) /
            (vars.gridSize ?? constants.gridSize)
        ) {
          p.line(
            x,
            vars.marginY,
            x,
            (vars.height ?? constants.height) - vars.marginY
          );
        }
        for (
          let y = vars.marginY;
          y <= (vars.height ?? constants.height) - vars.marginY;
          y +=
            ((vars.height ?? constants.height) - 2 * vars.marginY) /
            (vars.gridSize ?? constants.gridSize)
        ) {
          p.line(
            vars.marginX,
            y,
            (vars.width ?? constants.width) - vars.marginX,
            y
          );
        }
      }

      let numPoints = vars.numPoints ?? constants.numPoints;
      let points: { x: number; y: number }[] = [];

      // Calculate grid size based on numPoints to ensure we have enough cells
      const gridSize = Math.ceil(Math.sqrt(numPoints));
      const cellWidth = (vars.width - 2 * vars.marginX) / gridSize;
      const cellHeight = (vars.height - 2 * vars.marginY) / gridSize;
      const occupiedCells = new Set<string>();

      for (let i = 0; i < numPoints; i++) {
        let attempts = 0;
        let placed = false;

        while (!placed && attempts < 100) {
          // Generate random cell coordinates first
          const cellX = Math.floor(p.random(0, gridSize));
          const cellY = Math.floor(p.random(0, gridSize));
          const cellKey = `${cellX},${cellY}`;

          if (!occupiedCells.has(cellKey)) {
            // Place point anywhere within the selected cell
            const x = vars.marginX + cellX * cellWidth + p.random(0, cellWidth);
            const y =
              vars.marginY + cellY * cellHeight + p.random(0, cellHeight);

            points.push({ x, y });
            occupiedCells.add(cellKey);
            placed = true;
          }
          attempts++;
        }
      }

      if (vars.debug ?? constants.debug) {
        // Draw points
        p.fill(255, 0, 0);
        p.noStroke();
        // draw a circle with index number at each point
        points.forEach((pt, idx) => {
          p.circle(pt.x, pt.y, 20);
          p.fill(0);
          p.textSize(10);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(idx + 1, pt.x, pt.y);
          p.fill(255, 0, 0);
        });
        p.noFill();
        p.stroke(100, 150, 255);
      }
      const pathPoints = createBezierRoundedPath(
        points,
        vars.radius ?? constants.radius
      );

      // Set the path for drawing functions
      path = pathPoints;

      // Draw bezier curve
      p.beginShape();
      for (const pt of pathPoints) {
        if (!isNaN(pt.x) && !isNaN(pt.y) && isFinite(pt.x) && isFinite(pt.y)) {
          p.vertex(pt.x, pt.y);
        }
      }
      p.endShape();

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

        // Skip if it's nearly a straight line or if angle is too small
        if (theta < 0.1 || Math.abs(Math.sin(theta / 2)) < 0.001) {
          roundedPath.push(b);
          continue;
        }

        // Calculate maximum radius and clamp
        const distAB = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        const distBC = Math.sqrt((c.x - b.x) ** 2 + (c.y - b.y) ** 2);
        const maxR =
          (Math.min(distAB, distBC) / 2) * Math.abs(Math.sin(theta / 2));
        const cornerR = Math.min(radius, maxR);

        // Calculate distance from corner - add safety check
        const sinHalfTheta = Math.sin(theta / 2);
        if (Math.abs(sinHalfTheta) < 0.001) {
          roundedPath.push(b);
          continue;
        }
        const distance = Math.abs(cornerR / sinHalfTheta);

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

    function binarySearchIndex(dists: number[], target: number) {
      let lo = 0,
        hi = dists.length - 2;
      while (lo <= hi) {
        let mid = Math.floor((lo + hi) / 2);
        if (dists[mid] <= target && target < dists[mid + 1]) return mid;
        if (dists[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      return Math.max(0, Math.min(dists.length - 2, lo));
    }

    function drawPath(color: DotPen, index = 0, totalColors = 1) {
      let dists = [0];
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        dists[i] = dists[i - 1] + dist;
      }
      let total = dists[dists.length - 1];

      let lineThickness = vars.lineThickness ?? constants.lineThickness;
      let lineLen = p.random(
        vars.lineLengthMin ?? constants.lineLengthMin,
        vars.lineLengthMax ?? constants.lineLengthMax
      );
      // items must be adjusted to path length
      const linesPerSegment = vars.linesPerSegment ?? constants.linesPerSegment;
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
        let x1, y1, x2, y2;

        if (vars.linesStartOnPath ?? constants.linesStartOnPath) {
          // Lines start on the path and extend outward
          x1 = px;
          y1 = py;
          x2 = px + perpX * lineLen;
          y2 = py + perpY * lineLen;
        } else {
          // Lines are centered on the path (original behavior)
          x1 = px - (perpX * lineLen) / 2;
          y1 = py - (perpY * lineLen) / 2;
          x2 = px + (perpX * lineLen) / 2;
          y2 = py + (perpY * lineLen) / 2;
        }

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

export default newSketch;
