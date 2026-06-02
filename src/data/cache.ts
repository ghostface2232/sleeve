import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Track } from './types';

const KEY_PREFIX = 'sleeve:track:';
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

type Entry = { track: Track; expires: number };

const mem = new Map<string, Entry>();

export async function getCachedTrack(key: string): Promise<Track | null> {
  const fresh = mem.get(key);
  if (fresh && fresh.expires > Date.now()) return fresh.track;
  if (fresh) mem.delete(key);

  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry;
    if (entry.expires <= Date.now()) {
      AsyncStorage.removeItem(KEY_PREFIX + key).catch(() => {});
      return null;
    }
    mem.set(key, entry);
    return entry.track;
  } catch {
    return null;
  }
}

export async function setCachedTrack(key: string, track: Track): Promise<void> {
  const entry: Entry = { track, expires: Date.now() + TTL_MS };
  mem.set(key, entry);
  try {
    await AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Persistence failures are non-fatal — memory cache still works for the session.
  }
}
