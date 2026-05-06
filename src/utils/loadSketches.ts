import { Meta, type Sketch } from "../types";

export function loadSketches(): Meta[] {
  const sketches: Meta[] = [];
  const modules = import.meta.glob("../sketches/*.ts", { eager: true });

  for (const path in modules) {
    const module = modules[path] as {
      meta?: Omit<Sketch, "sketch">;
      default?: Sketch["sketch"];
    };

    if (!path.includes("index.ts") && module.meta && module.default) {
      sketches.push({
        ...module.meta,
        slug: path.replace("../sketches/", "").replace(".ts", ""),
      });
    }
  }

  return sketches;
}
