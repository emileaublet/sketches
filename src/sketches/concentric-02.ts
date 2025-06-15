import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";

import { staedtlerPens } from "@/pens";
const pensSubset = [
  staedtlerPens[2],
  staedtlerPens[4],
  staedtlerPens[9],
  staedtlerPens[0],
];

export const meta: Meta = {
  id: "concentric-02",
  title: "Concentric 02",
  description: "Multiple concentric zigzag (wobbly) circles using noise",
  thumbnail: "/concentric-02.png",
};

const concentricSketch = (p: p5SVG) => {
  const layers = 120;
  const minPoints = 50;
  const maxPoints = 800;
  const maxRadius = 240;
  const noiseScale = 0.15;
  const maxZigzagDepth = 10;

  p.setup = () => {
    p.createCanvas(600, 600, p.SVG);
    p.colorMode(p.RGB);
    p.angleMode(p.DEGREES);
    p.noFill();
    p.noLoop();

    const centerX = p.width / 2;
    const centerY = p.height / 2;

    for (let layer = 1; layer <= layers; layer++) {
      const color = pensSubset[Math.floor(p.random(pensSubset.length))];
      p.stroke(color);
      const t = layer / layers;
      const eased = t * t * 2 + 0.1;

      const baseRadius = t * maxRadius;
      const currentZigzagDepth = eased * maxZigzagDepth;

      const points = Math.floor(p.lerp(minPoints, maxPoints, t));
      const rotation = p.random(360);

      p.beginShape();
      for (let i = 0; i < points; i++) {
        const angle = (360 / points) * i + rotation;
        const noiseVal = p.noise(layer * 100 + i * noiseScale);
        const offset = p.map(
          noiseVal,
          0,
          1,
          -currentZigzagDepth,
          currentZigzagDepth
        );
        const r = baseRadius + offset;

        const x = centerX + r * p.cos(angle);
        const y = centerY + r * p.sin(angle);

        p.vertex(x, y);
      }
      p.endShape(p.CLOSE);
    }
  };
};

export default concentricSketch;
