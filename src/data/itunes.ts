import { proxiedFetch } from './transport';

export type ITunesResult = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  releaseDate?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
};

export async function lookupItunes(appleMusicId: string): Promise<ITunesResult | null> {
  const endpoint = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appleMusicId)}`;
  const res = await proxiedFetch(endpoint);
  if (!res.ok) throw httpError('iTunes', res.status);
  const json = (await res.json()) as { results?: ITunesResult[] };
  return json.results?.[0] ?? null;
}

export async function searchItunes(query: string): Promise<ITunesResult[]> {
  const endpoint =
    `https://itunes.apple.com/search?media=music&entity=song&limit=10` +
    `&term=${encodeURIComponent(query)}`;
  const res = await proxiedFetch(endpoint);
  if (!res.ok) throw httpError('iTunes search', res.status);
  const json = (await res.json()) as { results?: ITunesResult[] };
  return json.results ?? [];
}

// Apple artwork URLs end in something like `/100x100bb.jpg` (sometimes with a
// `-999` density suffix or `cc`/`fa` variant). Swap the size segment to request
// a larger render — Apple resamples server-side, so any reasonable size works.
export function upscaleArtwork(url: string, size = 1000): string {
  const extMatch = url.match(/\.(jpg|jpeg|png|webp)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  return url.replace(/\/\d+x\d+[a-z]*(-\d+)?\.[a-z]+$/i, `/${size}x${size}bb.${ext}`);
}

function httpError(label: string, status: number) {
  const err = new Error(`${label} responded ${status}`) as Error & { status?: number };
  err.status = status;
  return err;
}
