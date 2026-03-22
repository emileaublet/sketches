import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  cellSize: number;
  gap: number;
  lineSpacing: number;
  angle: number;
  cornerRadius: number;
  strokeWeight: number;
  colorMode: string;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "twinkle-grid-01",
  title: "Twinkle Grid 01",
  description: "Grid of rounded cells filled with colored diagonal hatching",
  thumbnail: "/twinkle-grid-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 560,
  marginX: 30,
  marginY: 30,
  debug: false,
  cellSize: 55,
  gap: 5,
  lineSpacing: 3,
  angle: 45,
  cornerRadius: 10,
  strokeWeight: 0.4,
  colorMode: "cycle",
  penColors: all("lePenPens"),
};

export const constantsProps = {
  cellSize: { min: 20, max: 120, step: 5 },
  gap: { min: 0, max: 20, step: 1 },
  lineSpacing: { min: 1, max: 10, step: 0.5 },
  angle: { min: 0, max: 90, step: 1 },
  cornerRadius: { min: 0, max: 30, step: 1 },
  strokeWeight: { min: 0.1, max: 1.5, step: 0.05 },
  colorMode: { value: "cycle", options: ["cycle", "noise", "random"] },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "lePenPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const twinkleGrid01 =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      if (seed !== null) p.noiseSeed(seed);

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const cellSize = vars.cellSize ?? constants.cellSize;
      const gap = vars.gap ?? constants.gap;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const angle = vars.angle ?? constants.angle;
      const cornerRadius = vars.cornerRadius ?? constants.cornerRadius;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const colorMode = vars.colorMode ?? constants.colorMode;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("lePenPens");

      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      const numCols = Math.ceil(drawW / (cellSize + gap)) + 1;
      const numRows = Math.ceil(drawH / (cellSize + gap)) + 1;

      const startX = marginX;
      const startY = marginY;

      const noiseOff = seed !== null ? p.random(1000) : 0;

      p.strokeWeight(strokeWeight);
      p.strokeCap(p.ROUND);
      p.noFill();

      const angleRad = (angle * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      const perpX = -sinA;
      const perpY = cosA;

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      for (let col = 0; col < numCols; col++) {
        for (let row = 0; row < numRows; row++) {
          const cellX = startX + col * (cellSize + gap);
          const cellY = startY + row * (cellSize + gap);

          // Skip cells fully outside the drawing area
          if (cellX > p.width - marginX || cellY > p.height - marginY) continue;

          // Pick color
          let colorIdx: number;
          if (colorMode === "noise") {
            colorIdx =
              Math.floor(
                p.noise(noiseOff + col * 0.3, noiseOff + row * 0.3) *
                  colors.length
              ) % colors.length;
          } else if (colorMode === "random") {
            colorIdx = Math.floor(p.random(colors.length));
          } else {
            // cycle
            colorIdx = (col + row * numCols) % colors.length;
          }

          const pen = colorMode === "random"
            ? (p.random(colors) as DotPen)
            : colors[colorIdx];

          setStroke(pen, p);

          // Draw rounded rect border using p5 rect (supports corner radius)
          p.rect(cellX, cellY, cellSize, cellSize, cornerRadius);

          // Clip to rounded rect and fill with diagonal hatching
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(cellX, cellY, cellSize, cellSize, cornerRadius);
          ctx.clip();

          const cx = cellX + cellSize / 2;
          const cy = cellY + cellSize / 2;
          const diag = Math.sqrt(cellSize * cellSize * 2) + lineSpacing;
          const numLines = Math.ceil(diag / lineSpacing) + 2;

          for (let i = -numLines; i <= numLines; i++) {
            const d = i * lineSpacing;
            const ox = cx + perpX * d;
            const oy = cy + perpY * d;
            p.line(
              ox - cosA * diag,
              oy - sinA * diag,
              ox + cosA * diag,
              oy + sinA * diag
            );
          }

          ctx.restore();
        }
      }
    };
  };

export default twinkleGrid01;
