import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CompositionHost from '@/composition/CompositionHost';
import type { CanvasFormat } from '@/composition/types';
import type { ITunesResult } from '@/data/itunes';
import type { LookupError, Track } from '@/data/types';
import { type TrackStatus, useTrack } from '@/state/track-store';

const BG = '#0B0B0F';
const CARD = '#15151C';
const SUBTLE = '#1F1F28';
const TEXT = '#FFFFFF';
const DIM = '#9A9AA8';
const ACCENT = '#FF4D8D';

export default function LookupScreen() {
  const { status, lookup, searchManually, pickCandidate, reset } = useTrack();
  const [input, setInput] = useState('');

  const busy = status.kind === 'loading' || status.kind === 'searching';
  const canSubmit = input.trim().length > 0 && !busy;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: TEXT, fontSize: 28, fontWeight: '600' }}>Sleeve</Text>
        <Text style={{ color: DIM, fontSize: 13 }}>
          Spotify / Apple Music / YouTube Music 링크를 붙여넣으세요.
        </Text>

        <View style={{ gap: 8 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="https://open.spotify.com/track/..."
            placeholderTextColor="#5A5A66"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={{
              color: TEXT,
              backgroundColor: SUBTLE,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
            }}
          />
          <Pressable
            onPress={() => lookup(input)}
            disabled={!canSubmit}
            style={({ pressed }) => ({
              padding: 14,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: canSubmit ? (pressed ? '#E5306E' : ACCENT) : '#3A2630',
            })}
          >
            <Text style={{ color: TEXT, fontSize: 16, fontWeight: '600' }}>가져오기</Text>
          </Pressable>
        </View>

        <StatusBlock
          status={status}
          onManualSearch={searchManually}
          onPickCandidate={pickCandidate}
          onReset={() => {
            setInput('');
            reset();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBlock({
  status,
  onManualSearch,
  onPickCandidate,
  onReset,
}: {
  status: TrackStatus;
  onManualSearch: (q: string) => void;
  onPickCandidate: (c: ITunesResult) => void;
  onReset: () => void;
}) {
  switch (status.kind) {
    case 'idle':
      return null;
    case 'loading':
    case 'searching':
      return <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 24 }} />;
    case 'success':
      return <TrackPreview track={status.track} onReset={onReset} />;
    case 'error':
      return (
        <ErrorPanel error={status.error} onManualSearch={onManualSearch} onReset={onReset} />
      );
    case 'candidates':
      return (
        <CandidateList candidates={status.candidates} onPick={onPickCandidate} onReset={onReset} />
      );
  }
}

function TrackPreview({ track, onReset }: { track: Track; onReset: () => void }) {
  const { width } = useWindowDimensions();
  const previewWidth = Math.min(width - 32, 360);
  const [format, setFormat] = useState<CanvasFormat>('story');

  return (
    <View style={{ gap: 12 }}>
      <FormatToggle value={format} onChange={setFormat} />
      <View style={{ alignItems: 'center' }}>
        <CompositionHost track={track} format={format} displayWidth={previewWidth} />
      </View>
      <View style={{ paddingHorizontal: 4, gap: 4 }}>
        <Text style={{ color: TEXT, fontSize: 16, fontWeight: '600' }} numberOfLines={2}>
          {track.title}
        </Text>
        <Text style={{ color: DIM, fontSize: 13 }} numberOfLines={1}>
          {track.artist}
        </Text>
        <Text style={{ color: DIM, fontSize: 12 }} numberOfLines={1}>
          {track.album}
          {track.releaseYear ? `  ·  ${track.releaseYear}` : ''}
        </Text>
        <Text
          style={{ color: '#4A4A55', fontSize: 11, marginTop: 6 }}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {track.sourceUrl}
        </Text>
      </View>
      <Pressable onPress={onReset} style={{ alignSelf: 'flex-start' }}>
        <Text style={{ color: ACCENT, fontSize: 14 }}>다른 링크 가져오기</Text>
      </Pressable>
    </View>
  );
}

function FormatToggle({
  value,
  onChange,
}: {
  value: CanvasFormat;
  onChange: (next: CanvasFormat) => void;
}) {
  const options: { key: CanvasFormat; label: string }[] = [
    { key: 'story', label: 'Story 9:16' },
    { key: 'square', label: 'Square 1:1' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: active ? ACCENT : SUBTLE,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: TEXT, fontWeight: '600', fontSize: 13 }}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ErrorPanel({
  error,
  onManualSearch,
  onReset,
}: {
  error: LookupError;
  onManualSearch: (q: string) => void;
  onReset: () => void;
}) {
  const [manualQuery, setManualQuery] = useState('');

  const { headline, hint } = describeError(error);
  const recoverable = error.kind === 'no_match';

  return (
    <View style={{ backgroundColor: CARD, borderRadius: 16, padding: 16, gap: 12 }}>
      <Text style={{ color: TEXT, fontSize: 16, fontWeight: '600' }}>{headline}</Text>
      <Text style={{ color: DIM, fontSize: 13 }}>{hint}</Text>

      {recoverable && (
        <View style={{ gap: 8, marginTop: 4 }}>
          <Text style={{ color: DIM, fontSize: 12 }}>곡명과 아티스트로 직접 검색</Text>
          <TextInput
            value={manualQuery}
            onChangeText={setManualQuery}
            placeholder="예: After Hours The Weeknd"
            placeholderTextColor="#5A5A66"
            autoCapitalize="none"
            style={{
              color: TEXT,
              backgroundColor: SUBTLE,
              borderRadius: 10,
              padding: 12,
              fontSize: 14,
            }}
          />
          <Pressable
            onPress={() => onManualSearch(manualQuery)}
            disabled={!manualQuery.trim()}
            style={({ pressed }) => ({
              padding: 12,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: manualQuery.trim()
                ? pressed
                  ? '#E5306E'
                  : ACCENT
                : '#3A2630',
            })}
          >
            <Text style={{ color: TEXT, fontWeight: '600' }}>iTunes에서 검색</Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={onReset} style={{ marginTop: 4, alignSelf: 'flex-start' }}>
        <Text style={{ color: DIM, fontSize: 13 }}>처음으로</Text>
      </Pressable>
    </View>
  );
}

function CandidateList({
  candidates,
  onPick,
  onReset,
}: {
  candidates: ITunesResult[];
  onPick: (c: ITunesResult) => void;
  onReset: () => void;
}) {
  if (candidates.length === 0) {
    return (
      <View style={{ backgroundColor: CARD, borderRadius: 16, padding: 16, gap: 8 }}>
        <Text style={{ color: TEXT, fontSize: 15 }}>검색 결과가 없습니다.</Text>
        <Pressable onPress={onReset}>
          <Text style={{ color: ACCENT, fontSize: 13 }}>처음으로</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: DIM, fontSize: 12 }}>일치하는 항목을 골라주세요</Text>
      {candidates.map((c) => (
        <Pressable
          key={c.trackId ?? `${c.artistName}-${c.trackName}`}
          onPress={() => onPick(c)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            backgroundColor: pressed ? SUBTLE : CARD,
            borderRadius: 12,
            padding: 8,
            gap: 12,
            alignItems: 'center',
          })}
        >
          <Image
            source={{ uri: c.artworkUrl100 }}
            style={{ width: 56, height: 56, borderRadius: 6, backgroundColor: SUBTLE }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: TEXT, fontSize: 14 }} numberOfLines={1}>
              {c.trackName}
            </Text>
            <Text style={{ color: DIM, fontSize: 12 }} numberOfLines={1}>
              {c.artistName}
              {c.collectionName ? ` · ${c.collectionName}` : ''}
            </Text>
          </View>
        </Pressable>
      ))}
      <Pressable onPress={onReset} style={{ marginTop: 4 }}>
        <Text style={{ color: DIM, fontSize: 13 }}>처음으로</Text>
      </Pressable>
    </View>
  );
}

function describeError(error: LookupError): { headline: string; hint: string } {
  switch (error.kind) {
    case 'invalid_link':
      return {
        headline: '잘못된 링크',
        hint: 'http(s):// 로 시작하는 음악 서비스 링크를 붙여넣어 주세요.',
      };
    case 'network':
      return {
        headline: '네트워크 오류',
        hint: error.message
          ? `${error.message}${error.status ? ` (HTTP ${error.status})` : ''}`
          : '잠시 후 다시 시도해주세요.',
      };
    case 'no_match':
      return {
        headline: '매칭 결과 없음',
        hint: 'Apple Music에서 같은 곡을 찾지 못했어요. 곡명/아티스트로 직접 검색해보세요.',
      };
  }
}
