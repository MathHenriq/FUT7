/** Shared pitch geometry, normalized 0..1 on both axes, so the 2D picker and the 3D
 *  view draw the same pitch and never drift apart.
 *  x: 0 = left touchline, 1 = right touchline
 *  y: 0 = our own goal line, 1 = opponent goal line (we always attack "up")
 *  Proportions approximate a society/fut7 pitch (~30m x 50m); they are tuned to read
 *  correctly, not to certify a regulation size. */

export const PITCH_RATIO = 30 / 50; // width / length

export const pitchGeom = {
  /** Grande área */
  penaltyWidth: 0.52,
  penaltyDepth: 0.16,
  /** Pequena área */
  goalAreaWidth: 0.26,
  goalAreaDepth: 0.07,
  goalWidth: 0.14,
  centerCircleR: 0.13,
  penaltySpot: 0.115,
  cornerR: 0.025,
} as const;

export interface Setor {
  index: number;
  col: number;
  row: number;
  /** Normalized rect: x0..x1 left→right, y0..y1 in pitch space (y up = attacking). */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  cx: number;
  cy: number;
}

/** Row 0 is the attacking band, matching setorIndex() in data.ts. */
export function setores(cols: number, rows: number): Setor[] {
  const out: Setor[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col / cols;
      const x1 = (col + 1) / cols;
      const y1 = 1 - row / rows;
      const y0 = 1 - (row + 1) / rows;
      out.push({
        index: row * cols + col,
        col,
        row,
        x0, x1, y0, y1,
        cx: (x0 + x1) / 2,
        cy: (y0 + y1) / 2,
      });
    }
  }
  return out;
}

/** Pitch y grows upward; SVG y grows downward. One place to flip it. */
export function toSvgY(y: number): number {
  return 1 - y;
}
