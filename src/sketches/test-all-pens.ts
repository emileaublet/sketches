import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { gellyRollPens, schneiderMetallicPens, staedtlerPens } from "@/pens";

export const meta: Meta = {
  id: "test-all-pens",
  title: "Test All Pens",
  description: "Test all pens from all pen sets",
  thumbnail: "/nodes-03.png",
  hidden: true, // Hide this sketch from the main list
};

// Create an array of all pens from all sets
const allPens = [
  ...Object.entries(staedtlerPens).map(([name, color]) => ({
    color,
    name: `Staedtler ${name}`,
    set: "Staedtler",
    opaque: false,
  })),
  ...Object.entries(schneiderMetallicPens).map(([name, color]) => ({
    color,
    name: `Schneider ${name}`,
    set: "Schneider",
    opaque: true,
  })),
  ...Object.entries(gellyRollPens).map(([name, color]) => ({
    color,
    name: `Gelly Roll ${name}`,
    set: "Gelly Roll",
    opaque: true,
  })),
];

const nodesSketch = (seed: number | null, vars: any) => (p: p5SVG) => {
  const margin = 0;
  const penTestWidth = 280;
  const penTestHeight = 50;
  const spacing = 4;
  const cols = 3;

  p.setup = () => {
    // Calculate canvas height based on number of pens
    if (seed !== null) p.randomSeed(seed);
    const rows = Math.ceil(allPens.length / cols);
    const canvasHeight =
      margin * 2 + rows * (penTestHeight + spacing) - spacing;

    p.createCanvas(1000, canvasHeight, p.SVG);
    p.noLoop();
  };

  p.draw = () => {
    drawPenTests();
  };

  const drawPenTests = () => {
    p.textSize(18);
    p.textAlign(p.LEFT, p.CENTER);

    allPens.forEach((penInfo, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      p.fill(penInfo.opaque ? 0 : 255);
      p.noStroke();
      p.rect(
        margin + col * (penTestWidth + spacing),
        margin + row * (penTestHeight + spacing),
        penTestWidth,
        penTestHeight
      );

      const x = margin + col * (penTestWidth + spacing);
      const y = margin + row * (penTestHeight + spacing);

      // Color swatch
      p.fill(
        penInfo.color[0],
        penInfo.color[1],
        penInfo.color[2],
        penInfo.color[3] || 255
      );
      p.noStroke();
      p.rect(x + 10, y + 10, 30, 30);

      p.noStroke();
      p.text(penInfo.name, x + 50, y + 25);
    });
  };
};

export default nodesSketch;
