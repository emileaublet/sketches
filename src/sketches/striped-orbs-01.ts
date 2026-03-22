import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { DotPen, all } from "@/pens";
import { setStroke } from "@/utils/setStroke";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

type Constants = BaseConstants & {
  rings: number;
  innerRadius: number;
  ringSpacing: number;
  orbSizeFactor: number;
  stripeSpacing: number;
  noiseScale: number;
  strokeWeight: number;
  colorCycles: number;
  penColors: DotPen[];
};

export const meta: Meta = {
  id: "striped-orbs-01",
  title: "Striped Orbs 01",
  description:
    "Circles arranged in concentric rings with noise-driven stripe angles and cycling colors",
  thumbnail: "/striped-orbs-01.png",
};

export const constants: Constants = {
  width: 560,
  height: 700,
  marginX: 40,
  marginY: 40,
  debug: false,
  rings: 5,
  innerRadius: 40,
  ringSpacing: 55,
  orbSizeFactor: 0.45,
  stripeSpacing: 2.5,
  noiseScale: 0.005,
  strokeWeight: 0.4,
  colorCycles: 2,
  penColors: all("zebraSarasa"),
};

export const constantsProps = {
  rings: { min: 2, max: 10, step: 1 },
  innerRadius: { min: 10, max: 100, step: 5 },
  ringSpacing: { min: 20, max: 100, step: 5 },
  orbSizeFactor: { min: 0.2, max: 0.6, step: 0.01 },
  stripeSpacing: { min: 1, max: 8, step: 0.5 },
  noiseScale: { min: 0.001, max: 0.02, step: 0.001 },
  strokeWeight: { min: 0.1, max: 1.5, step: 0.1 },
  colorCycles: { min: 1, max: 5, step: 1 },
  penColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "zebraSarasa",
      selected: value?.length ? value : undefined,
      label: "Colors",
    }),
};

const stripedOrbs01Sketch =
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
      const drawW = p.width - 2 * marginX;
      const drawH = p.height - 2 * marginY;
      const cx = marginX + drawW / 2;
      const cy = marginY + drawH / 2;

      const rings = vars.rings ?? constants.rings;
      const innerRadius = vars.innerRadius ?? constants.innerRadius;
      const ringSpacing = vars.ringSpacing ?? constants.ringSpacing;
      const orbSizeFactor = vars.orbSizeFactor ?? constants.orbSizeFactor;
      const stripeSpacing = vars.stripeSpacing ?? constants.stripeSpacing;
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const strokeWeight = vars.strokeWeight ?? constants.strokeWeight;
      const colorCycles = vars.colorCycles ?? constants.colorCycles;

      const palette = (vars.penColors ?? constants.penColors) as DotPen[];
      const colors = palette.length > 0 ? palette : all("zebraSarasa");

      p.strokeWeight(strokeWeight);
      p.strokeCap(p.ROUND);
      p.noFill();

      const noiseOffX = p.random(1000);
      const noiseOffY = p.random(1000);

      interface Orb {
        x: number;
        y: number;
        radius: number;
        ringIdx: number;
        posInRing: number;
      }
      const orbs: Orb[] = [];

      // Center orb (ring 0)
      orbs.push({
        x: cx,
        y: cy,
        radius: innerRadius * orbSizeFactor * 1.5,
        ringIdx: 0,
        posInRing: 0,
      });

      // Rings 1..rings
      for (let ring = 1; ring <= rings; ring++) {
        const ringRadius = innerRadius + (ring - 1) * ringSpacing;
        const orbRadius = ringSpacing * orbSizeFactor;
        const circumference = 2 * Math.PI * ringRadius;
        const count = Math.max(1, Math.round(circumference / (orbRadius * 2.2)));

        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          orbs.push({
            x: cx + Math.cos(angle) * ringRadius,
            y: cy + Math.sin(angle) * ringRadius,
            radius: orbRadius,
            ringIdx: ring,
            posInRing: i / count,
          });
        }
      }

      const totalOrbs = orbs.length;
      orbs.forEach((orb, orbIdx) => {
        // Stripe angle from flow field at orb center
        const noiseVal = p.noise(
          noiseOffX + orb.x * noiseScale,
          noiseOffY + orb.y * noiseScale
        );
        const stripeAngle = noiseVal * Math.PI; // 0 to PI

        const cosA = Math.cos(stripeAngle);
        const sinA = Math.sin(stripeAngle);
        // Perpendicular direction (offset between stripes)
        const perpX = -sinA;
        const perpY = cosA;

        // Color base for this orb
        const colorBase =
          Math.floor((orbIdx / totalOrbs) * colors.length * colorCycles) %
          colors.length;

        // Draw stripes as chords of the circle
        let stripeIdx = 0;
        for (let d = -orb.radius; d <= orb.radius; d += stripeSpacing) {
          const halfChord = Math.sqrt(orb.radius * orb.radius - d * d);
          if (halfChord <= 0) {
            stripeIdx++;
            continue;
          }

          const colorIdx = (stripeIdx + colorBase) % colors.length;
          setStroke(colors[colorIdx], p);

          // Center of chord (perpendicular offset from orb center)
          const px = orb.x + perpX * d;
          const py = orb.y + perpY * d;

          // Chord endpoints
          p.line(
            px - cosA * halfChord,
            py - sinA * halfChord,
            px + cosA * halfChord,
            py + sinA * halfChord
          );
          stripeIdx++;
        }
      });
    };
  };

export default stripedOrbs01Sketch;
