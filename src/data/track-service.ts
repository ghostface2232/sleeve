import { getCachedTrack, setCachedTrack } from './cache';
import { ITunesResult, lookupItunes, searchItunes, upscaleArtwork } from './itunes';
import { normalizeLink } from './normalize';
import { lookupOdesli } from './odesli';
import type { LookupResult, Track } from './types';

export async function lookupTrack(input: string): Promise<LookupResult> {
  const url = normalizeLink(input);
  if (!url) return { ok: false, error: { kind: 'invalid_link' } };

  const cached = await getCachedTrack(url);
  if (cached) return { ok: true, track: cached };

  let match;
  try {
    match = await lookupOdesli(url);
  } catch (e) {
    return { ok: false, error: networkError(e) };
  }
  if (!match) return { ok: false, error: { kind: 'no_match' } };

  let itunes;
  try {
    itunes = await lookupItunes(match.appleMusicId);
  } catch (e) {
    return { ok: false, error: networkError(e) };
  }
  if (!itunes?.artworkUrl100) return { ok: false, error: { kind: 'no_match' } };

  const track = buildTrack(itunes, url, match.appleMusicId);
  await setCachedTrack(url, track);
  return { ok: true, track };
}

// Fallback path: user supplies a free-text query (typically "Title - Artist")
// when Odesli couldn't match. We search iTunes and let the user pick.
export async function searchCandidates(query: string): Promise<ITunesResult[]> {
  const term = query.trim();
  if (!term) return [];
  return searchItunes(term);
}

export function trackFromCandidate(it: ITunesResult, sourceUrl: string): Track | null {
  if (!it.artworkUrl100) return null;
  return buildTrack(it, sourceUrl, it.trackId ? String(it.trackId) : undefined);
}

function buildTrack(it: ITunesResult, sourceUrl: string, appleMusicId?: string): Track {
  return {
    title: it.trackName ?? '',
    artist: it.artistName ?? '',
    album: it.collectionName ?? '',
    releaseYear: it.releaseDate ? new Date(it.releaseDate).getFullYear() : undefined,
    coverUrl: upscaleArtwork(it.artworkUrl100 ?? '', 1000),
    sourceUrl,
    appleMusicId,
  };
}

function networkError(e: unknown): { kind: 'network'; status?: number; message?: string } {
  const err = e as { status?: number; message?: string };
  return { kind: 'network', status: err?.status, message: err?.message ?? String(e) };
}
