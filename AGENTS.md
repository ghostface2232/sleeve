# Sleeve

A stateless app that fetches metadata and cover art from a music link, then composes a shareable image styled around the cover. Single codebase for iOS, Android, and web.

## Architecture principles
- No server-side database, no authentication. All state lives on the device.
- Metadata: normalize any incoming link through the Odesli public API to obtain the Apple Music ID, then enrich with hi-res artwork via the iTunes Lookup API.
- On web builds, all external API calls go through a Cloudflare Worker proxy to avoid CORS. Native builds call the APIs directly.
- All rendering is done with React Native Skia. Only the surrounding UI chrome uses NativeWind.

## Canvas data model rules
- The cover art is a locked layer. Never crop it or place text/logos directly on top of it.
- Variable elements (background, frame, typography, labels, post effects) are applied to the canvas around the cover, not over it.
- Global post-processing effects must keep an option to mask out the cover region, so the cover can be excluded when needed.

## Output specs
- Default: 1080x1920 (IG Story, 9:16)
- Secondary: 1080x1080 (IG feed/Twitter, 1:1)

## Code style
- TypeScript. Functional components and hooks.
- Presets are defined as data (a combination of five axes). Do not hardcode them.
- Handle platform branching with Platform.select, or by splitting files into .native.tsx / .web.tsx.
- Write comments only where they are genuinely necessary, in English, and keep them concise.