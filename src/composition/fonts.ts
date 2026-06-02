import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { Platform } from 'react-native';

import type { FontFamilies } from './types';

// Metro on web returns TTF requires as bare URL strings, but Skia's
// `Platform.resolveAsset()` only handles { uri } / { default } / number.
// Wrap strings into the MetroAsset shape so resolveAsset hits the .uri branch
// instead of crashing on `'uri' in '<string>'`.
const normalize = (mod: unknown): unknown =>
  Platform.OS === 'web' && typeof mod === 'string' ? { uri: mod } : mod;

// Cast to the loose shape useFonts expects; we know our runtime values
// satisfy one of its DataModule variants per platform.
export const FONT_ASSETS = {
  Inter: [Inter_400Regular, Inter_700Bold].map(normalize),
  PlayfairDisplay: [PlayfairDisplay_400Regular].map(normalize),
  JetBrainsMono: [JetBrainsMono_400Regular].map(normalize),
} as unknown as Record<string, number[]>;

// Role → family. Swap by passing a different `families` prop to TrackComposition
// (future presets will produce this map as part of their "type" axis).
export const DEFAULT_FAMILIES: FontFamilies = {
  sans: 'Inter',
  serif: 'PlayfairDisplay',
  mono: 'JetBrainsMono',
};
