export type Track = {
  title: string;
  artist: string;
  album: string;
  releaseYear?: number;
  coverUrl: string;
  sourceUrl: string;
  appleMusicId?: string;
};

export type LookupError =
  | { kind: 'invalid_link' }
  | { kind: 'network'; status?: number; message?: string }
  | { kind: 'no_match' };

export type LookupResult =
  | { ok: true; track: Track }
  | { ok: false; error: LookupError };
