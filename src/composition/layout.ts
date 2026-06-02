import type { CanvasFormat, CanvasSize } from './types';

const ASPECT_H_OVER_W: Record<CanvasFormat, number> = {
  story: 1920 / 1080,
  square: 1,
};

export function canvasSize(format: CanvasFormat, baseWidth: number): CanvasSize {
  return { width: baseWidth, height: Math.round(baseWidth * ASPECT_H_OVER_W[format]) };
}
