import { DotPen } from "@/pens";
import { p5SVG } from "p5.js-svg";
import { findColor } from "./findColor";

export const setColor = (pen: DotPen, p: p5SVG) => {
  const { color, opaque } = findColor(pen);
  return p.color(color[0], color[1], color[2], opaque ? 250 : 220);
};
