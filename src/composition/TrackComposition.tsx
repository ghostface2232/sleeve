import {
  BlurMask,
  Canvas,
  drawAsImage,
  Fill,
  Group,
  Image as SkiaImage,
  ImageShader,
  LinearGradient,
  Paragraph,
  Rect,
  RoundedRect,
  Shader,
  Skia,
  type SkImage,
  type SkParagraph,
  useFonts,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import type { Track } from '@/data/types';

import { coverGradientStops, extractCoverColors } from './color/extract';
import { FONT_ASSETS } from './fonts';
import { buildParagraph } from './paragraph';
import { DEFAULT_PRESET_ID, PRESETS } from './presets/library';
import type { ResolvedComposition } from './presets/resolve';
import { resolveComposition } from './presets/resolve';
import type { PresetOverrides } from './presets/types';
import { activeEffects, effectUniforms, getEffectRuntime } from './shaders/effects';
import { getPatternEffect, patternUniforms } from './shaders/patterns';
import type { CanvasFormat, CoverLayer, TextStyle } from './types';

export type TrackCompositionProps = {
  track: Track;
  format: CanvasFormat;
  displayWidth: number;
  presetId?: string;
  // Picked preset stays editable — overrides are merged per axis.
  overrides?: PresetOverrides;
};

type CoverColors = { solid: string | null; gradient: [string, string] | null } | null;

export default function TrackComposition({
  track,
  format,
  displayWidth,
  presetId = DEFAULT_PRESET_ID,
  overrides,
}: TrackCompositionProps) {
  const fontMgr = useFonts(FONT_ASSETS);
  const coverImage = useImage(track.coverUrl);

  const comp = useMemo(() => {
    const preset = PRESETS[presetId] ?? PRESETS[DEFAULT_PRESET_ID];
    return resolveComposition(preset, format, displayWidth, overrides);
  }, [presetId, format, displayWidth, overrides]);

  const { size, cover, textBlock, caption, effects, families, background } = comp;

  // Stacked text: lay out each line in order, advancing by measured height so a
  // 2-line title pushes the rest down.
  const lines = useMemo(() => {
    if (!fontMgr) return null;
    const metaText = [track.album, track.releaseYear].filter(Boolean).join(' · ');
    const text: Record<string, string> = { title: track.title, artist: track.artist, meta: metaText };

    let y = textBlock.startY;
    return textBlock.order.map((key) => {
      const para = buildParagraph(text[key] ?? '', textBlock.styles[key], families, fontMgr, textBlock.width);
      const placed = { para, y };
      y += para.getHeight() + textBlock.lineGap;
      return placed;
    });
  }, [fontMgr, track, textBlock, families]);

  // Cover-extracted background colors (null until the image decodes).
  const coverColors = useMemo<CoverColors>(() => {
    if (background.kind !== 'cover-colors' || !coverImage) return null;
    return { solid: extractCoverColors(coverImage, 1)?.[0] ?? null, gradient: coverGradientStops(coverImage) };
  }, [background, coverImage]);

  const captionPara = useMemo(() => {
    if (!fontMgr || !caption) return null;
    const text = (caption.source === 'fixed' ? caption.fixedText : track.title) || track.title;
    const style: TextStyle = { ...caption.style, align: caption.bevel === 'mac9' ? 'center' : 'left' };
    const pad = caption.box.height * 0.25;
    return buildParagraph(text, style, families, fontMgr, caption.box.width - pad * 2);
  }, [fontMgr, caption, track, families]);

  const coverClip = useMemo(
    () => Skia.RRectXY(rect(cover.box.x, cover.box.y, cover.box.width, cover.box.height), cover.cornerRadius, cover.cornerRadius),
    [cover],
  );

  // A stable per-track seed keeps grain/glitch deterministic across re-renders.
  const seed = useMemo(() => seedFromString(track.title) % 1000, [track.title]);
  const fx = useMemo(() => activeEffects(effects.effects), [effects.effects]);
  const hasFx = fx.length > 0;

  // Post effects run as runtime shaders over a *snapshot* of the scene — the
  // ImageFilter path (Group layer) is unimplemented on web. drawAsImage is
  // async, so the un-effected scene shows until the snapshot resolves.
  // Stale snapshots are ignored: the effected branch only renders when `hasFx`,
  // and any change re-runs this and overwrites the image asynchronously.
  const [sceneImage, setSceneImage] = useState<SkImage | null>(null);
  useEffect(() => {
    if (!hasFx || !fontMgr) return;
    let alive = true;
    drawAsImage(
      <Scene
        comp={comp}
        coverImage={coverImage}
        coverClip={coverClip}
        lines={lines}
        captionPara={captionPara}
        coverColors={coverColors}
      />,
      size,
    ).then((img) => {
      if (alive) setSceneImage(img);
    });
    return () => {
      alive = false;
    };
  }, [hasFx, fontMgr, comp, coverImage, coverClip, lines, captionPara, coverColors, size]);

  return (
    <View style={{ width: size.width, height: size.height }}>
      <Canvas style={{ width: size.width, height: size.height }}>
        {hasFx && sceneImage ? (
          <>
            <Fill>{effectNode(fx, size.width, size.height, seed, sceneImage)}</Fill>
            {/* Exclude mode: repaint the pristine cover over the effected scene */}
            {effects.coverPolicy === 'exclude' && (
              <CoverArt cover={cover} coverImage={coverImage} coverClip={coverClip} withShadow={false} />
            )}
          </>
        ) : (
          <Scene
            comp={comp}
            coverImage={coverImage}
            coverClip={coverClip}
            lines={lines}
            captionPara={captionPara}
            coverColors={coverColors}
          />
        )}
      </Canvas>
    </View>
  );
}

// The full composition minus post effects. Reused for the direct (no-effect)
// render and as the element snapshotted into the effect pipeline.
function Scene({
  comp,
  coverImage,
  coverClip,
  lines,
  captionPara,
  coverColors,
}: {
  comp: ResolvedComposition;
  coverImage: SkImage | null;
  coverClip: ReturnType<typeof Skia.RRectXY>;
  lines: { para: SkParagraph; y: number }[] | null;
  captionPara: SkParagraph | null;
  coverColors: CoverColors;
}) {
  const { size, cover, textBlock, caption, canvasBorder, background } = comp;
  return (
    <Group>
      {/* (a) Background */}
      <Background background={background} size={size} coverColors={coverColors} />

      {/* (b) Cover — locked layer */}
      <CoverArt cover={cover} coverImage={coverImage} coverClip={coverClip} withShadow />

      {/* (c) Text — outside the cover region */}
      {lines?.map((l, i) => (
        <Paragraph key={i} paragraph={l.para} x={textBlock.x} y={l.y} width={textBlock.width} />
      ))}

      {/* (d) Frame: canvas border + caption */}
      {canvasBorder && (
        <Rect
          x={canvasBorder.inset + canvasBorder.width / 2}
          y={canvasBorder.inset + canvasBorder.width / 2}
          width={size.width - (canvasBorder.inset + canvasBorder.width / 2) * 2}
          height={size.height - (canvasBorder.inset + canvasBorder.width / 2) * 2}
          color={canvasBorder.color}
          style="stroke"
          strokeWidth={canvasBorder.width}
        />
      )}
      {caption && <Caption caption={caption} para={captionPara} />}
    </Group>
  );
}

function CoverArt({
  cover,
  coverImage,
  coverClip,
  withShadow,
}: {
  cover: CoverLayer;
  coverImage: SkImage | null;
  coverClip: ReturnType<typeof Skia.RRectXY>;
  withShadow: boolean;
}) {
  return (
    <Group>
      {withShadow && cover.shadow && (
        <RoundedRect
          rect={Skia.RRectXY(
            rect(cover.box.x + cover.shadow.dx, cover.box.y + cover.shadow.dy, cover.box.width, cover.box.height),
            cover.cornerRadius,
            cover.cornerRadius,
          )}
          color={cover.shadow.color}
        >
          {cover.shadow.blur > 0 && <BlurMask blur={cover.shadow.blur} style="normal" />}
        </RoundedRect>
      )}
      {!coverImage && <RoundedRect rect={coverClip} color="#1F1F28" />}
      {coverImage && (
        <Group clip={coverClip}>
          <SkiaImage image={coverImage} x={cover.box.x} y={cover.box.y} width={cover.box.width} height={cover.box.height} fit="cover" />
        </Group>
      )}
      {cover.border && (
        <RoundedRect rect={coverClip} color={cover.border.color} style="stroke" strokeWidth={cover.border.width} />
      )}
    </Group>
  );
}

// Nest the effects so each samples the previous as its `image` child; the first
// effect wraps the scene snapshot, the last ends up outermost.
function effectNode(
  fx: ReturnType<typeof activeEffects>,
  width: number,
  height: number,
  seed: number,
  image: SkImage,
): ReactElement {
  let node: ReactElement = <ImageShader image={image} fit="none" rect={rect(0, 0, width, height)} />;
  fx.forEach((e, i) => {
    node = (
      <Shader key={i} source={getEffectRuntime(e.kind)} uniforms={effectUniforms(e, width, height, seed)}>
        {node}
      </Shader>
    );
  });
  return node;
}

function Background({
  background,
  size,
  coverColors,
}: {
  background: ResolvedComposition['background'];
  size: { width: number; height: number };
  coverColors: CoverColors;
}) {
  if (background.kind === 'solid') {
    return <Rect x={0} y={0} width={size.width} height={size.height} color={background.color} />;
  }

  if (background.kind === 'linear-gradient') {
    const [start, end] = gradientPoints(background.angle, size.width, size.height);
    return (
      <Rect x={0} y={0} width={size.width} height={size.height}>
        <LinearGradient start={start} end={end} colors={background.colors} />
      </Rect>
    );
  }

  if (background.kind === 'pattern') {
    return (
      <Rect x={0} y={0} width={size.width} height={size.height}>
        <Shader source={getPatternEffect()} uniforms={patternUniforms(background, size.width, size.height)} />
      </Rect>
    );
  }

  // cover-colors
  if (background.mode === 'solid') {
    return <Rect x={0} y={0} width={size.width} height={size.height} color={coverColors?.solid ?? background.fallback} />;
  }
  const stops = coverColors?.gradient ?? [background.fallback, background.fallback];
  const [start, end] = gradientPoints(background.angle, size.width, size.height);
  return (
    <Rect x={0} y={0} width={size.width} height={size.height}>
      <LinearGradient start={start} end={end} colors={stops} />
    </Rect>
  );
}

function Caption({ caption, para }: { caption: NonNullable<ResolvedComposition['caption']>; para: SkParagraph | null }) {
  const { box } = caption;
  const pad = box.height * 0.25;
  const bevel = Math.max(1, box.height * 0.06);

  return (
    <Group>
      {/* Bar fill */}
      {caption.bevel === 'win98' ? (
        <Rect x={box.x} y={box.y} width={box.width} height={box.height}>
          <LinearGradient
            start={vec(box.x, box.y)}
            end={vec(box.x + box.width, box.y)}
            colors={[caption.barColor, caption.accentColor]}
          />
        </Rect>
      ) : (
        <Rect x={box.x} y={box.y} width={box.width} height={box.height} color={caption.barColor} />
      )}

      {/* mac9 titlebar pinstripes, cleared behind the centered title */}
      {caption.bevel === 'mac9' &&
        macStripes(box, caption.accentColor).map((s, i) => (
          <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} color={s.color} />
        ))}

      {/* Raised 3D edge for win98/mac9 */}
      {caption.bevel !== 'flat' && (
        <Group>
          <Rect x={box.x} y={box.y} width={box.width} height={bevel} color="#FFFFFF99" />
          <Rect x={box.x} y={box.y} width={bevel} height={box.height} color="#FFFFFF99" />
          <Rect x={box.x} y={box.y + box.height - bevel} width={box.width} height={bevel} color="#00000066" />
          <Rect x={box.x + box.width - bevel} y={box.y} width={bevel} height={box.height} color="#00000066" />
        </Group>
      )}

      {para && (
        <Group clip={rect(box.x + pad, box.y, box.width - pad * 2, box.height)}>
          <Paragraph paragraph={para} x={box.x + pad} y={box.y + (box.height - para.getHeight()) / 2} width={box.width - pad * 2} />
        </Group>
      )}
    </Group>
  );
}

// Horizontal pinstripe lines for a classic Mac titlebar, with a gap left clear
// in the middle for the centered title.
function macStripes(box: { x: number; y: number; width: number; height: number }, color: string) {
  const lines: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const count = 6;
  const step = box.height / (count + 2);
  const titleGap = box.width * 0.4;
  const gapX = box.x + (box.width - titleGap) / 2;
  for (let i = 1; i <= count; i++) {
    const y = box.y + step * (i + 0.5);
    lines.push({ x: box.x + box.width * 0.06, y, w: gapX - (box.x + box.width * 0.06), h: Math.max(1, step * 0.18), color });
    lines.push({ x: gapX + titleGap, y, w: box.x + box.width * 0.94 - (gapX + titleGap), h: Math.max(1, step * 0.18), color });
  }
  return lines;
}

function gradientPoints(angleDeg: number, w: number, h: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const half = Math.max(w, h) / 2;
  const dx = Math.cos(rad) * half;
  const dy = Math.sin(rad) * half;
  return [vec(cx - dx, cy - dy), vec(cx + dx, cy + dy)] as const;
}

function rect(x: number, y: number, w: number, h: number) {
  return Skia.XYWHRect(x, y, w, h);
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
