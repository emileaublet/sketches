import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  numRows: number;
  waveFreq: number;
  waveAmplitude: number;
  projFactor: number;
  colorPasses: number;
  lineThickness: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "z-wave-stack-01",
  title: "Wave Stack 01",
  description:
    "Isometric sine wave surface: stacked horizontal row-lines displaced by a sine function create a 3D relief effect where wave peaks compress rows into dense bands.",
  thumbnail: "/z-wave-stack-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  numRows: 150,
  waveFreq: 0.01,
  waveAmplitude: 80,
  projFactor: 1.0,
  colorPasses: 3,
  lineThickness: 0.3,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  numRows: { min: 20, max: 400, step: 10 },
  waveFreq: { min: 0.003, max: 0.03, step: 0.001 },
  waveAmplitude: { min: 10, max: 200, step: 5 },
  projFactor: { min: 0.2, max: 2.0, step: 0.1 },
  colorPasses: { min: 1, max: 5, step: 1 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const zWaveStack01 =
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

      const numRows = vars.numRows ?? constants.numRows;
      const waveFreq = vars.waveFreq ?? constants.waveFreq;
      const waveAmplitude = vars.waveAmplitude ?? constants.waveAmplitude;
      const projFactor = vars.projFactor ?? constants.projFactor;
      const colorPasses = vars.colorPasses ?? constants.colorPasses;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("zebraSarasa");

      const viewCenterY = marginY + drawH / 2;

      p.strokeWeight(lineThickness);
      p.strokeCap(p.ROUND);
      p.noFill();

      for (let pass = 0; pass < colorPasses; pass++) {
        const color = p.random(colors) as DotPen;
        setStroke(color, p);

        for (let row = 0; row < numRows; row++) {
          const yLevel = -drawH / 2 + (row / (numRows - 1)) * drawH;

          p.beginShape();
          for (let x = marginX; x <= marginX + drawW; x += 3) {
            const z = waveAmplitude * Math.sin(x * waveFreq);
            const screenY = viewCenterY + yLevel - z * projFactor;
            p.curveVertex(x, screenY);
          }
          p.endShape();
        }
      }
    };
  };

export default zWaveStack01;
