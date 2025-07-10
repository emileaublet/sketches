import { p5SVG } from "p5.js-svg";
import { staedtlerPens } from "@/pens";
import { Meta } from "../types";

export const meta: Meta = {
  id: "distortion-02",
  title: "Distortion 02",
  description: "Distorted lines",
  thumbnail: "/distortion-02.png",
};

const distortionSketch = (seed?: number) => (p: p5SVG) => {
  const canvasXMargin = 120;
  const canvasYMargin = 120;
  const lines = 280;
  const colors = [
    staedtlerPens.violet,
    staedtlerPens.red,
    staedtlerPens.violet,
    staedtlerPens.red,
    staedtlerPens.violet,
    staedtlerPens.red,
    staedtlerPens.violet,
    staedtlerPens.red,
    staedtlerPens.violet,
    staedtlerPens.red,
    staedtlerPens.violet,
    staedtlerPens.red,
    staedtlerPens.violet,
    staedtlerPens.red,
    staedtlerPens.violet,
    staedtlerPens.red,
    staedtlerPens.teal,
    staedtlerPens.teal,
    staedtlerPens.teal,
  ];

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
      const maxYOffset = 0.1 * row + 1;
      // how many zig-zags per row
      const segmentCount = p.floor(p.random(100, 200));

      p.stroke(p.random(colors));

      // segment length spans full draw width
      const segmentLen = drawW / segmentCount;

      drawZigzag(bx, by, segmentLen, segmentCount, maxYOffset);
    }
    drawDots([255, 255, 255, 255]); // white
    drawDots(staedtlerPens.yellow);
  };

  function drawDots(color: [number, number, number, number]) {
    // Add white dots
    const dotCount = p.random(100, 200);
    p.strokeWeight(6);
    p.stroke(...color); // white
    for (let i = 0; i < dotCount; i++) {
      const x = p.random(canvasXMargin, p.width - canvasXMargin);
      const y = p.random(canvasYMargin, p.height - canvasYMargin);
      p.point(x, y);
    }
  }

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
    const xNoise = p.random(-3, 3);
    p.translate(startX + xNoise, startY);

    p.beginShape();
    for (let i = 0; i <= segments; i++) {
      const x = i * segmentLen;
      const y = p.random(-maxYOffset, maxYOffset);
      p.vertex(x, y);

      // ~10% chance to split the line here
      if (p.random() < 0.1 && i < segments - 1) {
        p.endShape();
        p.stroke(p.random(colors)); // pick a new color
        p.beginShape();
        p.vertex(x, y); // continue from the same point
      }
    }
    p.endShape();
    p.pop();
  }
};

export default distortionSketch;
