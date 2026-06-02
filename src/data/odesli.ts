import { proxiedFetch } from './transport';

const ODESLI_BASE = 'https://api.song.link/v1-alpha.1/links';

export type OdesliMatch = {
  appleMusicId: string;
  title?: string;
  artistName?: string;
};

// Returns null when Odesli can't resolve the URL OR when the result has no
// Apple Music entity — both are surfaced as `no_match` upstream.
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
  const apple = json.linksByPlatform?.appleMusic;
  if (!apple?.entityUniqueId) return null;
  const entity = json.entitiesByUniqueId?.[apple.entityUniqueId];
  if (!entity?.id) return null;
  return {
    appleMusicId: String(entity.id),
    title: entity.title,
    artistName: entity.artistName,
  };
}

type OdesliResponse = {
  linksByPlatform?: Record<string, { entityUniqueId?: string } | undefined>;
  entitiesByUniqueId?: Record<string, OdesliEntity | undefined>;
};

type OdesliEntity = {
  id?: string | number;
  title?: string;
  artistName?: string;
};
