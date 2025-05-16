import type p5 from "p5";
export interface Meta {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  slug?: string;
  relHref?: string;
  rel?: string;
}
export interface Sketch extends Meta {
  sketch: (p: p5) => void;
}
