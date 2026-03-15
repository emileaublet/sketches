import { p5SVG } from "p5.js-svg";

import { Meta } from "../types";
import { DotPen } from "@/pens";
import { setupCanvas } from "@/utils/canvasSetup";
import {
  drawPath as drawSafePath,
  createBezierRoundedPath,
} from "@/utils/pathUtils";
import { drawPerpendicularLines, resetDrawnLines } from "@/utils/linePatterns";
import { BaseConstants } from "../utils/constants";

export const meta: Meta = {
  id: "stairs-06",
  title: "Stairs 06",
  description: "A new generative sketch",
  thumbnail: "/stairs-06.png",
};

type Constants = BaseConstants & {
  // Letter configuration
  letter: string;
  fontName: string;
  contourSampling: number;
  gridSize: number;

  // Path generation inside letter
  numPoints: number;
  radius: number;
  bezierSteps: number;

  // Segment configuration
  segmentLengthMin: number;
  segmentLengthMax: number;
  segmentGapMin: number;
  segmentGapMax: number;

  // Line density and appearance
  lineDensityMin: number;
  lineDensityMax: number;
  lineThickness: number;
  lineLengthMin: number;
  lineLengthMax: number;

  // Color zoning
  drawInZone: number;
  drawOutsideZone: number;

  // Options
  linesStartOnPath: boolean;
  avoidIntersections: boolean;
  debug: boolean;
};
export const constants: Constants = {
  width: 500,
  height: 600,
  marginX: 50,
  marginY: 50,
  rotate: 0,

  // Letter configuration
  letter: "A",
  fontName: "/fonts/StackSansHeadline-Bold.ttf",
  contourSampling: 0.1,
  gridSize: 15,

  // Path generation inside letter
  numPoints: 80,
  radius: 30,
  bezierSteps: 10,

  // Segment configuration
  segmentLengthMin: 20,
  segmentLengthMax: 60,
  segmentGapMin: 5,
  segmentGapMax: 15,

  // Line density and appearance
  lineDensityMin: 40,
  lineDensityMax: 50,
  lineThickness: 0.5,
  lineLengthMin: 12,
  lineLengthMax: 14,

  // Color zoning
  drawInZone: 90,
  drawOutsideZone: 10,

  // Options
  linesStartOnPath: false,
  avoidIntersections: true,
  debug: true, // Enable for testing
};

export const constantsProps = {
  letter: {
    options: [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ],
  },
  fontName: {
    options: [
      "/fonts/NationalPark-Bold.ttf",
      "/fonts/NationalPark-ExtraBold.ttf",
      "/fonts/NationalPark-ExtraLight.ttf",
      "/fonts/NationalPark-Light.ttf",
      "/fonts/NationalPark-Medium.ttf",
      "/fonts/NationalPark-Regular.ttf",
      "/fonts/NationalPark-SemiBold.ttf",
      "/fonts/RedHatDisplay-Black.ttf",
      "/fonts/RedHatDisplay-BlackItalic.ttf",
      "/fonts/RedHatDisplay-Bold.ttf",
      "/fonts/RedHatDisplay-BoldItalic.ttf",
      "/fonts/RedHatDisplay-ExtraBold.ttf",
      "/fonts/RedHatDisplay-ExtraBoldItalic.ttf",
      "/fonts/RedHatDisplay-Italic.ttf",
      "/fonts/RedHatDisplay-Light.ttf",
      "/fonts/RedHatDisplay-LightItalic.ttf",
      "/fonts/RedHatDisplay-Medium.ttf",
      "/fonts/RedHatDisplay-MediumItalic.ttf",
      "/fonts/RedHatDisplay-Regular.ttf",
      "/fonts/RedHatDisplay-SemiBold.ttf",
      "/fonts/RedHatDisplay-SemiBoldItalic.ttf",
      "/fonts/StackSansHeadline-Bold.ttf",
      "/fonts/StackSansHeadline-ExtraLight.ttf",
      "/fonts/StackSansHeadline-Light.ttf",
      "/fonts/StackSansHeadline-Medium.ttf",
      "/fonts/StackSansHeadline-Regular.ttf",
      "/fonts/StackSansHeadline-SemiBold.ttf",
      "/fonts/asikue-trial/AsikueTrial-Bold.otf",
      "/fonts/asikue-trial/AsikueTrial-BoldOblique.otf",
      "/fonts/asikue-trial/AsikueTrial-ExtraBold.otf",
      "/fonts/asikue-trial/AsikueTrial-ExtraBoldOblique.otf",
      "/fonts/asikue-trial/AsikueTrial-Medium.otf",
      "/fonts/asikue-trial/AsikueTrial-MediumOblique.otf",
      "/fonts/asikue-trial/AsikueTrial-Oblique.otf",
      "/fonts/asikue-trial/AsikueTrial-Regular.otf",
      "/fonts/asikue-trial/AsikueTrial-SemiBold.otf",
      "/fonts/asikue-trial/AsikueTrial-SemiBoldOblique.otf",
      "/fonts/chunko-bold-demo/Chunko Bold Demo.otf",
      "/fonts/chunko-bold-demo/Chunko Bold Demo.ttf",
      "/fonts/made-mellow-personal-use/MADEMellowPERSONALUSE-Black.otf",
      "/fonts/made-mellow-personal-use/MADEMellowPERSONALUSE-Bold.otf",
      "/fonts/made-mellow-personal-use/MADEMellowPERSONALUSE-Light.otf",
      "/fonts/made-mellow-personal-use/MADEMellowPERSONALUSE-Medium.otf",
      "/fonts/made-mellow-personal-use/MADEMellowPERSONALUSE-Regular.otf",
      "/fonts/made-mellow-personal-use/MADEMellowPERSONALUSE-SemiBold.otf",
      "/fonts/milker/Milker.otf",
      "/fonts/moderniz/Moderniz.otf",
      "/fonts/nokie/Nokie.otf",
      "/fonts/rich-taste/Rich Taste.otf",
      "/fonts/sardin-demo/Sardin DEMO.otf",
      "/fonts/ut-boldonse-demo/UT Boldonse Demo.otf",
      "/fonts/ut-boldonse-demo/UT Boldonse Demo.ttf",
    ],
  },
  contourSampling: { min: 0.01, max: 1, step: 0.01 },
  gridSize: { min: 5, max: 50, step: 1 },
  bezierSteps: { min: 2, max: 2000, step: 1 },
};
const newSketch =
  (seed: number | null, vars: typeof constants) => (p: p5SVG) => {
    let font: any = null; // p5.Font type

    if (seed !== null) p.randomSeed(seed);

    p.setup = () => {
      setupCanvas(p, {
        width: vars.width ?? constants.width,
        height: vars.height ?? constants.height,
        seed,
        noFill: true,
        noLoop: true,
        smooth: true,
        debug: vars.debug ?? constants.debug,
        marginX: vars.marginX ?? constants.marginX,
        marginY: vars.marginY ?? constants.marginY,
        useSVG: vars.useSVG ?? false,
        zoomLevel: (vars as any).zoomLevel,
      });

      // Try to load font asynchronously, then draw
      const fontUrl = vars.fontName ?? constants.fontName;
      p.loadFont(
        fontUrl,
        (loadedFont: any) => {
          font = loadedFont;
          console.log("Font loaded, drawing sketch");
          drawSketch();
        },
        () => {
          console.error("Failed to load font, drawing without textToPoints");
          drawSketch();
        }
      );
    };

    // Simple point-in-polygon test using ray casting
    const isPointInPolygon = (
      x: number,
      y: number,
      polygon: { x: number; y: number }[]
    ): boolean => {
      if (polygon.length < 3) return false;
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x,
          yi = polygon[i].y;
        const xj = polygon[j].x,
          yj = polygon[j].y;

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Separate contours by detecting large gaps between consecutive points
    const separateIntoContours = (
      points: { x: number; y: number }[]
    ): { x: number; y: number }[][] => {
      if (points.length === 0) return [];

      const contours: { x: number; y: number }[][] = [];
      let currentContour: { x: number; y: number }[] = [points[0]];

      // Calculate all distances
      const distances: number[] = [];
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        distances.push(Math.sqrt(dx * dx + dy * dy));
      }

      if (distances.length === 0) return [points];

      // Calculate median distance
      const sortedDistances = [...distances].sort((a, b) => a - b);
      const medianDist =
        sortedDistances[Math.floor(sortedDistances.length / 2)];

      // Use a generous threshold.
      const gapThreshold = Math.max(medianDist * 10, 20);

      console.log(
        `Median point distance: ${medianDist.toFixed(
          2
        )}, gap threshold: ${gapThreshold.toFixed(2)}`
      );

      for (let i = 1; i < points.length; i++) {
        const dist = distances[i - 1];

        if (dist > gapThreshold) {
          // Start new contour
          if (currentContour.length >= 3) {
            contours.push(currentContour);
            console.log(
              `Contour completed with ${
                currentContour.length
              } points (gap: ${dist.toFixed(2)})`
            );
          }
          currentContour = [points[i]];
        } else {
          currentContour.push(points[i]);
        }
      }

      // Add last contour
      if (currentContour.length >= 3) {
        contours.push(currentContour);
        console.log(`Final contour with ${currentContour.length} points`);
      }

      return contours;
    };

    const drawSketch = () => {
      // Reset the drawn lines tracker at the start of each sketch
      resetDrawnLines();

      const letter = vars.letter ?? constants.letter;

      const marginX = vars.marginX ?? constants.marginX;
      const marginY = vars.marginY ?? constants.marginY;
      const drawW = (vars.width ?? constants.width) - 2 * marginX;
      const drawH = (vars.height ?? constants.height) - 2 * marginY;

      // Calculate font size based on height to ensure consistency
      // We use a fixed size relative to the drawing height
      const baseFontSize = drawH;

      console.log("=== Drawing sketch ===", {
        letter,
        drawW,
        drawH,
        marginX,
        marginY,
        baseFontSize,
      });

      // Get letter outline points using textToPoints
      if (!font) {
        console.error("Font not loaded");
        return;
      }

      const contourSampling = vars.contourSampling ?? constants.contourSampling;
      const textPoints = font.textToPoints(letter, 0, 0, baseFontSize, {
        sampleFactor: contourSampling,
      });

      if (textPoints.length === 0) {
        console.error("No points from textToPoints");
        return;
      }

      // Calculate bounds
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const pt of textPoints) {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      }

      const letterWidth = maxX - minX;
      const letterHeight = maxY - minY;

      // Calculate scale to fit within the drawing area
      // We only scale DOWN if the letter is too big for the box
      // Otherwise we keep scale = 1 to maintain consistent font size across letters
      const maxW = drawW * 0.9;
      const maxH = drawH * 0.9;

      let scale = 1;

      // Check width constraint
      if (letterWidth > maxW) {
        scale = maxW / letterWidth;
      }

      // Check height constraint (apply on top of width scale)
      if (letterHeight * scale > maxH) {
        scale = (maxH / letterHeight) * scale;
      }

      // Scale and center the points
      const scaledPoints = textPoints.map((pt: any) => ({
        x: marginX + (pt.x - minX) * scale + (drawW - letterWidth * scale) / 2,
        y: marginY + (pt.y - minY) * scale + (drawH - letterHeight * scale) / 2,
      }));

      console.log("Scaled points:", scaledPoints.length);

      // Separate into contours
      const contours = separateIntoContours(scaledPoints);
      console.log(`Found ${contours.length} contours`);

      if (contours.length === 0) {
        console.error("No contours found! Cannot proceed.");
        return;
      }

      // Helper to check if contour A is inside contour B
      const isContourInsideContour = (
        contourA: { x: number; y: number }[],
        contourB: { x: number; y: number }[]
      ): boolean => {
        // Check if the first point of A is inside B
        if (contourA.length === 0) return false;
        // Use the first point
        return isPointInPolygon(contourA[0].x, contourA[0].y, contourB);
      };

      // Determine topology (Outer vs Hole)
      // We assume standard font topology where holes are inside bodies
      const contoursWithStats = contours.map((c, index) => ({
        id: index,
        points: c,
        level: 0,
      }));

      // Calculate nesting levels
      for (let i = 0; i < contoursWithStats.length; i++) {
        for (let j = 0; j < contoursWithStats.length; j++) {
          if (i === j) continue;
          if (
            isContourInsideContour(
              contoursWithStats[i].points,
              contoursWithStats[j].points
            )
          ) {
            contoursWithStats[i].level++;
          }
        }
      }

      const finalPolygons: {
        outer: { x: number; y: number }[];
        holes: { x: number; y: number }[][];
      }[] = [];

      // Level 0, 2, 4... are Outers (Bodies)
      const outers = contoursWithStats.filter((c) => c.level % 2 === 0);

      // Level 1, 3, 5... are Holes
      const holes = contoursWithStats.filter((c) => c.level % 2 === 1);

      console.log(`Topology: ${outers.length} outers, ${holes.length} holes`);

      // Initialize polygons with outers
      outers.forEach((outer) => {
        finalPolygons.push({
          outer: outer.points,
          holes: [],
        });
      });

      // Assign holes to their immediate parents
      holes.forEach((hole) => {
        // Find all outers that contain this hole
        const parents = outers.filter((outer) =>
          isContourInsideContour(hole.points, outer.points)
        );

        if (parents.length > 0) {
          // If nested islands, pick the parent with the highest level
          parents.sort((a, b) => b.level - a.level);
          const parent = parents[0];

          // Find the polygon corresponding to this parent
          // We match by reference since we used the same objects
          const parentIndex = outers.indexOf(parent);
          if (parentIndex !== -1) {
            finalPolygons[parentIndex].holes.push(hole.points);
            console.log(
              `Assigned hole (level ${hole.level}) to outer (level ${parent.level})`
            );
          }
        } else {
          console.warn("Found a hole but no parent outer contains it?");
        }
      });

      console.log(`Final: ${finalPolygons.length} polygons with holes`);

      if (finalPolygons.length === 0) {
        console.error("No final polygons! Cannot generate points.");
        return;
      }

      // Debug: check polygon bounds
      for (let i = 0; i < finalPolygons.length; i++) {
        const poly = finalPolygons[i];
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        for (const pt of poly.outer) {
          minX = Math.min(minX, pt.x);
          maxX = Math.max(maxX, pt.x);
          minY = Math.min(minY, pt.y);
          maxY = Math.max(maxY, pt.y);
        }
        console.log(
          `Polygon ${i} bounds: x[${minX.toFixed(1)}, ${maxX.toFixed(
            1
          )}], y[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`
        );
      }

      console.log(
        `Grid sampling area: x[${marginX}, ${marginX + drawW}], y[${marginY}, ${
          marginY + drawH
        }]`
      );

      // Create grid of sample points
      const gridSize = vars.gridSize ?? constants.gridSize;
      const validPoints: { x: number; y: number }[] = [];

      for (let y = marginY; y < marginY + drawH; y += gridSize) {
        for (let x = marginX; x < marginX + drawW; x += gridSize) {
          // Add random offset to avoid perfect grid
          const offsetX = p.random(-gridSize * 0.4, gridSize * 0.4);
          const offsetY = p.random(-gridSize * 0.4, gridSize * 0.4);
          const px = x + offsetX;
          const py = y + offsetY;

          // Check if point is inside any of the final polygons
          let isValid = false;

          for (const poly of finalPolygons) {
            // Must be inside outer ring
            const inOuter = isPointInPolygon(px, py, poly.outer);

            if (!inOuter) continue;

            // Must NOT be inside any holes
            let inHole = false;
            for (const hole of poly.holes) {
              if (isPointInPolygon(px, py, hole)) {
                inHole = true;
                break;
              }
            }

            if (!inHole) {
              isValid = true;
              break;
            }
          }

          if (isValid) {
            validPoints.push({ x: px, y: py });
          }
        }
      }

      // Debug: if no points found, test a specific point we know should be inside
      if (validPoints.length === 0 && finalPolygons.length > 0) {
        const testPoly = finalPolygons[0];
        if (testPoly.outer && testPoly.outer.length > 0) {
          // Test the center of the polygon bounds
          let sumX = 0,
            sumY = 0;
          for (const pt of testPoly.outer) {
            if (pt && typeof pt.x === "number" && typeof pt.y === "number") {
              sumX += pt.x;
              sumY += pt.y;
            }
          }
          const centerX = sumX / testPoly.outer.length;
          const centerY = sumY / testPoly.outer.length;
          console.log(
            `Testing center point (${centerX.toFixed(1)}, ${centerY.toFixed(
              1
            )})`
          );
          console.log(
            `isPointInPolygon result:`,
            isPointInPolygon(centerX, centerY, testPoly.outer)
          );

          // Also test the first vertex
          const firstPt = testPoly.outer[0];
          if (
            firstPt &&
            typeof firstPt.x === "number" &&
            typeof firstPt.y === "number"
          ) {
            console.log(
              `Testing first vertex (${firstPt.x.toFixed(
                1
              )}, ${firstPt.y.toFixed(1)})`
            );
            console.log(
              `isPointInPolygon result:`,
              isPointInPolygon(firstPt.x, firstPt.y, testPoly.outer)
            );
          }

          // Log the polygon structure
          console.log(
            "Outer polygon first 5 points:",
            testPoly.outer.slice(0, 5)
          );
        }
      }
      console.log(`Found ${validPoints.length} valid points inside letter`);

      // Additional debug: test point-in-polygon manually
      if (validPoints.length === 0 && finalPolygons.length > 0) {
        console.log("=== DEBUGGING: No points found, testing manually ===");
        const testPoly = finalPolygons[0];
        console.log("Polygon has", testPoly.outer.length, "points");

        // Test a specific grid point
        const testX = marginX + 50;
        const testY = marginY + 50;
        console.log(`Testing grid point (${testX}, ${testY})`);
        console.log("Result:", isPointInPolygon(testX, testY, testPoly.outer));

        // Test polygon centroid
        let sumX = 0,
          sumY = 0,
          count = 0;
        for (const pt of testPoly.outer) {
          if (pt && typeof pt.x === "number" && typeof pt.y === "number") {
            sumX += pt.x;
            sumY += pt.y;
            count++;
          }
        }
        if (count > 0) {
          const centroidX = sumX / count;
          const centroidY = sumY / count;
          console.log(
            `Testing centroid (${centroidX.toFixed(1)}, ${centroidY.toFixed(
              1
            )})`
          );
          console.log(
            "Result:",
            isPointInPolygon(centroidX, centroidY, testPoly.outer)
          );
        }
      }

      if (validPoints.length === 0) {
        console.error("No valid points found");
        return;
      }

      // Build path by connecting nearby points
      const numPoints = Math.min(
        vars.numPoints ?? constants.numPoints,
        validPoints.length
      );
      const pathPoints: { x: number; y: number }[] = [];

      let currentPoint = validPoints[Math.floor(p.random(validPoints.length))];
      pathPoints.push(currentPoint);

      const used = new Set([validPoints.indexOf(currentPoint)]);
      const maxDistance = gridSize * 3; // Reduced from 4 to 3 for tighter connections

      for (let i = 1; i < numPoints && used.size < validPoints.length; i++) {
        const nearby = validPoints
          .map((pt, idx) => ({
            pt,
            idx,
            dist: Math.hypot(pt.x - currentPoint.x, pt.y - currentPoint.y),
          }))
          .filter((item) => !used.has(item.idx) && item.dist <= maxDistance)
          .sort((a, b) => a.dist - b.dist);

        if (nearby.length > 0) {
          // Strongly bias towards closer points (cube the random to weight heavily towards 0)
          const pickIndex = Math.floor(Math.pow(p.random(), 3) * nearby.length);
          currentPoint = nearby[pickIndex].pt;
          used.add(nearby[pickIndex].idx);
        } else {
          // If no nearby points, find closest unused point (but limit jumps)
          const unused = validPoints
            .map((pt, idx) => ({
              pt,
              idx,
              dist: Math.hypot(pt.x - currentPoint.x, pt.y - currentPoint.y),
            }))
            .filter((item) => !used.has(item.idx))
            .sort((a, b) => a.dist - b.dist);

          if (unused.length === 0) break;

          // Only jump if we must, pick from closest 5 options
          const jumpCandidates = unused.slice(0, 5);
          const chosen =
            jumpCandidates[Math.floor(p.random(jumpCandidates.length))];
          currentPoint = chosen.pt;
          used.add(chosen.idx);
        }

        pathPoints.push(currentPoint);
      }

      console.log(`Generated ${pathPoints.length} path points`);

      // Create bezier path
      const radius = vars.radius ?? constants.radius;
      const bezierSteps = vars.bezierSteps ?? constants.bezierSteps;
      const smoothPath = createBezierRoundedPath(
        pathPoints,
        radius,
        bezierSteps
      );

      if (vars.debug ?? constants.debug) {
        // Draw each contour in a different color
        const colors = [
          [255, 255, 0],
          [255, 0, 255],
          [0, 255, 255],
          [255, 128, 0],
        ];
        contours.forEach((contour, idx) => {
          const color = colors[idx % colors.length];
          p.noFill();
          p.stroke(color[0], color[1], color[2]);
          p.strokeWeight(2);
          p.beginShape();
          for (const pt of contour) {
            p.vertex(pt.x, pt.y);
          }
          p.endShape(p.CLOSE);
        });

        // Draw the valid grid points
        p.fill(0, 255, 0);
        p.noStroke();
        for (const point of validPoints) {
          p.circle(point.x, point.y, 3);
        }

        // Draw the path
        p.noFill();
        p.stroke("red");
        p.strokeWeight(2);
        drawSafePath(p, smoothPath);

        // Draw boundary
        p.stroke(128, 128, 128);
        p.strokeWeight(1);
        p.noFill();
        p.rect(marginX, marginY, drawW, drawH);
      }

      const colors: DotPen[] = [
        "staedtlerPensNew.teal",
        "staedtlerPensNew.limeGreen",

        "staedtlerPensNew.pink",
        "staedtlerPensNew.darkPurple",
        "staedtlerPensNew.blue",
      ];

      // Helper to check if a point is inside the letter
      const checkPointInside = (x: number, y: number): boolean => {
        for (const poly of finalPolygons) {
          // Must be inside outer ring
          const inOuter = isPointInPolygon(x, y, poly.outer);

          if (!inOuter) continue;

          // Must NOT be inside any holes
          let inHole = false;
          for (const hole of poly.holes) {
            if (isPointInPolygon(x, y, hole)) {
              inHole = true;
              break;
            }
          }

          if (!inHole) {
            return true;
          }
        }
        return false;
      };

      // Draw perpendicular lines along the path
      colors.forEach((color, index) => {
        drawPerpendicularLines(
          p,
          smoothPath,
          color,
          {
            segmentLengthMin:
              vars.segmentLengthMin ?? constants.segmentLengthMin,
            segmentLengthMax:
              vars.segmentLengthMax ?? constants.segmentLengthMax,
            segmentGapMin: vars.segmentGapMin ?? constants.segmentGapMin,
            segmentGapMax: vars.segmentGapMax ?? constants.segmentGapMax,
            lineDensityMin: vars.lineDensityMin ?? constants.lineDensityMin,
            lineDensityMax: vars.lineDensityMax ?? constants.lineDensityMax,
            lineThickness: vars.lineThickness ?? constants.lineThickness,
            lineLengthMin: vars.lineLengthMin ?? constants.lineLengthMin,
            lineLengthMax: vars.lineLengthMax ?? constants.lineLengthMax,
            drawInZone: vars.drawInZone ?? constants.drawInZone,
            drawOutsideZone: vars.drawOutsideZone ?? constants.drawOutsideZone,
            linesStartOnPath:
              vars.linesStartOnPath ?? constants.linesStartOnPath,
            avoidIntersections:
              vars.avoidIntersections ?? constants.avoidIntersections,
            checkBoundary: checkPointInside,
          },
          index,
          colors.length
        );
      });
    };

    // Create a bitmap mask of the letter (white = inside, black = outside)
    const createLetterMask = (
      letter: string,
      fontSize: number,
      drawW: number,
      drawH: number,
      marginX: number,
      marginY: number
    ): any => {
      // Create offscreen graphics buffer with P2D renderer for proper pixel access
      const pg = p.createGraphics(Math.ceil(drawW), Math.ceil(drawH), p.P2D);

      if (!font) {
        console.warn("Font not loaded");
        return pg;
      }

      pg.background(0); // Black background
      pg.fill(255); // White letter
      pg.noStroke();
      pg.textFont(font);
      pg.textSize(fontSize);

      // Use CENTER alignment for both X and Y
      pg.textAlign(p.CENTER, p.CENTER);

      // Get bounds to calculate scaling
      const bounds = font.textBounds(letter, 0, 0, fontSize);

      // Calculate scale to fit the letter in the drawable area
      const letterWidth = bounds.w;
      const letterHeight = bounds.h;
      const scaleX = drawW / letterWidth;
      const scaleY = drawH / letterHeight;
      const scale = Math.min(scaleX, scaleY) * 0.85; // 85% to leave some margin

      const scaledSize = fontSize * scale;
      pg.textSize(scaledSize);

      // Draw at the center of the graphics buffer
      const centerX = drawW / 2;
      const centerY = drawH / 2;

      console.log("Drawing letter to mask:", {
        letter,
        fontSize,
        scaledSize,
        scale,
        drawW,
        drawH,
        centerX,
        centerY,
      });

      pg.text(letter, centerX, centerY);
      pg.loadPixels();

      // Debug: Check if center has any white pixels
      const centerIdx =
        (Math.floor(pg.height / 2) * pg.width + Math.floor(pg.width / 2)) * 4;

      // Sample pixels at different locations to verify mask
      const samples = [
        {
          name: "center",
          x: Math.floor(pg.width / 2),
          y: Math.floor(pg.height / 2),
        },
        { name: "top-left", x: 10, y: 10 },
        { name: "top-right", x: pg.width - 10, y: 10 },
        { name: "bottom-left", x: 10, y: pg.height - 10 },
        { name: "bottom-right", x: pg.width - 10, y: pg.height - 10 },
      ];

      const sampleResults = samples.map((s) => ({
        ...s,
        brightness: pg.pixels[(s.y * pg.width + s.x) * 4],
      }));

      console.log("Mask created:", {
        width: pg.width,
        height: pg.height,
        centerBrightness: pg.pixels[centerIdx],
        samples: sampleResults,
        hasPixels: pg.pixels && pg.pixels.length > 0,
      });

      return pg;
    };

    // Generate path by sampling points inside the letter and connecting nearby ones
    const generateBouncingPathWithMask = (
      mask: any,
      numPoints: number,
      marginX: number,
      marginY: number,
      drawW: number,
      drawH: number
    ): {
      points: { x: number; y: number }[];
      allValidPoints: { x: number; y: number }[];
    } => {
      console.log("Generating path with mask:", {
        maskWidth: mask.width,
        maskHeight: mask.height,
        drawW,
        drawH,
        numPoints,
      });

      // First, create a grid of points and keep only those inside the letter
      const gridSize = 10; // Sample every 10 pixels
      const validPoints: { x: number; y: number }[] = [];

      console.log("Scanning mask for valid points...");
      let sampleLog = [];

      for (let y = 0; y < drawH; y += gridSize) {
        for (let x = 0; x < drawW; x += gridSize) {
          const isValid = isPointInMask(mask, x, y);
          if (isValid) {
            validPoints.push({ x, y });
          }
          // Log first few samples
          if (sampleLog.length < 20) {
            sampleLog.push({ x, y, isValid });
          }
        }
      }

      console.log("First 20 sample checks:", sampleLog);
      console.log(`Found ${validPoints.length} valid points inside letter`);

      if (validPoints.length > 0) {
        const avgX =
          validPoints.reduce((sum, p) => sum + p.x, 0) / validPoints.length;
        const avgY =
          validPoints.reduce((sum, p) => sum + p.y, 0) / validPoints.length;
        console.log("Center of valid points:", { avgX, avgY });
      }

      if (validPoints.length === 0) {
        console.error("No valid points found inside mask!");
        return { points: [], allValidPoints: [] };
      }

      // Start from a random point
      const points: { x: number; y: number }[] = [];
      let currentPoint = validPoints[Math.floor(p.random(validPoints.length))];
      points.push({ x: currentPoint.x + marginX, y: currentPoint.y + marginY });

      // Build path by connecting to nearby points
      const used = new Set<number>();
      used.add(validPoints.indexOf(currentPoint));

      const maxDistance = gridSize * 4; // Maximum jump distance

      for (let i = 1; i < numPoints && used.size < validPoints.length; i++) {
        // Find nearby unused points
        const nearby: {
          point: { x: number; y: number };
          index: number;
          dist: number;
        }[] = [];

        for (let j = 0; j < validPoints.length; j++) {
          if (used.has(j)) continue;

          const candidate = validPoints[j];
          const dx = candidate.x - currentPoint.x;
          const dy = candidate.y - currentPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= maxDistance) {
            nearby.push({ point: candidate, index: j, dist });
          }
        }

        if (nearby.length === 0) {
          // If stuck, jump to any unused point
          const unusedIndices = validPoints
            .map((_, idx) => idx)
            .filter((idx) => !used.has(idx));

          if (unusedIndices.length === 0) break;

          const randomIdx =
            unusedIndices[Math.floor(p.random(unusedIndices.length))];
          currentPoint = validPoints[randomIdx];
          used.add(randomIdx);
        } else {
          // Pick a random nearby point (weighted towards closer ones)
          nearby.sort((a, b) => a.dist - b.dist);
          const pickIndex = Math.floor(p.random() * p.random() * nearby.length); // Biased towards 0
          const chosen = nearby[pickIndex];

          currentPoint = chosen.point;
          used.add(chosen.index);
        }

        points.push({
          x: currentPoint.x + marginX,
          y: currentPoint.y + marginY,
        });
      }

      console.log(
        `Generated ${points.length} points from ${validPoints.length} valid locations`
      );

      // Return both the path and all valid points (for debug visualization)
      const allValidPointsWithMargin = validPoints.map((p) => ({
        x: p.x + marginX,
        y: p.y + marginY,
      }));

      return { points, allValidPoints: allValidPointsWithMargin };
    };

    // Check if a point is inside the letter using the bitmap mask
    const isPointInMask = (mask: any, x: number, y: number): boolean => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);

      if (ix < 0 || ix >= mask.width || iy < 0 || iy >= mask.height) {
        return false;
      }

      const idx = (iy * mask.width + ix) * 4;
      const brightness = mask.pixels[idx];

      return brightness > 128; // White pixels are inside the letter
    };

    // Generate a bouncing path inside the letter shape
    const generateBouncingPath = (
      letterContours: { x: number; y: number }[][],
      numPoints: number
    ): { x: number; y: number }[] => {
      if (letterContours.length === 0) return [];

      const outerContour = letterContours[0]; // Outer boundary
      const holes = letterContours.slice(1); // Inner holes (if any)

      // Calculate bounding box
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      outerContour.forEach((pt) => {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      });

      // Find a random starting point inside the letter
      let currentX = 0;
      let currentY = 0;
      let attempts = 0;

      while (attempts < 1000) {
        currentX = p.random(minX, maxX);
        currentY = p.random(minY, maxY);

        if (isPointInsideShape(currentX, currentY, outerContour, holes)) {
          break;
        }
        attempts++;
      }

      const points: { x: number; y: number }[] = [{ x: currentX, y: currentY }];

      // Random initial direction
      let angle = p.random(0, 360);
      const stepSize = Math.min(maxX - minX, maxY - minY) / 20; // Step size relative to letter size

      for (let i = 1; i < numPoints; i++) {
        // Try to move in current direction
        let newX = currentX + Math.cos(p.radians(angle)) * stepSize;
        let newY = currentY + Math.sin(p.radians(angle)) * stepSize;

        // Check if new position is still inside the letter
        if (!isPointInsideShape(newX, newY, outerContour, holes)) {
          // Hit boundary! Change direction
          // Try random new directions until we find one that works
          let foundDirection = false;

          for (let attempt = 0; attempt < 36; attempt++) {
            angle = p.random(0, 360);
            newX = currentX + Math.cos(p.radians(angle)) * stepSize;
            newY = currentY + Math.sin(p.radians(angle)) * stepSize;

            if (isPointInsideShape(newX, newY, outerContour, holes)) {
              foundDirection = true;
              break;
            }
          }

          if (!foundDirection) {
            // If we're stuck, try smaller step
            const smallStep = stepSize * 0.3;
            for (let attempt = 0; attempt < 36; attempt++) {
              angle = p.random(0, 360);
              newX = currentX + Math.cos(p.radians(angle)) * smallStep;
              newY = currentY + Math.sin(p.radians(angle)) * smallStep;

              if (isPointInsideShape(newX, newY, outerContour, holes)) {
                break;
              }
            }
          }
        }

        currentX = newX;
        currentY = newY;
        points.push({ x: currentX, y: currentY });

        // Add slight random variation to angle even when not bouncing
        angle += p.random(-15, 15);
      }

      return points;
    };

    // Check if point is inside outer contour but outside any holes
    const isPointInsideShape = (
      x: number,
      y: number,
      outerContour: { x: number; y: number }[],
      holes: { x: number; y: number }[][]
    ): boolean => {
      // Must be inside outer contour
      if (!isPointInsidePolygon(x, y, outerContour)) {
        return false;
      }

      // Must NOT be inside any holes
      for (const hole of holes) {
        if (isPointInsidePolygon(x, y, hole)) {
          return false;
        }
      }

      return true;
    };

    // Ray casting algorithm to test if point is inside polygon
    const isPointInsidePolygon = (
      x: number,
      y: number,
      polygon: { x: number; y: number }[]
    ): boolean => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Extract contour points from rendered text
    const getTextContourPoints = (
      letter: string,
      fontSize: number,
      _fontName: string, // Not used, kept for API consistency
      drawW: number,
      drawH: number,
      marginX: number,
      marginY: number,
      sampling: number
    ): { x: number; y: number }[][] => {
      // Use textToPoints on the loaded font
      if (font && typeof font.textToPoints === "function") {
        // Get points at origin first to calculate bounds
        const rawPoints = font.textToPoints(letter, 0, 0, fontSize, {
          sampleFactor: sampling,
          simplifyThreshold: 0,
        });

        if (rawPoints.length === 0) {
          console.warn("No points generated from text");
          return [];
        }

        // textToPoints returns all contours as a single array
        // We need to detect separate contours (outer and holes)
        const contours = separateContours(rawPoints);

        // Calculate bounding box of all points
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        rawPoints.forEach((pt: any) => {
          minX = Math.min(minX, pt.x);
          maxX = Math.max(maxX, pt.x);
          minY = Math.min(minY, pt.y);
          maxY = Math.max(maxY, pt.y);
        });

        const letterWidth = maxX - minX;
        const letterHeight = maxY - minY;

        // Calculate scale to fit within drawable area
        const scaleX = drawW / letterWidth;
        const scaleY = drawH / letterHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9;

        // Calculate center position
        const centerX = marginX + drawW / 2;
        const centerY = marginY + drawH / 2;

        // Transform all contours: scale and center
        return contours.map((contour) =>
          contour.map((pt: any) => {
            const scaledX = (pt.x - minX) * scale;
            const scaledY = (pt.y - minY) * scale;
            const scaledWidth = letterWidth * scale;
            const scaledHeight = letterHeight * scale;

            return {
              x: centerX - scaledWidth / 2 + scaledX,
              y: centerY - scaledHeight / 2 + scaledY,
            };
          })
        );
      }

      // Fallback if font not loaded
      console.warn("Font not loaded, returning empty path");
      return [];
    };

    // Separate a flat array of points into multiple contours
    // Points that are far apart indicate separate contours
    const separateContours = (points: any[]): any[][] => {
      if (points.length === 0) return [];

      const contours: any[][] = [];
      let currentContour: any[] = [points[0]];
      const threshold = 50; // Distance threshold to detect new contour

      for (let i = 1; i < points.length; i++) {
        const prevPt = points[i - 1];
        const currPt = points[i];
        const dist = Math.sqrt(
          Math.pow(currPt.x - prevPt.x, 2) + Math.pow(currPt.y - prevPt.y, 2)
        );

        if (dist > threshold) {
          // Start new contour
          contours.push(currentContour);
          currentContour = [currPt];
        } else {
          currentContour.push(currPt);
        }
      }

      // Add last contour
      if (currentContour.length > 0) {
        contours.push(currentContour);
      }

      return contours;
    };
  };

export default newSketch;
