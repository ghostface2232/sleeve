import { type SkRuntimeEffect, Skia } from '@shopify/react-native-skia';

import { toVec4 } from '../color/color';
import type { BackgroundSpec, PatternKind } from '../presets/types';

// A single SkSL shader draws all background patterns; `kind` selects which.
// Used as a fill shader on the background rect, not as a post effect.
const PATTERN = `
uniform float2 resolution;
uniform float kind;     // 0 stripes, 1 dots, 2 grid, 3 checker
uniform float scale;    // feature size in px
uniform float angle;    // radians
uniform float4 color;   // foreground
uniform float4 bg;      // background

half4 main(float2 xy) {
  float2 c = xy - resolution * 0.5;
  float s = sin(angle), co = cos(angle);
  float2 r = float2(c.x * co - c.y * s, c.x * s + c.y * co);
  float t = 0.0;
  if (kind < 0.5) {
    t = step(0.5, fract(r.x / scale));
  } else if (kind < 1.5) {
    float2 g = fract(r / scale) - 0.5;
    t = 1.0 - smoothstep(0.24, 0.30, length(g));
  } else if (kind < 2.5) {
    float2 g = abs(fract(r / scale) - 0.5);
    t = 1.0 - smoothstep(0.04, 0.06, min(g.x, g.y));
  } else {
    float2 g = floor(r / scale);
    t = mod(g.x + g.y, 2.0);
  }
  return half4(mix(bg, color, t));
}`;

const KIND_INDEX: Record<PatternKind, number> = { stripes: 0, dots: 1, grid: 2, checker: 3 };

let cached: SkRuntimeEffect | null = null;

export function getPatternEffect(): SkRuntimeEffect {
  if (cached) return cached;
  const effect = Skia.RuntimeEffect.Make(PATTERN);
  if (!effect) throw new Error('Sleeve: failed to compile pattern shader');
  cached = effect;
  return effect;
}

export type PatternUniforms = {
  resolution: number[];
  kind: number;
  scale: number;
  angle: number;
  color: number[];
  bg: number[];
};

export function patternUniforms(
  spec: Extract<BackgroundSpec, { kind: 'pattern' }>,
  width: number,
  height: number,
): PatternUniforms {
  return {
    resolution: [width, height],
    kind: KIND_INDEX[spec.pattern],
    scale: Math.max(2, spec.scaleRatio * width),
    angle: (spec.angle * Math.PI) / 180,
    color: toVec4(spec.color),
    bg: toVec4(spec.background),
  };
}
