import { p5SVG } from "p5.js-svg";

import { gellyRollPens } from "@/pens";

import { Meta } from "../types";

export const meta: Meta = {
  id: "flowerpot-01",
  title: "Flowerpot 01",
  description: "Inspired by Hopewell Rocks in New Brunswick",
  thumbnail: "flowerpot-01.png", // Add a thumbnail path if available
};

export const constants = {
  canvasMargin: 120,
  asymmetry: 400,
  width: 600,
  height: 600,
};

// Add asymmetry parameter (default 1) and region settings
const flowerpotSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const canvasMargin = vars.canvasMargin ?? constants.canvasMargin;
    const asymmetry = vars.asymmetry ?? constants.asymmetry;
    const numPots = Math.floor(p.random(3, 6)); // Random number of pots

    interface PotArea {
      centerX: number;
      width: number;
      height: number;
      topY: number;
      bottomY: number;
    }

    const potAreas: PotArea[] = []; // Store area for each pot
    const usedColors: any[] = []; // Track used colors to avoid duplicates

    p.setup = () => {
      if (seed !== null) p.randomSeed(seed);
      p.createCanvas(
        vars.width ?? constants.width,
        vars.height ?? constants.height,
        p.SVG
      );

      p.noLoop();

      // Generate pot areas
      generatePotAreas();

      // Draw all pots
      for (let i = 0; i < numPots; i++) {
        generatePot(potAreas[i]);
      }
    };

    function generatePotAreas() {
      const availableWidth = p.width - canvasMargin;
      for (let i = 0; i < numPots; i++) {
        const availableHeight = (p.height - canvasMargin) * p.random(0.6, 1);
        // Random area width (smaller range for better distribution)
        const areaWidth = availableWidth * p.random(0.2, 0.4);

        // Start with roughly evenly distributed positions, then add variation
        const basePosition =
          (availableWidth / (numPots + 1)) * (i + 1) + canvasMargin / 2;

        // Add random variation to create slight overlaps (±30% of spacing)
        const spacing = availableWidth / (numPots + 1);
        const variation = spacing * p.random(-0.3, 0.3);
        let centerX = basePosition + variation;

        // Ensure the area doesn't extend beyond canvas bounds
        const minCenterX = canvasMargin / 2 + areaWidth / 2;
        const maxCenterX = p.width - canvasMargin / 2 - areaWidth / 2;
        centerX = p.constrain(centerX, minCenterX, maxCenterX);

        potAreas.push({
          centerX: centerX,
          width: areaWidth,
          height: availableHeight,
          topY: canvasMargin / 2,
          bottomY: p.height - (canvasMargin / 2) * p.random(1, 1.5),
        });
      }
    }

    function generatePot(potArea: PotArea) {
      // Select a unique color that hasn't been used yet
      const availableColors = Object.values(gellyRollPens).filter(
        (color) =>
          !usedColors.some(
            (usedColor) =>
              usedColor[0] === color[0] &&
              usedColor[1] === color[1] &&
              usedColor[2] === color[2] &&
              usedColor[3] === color[3]
          )
      );

      // If we've used all colors, reset the list (shouldn't happen with reasonable pot counts)
      if (availableColors.length === 0) {
        usedColors.length = 0;
        availableColors.push(...Object.values(gellyRollPens));
      }

      const selectedColor = p.random(availableColors);
      usedColors.push(selectedColor);

      p.stroke(selectedColor);
      p.strokeWeight(0.5);
      const numLines = p.random(42, 78);
      const potHeight = potArea.height; // Use area height
      const baseY = potArea.bottomY; // Use area bottom

      const steps = Math.floor(p.random(16, 28));
      const baseSegs = Math.max(2, Math.round(steps * 0.2));
      const neckSegs = 1; // extremely pinched neck

      const neckStartIdx = baseSegs;
      const neckEndIdx = neckStartIdx + neckSegs - 1;
      const topStartIdx = neckEndIdx + 1;

      const yVals: number[] = [];
      const topSkew = p.random(-30, -10); // how much lower the top can be
      const topTilt = p.random(-15, 15); // left-to-right tilt
      const topBoundary = potArea.topY; // Top boundary relative to pot area

      for (let i = 0; i < steps; i++) {
        let y = baseY - (potHeight * i) / (steps - 1);

        // Add irregular top surface - not perfectly flat at max height
        if (i >= topStartIdx) {
          const topProgress = (i - topStartIdx) / (steps - 1 - topStartIdx);
          // Make top surface uneven and possibly lower than max
          const heightVariation = topSkew * topProgress; // gradually lower toward back

          y += heightVariation + p.random(-8, 8); // add some randomness

          // Ensure the pot doesn't exceed the top boundary
          y = Math.max(y, topBoundary);
        }

        yVals.push(y);
      }

      const widths: number[] = [];
      // All widths are now relative to the individual pot's area width
      const baseTarget = potArea.width * p.random(0.4, 0.8); // 40-80% of pot area width
      const neckTarget = potArea.width * p.random(0.01, 0.15); // 1-15% of pot area width
      const topTarget = potArea.width * p.random(0.6, 1.3); // 60-130% of pot area width

      // Base: moderate, organic transition
      for (let i = 0; i < baseSegs; i++) {
        const t = baseSegs === 1 ? 0 : Math.pow(i / (baseSegs - 1), 1.8);
        const randomVariation = potArea.width * p.random(-0.05, 0.05); // 5% variation relative to pot area
        widths[i] = p.lerp(baseTarget, neckTarget, t) + randomVariation;
      }
      // Neck: extremely pinched, minimal width
      for (let i = neckStartIdx; i <= neckEndIdx; i++) {
        const randomVariation = potArea.width * p.random(-0.02, 0.02); // 2% variation relative to pot area
        widths[i] = neckTarget + randomVariation;
      }
      // Top: bulbous but controlled, with subtle variation
      for (let i = topStartIdx; i < steps; i++) {
        // Simple, controlled variation - no crazy sine waves
        const randomVariation = potArea.width * p.random(-0.1, 0.1); // 10% variation relative to pot area
        const baseWidth = topTarget + randomVariation;
        const subtleVariation =
          p.noise(i * 0.5) * (potArea.width * 0.15) - potArea.width * 0.075; // 15% noise relative to pot area
        widths[i] = baseWidth + subtleVariation;
      }

      // Organic outline
      const left: [number, number][] = [];
      const right: [number, number][] = [];
      const leftXOffsets: number[] = [];
      const rightXOffsets: number[] = [];
      const leftYOffsets: number[] = [];
      const rightYOffsets: number[] = [];
      const leftSeed = p.random(1000);
      const rightSeed = p.random(1000);
      const leftYSeed = p.random(1000);
      const rightYSeed = p.random(1000);
      const maxOffset = 0.25 * asymmetry; // much more reasonable
      const maxYOffset = 0.2 * asymmetry;
      const leftGlobalBias = p.random(-15, 10); // subtle global left side bias
      const rightGlobalBias = p.random(-10, 15); // subtle global right side bias
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        // Gentle, controlled noise variation
        const roughnessMap = p.noise(i * 0.3) * 1.5; // 0 to 1.5 - much more subtle
        let noiseScale =
          i < baseSegs ? 0.5 : i < topStartIdx ? 0.3 : 1.0 + roughnessMap * 0.5;

        // Subtle asymmetric offsets with curvature
        leftXOffsets[i] =
          (p.noise(leftSeed + t * 2) * maxOffset - maxOffset / 2) * noiseScale +
          leftGlobalBias;
        rightXOffsets[i] =
          (p.noise(rightSeed + t * 2) * maxOffset - maxOffset / 2) *
            noiseScale +
          rightGlobalBias;
        leftYOffsets[i] =
          (p.noise(leftYSeed + t * 1.5) * maxYOffset - maxYOffset / 2) *
          noiseScale;
        rightYOffsets[i] =
          (p.noise(rightYSeed + t * 1.5) * maxYOffset - maxYOffset / 2) *
          noiseScale;
        leftYOffsets[i] =
          (p.noise(leftYSeed + t * 1.8) * maxYOffset - maxYOffset / 2) *
          noiseScale;
        rightYOffsets[i] =
          (p.noise(rightYSeed + t * 1.8) * maxYOffset - maxYOffset / 2) *
          noiseScale;
      }
      const minDistFromCenter = 15; // allow closer to center for more dramatic neck

      // Create asymmetric point distribution for natural erosion look
      const pointSkipChance = 0.15; // 15% chance to skip a point on one side
      const leftSkips: boolean[] = [];
      const rightSkips: boolean[] = [];

      for (let i = 0; i < steps; i++) {
        // Never skip first/last points or neck area to maintain structure
        const isStructuralPoint =
          i === 0 || i === steps - 1 || (i >= neckStartIdx && i <= neckEndIdx);

        leftSkips[i] = !isStructuralPoint && p.random() < pointSkipChance;
        rightSkips[i] = !isStructuralPoint && p.random() < pointSkipChance;
      }

      for (let i = 0; i < steps; i++) {
        // Calculate tilt for top sections
        let leftTiltOffset = 0;
        let rightTiltOffset = 0;
        if (i >= topStartIdx) {
          const topProgress = (i - topStartIdx) / (steps - 1 - topStartIdx);
          leftTiltOffset = -topTilt * topProgress; // left side gets opposite tilt
          rightTiltOffset = topTilt * topProgress; // right side gets the tilt
        }

        // Add points only if not skipped (for asymmetric erosion)
        if (!leftSkips[i]) {
          if (i === 0 || i === steps - 1) {
            left.push([-widths[i] / 2, yVals[i] + leftTiltOffset]);
          } else {
            let lx = -widths[i] / 2 + leftXOffsets[i];
            if (lx > -minDistFromCenter) lx = -minDistFromCenter;
            const baseY = yVals[i];
            left.push([lx, baseY + leftTiltOffset]);
          }
        }

        if (!rightSkips[i]) {
          if (i === 0 || i === steps - 1) {
            right.push([widths[i] / 2, yVals[i] + rightTiltOffset]);
          } else {
            let rx = widths[i] / 2 + rightXOffsets[i];
            if (rx < minDistFromCenter) rx = minDistFromCenter;
            const baseY = yVals[i];
            right.push([rx, baseY + rightTiltOffset]);
          }
        }
      }

      p.push();
      p.translate(potArea.centerX, 0);

      p.noFill();

      // Draw vertical lines that transition from left edge to right edge

      const minY = Math.min(
        ...left.map((pt) => pt[1]),
        ...right.map((pt) => pt[1])
      );
      const maxY = Math.max(
        ...left.map((pt) => pt[1]),
        ...right.map((pt) => pt[1])
      );

      for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
        const blendFactor = lineIdx / (numLines - 1); // 0 to 1

        p.beginShape();
        p.noFill();

        // Sample points along the height (from top to bottom)
        for (let y = minY; y <= maxY; y += 8) {
          // Find corresponding points on left and right edges at this Y level
          let leftX = 0,
            rightX = 0;
          let foundLeft = false,
            foundRight = false;

          // Find left edge X at this Y
          for (let i = 0; i < left.length - 1; i++) {
            const y1 = left[i][1],
              y2 = left[i + 1][1];
            if ((y >= y1 && y <= y2) || (y >= y2 && y <= y1)) {
              const t = Math.abs(y2 - y1) < 0.001 ? 0 : (y - y1) / (y2 - y1);
              leftX = p.lerp(left[i][0], left[i + 1][0], t);
              foundLeft = true;
              break;
            }
          }

          // Find right edge X at this Y
          for (let i = 0; i < right.length - 1; i++) {
            const y1 = right[i][1],
              y2 = right[i + 1][1];
            if ((y >= y1 && y <= y2) || (y >= y2 && y <= y1)) {
              const t = Math.abs(y2 - y1) < 0.001 ? 0 : (y - y1) / (y2 - y1);
              rightX = p.lerp(right[i][0], right[i + 1][0], t);
              foundRight = true;
              break;
            }
          }

          // Only add vertex if we found both edges
          if (foundLeft && foundRight) {
            // Blend between left and right edge based on line index
            const x = p.lerp(leftX, rightX, blendFactor);
            p.vertex(x, y);
          }
        }

        p.endShape();
      }

      p.pop();
    }
  };

export default flowerpotSketch;
