export type CanvasFormat = 'story' | 'square';

export type CanvasSize = { width: number; height: number };

// Role → concrete font family is resolved through the typography axis. Adding a
// role here means adding it to `FontFamilies` and `FONT_ASSETS`.
export type FontRole = 'sans' | 'serif' | 'mono' | 'display' | 'pixel' | 'terminal';

export type FontFamilies = Record<FontRole, string>;

export type Box = { x: number; y: number; width: number; height: number };

export type TextAlignH = 'left' | 'center' | 'right';

// A fully-resolved text style: every number is already in canvas pixels for the
// current `baseWidth`. The typography axis produces this from ratios.
export type TextStyle = {
  role: FontRole;
  size: number;
  color: string;
  align: TextAlignH;
  weight: 400 | 600 | 700;
  letterSpacing: number;
  transform: 'none' | 'upper';
  maxLines: number;
};

export type Shadow = { dx: number; dy: number; blur: number; color: string };

export type Border = { width: number; color: string };

// The cover is a locked layer (see AGENTS.md): never cropped or overlaid. The
// frame axis only decorates its edges.
export type CoverLayer = {
  box: Box;
  cornerRadius: number;
  shadow: Shadow | null;
  border: Border | null;
};
