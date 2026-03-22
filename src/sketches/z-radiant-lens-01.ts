import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  lineCount: number;
  lineThickness: number;
  poleAxis: string;
  colorPasses: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "z-radiant-lens-01",
  title: "Radiant Lens 01",
  description:
    "Lines radiate from two poles, their crossing density creating a lens or vesica shape.",
  thumbnail: "/z-radiant-lens-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  lineCount: 120,
  lineThickness: 0.3,
  poleAxis: "vertical",
  colorPasses: 2,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  lineCount: { min: 20, max: 300, step: 10 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  poleAxis: { options: ["vertical", "horizontal"] },
  colorPasses: { min: 1, max: 4, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const zRadiantLens01 =
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

      const lineCount = vars.lineCount ?? constants.lineCount;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const poleAxis = vars.poleAxis ?? constants.poleAxis;
      const colorPasses = vars.colorPasses ?? constants.colorPasses;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");

      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      p.strokeWeight(lineThickness);
      p.strokeCap(p.ROUND);
      p.noFill();

      for (let pass = 0; pass < colorPasses; pass++) {
        // Pick a color for each fan, allowing same color only if palette has one entry
        const colorA = p.random(colors) as DotPen;
        let colorB = p.random(colors) as DotPen;
        if (colors.length > 1) {
          while (colorB === colorA) {
            colorB = p.random(colors) as DotPen;
          }
        }

        if (poleAxis === "vertical") {
          // Top pole fans to bottom edge; bottom pole fans to top edge
          const topPole = { x: cx, y: marginY };
          const bottomPole = { x: cx, y: marginY + drawH };

          // Fan from top pole → evenly spaced points along bottom edge
          setStroke(colorA, p);
          for (let i = 0; i < lineCount; i++) {
            const t = i / (lineCount - 1);
            const targetX = marginX + t * drawW;
            const targetY = marginY + drawH;
            p.line(topPole.x, topPole.y, targetX, targetY);
          }

          // Fan from bottom pole → evenly spaced points along top edge
          setStroke(colorB, p);
          for (let i = 0; i < lineCount; i++) {
            const t = i / (lineCount - 1);
            const targetX = marginX + t * drawW;
            const targetY = marginY;
            p.line(bottomPole.x, bottomPole.y, targetX, targetY);
          }
        } else {
          // Horizontal: left pole fans to right edge; right pole fans to left edge
          const leftPole = { x: marginX, y: cy };
          const rightPole = { x: marginX + drawW, y: cy };

          // Fan from left pole → evenly spaced points along right edge
          setStroke(colorA, p);
          for (let i = 0; i < lineCount; i++) {
            const t = i / (lineCount - 1);
            const targetX = marginX + drawW;
            const targetY = marginY + t * drawH;
            p.line(leftPole.x, leftPole.y, targetX, targetY);
          }

          // Fan from right pole → evenly spaced points along left edge
          setStroke(colorB, p);
          for (let i = 0; i < lineCount; i++) {
            const t = i / (lineCount - 1);
            const targetX = marginX;
            const targetY = marginY + t * drawH;
            p.line(rightPole.x, rightPole.y, targetX, targetY);
          }
        }
      }
    };
  };

export default zRadiantLens01;
