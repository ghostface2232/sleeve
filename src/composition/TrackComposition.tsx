import {
  BlurMask,
  Canvas,
  Group,
  Image as SkiaImage,
  Paragraph,
  Rect,
  RoundedRect,
  Skia,
  useFonts,
  useImage,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';

import type { Track } from '@/data/types';

import { DEFAULT_FAMILIES, FONT_ASSETS } from './fonts';
import { defaultComposition } from './layout';
import { buildParagraph } from './paragraph';
import type { CanvasFormat, FontFamilies } from './types';

export type TrackCompositionProps = {
  track: Track;
  format: CanvasFormat;
  displayWidth: number;
  families?: FontFamilies;
};

export default function TrackComposition({
  track,
  format,
  displayWidth,
  families = DEFAULT_FAMILIES,
}: TrackCompositionProps) {
  const fontMgr = useFonts(FONT_ASSETS);
  const coverImage = useImage(track.coverUrl);

  const composition = useMemo(
    () => defaultComposition(format, displayWidth),
    [format, displayWidth],
  );

  // Build paragraphs once per change. Layout the title first so artist/meta
  // can stack against its measured height — a 2-line title pushes them down.
  const paragraphs = useMemo(() => {
    if (!fontMgr) return null;
    const u = displayWidth / 1080;

    const title = buildParagraph(
      track.title,
      composition.title.style,
      families,
      fontMgr,
      composition.title.box.width,
    );
    const artist = buildParagraph(
      track.artist,
      composition.artist.style,
      families,
      fontMgr,
      composition.artist.box.width,
    );
    const metaText = [track.album, track.releaseYear].filter(Boolean).join(' · ');
    const meta = buildParagraph(
      metaText,
      composition.meta.style,
      families,
      fontMgr,
      composition.meta.box.width,
    );

    const titleY = composition.title.box.y;
    const artistY = titleY + title.getHeight() + 24 * u;
    const metaY = artistY + artist.getHeight() + 14 * u;

    return {
      title: { para: title, x: composition.title.box.x, y: titleY, width: composition.title.box.width },
      artist: { para: artist, x: composition.artist.box.x, y: artistY, width: composition.artist.box.width },
      meta: { para: meta, x: composition.meta.box.x, y: metaY, width: composition.meta.box.width },
    };
  }, [fontMgr, track, composition, displayWidth, families]);

  const { size, background, cover } = composition;

  const coverClip = useMemo(
    () =>
      Skia.RRectXY(
        Skia.XYWHRect(cover.box.x, cover.box.y, cover.box.width, cover.box.height),
        cover.cornerRadius,
        cover.cornerRadius,
      ),
    [cover],
  );

  const shadowRect = useMemo(() => {
    if (!cover.shadow) return null;
    return Skia.RRectXY(
      Skia.XYWHRect(
        cover.box.x,
        cover.box.y + cover.shadow.dy,
        cover.box.width,
        cover.box.height,
      ),
      cover.cornerRadius,
      cover.cornerRadius,
    );
  }, [cover]);

  const bgColor = background.kind === 'solid' ? background.color : '#000000';

  return (
    <View style={{ width: size.width, height: size.height }}>
      <Canvas style={{ width: size.width, height: size.height }}>
        {/* (a) Background */}
        <Rect x={0} y={0} width={size.width} height={size.height} color={bgColor} />

        {/* (b) Cover — locked layer (shadow + clipped image, never overlaid) */}
        {shadowRect && cover.shadow && (
          <RoundedRect rect={shadowRect} color={cover.shadow.color}>
            <BlurMask blur={cover.shadow.blur} style="normal" />
          </RoundedRect>
        )}
        {!coverImage && <RoundedRect rect={coverClip} color="#1F1F28" />}
        {coverImage && (
          <Group clip={coverClip}>
            <SkiaImage
              image={coverImage}
              x={cover.box.x}
              y={cover.box.y}
              width={cover.box.width}
              height={cover.box.height}
              fit="cover"
            />
          </Group>
        )}

        {/* (c) Text — placed outside the cover region */}
        {paragraphs && (
          <>
            <Paragraph
              paragraph={paragraphs.title.para}
              x={paragraphs.title.x}
              y={paragraphs.title.y}
              width={paragraphs.title.width}
            />
            <Paragraph
              paragraph={paragraphs.artist.para}
              x={paragraphs.artist.x}
              y={paragraphs.artist.y}
              width={paragraphs.artist.width}
            />
            <Paragraph
              paragraph={paragraphs.meta.para}
              x={paragraphs.meta.x}
              y={paragraphs.meta.y}
              width={paragraphs.meta.width}
            />
          </>
        )}

        {/* (d) Frame / labels — none in the default layout */}
      </Canvas>
    </View>
  );
}
