import type { AestheticPreset } from './types';

// Each preset is one data object = one combination of the five axes (layout,
// typography, frame, background, effects). Adding an aesthetic = appending one
// object here + listing it in PRESETS. The exact colors / fonts / numbers are
// first-pass drafts meant to set each direction; tune them freely.

// iOS — clean sans, generous margins, soft shadow, minimal.
const ios: AestheticPreset = {
  id: 'ios',
  name: 'iOS',
  description: '깔끔한 산세리프 · 넉넉한 여백 · 부드러운 그림자',
  layout: {
    coverScale: 0.78,
    coverAlign: 'center',
    coverYRatio: 0.2,
    padXRatio: 0.09,
    textAlign: 'center',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.07,
    lineGapRatio: 0.022,
  },
  typography: {
    title: { role: 'sans', sizeRatio: 0.072, weight: 700, color: '#1D1D1F', letterSpacingRatio: -0.001, transform: 'none', maxLines: 2 },
    artist: { role: 'sans', sizeRatio: 0.044, weight: 400, color: '#6E6E73', letterSpacingRatio: 0, transform: 'none', maxLines: 1 },
    meta: { role: 'sans', sizeRatio: 0.032, weight: 400, color: '#8E8E93', letterSpacingRatio: 0, transform: 'none', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0.045,
    coverShadow: { dxRatio: 0, dyRatio: 0.02, blurRatio: 0.06, color: '#0000002E' },
    coverBorder: null,
    canvasBorder: null,
    caption: null,
  },
  background: { kind: 'solid', color: '#F5F5F7' },
  effects: { effects: [], coverPolicy: 'include' },
};

// Kitsch — oversaturated color, decoration, high-contrast clash.
const kitsch: AestheticPreset = {
  id: 'kitsch',
  name: 'Kitsch',
  description: '과포화 색 · 장식 · 강한 대비',
  layout: {
    coverScale: 0.7,
    coverAlign: 'center',
    coverYRatio: 0.24,
    padXRatio: 0.08,
    textAlign: 'center',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.06,
    lineGapRatio: 0.02,
  },
  typography: {
    title: { role: 'display', sizeRatio: 0.088, weight: 700, color: '#FFEB00', letterSpacingRatio: 0.002, transform: 'upper', maxLines: 2 },
    artist: { role: 'sans', sizeRatio: 0.05, weight: 700, color: '#00E5FF', letterSpacingRatio: 0, transform: 'none', maxLines: 1 },
    meta: { role: 'sans', sizeRatio: 0.034, weight: 700, color: '#FF2D95', letterSpacingRatio: 0, transform: 'upper', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0.02,
    coverShadow: { dxRatio: 0, dyRatio: 0.015, blurRatio: 0.02, color: '#FF00AA88' },
    coverBorder: { widthRatio: 0.01, color: '#FF2D95' },
    canvasBorder: { widthRatio: 0.012, color: '#00E5FF', insetRatio: 0.03 },
    caption: null,
  },
  background: { kind: 'pattern', pattern: 'stripes', color: '#FF2D95', background: '#7B00FF', scaleRatio: 0.06, angle: 45 },
  effects: { effects: [{ kind: 'halftone', intensity: 0.22 }], coverPolicy: 'exclude' },
};

// Film — grain shader, warm cast, monospace date-stamp label.
const film: AestheticPreset = {
  id: 'film',
  name: 'Film',
  description: '필름 그레인 · 따뜻한 색조 · 날짜 스탬프 라벨',
  layout: {
    coverScale: 0.76,
    coverAlign: 'center',
    coverYRatio: 0.18,
    padXRatio: 0.09,
    textAlign: 'left',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.06,
    lineGapRatio: 0.018,
  },
  typography: {
    title: { role: 'sans', sizeRatio: 0.06, weight: 600, color: '#F4E9D8', letterSpacingRatio: 0, transform: 'none', maxLines: 2 },
    artist: { role: 'sans', sizeRatio: 0.04, weight: 400, color: '#C9B79C', letterSpacingRatio: 0, transform: 'none', maxLines: 1 },
    meta: { role: 'mono', sizeRatio: 0.03, weight: 400, color: '#E8A04B', letterSpacingRatio: 0.003, transform: 'upper', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0.01,
    coverShadow: null,
    coverBorder: { widthRatio: 0.006, color: '#1A1209' },
    canvasBorder: null,
    caption: null,
  },
  background: { kind: 'solid', color: '#2B2118' },
  effects: { effects: [{ kind: 'grain', intensity: 0.6 }], coverPolicy: 'include' },
};

// Pixel art — pixelate shader, bitmap font, limited palette.
const pixelArt: AestheticPreset = {
  id: 'pixel-art',
  name: 'Pixel Art',
  description: '픽셀화 셰이더 · 비트맵 폰트 · 제한 팔레트',
  layout: {
    coverScale: 0.66,
    coverAlign: 'center',
    coverYRatio: 0.2,
    padXRatio: 0.08,
    textAlign: 'center',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.06,
    lineGapRatio: 0.03,
  },
  typography: {
    title: { role: 'pixel', sizeRatio: 0.034, weight: 400, color: '#FFFFFF', letterSpacingRatio: 0, transform: 'upper', maxLines: 2 },
    artist: { role: 'pixel', sizeRatio: 0.022, weight: 400, color: '#41EAD4', letterSpacingRatio: 0, transform: 'upper', maxLines: 1 },
    meta: { role: 'pixel', sizeRatio: 0.016, weight: 400, color: '#FFD800', letterSpacingRatio: 0, transform: 'upper', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0,
    coverShadow: null,
    coverBorder: { widthRatio: 0.01, color: '#FFFFFF' },
    canvasBorder: { widthRatio: 0.01, color: '#FFFFFF', insetRatio: 0.03 },
    caption: null,
  },
  background: { kind: 'solid', color: '#1A1C2C' },
  effects: { effects: [{ kind: 'pixelate', intensity: 0.5 }], coverPolicy: 'include' },
};

// Pop art — halftone shader, bold outline, primary colors.
const popArt: AestheticPreset = {
  id: 'pop-art',
  name: 'Pop Art',
  description: '하프톤 셰이더 · 굵은 외곽선 · 원색',
  layout: {
    coverScale: 0.7,
    coverAlign: 'center',
    coverYRatio: 0.2,
    padXRatio: 0.07,
    textAlign: 'center',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.05,
    lineGapRatio: 0.018,
  },
  typography: {
    title: { role: 'display', sizeRatio: 0.092, weight: 700, color: '#FFFFFF', letterSpacingRatio: 0, transform: 'upper', maxLines: 2 },
    artist: { role: 'display', sizeRatio: 0.05, weight: 700, color: '#FFE600', letterSpacingRatio: 0, transform: 'upper', maxLines: 1 },
    meta: { role: 'sans', sizeRatio: 0.034, weight: 700, color: '#FFFFFF', letterSpacingRatio: 0, transform: 'upper', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0.015,
    coverShadow: null,
    coverBorder: { widthRatio: 0.014, color: '#000000' },
    canvasBorder: { widthRatio: 0.02, color: '#000000', insetRatio: 0.025 },
    caption: null,
  },
  background: { kind: 'pattern', pattern: 'dots', color: '#FFE600', background: '#E50914', scaleRatio: 0.05, angle: 0 },
  effects: { effects: [{ kind: 'halftone', intensity: 0.45 }], coverPolicy: 'exclude' },
};

// Brutalism — undecorated, oversized sans, monochrome, raw grid.
const brutalism: AestheticPreset = {
  id: 'brutalism',
  name: 'Brutalism',
  description: '무장식 · 큰 산세리프 · 흑백 · 거친 그리드',
  layout: {
    coverScale: 0.82,
    coverAlign: 'left',
    coverYRatio: 0.12,
    padXRatio: 0.06,
    textAlign: 'left',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.05,
    lineGapRatio: 0.004,
  },
  typography: {
    title: { role: 'display', sizeRatio: 0.11, weight: 700, color: '#000000', letterSpacingRatio: -0.002, transform: 'upper', maxLines: 3 },
    artist: { role: 'sans', sizeRatio: 0.045, weight: 700, color: '#000000', letterSpacingRatio: 0, transform: 'upper', maxLines: 1 },
    meta: { role: 'mono', sizeRatio: 0.03, weight: 400, color: '#000000', letterSpacingRatio: 0, transform: 'upper', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0,
    coverShadow: null,
    coverBorder: { widthRatio: 0.008, color: '#000000' },
    canvasBorder: { widthRatio: 0.014, color: '#000000', insetRatio: 0 },
    caption: null,
  },
  background: { kind: 'solid', color: '#FFFFFF' },
  effects: { effects: [], coverPolicy: 'include' },
};

// Glitch — glitch + chromatic shaders, digital noise.
const glitch: AestheticPreset = {
  id: 'glitch',
  name: 'Glitch',
  description: '글리치 · 색수차 · 디지털 노이즈',
  layout: {
    coverScale: 0.74,
    coverAlign: 'center',
    coverYRatio: 0.2,
    padXRatio: 0.08,
    textAlign: 'center',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.06,
    lineGapRatio: 0.02,
  },
  typography: {
    title: { role: 'terminal', sizeRatio: 0.072, weight: 400, color: '#00FFD0', letterSpacingRatio: 0.003, transform: 'upper', maxLines: 2 },
    artist: { role: 'terminal', sizeRatio: 0.046, weight: 400, color: '#FF00A0', letterSpacingRatio: 0.002, transform: 'upper', maxLines: 1 },
    meta: { role: 'terminal', sizeRatio: 0.032, weight: 400, color: '#7CFF00', letterSpacingRatio: 0.002, transform: 'upper', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0.01,
    coverShadow: null,
    coverBorder: { widthRatio: 0.006, color: '#00FFD0' },
    canvasBorder: null,
    caption: null,
  },
  background: { kind: 'solid', color: '#07080D' },
  effects: {
    effects: [
      { kind: 'glitch', intensity: 0.5 },
      { kind: 'chromatic', intensity: 0.35 },
      { kind: 'grain', intensity: 0.2 },
    ],
    coverPolicy: 'include',
  },
};

// macOS 9 — classic Mac gray, pixel shadow, striped titlebar caption.
const macOS9: AestheticPreset = {
  id: 'macos9',
  name: 'macOS 9',
  description: '클래식 맥 회색 베젤 · 픽셀 그림자 · 시스템 폰트',
  layout: {
    coverScale: 0.62,
    coverAlign: 'center',
    coverYRatio: 0.24,
    padXRatio: 0.1,
    textAlign: 'left',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.05,
    lineGapRatio: 0.016,
  },
  typography: {
    title: { role: 'sans', sizeRatio: 0.05, weight: 700, color: '#000000', letterSpacingRatio: 0, transform: 'none', maxLines: 2 },
    artist: { role: 'sans', sizeRatio: 0.036, weight: 400, color: '#333333', letterSpacingRatio: 0, transform: 'none', maxLines: 1 },
    meta: { role: 'sans', sizeRatio: 0.028, weight: 400, color: '#555555', letterSpacingRatio: 0, transform: 'none', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0,
    coverShadow: { dxRatio: 0.006, dyRatio: 0.006, blurRatio: 0, color: '#00000055' },
    coverBorder: { widthRatio: 0.004, color: '#000000' },
    canvasBorder: { widthRatio: 0.016, color: '#DDDDDD', insetRatio: 0.02 },
    caption: {
      source: 'title',
      bevel: 'mac9',
      barColor: '#CCCCCC',
      textColor: '#000000',
      accentColor: '#8A8A8A',
      heightRatio: 0.05,
      role: 'sans',
      sizeRatio: 0.028,
    },
  },
  background: { kind: 'solid', color: '#9A9A9A' },
  effects: { effects: [], coverPolicy: 'include' },
};

// Windows 98 — gray panel, 3D beveled edges, navy titlebar caption.
const windows98: AestheticPreset = {
  id: 'windows98',
  name: 'Windows 98',
  description: '회색 패널 · 입체 버튼 테두리 · 타이틀바 캡션',
  layout: {
    coverScale: 0.6,
    coverAlign: 'center',
    coverYRatio: 0.26,
    padXRatio: 0.1,
    textAlign: 'left',
    textOrder: ['title', 'artist', 'meta'],
    textTopGapRatio: 0.05,
    lineGapRatio: 0.016,
  },
  typography: {
    title: { role: 'sans', sizeRatio: 0.046, weight: 700, color: '#000000', letterSpacingRatio: 0, transform: 'none', maxLines: 2 },
    artist: { role: 'sans', sizeRatio: 0.034, weight: 400, color: '#000000', letterSpacingRatio: 0, transform: 'none', maxLines: 1 },
    meta: { role: 'sans', sizeRatio: 0.028, weight: 400, color: '#000000', letterSpacingRatio: 0, transform: 'none', maxLines: 1 },
  },
  frame: {
    coverRadiusRatio: 0,
    coverShadow: null,
    coverBorder: { widthRatio: 0.006, color: '#000000' },
    canvasBorder: { widthRatio: 0.016, color: '#C0C0C0', insetRatio: 0 },
    caption: {
      source: 'title',
      bevel: 'win98',
      barColor: '#000080',
      textColor: '#FFFFFF',
      accentColor: '#1084D0',
      heightRatio: 0.055,
      role: 'sans',
      sizeRatio: 0.03,
    },
  },
  background: { kind: 'solid', color: '#C0C0C0' },
  effects: { effects: [], coverPolicy: 'include' },
};

export const PRESETS: Record<string, AestheticPreset> = {
  ios,
  kitsch,
  film,
  'pixel-art': pixelArt,
  'pop-art': popArt,
  brutalism,
  glitch,
  macos9: macOS9,
  windows98,
};

// Stable display order for pickers.
export const PRESET_LIST: AestheticPreset[] = [
  ios,
  kitsch,
  film,
  pixelArt,
  popArt,
  brutalism,
  glitch,
  macOS9,
  windows98,
];

export const DEFAULT_PRESET_ID = 'ios';
