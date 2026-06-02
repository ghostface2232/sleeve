import { type SkRuntimeEffect, Skia } from '@shopify/react-native-skia';

import type { EffectKind, EffectSpec } from '../presets/types';

// Each post effect is a standalone SkSL runtime shader. The scene being effected
// is exposed through the `image` child shader; every effect takes a normalized
// `intensity` (0..1) and the canvas `resolution` in pixels. Effects compose by
// nesting: each shader samples the previous one as its `image` child.
//
// We deliberately apply effects as child-shaders over a snapshot of the scene
// (not as an ImageFilter on a Group layer): `ImageFilter.MakeRuntimeShader` is
// not implemented on React Native Web, whereas runtime shaders with children
// work on every platform.

const GRAIN = `
uniform shader image;
uniform float2 resolution;
uniform float intensity;
uniform float seed;

float hash(float2 p) {
  p = fract(p * float2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

half4 main(float2 xy) {
  half4 c = image.eval(xy);
  float g = hash(xy + seed) - 0.5;
  float lum = dot(c.rgb, half3(0.299, 0.587, 0.114));
  // Shadows take more grain than highlights, like real film stock.
  float amt = intensity * 0.35 * mix(1.0, 0.55, lum);
  c.rgb = saturate(c.rgb + half3(g * amt));
  return c;
}`;

const PIXELATE = `
uniform shader image;
uniform float2 resolution;
uniform float intensity;

half4 main(float2 xy) {
  float cell = mix(1.0, 40.0, intensity);
  float2 uv = (floor(xy / cell) + 0.5) * cell;
  return image.eval(uv);
}`;

const CHROMATIC = `
uniform shader image;
uniform float2 resolution;
uniform float intensity;

half4 main(float2 xy) {
  float2 dir = (xy - resolution * 0.5) / max(resolution.x, resolution.y);
  float2 off = dir * intensity * 40.0;
  half4 base = image.eval(xy);
  half r = image.eval(xy + off).r;
  half b = image.eval(xy - off).b;
  return half4(r, base.g, b, base.a);
}`;

const HALFTONE = `
uniform shader image;
uniform float2 resolution;
uniform float intensity;

half4 main(float2 xy) {
  float cell = mix(3.0, 14.0, intensity);
  float2 center = (floor(xy / cell) + 0.5) * cell;
  half4 c = image.eval(center);
  float lum = dot(c.rgb, half3(0.299, 0.587, 0.114));
  float2 local = (xy - center) / cell;
  float d = length(local) * 2.0;
  float radius = sqrt(clamp(1.0 - lum, 0.0, 1.0));
  float mask = smoothstep(radius + 0.06, radius - 0.06, d);
  half3 dotted = mix(half3(1.0), c.rgb, half(mask));
  return half4(mix(c.rgb, dotted, half(intensity)), c.a);
}`;

const GLITCH = `
uniform shader image;
uniform float2 resolution;
uniform float intensity;
uniform float seed;

float hash(float n) { return fract(sin(n * 12.9898 + seed) * 43758.5453); }

half4 main(float2 xy) {
  // Horizontal tearing: rows shift by band.
  float band = floor(xy.y / 28.0);
  float jitter = (hash(band) - 0.5) * intensity * 80.0;
  float2 p = float2(xy.x + jitter, xy.y);

  // RGB channel separation.
  float split = intensity * 14.0;
  half r = image.eval(p + float2(split, 0.0)).r;
  half g = image.eval(p).g;
  half b = image.eval(p - float2(split, 0.0)).b;
  half a = image.eval(p).a;
  half4 c = half4(r, g, b, a);

  // CRT scanlines.
  float scan = 0.5 + 0.5 * sin(xy.y * 3.14159);
  c.rgb *= half(1.0 - intensity * 0.3 * (1.0 - scan));
  return c;
}`;

const SOURCES: Record<EffectKind, string> = {
  grain: GRAIN,
  glitch: GLITCH,
  pixelate: PIXELATE,
  halftone: HALFTONE,
  chromatic: CHROMATIC,
};

const USES_SEED: Record<EffectKind, boolean> = {
  grain: true,
  glitch: true,
  pixelate: false,
  halftone: false,
  chromatic: false,
};

// Compile lazily + cache. Lazy so compilation only happens once Skia is bound
// (this module is reached through TrackComposition, which web defers until
// CanvasKit is ready).
const cache: Partial<Record<EffectKind, SkRuntimeEffect>> = {};

export function getEffectRuntime(kind: EffectKind): SkRuntimeEffect {
  const cached = cache[kind];
  if (cached) return cached;
  const effect = Skia.RuntimeEffect.Make(SOURCES[kind]);
  if (!effect) throw new Error(`Sleeve: failed to compile '${kind}' shader`);
  cache[kind] = effect;
  return effect;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Effects whose intensity is effectively zero are dropped so the renderer can
// skip the snapshot entirely when nothing is active.
export function activeEffects(effects: EffectSpec[]): EffectSpec[] {
  return effects.filter((e) => clamp01(e.intensity) > 0);
}

// Non-shader uniforms for a single effect, keyed by SkSL uniform name. The
// `image` child shader is supplied separately (declarative <Shader> child).
export function effectUniforms(
  spec: EffectSpec,
  width: number,
  height: number,
  seed: number,
): Record<string, number | number[]> {
  const uniforms: Record<string, number | number[]> = {
    resolution: [width, height],
    intensity: clamp01(spec.intensity),
  };
  if (USES_SEED[spec.kind]) uniforms.seed = seed;
  return uniforms;
}
