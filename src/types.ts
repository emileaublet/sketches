import type p5 from "p5";
export interface Meta {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  slug?: string;
  relHref?: string;
  rel?: string;
  hidden?: boolean;
}
export interface Sketch extends Meta {
  sketch: (p: p5) => void;
}

export type Color = [number, number, number, number];

export type Pens = Record<string, Color>;

export type PenFamily = {
  name: string;
  lineWidth: number;
  opaque: boolean;
  pens: Pens;
};
