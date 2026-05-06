import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { calculateDrawArea } from "@/utils/drawingArea";
import {
  calculatePathDistances,
  findPathSegmentIndex as binarySearchIndex,
} from "@/utils/pathUtils";

export const meta: Meta = {
  id: "stairs-02",
  title: "Stairs 02",
  description: "Some stairs",
  thumbnail: "/stairs-02.png",
};

type Constants = BaseConstants & {
  columns: number;
  lineLengthScale: number;
  itemsDensity: number;
  probInside: number;
  probOutside: number;
  lineThickness: number;
  jitter: number;
  angleJitter: number;
  splitChance: number;
  splitGap: number;
  splitGapVariance: number;
  heightVariance: number;
  heightShape: string;
  heightProb: number;
  columnWidthVariance: number;
  columnGap: number;
  lineLengthVariance: number;
};

export const constants: Constants = {
  width: 550,
  height: 700,
  marginX: 80,
  marginY: 80,
  columns: 20,
  lineLengthScale: 2.0,
  itemsDensity: 4.0,
  probInside: 0.8,
  probOutside: 0.1,
  lineThickness: 0.5,
  jitter: 0,
  angleJitter: 0,
  splitChance: 0,
  splitGap: 0.1,
  splitGapVariance: 0,
  heightVariance: 0.2,
  heightShape: "uniform",
  heightProb: 1.0,
  columnWidthVariance: 0,
  columnGap: 0,
  lineLengthVariance: 0,
  debug: false,
  rotate: 0,
};

export const constantsProps = {
  columns: { min: 2, max: 200, step: 1 },
  lineLengthScale: { min: 0.5, max: 5, step: 0.1 },
  itemsDensity: { min: 1, max: 20, step: 0.5 },
  probInside: { min: 0, max: 1, step: 0.05 },
  probOutside: { min: 0, max: 1, step: 0.05 },
  lineThickness: { min: 0.1, max: 5, step: 0.1 },
  jitter: { min: 0, max: 5, step: 0.1 },
  angleJitter: { min: 0, max: 45, step: 1 },
  splitChance: { min: 0, max: 1, step: 0.05 },
  splitGap: { min: 0.01, max: 0.5, step: 0.01 },
  splitGapVariance: { min: 0, max: 1, step: 0.05 },
  heightVariance: { min: 0, max: 0.8, step: 0.05 },
  heightProb: { min: 0, max: 1, step: 0.05 },
  columnWidthVariance: { min: 0, max: 1, step: 0.05 },
  columnGap: { min: -50, max: 50, step: 1 },
  lineLengthVariance: { min: 0, max: 1, step: 0.05 },
  heightShape: {
    options: [
      "uniform",
      "bell",
      "inverted-bell",
      "ramp-up",
      "ramp-down",
      "sine",
      "triangle",
      "oval",
      "fish",
      "pulse",
      "steps",
      "inverted-sine",
      "inverted-triangle",
      "inverted-oval",
      "inverted-fish",
      "inverted-pulse",
      "inverted-steps",
    ],
  },
};

const stairsSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    let path: any[] = [];

    // Extract constants
    const lineThickness = vars.lineThickness ?? constants.lineThickness;

    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noLoop: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? false,
        zoomLevel: (vars as any).zoomLevel,
      });

      generateRibbonPath();

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
        p.beginShape();
        for (let v of path) {
          p.vertex(v.x, v.y);
        }
        p.endShape();
      }
      const colors: DotPen[] = [
        "staedtlerPens.yellow",
        "staedtlerPens.orange",
        "staedtlerPens.red",
        "staedtlerPensNew.crimson",
        "staedtlerPens.rose",
        "staedtlerPens.violet",
        "staedtlerPensNew.blue",
        "staedtlerPens.navy",
        "staedtlerPens.green",
      ];
      let index = 0;
      for (let color of colors) {
        drawPath(color, index, colors.length);
        index++;
      }
    };

    function generateRibbonPath() {
      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const heightVariance = vars.heightVariance ?? constants.heightVariance;
      const heightShape = vars.heightShape ?? constants.heightShape;
      const heightProb = vars.heightProb ?? constants.heightProb;
      const columnWidthVariance =
        vars.columnWidthVariance ?? constants.columnWidthVariance;
      const columnGap = vars.columnGap ?? constants.columnGap;

      const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);

      const columns = vars.columns ?? constants.columns;

      path = [];

      const topY = marginY;
      const bottomY = p.height - marginY;

      // Calculate variable column widths
      const weights = [];
      for (let i = 0; i < columns; i++) {
        weights.push(
          p.random(1 - columnWidthVariance, 1 + columnWidthVariance),
        );
      }
      const sumWeights = weights.reduce((a, b) => a + b, 0);
      const totalGaps = (columns - 1) * columnGap;
      const availableWidth = drawW - totalGaps;
      const columnWidths = weights.map(
        (w) => (w / sumWeights) * availableWidth,
      );

      let xPositions = [];
      let currentX = marginX;
      for (let i = 0; i < columns; i++) {
        xPositions.push(currentX + columnWidths[i] / 2);
        currentX += columnWidths[i] + columnGap;
      }

      const getVarianceMultiplier = (i: number) => {
        const t = i / (columns - 1);
        switch (heightShape) {
          case "bell":
            return Math.sin(Math.PI * t);
          case "inverted-bell":
            return 1 - Math.sin(Math.PI * t);
          case "ramp-up":
            return t;
          case "ramp-down":
            return 1 - t;
          case "sine":
            return (Math.sin(Math.PI * 4 * t - Math.PI / 2) + 1) / 2;
          case "triangle":
            return 1 - Math.abs(2 * t - 1);
          case "oval":
            return Math.sqrt(1 - Math.pow(2 * t - 1, 2));
          case "fish":
            return Math.sin(Math.PI * t) * (1.5 - t);
          case "pulse":
            return Math.pow(Math.abs(Math.sin(Math.PI * 4 * t)), 4);
          case "steps":
            return Math.floor(t * 6) / 5;
          case "inverted-sine":
            return 1 - (Math.sin(Math.PI * 4 * t - Math.PI / 2) + 1) / 2;
          case "inverted-triangle":
            return Math.abs(2 * t - 1);
          case "inverted-oval":
            return 1 - Math.sqrt(1 - Math.pow(2 * t - 1, 2));
          case "inverted-fish":
            return 1 - Math.sin(Math.PI * t) * (1.5 - t);
          case "inverted-pulse":
            return 1 - Math.pow(Math.abs(Math.sin(Math.PI * 4 * t)), 4);
          case "inverted-steps":
            return 1 - Math.floor(t * 6) / 5;
          case "uniform":
          default:
            return 1;
        }
      };

      const getVerticalOffset = (maxVal: number) => {
        return p.lerp(maxVal, p.random(0, maxVal), heightProb);
      };

      const startMult = getVarianceMultiplier(0);
      let currentY =
        topY + getVerticalOffset(drawH * heightVariance * startMult);

      for (let i = 0; i < columns; i++) {
        const x = xPositions[i];
        const currentColumnWidth = columnWidths[i];
        const mult = getVarianceMultiplier(i);

        // Calculate progressive widths at boundaries
        const prevWidth = i > 0 ? columnWidths[i - 1] : currentColumnWidth;
        const nextWidth =
          i < columns - 1 ? columnWidths[i + 1] : currentColumnWidth;

        const wStart = (prevWidth + currentColumnWidth) / 2;
        const wEnd = (currentColumnWidth + nextWidth) / 2;

        // Start of column (vertical part)
        path.push({ x, y: currentY, w: wStart });

        // End of column (vertical part)
        let nextY;
        if (i % 2 === 0) {
          nextY = bottomY - getVerticalOffset(drawH * heightVariance * mult);
        } else {
          nextY = topY + getVerticalOffset(drawH * heightVariance * mult);
        }
        path.push({ x, y: nextY, w: wEnd });
        currentY = nextY;

        // Arc to next column
        if (i < columns - 1) {
          const nextX = xPositions[i + 1];
          const cxArc = (x + nextX) / 2;
          const arcR = (nextX - x) / 2;

          const wArcStart = wEnd;
          const nextNextWidth =
            i + 1 < columns - 1 ? columnWidths[i + 2] : columnWidths[i + 1];
          const wArcEnd = (columnWidths[i + 1] + nextNextWidth) / 2;

          if (i % 2 === 0) {
            // Bottom arc
            for (let angle = Math.PI; angle >= 0; angle -= 0.1) {
              const arcX = cxArc + arcR * Math.cos(angle);
              const arcY = currentY + arcR * Math.sin(angle);
              const tArc = (Math.PI - angle) / Math.PI;
              const w = p.lerp(wArcStart, wArcEnd, tArc);
              path.push({ x: arcX, y: arcY, w });
            }
          } else {
            // Top arc
            for (let angle = -Math.PI; angle <= 0; angle += 0.1) {
              const arcX = cxArc + arcR * Math.cos(angle);
              const arcY = currentY + arcR * Math.sin(angle);
              const tArc = (angle + Math.PI) / Math.PI;
              const w = p.lerp(wArcStart, wArcEnd, tArc);
              path.push({ x: arcX, y: arcY, w });
            }
          }
        }
      }
    }

    function drawPath(color: DotPen, index = 0, totalColors = 1) {
      const lineLengthVariance =
        vars.lineLengthVariance ?? constants.lineLengthVariance;
      const dists = calculatePathDistances(path);
      let total = dists[dists.length - 1];

      // items must be adjusted to path length
      const itemsDensity = vars.itemsDensity ?? constants.itemsDensity;
      const items = dists.length * itemsDensity;

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
        let pw = p.lerp(p0.w, p1.w, localT);

        let aheadIndex = p.min(idx + 3, path.length - 1);
        let ahead = path[aheadIndex];
        let dx = ahead.x - p0.x;
        let dy = ahead.y - p0.y;
        let angle = p.atan2(dy, dx) + p.HALF_PI;

        const lengthScale = vars.lineLengthScale ?? constants.lineLengthScale;
        const currentLineLen =
          (pw / lengthScale) *
          p.random(1 - lineLengthVariance, 1 + lineLengthVariance);

        // Angle Jitter
        const angleJitter = vars.angleJitter ?? constants.angleJitter;
        angle += p.radians(p.random(-angleJitter, angleJitter));

        // random color per line
        setStroke(color, p);
        p.strokeWeight(lineThickness);

        // compute endpoints of the line segment
        const jitter = vars.jitter ?? constants.jitter;
        const c = p.cos(angle);
        const s = p.sin(angle);

        if (patterns[k] === 0) continue;

        const splitChance = vars.splitChance ?? constants.splitChance;
        const splitGap = vars.splitGap ?? constants.splitGap;
        const splitGapVariance =
          vars.splitGapVariance ?? constants.splitGapVariance;

        if (p.random() < splitChance) {
          const currentGap =
            splitGap * p.random(1 - splitGapVariance, 1 + splitGapVariance);
          const gapLen = currentLineLen * currentGap;
          // Segment 1
          const x1 = px - (c * currentLineLen) / 2 + p.random(-jitter, jitter);
          const y1 = py - (s * currentLineLen) / 2 + p.random(-jitter, jitter);
          const x2 = px - (c * gapLen) / 2 + p.random(-jitter, jitter);
          const y2 = py - (s * gapLen) / 2 + p.random(-jitter, jitter);
          // Segment 2
          const x3 = px + (c * gapLen) / 2 + p.random(-jitter, jitter);
          const y3 = py + (s * gapLen) / 2 + p.random(-jitter, jitter);
          const x4 = px + (c * currentLineLen) / 2 + p.random(-jitter, jitter);
          const y4 = py + (s * currentLineLen) / 2 + p.random(-jitter, jitter);

          p.line(x1, y1, x2, y2);
          p.line(x3, y3, x4, y4);
        } else {
          let x1 = px - (c * currentLineLen) / 2 + p.random(-jitter, jitter);
          let y1 = py - (s * currentLineLen) / 2 + p.random(-jitter, jitter);
          let x2 = px + (c * currentLineLen) / 2 + p.random(-jitter, jitter);
          let y2 = py + (s * currentLineLen) / 2 + p.random(-jitter, jitter);
          p.line(x1, y1, x2, y2);
        }
      }
    }
    function generatePatterns(
      items: number,
      offsetMin: number,
      offsetMax: number,
    ) {
      const probInside = vars.probInside ?? constants.probInside;
      const probOutside = vars.probOutside ?? constants.probOutside;

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
              Math.abs(patterns.reduce((a, b) => a + b.length, 0) - offsetMax),
            ) + 1;
          const probDraw = p.map(
            distToOffset,
            0,
            items / 2,
            probInside,
            probOutside,
          );
          drawing = p.random() < probDraw;
        }
        let length = Math.floor(
          Math.min(p.random(drawing ? 12 : 6, drawing ? 50 : 30), itemsLeft),
        );
        patterns.push({
          type: drawing ? "draw" : "skip",
          length,
          gap: !drawing ? 0 : Math.floor(p.random(0, 3)),
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
