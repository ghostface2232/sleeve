import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

// Web entry: defer importing the Skia canvas module until after LoadSkiaWeb
// has populated global.CanvasKit. Skia.web.js binds `Skia = JsiSkApi(global.CanvasKit)`
// at module load time, so the Canvas module MUST be imported only after init.
export default function Home() {
  return (
    <WithSkiaWeb
      opts={{ locateFile: () => '/canvaskit.wasm' }}
      getComponent={() => import('@/screens/HomeCanvas')}
      fallback={<View style={{ flex: 1, backgroundColor: '#0B0B0F' }} />}
    />
  );
}
