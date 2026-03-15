import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { setupCanvas } from "@/utils/canvasSetup";
import { BaseConstants } from "../utils/constants";
import polygonClipping from "polygon-clipping";
import { createBezierRoundedPath, Point } from "@/utils/pathUtils";

export const meta: Meta = {
  id: "topographic-01",
  title: "Topographic 01",
  description:
    "A topographic map generated using marching squares and Perlin noise",
  thumbnail: "/topographic-01.png",
};

type Constants = BaseConstants & {
  gridCellSize: number;
  noiseScale: number;
  noiseOctaves: number;
  noiseFalloff: number;
  distortionAmount: number;
  distortionScale: number;
  levels: number;
  minElevation: number;
  maxElevation: number;
  cornerRadius: number;
  bezierSteps: number;
  viewAngle: number;
  zScale: number;
  projection: "isometric" | "top";
  showShadows: boolean;
  showFill: boolean;
  showStroke: boolean;
  shadowNoiseScale: number;
  shadowDensity: number;
};

export const constants: Constants = {
  width: 800,
  height: 800,
  marginX: 50,
  marginY: 50,
  debug: false,
  gridCellSize: 8,
  noiseScale: 0.003,
  noiseOctaves: 4,
  noiseFalloff: 0.5,
  distortionAmount: 50,
  distortionScale: 0.002,
  levels: 12,
  minElevation: 0.2,
  maxElevation: 0.8,
  cornerRadius: 5,
  bezierSteps: 3,
  viewAngle: 45,
  zScale: 150,
  projection: "isometric",
  showShadows: false,
  showFill: true,
  showStroke: true,
  shadowNoiseScale: 0.02,
  shadowDensity: 4,
};

export const constantsProps = {
  gridCellSize: { min: 4, max: 20, step: 1 },
  noiseScale: { min: 0.001, max: 0.01, step: 0.0001 },
  noiseOctaves: { min: 1, max: 8, step: 1 },
  noiseFalloff: { min: 0.1, max: 0.9, step: 0.1 },
  distortionAmount: { min: 0, max: 200, step: 5 },
  distortionScale: { min: 0.0001, max: 0.01, step: 0.0001 },
  levels: { min: 2, max: 30, step: 1 },
  minElevation: { min: 0, max: 1, step: 0.05 },
  maxElevation: { min: 0, max: 1, step: 0.05 },
  cornerRadius: { min: 0, max: 20, step: 1 },
  bezierSteps: { min: 1, max: 10, step: 1 },
  viewAngle: { min: 0, max: 360, step: 1 },
  zScale: { min: 0, max: 500, step: 10 },
  projection: { options: ["isometric", "top"] },
  showShadows: {},
  showFill: {},
  showStroke: {},
  shadowNoiseScale: { min: 0.001, max: 0.1, step: 0.001 },
  shadowDensity: { min: 1, max: 10, step: 1 },
};

type Pair = [number, number];
type Ring = Pair[];
type Poly = Ring[]; // [Outer, Hole, Hole...]
type MultiPoly = Poly[];

const sketchFactory =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    p.setup = () => {
      // Extract vars
      const gridCellSize = vars.gridCellSize ?? constants.gridCellSize;
      const noiseScale = vars.noiseScale ?? constants.noiseScale;
      const noiseOctaves = vars.noiseOctaves ?? constants.noiseOctaves;
      const noiseFalloff = vars.noiseFalloff ?? constants.noiseFalloff;
      const distortionAmount =
        vars.distortionAmount ?? constants.distortionAmount;
      const distortionScale = vars.distortionScale ?? constants.distortionScale;
      const levels = vars.levels ?? constants.levels;
      const minElevation = vars.minElevation ?? constants.minElevation;
      const maxElevation = vars.maxElevation ?? constants.maxElevation;
      const cornerRadius = vars.cornerRadius ?? constants.cornerRadius;
      const bezierSteps = vars.bezierSteps ?? constants.bezierSteps;
      const viewAngle = vars.viewAngle ?? constants.viewAngle;
      const zScale = vars.zScale ?? constants.zScale;
      const projection = vars.projection ?? constants.projection;
      const showShadows = vars.showShadows ?? constants.showShadows;
      const showFill = vars.showFill ?? constants.showFill;
      const showStroke = vars.showStroke ?? constants.showStroke;
      const shadowNoiseScale =
        vars.shadowNoiseScale ?? constants.shadowNoiseScale;
      const shadowDensity = vars.shadowDensity ?? constants.shadowDensity;

      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        debug: vars.debug ?? constants.debug,
      });

      if (seed !== null) {
        p.noiseSeed(seed);
        p.randomSeed(seed);
      }

      // Random Monochrome Tint
      const hue = p.random(0, 360);
      const sat = p.random(30, 80); // Nice vibrant saturation

      const offsetX = p.random(10000);
      const offsetY = p.random(10000);

      const drawW = p.width;
      const drawH = p.height;
      const startX = 0;
      const startY = 0;

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;

      // Setup noise
      p.noiseDetail(noiseOctaves, noiseFalloff);
      p.colorMode(p.HSB, 360, 100, 100, 100); // Switch to HSB
      p.clear(); // Transparent background

      // Create Clipping Mask for Margins
      // This ensures drawing is strictly within the inner rectangle and keeps background transparent
      const ctx = p.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(marginX, marginY, p.width - 2 * marginX, p.height - 2 * marginY);
      ctx.clip();

      const cols = Math.ceil(drawW / gridCellSize);
      const rows = Math.ceil(drawH / gridCellSize);

      const values: number[][] = [];
      const tStart = performance.now();
      let tMarching = 0;
      let tUnion = 0;
      let tShadows = 0;
      let tDraw = 0;

      for (let i = 0; i <= cols; i++) {
        values[i] = [];
        for (let j = 0; j <= rows; j++) {
          const x = startX + i * gridCellSize;
          const y = startY + j * gridCellSize;

          // Domain Warping
          const nx = x + offsetX;
          const ny = y + offsetY;

          // Get warp offsets from independent noise space
          const qx = p.noise(nx * distortionScale, ny * distortionScale);
          const qy = p.noise(
            nx * distortionScale + 5.2,
            ny * distortionScale + 1.3,
          );

          const warpX = (qx - 0.5) * distortionAmount;
          const warpY = (qy - 0.5) * distortionAmount;

          values[i][j] = p.noise(
            (nx + warpX) * noiseScale,
            (ny + warpY) * noiseScale,
          );
        }
      }
      const tNoiseEnd = performance.now();
      console.log(`Noise Gen: ${(tNoiseEnd - tStart).toFixed(2)}ms`);

      // Draw levels
      p.strokeWeight(0.6);
      p.strokeJoin(p.ROUND);
      const centerX = p.width / 2;
      const centerY = p.height / 2;

      // Project logic
      const project = (x: number, y: number, z: number) => {
        if (projection === "top") {
          return { x, y };
        }
        // Oblique / Isometric-ish projection
        // x moves right/down
        // y moves left/down
        // z moves up
        const angleRad = p.radians(viewAngle);
        const isoX =
          (x - centerX) * p.cos(angleRad) - (y - centerY) * p.sin(angleRad);
        const isoY =
          (x - centerX) * p.sin(angleRad) + (y - centerY) * p.cos(angleRad);

        // Tilt
        const tilt = 0.6;
        const px = centerX + isoX;
        const py = centerY + isoY * tilt - z;
        return { x: px, y: py };
      };

      const pointInPoly = (pt: Point, ring: Point[]) => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const xi = ring[i].x,
            yi = ring[i].y;
          const xj = ring[j].x,
            yj = ring[j].y;
          const intersect =
            yi > pt.y !== yj > pt.y &&
            pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      };

      for (let k = 0; k < levels; k++) {
        const t0 = performance.now();
        const threshold = p.map(k, 0, levels - 1, minElevation, maxElevation);
        const z = p.map(k, 0, levels - 1, 0, zScale);

        // Monochrome Gradient: Dark to Light
        // Map level k to brightness 20 -> 95
        const brightness = p.map(k, 0, levels - 1, 20, 95);
        const fillColor = p.color(hue, sat, brightness);

        const polygonsToUnion: MultiPoly = [];

        // Run-length optimization logic
        // We scan row by row. If we find consecutive cells with state 15 (Full),
        // we create a single rectangle for them.

        for (let j = 0; j < rows; j++) {
          let startI = -1;

          for (let i = 0; i < cols; i++) {
            const x = startX + i * gridCellSize;
            const y = startY + j * gridCellSize;

            const v0 = values[i][j]; // TL
            const v1 = values[i + 1][j]; // TR
            const v2 = values[i + 1][j + 1]; // BR
            const v3 = values[i][j + 1]; // BL

            const state =
              (v0 >= threshold ? 8 : 0) +
              (v1 >= threshold ? 4 : 0) +
              (v2 >= threshold ? 2 : 0) +
              (v3 >= threshold ? 1 : 0);

            // Handle Full Cell Run (State 15)
            if (state === 15) {
              if (startI === -1) startI = i;
              continue; // Continue scan
            } else {
              // End of run or partial cell
              if (startI !== -1) {
                // Emit rectangle for run [startI, i-1]
                const rx = startX + startI * gridCellSize;
                const ry = y;
                const rw = (i - startI) * gridCellSize;
                const rh = gridCellSize;
                // Determine rectangle polygon
                const rect: Poly = [
                  [
                    [rx, ry],
                    [rx + rw, ry],
                    [rx + rw, ry + rh],
                    [rx, ry + rh],
                    [rx, ry],
                  ],
                ]; // Ring must close? polygon-clipping doesn't strict require, but good practice.
                polygonsToUnion.push(rect);
                startI = -1;
              }
            }

            if (state === 0) continue; // Empty

            // Process Partial Cell (state 1-14)
            // Helpers
            const getPt = (
              p1: { x: number; y: number },
              val1: number,
              p2: { x: number; y: number },
              val2: number,
            ): Pair => {
              const t = (threshold - val1) / (val2 - val1);
              return [p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t];
            };

            // Corners
            const tl = { x: x, y: y };
            const tr = { x: x + gridCellSize, y: y };
            const br = { x: x + gridCellSize, y: y + gridCellSize };
            const bl = { x: x, y: y + gridCellSize };

            // Edge points
            const a = getPt(tl, v0, tr, v1); // Top
            const b = getPt(tr, v1, br, v2); // Right
            const c = getPt(br, v2, bl, v3); // Bottom
            const d = getPt(bl, v3, tl, v0); // Left

            // Corner Arrays
            const TL: Pair = [tl.x, tl.y];
            const TR: Pair = [tr.x, tr.y];
            const BR: Pair = [br.x, br.y];
            const BL: Pair = [bl.x, bl.y];

            let ring: Ring = [];
            let ring2: Ring | null = null;

            switch (state) {
              case 1:
                ring = [d, c, BL];
                break;
              case 2:
                ring = [b, c, BR];
                break;
              case 3:
                ring = [d, b, BR, BL];
                break;
              case 4:
                ring = [a, b, TR];
                break;
              case 5: // Saddle, standard implementation for solid fill usually takes union
                ring = [a, d, TL];
                ring2 = [b, c, BR];
                break;
              case 6:
                ring = [a, c, BR, TR];
                break;
              case 7:
                ring = [a, d, BL, BR, TR];
                break; // Cut TL
              case 8:
                ring = [a, d, TL];
                break;
              case 9:
                ring = [a, c, BL, TL];
                break;
              case 10: // Saddle
                ring = [a, b, TR];
                ring2 = [c, d, BL]; // Corrected saddle logic
                break;
              case 11:
                ring = [a, b, BR, BL, TL];
                break; // Cut TR
              case 12:
                ring = [d, b, TR, TL];
                break;
              case 13:
                ring = [b, c, BL, TL, TR];
                break; // Cut BR
              case 14:
                ring = [d, c, BR, TR, TL];
                break; // Cut BL
            }

            if (ring.length > 0) {
              // Close ring
              if (
                ring[0][0] !== ring[ring.length - 1][0] ||
                ring[0][1] !== ring[ring.length - 1][1]
              ) {
                ring.push(ring[0]);
              }
              polygonsToUnion.push([ring]);
            }
            if (ring2) {
              if (
                ring2[0][0] !== ring2[ring2.length - 1][0] ||
                ring2[0][1] !== ring2[ring2.length - 1][1]
              ) {
                ring2.push(ring2[0]);
              }
              polygonsToUnion.push([ring2]);
            }
          }

          // Finish row run
          if (startI !== -1) {
            const rx = startX + startI * gridCellSize;
            const ry = startY + j * gridCellSize;
            const rw = (cols - startI) * gridCellSize;
            const rh = gridCellSize;
            const rect: Poly = [
              [
                [rx, ry],
                [rx + rw, ry],
                [rx + rw, ry + rh],
                [rx, ry + rh],
                [rx, ry],
              ],
            ];
            polygonsToUnion.push(rect);
          }
        }

        tMarching += performance.now() - t0;

        // Union polygons for this level
        if (polygonsToUnion.length > 0) {
          try {
            const tU_start = performance.now();
            // Union in chunks to avoid stack overflow or memory spikes if too many
            const merged = polygonClipping.union(polygonsToUnion as any);
            tUnion += performance.now() - tU_start;

            // Draw Layer Shadows (Projected relative to layer below)
            if (showShadows && k > 0) {
              const tS_start = performance.now();
              const shadowZ = p.map(k - 1, 0, levels - 1, 0, zScale); // Shadow falls exactly on the layer below
              const maxOffset = 60; // Max shadow throw in map units

              // Shadow color
              p.stroke(hue, sat, 10, 80);
              p.strokeWeight(1.5); // Stipple dot size

              // Calculate screen-space shadow vector (approximate at center)
              // We want to trace BACK from a screen pixel to the object
              const origin = project(0, 0, shadowZ);
              const tip = project(maxOffset, maxOffset, shadowZ);
              const vecX = tip.x - origin.x;
              const vecY = tip.y - origin.y;

              // Performance: Reduced steps for ray trace check (was 20)
              const steps = 5;

              merged.forEach((poly) => {
                poly.forEach((ring) => {
                  const isClosed =
                    ring.length > 1 &&
                    ring[0][0] === ring[ring.length - 1][0] &&
                    ring[0][1] === ring[ring.length - 1][1];

                  const rawPoints: Point[] = (
                    isClosed ? ring.slice(0, -1) : ring
                  ).map((pt) => ({ x: pt[0], y: pt[1] }));

                  // Performance Update: Use raw sharp polygon for shadow hit testing (faster)
                  // Visual difference is negligible with stippling
                  const screenPolyPoints = rawPoints;

                  // 1. Get Base Polygon in Screen Space & its AABB
                  let minX = Infinity,
                    maxX = -Infinity,
                    minY = Infinity,
                    maxY = -Infinity;
                  const screenPoly: Point[] = screenPolyPoints.map((pt) => {
                    const proj = project(pt.x, pt.y, shadowZ);
                    if (proj.x < minX) minX = proj.x;
                    if (proj.x > maxX) maxX = proj.x;
                    if (proj.y < minY) minY = proj.y;
                    if (proj.y > maxY) maxY = proj.y;
                    return proj;
                  });

                  // 2. Expand Bounding Box to cover the Shadow Sweep
                  // Shadow moves by (vecX, vecY)
                  const bbMinX = Math.min(minX, minX + vecX);
                  const bbMaxX = Math.max(maxX, maxX + vecX);
                  const bbMinY = Math.min(minY, minY + vecY);
                  const bbMaxY = Math.max(maxY, maxY + vecY);

                  // 3. Stipple w/ Optimization (AABB First)
                  for (let sy = bbMinY; sy <= bbMaxY; sy += shadowDensity) {
                    for (let sx = bbMinX; sx <= bbMaxX; sx += shadowDensity) {
                      // Jitter
                      const jx = sx + p.random(-shadowDensity, shadowDensity);
                      const jy = sy + p.random(-shadowDensity, shadowDensity);

                      let hit = -1;
                      for (let s = 0; s <= steps; s++) {
                        const t = s / steps;
                        const tx = jx - vecX * t;
                        const ty = jy - vecY * t;

                        // Optimization: Fast AABB Test
                        if (tx < minX || tx > maxX || ty < minY || ty > maxY) {
                          continue;
                        }

                        if (pointInPoly({ x: tx, y: ty }, screenPoly)) {
                          hit = t;
                          break;
                        }
                      }

                      if (hit !== -1) {
                        const prob = p.map(hit, 0, 1, 0.9, 0.0);
                        const n = p.noise(
                          jx * shadowNoiseScale,
                          jy * shadowNoiseScale,
                        );

                        if (p.random() < prob * n) {
                          p.point(jx, jy);
                        }
                      }
                    }
                  }
                });
              });

              tShadows += performance.now() - tS_start;
            }

            // Draw Terrain Layer
            const tD_start = performance.now();

            if (showFill && k > 0) {
              p.fill(fillColor); // Opaque tinted color
            } else {
              p.noFill();
            }

            if (showStroke) {
              p.stroke(hue, sat, 20); // Darker stroke for definition
            } else {
              p.noStroke();
            }

            merged.forEach((poly) => {
              // poly is [Outer, Hole, Hole...]
              poly.forEach((ring) => {
                // Convert ring to Point[] for smoothing
                // Remove last point if it duplicates first (polygon-clipping returns closed rings)
                const isClosed =
                  ring.length > 1 &&
                  ring[0][0] === ring[ring.length - 1][0] &&
                  ring[0][1] === ring[ring.length - 1][1];

                const uniquePoints: Point[] = (
                  isClosed ? ring.slice(0, -1) : ring
                ).map((pt) => ({ x: pt[0], y: pt[1] }));

                // Apply smoothing if we have enough points
                const smoothString =
                  uniquePoints.length > 2
                    ? createBezierRoundedPath(
                        uniquePoints,
                        cornerRadius,
                        bezierSteps,
                      )
                    : uniquePoints;

                p.beginShape();
                smoothString.forEach((pt) => {
                  const proj = project(pt.x, pt.y, z);
                  p.vertex(proj.x, proj.y);
                });
                p.endShape(p.CLOSE);
              });
            });
            tDraw += performance.now() - tD_start;
          } catch (e) {
            console.error("Clipping error", e);
          }
        }
      }

      // Restore context to remove clip for debug drawing (if needed) or cleanup
      p.drawingContext.restore();

      const tTotal = performance.now() - tStart;
      console.log(
        `%c Render Stats (${tTotal.toFixed(0)}ms)`,
        "font-weight: bold; font-size: 14px;",
      );
      console.table({
        "Marching Squares": `${tMarching.toFixed(0)}ms`,
        "Polygon Union": `${tUnion.toFixed(0)}ms`,
        "Shadow Rendering": `${tShadows.toFixed(0)}ms`,
        "Terrain Drawing": `${tDraw.toFixed(0)}ms`,
        "Total Render": `${tTotal.toFixed(0)}ms`,
      });

      if (vars.debug) {
        p.push();
        p.stroke(0, 100, 100); // Red in HSB
        p.strokeWeight(2);
        p.noFill();
        // Inner Margin Guide
        p.rect(marginX, marginY, p.width - 2 * marginX, p.height - 2 * marginY);
        // Outer Canvas/Paper Edge
        p.rect(0, 0, p.width, p.height);
        p.pop();
      }
    };
  };

export default sketchFactory;
