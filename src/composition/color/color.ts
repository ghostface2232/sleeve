// Small color helpers shared by the extraction logic and the shader uniforms.

export type Rgba = { r: number; g: number; b: number; a: number }; // 0..255

export function parseHex(hex: string): Rgba {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 6) h += 'ff';
  const n = parseInt(h, 16) >>> 0;
  return { r: (n >>> 24) & 255, g: (n >>> 16) & 255, b: (n >>> 8) & 255, a: n & 255 };
}

const toHexByte = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

// Normalized [r,g,b,a] in 0..1 — the shape SkSL `float4` uniforms expect.
export function toVec4(hex: string): number[] {
  const { r, g, b, a } = parseHex(hex);
  return [r / 255, g / 255, b / 255, a / 255];
}

export function luminance({ r, g, b }: Rgba): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// HSV saturation — used to rank "how colorful" a swatch is.
export function saturation({ r, g, b }: Rgba): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}
