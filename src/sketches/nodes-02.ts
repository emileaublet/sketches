import { p5SVG } from "p5.js-svg";
import { staedtlerPens } from "@/pens";
import { Meta } from "../types";

export const meta: Meta = {
  id: "nodes-02",
  title: "Nodes 02",
  description: "A grid of nodes",
  thumbnail: "/nodes-02.png",
};

const nodesSketch = (p: p5SVG) => {
  // overall canvas padding (horizontal only)
  const canvasMargin = 120;

  // grid settings
  const cols = 20;
  const rows = 27;
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

  p.setup = () => {
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

    const jR = p.random(-jitterFrac, jitterFrac) * maxR;
    const jA = p.random(p.TWO_PI);
    const cx1 = cx0 + p.cos(jA) * jR;
    const cy1 = cy0 + p.sin(jA) * jR;

    let heading = p.atan2(cy1 - cy0, cx1 - cx0);

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

    const penIndex = p.floor(p.random(8, 11));
    const pen = staedtlerPens[penIndex];

    const chance = p.random();
    if (chance < 0.99) {
      p.stroke(pen);
    } else {
      p.stroke(staedtlerPens[2]);
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
