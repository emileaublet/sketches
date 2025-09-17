import { DotPen, allPens } from "@/pens";
import { Color, PenFamily } from "@/types";

export const findColor = (
  color: DotPen
): { color: Color; lineWidth: number; opaque: boolean } => {
  // find the pen in allPens. e.g. color will be staedtlerPens.blue_200, and you will search for staedtlerPens.pens.blue_200
  const [familyName, penName] = color.split(".");
  const family = allPens[familyName as keyof typeof allPens] as
    | PenFamily
    | undefined;
  if (!family) {
    throw new Error(`Pen family ${familyName} not found`);
  }
  const penColor = family.pens[penName];
  if (!penColor) {
    throw new Error(`Pen ${penName} not found in family ${familyName}`);
  }
  return {
    color: penColor,
    lineWidth: family.lineWidth,
    opaque: family.opaque,
  };
};
