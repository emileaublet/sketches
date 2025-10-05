import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";

type Constants = BaseConstants;

export const meta: Meta = {
  id: "concentric-01",
  title: "Concentric 01",
  description: "Concentric circles",
  thumbnail: "/concentric-01.png",
};
export const constants: Constants = {
  width: 500,
  height: 500,
  marginX: 50,
  marginY: 50,
  debug: false,
};

const concentricSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    if (seed !== null) p.randomSeed(seed);
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        colorMode: "RGB",
        angleMode: "DEGREES",
        noFill: true,
        noLoop: true,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        debug: vars.debug ?? constants.debug,
      });

      p.translate(p.width / 2, p.height / 2);

      const segments = 22;

      const colors: DotPen[] = [
        "schneiderMetallicPens.frosted_violet",
        "schneiderMetallicPens.gold",
        "schneiderMetallicPens.polar_blue",
        "schneiderMetallicPens.silver",
      ];

      for (let s = 0; s < segments; s++) {
        const angleStart = p.int(p.random(0, 360));
        const arcSpan = p.int(p.random(15, 45));
        const arcWidth = 3;
        const totalRings = p.int(p.random(40, 60));
        const skipRings = p.int(p.random(0, 30));
        const visibleRings = totalRings - skipRings;
        const col = colors[s % colors.length];

        setStroke(col, p);

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
