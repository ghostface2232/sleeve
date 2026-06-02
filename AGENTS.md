# Sleeve

A stateless app that fetches metadata and cover art from a music link, then composes a shareable image styled around the cover. Single codebase for iOS, Android, and web.

## Architecture principles
- No server-side database, no authentication. All state lives on the device.
- Metadata: normalize any incoming link through the Odesli public API to obtain title + artist (and the Apple Music ID when present). Cover resolution cascades — iTunes Lookup by Apple ID first, then iTunes search by title + artist with title+artist verification, then the highest-resolution source-platform thumbnail (Tidal / Pandora / Deezer / Yandex with URL-pattern upscaling) as a last resort.
- On web builds, all external API calls go through a Cloudflare Worker proxy (`EXPO_PUBLIC_API_PROXY`) to avoid CORS. Native builds call the APIs directly. When the env var is empty, web falls back to direct calls.
- Results cache in-memory + AsyncStorage with a 7-day TTL, keyed by the normalized URL.
- All canvas rendering is done with React Native Skia. Only the surrounding UI chrome uses NativeWind.

## Canvas data model rules
- The cover art is a locked layer. Never crop it or place text/logos directly on top of it.
- Variable elements (background, frame, typography, labels, post effects) are applied to the canvas around the cover, not over it.
- Global post-processing effects must keep an option to mask out the cover region, so the cover can be excluded when needed.
- Layer geometry is derived from a single `baseWidth`, so one composition function drives both the on-screen preview and the 1080-wide export.

## Aesthetic preset engine
- A preset is one pure-data object (`src/composition/presets/library.ts`) = a combination of five axes: layout template, typography, frame/outline, background, post-processing effects. Adding an aesthetic is one object + a `PRESETS` entry; no renderer changes.
- Spatial values in a preset are *ratios* (relative to canvas width, except cover corner radius which is relative to cover width). `resolveComposition()` turns a preset + format + baseWidth into a pixel-resolved `ResolvedComposition` the renderer reads.
- A picked preset stays editable: `PresetOverrides` is merged per axis (`mergePreset`); `background` is a tagged union and is swapped whole.
- Post effects are independent SkSL runtime shaders (`src/composition/shaders/effects.ts`): grain, glitch, pixelate, halftone, chromatic. Each takes `intensity` 0..1. They are applied by snapshotting the scene to an `SkImage` (`drawAsImage`) and sampling it through nested runtime-effect shaders (`<Shader>` with an `<ImageShader>` child) — NOT via `ImageFilter.MakeRuntimeShader`, which is unimplemented on React Native Web. `drawAsImage` is async, so the un-effected scene renders until the snapshot resolves. `EffectsSpec.coverPolicy` ('include' default, or 'exclude') controls whether the locked cover is repainted clean over the effected scene.
- The "cover-colors" background extracts representative colors from the decoded cover (`src/composition/color/extract.ts`, offscreen downscale + histogram quantize) for a solid or gradient fill, with a static `fallback` until the image decodes.
- Validate shader edits with `npm run validate:shaders` (compiles every SkSL string through CanvasKit).

## Output specs
- Default: 1080x1920 (IG Story, 9:16)
- Secondary: 1080x1080 (IG feed/Twitter, 1:1)

## Code style
- TypeScript. Functional components and hooks.
- Presets are defined as data (a combination of five axes). Do not hardcode them.
- Handle platform branching with Platform.select, or by splitting files into .native.tsx / .web.tsx.
- Skia web init: `Skia.web.js` binds `Skia = JsiSkApi(global.CanvasKit)` at module load, so any screen that statically imports a Skia component must be wrapped in `<WithSkiaWeb getComponent={() => import(...)}>` on web. Native paths import the same component directly.
- Write comments only where they are genuinely necessary, in English, and keep them concise.
