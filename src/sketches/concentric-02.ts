import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";

type Constants = BaseConstants & {
  layers: number;
  minPoints: number;
};

const pensSubset: DotPen[] = [
  "staedtlerPens.orange",
  "staedtlerPens.fuchsia",
  "staedtlerPens.blue",
  "staedtlerPens.yellow",
];

export const meta: Meta = {
  id: "concentric-02",
  title: "Concentric 02",
  description: "Multiple concentric zigzag (wobbly) circles using noise",
  thumbnail: "/concentric-02.png",
};

export const constants: Constants = {
  width: 600,
  height: 600,
  marginX: 60,
  marginY: 60,
  debug: false,
  layers: 120,
  minPoints: 50,
};

const concentricSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const layers = vars.layers ?? constants.layers;
    const minPoints = vars.minPoints ?? constants.minPoints;
    const maxPoints = 800;
    const maxRadius = 240;
    const noiseScale = 0.15;
    const maxZigzagDepth = 10;

    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        colorMode: "RGB",
        angleMode: "DEGREES",
        noFill: true,
        noLoop: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
      });

      const centerX = p.width / 2;
      const centerY = p.height / 2;

      for (let layer = 1; layer <= layers; layer++) {
        const color = pensSubset[Math.floor(p.random(pensSubset.length))];
        setStroke(color, p);
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
