import type { FontFamilies, FontRole, TextAlignH } from '../types';

// A preset is pure data: a combination of five axis values. Adding a new
// aesthetic means adding one `AestheticPreset` object to the library — no
// renderer changes. Every spatial value is a *ratio* (relative to the canvas
// width, unless noted) so a single resolver reflows it from a 360-wide preview
// to a 1080-wide export.

export type TextKey = 'title' | 'artist' | 'meta';

// ── Axis 1: Layout template (배치 구도) ────────────────────────────────────
export type LayoutSpec = {
  coverScale: number; // cover width / canvas width
  coverAlign: TextAlignH; // horizontal placement of the cover
  coverYRatio: number; // cover top / canvas height
  padXRatio: number; // text block horizontal padding / canvas width
  textAlign: TextAlignH;
  textOrder: TextKey[]; // stacking order of the text lines below the cover
  textTopGapRatio: number; // cover-bottom → first text line / canvas width
  lineGapRatio: number; // gap between stacked text lines / canvas width
};

// ── Axis 2: Typography (폰트 / 위계 / 자간 / 정렬) ─────────────────────────
export type TypeRamp = {
  role: FontRole;
  sizeRatio: number; // font size / canvas width
  weight: 400 | 600 | 700;
  color: string;
  letterSpacingRatio: number; // tracking / canvas width (negative tightens)
  transform: 'none' | 'upper';
  maxLines: number;
};

export type TypographySpec = {
  // Merged onto DEFAULT_FAMILIES, so a preset only lists the roles it changes.
  families?: Partial<FontFamilies>;
  title: TypeRamp;
  artist: TypeRamp;
  meta: TypeRamp;
};

// ── Axis 3: Frame / outline (테두리 / 모서리 / 그림자 / 여백 / 캡션) ───────
export type ShadowSpec = { dxRatio: number; dyRatio: number; blurRatio: number; color: string };
export type BorderSpec = { widthRatio: number; color: string };

export type CaptionSpec = {
  source: 'title' | 'fixed';
  text?: string; // used when source === 'fixed'
  bevel: 'win98' | 'mac9' | 'flat';
  barColor: string;
  textColor: string;
  accentColor?: string; // win98 titlebar gradient end / mac9 pinstripe lines
  heightRatio: number; // bar height / canvas width
  role: FontRole;
  sizeRatio: number;
};

export type FrameSpec = {
  coverRadiusRatio: number; // corner radius / cover width
  coverShadow: ShadowSpec | null;
  coverBorder: BorderSpec | null;
  canvasBorder: (BorderSpec & { insetRatio: number }) | null; // inset / canvas width
  caption: CaptionSpec | null;
};

// ── Axis 4: Background (단색 / 그라데이션 / 커버 추출색 / 패턴) ────────────
export type PatternKind = 'stripes' | 'dots' | 'grid' | 'checker';

export type BackgroundSpec =
  | { kind: 'solid'; color: string }
  | { kind: 'linear-gradient'; colors: string[]; angle: number }
  // Pull representative colors out of the cover and use them as the background.
  | { kind: 'cover-colors'; mode: 'solid' | 'gradient'; angle: number; swatches: number; fallback: string }
  | { kind: 'pattern'; pattern: PatternKind; color: string; background: string; scaleRatio: number; angle: number };

// ── Axis 5: Post-processing shader effects ────────────────────────────────
export type EffectKind = 'grain' | 'glitch' | 'pixelate' | 'halftone' | 'chromatic';

// `intensity` is always 0..1. Extra knobs go in `params` (shader-specific).
export type EffectSpec = { kind: EffectKind; intensity: number; params?: Record<string, number> };

export type CoverPolicy = 'include' | 'exclude';

export type EffectsSpec = {
  effects: EffectSpec[];
  coverPolicy: CoverPolicy; // default 'include' (personal use); 'exclude' keeps the cover pristine
};

// ── The preset ────────────────────────────────────────────────────────────
export type AestheticPreset = {
  id: string;
  name: string;
  description: string;
  layout: LayoutSpec;
  typography: TypographySpec;
  frame: FrameSpec;
  background: BackgroundSpec;
  effects: EffectsSpec;
};

// After picking a preset the user may keep tweaking individual axes. Overrides
// are merged per-axis; `background` is a tagged union so it is replaced whole.
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export type PresetOverrides = {
  layout?: Partial<LayoutSpec>;
  typography?: {
    families?: Partial<FontFamilies>;
    title?: Partial<TypeRamp>;
    artist?: Partial<TypeRamp>;
    meta?: Partial<TypeRamp>;
  };
  frame?: DeepPartial<FrameSpec>;
  background?: BackgroundSpec;
  effects?: Partial<EffectsSpec>;
};
