import { Rgb } from "culori";
import { Color } from "@/types";

export function colorToRgb(color: Color): Rgb {
  return {
    mode: "rgb",
    r: color[0],
    g: color[1],
    b: color[2],
    alpha: color[3] !== undefined ? color[3] : 1,
  };
}
