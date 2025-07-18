import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";

export const meta: Meta = {
  id: "distortion-01",
  title: "Distortion 01",
  description: "Distorted lines",
  thumbnail: "/distortion-01.png",
};

const distortionSketch = (seed?: number) => (p: p5SVG) => {
  const canvasXMargin = 120;
  const canvasYMargin = 120;
  const lines = 180;
  const colors = ["#007BFF", "#FF4081", "#FF5722", "#5E35B1"];

  p.setup = () => {
    if (seed !== undefined) p.randomSeed(seed);
    p.createCanvas(700, 850, p.SVG);

    p.strokeWeight(1);
    p.noFill();

    const drawW = p.width - 2 * canvasXMargin;
    const drawH = p.height - 2 * canvasYMargin;
    const cellH = drawH / lines;
    const hMargin = canvasXMargin;
    const vMargin = canvasYMargin;

    for (let row = 0; row < lines; row++) {
      const bx = hMargin + 1;
      const by = vMargin + row * cellH + 1;

      // how “wavy” each line is
      const maxYOffset = 0.2 * row + 1;
      // how many zig-zags per row
      const segmentCount = p.floor(p.random(100, 200));

      // pick a color and set once
      const col = p.random(colors);
      p.stroke(col);

      // segment length spans full draw width
      const segmentLen = drawW / segmentCount;

      drawZigzag(bx, by, segmentLen, segmentCount, maxYOffset);
    }
  };

  /**
   * @param startX     absolute x
   * @param startY     absolute y
   * @param segmentLen horizontal spacing between vertices
   * @param segments   number of segments
   * @param maxYOffset max random vertical perturbation
   */
  function drawZigzag(
    startX: number,
    startY: number,
    segmentLen: number,
    segments: number,
    maxYOffset: number
  ) {
    p.push();
    p.translate(startX, startY);
    p.beginShape();
    for (let i = 0; i <= segments; i++) {
      const x = i * segmentLen;
      const y = p.random(-maxYOffset, maxYOffset);
      p.vertex(x, y);
    }
    p.endShape();
    p.pop();
  }
};

export default distortionSketch;
