import { DotPen, all } from "@/pens";
import { findColor } from "@/utils/findColor";

export interface BibitteColors {
  body: string[];
  wing: string[];
  pronotum: string[];
  head: string[];
  appendage: string[];
}

function penToColor(pen: DotPen): string {
  const { color, opaque } = findColor(pen);
  const a = opaque ? 0.98 : 0.78;
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${a})`;
}

function pensToColors(pens: DotPen[] | undefined): string[] {
  const list = pens && pens.length > 0 ? pens : all("staedtlerPens");
  return list.map(penToColor);
}

export interface BibittePenSelection {
  bodyColors: DotPen[];
  wingColors: DotPen[];
  pronotumColors: DotPen[];
  headColors: DotPen[];
  appendageColors: DotPen[];
}

export function generateBibitteColors(
  selection: BibittePenSelection,
): BibitteColors {
  return {
    body: pensToColors(selection.bodyColors),
    wing: pensToColors(selection.wingColors),
    pronotum: pensToColors(selection.pronotumColors),
    head: pensToColors(selection.headColors),
    appendage: pensToColors(selection.appendageColors),
  };
}
