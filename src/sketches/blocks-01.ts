import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

// Inspired by Rudolph de Harak's book cover designs:
// vertical columns subdivided into stacked horizontal bands,
// each band filled with dense hatching using a different pen color.

type Constants = BaseConstants & {
  columnWidthMin: number;
  columnWidthMax: number;
  columnGapMin: number;
  columnGapMax: number;
  bandHeightMin: number;
  bandHeightMax: number;
  lineSpacing: number;
  lineThickness: number;
  bandGap: number;
  colors: DotPen[];
};

export const meta: Meta = {
  id: "blocks-01",
  title: "Blocks 01",
  description: "Vertical columns of hatched color bands",
  thumbnail: "/blocks-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  columnWidthMin: 40,
  columnWidthMax: 100,
  columnGapMin: 4,
  columnGapMax: 16,
  bandHeightMin: 20,
  bandHeightMax: 80,
  lineSpacing: 2,
  lineThickness: 0.4,
  bandGap: 2,
  colors: all("zebraSarasa"),
};

export const constantsProps = {
  columnWidthMin: { min: 10, max: 200, step: 5 },
  columnWidthMax: { min: 20, max: 300, step: 5 },
  columnGapMin: { min: 0, max: 30, step: 1 },
  columnGapMax: { min: 0, max: 60, step: 1 },
  bandHeightMin: { min: 5, max: 100, step: 5 },
  bandHeightMax: { min: 10, max: 200, step: 5 },
  lineSpacing: { min: 0.5, max: 8, step: 0.25 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  bandGap: { min: 0, max: 10, step: 1 },
  colors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const blocks01Sketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        strokeWeight: vars.lineThickness ?? constants.lineThickness,
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

      const columnWidthMin = vars.columnWidthMin ?? constants.columnWidthMin;
      const columnWidthMax = vars.columnWidthMax ?? constants.columnWidthMax;
      const columnGapMin = vars.columnGapMin ?? constants.columnGapMin;
      const columnGapMax = vars.columnGapMax ?? constants.columnGapMax;
      const bandHeightMin = vars.bandHeightMin ?? constants.bandHeightMin;
      const bandHeightMax = vars.bandHeightMax ?? constants.bandHeightMax;
      const lineSpacing = vars.lineSpacing ?? constants.lineSpacing;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const bandGap = vars.bandGap ?? constants.bandGap;

      const colorPool = (vars.colors ?? constants.colors) as DotPen[];
      const colors = colorPool.length > 0 ? colorPool : all("zebraSarasa");

      p.blendMode(p.MULTIPLY);

      // Generate columns left to right
      let curX = startX;
      let lastColor: DotPen | null = null;

      while (curX < startX + drawW) {
        const colW = Math.min(
          p.random(columnWidthMin, columnWidthMax),
          startX + drawW - curX,
        );
        if (colW < columnWidthMin * 0.5) break;

        const colX = curX;
        const colX2 = colX + colW;

        // Generate stacked bands for this column
        let curY = startY;
        while (curY < startY + drawH) {
          const bandH = Math.min(
            p.random(bandHeightMin, bandHeightMax),
            startY + drawH - curY - bandGap,
          );
          if (bandH < bandHeightMin * 0.5) break;

          // Pick a color different from last to ensure contrast
          let color: DotPen;
          let tries = 0;
          do {
            color = p.random(colors) as DotPen;
            tries++;
          } while (color === lastColor && colors.length > 1 && tries < 8);
          lastColor = color;

          setStroke(color, p);
          p.strokeWeight(lineThickness);

          // Fill band with dense horizontal lines
          const spacing = p.random(lineSpacing * 0.8, lineSpacing * 1.2);
          let y = curY;
          while (y < curY + bandH) {
            p.line(colX, y, colX2, y);
            y += spacing;
          }

          curY += bandH + bandGap;
        }

        // Advance to next column with random gap
        const gap = p.random(columnGapMin, columnGapMax);
        curX += colW + gap;
      }
    };
  };

export default blocks01Sketch;
