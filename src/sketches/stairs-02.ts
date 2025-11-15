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
  columns: [number, number];
};

export const constants: Constants = {
  width: 550,
  height: 700,
  marginX: 80,
  marginY: 80,
  columns: [18, 22],
  debug: false,
  rotate: 0,
};

const stairsSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    let path: any[] = [];

    let lineThickness = 0.5; // strokeWeight
    let lineLen = p.random(8, 14); // length of each line
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
        "staedtlerPens.teal",
        "staedtlerPens.red",
        "staedtlerPens.rose",
        "staedtlerPens.orange",
        "staedtlerPens.violet",
        "staedtlerPens.green",
        "staedtlerPens.navy",
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

      const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);

      const columnsGap = 0;
      const columns = p.floor(p.random(vars.columns ?? constants.columns));
      const columnWidth = (drawW - (columns - 2) * columnsGap) / columns;

      lineLen = drawW / columns / p.random(1.5, 2.8);

      path = [];

      const topY = marginY;
      const bottomY = p.height - marginY;

      let xPositions = [];
      let startX = marginX + columnWidth / 2;
      for (let i = 0; i < columns; i++) {
        xPositions.push(startX + i * (columnWidth + columnsGap));
      }

      let lastY = topY + p.random(0, drawH / 2);
      path.push({ x: xPositions[0], y: lastY });
      for (let i = 0; i < columns; i++) {
        const x = xPositions[i];
        const radius = Math.min(columnWidth * 0.5, 15);

        if (i % 2 === 0) {
          //path.push({ x: x, y: bottomY - radius });

          if (i < columns - 1) {
            const cxArc = (x + xPositions[i + 1]) / 2;
            const cyArc =
              bottomY - p.random(0, drawH / p.random(4, 8)) - radius;
            for (let angle = Math.PI; angle >= 0; angle -= 0.03) {
              const arcX = cxArc + radius * Math.cos(angle);
              const arcY = cyArc + radius * Math.sin(angle);
              path.push({ x: arcX, y: arcY });
            }
          }
        } else {
          //path.push({ x: x, y: topY + radius });

          if (i < columns - 1) {
            const lY = topY + p.random(0, drawH / p.random(4, 8));
            const cxArc = (x + xPositions[i + 1]) / 2;
            const cyArc = lY + radius;
            for (let angle = -Math.PI; angle <= 0; angle += 0.03) {
              const arcX = cxArc + radius * Math.cos(angle);
              const arcY = cyArc + radius * Math.sin(angle);
              path.push({ x: arcX, y: arcY });
            }
            lastY = lY;
          }
        }
      }

      const last = columns - 1;
      if (last % 2 === 0) {
        path.push({ x: xPositions[last], y: bottomY - p.random(0, drawH / 2) });
      } else {
        path.push({ x: xPositions[last], y: topY + p.random(0, drawH / 2) });
      }
    }

    function drawPath(color: DotPen, index = 0, totalColors = 1) {
      const dists = calculatePathDistances(path);
      let total = dists[dists.length - 1];

      // items must be adjusted to path length

      const items = dists.length * p.random(3, 5);

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

        let aheadIndex = p.min(idx + 3, path.length - 1);
        let ahead = path[aheadIndex];
        let dx = ahead.x - p0.x;
        let dy = ahead.y - p0.y;
        let angle = p.atan2(dy, dx) + p.HALF_PI;

        // random color per line
        setStroke(color, p);
        p.strokeWeight(lineThickness);

        // compute endpoints of the line segment
        let x1 = px - (p.cos(angle) * lineLen) / 2;
        let y1 = py - (p.sin(angle) * lineLen) / 2;
        let x2 = px + (p.cos(angle) * lineLen) / 2;
        let y2 = py + (p.sin(angle) * lineLen) / 2;
        if (patterns[k] === 0) continue;
        p.line(x1, y1, x2, y2);
      }
    }
    const probabilityFactors = {
      insideRange: 0.8, // Probability multiplier for patterns inside the offset range
      outsideRange: 0.1, // Probability multiplier for patterns outside the offset range
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
          Math.min(p.random(drawing ? 12 : 6, drawing ? 50 : 30), itemsLeft)
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
