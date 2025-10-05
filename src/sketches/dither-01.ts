import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { calculateDrawArea } from "@/utils/drawingArea";
import { getBayerThreshold } from "@/utils/ditherUtils";

export const meta: Meta = {
  id: "dither-01",
  title: "Dither 01",
  description: "Some dither design",
  thumbnail: "/dither-01.png",
};

type Constants = BaseConstants & {
  cellSize: number;
};

export const constants: Constants = {
  width: 550,
  height: 700,
  marginX: 80,
  marginY: 80,
  debug: false,
  cellSize: 16,
};

const ditherSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noLoop: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
      });

      drawGrid(vars.cellSize ?? constants.cellSize, [
        "micronPens.red_019",
        "micronPens.blue_036",
        "micronPens.green_029",
      ]);
      /* drawGrid((vars.cellSize ?? constants.cellSize) * 2, [
        staedtlerPens.rose,
        staedtlerPens.teal,
        staedtlerPens.violet,
      ]); */
    };

    function drawGrid(
      cellSize = vars.cellSize ?? constants.cellSize,
      colors: DotPen[] = [
        "staedtlerPens.light_blue",
        "staedtlerPens.baby_blue",
        "staedtlerPens.blue",
      ]
    ) {
      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;

      const { drawW, drawH } = calculateDrawArea(p, marginX, marginY);

      // Create pixelated gradient
      const cols = Math.floor(drawW / cellSize);
      const rows = Math.floor(drawH / cellSize);

      // Random gradient angle
      const angle = p.random(0, p.TWO_PI);
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Calculate bounds for the gradient projection
      const corners = [
        { x: 0, y: 0 },
        { x: cols - 1, y: 0 },
        { x: 0, y: rows - 1 },
        { x: cols - 1, y: rows - 1 },
      ];

      const projections = corners.map(
        (corner) => corner.x * cosAngle + corner.y * sinAngle
      );
      const minProjection = Math.min(...projections);
      const maxProjection = Math.max(...projections);

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const x = marginX + col * cellSize;
          const y = marginY + row * cellSize;

          // Create gradient with random angle
          const projection = col * cosAngle + row * sinAngle;
          const gradientValue = p.map(
            projection,
            minProjection,
            maxProjection,
            0,
            255
          );

          // Apply Bayer dithering to the gradient value
          const threshold = bayer8x8(col, row);
          const ditherThreshold = (threshold / 64) * 255;
          const pixelValue = gradientValue > ditherThreshold ? 255 : 0;

          //fillWithSolidColor(x, y, cellSize, pixelValue);
          //fillWithLines(x, y, cellSize, Math.ceil((pixelValue / 255) * 5));
          fillWithHatches(x, y, cellSize, pixelValue > 0, colors);
        }
      }
    }

    function fillWithHatches(
      x: number,
      y: number,
      size: number,
      show: boolean,
      colors: DotPen[] = [
        "staedtlerPens.light_blue",
        "staedtlerPens.baby_blue",
        "staedtlerPens.blue",
      ]
    ) {
      const lines = Math.floor(size / 3);
      const lineCount = lines;
      const lineSpacing = size / lines;

      if (!show) return;

      // shuffle colors
      for (let i = colors.length - 1; i > 0; i--) {
        const j = Math.floor(p.random() * (i + 1));
        [colors[i], colors[j]] = [colors[j], colors[i]];
      }

      for (let i = 0; i < lineCount; i++) {
        setStroke(colors[0], p);
        const offset = i * lineSpacing;
        p.line(x + offset, y, x + size, y + size - offset);
        if (i !== 0) p.line(x, y + offset, x + size - offset, y + size);
      }

      for (let i = 0; i < lineCount; i++) {
        setStroke(colors[1], p);
        const offset = i * lineSpacing;
        p.line(x + size - offset, y, x, y + size - offset);
        if (i !== 0) p.line(x + size, y + offset, x + offset, y + size);
      }
    }

    function bayer8x8(x: number, y: number): number {
      return getBayerThreshold(x, y, 8);
    }
  };

export default ditherSketch;
