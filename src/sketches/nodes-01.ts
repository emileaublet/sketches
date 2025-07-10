import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";

export const meta: Meta = {
  id: "nodes-01",
  title: "Nodes 01",
  description: "A grid of nodes",
  thumbnail: "/nodes-01.png",
};

const nodesSketch = (seed?: number) => (p: p5SVG) => {
  // overall canvas padding (horizontal only)
  const canvasMargin = 120;

  // grid settings
  const cols = 14;
  const rows = 17;
  const padding = 1;

  // pivot-path settings
  const numSegments = 30;
  const pivotMin = 200;
  const pivotMax = 210;

  // length scaling (fractions of cell size)
  const relativeMin = 0.2;
  const relativeMax = 0.8;

  // how much to jitter start away from perfect center
  const innerJitterFrac = 0.05;

  // define a 4-color paconstte
  const colors = ["#007BFF", "#FF4081", "#FF5722", "#5E35B1"];

  p.setup = () => {
    if (seed !== undefined) p.randomSeed(seed);
    p.createCanvas(700, 850, p.SVG);
    p.strokeWeight(1);
    p.noFill();

    // available width after side-margins
    const drawW = p.width - 2 * canvasMargin;
    // square cells
    const cellW = drawW / cols;
    const cellH = cellW;

    // total grid height
    const gridH = cellH * rows;
    // vertical centering
    const vMargin = (p.height - gridH) / 2;
    const hMargin = canvasMargin;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        // top-left corner of cell
        const baseX = hMargin + i * cellW;
        const baseY = vMargin + j * cellH;

        // inset by per-cell padding
        const bx = baseX + padding;
        const by = baseY + padding;
        const bw = cellW - 2 * padding;
        const bh = cellH - 2 * padding;

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
    const cx0 = bx + bw / 2;
    const cy0 = by + bh / 2;
    const maxR = p.min(bw, bh) / 2;

    // small “inner” jump off center
    const jR = p.random(-jitterFrac, jitterFrac) * maxR;
    const jA = p.random(p.TWO_PI);
    const cx1 = cx0 + p.cos(jA) * jR;
    const cy1 = cy0 + p.sin(jA) * jR;

    let heading = p.atan2(cy1 - cy0, cx1 - cx0);

    // collect points
    const pts = [];
    pts.push({ x: cx0, y: cy0 });
    pts.push({ x: cx1, y: cy1 });

    let x = cx1;
    let y = cy1;
    for (let k = 0; k < steps; k++) {
      let nx, ny;
      do {
        heading += p.radians(p.random(pivotMin, pivotMax));
        const len = p.random(minLength, maxLength);
        nx = x + p.cos(heading) * len;
        ny = y + p.sin(heading) * len;
      } while (nx < bx || nx > bx + bw || ny < by || ny > by + bh);
      pts.push({ x: nx, y: ny });
      x = nx;
      y = ny;
    }

    // draw segments with random colors
    for (let i = 1; i < pts.length; i++) {
      const c = p.random(colors);
      p.stroke(c);
      p.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
  }
};

export default nodesSketch;
