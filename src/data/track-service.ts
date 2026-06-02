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

  // Cascade by cover fidelity:
  //   1. Apple Music direct ID    → iTunes Lookup (≥1000px after upscaling)
  //   2. iTunes search + verify   → iTunes Lookup top hit, only if title+artist
  //                                 cleanly line up (handles Odesli misses on
  //                                 Apple's side)
  //   3. Odesli source thumbnail  → 500–640px from Spotify/Tidal/Amazon, used
  //                                 when Apple's catalog genuinely lacks the
  //                                 song. Lower-res but correct.
  //   4. Nothing                  → no_match (user falls back to manual search)

  // Path 1
  if (match.appleMusicId) {
    let itunes;
    try {
      itunes = await lookupItunes(match.appleMusicId);
    } catch (e) {
      return { ok: false, error: networkError(e) };
    }
    if (itunes?.artworkUrl100) {
      return cache(url, buildFromItunes(itunes, url, match.appleMusicId));
    }
  }

  // Path 2
  let candidates: ITunesResult[] = [];
  try {
    candidates = await searchItunes(`${match.title} ${match.artistName}`);
  } catch (e) {
    return { ok: false, error: networkError(e) };
  }
  const top = candidates[0];
  if (top?.artworkUrl100 && isCloseMatch(top, match.title, match.artistName)) {
    return cache(
      url,
      buildFromItunes(top, url, top.trackId != null ? String(top.trackId) : undefined),
    );
  }

  // Path 3
  if (match.bestArtwork) {
    return cache(url, {
      title: match.title,
      artist: match.artistName,
      album: '',
      coverUrl: match.bestArtwork.url,
      sourceUrl: url,
    });
  }

  return { ok: false, error: { kind: 'no_match' } };
}

// Manual flow: free-text query → candidate list → user picks → Track.
export async function searchCandidates(query: string): Promise<ITunesResult[]> {
  const term = query.trim();
  if (!term) return [];
  return searchItunes(term);
}

export function trackFromCandidate(it: ITunesResult, sourceUrl: string): Track | null {
  if (!it.artworkUrl100) return null;
  return buildFromItunes(it, sourceUrl, it.trackId != null ? String(it.trackId) : undefined);
}

export async function cacheManualPick(sourceUrl: string, track: Track): Promise<void> {
  if (!sourceUrl) return;
  await setCachedTrack(sourceUrl, track);
}

async function cache(url: string, track: Track): Promise<LookupResult> {
  await setCachedTrack(url, track);
  return { ok: true, track };
}

function buildFromItunes(it: ITunesResult, sourceUrl: string, appleMusicId?: string): Track {
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

// Loose containment for Path 2: "Imagine" matches "Imagine - Remastered 2010",
// but unrelated tracks with shared substrings are filtered by also requiring
// the artist to line up.
function isCloseMatch(it: ITunesResult, title: string, artist: string): boolean {
  const itTitle = norm(it.trackName ?? '');
  const itArtist = norm(it.artistName ?? '');
  const t = norm(title);
  const a = norm(artist);
  if (!itTitle || !itArtist || !t || !a) return false;
  const titleHit = itTitle.includes(t) || t.includes(itTitle);
  const artistHit = itArtist.includes(a) || a.includes(itArtist);
  return titleHit && artistHit;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
