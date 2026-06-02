import type { CanvasFormat, CanvasSize, Composition } from './types';

const ASPECT_H_OVER_W: Record<CanvasFormat, number> = {
  story: 1920 / 1080,
  square: 1,
};

export function canvasSize(format: CanvasFormat, baseWidth: number): CanvasSize {
  return { width: baseWidth, height: Math.round(baseWidth * ASPECT_H_OVER_W[format]) };
}

// All values are derived from `baseWidth` so the layout reflows from a 360-wide
// preview to a 1080-wide export by passing the right baseWidth — no separate
// "preview vs export" code path.
export function defaultComposition(format: CanvasFormat, baseWidth: number): Composition {
  const size = canvasSize(format, baseWidth);
  const u = baseWidth / 1080;

  const coverRatio = format === 'story' ? 0.78 : 0.58;
  const coverWidth = baseWidth * coverRatio;
  const coverX = (size.width - coverWidth) / 2;
  const coverY = format === 'story' ? size.height * 0.22 : size.height * 0.13;

  const textPadX = baseWidth * 0.08;
  const textWidth = size.width - textPadX * 2;
  const titleY = coverY + coverWidth + 80 * u;

  return {
    format,
    size,
    background: { kind: 'solid', color: '#0B0B0F' },
    cover: {
      box: { x: coverX, y: coverY, width: coverWidth, height: coverWidth },
      cornerRadius: coverWidth * 0.04,
      shadow: { dy: 32 * u, blur: 60 * u, color: '#000000AA' },
    },
    title: {
      box: { x: textPadX, y: titleY, width: textWidth, height: 260 * u },
      style: {
        role: 'sans',
        size: 78 * u,
        color: '#FFFFFF',
        align: 'center',
        weight: 700,
        maxLines: 2,
      },
    },
    // artist/meta y get overridden by the renderer once the title's actual
    // measured height is known; we still emit a box so the data shape is
    // consistent for downstream consumers.
    artist: {
      box: { x: textPadX, y: titleY, width: textWidth, height: 90 * u },
      style: {
        role: 'sans',
        size: 48 * u,
        color: '#C9C9D4',
        align: 'center',
        weight: 400,
        maxLines: 1,
      },
    },
    meta: {
      box: { x: textPadX, y: titleY, width: textWidth, height: 70 * u },
      style: {
        role: 'sans',
        size: 36 * u,
        color: '#7A7A88',
        align: 'center',
        weight: 400,
        maxLines: 1,
      },
    },
  };
}
