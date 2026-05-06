export type BibitteBodyPlanName =
  | "beetle";

export interface BibitteBodyPlanInput {
  bodyShape: string;
  thoraxShape: string;
  headShape: string;
  bodyLength: number;
  bodyWidth: number;
  bodyTaper: number;
  headSize: number;
  cx: number;
  cy: number;
}

export interface BibitteBodyPlanPart {
  cx: number;
  cy: number;
  w: number;
  h: number;
  shape: string;
  taper: number;
}

export interface ResolvedBibitteBodyPlan {
  name: BibitteBodyPlanName;
  headR: number;
  headCY: number;
  headShape: string;
  abdomen: BibitteBodyPlanPart;
  thorax?: BibitteBodyPlanPart;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function part(
  cx: number,
  cy: number,
  w: number,
  h: number,
  shape: string,
  taper: number,
): BibitteBodyPlanPart {
  return { cx, cy, w, h, shape, taper };
}

export function resolveBibitteBodyPlan(input: BibitteBodyPlanInput): ResolvedBibitteBodyPlan {
  const { cx, cy } = input;
  const bL = input.bodyLength;
  const bW = input.bodyWidth;
  const hs = clamp(input.headSize, 0.35, 1.55);
  const bodyTop = cy - bL * 0.46;

  const headR = bW * 0.19 * hs;
  const thoraxH = bL * 0.16;
  const abdomenH = bL * 0.7;
  const thoraxCY = bodyTop + thoraxH * 0.58;
  const abdomenCY = bodyTop + thoraxH * 0.72 + abdomenH * 0.48;

  return {
    name: "beetle",
    headR,
    headCY: bodyTop - headR * 0.06,
    headShape: input.headShape,
    abdomen: part(cx, abdomenCY, bW, abdomenH, input.bodyShape, input.bodyTaper),
    thorax: part(cx, thoraxCY, bW * 0.82, thoraxH, input.thoraxShape, 0.5),
  };
}
