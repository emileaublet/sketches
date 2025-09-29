import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";

export const meta: Meta = {
  id: "stairs-03",
  title: "Stairs 03",
  description: "Some stairs",
  thumbnail: "/stairs-03.png",
};

export const constants = {
  width: 550,
  height: 700,
  marginX: 80,
  marginY: 80,
  loops: [18, 22],
  debug: false,
  rotate: 0,
  spiralRoundness: 1, // 0 = square, 1 = full circle
};

const stairsSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    if (seed !== null) p.randomSeed(seed);
    let path: any[] = [];

    let lineThickness = 0.5; // strokeWeight
    let lineLen = p.random(8, 14); // length of each line
    p.setup = () => {
      p.createCanvas(
        vars.width ?? constants.width,
        vars.height ?? constants.height,
        p.SVG
      );
      p.noLoop();

      generateSwirlPath();

      if (vars.rotate ?? constants.rotate) {
        // rotate the path if needed
        const angle = ((vars.rotate ?? constants.rotate) * Math.PI) / 180;
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
        p.background(255);
        p.stroke(0, 50, 100);
        p.strokeWeight(1);
        p.beginShape();
        for (let v of path) {
          p.vertex(v.x, v.y);
        }
        p.endShape();
      }
      const colors: DotPen[] = [
        "lePenPastelPens.yellow",
        "lePenPastelPens.rose",
        "lePenPastelPens.mauve",
        "lePenPastelPens.orange",
        "lePenPens.red",
        "lePenPens.wine",
        "lePenPens.blue",
      ];
      let index = 0;
      for (let color of colors) {
        drawPath(color, index, colors.length);
        index++;
      }
    };

    function generateSwirlPath() {
      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;

      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      // Set up swirl parameters
      const centerX = p.width / 2;
      const centerY = p.height / 2;
      const maxRadius = Math.min(drawW, drawH) / 2 - 20;
      const spirals = p.random(
        vars.loops ? vars.loops[0] : constants.loops[0],
        vars.loops ? vars.loops[1] : constants.loops[1]
      );
      const totalAngle = spirals * 2 * Math.PI;

      // For consistent spacing, use Archimedean spiral: r = a * θ
      const spiralSpacing = maxRadius / totalAngle; // This ensures consistent spacing
      const steps = Math.floor(totalAngle / 0.02); // High resolution for smooth curve

      // set lineLen dynamically based on spirals
      lineLen = p.random(
        Math.max(6, 60 / spirals),
        Math.min(12, 120 / spirals)
      );
      path = [];

      // Generate Archimedean spiral path from center outward
      const roundness = vars.spiralRoundness ?? constants.spiralRoundness;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = t * totalAngle;
        const radius = spiralSpacing * angle; // Linear relationship for consistent spacing

        // Add subtle noise only to create slight organic variation without disrupting spacing
        const noiseRadius = radius + p.noise(angle * 0.005) * 5 - 0.25;

        // Calculate position based on roundness parameter
        let x, y;

        if (roundness === 1) {
          // Full circle (original)
          x = centerX + Math.cos(angle) * noiseRadius;
          y = centerY + Math.sin(angle) * noiseRadius;
        } else {
          // Use superellipse formula for smooth square-to-circle transition
          // x^n + y^n = r^n where n controls the shape
          const n = 2 + (1 - roundness) * 6; // n=2 is circle, n=8+ is square-like

          // Generate superellipse points
          const cosAngle = Math.cos(angle);
          const sinAngle = Math.sin(angle);

          // Superellipse parametric equations with smooth transitions
          const signCos = cosAngle >= 0 ? 1 : -1;
          const signSin = sinAngle >= 0 ? 1 : -1;

          const superX =
            signCos * Math.pow(Math.abs(cosAngle), 2 / n) * noiseRadius;
          const superY =
            signSin * Math.pow(Math.abs(sinAngle), 2 / n) * noiseRadius;

          x = centerX + superX;
          y = centerY + superY;
        }

        path.push({ x, y });
      }
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
