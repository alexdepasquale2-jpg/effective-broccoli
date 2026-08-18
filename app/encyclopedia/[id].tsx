import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Blocks, Related } from '@/components/blocks';
import { Display, Mono, PrimaryButton, Serif, Stamp } from '@/components/ui';
import { drillMap, entryMap, scenarioMap } from '@/content';
import { colors } from '@/constants/theme';
import { useProgress } from '@/store/progress';

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = entryMap[id];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useProgress();

  useEffect(() => {
    if (entry) p.markRead(entry.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  if (!entry) {
    return (
      <View style={[styles.miss, { paddingTop: insets.top + 20 }]}>
        <Mono>MISSING ENTRY</Mono>
        <Pressable onPress={() => router.back()}>
          <Mono style={{ color: colors.hazard }}>BACK</Mono>
        </Pressable>
      </View>
    );
  }

  const titles = Object.fromEntries(entry.related.map((rid) => [rid, entryMap[rid]?.title ?? rid]));
  const stamped = Boolean(p.stamped[entry.id]);

  return (
    <View style={styles.bg}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Mono style={styles.back}>◂ MANUAL</Mono>
        </Pressable>
        <Mono style={styles.fm}>{entry.fm}</Mono>
        <Pressable onPress={() => p.toggleBookmark(entry.id)} hitSlop={12}>
          <Mono style={styles.back}>{p.bookmarks.includes(entry.id) ? 'MARKED' : 'MARK'}</Mono>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.paper} showsVerticalScrollIndicator={false}>
        <View style={styles.sheet}>
          <View style={styles.headRow}>
            <Mono style={styles.min}>{entry.minutes} MIN  ·  {entry.tags.join(' / ').toUpperCase()}</Mono>
            {stamped ? <Stamp label="STAMPED" tone="olive" /> : null}
          </View>
          <Display style={styles.title}>{entry.title}</Display>
          <Serif style={styles.dek}>{entry.dek}</Serif>
          <View style={styles.rule} />
          <Blocks blocks={entry.body} />
          <View style={styles.act}>
            <Mono style={styles.actK}>STAMP ACTION  ·  {entry.action.seconds}s</Mono>
            <Display style={styles.actT}>{entry.action.title}</Display>
            <Serif style={styles.actB}>{entry.action.body}</Serif>
            <PrimaryButton
              title={stamped ? 'ALREADY STAMPED' : 'I DID THE ACTION — STAMP'}
              dim={stamped}
              onPress={() => {
                if (!stamped) p.stamp(entry.id);
              }}
            />
          </View>
          <Related ids={entry.related} titles={titles} />
          <View style={styles.links}>
            {entry.drillId && drillMap[entry.drillId] ? (
              <Pressable onPress={() => router.push(`/drills/${entry.drillId}`)} style={styles.link}>
                <Mono style={styles.linkK}>DRILL</Mono>
                <Display style={styles.linkT}>{drillMap[entry.drillId].title}</Display>
              </Pressable>
            ) : null}
            {entry.survivalId && scenarioMap[entry.survivalId] ? (
              <Pressable onPress={() => router.push(`/survival/${entry.survivalId}`)} style={styles.link}>
                <Mono style={styles.linkK}>SOS</Mono>
                <Display style={styles.linkT}>{scenarioMap[entry.survivalId].title}</Display>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0A0908' },
  miss: { flex: 1, backgroundColor: colors.ink, padding: 20, gap: 12 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  back: { color: colors.hazard, fontSize: 11, letterSpacing: 1.4 },
  fm: { color: colors.mute2, fontSize: 11, letterSpacing: 1.6 },
  paper: { padding: 12, paddingBottom: 48 },
  sheet: { backgroundColor: colors.paper, padding: 18, gap: 12 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  min: { color: colors.mute, fontSize: 10, letterSpacing: 1.2, flex: 1 },
  title: { fontSize: 42, lineHeight: 44, color: colors.void },
  dek: { fontSize: 17, lineHeight: 26, color: '#2A2118' },
  rule: { height: 1, backgroundColor: '#C9B79A', marginVertical: 4 },
  act: { gap: 8, borderWidth: 1, borderColor: colors.hazard, padding: 12, backgroundColor: '#F0DCC0' },
  actK: { color: colors.hazardDim, fontSize: 11, letterSpacing: 1.4 },
  actT: { color: colors.void, fontSize: 26, lineHeight: 28 },
  actB: { color: '#2A2118', fontSize: 15, lineHeight: 22 },
  links: { gap: 8, marginTop: 8 },
  link: { backgroundColor: colors.void, padding: 12 },
  linkK: { color: colors.hazard, fontSize: 10, letterSpacing: 1.6 },
  linkT: { color: colors.cream, fontSize: 24, lineHeight: 26, marginTop: 4 },
});
