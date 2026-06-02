import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { TrackCompositionProps } from './TrackComposition';

// Web host: dynamic-import the Skia composition so its module (which binds
// `Skia = JsiSkApi(global.CanvasKit)` at load time) only evaluates AFTER
// LoadSkiaWeb has populated global.CanvasKit.
export default function CompositionHost(props: TrackCompositionProps) {
  const aspect = props.format === 'story' ? 1920 / 1080 : 1;
  return (
    <WithSkiaWeb
      opts={{ locateFile: () => '/canvaskit.wasm' }}
      getComponent={() => import('./TrackComposition')}
      fallback={
        <View
          style={{
            width: props.displayWidth,
            height: props.displayWidth * aspect,
            backgroundColor: '#15151C',
            borderRadius: 12,
          }}
        />
      }
      componentProps={props}
    />
  );
}

export type { TrackCompositionProps };
