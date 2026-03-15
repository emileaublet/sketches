import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  jitter: number;
  jitterSegmentLength: number;
  lineSpacing: number;
  columnWidthMin: number;
  columnWidthMax: number;
  rowHeightMin: number;
  rowHeightMax: number;
  gapMin: number;
  gapMax: number;
  lineThickness: number;
  subdivideThreshold: number;
  subGapMin: number;
  subGapMax: number;
  crossingGap: number;
  sarasaColors: DotPen[];
};

export const meta: Meta = {
  id: "tartan-01",
  title: "Tartan 01",
  description: "Simplified tartan pattern with jittery lines",
  thumbnail: "/tartan-01.png",
};

export const constants: Constants = {
  width: 572,
  height: 762,
  marginX: 40,
  marginY: 40,
  debug: false,
  jitter: 1,
  jitterSegmentLength: 10,
  lineSpacing: 2,
  columnWidthMin: 15,
  columnWidthMax: 60,
  rowHeightMin: 15,
  rowHeightMax: 60,
  gapMin: 8,
  gapMax: 30,
  lineThickness: 0.4,
  subdivideThreshold: 40,
  subGapMin: 3,
  subGapMax: 8,
  crossingGap: 2,
  sarasaColors: all("zebraSarasa"),
};

export const constantsProps = {
  jitter: { min: 0, max: 10, step: 0.5 },
  jitterSegmentLength: { min: 1, max: 50, step: 1 },
  lineSpacing: { min: 0.5, max: 10, step: 0.25 },
  columnWidthMin: { min: 5, max: 600, step: 5 },
  columnWidthMax: { min: 10, max: 600, step: 5 },
  rowHeightMin: { min: 5, max: 600, step: 5 },
  rowHeightMax: { min: 10, max: 600, step: 5 },
  gapMin: { min: 0, max: 300, step: 2 },
  gapMax: { min: 5, max: 300, step: 2 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  subdivideThreshold: { min: 20, max: 500, step: 5 },
  subGapMin: { min: 10, max: 100, step: 1 },
  subGapMax: { min: 80, max: 200, step: 1 },
  crossingGap: { min: -10, max: 10, step: 0.5 },
  sarasaColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Sarasa Colors",
    }),
};

const tartan01Sketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        colorMode: "RGB",
        angleMode: "RADIANS",
        noFill: true,
        noLoop: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const startX = marginX;
      const startY = marginY;

      const jitter = vars.jitter ?? constants.jitter;
      const jitterSegmentLength = vars.jitterSegmentLength ?? constants.jitterSegmentLength;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const columnWidthMin = vars.columnWidthMin ?? constants.columnWidthMin;
      const columnWidthMax = vars.columnWidthMax ?? constants.columnWidthMax;
      const rowHeightMin = vars.rowHeightMin ?? constants.rowHeightMin;
      const rowHeightMax = vars.rowHeightMax ?? constants.rowHeightMax;
      const gapMin = vars.gapMin ?? constants.gapMin;
      const gapMax = vars.gapMax ?? constants.gapMax;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;

      p.blendMode(p.MULTIPLY);

      // Use selected sarasa colors from multiselect
      const selectedColors = (vars.sarasaColors ??
        constants.sarasaColors) as DotPen[];
      const colorPool =
        selectedColors.length > 0 ? selectedColors : all("zebraSarasa");

      // Helper to draw a jittery line
      function drawJitteryLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        jitterAmount: number,
      ) {
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        // Scale jitter relative to line length (normalized to ~100px reference)
        const scaledJitter = jitterAmount * (len / 100);

        // Build irregular segment positions (not evenly spaced)
        const tValues: number[] = [0];
        let currentT = 0;
        const avgSegmentSize = jitterSegmentLength / Math.max(len, 1);

        while (currentT < 1) {
          // Vary segment size between 50% and 150% of average
          const stepSize = avgSegmentSize * p.random(0.5, 1.5);
          currentT += stepSize;
          if (currentT >= 1) {
            tValues.push(1);
          } else {
            // Add slight random offset to break regularity
            tValues.push(currentT + p.random(-0.02, 0.02));
          }
        }

        p.beginShape();
        for (let i = 0; i < tValues.length; i++) {
          const t = Math.max(0, Math.min(1, tValues[i]));
          const x = p.lerp(x1, x2, t);
          const y = p.lerp(y1, y2, t);

          const dx = x2 - x1;
          const dy = y2 - y1;
          const perpX = len > 0 ? -dy / len : 0;
          const perpY = len > 0 ? dx / len : 1;

          // Base jitter at endpoints (0.3) + extra jitter in the middle
          // Also vary the intensity randomly per point
          const edgeFactor = 0.3 + 0.7 * Math.sin(t * Math.PI);
          const intensityVariation = p.random(0.6, 1.4);
          const pointJitter = scaledJitter * edgeFactor * intensityVariation;

          const jx = x + perpX * p.random(-pointJitter, pointJitter);
          const jy = y + perpY * p.random(-pointJitter, pointJitter);

          p.vertex(jx, jy);
        }
        p.endShape();
      }

      // Helper to draw horizontal lines within a rectangle
      function drawHorizontalLinesInRect(
        x: number,
        y: number,
        width: number,
        height: number,
        color: DotPen,
      ) {
        setStroke(color, p);
        p.strokeWeight(lineThickness);

        const spacing = p.random(lineSpacing * 0.5, lineSpacing * 3);
        const numberOfLines = Math.floor(height / spacing);

        for (let i = 0; i < numberOfLines; i++) {
          const lineY = y + i * spacing;
          if (lineY < y + height) {
            drawJitteryLine(x, lineY, x + width, lineY, jitter);
          }
        }
      }

      // Helper to draw vertical lines within a rectangle
      function drawVerticalLinesInRect(
        x: number,
        y: number,
        width: number,
        height: number,
        color: DotPen,
      ) {
        setStroke(color, p);
        p.strokeWeight(lineThickness);
        const spacing = p.random(lineSpacing * 0.5, lineSpacing * 3);
        const numberOfLines = Math.floor(width / spacing);

        for (let i = 0; i < numberOfLines; i++) {
          const lineX = x + i * spacing;
          if (lineX < x + width) {
            drawJitteryLine(lineX, y, lineX, y + height, jitter);
          }
        }
      }

      // Generate columns based on widths and gaps until we fill the canvas
      const subdivideThreshold =
        vars.subdivideThreshold ?? constants.subdivideThreshold;
      const subGapMin = vars.subGapMin ?? constants.subGapMin;
      const subGapMax = vars.subGapMax ?? constants.subGapMax;

      // Helper to subdivide a large band into smaller sub-bands
      function subdivideBand(
        totalSize: number,
        minSize: number,
        maxSize: number,
      ): { offset: number; size: number }[] {
        const subBands: { offset: number; size: number }[] = [];
        let current = p.random(subGapMin, subGapMax);

        while (current < totalSize) {
          const size = p.random(
            minSize,
            Math.min(maxSize, totalSize - current),
          );
          if (current + size > totalSize) break;
          subBands.push({ offset: current, size });
          current += size + p.random(subGapMin, subGapMax);
        }

        // Fallback: if no sub-bands fit, just use one band
        if (subBands.length === 0) {
          subBands.push({ offset: 0, size: totalSize });
        }

        return subBands;
      }

      const pickRandomColors = () => {
        const n = Math.min(
          Math.floor(p.random(3, 6)),
          Math.max(1, colorPool.length),
        );
        const out: DotPen[] = [];
        for (let i = 0; i < n; i++) out.push(p.random(colorPool) as DotPen);
        return out;
      };

      const columns: {
        x: number;
        width: number;
        colors: DotPen[];
        subColumns?: { x: number; width: number; colors: DotPen[] }[];
      }[] = [];
      let currentX = startX + p.random(gapMin, gapMax);

      while (currentX < startX + drawW) {
        const width = p.random(columnWidthMin, columnWidthMax);

        if (currentX + width > startX + drawW) break;

        const colors = pickRandomColors();

        // Subdivide if too large - each sub-band gets its own random colors
        let subColumns:
          | { x: number; width: number; colors: DotPen[] }[]
          | undefined;
        if (width > subdivideThreshold) {
          const subBands = subdivideBand(
            width,
            columnWidthMin * 0.5,
            subdivideThreshold * 0.6,
          );
          subColumns = subBands.map((sb) => ({
            x: currentX + sb.offset,
            width: sb.size,
            colors: pickRandomColors(),
          }));
        }

        columns.push({ x: currentX, width, colors, subColumns });
        currentX += width + p.random(gapMin, gapMax);
      }

      // Generate rows based on heights and gaps until we fill the canvas
      const rows: {
        y: number;
        height: number;
        colors: DotPen[];
        subRows?: { y: number; height: number; colors: DotPen[] }[];
      }[] = [];
      let currentY = startY + p.random(gapMin, gapMax);

      while (currentY < startY + drawH) {
        const height = p.random(rowHeightMin, rowHeightMax);

        if (currentY + height > startY + drawH) break;

        const colors = pickRandomColors();

        // Subdivide if too large - each sub-band gets its own random colors
        let subRows:
          | { y: number; height: number; colors: DotPen[] }[]
          | undefined;
        if (height > subdivideThreshold) {
          const subBands = subdivideBand(
            height,
            rowHeightMin * 0.5,
            subdivideThreshold * 0.6,
          );
          subRows = subBands.map((sb) => ({
            y: currentY + sb.offset,
            height: sb.size,
            colors: pickRandomColors(),
          }));
        }

        rows.push({ y: currentY, height, colors, subRows });
        currentY += height + p.random(gapMin, gapMax);
      }

      // Pre-compute intersection decisions: for each (col, row) pair, decide who draws
      // true = column draws, false = row draws
      const intersectionMap: boolean[][] = [];
      for (let ci = 0; ci < columns.length; ci++) {
        intersectionMap[ci] = [];
        for (let ri = 0; ri < rows.length; ri++) {
          // Checkerboard pattern: alternate based on sum of indices
          intersectionMap[ci][ri] = (ci + ri) % 2 === 0;
        }
      }

      // Draw columns - each color pass fills continuously, skipping only at row intersections where row wins
      for (let ci = 0; ci < columns.length; ci++) {
        const col = columns[ci];
        // Use sub-columns if they exist (each has its own colors), otherwise treat as single column
        const colBands = col.subColumns ?? [
          { x: col.x, width: col.width, colors: col.colors },
        ];

        for (const colBand of colBands) {
          const extentJitter = jitter * 4;
          const colX = colBand.x + p.random(-extentJitter, extentJitter);
          const colWidth =
            colBand.x +
            colBand.width +
            p.random(-extentJitter, extentJitter) -
            colX;

          for (const color of colBand.colors) {
            // Random start/end offset for this color pass
            const startOffset = p.random(-5, 5);
            const endOffset = p.random(-5, 5);
            let drawY = startY + startOffset;
            const endY = startY + drawH + endOffset;

            while (drawY < endY) {
              // Random block size (1-20 lines worth)
              const linesInBlock = Math.floor(p.random(1, 20));
              const blockSpacing = p.random(1, 20);
              const blockHeight = linesInBlock * blockSpacing;
              const blockEndY = Math.min(drawY + blockHeight, endY);

              // Check if this Y range intersects any row where row wins
              let skipStart = -1;
              let skipEnd = -1;

              for (let ri = 0; ri < rows.length; ri++) {
                const row = rows[ri];
                const intersects =
                  drawY < row.y + row.height && blockEndY > row.y;
                if (intersects && !intersectionMap[ci][ri]) {
                  // Row wins here - mark the skip zone with crossingGap padding
                  const crossingGap = vars.crossingGap ?? constants.crossingGap;
                  skipStart = Math.max(drawY, row.y - crossingGap);
                  skipEnd = Math.min(
                    blockEndY,
                    row.y + row.height + crossingGap,
                  );
                  break;
                }
              }

              if (skipStart >= 0) {
                // Draw before the skip zone
                if (skipStart > drawY) {
                  drawHorizontalLinesInRect(
                    colX,
                    drawY,
                    colWidth,
                    skipStart - drawY,
                    color,
                  );
                }
                // Draw after the skip zone
                if (skipEnd < blockEndY) {
                  drawHorizontalLinesInRect(
                    colX,
                    skipEnd,
                    colWidth,
                    blockEndY - skipEnd,
                    color,
                  );
                }
              } else {
                // No intersection, draw the whole block
                drawHorizontalLinesInRect(
                  colX,
                  drawY,
                  colWidth,
                  blockEndY - drawY,
                  color,
                );
              }

              drawY = blockEndY;
            }
          }
        }
      }

      // Draw rows - each color pass fills continuously, skipping only at column intersections where column wins
      for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri];
        // Use sub-rows if they exist (each has its own colors), otherwise treat as single row
        const rowBands = row.subRows ?? [
          { y: row.y, height: row.height, colors: row.colors },
        ];

        for (const rowBand of rowBands) {
          const extentJitter = jitter * 4;
          const rowY = rowBand.y + p.random(-extentJitter, extentJitter);
          const rowHeight =
            rowBand.y +
            rowBand.height +
            p.random(-extentJitter, extentJitter) -
            rowY;

          for (const color of rowBand.colors) {
            // Random start/end offset for this color pass
            const startOffset = p.random(-5, 5);
            const endOffset = p.random(-5, 5);
            let drawX = startX + startOffset;
            const endX = startX + drawW + endOffset;

            while (drawX < endX) {
              // Random block size (1-20 lines worth)
              const linesInBlock = Math.floor(p.random(1, 20));
              const blockSpacing = p.random(1, 20);
              const blockWidth = linesInBlock * blockSpacing;
              const blockEndX = Math.min(drawX + blockWidth, endX);

              // Check if this X range intersects any column where column wins
              let skipStart = -1;
              let skipEnd = -1;

              for (let ci = 0; ci < columns.length; ci++) {
                const col = columns[ci];
                const intersects =
                  drawX < col.x + col.width && blockEndX > col.x;
                if (intersects && intersectionMap[ci][ri]) {
                  // Column wins here - mark the skip zone with crossingGap padding
                  const crossingGap = vars.crossingGap ?? constants.crossingGap;
                  skipStart = Math.max(drawX, col.x - crossingGap);
                  skipEnd = Math.min(
                    blockEndX,
                    col.x + col.width + crossingGap,
                  );
                  break;
                }
              }

              if (skipStart >= 0) {
                // Draw before the skip zone
                if (skipStart > drawX) {
                  drawVerticalLinesInRect(
                    drawX,
                    rowY,
                    skipStart - drawX,
                    rowHeight,
                    color,
                  );
                }
                // Draw after the skip zone
                if (skipEnd < blockEndX) {
                  drawVerticalLinesInRect(
                    skipEnd,
                    rowY,
                    blockEndX - skipEnd,
                    rowHeight,
                    color,
                  );
                }
              } else {
                // No intersection, draw the whole block
                drawVerticalLinesInRect(
                  drawX,
                  rowY,
                  blockEndX - drawX,
                  rowHeight,
                  color,
                );
              }

              drawX = blockEndX;
            }
          }
        }
      }
    };
  };

export default tartan01Sketch;
