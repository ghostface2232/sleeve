import { proxiedFetch } from './transport';

const ODESLI_BASE = 'https://api.song.link/v1-alpha.1/links';

export type OdesliArtwork = {
  url: string;
  width: number;
  height: number;
  platform: string;
};

export type OdesliMatch = {
  // Apple Music's catalog ID for the matched song. null when the response
  // doesn't include an appleMusic platform link — the caller falls back to
  // iTunes search, then to `bestArtwork` if iTunes is also empty.
  appleMusicId: string | null;
  title: string;
  artistName: string;
  // Highest-resolution cover among the platforms Odesli returned. Known CDN
  // size patterns get rewritten to a larger variant before sorting — Pandora
  // 500→1080, Tidal 640→1280, Deezer 500→1000, Yandex 600→1000 — so Apple-less
  // tracks still land at ~Apple-grade resolution instead of 500–640px.
  bestArtwork: OdesliArtwork | null;
};

export async function lookupOdesli(url: string): Promise<OdesliMatch | null> {
  const endpoint = `${ODESLI_BASE}?url=${encodeURIComponent(url)}&userCountry=US`;
  const res = await proxiedFetch(endpoint);
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) {
    const err = new Error(`Odesli responded ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const json = (await res.json()) as OdesliResponse;

  const entities = json.entitiesByUniqueId ?? {};

  // Apple's matched entity (preferred ID + metadata source).
  const appleEntityId = json.linksByPlatform?.appleMusic?.entityUniqueId;
  const appleEntity = appleEntityId ? entities[appleEntityId] : undefined;

  // The primary entity is the one matched directly from the user's URL.
  const primaryEntity = json.entityUniqueId ? entities[json.entityUniqueId] : undefined;

  const source = appleEntity ?? primaryEntity;
  if (!source) return null;
  const title = source.title?.trim();
  const artistName = source.artistName?.trim();
  if (!title || !artistName) return null;

  const bestArtwork = pickBestArtwork(entities);

  return {
    appleMusicId: appleEntity?.id != null ? String(appleEntity.id) : null,
    title,
    artistName,
    bestArtwork,
  };
}

function pickBestArtwork(
  entities: Record<string, OdesliEntity | undefined>,
): OdesliArtwork | null {
  const artworks: OdesliArtwork[] = [];
  for (const [uniqueId, entity] of Object.entries(entities)) {
    if (!entity?.thumbnailUrl) continue;
    const platform = uniqueId.split('_')[0]?.toLowerCase() ?? 'unknown';
    artworks.push(
      upscaleArtwork(
        entity.thumbnailUrl,
        entity.thumbnailWidth ?? 0,
        entity.thumbnailHeight ?? 0,
        platform,
      ),
    );
  }
  if (artworks.length === 0) return null;
  artworks.sort((a, b) => b.width * b.height - a.width * a.height);
  return artworks[0];
}

// Per-platform CDN upscaling — patterns verified against live URLs. If none
// match, the artwork is returned at its declared (small) resolution and will
// lose the area sort to any platform that does support hi-res.
function upscaleArtwork(
  url: string,
  width: number,
  height: number,
  platform: string,
): OdesliArtwork {
  // Pandora: _500W_500H.jpg → _1080W_1080H.jpg
  if (url.includes('p-cdn.com') && url.includes('_500W_500H')) {
    return {
      url: url.replace('_500W_500H', '_1080W_1080H'),
      width: 1080,
      height: 1080,
      platform,
    };
  }
  // Tidal: /640x640.jpg → /1280x1280.jpg
  if (url.includes('resources.tidal.com') && url.includes('/640x640')) {
    return {
      url: url.replace('/640x640', '/1280x1280'),
      width: 1280,
      height: 1280,
      platform,
    };
  }
  // Deezer: /500x500-...jpg → /1000x1000-...jpg
  if (url.includes('dzcdn.net') && /\/500x500-/.test(url)) {
    return {
      url: url.replace('/500x500-', '/1000x1000-'),
      width: 1000,
      height: 1000,
      platform,
    };
  }
  // Yandex: trailing /600x600 → /1000x1000
  if (url.includes('yandex.net') && /\/600x600$/.test(url)) {
    return {
      url: url.replace(/\/600x600$/, '/1000x1000'),
      width: 1000,
      height: 1000,
      platform,
    };
  }
  return { url, width, height, platform };
}

type OdesliResponse = {
  entityUniqueId?: string;
  linksByPlatform?: Record<string, { entityUniqueId?: string } | undefined>;
  entitiesByUniqueId?: Record<string, OdesliEntity | undefined>;
};

type OdesliEntity = {
  id?: string | number;
  title?: string;
  artistName?: string;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
};
