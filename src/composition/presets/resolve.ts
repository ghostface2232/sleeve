import { DEFAULT_FAMILIES } from '../fonts';
import { canvasSize } from '../layout';
import type { Border, Box, CanvasFormat, CanvasSize, CoverLayer, FontFamilies, Shadow, TextStyle } from '../types';
import type {
  AestheticPreset,
  BackgroundSpec,
  EffectsSpec,
  FrameSpec,
  PresetOverrides,
  TextKey,
  TypeRamp,
} from './types';

// The renderer consumes this — every value is in canvas pixels for the current
// baseWidth. `background` stays a spec because "cover-colors" needs the decoded
// image, which only exists at render time.
export type ResolvedCaption = {
  box: Box;
  barColor: string;
  textColor: string;
  accentColor: string;
  bevel: 'win98' | 'mac9' | 'flat';
  source: 'title' | 'fixed';
  fixedText: string;
  style: TextStyle;
};

export type ResolvedComposition = {
  format: CanvasFormat;
  size: CanvasSize;
  families: FontFamilies;
  background: BackgroundSpec;
  cover: CoverLayer;
  textBlock: {
    x: number;
    width: number;
    startY: number;
    lineGap: number;
    order: TextKey[];
    styles: Record<TextKey, TextStyle>;
  };
  caption: ResolvedCaption | null;
  canvasBorder: (Border & { inset: number }) | null;
  effects: EffectsSpec;
};

export function resolveComposition(
  preset: AestheticPreset,
  format: CanvasFormat,
  baseWidth: number,
  overrides?: PresetOverrides,
): ResolvedComposition {
  const p = mergePreset(preset, overrides);
  const size = canvasSize(format, baseWidth);
  const w = size.width;
  const families: FontFamilies = { ...DEFAULT_FAMILIES, ...p.typography.families };

  const { layout, frame } = p;
  const padX = layout.padXRatio * w;
  const coverWidth = layout.coverScale * w;
  const coverX =
    layout.coverAlign === 'left'
      ? padX
      : layout.coverAlign === 'right'
        ? w - padX - coverWidth
        : (w - coverWidth) / 2;
  const coverY = layout.coverYRatio * size.height;

  const cover: CoverLayer = {
    box: { x: coverX, y: coverY, width: coverWidth, height: coverWidth },
    cornerRadius: coverWidth * frame.coverRadiusRatio,
    shadow: resolveShadow(frame.coverShadow, w),
    border: resolveBorder(frame.coverBorder, w),
  };

  const ramp = (r: TypeRamp): TextStyle => ({
    role: r.role,
    size: r.sizeRatio * w,
    color: r.color,
    align: layout.textAlign,
    weight: r.weight,
    letterSpacing: r.letterSpacingRatio * w,
    transform: r.transform,
    maxLines: r.maxLines,
  });

  const canvasBorder = frame.canvasBorder
    ? { width: frame.canvasBorder.widthRatio * w, color: frame.canvasBorder.color, inset: frame.canvasBorder.insetRatio * w }
    : null;

  return {
    format,
    size,
    families,
    background: p.background,
    cover,
    textBlock: {
      x: padX,
      width: w - padX * 2,
      startY: coverY + coverWidth + layout.textTopGapRatio * w,
      lineGap: layout.lineGapRatio * w,
      order: layout.textOrder,
      styles: { title: ramp(p.typography.title), artist: ramp(p.typography.artist), meta: ramp(p.typography.meta) },
    },
    caption: resolveCaption(frame, w, canvasBorder),
    canvasBorder,
    effects: p.effects,
  };
}

function resolveCaption(
  frame: FrameSpec,
  w: number,
  canvasBorder: (Border & { inset: number }) | null,
): ResolvedCaption | null {
  const c = frame.caption;
  if (!c) return null;
  const inset = canvasBorder ? canvasBorder.inset + canvasBorder.width : 0;
  const height = c.heightRatio * w;
  return {
    box: { x: inset, y: inset, width: w - inset * 2, height },
    barColor: c.barColor,
    textColor: c.textColor,
    accentColor: c.accentColor ?? c.barColor,
    bevel: c.bevel,
    source: c.source,
    fixedText: c.text ?? '',
    style: {
      role: c.role,
      size: c.sizeRatio * w,
      color: c.textColor,
      align: 'left',
      weight: 600,
      letterSpacing: 0,
      transform: 'none',
      maxLines: 1,
    },
  };
}

function resolveShadow(s: FrameSpec['coverShadow'], w: number): Shadow | null {
  return s ? { dx: s.dxRatio * w, dy: s.dyRatio * w, blur: s.blurRatio * w, color: s.color } : null;
}

function resolveBorder(b: FrameSpec['coverBorder'], w: number): Border | null {
  return b ? { width: b.widthRatio * w, color: b.color } : null;
}

// ── Per-axis override merge. A picked preset stays editable: the user can nudge
// any axis without redefining the rest. `background` is a tagged union, so it is
// swapped whole rather than deep-merged.
export function mergePreset(p: AestheticPreset, o?: PresetOverrides): AestheticPreset {
  if (!o) return p;
  return {
    ...p,
    layout: { ...p.layout, ...o.layout },
    typography: {
      families: { ...p.typography.families, ...o.typography?.families },
      title: { ...p.typography.title, ...o.typography?.title },
      artist: { ...p.typography.artist, ...o.typography?.artist },
      meta: { ...p.typography.meta, ...o.typography?.meta },
    },
    frame: mergeFrame(p.frame, o.frame),
    background: o.background ?? p.background,
    effects: o.effects ? { ...p.effects, ...o.effects } : p.effects,
  };
}

function mergeFrame(base: FrameSpec, ov?: PresetOverrides['frame']): FrameSpec {
  if (!ov) return base;
  return {
    coverRadiusRatio: ov.coverRadiusRatio ?? base.coverRadiusRatio,
    coverShadow: mergeNullable(base.coverShadow, ov.coverShadow),
    coverBorder: mergeNullable(base.coverBorder, ov.coverBorder),
    canvasBorder: mergeNullable(base.canvasBorder, ov.canvasBorder),
    caption: mergeNullable(base.caption, ov.caption),
  };
}

// undefined → keep base, null → clear, object → shallow-merge onto base.
function mergeNullable<T>(base: T | null, ov: unknown): T | null {
  if (ov === undefined) return base;
  if (ov === null) return null;
  return { ...(base ?? {}), ...(ov as object) } as T;
}
