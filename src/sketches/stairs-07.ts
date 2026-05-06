import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";

export const meta: Meta = {
  id: "stairs-07",
  title: "Stairs 07",
  description: "Some stairs",
  thumbnail: "/stairs-07.png",
};

type Constants = BaseConstants & {
  columnsGap: [number, number];
  columns: [number, number];
  topWidthRange: [number, number]; // Range for top width as fraction of bottom width (0.1 to 0.9)
  lineWidth: number;
  lineJitter: number; // Amount of jitter/noise on lines (0 = straight lines)
  lineSpacing: [number, number]; // Range for spacing between lines (smaller = more lines)
};

export const constants: Constants = {
  width: 550,
  height: 700,
  marginX: 80,
  marginY: 80,
  debug: false,
  columnsGap: [2, 10],
  columns: [12, 22],
  topWidthRange: [0.1, 0.9],
  lineWidth: 0.5,
  lineJitter: 0, // 0 = off, >0 = wavy lines
  lineSpacing: [1, 8], // Range for line spacing
};

export const constantsProps = {
  lineWidth: { min: 0.1, max: 2, step: 0.1 },
  lineJitter: { min: 0, max: 2, step: 0.05 },
};

const stairsSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const colors: DotPen[] = [
      "staedtlerPens.yellow",
      "staedtlerPens.orange",
      "staedtlerPensNew.crimson",
      "staedtlerPensNew.purple",
      "staedtlerPens.blue",
    ];

    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        strokeWeight: vars.lineWidth ?? constants.lineWidth,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? false,
        zoomLevel: (vars as any).zoomLevel,
      });

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;

      const drawW = p.width - 2 * marginX;

      const topWidthRange = vars.topWidthRange ?? constants.topWidthRange;
      const topWidth = p.random(
        drawW * topWidthRange[0],
        drawW * topWidthRange[1]
      );
      const bottomWidth = drawW;

      // draw a polygon that is topWidth wide at the top and bottomWidth wide at the bottom, the top can be randomly positionned, as long as it remains within the bounds of the canvas minus the margins, as high as canvas minus margin allows
      const polyX1 = p.random(marginX, marginX + drawW - topWidth);
      const polyY1 = marginY;
      const polyX2 = polyX1 + topWidth;
      const polyY2 = p.height - marginY;
      const polyX3 = marginX + bottomWidth;
      const polyX4 = marginX;

      //p.stroke(0);
      //p.noFill();
      //p.beginShape();
      //p.vertex(polyX1, polyY1);
      //p.vertex(polyX2, polyY1);
      //p.vertex(polyX3, polyY2);
      //p.vertex(polyX4, polyY2);
      //p.endShape(p.CLOSE);

      // calculate columns in the polygon
      const columnsGap = p.random(vars.columnsGap ?? constants.columnsGap);
      const columns = p.floor(p.random(vars.columns ?? constants.columns));
      //const columnsGap = 5;
      //const columns = 20;

      // Calculate gap at top (scaled proportionally to width ratio)
      const gapRatio = columnsGap / bottomWidth;
      const topGap = topWidth * gapRatio;

      // Generate random column widths (as fractions that sum to 1)
      const columnWeights: number[] = [];
      for (let i = 0; i < columns; i++) {
        columnWeights.push(p.random(0.5, 2)); // Random weight between 0.5 and 2
      }
      const totalWeight = columnWeights.reduce((a, b) => a + b, 0);
      const columnFractions = columnWeights.map((w) => w / totalWeight);

      // Calculate cumulative fractions for positioning
      const cumulativeFractions: number[] = [0];
      for (let i = 0; i < columns; i++) {
        cumulativeFractions.push(cumulativeFractions[i] + columnFractions[i]);
      }

      for (let c = 0; c < colors.length; c++) {
        for (let i = 0; i < columns; i++) {
          // Use cumulative fractions for variable-width columns
          const t1 = cumulativeFractions[i];
          const t2 = cumulativeFractions[i + 1];

          const x1 = polyX1 + t1 * topWidth;
          const y1 = polyY1;
          const x2 = polyX1 + t2 * topWidth - (i < columns - 1 ? topGap : 0);
          const y2 = polyY1;

          // Bottom edge: evenly divide bottomWidth, starting from polyX4 (marginX)
          const x4 = polyX4 + t1 * bottomWidth;
          const y4 = polyY2;
          const x3 =
            polyX4 + t2 * bottomWidth - (i < columns - 1 ? columnsGap : 0);
          const y3 = polyY2;

          if (vars.debug ?? constants.debug) {
            p.stroke("red");
            p.strokeWeight(1);
            p.noFill();
            p.beginShape();
            p.vertex(x1, y1);
            p.vertex(x2, y2);
            p.vertex(x3, y3);
            p.vertex(x4, y4);
            p.endShape(p.CLOSE);
          }

          // Draw lines within the column (similar to stairs-01)
          const availableHeight = y4 - y1;

          // Pre-generate rectangles to fill the column
          const rectangles: { type: string; height: number }[] = [];
          let totalHeight = 0;

          // Generate rectangles until we have enough to fill the column
          while (totalHeight < availableHeight) {
            const columnPos = i / (columns - 1 || 1);
            const colorPos = c / (colors.length - 1 || 1);
            const colorAndColumnDiff = Math.abs(columnPos - colorPos);

            // Decide whether to skip or render, based on color and column position
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

          // Draw the shuffled rectangles
          let currentY = y1;
          let remainingHeight = availableHeight;

          for (let j = 0; j < rectangles.length && remainingHeight > 0; j++) {
            const item = rectangles[j];
            const height = Math.min(item.height, remainingHeight);

            if (item.type === "rect") {
              drawLinesInTrapezoidColumn(
                x1,
                x2,
                x4,
                x3,
                y1,
                y4,
                currentY,
                currentY + height,
                colors[c]
              );
            }

            currentY += height;
            remainingHeight -= height;
          }
        }
      }

      if (vars.debug ?? constants.debug) {
        p.stroke("red");
        p.strokeWeight(1);
        p.noFill();
        p.beginShape();
        p.vertex(polyX1, polyY1);
        p.vertex(polyX2, polyY1);
        p.vertex(polyX3, polyY2);
        p.vertex(polyX4, polyY2);
        p.endShape(p.CLOSE);
      }
    };

    // Draw lines within a trapezoid column section
    function drawLinesInTrapezoidColumn(
      topLeftX: number,
      topRightX: number,
      bottomLeftX: number,
      bottomRightX: number,
      columnTopY: number,
      columnBottomY: number,
      sectionTopY: number,
      sectionBottomY: number,
      color: DotPen
    ) {
      setStroke(color, p);

      const columnHeight = columnBottomY - columnTopY;
      const lineSpacingRange = vars.lineSpacing ?? constants.lineSpacing;
      const lineSpacing = p.random(lineSpacingRange[0], lineSpacingRange[1]);
      const lineJitter = vars.lineJitter ?? constants.lineJitter;

      // Draw lines from sectionTopY to sectionBottomY
      for (
        let lineY = sectionTopY;
        lineY < sectionBottomY;
        lineY += lineSpacing
      ) {
        // Calculate interpolation factor (0 at top, 1 at bottom)
        const t = (lineY - columnTopY) / columnHeight;

        // Interpolate x positions for this y level
        const leftX = topLeftX + t * (bottomLeftX - topLeftX);
        const rightX = topRightX + t * (bottomRightX - topRightX);

        if (lineJitter > 0) {
          // Draw wavy/jittery line using multiple points
          const numPoints = Math.max(3, Math.floor((rightX - leftX) / 10));
          p.beginShape();
          for (let i = 0; i <= numPoints; i++) {
            const tLine = i / numPoints;
            const px = p.lerp(leftX, rightX, tLine);
            const jitter = p.random(-lineJitter, lineJitter);
            p.vertex(px, lineY + jitter);
          }
          p.endShape();
        } else {
          // Draw straight line
          p.line(leftX, lineY, rightX, lineY);
        }
      }
    }
  };

export default stairsSketch;
