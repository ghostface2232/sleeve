export type CanvasFormat = 'story' | 'square';

export type CanvasSize = { width: number; height: number };

export type FontRole = 'sans' | 'serif' | 'mono';

export type Box = { x: number; y: number; width: number; height: number };

export type BackgroundLayer =
  | { kind: 'solid'; color: string }
  | { kind: 'linear-gradient'; colors: string[]; angle: number };

export type CoverLayer = {
  box: Box;
  cornerRadius: number;
  shadow: { dy: number; blur: number; color: string } | null;
};

export type TextStyle = {
  role: FontRole;
  size: number;
  color: string;
  align: 'left' | 'center' | 'right';
  weight: 400 | 600 | 700;
  maxLines: number;
};

export type TextLayer = { box: Box; style: TextStyle };

// Five-axis preset is for later. For now a Composition just holds the layer
// rects + styles produced by `defaultComposition()`.
export type Composition = {
  format: CanvasFormat;
  size: CanvasSize;
  background: BackgroundLayer;
  cover: CoverLayer;
  title: TextLayer;
  artist: TextLayer;
  meta: TextLayer;
};

export type FontFamilies = Record<FontRole, string>;
