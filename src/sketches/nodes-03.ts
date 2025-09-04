import { p5SVG } from "p5.js-svg";
import { Meta } from "../types";
import { gellyRollPens } from "@/pens";

export const meta: Meta = {
  id: "nodes-03",
  title: "Nodes 03",
  description: "A grid of nodes",
  thumbnail: "/nodes-03.png",
};

const colors = [
  gellyRollPens["429"],
  gellyRollPens["424"],
  gellyRollPens["422"],
  gellyRollPens["421"],
  gellyRollPens["427"],
  gellyRollPens["438"],
];

export const constants = {
  ballRadius: 300,
  spacing: 20,
  width: 700,
  height: 850,
  minDotSize: 12,
  maxDotSize: 80,
  packingTightness: 1.24,
};

const nodesSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    const ballRadius = vars.ballRadius ?? constants.ballRadius;
    const spacing = vars.spacing ?? constants.spacing;
    const minDotSize = vars.minDotSize ?? constants.minDotSize;
    const maxDotSize = vars.maxDotSize ?? constants.maxDotSize;
    const debug = false;

    // Tightness control: 0 = very loose, 1 = touching, 2+ = overlapping
    const packingTightness =
      vars.packingTightness ?? constants.packingTightness;

    p.setup = () => {
      if (seed !== null) p.randomSeed(seed);
      p.createCanvas(
        vars.width ?? constants.width,
        vars.height ?? constants.height,
        p.SVG
      );
      p.noStroke();
      if (debug) {
        // In debug mode, redraw on mouse movement for interactive lighting
        p.loop();
      } else {
        p.noLoop();
      }
    };

    p.draw = () => {
      drawShadedBall();
    };

    const drawShadedBall = () => {
      // Clear the canvas on each frame when in debug mode
      if (debug) {
        p.clear();
      }

      const centerX = p.width / 2;
      const centerY = p.height / 2;

      // Light source position (always pointing toward the visible face)
      // The visible face of the sphere has positive Z values (toward the viewer)
      // So we want the light to have positive Z and be positioned in front
      let lightX, lightY, lightZ;

      if (debug) {
        // In debug mode, map mouse position to light position
        lightX = p.map(p.mouseX, 0, p.width, -1, 1);
        lightY = p.map(p.mouseY, 0, p.height, -1, 1);
        lightZ = 0.8; // Keep Z fixed for consistent front lighting
      } else {
        // Normal random lighting
        lightX = p.random(-0.8, 0.8);
        lightY = p.random(-0.8, 0.8);
        lightZ = p.random(0.3, 1.0); // Always positive Z (in front of sphere)
      } // Debug: Show light source position
      if (debug) {
        // In debug mode, show the light indicator directly at mouse position
        const lightScreenX = p.mouseX;
        const lightScreenY = p.mouseY;

        // Draw light source indicator
        p.push();

        // Light is always in front now, so always use yellow
        p.fill(255, 255, 0); // Yellow for front light
        p.stroke(255, 165, 0); // Orange outline
        p.strokeWeight(2);

        // Draw a sun-like symbol
        p.circle(lightScreenX, lightScreenY, 20);

        // Draw rays around the light
        for (let i = 0; i < 8; i++) {
          const angle = (i * p.TWO_PI) / 8;
          const rayStart = 15;
          const rayEnd = 25;
          const x1 = lightScreenX + p.cos(angle) * rayStart;
          const y1 = lightScreenY + p.sin(angle) * rayStart;
          const x2 = lightScreenX + p.cos(angle) * rayEnd;
          const y2 = lightScreenY + p.sin(angle) * rayEnd;
          p.line(x1, y1, x2, y2);
        }

        // Label the light source with Z position
        p.fill(0);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.text("LIGHT (MOUSE)", lightScreenX, lightScreenY + 35);
        p.text(
          `XY: ${lightX.toFixed(2)}, ${lightY.toFixed(2)}`,
          lightScreenX,
          lightScreenY + 45
        );

        p.pop();
      }

      // Function to draw a circle at given position and size
      const drawCircle = (
        x: number,
        y: number,
        size: number,
        intensity: number
      ) => {
        p.noFill();
        if (debug) {
          const colorIndex =
            p.floor(p.map(intensity, 0, 1, colors.length - 1, 0)) %
            colors.length;
          const color = colors[colorIndex];

          // Safety check
          if (color && Array.isArray(color) && color.length >= 3) {
            p.stroke(color[0], color[1], color[2], color[3] || 255);
            p.ellipse(x, y, size, size);
          }
        }
        const clusterSize = size * 1;

        const segments = p.map(intensity, 0, 1, minDotSize, maxDotSize);
        randomPivotPath(
          segments,
          clusterSize * 0.2,
          clusterSize * 0.4,
          x - clusterSize / 2,
          y - clusterSize / 2,
          clusterSize,
          clusterSize,
          p.random(0.2, 0.4)
        );
      };

      // Use adaptive spacing based on lighting intensity
      const baseSpacing = 8;
      const maxSpacingMultiplier = 3;

      // Store placed dots to avoid overlaps
      const placedDots = [];

      for (let y = -ballRadius; y <= ballRadius; y += baseSpacing) {
        for (let x = -ballRadius; x <= ballRadius; x += baseSpacing) {
          const distanceFromCenter = p.sqrt(x * x + y * y);

          // Only draw points inside the circle
          if (distanceFromCenter > ballRadius) continue;

          // Calculate the z-coordinate on the sphere surface
          const z = p.sqrt(ballRadius * ballRadius - x * x - y * y);

          // Normalize the surface normal (pointing outward from sphere)
          const normalX = x / ballRadius;
          const normalY = y / ballRadius;
          const normalZ = z / ballRadius;

          // Calculate lighting (dot product of normal and light direction)
          const lightIntensity = p.max(
            0,
            normalX * lightX + normalY * lightY + normalZ * lightZ
          );

          // Add ambient lighting to prevent completely black areas
          const ambient = 0.15;
          const finalIntensity = ambient + (1 - ambient) * lightIntensity;

          // Map intensity to dot size for 3D effect
          const dotSize = p.map(finalIntensity, 0, 1, minDotSize, maxDotSize);

          // Adaptive spacing: smaller dots (darker areas) get denser placement
          const spacingMultiplier = p.map(
            finalIntensity,
            0,
            1,
            0.1,
            maxSpacingMultiplier
          );

          // Skip some dots in brighter areas to create irregular spacing
          if (p.random() > 1 / spacingMultiplier) continue;

          // Try to find a non-overlapping position
          let attempts = 0;
          let finalX = centerX + x;
          let finalY = centerY + y;
          let validPosition = false;

          while (attempts < 15 && !validPosition) {
            // Add small random offset for more organic feel
            const jitterX = p.random(-spacing * 0.4, spacing * 0.4);
            const jitterY = p.random(-spacing * 0.4, spacing * 0.4);

            finalX = centerX + x + jitterX;
            finalY = centerY + y + jitterY;

            // Check for overlaps with previously placed dots
            validPosition = true;
            for (const dot of placedDots) {
              const distance = p.dist(finalX, finalY, dot.x, dot.y);
              const baseMinDistance = (dotSize + dot.size) / 2;
              const minDistance = baseMinDistance / packingTightness; // Adjust based on tightness
              if (distance < minDistance) {
                validPosition = false;
                break;
              }
            }
            attempts++;
          }

          // Only draw if we found a valid position
          if (validPosition) {
            // Store the dot position and size
            placedDots.push({ x: finalX, y: finalY, size: dotSize });

            // Draw the dot with jittered position
            drawCircle(finalX, finalY, dotSize, finalIntensity);
          }
        }
      }

      // Second pass: fill gaps with smaller dots
      const gapFillSpacing = baseSpacing / 2;
      for (let y = -ballRadius; y <= ballRadius; y += gapFillSpacing) {
        for (let x = -ballRadius; x <= ballRadius; x += gapFillSpacing) {
          const distanceFromCenter = p.sqrt(x * x + y * y);
          if (distanceFromCenter > ballRadius) continue;

          // Calculate lighting for this position
          const z = p.sqrt(ballRadius * ballRadius - x * x - y * y);
          const normalX = x / ballRadius;
          const normalY = y / ballRadius;
          const normalZ = z / ballRadius;

          const lightIntensity = p.max(
            0,
            normalX * lightX + normalY * lightY + normalZ * lightZ
          );
          const ambient = 0.15;
          let finalIntensity = ambient + (1 - ambient) * lightIntensity;
          finalIntensity = p.constrain(finalIntensity, 0, 1);

          // Use smaller dots for gap filling
          const gapDotSize = p.map(
            finalIntensity,
            0,
            1,
            minDotSize * 0.5,
            maxDotSize * 0.6
          );

          // Try multiple positions to fill gaps
          for (let attempt = 0; attempt < 5; attempt++) {
            const jitterX = p.random(
              -gapFillSpacing * 0.8,
              gapFillSpacing * 0.8
            );
            const jitterY = p.random(
              -gapFillSpacing * 0.8,
              gapFillSpacing * 0.8
            );

            const testX = centerX + x + jitterX;
            const testY = centerY + y + jitterY;

            // Check if this position has enough space
            let canPlace = true;
            for (const dot of placedDots) {
              const distance = p.dist(testX, testY, dot.x, dot.y);
              const baseMinDistance = (gapDotSize + dot.size) / 2;
              const minDistance = baseMinDistance / packingTightness; // Apply same tightness
              if (distance < minDistance) {
                canPlace = false;
                break;
              }
            }

            if (canPlace) {
              placedDots.push({ x: testX, y: testY, size: gapDotSize });
              drawCircle(testX, testY, gapDotSize, finalIntensity);
              break; // Found a good spot, move to next grid position
            }
          }
        }
      }
    };
    function randomPivotPath(
      steps: number,
      minLength: number,
      maxLength: number,
      bx: number,
      by: number,
      bw: number,
      bh: number,
      jitterFrac: number
    ) {
      const cx0 = bx + bw / 2;
      const cy0 = by + bh / 2;
      const maxR = p.min(bw, bh) / 2;

      // small “inner” jump off center
      const jR = p.random(-jitterFrac, jitterFrac) * maxR;
      const jA = p.random(p.TWO_PI);
      const cx1 = cx0 + p.cos(jA) * jR;
      const cy1 = cy0 + p.sin(jA) * jR;

      let heading = p.atan2(cy1 - cy0, cx1 - cx0);

      // collect points
      const pts = [];
      pts.push({ x: cx0, y: cy0 });
      pts.push({ x: cx1, y: cy1 });

      let x = cx1;
      let y = cy1;
      for (let k = 0; k < steps; k++) {
        let nx, ny;
        let distFromCenter;
        do {
          heading += p.radians(p.random(p.PI * 60)); // Adjusted to allow more variation
          const len = p.random(minLength, maxLength);
          nx = x + p.cos(heading) * len;
          ny = y + p.sin(heading) * len;

          // Check if point is within circle bounds instead of square bounds
          distFromCenter = p.dist(nx, ny, cx0, cy0);
        } while (distFromCenter > maxR);
        pts.push({ x: nx, y: ny });
        x = nx;
        y = ny;
      }

      // draw segments with colors based on intensity
      for (let i = 1; i < pts.length; i++) {
        p.stroke(p.random(colors));
        p.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      }
    }
  };

export default nodesSketch;
