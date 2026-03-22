import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { penColorMultiselect } from "@/components/PenColorMultiselect";
import { setStroke } from "@/utils/setStroke";

type Constants = BaseConstants & {
  ratio: number;
  repelX: number;
  repelY: number;
  penColors: DotPen[];
  firstOutlineScale: number;
  outlineWeight: number;
  outlineTightness: number;
  outlineCurvePower: number;
  outlineDirectionDeg: number;
  outlineRotateDeg: number;
};

export const meta: Meta = {
  id: "overlap-01",
  title: "Overlap 01",
  description: "",
  thumbnail: "/overlap-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  rotate: -75,
  ratio: 0.72,
  repelX: 14,
  repelY: -8,
  penColors: all("staedtlerPens"),
  firstOutlineScale: 1.75,
  outlineWeight: 0.2,
  outlineTightness: 1.64,
  outlineCurvePower: 1.1,
  outlineDirectionDeg: 45,
  outlineRotateDeg: 0,
};

export const constantsProps = {
  ratio: { min: 0.1, max: 2, step: 0.01 },
  repelX: { min: -200, max: 200, step: 1 },
  repelY: { min: -200, max: 200, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Outline Colors",
    }),
  firstOutlineScale: { min: 1, max: 2, step: 0.01 },
  outlineWeight: { min: 0.1, max: 2, step: 0.05 },
  outlineTightness: { min: 0.2, max: 5, step: 0.01 },
  outlineCurvePower: { min: 1, max: 4, step: 0.1 },
  outlineDirectionDeg: { min: 0, max: 360, step: 1 },
  outlineRotateDeg: { min: -180, max: 180, step: 1 },
};

const overlap01Sketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      const debug = vars.debug ?? constants.debug;

      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: false,
        debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? true,
        zoomLevel: (vars as any).zoomLevel,
      });

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;

      let rectW = drawW;
      const ratioRaw = vars.ratio ?? constants.ratio;
      const ratio = Math.round(ratioRaw * 1000) / 1000;
      let rectH = rectW * ratio;
      if (rectH > drawH) {
        const scale = drawH / rectH;
        rectW *= scale;
        rectH *= scale;
      }
      const rotate = vars.rotate ?? constants.rotate ?? 0;
      const repelX = vars.repelX ?? constants.repelX;
      const repelY = vars.repelY ?? constants.repelY;
      const penColors = vars.penColors ?? constants.penColors;
      const firstOutlineScale =
        vars.firstOutlineScale ?? constants.firstOutlineScale;
      const outlineWeight = vars.outlineWeight ?? constants.outlineWeight;
      const outlineTightness =
        vars.outlineTightness ?? constants.outlineTightness;
      const outlineCurvePower =
        vars.outlineCurvePower ?? constants.outlineCurvePower;
      const outlineDirectionDeg =
        vars.outlineDirectionDeg ?? constants.outlineDirectionDeg;
      const outlineRotateDeg =
        vars.outlineRotateDeg ?? constants.outlineRotateDeg;

      const cornerRadius = Math.min(rectW, rectH) / 2;

      p.colorMode(p.RGB);
      p.noFill();
      p.strokeWeight(outlineWeight);
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      const cx = p.width / 2;
      const cy = p.height / 2;

      const palette = penColors.length ? penColors : all("staedtlerPens");
      const firstColor = p.random(palette);
      let secondColor = p.random(palette);
      if (palette.length > 1) {
        while (secondColor === firstColor) {
          secondColor = p.random(palette);
        }
      }

      const buildOutlinePoints = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
        segmentLen: number,
      ) => {
        const pts: Array<{ x: number; y: number }> = [];
        const addLine = (x1: number, y1: number, x2: number, y2: number) => {
          const len = Math.hypot(x2 - x1, y2 - y1);
          const steps = Math.max(2, Math.ceil(len / segmentLen));
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
          }
        };
        const addArc = (
          cx: number,
          cy: number,
          start: number,
          end: number,
        ) => {
          const arcLen = Math.abs(end - start) * r;
          const steps = Math.max(3, Math.ceil(arcLen / segmentLen));
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = start + (end - start) * t;
            pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
          }
        };

        const left = x;
        const right = x + w;
        const top = y;
        const bottom = y + h;

        addLine(left + r, top, right - r, top);
        addArc(right - r, top + r, -Math.PI / 2, 0);
        addLine(right, top + r, right, bottom - r);
        addArc(right - r, bottom - r, 0, Math.PI / 2);
        addLine(right - r, bottom, left + r, bottom);
        addArc(left + r, bottom - r, Math.PI / 2, Math.PI);
        addLine(left, bottom - r, left, top + r);
        addArc(left + r, top + r, Math.PI, Math.PI * 1.5);

        return pts;
      };

      const pointInRoundedRect = (
        px: number,
        py: number,
        w: number,
        h: number,
        r: number,
      ) => {
        if (px < 0 || px > w || py < 0 || py > h) return false;
        const innerLeft = r;
        const innerRight = w - r;
        const innerTop = r;
        const innerBottom = h - r;
        if (
          (px >= innerLeft && px <= innerRight) ||
          (py >= innerTop && py <= innerBottom)
        ) {
          return true;
        }
        const cx = px < innerLeft ? innerLeft : innerRight;
        const cy = py < innerTop ? innerTop : innerBottom;
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy <= r * r;
      };

      p.rectMode(p.CORNER);

      p.push();
      p.translate(cx - repelX / 2, cy - repelY / 2);
      p.rotate(p.radians(rotate));
      p.translate(-rectW / 2, -rectH / 2);
      setStroke(firstColor, p);
      p.strokeWeight(outlineWeight);
      p.noFill();
      const offsetLimit = Math.hypot(rectW, rectH);
      const offsetStartX = 0;
      const offsetStartY = 0;
      const directionRad = p.radians(outlineDirectionDeg);
      const dirX = Math.cos(directionRad);
      const dirY = Math.sin(directionRad);
      const baseStep =
        Math.max(0.15, Math.min(rectW, rectH) / 260) /
        Math.pow(outlineTightness, 1.6);
      const growthRatio = 1 + 0.012 / Math.pow(outlineTightness, 1.3);
      for (
        let offset = 0, i = 0;
        offset <= offsetLimit;
        offset +=
          baseStep * Math.pow(growthRatio, Math.pow(i, outlineCurvePower)),
          i++
      ) {
        const grow = firstOutlineScale + i * 0.01;
        const w = rectW * grow;
        const h = rectH * grow;
        const r = Math.min(w, h) / 2;
        const yPivot = (rectH - h) / 2;
        const dx = offset * dirX;
        const dy = offset * dirY;
        const segmentLen = Math.max(0.8, outlineWeight * 2.5);
        const points = buildOutlinePoints(0, 0, w, h, r, segmentLen);
        const rad = p.radians(outlineRotateDeg);
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const pivotX = 0;
        const pivotY = h / 2;

        p.beginShape();
        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          const ax = pt.x - pivotX;
          const ay = pt.y - pivotY;
          const rx = pivotX + ax * cosA - ay * sinA + offsetStartX + dx;
          const ry = pivotY + ax * sinA + ay * cosA + offsetStartY + dy + yPivot;
          if (pointInRoundedRect(rx, ry, rectW, rectH, cornerRadius)) {
            p.curveVertex(rx, ry);
          }
        }
        p.endShape();
      }
      p.pop();

      p.push();
      p.translate(cx + repelX / 2, cy + repelY / 2);
      p.rotate(p.radians(rotate + 180));
      p.translate(-rectW / 2, -rectH / 2);
      setStroke(secondColor, p);
      p.strokeWeight(outlineWeight);
      p.noFill();
      for (
        let offset = 0, i = 0;
        offset <= offsetLimit;
        offset +=
          baseStep * Math.pow(growthRatio, Math.pow(i, outlineCurvePower)),
          i++
      ) {
        const grow = firstOutlineScale + i * 0.01;
        const w = rectW * grow;
        const h = rectH * grow;
        const r = Math.min(w, h) / 2;
        const yPivot = (rectH - h) / 2;
        const dx = offset * dirX;
        const dy = offset * dirY;
        const segmentLen = Math.max(0.8, outlineWeight * 2.5);
        const points = buildOutlinePoints(0, 0, w, h, r, segmentLen);
        const rad = p.radians(outlineRotateDeg);
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const pivotX = 0;
        const pivotY = h / 2;

        p.beginShape();
        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          const ax = pt.x - pivotX;
          const ay = pt.y - pivotY;
          const rx = pivotX + ax * cosA - ay * sinA + offsetStartX + dx;
          const ry = pivotY + ax * sinA + ay * cosA + offsetStartY + dy + yPivot;
          if (pointInRoundedRect(rx, ry, rectW, rectH, cornerRadius)) {
            p.curveVertex(rx, ry);
          }
        }
        p.endShape();
      }
      p.pop();

      if (debug) {
        const drawMaskOutline = (tx: number, ty: number) => {
          p.push();
          p.translate(tx, ty);
          p.rotate(p.radians(rotate));
          p.translate(-rectW / 2, -rectH / 2);
          p.stroke(255, 0, 0, 180);
          p.strokeWeight(0.6);
          p.noFill();
          p.rect(0, 0, rectW, rectH, cornerRadius);
          p.pop();
        };

        drawMaskOutline(cx - repelX / 2, cy - repelY / 2);
        drawMaskOutline(cx + repelX / 2, cy + repelY / 2);
      }
    };
  };

export default overlap01Sketch;
