import { Meta, type Sketch } from "../types";

export async function loadSketches(): Promise<Meta[]> {
  const sketches: Meta[] = [];

  // Dynamically import all sketch files
  const modules = import.meta.glob("../sketches/*.ts", { eager: true });

  for (const path in modules) {
    const module = modules[path] as {
      meta?: Omit<Sketch, "sketch">;
      default?: Sketch["sketch"];
    };

    // Skip index.ts and files without meta export
    if (!path.includes("index.ts") && module.meta && module.default) {
      sketches.push({
        ...module.meta,
        slug: path.replace("../sketches/", "").replace(".ts", ""),
      });
    }
  }

  return sketches;
}
