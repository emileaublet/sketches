import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setStroke } from "@/utils/setStroke";

export const meta: Meta = {
  id: "dither-01",
  title: "Dither 01",
  description: "Some dither design",
  thumbnail: "/dither-01.png",
};

export const constants = {
  width: 550,
  height: 700,
  marginX: 80,
  marginY: 80,
  cellSize: 16,
};

const ditherSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      if (seed !== null) p.randomSeed(seed);
      p.createCanvas(
        vars.width ?? constants.width,
        vars.height ?? constants.height,
        p.SVG
      );
      //p.noFill();

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
      p.noLoop();
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

      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

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
      const bayerMatrix = [
        [0, 48, 12, 60, 3, 51, 15, 63],
        [32, 16, 44, 28, 35, 19, 47, 31],
        [8, 56, 4, 52, 11, 59, 7, 55],
        [40, 24, 36, 20, 43, 27, 39, 23],
        [2, 50, 14, 62, 1, 49, 13, 61],
        [34, 18, 46, 30, 33, 17, 45, 29],
        [10, 58, 6, 54, 9, 57, 5, 53],
        [42, 26, 38, 22, 41, 25, 37, 21],
      ];
      return bayerMatrix[y % 8][x % 8];
    }
  };

export default ditherSketch;
