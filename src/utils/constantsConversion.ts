/**
 * Conversion mappings for standardizing sketch constants
 * This file provides utilities to help standardize constants across all sketches
 */

// Mapping of old property names to new standardized names
export const PROPERTY_MAPPINGS = {
  // Margin standardization
  canvasMargin: ["marginX", "marginY"], // single margin becomes both X and Y
  canvasXMargin: "marginX",
  canvasYMargin: "marginY",

  // Canvas size (already standard but listed for completeness)
  width: "width",
  height: "height",

  // Debug flag (already standard)
  debug: "debug",

  // Rotation (already standard)
  rotate: "rotate",

  // Grid properties standardization
  cols: "cols",
  rows: "rows",
  padding: "padding",

  // Line properties standardization
  lineThickness: "lineThickness",
  lineWeight: "lineThickness", // alias
  strokeWeight: "lineThickness", // alias

  // Other common properties that should be standardized
  layers: "layers",
  numNodes: "numNodes",
  numSegments: "numSegments",
} as const;

// Files that need margin standardization (already completed some)
export const COMPLETED_MARGIN_FIXES = [
  "cartesian-01.ts",
  "distortion-01.ts",
  "distortion-02.ts",
  "nodes-01.ts",
  "nodes-02.ts",
];

export const REMAINING_MARGIN_FIXES = [
  "flowerpot-01.ts", // canvasMargin -> marginX, marginY
  "plusplus-01.ts", // canvasMargin -> marginX, marginY
];

// Files that already use marginX/marginY (good)
export const ALREADY_STANDARDIZED = [
  "stairs-01.ts",
  "stairs-02.ts",
  "stairs-03.ts",
  "stairs-04.ts",
  "dither-01.ts",
  "cubes-01.ts",
  "new-sketch-01.ts",
];

// All sketches with constants (for reference)
export const ALL_SKETCHES_WITH_CONSTANTS = [
  ...COMPLETED_MARGIN_FIXES,
  ...REMAINING_MARGIN_FIXES,
  ...ALREADY_STANDARDIZED,
  "concentric-01.ts",
  "concentric-02.ts",
  "nodes-03.ts",
];

/**
 * Convert a constants object to use standardized property names
 */
export function standardizeConstants(
  constants: Record<string, any>
): Record<string, any> {
  const standardized = { ...constants };

  // Handle margin conversions
  if ("canvasMargin" in constants) {
    standardized.marginX = constants.canvasMargin;
    standardized.marginY = constants.canvasMargin;
    delete standardized.canvasMargin;
  }

  if ("canvasXMargin" in constants) {
    standardized.marginX = constants.canvasXMargin;
    delete standardized.canvasXMargin;
  }

  if ("canvasYMargin" in constants) {
    standardized.marginY = constants.canvasYMargin;
    delete standardized.canvasYMargin;
  }

  // Apply other mappings
  for (const [oldKey, newKey] of Object.entries(PROPERTY_MAPPINGS)) {
    if (
      oldKey in constants &&
      typeof newKey === "string" &&
      newKey !== oldKey
    ) {
      standardized[newKey] = constants[oldKey];
      delete standardized[oldKey];
    }
  }

  return standardized;
}

/**
 * Generate variable destructuring for old and new property names
 */
export function generateVariableDestructuring(
  constants: Record<string, any>,
  varsName = "vars",
  constantsName = "constants"
): string[] {
  const lines: string[] = [];

  // Handle margin variables
  if ("canvasMargin" in constants) {
    lines.push(
      `const marginX = ${varsName}.marginX ?? ${constantsName}.marginX;`
    );
    lines.push(
      `const marginY = ${varsName}.marginY ?? ${constantsName}.marginY;`
    );
  } else if ("canvasXMargin" in constants && "canvasYMargin" in constants) {
    lines.push(
      `const marginX = ${varsName}.marginX ?? ${constantsName}.marginX;`
    );
    lines.push(
      `const marginY = ${varsName}.marginY ?? ${constantsName}.marginY;`
    );
  }

  // Handle other standard properties
  for (const key of Object.keys(constants)) {
    if (
      ![
        "canvasMargin",
        "canvasXMargin",
        "canvasYMargin",
        "marginX",
        "marginY",
      ].includes(key)
    ) {
      lines.push(
        `const ${key} = ${varsName}.${key} ?? ${constantsName}.${key};`
      );
    }
  }

  return lines;
}

// Priority constants that should appear first in objects
export const PRIORITY_PROPERTIES = [
  "width",
  "height",
  "marginX",
  "marginY",
  "debug",
  "rotate",
] as const;

/**
 * Sort constants properties by priority (common props first, then alphabetical)
 */
export function sortConstantsProperties(
  constants: Record<string, any>
): Record<string, any> {
  const sorted: Record<string, any> = {};

  // Add priority properties first
  for (const prop of PRIORITY_PROPERTIES) {
    if (prop in constants) {
      sorted[prop] = constants[prop];
    }
  }

  // Add remaining properties alphabetically
  const remaining = Object.keys(constants)
    .filter((key) => !PRIORITY_PROPERTIES.includes(key as any))
    .sort();

  for (const key of remaining) {
    sorted[key] = constants[key];
  }

  return sorted;
}
