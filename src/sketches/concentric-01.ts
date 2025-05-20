import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";

export const meta: Meta = {
  id: "concentric-01",
  title: "Concentric 01",
  description: "Concentric circles",
  thumbnail: "/concentric-01.png",
};

const concentricSketch = (p: p5SVG) => {
  p.setup = () => {
    p.createCanvas(500, 500, p.SVG);
    p.colorMode(p.RGB);
    p.angleMode(p.DEGREES);
    p.noFill();
    p.noLoop();

    p.translate(p.width / 2, p.height / 2);

    const segments = 22;

    const colors = [
      p.color(255, 190, 11, 230),
      p.color(251, 86, 7, 230),
      p.color(255, 0, 110, 230),
      p.color(131, 56, 236, 230),
      p.color(58, 134, 255, 230),
    ];

    for (let s = 0; s < segments; s++) {
      const angleStart = p.int(p.random(0, 360));
      const arcSpan = p.int(p.random(15, 45));
      const arcWidth = 3;
      const totalRings = p.int(p.random(40, 60));
      const skipRings = p.int(p.random(0, 30));
      const visibleRings = totalRings - skipRings;
      const col = colors[s % colors.length];

      p.stroke(col);
      p.strokeWeight(0.5);

      p.beginShape();

      for (let r = 0; r < visibleRings; r++) {
        const ringIndex = r + skipRings;
        const radius = 30 + ringIndex * arcWidth;

        if (r % 2 === 0) {
          for (let a = angleStart; a <= angleStart + arcSpan; a++) {
            const x = p.cos(a) * radius;
            const y = p.sin(a) * radius;
            p.vertex(x, y);
          }
        } else {
          for (let a = angleStart + arcSpan; a >= angleStart; a--) {
            const x = p.cos(a) * radius;
            const y = p.sin(a) * radius;
            p.vertex(x, y);
          }
        }
      }

      p.endShape();
    }
  };
};

export default concentricSketch;
