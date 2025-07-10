import { p5SVG } from "p5.js-svg";

export const drawSeedNumber = (p: p5SVG, seed?: number) => {
  if (seed !== undefined) {
    p.push();
    p.fill(128);
    p.textSize(12);
    p.textFont("Courier New");
    p.textAlign(p.RIGHT, p.TOP);
    p.text(seed, p.width - 10, p.height - 10);
    p.pop();
  }
};
