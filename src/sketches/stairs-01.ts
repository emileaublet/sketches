import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";

export const meta: Meta = {
  id: "stairs-01",
  title: "Stairs 01",
  description: "Some stairs",
  thumbnail: "/stairs-01.png",
};

const stairsSketch = (seed?: number) => (p: p5SVG) => {
  const colors = [
    // more saturated light colors
    "#FF5252", // Light Red
    "#69F0AE", // Light Green
    "#40C4FF", // Light Blue
    "#B388FF", // Light Purple
    "#FFFF00", // Light Yellow
    "#FF9100", // Light Orange
    "#18FFFF", // Light Cyan
    "#00E676", // Light Mint
  ];

  p.setup = () => {
    if (seed !== undefined) p.randomSeed(seed);
    p.createCanvas(700, 850, p.SVG);
    p.noFill();

    const lineWidth = 0.5;
    const lineGap = lineWidth * p.random(4, 12);
    p.strokeWeight(lineWidth);

    const marginX = 120;
    const marginY = 120;

    const drawW = p.width - 2 * marginX;
    const drawH = p.height - 2 * marginY;

    const columnsGap = p.random(2, 6);
    const columns = p.floor(p.random(16, 28));
    const columnWidth = (drawW - (columns - 1) * columnsGap) / columns;
    const linesPerColumn = p.floor(drawH / (lineWidth + lineGap));

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < linesPerColumn; j++) {
        const x = marginX + i * (columnWidth + columnsGap);
        const y = marginY + j * (lineWidth + lineGap);
        const shouldRender = p.random() < 0.8;
        if (!shouldRender) continue;
        p.stroke(colors[p.floor(p.random(colors.length))]);
        p.line(x, y, x + columnWidth, y);
      }
    }
  };
};

export default stairsSketch;
