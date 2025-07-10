import { p5SVG } from "p5.js-svg";
import { Color, Meta } from "../types";
import { gellyRollPens } from "@/pens";

export const meta: Meta = {
  id: "cubes-01",
  title: "Cubes 01",
  description: "A grid of cubes",
  thumbnail: "/cubes-01.png",
};

const distortionSketch = (seed?: number) => (p: p5SVG) => {
  p.setup = () => {
    p.createCanvas(900, 900, p.SVG);
    p.noStroke();
    p.noLoop();

    if (seed !== undefined) p.randomSeed(seed);
  };

  // Reusable function to draw the grid with a specified color
  const drawGrid = (strokeColor: Color) => {
    const marginY = 100;
    const marginX = 100;
    const cellSizes = [60, 90, 120]; // Different cell sizes for variety
    const cellSize = p.random(cellSizes); // Randomly choose a cell size
    const cols = Math.floor((p.width - 2 * marginX) / cellSize);
    const rows = Math.floor((p.height - 2 * marginY) / cellSize);

    const drawW = cols * cellSize;
    const drawH = rows * cellSize;
    const startX = (p.width - drawW) / 2;
    const startY = (p.height - drawH) / 2;

    // Grid to store which pattern is used in each cell
    const patternGrid: number[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(-1)
    );

    // Function to get available patterns for a cell (excluding adjacent patterns)
    const getAvailablePatterns = (row: number, col: number): number[] => {
      const usedPatterns = new Set<number>();

      // Check adjacent cells (up, down, left, right)
      const adjacents = [
        [row - 1, col], // up
        [row + 1, col], // down
        [row, col - 1], // left
        [row, col + 1], // right
      ];

      adjacents.forEach(([r, c]) => {
        if (
          r >= 0 &&
          r < rows &&
          c >= 0 &&
          c < cols &&
          patternGrid[r][c] !== -1
        ) {
          usedPatterns.add(patternGrid[r][c]);
        }
      });

      // Return indices of patterns not used by adjacent cells
      const available = [];
      for (let i = 0; i < patterns.length; i++) {
        if (!usedPatterns.has(i)) {
          available.push(i);
        }
      }

      // If no patterns available (shouldn't happen with enough patterns),
      // return all patterns as fallback
      return available.length > 0
        ? available
        : Array.from({ length: patterns.length }, (_, i) => i);
    };

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;

        p.push();

        p.strokeWeight(0.5);

        const hasPadding = p.random() < 0.5;
        const padding = hasPadding ? p.random(10, 30) : 0;

        // Apply padding to the drawing area
        const drawX = x + padding;
        const drawY = y + padding;
        const drawSize = cellSize - padding * 2;

        // Get available patterns and select one randomly
        const availablePatterns = getAvailablePatterns(row, col);
        const selectedPatternIndex =
          availablePatterns[Math.floor(p.random(availablePatterns.length))];

        // Store the selected pattern in the grid
        patternGrid[row][col] = selectedPatternIndex;

        // Draw the selected pattern with the specified color
        const selectedPattern = patterns[selectedPatternIndex];
        selectedPattern(drawX, drawY, drawSize, strokeColor);

        p.pop();
      }
    }
  };

  p.draw = () => {
    // always a white base
    drawGrid(gellyRollPens["50"]);
    // subtle color
    drawGrid(
      p.random([
        gellyRollPens["431"],
        gellyRollPens["417"],
        gellyRollPens["438"],
      ])
    );
    // highlight color
    drawGrid(
      p.random([
        gellyRollPens["423"],
        gellyRollPens["425"],
        gellyRollPens["432"],
      ])
    );
  };

  // Pattern functions
  const drawVerticalLines = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);
    const spacing = p.random(0.5, 12);
    for (let i = x; i < x + size; i += spacing) {
      p.line(i, y, i, y + size);
    }
  };

  const drawHorizontalLines = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);
    const spacing = p.random(0.5, 12);
    for (let i = y; i < y + size; i += spacing) {
      p.line(x, i, x + size, i);
    }
  };

  const drawConcentricSquares = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);
    p.noFill();
    const count = p.floor(p.random(3, 10));
    const step = size / count;

    for (let i = 0; i < count; i++) {
      const offset = i * step;

      // Rotate starting point for each square to avoid aligned seams
      const startRotation = ((i * p.PI) / p.random([2, 4])) % p.TWO_PI;
      const squareSize = size - 2 * offset;
      const centerX = x + offset + squareSize / 2;
      const centerY = y + offset + squareSize / 2;

      p.push();
      p.translate(centerX, centerY);
      p.rotate(startRotation);
      p.rect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
      p.pop();
    }
  };

  const drawZigzags = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);

    const zigzagWidth = p.random(3, 10); // Width of each zigzag segment
    const zigzagHeight = p.random(4, 10); // Height of each peak/valley
    const lineSpacing = p.random(2, 8); // Spacing between zigzag lines

    // Fill the square with horizontal zigzag lines from bottom to top
    for (
      let currentY = y + size - lineSpacing;
      currentY >= y;
      currentY -= lineSpacing
    ) {
      p.beginShape();
      p.noFill();

      let isUp = true; // Start going up
      for (let currentX = x; currentX <= x + size; currentX += zigzagWidth) {
        let vertexY;
        if (isUp) {
          // Constrain the peak to not go above the cell top
          vertexY = p.max(y - size, currentY - zigzagHeight / 2);
        } else {
          // Constrain the valley to not go below the cell bottom
          vertexY = p.min(y + size, currentY + zigzagHeight / 2);
        }

        // Also constrain X to not exceed cell bounds
        const vertexX = p.min(currentX, x + size);
        p.vertex(vertexX, vertexY);
        isUp = !isUp; // Alternate direction
      }

      p.endShape();
    }
  };

  const drawNothing = (
    _x: number,
    _y: number,
    _size: number,
    _strokeColor: Color
  ) => {
    // Do nothing
  };

  const drawConcentricDiamonds = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);
    p.noFill();
    const count = p.floor(p.random(1, 4));
    const step = size / (count * 2); // Divide by 2 so diamonds fit properly

    for (let i = 0; i < count; i++) {
      const offset = i * step;

      // Rotate starting point for each diamond to avoid aligned seams
      const startRotation = ((i * p.PI) / 2) % p.TWO_PI; // Rotate by 30° increments
      const centerX = x + size / 2;
      const centerY = y + size / 2;

      p.push();
      p.translate(centerX, centerY);
      p.rotate(startRotation);

      p.beginShape();
      p.vertex(0, -size / 2 + offset); // Top vertex
      p.vertex(size / 2 - offset, 0); // Right vertex
      p.vertex(0, size / 2 - offset); // Bottom vertex
      p.vertex(-size / 2 + offset, 0); // Left vertex
      p.endShape(p.CLOSE);

      p.pop();
    }
  };

  const drawOneDiagonal = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);
    const left = p.random(0, 1) < 0.5; // Randomly choose left or right diagonal
    if (left) {
      p.line(x + size, y, x, y + size); // Top-right to bottom-left diagonal
    } else {
      p.line(x, y, x + size, y + size); // Top-left to bottom-right diagonal
    }
  };

  const drawDiagonalLines = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);
    const spacing = p.random(3, 8);
    const direction = p.random() < 0.5; // true for /, false for \

    if (direction) {
      // Draw diagonal lines from top-left to bottom-right (/)
      for (let i = -size; i < size * 2; i += spacing) {
        const startX = p.max(x, x + i);
        const startY = p.max(y, y - i);
        const endX = p.min(x + size, x + i + size);
        const endY = p.min(y + size, y - i + size);

        // Only draw if the line has positive length
        if (startX < endX && startY < endY) {
          p.line(startX, startY, endX, endY);
        }
      }
    } else {
      // Draw diagonal lines from top-right to bottom-left (\)
      for (let i = 0; i < size * 2; i += spacing) {
        const startX = p.min(x + size, x + i);
        const startY = p.max(y, y + i - size);
        const endX = p.max(x, x + i - size);
        const endY = p.min(y + size, y + i);

        // Only draw if the line has positive length
        if (startX > endX && startY < endY) {
          p.line(startX, startY, endX, endY);
        }
      }
    }
  };

  const drawCheckers = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);
    p.noFill();
    const squareCount = p.floor(p.random(2, 8)); // Random number of squares per side
    const squareSize = size / squareCount;

    for (let i = 0; i < squareCount; i++) {
      for (let j = 0; j < squareCount; j++) {
        const squareX = x + i * squareSize;
        const squareY = y + j * squareSize;

        // Fill alternating squares with very dense zigzag lines
        if ((i + j) % 2 === 1) {
          const lineSpacing = p.random(1, 2); // Very close lines for dense fill
          const zigzagWidth = p.random(0.5, 2); // Very small zigzag segments
          const zigzagHeight = p.random(0.5, 1.5); // Very small amplitude

          for (
            let currentY = squareY + lineSpacing;
            currentY < squareY + squareSize;
            currentY += lineSpacing
          ) {
            p.beginShape();
            p.noFill();

            let isUp = true; // Start going up
            for (
              let currentX = squareX;
              currentX <= squareX + squareSize;
              currentX += zigzagWidth
            ) {
              let vertexY;
              if (isUp) {
                vertexY = currentY - zigzagHeight / 2;
              } else {
                vertexY = currentY + zigzagHeight / 2;
              }

              // Constrain to square bounds
              vertexY = p.constrain(vertexY, squareY, squareY + squareSize);
              const vertexX = p.min(currentX, squareX + squareSize);

              p.vertex(vertexX, vertexY);
              isUp = !isUp; // Alternate direction
            }

            p.endShape();
          }
        }
      }
    }
  };

  const drawBullseye = (
    x: number,
    y: number,
    size: number,
    strokeColor: Color
  ) => {
    p.stroke(...strokeColor);
    p.noFill();
    const count = p.floor(p.random(6, 15)); // Random number of rings

    let currentRadius = size / 2; // Start from the outside
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Randomly choose pattern type
    const useRhythmicPattern = p.random() < 0.5;

    if (useRhythmicPattern) {
      // Rhythmic pattern: small-small-small-large
      const smallSpacing = p.random(2, 6);
      const largeSpacing = p.random(8, 15);

      for (let i = 0; i < count && currentRadius > 2; i++) {
        // Draw ring at current radius
        p.ellipse(centerX, centerY, currentRadius * 2, currentRadius * 2);

        // Every 4th ring gets large spacing, others get small
        const spacing = (i + 1) % 4 === 0 ? largeSpacing : smallSpacing;
        currentRadius -= spacing;
      }
    } else {
      // Consistent spacing
      const consistentSpacing = p.random(3, 8);

      for (let i = 0; i < count && currentRadius > 2; i++) {
        // Draw ring at current radius
        p.ellipse(centerX, centerY, currentRadius * 2, currentRadius * 2);

        currentRadius -= consistentSpacing;
      }
    }
  };

  // Array of pattern functions
  const patterns = [
    drawVerticalLines,
    drawHorizontalLines,
    drawNothing,
    drawNothing,
    drawNothing,
    drawNothing,
    drawNothing,
    drawNothing,
    drawConcentricSquares,
    drawConcentricDiamonds,
    drawOneDiagonal,
    drawZigzags,
    drawDiagonalLines,
    drawCheckers,
    drawBullseye,
  ];
};

export default distortionSketch;
