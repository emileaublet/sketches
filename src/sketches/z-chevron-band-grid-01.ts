import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  numCols: number;
  numRows: number;
  hatchSpacing: number;
  lineThickness: number;
  numArcs: number;
  arcSpacing: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "z-chevron-band-grid-01",
  title: "Chevron Band Grid 01",
  description:
    "A grid of diamond shapes each filled with dense vertical hatching in random pen colors, overlaid with concentric stadium outlines as a decorative border.",
  thumbnail: "/z-chevron-band-grid-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  numCols: 8,
  numRows: 10,
  hatchSpacing: 2.5,
  lineThickness: 0.35,
  numArcs: 12,
  arcSpacing: 8,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  numCols: { min: 2, max: 20, step: 1 },
  numRows: { min: 2, max: 24, step: 1 },
  hatchSpacing: { min: 1, max: 8, step: 0.5 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  numArcs: { min: 0, max: 30, step: 1 },
  arcSpacing: { min: 2, max: 20, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const zChevronBandGrid01 =
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

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      const numCols = vars.numCols ?? constants.numCols;
      const numRows = vars.numRows ?? constants.numRows;
      const hatchSpacing = vars.hatchSpacing ?? constants.hatchSpacing;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const numArcs = vars.numArcs ?? constants.numArcs;
      const arcSpacing = vars.arcSpacing ?? constants.arcSpacing;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("staedtlerPens");

      const cellW = drawW / numCols;
      const cellH = drawH / numRows;

      p.strokeWeight(lineThickness);
      p.strokeCap(p.ROUND);
      p.noFill();

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      // Draw diamond grid with hatching
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          const dcx = marginX + col * cellW + cellW / 2;
          const dcy = marginY + row * cellH + cellH / 2;

          const topX = dcx;
          const topY = dcy - cellH / 2;
          const rightX = dcx + cellW / 2;
          const rightY = dcy;
          const bottomX = dcx;
          const bottomY = dcy + cellH / 2;
          const leftX = dcx - cellW / 2;
          const leftY = dcy;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(topX, topY);
          ctx.lineTo(rightX, rightY);
          ctx.lineTo(bottomX, bottomY);
          ctx.lineTo(leftX, leftY);
          ctx.closePath();
          ctx.clip();

          const color = p.random(colors) as DotPen;
          setStroke(color, p);

          for (
            let x = dcx - cellW / 2;
            x <= dcx + cellW / 2;
            x += hatchSpacing
          ) {
            p.line(x, dcy - cellH / 2, x, dcy + cellH / 2);
          }

          ctx.restore();
        }
      }

      // Draw concentric rounded rectangles on top
      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      for (let i = 0; i < numArcs; i++) {
        const inset = i * arcSpacing + arcSpacing / 2;
        const rx = drawW / 2 - inset;
        const ry = drawH / 2 - inset;

        if (rx <= 0 || ry <= 0) break;

        const color = colors[i % colors.length] as DotPen;
        setStroke(color, p);

        const bx = cx - rx;
        const by = cy - ry;
        const bw = rx * 2;
        const bh = ry * 2;
        const r = Math.min(rx, ry);

        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, r);
        ctx.stroke();
      }
    };
  };

export default zChevronBandGrid01;
