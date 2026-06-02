import { Anton_400Regular } from '@expo-google-fonts/anton';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
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
  Anton: [Anton_400Regular].map(normalize),
  PressStart2P: [PressStart2P_400Regular].map(normalize),
  VT323: [VT323_400Regular].map(normalize),
} as unknown as Record<string, number[]>;

// Role → family. A preset's typography axis overrides any subset of these via
// `TypographySpec.families`; the resolver merges its map onto this default.
export const DEFAULT_FAMILIES: FontFamilies = {
  sans: 'Inter',
  serif: 'PlayfairDisplay',
  mono: 'JetBrainsMono',
  display: 'Anton',
  pixel: 'PressStart2P',
  terminal: 'VT323',
};
