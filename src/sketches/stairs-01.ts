import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";

export const meta: Meta = {
  id: "stairs-01",
  title: "Stairs 01",
  description: "Some stairs",
  thumbnail: "/stairs-01.png",
};

export const constants = {
  width: 550,
  height: 700,
  marginX: 80,
  marginY: 80,
  columnsGap: [2, 10],
  columns: [12, 22],
  lineWidth: 0.5,
};

const stairsSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const colors: DotPen[] = [
      "staedtlerPens.yellow",
      "staedtlerPens.orange",
      //"staedtlerPens.red",
      //"staedtlerPens.fuchsia",
      //"staedtlerPens.rose",
      //"staedtlerPens.violet",
      "staedtlerPens.blue",
      "staedtlerPens.teal",
      "staedtlerPens.green",
    ];

    p.setup = () => {
      if (seed !== null) p.randomSeed(seed);
      p.createCanvas(
        vars.width ?? constants.width,
        vars.height ?? constants.height,
        p.SVG
      );
      p.noFill();

      const lineWidth = vars.lineWidth ?? constants.lineWidth;
      p.strokeWeight(lineWidth);

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;

      const drawW = p.width - 2 * marginX;

      const columnsGap = p.random(vars.columnsGap ?? constants.columnsGap);
      const columns = p.floor(p.random(vars.columns ?? constants.columns));
      //const columnsGap = 5;
      //const columns = 20;
      const columnWidth = (drawW - (columns - 1) * columnsGap) / columns;

      for (let c = 0; c < colors.length; c++) {
        for (let i = 0; i < columns; i++) {
          const x = marginX + i * (columnWidth + columnsGap);
          const availableHeight = p.height - 2 * marginY;

          // Pre-generate rectangles to fill the column
          const rectangles = [];
          let totalHeight = 0;

          // Generate rectangles until we have enough to fill the column
          while (totalHeight < availableHeight) {
            const columnPos = i / (columns - 1);
            const colorPos = c / (colors.length - 1);
            const colorAndColumnDiff = Math.abs(columnPos - colorPos);

            // Decide whether to skip or render, based on color and column position
            // Close positions = high render probability, far positions = low render probability
            const renderProbability = Math.max(
              0.08,
              1 - colorAndColumnDiff * 1.5
            );
            const shouldRender = p.random() < renderProbability;

            if (shouldRender) {
              const rectHeight = p.random(10, 100);
              rectangles.push({ type: "rect", height: rectHeight });
              totalHeight += rectHeight;
            } else {
              const gap = p.random(2, 8);
              rectangles.push({ type: "gap", height: gap });
              totalHeight += gap;
            }

            // Add spacing
            const spacing = p.random(5, 30);
            rectangles.push({ type: "spacing", height: spacing });
            totalHeight += spacing;
          }

          // Shuffle the rectangles to randomize their order
          for (let j = rectangles.length - 1; j > 0; j--) {
            const k = p.floor(p.random() * (j + 1));
            [rectangles[j], rectangles[k]] = [rectangles[k], rectangles[j]];
          }

          // Draw the shuffled rectangles, adjusting to fit exactly
          let currentY = marginY;
          let remainingHeight = availableHeight;

          for (let j = 0; j < rectangles.length && remainingHeight > 0; j++) {
            const item = rectangles[j];
            const height = Math.min(item.height, remainingHeight);

            if (item.type === "rect") {
              drawHorizontalLinesWithinRectangle(
                x,
                currentY,
                columnWidth,
                height,
                colors[c]
              );
            }

            currentY += height;
            remainingHeight -= height;
          }
        }
      }
    };

    function drawHorizontalLinesWithinRectangle(
      x: number,
      y: number,
      width: number,
      height: number,
      color: DotPen
    ) {
      setStroke(color, p);

      // Calculate how many lines can fit in the rectangle height
      const lineSpacing = p.random(1, 8); // Space between lines
      const numberOfLines = Math.floor(height / lineSpacing);

      // Draw horizontal lines to fill the rectangle
      for (let i = 0; i < numberOfLines; i++) {
        const lineY = y + i * lineSpacing;
        if (lineY < y + height) {
          p.line(x, lineY, x + width, lineY);
        }
      }
    }
  };

export default stairsSketch;
