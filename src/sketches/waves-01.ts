import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";

type Constants = BaseConstants & {
  // Add your custom constants here
};

export const meta: Meta = {
  id: "waves-01",
  title: "Waves 01",
  description: "A new generative art sketch",
  thumbnail: "/waves-01.png",
};

interface WaveConstants {
  cols: [number, number];
  rows: [number, number];
  segments: [number, number];

  frequency: [number, number];
  phaseShift: [number, number];
  amplitude: [number, number];

  rowHeightVariation: [number, number];
  rowHeightMultiplier: [number, number];
  cellPadding: [number, number];
  heightMultiplier: [number, number];
  rowWidthVariation: [number, number];
  rowCenterOffset: [number, number];
  lineJitter: number;
  rowWidthCurve: number;
}

export const constants: Constants & WaveConstants = {
  width: 572,
  height: 762,
  marginX: 80,
  marginY: 80,
  debug: false,
  cols: [30, 50],
  rows: [10, 30],
  segments: [1, 16],
  frequency: [0.5, 3],
  phaseShift: [0, 360],
  amplitude: [0.3, 1.0],
  rowHeightVariation: [0.5, 4.0],
  rowHeightMultiplier: [0.8, 1.3],
  cellPadding: [0.5, 3],
  heightMultiplier: [0.6, 1.8],
  rowWidthVariation: [0.95, 1.05],
  rowCenterOffset: [-1, 1],
  lineJitter: 0.08,
  rowWidthCurve: 0.5,
};

export const constantsProps = {
  cols: { min: 10, max: 100, step: 1 },
  rows: { min: 5, max: 100, step: 1 },
  segments: { min: 1, max: 50, step: 1 },
  frequency: { min: 0.1, max: 5, step: 0.1 },
  phaseShift: { min: 0, max: 360, step: 1 },
  amplitude: { min: 0.1, max: 1.0, step: 0.1 },
  rowHeightVariation: { min: 0.1, max: 10, step: 0.1 },
  rowHeightMultiplier: { min: 0.5, max: 2.0, step: 0.1 },
  cellPadding: { min: 0, max: 10, step: 0.1 },
  heightMultiplier: { min: 0.1, max: 3.0, step: 0.1 },
  rowWidthVariation: { min: 0.1, max: 1.5, step: 0.05 },
  rowCenterOffset: { min: -100, max: 100, step: 1 },
  lineJitter: { min: 0, max: 1, step: 0.01 },
  rowWidthCurve: { min: 0, max: 1, step: 0.05 },
};

const waves_01Sketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    /* const colors: DotPen[] = [
      "staedtlerPens.yellow",
      "staedtlerPens.orange",
      "staedtlerPens.red",
      "staedtlerPens.blue",
      "staedtlerPens.teal",
      "staedtlerPens.green",
    ]; */

    const colors: DotPen[] = [
      "micronPens.purple_024",
      "micronPens.red_019",
      "micronPens.blue_036",
      "micronPens.green_029",
    ];

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
        useSVG: vars.useSVG ?? false,
        zoomLevel: (vars as any).zoomLevel,
      });

      const shouldFlipColors = p.random() > 0.5;
      if (shouldFlipColors) {
        colors.reverse();
      }

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const debug = vars.debug ?? constants.debug;

      const [minRows, maxRows] = vars.rows ?? constants.rows;
      const [minCols, maxCols] = vars.cols ?? constants.cols;
      const [minSegments, maxSegments] = vars.segments ?? constants.segments;
      const [minFrequency, maxFrequency] =
        vars.frequency ?? constants.frequency;
      const [minPhaseShift, maxPhaseShift] =
        vars.phaseShift ?? constants.phaseShift;
      const [minAmplitude, maxAmplitude] =
        vars.amplitude ?? constants.amplitude;
      const [minRowHeightVariation, maxRowHeightVariation] =
        vars.rowHeightVariation ?? constants.rowHeightVariation;
      const [minRowHeightMultiplier, maxRowHeightMultiplier] =
        vars.rowHeightMultiplier ?? constants.rowHeightMultiplier;
      const [minRowWidthVariation, maxRowWidthVariation] =
        vars.rowWidthVariation ?? constants.rowWidthVariation;
      const [minRowCenterOffset, maxRowCenterOffset] =
        vars.rowCenterOffset ?? constants.rowCenterOffset;
      const lineJitter = vars.lineJitter ?? constants.lineJitter;
      const rowWidthCurve = vars.rowWidthCurve ?? constants.rowWidthCurve;

      const rows = Math.round(p.random(minRows, maxRows));

      // Generate random row heights with controlled overlap
      const rowHeights: number[] = [];
      let totalHeight = 0;

      // First pass: generate random heights
      for (let r = 0; r < rows; r++) {
        const height = p.random(minRowHeightVariation, maxRowHeightVariation);
        rowHeights.push(height);
        totalHeight += height;
      }

      // Second pass: normalize to fit exactly in drawH
      for (let r = 0; r < rows; r++) {
        rowHeights[r] = (rowHeights[r] / totalHeight) * drawH;
      }

      // Third pass: add overlap by adjusting individual heights while keeping total in bounds
      // Increase some, decrease others to maintain average
      for (let r = 0; r < rows; r++) {
        const variation = p.random(
          minRowHeightMultiplier,
          maxRowHeightMultiplier
        );
        rowHeights[r] *= variation;
      }

      // Fourth pass: re-normalize to ensure we stay within drawH
      totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
      for (let r = 0; r < rows; r++) {
        rowHeights[r] = (rowHeights[r] / totalHeight) * drawH;
      }

      // Fifth pass: enforce minimum row height to avoid very thin rows
      const minRowHeight = drawH / (rows * 2); // Minimum height is half of average
      for (let r = 0; r < rows; r++) {
        if (rowHeights[r] < minRowHeight) {
          rowHeights[r] = minRowHeight;
        }
      }

      // Sixth pass: re-normalize one final time after enforcing minimums
      totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
      for (let r = 0; r < rows; r++) {
        rowHeights[r] = (rowHeights[r] / totalHeight) * drawH;
      }

      // create a grid of points
      // columns is variable, for each row based on minCols and maxCols
      // for each row, calculate a random amount of columns
      // cells of a row should form a sin wave

      const points: number[][] = [];
      for (let r = 0; r < rows; r++) {
        const cols = Math.round(p.random(minCols, maxCols));

        // Randomize wave parameters per row
        const frequency = p.random(minFrequency, maxFrequency); // Number of wave cycles (0.5 to 3)
        const phaseShift = p.random(minPhaseShift, maxPhaseShift); // Starting phase offset (0 to 360 degrees)
        const amplitude = p.random(minAmplitude, maxAmplitude); // Wave intensity (0.3 to 1.0 of full range)

        const row = [];

        // Randomly use sin or cos for more variety
        const useCos = p.random() > 0.5;

        for (let c = 0; c < cols; c++) {
          // Create sine/cosine wave pattern with randomized parameters
          const angle = (c / cols) * 360 * frequency + phaseShift;
          const waveValue = useCos ? p.cos(angle) : p.sin(angle);

          // Calculate range based on amplitude
          const midPoint = (minSegments + maxSegments) / 2;
          const range = (maxSegments - minSegments) * amplitude;

          // Map wave value to segment range with variable amplitude
          const segments = midPoint + (waveValue * range) / 2;
          row.push(Math.round(segments));
        }
        points.push(row);
      }

      // draw rectangles at points
      let cumulativeY = marginY;
      for (let r = 0; r < points.length; r++) {
        const row = points[r];
        const rowHeight = rowHeights[r];
        const y = cumulativeY + rowHeight / 2;

        // Calculate position in rows (0 = first row, 1 = last row)
        const rowPosition = r / (rows - 1 || 1);

        // Calculate curve factor: 0 at edges, 1 at center (parabola)
        // Converts 0->1 to 0->1->0 (peaks at 0.5)
        const curveFactor = 1 - Math.pow(2 * rowPosition - 1, 2);

        // Apply curve to width: blend between normal width and curved width
        const curveInfluence = rowWidthCurve; // 0 = no curve, 1 = full curve
        const widthMultiplier =
          1 - curveInfluence + curveInfluence * curveFactor;

        // Make rows random widths and center them (with slight offset)
        const rowWidthMultiplier =
          p.random(minRowWidthVariation, maxRowWidthVariation) *
          widthMultiplier;
        const rowWidth = drawW * rowWidthMultiplier;
        const centerOffset = p.random(minRowCenterOffset, maxRowCenterOffset);
        const rowStartX = marginX + (drawW - rowWidth) / 2 + centerOffset;

        let x = rowStartX;

        for (let c = 0; c < row.length; c++) {
          const segments = row[c];
          const cellWidth = rowWidth / row.length;

          // Add random small padding between cells
          const [minPadding, maxPadding] =
            vars.cellPadding ?? constants.cellPadding;
          const padding = p.random(minPadding, maxPadding);

          // Scale rectangle height based on row height with variable intensity
          // Allow rectangles to exceed row bounds for overlap effect
          const [minHeightMult, maxHeightMult] =
            vars.heightMultiplier ?? constants.heightMultiplier;
          const heightMultiplier = p.random(minHeightMult, maxHeightMult);
          const rectHeight =
            (segments / maxSegments) * rowHeight * heightMultiplier;

          // Draw horizontal lines instead of filled rectangle
          const x1 = x + padding / 2;
          const x2 = x + cellWidth - padding / 2;

          // Draw line for each color with different densities
          for (let colorIdx = 0; colorIdx < colors.length; colorIdx++) {
            // Vary the number of lines per color (from 60% to 100% of segments)
            const lineDensity = p.map(colorIdx, 0, colors.length - 1, 0.6, 1.0);
            const colorSegments = Math.max(
              1,
              Math.round(segments * lineDensity)
            );

            // Vary the spacing between lines per color
            const spacingMultiplier = p.map(
              colorIdx,
              0,
              colors.length - 1,
              1.2,
              0.8
            );

            for (let s = 0; s < colorSegments; s++) {
              const baseLineY =
                y -
                rectHeight / 2 +
                (s / (colorSegments - 1 || 1)) * rectHeight * spacingMultiplier;

              // Add jitter to the overall line position (1/2 of the line jitter)
              const lineYOffset = p.random(-lineJitter / 2, lineJitter / 2);
              const lineY = baseLineY + lineYOffset;

              // Calculate position in the overall canvas (0 to 1)
              const xPos = (x + cellWidth / 2 - marginX) / drawW; // horizontal position (0 = left, 1 = right)
              const yPos = (lineY - marginY) / drawH; // vertical position (0 = top, 1 = bottom)

              // Combine x and y to get overall position (top-left = 0, bottom-right = 1)
              const overallPos = (xPos + yPos) / 2;

              const colorPos = colorIdx / (colors.length - 1);
              const colorDiff = Math.abs(overallPos - colorPos);

              // Probability of rendering this color at this position
              // Close positions = high probability, far positions = low probability
              const renderProbability = Math.max(0.08, 1 - colorDiff * 1.5);

              if (p.random() < renderProbability) {
                setStroke(colors[colorIdx], p);

                // Create a slightly wavy line instead of straight
                const numPoints = Math.max(3, Math.floor((x2 - x1) / 40));
                const points: { x: number; y: number }[] = [];

                for (let i = 0; i <= numPoints; i++) {
                  const t = i / numPoints;
                  const px = p.lerp(x1, x2, t);
                  const jitter = p.random(-lineJitter, lineJitter); // Controlled vertical jitter
                  points.push({ x: px, y: lineY + jitter });
                }

                // Draw the wavy line using points
                p.beginShape();
                p.vertex(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                  p.vertex(points[i].x, points[i].y);
                }
                p.endShape();
              }
            }
          }

          x += cellWidth;
        }

        // Draw debug line at row center
        if (debug) {
          p.push();
          p.stroke(255, 0, 0);
          p.strokeWeight(1);
          p.line(marginX, y, marginX + drawW, y);
          p.pop();
        }

        cumulativeY += rowHeight;
      }
    };
  };

export default waves_01Sketch;
