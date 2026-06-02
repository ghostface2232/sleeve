import { type SkParagraph, Skia, type SkTypefaceFontProvider, TextAlign } from '@shopify/react-native-skia';

import type { FontFamilies, TextStyle } from './types';

// Build + layout a single-style paragraph. `maxLines` + ellipsis is our overflow
// strategy: a long title wraps to two lines; anything past that gets a trailing
// "…". Width is required up front because Paragraph.layout() is destructive
// and we want the resulting `.getHeight()` available immediately.
export function buildParagraph(
  text: string,
  style: TextStyle,
  families: FontFamilies,
  fontMgr: SkTypefaceFontProvider,
  width: number,
): SkParagraph {
  const family = families[style.role];
  const para = Skia.ParagraphBuilder.Make(
    {
      textAlign: alignToSkia(style.align),
      maxLines: style.maxLines,
      ellipsis: '…',
    },
    fontMgr,
  )
    .pushStyle({
      color: Skia.Color(style.color),
      fontFamilies: [family],
      fontSize: style.size,
      fontStyle: { weight: style.weight },
    })
    .addText(text.length > 0 ? text : ' ')
    .build();
  para.layout(width);
  return para;
}

function alignToSkia(align: TextStyle['align']): TextAlign {
  switch (align) {
    case 'center':
      return TextAlign.Center;
    case 'right':
      return TextAlign.Right;
    default:
      return TextAlign.Left;
  }
}
