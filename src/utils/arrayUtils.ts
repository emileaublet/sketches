import type { p5SVG } from "p5.js-svg";

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * Uses p5's random function for consistency with seeded randomness
 *
 * @param arr - Array to shuffle (modified in place)
 * @param p - p5 instance (uses its random function)
 * @returns The same array, shuffled
 */
export function shuffleArray<T>(arr: T[], p: p5SVG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get a shuffled copy of an array without modifying the original
 *
 * @param arr - Array to shuffle
 * @param p - p5 instance
 * @returns New shuffled array
 */
export function getShuffledArray<T>(arr: T[], p: p5SVG): T[] {
  const copy = [...arr];
  return shuffleArray(copy, p);
}

/**
 * Pick N random elements from an array without replacement
 *
 * @param arr - Source array
 * @param count - Number of elements to pick
 * @param p - p5 instance
 * @returns Array of randomly selected elements
 */
export function pickRandom<T>(arr: T[], count: number, p: p5SVG): T[] {
  const shuffled = getShuffledArray(arr, p);
  return shuffled.slice(0, Math.min(count, arr.length));
}

/**
 * Weighted random selection from an array
 * Each element should have a corresponding weight
 *
 * @param arr - Array of items
 * @param weights - Array of weights (same length as arr)
 * @param p - p5 instance
 * @returns Selected item
 */
export function weightedRandom<T>(arr: T[], weights: number[], p: p5SVG): T {
  if (arr.length !== weights.length) {
    throw new Error("Array and weights must have the same length");
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = p.random(totalWeight);

  for (let i = 0; i < arr.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return arr[i];
    }
  }

  // Fallback (shouldn't happen)
  return arr[arr.length - 1];
}

/**
 * Partition an array into chunks of specified size
 *
 * @param arr - Array to partition
 * @param chunkSize - Size of each chunk
 * @returns Array of arrays (chunks)
 */
export function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Create an array of numbers from start to end (inclusive)
 *
 * @param start - Start value
 * @param end - End value
 * @param step - Step size (default 1)
 * @returns Array of numbers
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i <= end; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i >= end; i += step) {
      result.push(i);
    }
  }
  return result;
}
