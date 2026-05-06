export type ArchetypeName = "beetle";

export const ARCHETYPE_OPTIONS: ArchetypeName[] = [
  "beetle",
];

interface ArchetypeRanges {
  bodyShapes: string[];
  thoraxShapes: string[];
  bodyLength: [number, number];
  bodyWidth: [number, number];
  bodyTaper: [number, number];
  headSize: [number, number];
  headShapes: string[];
  antennaeLength: [number, number];
  antennaeCurvature: [number, number];
  legPairs: number[];
  legLengthMin: [number, number];
  legLengthMax: [number, number];
  /** auto | none | setaceous | serrate | geniculate | lamellate | clavate
   *  | pectinate | bipectinate | flabellate | moniliform | capitate */
  antennaStyles: string[];
  /** Names mirror ELYTRA_PATTERN_OPTIONS / PRONOTUM_PATTERN_OPTIONS / HEAD_PATTERN_OPTIONS. */
  elytraPatterns: string[];
  pronotumPatterns: string[];
  headPatterns: string[];
}

const ARCHETYPES: Record<ArchetypeName, ArchetypeRanges> = {
  beetle: {
    // Mirrors BODY_SHAPE_OPTIONS in bibitte-01.ts (kept in sync manually).
    bodyShapes: [
      "round", "oval", "longOval", "pear", "shield",
      "tapered", "wedge", "kite", "waisted", "boxy",
      "globular", "elongated", "flatOval", "parallelSided", "humpback", "scarab",
    ],
    // Mirrors PRONOTUM_SHAPE_OPTIONS.
    thoraxShapes: [
      "shield", "collar", "flared", "notchedPlate", "saddle", "trapezoid",
      "narrowNeck", "pinched", "wideShield", "domed", "spined", "crown", "cordate", "bulging",
    ],
    bodyLength: [160, 310],
    bodyWidth: [100, 220],
    bodyTaper: [0.3, 0.7],
    headSize: [0.5, 0.85],
    // Mirrors HEAD_SHAPE_OPTIONS.
    headShapes: [
      "compact", "wide", "clypeus", "notched", "cowl", "rostrum", "forked", "trapezoid",
      "mandibled", "horned", "bulbous", "tiny", "snout", "eyed", "chinned",
    ],
    antennaeLength: [0.3, 1.15],
    antennaeCurvature: [0.2, 0.6],
    legPairs: [3],
    legLengthMin: [40, 70],
    legLengthMax: [80, 140],
    // Mirrors ANTENNA_STYLE_OPTIONS minus "none" (so randomization always produces antennae).
    antennaStyles: [
      "auto", "setaceous", "serrate", "geniculate", "lamellate", "clavate",
      "pectinate", "bipectinate", "flabellate", "moniliform", "capitate",
    ],
    // Patterns: weight `stripedRows` and `stripedColumns` heavier so the original
    // hatched aesthetic still shows up often, with motifs as variety.
    elytraPatterns: [
      "stripedRows", "stripedRows", "stripedRows",
      "solid",
      "longitudinalStripes", "transverseBands", "vChevrons",
      "dotsRandom", "dotsGrid", "dotsClustered",
      "jaguar", "patches",
      "marginBand", "centralStripe", "tearDrops",
      "mixed",
    ],
    pronotumPatterns: [
      "stripedColumns", "stripedColumns", "stripedColumns",
      "solid",
      "longitudinalStripes", "transverseBands",
      "dotsGrid", "dotsRandom",
      "marginBand", "centralStripe",
    ],
    headPatterns: [
      "fan", "fan", "fan",
      "solid", "dots", "stripes",
    ],
  },
};

type P5Random = { random(a?: number, b?: number): number };

function pick<T>(p: P5Random, arr: T[]): T {
  return arr[Math.floor(p.random(arr.length))];
}
function range(p: P5Random, r: [number, number]): number {
  return p.random(r[0], r[1]);
}

export interface RandomizedParams {
  bodyShape: string;
  thoraxShape: string;
  bodyLength: number;
  bodyWidth: number;
  bodyTaper: number;
  headSize: number;
  headShape: string;
  antennaeLength: number;
  antennaeCurvature: number;
  legPairs: number;
  legLengthMin: number;
  legLengthMax: number;
  antennaStyle: string;
  elytraPattern: string;
  pronotumPattern: string;
  headPattern: string;
}

export function randomizeFromArchetype(p: P5Random, _archetype: string): RandomizedParams {
  const a = ARCHETYPES.beetle;
  return {
    bodyShape: pick(p, a.bodyShapes),
    thoraxShape: pick(p, a.thoraxShapes),
    bodyLength: Math.round(range(p, a.bodyLength)),
    bodyWidth: Math.round(range(p, a.bodyWidth)),
    bodyTaper: range(p, a.bodyTaper),
    headSize: range(p, a.headSize),
    headShape: pick(p, a.headShapes),
    antennaeLength: range(p, a.antennaeLength),
    antennaeCurvature: range(p, a.antennaeCurvature),
    legPairs: pick(p, a.legPairs),
    legLengthMin: Math.round(range(p, a.legLengthMin)),
    legLengthMax: Math.round(range(p, a.legLengthMax)),
    antennaStyle: pick(p, a.antennaStyles),
    elytraPattern: pick(p, a.elytraPatterns),
    pronotumPattern: pick(p, a.pronotumPatterns),
    headPattern: pick(p, a.headPatterns),
  };
}
