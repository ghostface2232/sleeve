import TrackComposition, { type TrackCompositionProps } from './TrackComposition';

// Native host: Skia is linked through JSI, no runtime init needed.
export default function CompositionHost(props: TrackCompositionProps) {
  return <TrackComposition {...props} />;
}

export type { TrackCompositionProps };
