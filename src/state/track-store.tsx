import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { ITunesResult } from '@/data/itunes';
import {
  cacheManualPick,
  lookupTrack,
  searchCandidates,
  trackFromCandidate,
} from '@/data/track-service';
import type { LookupError, Track } from '@/data/types';

export type TrackStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; track: Track }
  | { kind: 'error'; error: LookupError; sourceUrl: string }
  | { kind: 'searching'; sourceUrl: string }
  | { kind: 'candidates'; candidates: ITunesResult[]; sourceUrl: string };

type TrackCtx = {
  status: TrackStatus;
  lookup: (input: string) => Promise<void>;
  searchManually: (query: string) => Promise<void>;
  pickCandidate: (candidate: ITunesResult) => void;
  reset: () => void;
};

const Ctx = createContext<TrackCtx | null>(null);

export function TrackProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<TrackStatus>({ kind: 'idle' });

  const lookup = useCallback(async (input: string) => {
    setStatus({ kind: 'loading' });
    const result = await lookupTrack(input);
    if (result.ok) {
      setStatus({ kind: 'success', track: result.track });
    } else {
      setStatus({ kind: 'error', error: result.error, sourceUrl: input });
    }
  }, []);

  const searchManually = useCallback(
    async (query: string) => {
      const sourceUrl = sourceUrlFromStatus(status);
      setStatus({ kind: 'searching', sourceUrl });
      try {
        const candidates = await searchCandidates(query);
        setStatus({ kind: 'candidates', candidates, sourceUrl });
      } catch (e) {
        setStatus({
          kind: 'error',
          error: { kind: 'network', message: e instanceof Error ? e.message : String(e) },
          sourceUrl,
        });
      }
    },
    [status],
  );

  const pickCandidate = useCallback(
    (candidate: ITunesResult) => {
      const sourceUrl = sourceUrlFromStatus(status);
      const track = trackFromCandidate(candidate, sourceUrl);
      if (!track) return;
      void cacheManualPick(sourceUrl, track);
      setStatus({ kind: 'success', track });
    },
    [status],
  );

  const reset = useCallback(() => setStatus({ kind: 'idle' }), []);

  const value = useMemo<TrackCtx>(
    () => ({ status, lookup, searchManually, pickCandidate, reset }),
    [status, lookup, searchManually, pickCandidate, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrack(): TrackCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTrack must be used within <TrackProvider>');
  return ctx;
}

function sourceUrlFromStatus(s: TrackStatus): string {
  switch (s.kind) {
    case 'error':
    case 'searching':
    case 'candidates':
      return s.sourceUrl;
    default:
      return '';
  }
}
