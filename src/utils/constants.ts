/**
 * Standardized constants system for sketches
 *
 * This file provides:
 * 1. Base interfaces for common sketch properties
 * 2. Category-specific interfaces for specialized sketches
 * 3. Utility function to generate Leva controls
 */

// Base interface that all sketches should have
export interface BaseConstants {
  // Canvas dimensions
  width: number;
  height: number;

  // Margins - standardized to marginX/marginY
  marginX: number;
  marginY: number;

  // Common controls
  debug?: boolean;
  rotate?: number; // degrees
}

// Grid-based sketches
export interface GridConstants {
  cols: number;
  rows: number;
  padding?: number;
  gridCellSize?: number;
}

// Line drawing sketches
export interface LineConstants {
  lineThickness: number;
  lineLengthMin: number;
  lineLengthMax: number;
  linesPerSegment?: number;
}

// Pattern generation sketches
export interface PatternConstants {
  drawPatternLengthMin: number;
  drawPatternLengthMax: number;
  skipPatternLengthMin: number;
  skipPatternLengthMax: number;
  maxGapInPattern: number;
  insideRangeProbability: number;
  outsideRangeProbability: number;
}

// Path generation sketches
export interface PathConstants {
  bezierSteps: number;
  cornerRadius: number;
  pathSmoothing?: number;
}

// Node/point-based sketches
export interface NodeConstants {
  numNodes: number;
  nodeSize: number;
  minNodeSize?: number;
  maxNodeSize?: number;
  nodeSpacing?: number;
}

// Animation/interactive sketches
export interface AnimationConstants {
  animationSpeed?: number;
  frameRate?: number;
  autoPlay?: boolean;
}

// Leva control definitions for different types
export type LevaControlType =
  | { value: number; min?: number; max?: number; step?: number }
  | { value: boolean }
  | { value: string; options?: string[] }
  | { value: [number, number]; min?: number; max?: number; step?: number };

// Utility function to convert constants to Leva controls
export function createControls<T extends Record<string, any>>(
  constants: T,
  controlConfig?: Partial<Record<keyof T, LevaControlType>>
): Record<keyof T, LevaControlType> {
  let controls = {} as Record<keyof T, LevaControlType>;

  // reorder so debug at the end
  const { debug, ...rest } = constants;
  controls = {
    paperSize: {
      value: "Custom",
      options: [
        "9x12 -- 2286x3048",
        "11x14 -- 2794x3556",
        "11x17 -- 2794x4318",
        "12x16 -- 3048x4064",
        "14x17 -- 3556x4318",
        "12x18 -- 3048x4572",
        "18x24 -- 4570x6100",
        "8.5x11 -- 2159x2794",
        "A3 -- 2940x4200",
      ],
    },
    paperSizeRatio: { value: 0.25, min: 0.1, max: 1, step: 0.0001 },
    ...rest,
    ...(debug !== undefined ? { debug } : {}),
  } as Record<keyof T, LevaControlType>;

  for (const [key, value] of Object.entries(constants)) {
    const configKey = key as keyof T;

    // Use provided config if available
    if (controlConfig?.[configKey]) {
      controls[configKey] = controlConfig[configKey]!;
      continue;
    }

    // Auto-generate based on type and naming patterns
    if (typeof value === "boolean") {
      controls[configKey] = { value };
    } else if (typeof value === "number") {
      // Smart defaults based on property name patterns
      if (key.includes("width") || key.includes("height")) {
        controls[configKey] = { value, min: 100, max: 2000, step: 50 };
      } else if (key.includes("margin") || key.includes("padding")) {
        controls[configKey] = { value, min: 0, max: 200, step: 5 };
      } else if (key.includes("thickness") || key.includes("weight")) {
        controls[configKey] = { value, min: 0.1, max: 5, step: 0.1 };
      } else if (key.includes("rotate") || key.includes("angle")) {
        controls[configKey] = { value, min: -180, max: 180, step: 5 };
      } else if (key.includes("probability") || key.includes("chance")) {
        controls[configKey] = { value, min: 0, max: 1, step: 0.01 };
      } else if (key.includes("speed") || key.includes("rate")) {
        controls[configKey] = { value, min: 0.1, max: 5, step: 0.1 };
      } else if (key.includes("size") || key.includes("radius")) {
        controls[configKey] = {
          value,
          min: 1,
          max: Math.max(300, value * 2),
          step: 1,
        };
      } else if (key.includes("numPoints")) {
        controls[configKey] = { value, min: 1, max: 500, step: 1 };
      } else if (key.includes("cols") || key.includes("rows")) {
        controls[configKey] = { value, min: 1, max: 50, step: 1 };
      } else if (key.includes("min") || key.includes("max")) {
        controls[configKey] = {
          value,
          min: 0,
          max: value * 3,
          step: value > 10 ? 1 : 0.1,
        };
      } else {
        // Default numeric control
        controls[configKey] = {
          value,
          min: 0,
          max: Math.max(100, value * 2),
          step: value > 10 ? 1 : 0.1,
        };
      }
    } else if (typeof value === "string") {
      controls[configKey] = { value };
    } else {
      // Fallback for complex types
      controls[configKey] = { value } as any;
    }
  }

  return controls;
}
