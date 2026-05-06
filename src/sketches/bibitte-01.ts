import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import { generateBibitteColors } from "./bibitte/palette";
import { randomizeFromArchetype } from "./bibitte/archetypes";
import { renderBibitte } from "./bibitte/creature";
import {
  ELYTRA_PATTERN_OPTIONS,
  PRONOTUM_PATTERN_OPTIONS,
  HEAD_PATTERN_OPTIONS,
  type ElytraPattern,
  type PronotumPattern,
  type HeadPattern,
} from "./bibitte/patterns";
import { DotPen } from "@/pens";
import { penColorMultiselect } from "@/components/PenColorMultiselect";

// Catalogs are local so the randomizer (archetypes.ts) and the UI options stay
// in sync. Adding a new shape: add it here AND in archetypes.ts.
const BODY_SHAPE_OPTIONS = [
  // classic
  "round", "oval", "longOval", "pear", "shield",
  "tapered", "wedge", "kite", "waisted", "boxy",
  // expanded
  "globular", "elongated", "flatOval", "parallelSided", "humpback", "scarab",
] as const;

const PRONOTUM_SHAPE_OPTIONS = [
  // classic
  "shield", "collar", "flared", "notchedPlate", "saddle", "trapezoid",
  // expanded
  "narrowNeck", "pinched", "wideShield", "domed", "spined", "crown", "cordate", "bulging",
] as const;

const HEAD_SHAPE_OPTIONS = [
  // classic
  "compact", "wide", "clypeus", "notched", "cowl", "rostrum", "forked", "trapezoid",
  // expanded
  "mandibled", "horned", "bulbous", "tiny", "snout", "eyed", "chinned",
] as const;

const ANTENNA_STYLE_OPTIONS = [
  "auto", "none",
  "setaceous", "serrate", "geniculate", "lamellate", "clavate",
  "pectinate", "bipectinate", "flabellate", "moniliform", "capitate",
] as const;

type Constants = BaseConstants & {
  // ── Render & pen ────────────────────────────────────────
  renderStyle: "fill" | "line";
  lineWidth: number;
  roundness: number;

  // ── Body / abdomen ──────────────────────────────────────
  bodyShape: string;
  bodyDensity: number;
  bundleLengthMin: number;
  bundleLengthMax: number;
  gapMin: number;
  gapMax: number;
  colorRandomness: number;

  // ── Pronotum (thorax) ───────────────────────────────────
  thoraxShape: string;
  pronotumPattern: PronotumPattern | "auto";
  pronotumDensity: number;
  pronotumColumnWidthMin: number;
  pronotumColumnWidthMax: number;

  // ── Elytra (wings) ──────────────────────────────────────
  elytraPattern: ElytraPattern | "auto";
  wingDensity: number;
  wingRowHeightMin: number;
  wingRowHeightMax: number;

  // ── Head ────────────────────────────────────────────────
  headShape: string;
  headSize: number;
  headPattern: HeadPattern | "auto";
  headDensity: number;

  // ── Antennae ────────────────────────────────────────────
  antennaStyle: string;
  antennaeLength: number;
  antennaeCurvature: number;

  // ── Legs ────────────────────────────────────────────────
  legPairs: number;
  legLengthMin: number;
  legLengthMax: number;
  appendageHatchDense: number;
  appendageHatchSparse: number;

  // ── Hand-drawn feel ─────────────────────────────────────
  shapeJitter: number;
  lineJitter: number;

  // ── Colors ──────────────────────────────────────────────
  bodyColors: DotPen[];
  pronotumColors: DotPen[];
  wingColors: DotPen[];
  headColors: DotPen[];
  appendageColors: DotPen[];
};

export const meta: Meta = {
  id: "bibitte-01",
  title: "Bibitte",
  description: "Flat geometric insect generator — bold specimen poster style",
  thumbnail: "/bibitte-01.png",
};

export const constants: Constants = {
  width: 600,
  height: 800,
  marginX: 40,
  marginY: 40,
  debug: false,
  useSVG: false,

  // ── Render & pen ──
  renderStyle: "line",
  lineWidth: 0.6,
  roundness: 0,

  // ── Body / abdomen ──
  bodyShape: "shield",
  bodyDensity: 0.92,
  bundleLengthMin: 12,
  bundleLengthMax: 36,
  gapMin: 0,
  gapMax: 0,
  colorRandomness: 0.15,

  // ── Pronotum ──
  thoraxShape: "shield",
  pronotumPattern: "auto",
  pronotumDensity: 0.72,
  pronotumColumnWidthMin: 14,
  pronotumColumnWidthMax: 48,

  // ── Elytra ──
  elytraPattern: "auto",
  wingDensity: 0.75,
  wingRowHeightMin: 16,
  wingRowHeightMax: 60,

  // ── Head ──
  headShape: "compact",
  headSize: 0.7,
  headPattern: "auto",
  headDensity: 0.78,

  // ── Antennae ──
  antennaStyle: "auto",
  antennaeLength: 0.5,
  antennaeCurvature: 0.4,

  // ── Legs ──
  legPairs: 3,
  legLengthMin: 62,
  legLengthMax: 118,
  appendageHatchDense: 0.7,
  appendageHatchSparse: 1.4,

  // ── Hand-drawn feel ──
  shapeJitter: 0.6,
  lineJitter: 0.4,

  // ── Colors ──
  bodyColors: ["staedtlerPens.red", "staedtlerPens.brown"] as DotPen[],
  pronotumColors: ["staedtlerPens.blue", "staedtlerPens.black"] as DotPen[],
  wingColors: ["staedtlerPens.green", "staedtlerPens.yellow"] as DotPen[],
  headColors: ["staedtlerPens.black"] as DotPen[],
  appendageColors: ["staedtlerPens.black"] as DotPen[],
};

// constantsProps order drives the UI panel order. Keep it in the same logical
// groups as the `constants` declaration above so the panel reads top-down.
export const constantsProps = {
  // ── Render & pen ──
  renderStyle: { options: ["fill", "line"] as const },
  lineWidth: { min: 0.2, max: 3, step: 0.1 },
  roundness: { min: 0, max: 10, step: 0.1 },

  // ── Body ──
  bodyShape: { options: [...BODY_SHAPE_OPTIONS] },
  bodyDensity: { min: 0, max: 1, step: 0.01 },
  bundleLengthMin: { min: 1, max: 80, step: 1 },
  bundleLengthMax: { min: 1, max: 80, step: 1 },
  gapMin: { min: 0, max: 40, step: 0.5 },
  gapMax: { min: 0, max: 40, step: 0.5 },
  colorRandomness: { min: 0, max: 1, step: 0.05 },

  // ── Pronotum ──
  thoraxShape: { options: [...PRONOTUM_SHAPE_OPTIONS] },
  pronotumPattern: { options: ["auto", ...PRONOTUM_PATTERN_OPTIONS] },
  pronotumDensity: { min: 0, max: 1, step: 0.01 },
  pronotumColumnWidthMin: { min: 4, max: 120, step: 1 },
  pronotumColumnWidthMax: { min: 4, max: 120, step: 1 },

  // ── Elytra ──
  elytraPattern: { options: ["auto", ...ELYTRA_PATTERN_OPTIONS] },
  wingDensity: { min: 0, max: 1, step: 0.01 },
  wingRowHeightMin: { min: 4, max: 200, step: 1 },
  wingRowHeightMax: { min: 4, max: 200, step: 1 },

  // ── Head ──
  headShape: { options: [...HEAD_SHAPE_OPTIONS] },
  headSize: { min: 0.3, max: 2.0, step: 0.05 },
  headPattern: { options: ["auto", ...HEAD_PATTERN_OPTIONS] },
  headDensity: { min: 0, max: 1, step: 0.01 },

  // ── Antennae ──
  antennaStyle: { options: [...ANTENNA_STYLE_OPTIONS] },
  antennaeLength: { min: 0.2, max: 2.0, step: 0.05 },
  antennaeCurvature: { min: 0, max: 1, step: 0.05 },

  // ── Legs ──
  appendageHatchDense: { min: 0.05, max: 1, step: 0.01 },
  appendageHatchSparse: { min: 0.3, max: 5, step: 0.05 },

  // ── Hand-drawn feel ──
  shapeJitter: { min: 0, max: 3, step: 0.05 },
  lineJitter: { min: 0, max: 3, step: 0.05 },

  // ── Colors ──
  bodyColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Body colors",
    }),
  pronotumColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Pronotum colors",
    }),
  wingColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Wing colors (color 2 used as elytra pattern accent)",
    }),
  headColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Head colors",
    }),
  appendageColors: (value: DotPen[]) =>
    penColorMultiselect({
      family: "staedtlerPens",
      selected: value?.length ? value : undefined,
      label: "Leg / antenna colors",
    }),
};

const bibitte01 =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: false,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? constants.useSVG,
        zoomLevel: (vars as any).zoomLevel,
      });

      if (seed !== null) {
        p.randomSeed(seed);
        p.noiseSeed(seed);
      }

      const archetypeDefaults = randomizeFromArchetype(p, "beetle");

      // Archetype is base; user-changed values override defaults.
      const merged = { ...constants, ...archetypeDefaults };
      for (const key of Object.keys(constants) as Array<keyof typeof constants>) {
        const varVal = vars[key];
        const constVal = constants[key];
        if (varVal !== undefined && varVal !== constVal) {
          (merged as any)[key] = varVal;
        }
      }
      const marginX = merged.marginX ?? constants.marginX;
      const marginY = merged.marginY ?? constants.marginY;
      const drawableW = p.width - marginX * 2;
      const drawableH = p.height - marginY * 2;
      Object.assign(merged, {
        bodyLength: Math.round(drawableH * p.random(0.58, 0.68)),
        bodyWidth: Math.round(drawableW * p.random(0.38, 0.48)),
        legLengthMin: Math.round(drawableW * p.random(0.1, 0.14)),
        legLengthMax: Math.round(drawableW * p.random(0.18, 0.24)),
        legPairs: 3,
      });

      const colors = generateBibitteColors({
        bodyColors: merged.bodyColors,
        wingColors: merged.wingColors,
        pronotumColors: merged.pronotumColors,
        headColors: merged.headColors,
        appendageColors: merged.appendageColors,
      });

      renderBibitte(p, {
        // body
        bodyShape: merged.bodyShape,
        bodyLength: merged.bodyLength,
        bodyWidth: merged.bodyWidth,
        bodyTaper: merged.bodyTaper,
        bodyDensity: merged.bodyDensity,
        // pronotum
        thoraxShape: merged.thoraxShape,
        pronotumPattern: merged.pronotumPattern,
        pronotumDensity: merged.pronotumDensity,
        pronotumColumnWidthMin: merged.pronotumColumnWidthMin,
        pronotumColumnWidthMax: merged.pronotumColumnWidthMax,
        // elytra
        elytraPattern: merged.elytraPattern,
        wingDensity: merged.wingDensity,
        wingRowHeightMin: merged.wingRowHeightMin,
        wingRowHeightMax: merged.wingRowHeightMax,
        // head
        headSize: merged.headSize,
        headShape: merged.headShape,
        headPattern: merged.headPattern,
        headDensity: merged.headDensity,
        // antennae
        antennaeLength: merged.antennaeLength,
        antennaeCurvature: merged.antennaeCurvature,
        antennaStyle: merged.antennaStyle,
        // legs
        legPairs: merged.legPairs,
        legLengthMin: merged.legLengthMin,
        legLengthMax: merged.legLengthMax,
        // pen / render
        renderStyle: merged.renderStyle,
        lineWidth: merged.lineWidth,
        roundness: merged.roundness,
        // hatching detail
        bundleLengthMin: merged.bundleLengthMin,
        bundleLengthMax: merged.bundleLengthMax,
        gapMin: merged.gapMin,
        gapMax: merged.gapMax,
        colorRandomness: merged.colorRandomness,
        appendageHatchDense: merged.appendageHatchDense,
        appendageHatchSparse: merged.appendageHatchSparse,
        // hand-drawn feel
        shapeJitter: merged.shapeJitter,
        lineJitter: merged.lineJitter,
        // canvas
        marginX: merged.marginX,
        marginY: merged.marginY,
        width: merged.width,
        height: merged.height,
      }, colors);
    };
  };

export default bibitte01;
