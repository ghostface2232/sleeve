import { Canvas, Circle, Fill, Group, Rect } from '@shopify/react-native-skia';
import { useColorScheme, useWindowDimensions, View } from 'react-native';

export default function HomeCanvas() {
  const { width, height } = useWindowDimensions();
  const isDark = (useColorScheme() ?? 'dark') === 'dark';

  const bg = isDark ? '#0B0B0F' : '#FFFFFF';
  const card = isDark ? '#1A1A22' : '#F1F1F5';
  const accent = '#FF4D8D';

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.18;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Canvas style={{ flex: 1 }}>
        <Fill color={bg} />
        <Group>
          <Rect x={cx - r * 1.4} y={cy - r * 1.4} width={r * 2.8} height={r * 2.8} color={card} />
          <Circle cx={cx} cy={cy} r={r} color={accent} />
        </Group>
      </Canvas>
    </View>
  );
}
