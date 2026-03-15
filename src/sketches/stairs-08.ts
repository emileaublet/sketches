import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { createBezierRoundedPath } from "@/utils/pathUtils";

export const meta: Meta = {
  id: "stairs-08",
  title: "Stairs 08",
  description: "Ray columns with side trapezoids and orientation control",
  thumbnail: "/stairs-08.png",
};

type Constants = BaseConstants & {
  columnsGap: [number, number];
  columns: [number, number];
  lineWidth: number;
  lineJitter: number; // Amount of jitter/noise on lines (0 = straight lines)
  jitterSegmentLength: number; // Pixel length between jitter vertices (smaller = spikier, larger = smoother)
  lineSpacing: [number, number]; // Range for spacing between lines (smaller = more lines)
  orientation: "horizontal" | "vertical";
  pointsPerSide: number; // Number of points per side for blob shape (higher = smoother)
  cornerRadiusPercent: number; // Corner radius as percentage of smaller dimension (0-20%)
};

export const constants: Constants = {
  width: 550,
  height: 700,
  marginX: 80,
  marginY: 80,
  debug: false,
  columnsGap: [2, 10],
  columns: [12, 22],
  lineWidth: 0.5,
  lineJitter: 0, // 0 = off, >0 = wavy lines
  jitterSegmentLength: 5, // pixels per jitter segment
  lineSpacing: [1, 8], // Range for line spacing
  orientation: "horizontal",
  pointsPerSide: 4, // Number of points per side (higher = smoother edges)
  cornerRadiusPercent: 8, // Corner radius as % of smaller dimension
};

export const constantsProps = {
  lineWidth: { min: 0.1, max: 2, step: 0.1 },
  lineJitter: { min: 0, max: 2, step: 0.05 },
  jitterSegmentLength: { min: 1, max: 30, step: 1 },
  orientation: { options: ["horizontal", "vertical"] },
  pointsPerSide: { min: 2, max: 10, step: 1 },
  cornerRadiusPercent: { min: 0, max: 20, step: 1 },
  columnsGap: { min: 1, max: 20, step: 1 },
};

const stairsSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const colors: DotPen[] = [
      "staedtlerPens.yellow",
      "staedtlerPens.orange",

      "staedtlerPens.blue",
    ];

    // Store blob path for clipping
    let blobPath: { x: number; y: number }[] = [];

    // Helper function to check if a point is inside the blob
    function isPointInBlob(x: number, y: number): boolean {
      if (blobPath.length === 0) return true;

      // Ray casting algorithm for point-in-polygon test
      let inside = false;
      for (let i = 0, j = blobPath.length - 1; i < blobPath.length; j = i++) {
        const xi = blobPath[i].x,
          yi = blobPath[i].y;
        const xj = blobPath[j].x,
          yj = blobPath[j].y;

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    }

    // New strategy: Build columns incrementally from left to right (or top to bottom)
    // Each column is defined by its four corners, building from the previous column
    function drawTrapezoidColumns(
      x1: number, // top-left
      y1: number,
      x2: number, // top-right
      y2: number,
      x3: number, // bottom-right
      y3: number,
      x4: number, // bottom-left
      y4: number,
      columnsGapRange: [number, number],
      minColumnWidth: number,
      maxColumnWidth: number,
      isHorizontal: boolean
    ) {
      // Calculate total available space
      const topEdgeLength = isHorizontal
        ? Math.abs(x2 - x1) // Horizontal: top edge (left to right)
        : Math.abs(y4 - y1); // Vertical: left edge (top to bottom)
      const bottomEdgeLength = isHorizontal
        ? Math.abs(x3 - x4) // Horizontal: bottom edge (left to right)
        : Math.abs(y3 - y2); // Vertical: right edge (top to bottom)

      // Build columns incrementally
      let topLeft = 0; // Position along top edge (0 to topEdgeLength)
      let bottomLeft = 0; // Position along bottom edge (0 to bottomEdgeLength)

      while (topLeft < topEdgeLength && bottomLeft < bottomEdgeLength) {
        // Calculate remaining space
        const topRemaining = topEdgeLength - topLeft;
        const bottomRemaining = bottomEdgeLength - bottomLeft;

        // Determine column width (random between min and max)
        const topColumnWidth = Math.min(
          p.random(minColumnWidth, maxColumnWidth),
          topRemaining
        );
        const bottomColumnWidth = Math.min(
          p.random(minColumnWidth, maxColumnWidth),
          bottomRemaining
        );

        // Pick a random gap for this iteration
        const columnsGap = p.random(columnsGapRange[0], columnsGapRange[1]);

        // Check if this is the last column (not enough space for another column + gap)
        const isLastColumn =
          topRemaining - topColumnWidth - columnsGap < minColumnWidth ||
          bottomRemaining - bottomColumnWidth - columnsGap < minColumnWidth;

        const finalTopWidth = isLastColumn ? topRemaining : topColumnWidth;
        const finalBottomWidth = isLastColumn
          ? bottomRemaining
          : bottomColumnWidth;

        // Calculate top-right and bottom-right positions
        const topRight = topLeft + finalTopWidth;
        const bottomRight = bottomLeft + finalBottomWidth;

        // Calculate actual coordinates for this column
        let col_x1, col_y1, col_x2, col_y2, col_x3, col_y3, col_x4, col_y4;

        if (isHorizontal) {
          // Horizontal orientation: columns go left to right
          col_x1 = x1 + topLeft;
          col_y1 = y1;
          col_x2 = x1 + topRight;
          col_y2 = y2;
          col_x3 = x4 + bottomRight;
          col_y3 = y3;
          col_x4 = x4 + bottomLeft;
          col_y4 = y4;
        } else {
          // Vertical orientation: columns go top to bottom
          col_x1 = x1;
          col_y1 = y1 + topLeft;
          col_x2 = x2;
          col_y2 = y1 + topRight;
          col_x3 = x3;
          col_y3 = y4 + bottomRight;
          col_x4 = x4;
          col_y4 = y4 + bottomLeft;
        }

        // Draw this column with all colors
        drawColumnWithLines(
          col_x1,
          col_y1,
          col_x2,
          col_y2,
          col_x3,
          col_y3,
          col_x4,
          col_y4,
          isHorizontal
        );

        // Move to next column (add gap with some randomization)
        if (!isLastColumn) {
          // Add ±30% variation to the gap
          const gapVariation = columnsGap * 0.3;
          const randomizedGap =
            columnsGap + p.random(-gapVariation, gapVariation);
          topLeft = topRight + randomizedGap;
          bottomLeft = bottomRight + randomizedGap;
        } else {
          break; // Last column, we're done
        }
      }
    }

    // Draw a single column with hatching lines for each color
    function drawColumnWithLines(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number,
      x4: number,
      y4: number,
      isHorizontal: boolean
    ) {
      if (vars.debug ?? constants.debug) {
        p.stroke("cyan");
        p.strokeWeight(1);
        p.noFill();
        p.beginShape();
        p.vertex(x1, y1);
        p.vertex(x2, y2);
        p.vertex(x3, y3);
        p.vertex(x4, y4);
        p.endShape(p.CLOSE);
      }

      // Calculate available height for lines
      const availableHeight = isHorizontal
        ? Math.abs(y3 - y1)
        : Math.abs(x3 - x1);

      // Draw lines for each color
      for (let c = 0; c < colors.length; c++) {
        // Pre-generate rectangles to fill the column
        const rectangles: { type: string; height: number }[] = [];
        let totalHeight = 0;

        while (totalHeight < availableHeight) {
          // Calculate probability based on color index (similar to old logic)
          const colorPos = c / (colors.length - 1 || 1);
          const renderProbability = Math.max(0.1, 1 - colorPos * 0.5);
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
        }

        // Shuffle rectangles
        for (let i = rectangles.length - 1; i > 0; i--) {
          const j = Math.floor(p.random() * (i + 1));
          [rectangles[i], rectangles[j]] = [rectangles[j], rectangles[i]];
        }

        // Draw the rectangles
        let currentPos = 0;
        let remainingHeight = availableHeight;

        for (const item of rectangles) {
          if (remainingHeight <= 0) break;

          const height = Math.min(item.height, remainingHeight);

          if (item.type === "rect") {
            drawLinesInColumn(
              x1,
              y1,
              x2,
              y2,
              x3,
              y3,
              x4,
              y4,
              currentPos,
              currentPos + height,
              availableHeight,
              colors[c],
              isHorizontal
            );
          }

          currentPos += height;
          remainingHeight -= height;
        }
      }
    }

    function drawLinesInColumn(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number,
      x4: number,
      y4: number,
      sectionStart: number,
      sectionEnd: number,
      totalHeight: number,
      color: DotPen,
      isHorizontal: boolean
    ) {
      setStroke(color, p);
      const lineSpacingRange = vars.lineSpacing ?? constants.lineSpacing;
      const lineSpacing = p.random(lineSpacingRange[0], lineSpacingRange[1]);
      const lineJitter = vars.lineJitter ?? constants.lineJitter;
      const jitterSegmentLength = vars.jitterSegmentLength ?? constants.jitterSegmentLength;

      // ALWAYS draw horizontal lines (left to right) regardless of orientation
      // The orientation only affects how columns/rows are stacked
      let y = sectionStart;
      while (y < sectionEnd) {
        const t = y / totalHeight;
        const leftX = x1 + t * (x4 - x1);
        const rightX = x2 + t * (x3 - x2);
        const baseY = y1 + y;

        // Clip line to blob boundaries by checking multiple points
        const numSamples = 32;
        let lineStartX = null;
        let lineEndX = null;

        for (let i = 0; i <= numSamples; i++) {
          const sampleX = p.lerp(leftX, rightX, i / numSamples);
          const isInside = isPointInBlob(sampleX, baseY);

          if (isInside && lineStartX === null) {
            lineStartX = sampleX;
          }
          if (!isInside && lineStartX !== null && lineEndX === null) {
            lineEndX = p.lerp(leftX, rightX, (i - 1) / numSamples);
          }
        }

        // Draw hand-drawn style line with jitter
        if (lineStartX !== null) {
          const endX = lineEndX || rightX;

          if (lineJitter > 0) {
            // Draw wavy line by creating multiple small segments
            const numSegments = Math.ceil((endX - lineStartX) / jitterSegmentLength);

            p.beginShape();
            for (let i = 0; i <= numSegments; i++) {
              const segmentT = i / numSegments;
              const segmentX = p.lerp(lineStartX, endX, segmentT);
              const jitterY = baseY + p.random(-lineJitter, lineJitter);
              p.vertex(segmentX, jitterY);
            }
            p.endShape();
          } else {
            // Straight line (no jitter)
            p.line(lineStartX, baseY, endX, baseY);
          }
        }

        y += lineSpacing;
      }
    }

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
      const orientation = vars.orientation ?? constants.orientation;

      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      // Get gap range
      const columnsGapRange = vars.columnsGap ?? constants.columnsGap;
      const columnsRange = vars.columns ?? constants.columns;
      const minColumnSize = columnsRange[0];
      const maxColumnSize = columnsRange[1];

      // Create a more rectangular blob-like shape with subtle organic variation
      // Distribute points along rectangle perimeter with noise-based variation
      const pointsPerSide = vars.pointsPerSide ?? constants.pointsPerSide;
      const points: { x: number; y: number }[] = [];

      // Define rectangle bounds (slightly inset from draw area for variation)
      const rectLeft = marginX;
      const rectRight = marginX + drawW;
      const rectTop = marginY;
      const rectBottom = marginY + drawH;

      // Variation amount for organic feel (smaller = more rectangular)
      const variationAmount = Math.min(drawW, drawH) * 0.08; // 8% of smaller dimension

      // Top edge (left to right)
      for (let i = 0; i < pointsPerSide; i++) {
        const t = i / (pointsPerSide - 1);
        const x = p.lerp(rectLeft, rectRight, t);
        const noiseVal = p.noise(i * 0.5, seed || 0);
        const yOffset = p.map(
          noiseVal,
          0,
          1,
          -variationAmount,
          variationAmount
        );
        points.push({ x, y: rectTop + yOffset });
      }

      // Right edge (top to bottom) - skip first point to avoid duplicate
      for (let i = 1; i < pointsPerSide; i++) {
        const t = i / (pointsPerSide - 1);
        const y = p.lerp(rectTop, rectBottom, t);
        const noiseVal = p.noise(i * 0.5 + 10, seed || 0);
        const xOffset = p.map(
          noiseVal,
          0,
          1,
          -variationAmount,
          variationAmount
        );
        points.push({ x: rectRight + xOffset, y });
      }

      // Bottom edge (right to left) - skip first point to avoid duplicate
      for (let i = 1; i < pointsPerSide; i++) {
        const t = i / (pointsPerSide - 1);
        const x = p.lerp(rectRight, rectLeft, t);
        const noiseVal = p.noise(i * 0.5 + 20, seed || 0);
        const yOffset = p.map(
          noiseVal,
          0,
          1,
          -variationAmount,
          variationAmount
        );
        points.push({ x, y: rectBottom + yOffset });
      }

      // Left edge (bottom to top) - skip first and last points to avoid duplicates
      for (let i = 1; i < pointsPerSide - 1; i++) {
        const t = i / (pointsPerSide - 1);
        const y = p.lerp(rectBottom, rectTop, t);
        const noiseVal = p.noise(i * 0.5 + 30, seed || 0);
        const xOffset = p.map(
          noiseVal,
          0,
          1,
          -variationAmount,
          variationAmount
        );
        points.push({ x: rectLeft + xOffset, y });
      }

      // Create smooth bezier path from points with moderate rounding
      const cornerRadiusPercent =
        vars.cornerRadiusPercent ?? constants.cornerRadiusPercent;
      const cornerRadius = Math.min(drawW, drawH) * (cornerRadiusPercent / 100);
      blobPath = createBezierRoundedPath(points, cornerRadius, 2);

      // Get the bounding box of the blob to create a trapezoid that encompasses it
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const point of blobPath) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }

      // Define blob corner points (use bounding box for column generation)
      if (orientation === "horizontal") {
        drawTrapezoidColumns(
          minX,
          minY,
          maxX,
          minY,
          maxX,
          maxY,
          minX,
          maxY,
          columnsGapRange,
          minColumnSize,
          maxColumnSize,
          true // isHorizontal
        );

        // Debug: show blob outline
        if (vars.debug ?? constants.debug) {
          p.stroke("red");
          p.strokeWeight(2);
          p.noFill();
          p.beginShape();
          for (const point of blobPath) {
            p.vertex(point.x, point.y);
          }
          p.endShape(p.CLOSE);
        }
      } else {
        drawTrapezoidColumns(
          minX,
          minY,
          maxX,
          minY,
          maxX,
          maxY,
          minX,
          maxY,
          columnsGapRange,
          minColumnSize,
          maxColumnSize,
          false // isHorizontal
        );

        // Debug: show blob outline
        if (vars.debug ?? constants.debug) {
          p.stroke("red");
          p.strokeWeight(2);
          p.noFill();
          p.beginShape();
          for (const point of blobPath) {
            p.vertex(point.x, point.y);
          }
          p.endShape(p.CLOSE);
        }
      }
    };
  };

export default stairsSketch;
