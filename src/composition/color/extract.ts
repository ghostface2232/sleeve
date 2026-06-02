import { AlphaType, ColorType, type SkImage, Skia } from '@shopify/react-native-skia';

import { luminance, type Rgba, rgbToHex, saturation } from './color';

// Representative-color extraction for the "cover-colors" background. The cover
// is downscaled into a tiny offscreen surface, its pixels are quantized into a
// coarse RGB cube, and the most populated buckets become the swatches. Returns
// hex strings ordered most-dominant first, or null if extraction is unavailable
// (callers fall back to a static color).

const SAMPLE = 32; // downscale target — small enough that the JS histogram is cheap
const BITS = 4; // bits kept per channel → 16 levels, 4096 buckets

type Bucket = { count: number; r: number; g: number; b: number };

export function extractCoverColors(image: SkImage, count = 4): string[] | null {
  try {
    const pixels = downscalePixels(image);
    if (!pixels) return null;

    const buckets = new Map<number, Bucket>();
    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3];
      if (a < 128) continue; // ignore transparent edges
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const key = (r >> (8 - BITS)) | ((g >> (8 - BITS)) << BITS) | ((b >> (8 - BITS)) << (BITS * 2));
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.count++;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
      } else {
        buckets.set(key, { count: 1, r, g, b });
      }
    }
    if (buckets.size === 0) return null;

    const swatches: Rgba[] = [...buckets.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, Math.max(count * 3, 8))
      .map((bk) => ({ r: bk.r / bk.count, g: bk.g / bk.count, b: bk.b / bk.count, a: 255 }));

    // Drop near-duplicates so a gradient gets visibly distinct stops.
    const distinct: Rgba[] = [];
    for (const s of swatches) {
      if (!distinct.some((d) => colorDistance(d, s) < 40)) distinct.push(s);
      if (distinct.length >= count) break;
    }

    return distinct.map((c) => rgbToHex(c.r, c.g, c.b));
  } catch {
    return null;
  }
}

// Convenience: a pleasing two-stop gradient (a vivid color paired with a darker
// anchor) derived from the extracted swatches.
export function coverGradientStops(image: SkImage): [string, string] | null {
  const colors = extractCoverColors(image, 5);
  if (!colors || colors.length === 0) return null;
  const rgba = colors.map((hex) => ({ hex, ...parse(hex) }));
  const vivid = [...rgba].sort((a, b) => saturation(b) - saturation(a))[0];
  const dark = [...rgba].sort((a, b) => luminance(a) - luminance(b))[0];
  return [vivid.hex, dark.hex === vivid.hex ? colors[colors.length - 1] : dark.hex];
}

function downscalePixels(image: SkImage): Uint8Array | null {
  const surface = Skia.Surface.MakeOffscreen(SAMPLE, SAMPLE) ?? Skia.Surface.Make(SAMPLE, SAMPLE);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  const src = Skia.XYWHRect(0, 0, image.width(), image.height());
  const dst = Skia.XYWHRect(0, 0, SAMPLE, SAMPLE);
  canvas.drawImageRect(image, src, dst, Skia.Paint());
  surface.flush();
  const snapshot = surface.makeImageSnapshot();
  const data = snapshot.readPixels(0, 0, {
    width: SAMPLE,
    height: SAMPLE,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  return data instanceof Uint8Array ? data : null;
}

function parse(hex: string): Rgba {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 };
}

function colorDistance(a: Rgba, b: Rgba): number {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}
