import { DotPen } from "@/pens";
import { p5SVG } from "p5.js-svg";
import { findColor } from "./findColor";

export const setStroke = (pen: DotPen, p: p5SVG) => {
  const { color, lineWidth, opaque } = findColor(pen);
  p.stroke(color[0], color[1], color[2], opaque ? 250 : 220);
  p.strokeWeight(lineWidth);
};
