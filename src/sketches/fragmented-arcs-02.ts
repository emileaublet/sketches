import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  cellSize: number;
  doubleCellProbability: number;
  lineSpacingMin: number;
  lineSpacingMax: number;
  lineThickness: number;
  fillProbability: number;
  bandsPerCell: number;
  doubleBandProbability: number;
  fillCenter: boolean;
  colorPasses: number;
  gapProbability: number;
  overlapProbability: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "fragmented-arcs-02",
  title: "Fragmented Arcs 02",
  description:
    "Grid of arc segments with perpendicular tick marks along the path",
  thumbnail: "/fragmented-arcs-02.png",
};

export const constants: Constants = {
  width: 560,
  height: 680,
  marginX: 40,
  marginY: 40,
  debug: false,
  cellSize: 40,
  doubleCellProbability: 0.15,
  lineSpacingMin: 0.5,
  lineSpacingMax: 1.4,
  lineThickness: 0.4,
  fillProbability: 0.78,
  bandsPerCell: 5,
  doubleBandProbability: 0.15,
  fillCenter: false,
  colorPasses: 2,
  gapProbability: 0.2,
  overlapProbability: 0.8,
  penColors: all("staedtlerPens"),
};

export const constantsProps = {
  cellSize: { min: 15, max: 100, step: 5 },
  doubleCellProbability: { min: 0, max: 1, step: 0.05 },
  lineSpacingMin: { min: 0.5, max: 4, step: 0.01 },
  lineSpacingMax: { min: 0.5, max: 4, step: 0.01 },
  lineThickness: { min: 0.1, max: 1, step: 0.05 },
  fillProbability: { min: 0, max: 1, step: 0.05 },
  bandsPerCell: { min: 2, max: 10, step: 1 },
  doubleBandProbability: { min: 0, max: 1, step: 0.05 },
  fillCenter: {},
  colorPasses: { min: 1, max: 5, step: 1 },
  gapProbability: { min: 0, max: 1, step: 0.05 },
  overlapProbability: { min: 0, max: 1, step: 0.05 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

// Corner definitions: [cornerIndex] => { cx offset, cy offset, startAngle, endAngle }
const CORNER_CONFIG = [
  { dx: 0, dy: 0, start: 0, end: Math.PI / 2 },
  { dx: 1, dy: 0, start: Math.PI / 2, end: Math.PI },
  { dx: 1, dy: 1, start: Math.PI, end: (3 * Math.PI) / 2 },
  { dx: 0, dy: 1, start: (3 * Math.PI) / 2, end: 2 * Math.PI },
];

interface Cell {
  x: number;
  y: number;
  size: number;
}

const fragmentedArcs02 =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        debug: false,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      if (seed !== null) {
        p.randomSeed(seed);
        p.noiseSeed(seed);
      }

      const debug = vars.debug ?? constants.debug;
      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const cellSize = vars.cellSize ?? constants.cellSize;
      const doubleCellProbability =
        vars.doubleCellProbability ?? constants.doubleCellProbability;
      const lineSpacingMin = vars.lineSpacingMin ?? constants.lineSpacingMin;
      const lineSpacingMax = vars.lineSpacingMax ?? constants.lineSpacingMax;
      const lineThickness = vars.lineThickness ?? constants.lineThickness;
      const fillProbability = vars.fillProbability ?? constants.fillProbability;
      const bandsPerCell = vars.bandsPerCell ?? constants.bandsPerCell;
      const bandWidthVal = cellSize / bandsPerCell;
      const doubleBandProbability =
        vars.doubleBandProbability ?? constants.doubleBandProbability;
      const fillCenter = vars.fillCenter ?? constants.fillCenter;
      const colorPasses = Math.round(vars.colorPasses ?? constants.colorPasses);
      const gapProbability = vars.gapProbability ?? constants.gapProbability;
      const overlapProbability =
        vars.overlapProbability ?? constants.overlapProbability;

      const penColors = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = penColors.length > 0 ? penColors : all("staedtlerPens");

      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const cols = Math.floor(drawW / cellSize);
      const rows = Math.floor(drawH / cellSize);

      const offsetX = marginX + (drawW - cols * cellSize) / 2;
      const offsetY = marginY + (drawH - rows * cellSize) / 2;

      // Build occupancy grid and cell list
      const occupied = Array.from({ length: rows }, () =>
        new Array(cols).fill(false),
      );
      const cells: Cell[] = [];

      // Build shuffled list of candidate positions for 2x2 cells
      const candidates: { col: number; row: number }[] = [];
      for (let row = 0; row < rows - 1; row++) {
        for (let col = 0; col < cols - 1; col++) {
          candidates.push({ col, row });
        }
      }
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(p.random(i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }

      for (const { col, row } of candidates) {
        if (p.random() >= doubleCellProbability) continue;
        if (
          occupied[row][col] ||
          occupied[row][col + 1] ||
          occupied[row + 1][col] ||
          occupied[row + 1][col + 1]
        )
          continue;
        occupied[row][col] = true;
        occupied[row][col + 1] = true;
        occupied[row + 1][col] = true;
        occupied[row + 1][col + 1] = true;
        cells.push({ x: col, y: row, size: 2 });
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (occupied[row][col]) continue;
          cells.push({ x: col, y: row, size: 1 });
        }
      }

      const ctx = p.drawingContext as CanvasRenderingContext2D;

      if (debug) {
        p.noFill();
        // Canvas border
        p.stroke("rgba(0,0,255,0.3)");
        p.strokeWeight(4);
        p.rect(0, 0, p.width, p.height);
        // Margin area
        p.stroke("rgba(0,255,0,0.3)");
        p.strokeWeight(3);
        p.rect(marginX, marginY, drawW, drawH);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(marginX, marginY, drawW, drawH);
      ctx.clip();

      p.blendMode(p.MULTIPLY);

      if (debug) {
        p.stroke("rgba(255,0,0,0.3)");
        p.strokeWeight(0.5);
        p.noFill();
        for (const cell of cells) {
          const s = cell.size * cellSize;
          p.rect(
            offsetX + cell.x * cellSize,
            offsetY + cell.y * cellSize,
            s,
            s,
          );
        }
      }

      // Generate grouped draw/skip pattern for an arc
      // Each color owns a region [offsetMin, offsetMax] and is more likely to draw there
      function generatePattern(
        items: number,
        offsetMin: number,
        offsetMax: number,
      ): number[] {
        const patterns: { type: "draw" | "skip"; length: number }[] = [];
        let itemsLeft = items;

        while (itemsLeft > 3) {
          const pos = patterns.reduce((a, b) => a + b.length, 0);
          const distToOffset =
            Math.min(Math.abs(pos - offsetMin), Math.abs(pos - offsetMax)) + 1;
          const probDraw = p.map(
            distToOffset,
            0,
            items / 2,
            overlapProbability,
            gapProbability,
          );
          const drawing = p.random() < probDraw;
          const length = Math.floor(
            Math.min(p.random(drawing ? 4 : 2, drawing ? 15 : 8), itemsLeft),
          );
          patterns.push({ type: drawing ? "draw" : "skip", length });
          itemsLeft -= length;
        }

        return patterns.flatMap((pat) => {
          if (pat.type === "draw") {
            return Array(pat.length).fill(1);
          }
          return Array(pat.length).fill(0);
        });
      }

      for (const cell of cells) {
        if (p.random() > fillProbability) continue;

        const s = cell.size * cellSize;
        const cellX = offsetX + cell.x * cellSize;
        const cellY = offsetY + cell.y * cellSize;
        const cornerIdx = Math.floor(p.random(4));
        const corner = CORNER_CONFIG[cornerIdx];
        const arcCX = cellX + corner.dx * s;
        const arcCY = cellY + corner.dy * s;

        // Build band list, randomly merging some into double-width
        const totalSlots = Math.floor(s / bandWidthVal);
        const startSlot = fillCenter ? 0 : 1;
        const bands: { inner: number; outer: number }[] = [];
        let slot = startSlot;
        while (slot < totalSlots) {
          const canDouble = slot + 1 < totalSlots;
          if (canDouble && p.random() < doubleBandProbability) {
            bands.push({
              inner: slot * bandWidthVal,
              outer: (slot + 2) * bandWidthVal,
            });
            slot += 2;
          } else {
            bands.push({
              inner: slot * bandWidthVal,
              outer: (slot + 1) * bandWidthVal,
            });
            slot += 1;
          }
        }

        for (const { inner: bandInner, outer: bandOuter } of bands) {
          const midR = (bandInner + bandOuter) / 2;
          const arcLength = midR * (Math.PI / 2);

          if (debug) {
            p.stroke("red");
            p.strokeWeight(0.5);
            p.noFill();
            p.arc(
              arcCX,
              arcCY,
              bandInner * 2,
              bandInner * 2,
              corner.start,
              corner.end,
            );
            p.arc(
              arcCX,
              arcCY,
              bandOuter * 2,
              bandOuter * 2,
              corner.start,
              corner.end,
            );
          }

          // Each arc gets its own independent color passes with independent spacing
          for (let cp = 0; cp < colorPasses; cp++) {
            const cellColor = colors[Math.floor(p.random(colors.length))];
            const passLineSpacing = p.random(lineSpacingMin, lineSpacingMax);
            const numTicks = Math.floor(arcLength / passLineSpacing);
            const phaseOffset = p.random(1);

            const offsetMin = Math.floor((cp / colorPasses) * numTicks);
            const offsetMax = Math.floor(((cp + 1) / colorPasses) * numTicks);
            const pattern = generatePattern(numTicks, offsetMin, offsetMax);

            p.strokeWeight(lineThickness);
            setStroke(cellColor, p);

            for (let t = 0; t < numTicks; t++) {
              if (pattern[t] === 0) continue;

              const frac = (t + phaseOffset) / numTicks;
              const angle = corner.start + frac * (corner.end - corner.start);

              const cos = Math.cos(angle);
              const sin = Math.sin(angle);

              p.line(
                arcCX + cos * bandInner,
                arcCY + sin * bandInner,
                arcCX + cos * bandOuter,
                arcCY + sin * bandOuter,
              );
            }
          }
        }
      }

      ctx.restore();
    };
  };

export default fragmentedArcs02;
