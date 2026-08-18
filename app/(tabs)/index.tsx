import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Classified, Display, HazardBar, Mono, Pill, Screen, Serif, Stamp } from '@/components/ui';
import { drillMap, entryMap, quoteForDay, scenarioMap } from '@/content';
import { colors } from '@/constants/theme';
import { useProgress, useRank, type DailyId } from '@/store/progress';

const dailies: { id: DailyId; title: string; hint: string }[] = [
  { id: 'body', title: 'BODY', hint: 'Move until mood has to notice.' },
  { id: 'craft', title: 'CRAFT', hint: 'Touch the real work. Artifact, not plan.' },
  { id: 'human', title: 'HUMAN', hint: 'Initiate contact. Not scrolling people.' },
];

export default function HQ() {
  const router = useRouter();
  const p = useProgress();
  const { rank, next, xp } = useRank();
  const freeze = scenarioMap[p.freezeId] ?? scenarioMap['cant-start'];
  const last = entryMap[p.lastEntryId] ?? entryMap['the-brief'];
  const nextXp = next ? next.minXp - xp : 0;
  const pct = next ? Math.min(1, (xp - rank.minXp) / Math.max(1, next.minXp - rank.minXp)) : 1;

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <HazardBar />
      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Classified />
          <Mono style={styles.meta}>
            {p.callsign}  ·  STREAK {p.streak}  ·  XP {xp}
          </Mono>
          <Display style={styles.brand}>RETARDMAXX</Display>
          <Display style={styles.hq}>FIELD HQ</Display>
          <View style={styles.rankRow}>
            <Stamp label={rank.title} tone="hazard" />
            <Serif style={styles.rankLine}>{rank.line}</Serif>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
          <Mono style={styles.next}>
            {next ? `${next.title} IN ${nextXp} XP` : 'VOID WALKER  ·  KEEP LOGGING'}
          </Mono>
        </View>

        <View style={styles.quote}>
          <Mono style={styles.qk}>TODAY’S LINE</Mono>
          <Serif style={styles.qt}>{quoteForDay()}</Serif>
        </View>

        <Mono style={styles.sec}>DAILY OS  ·  THREE CONTACTS</Mono>
        <View style={styles.daily}>
          {dailies.map((d) => {
            const on = p.daily.checks.includes(d.id);
            return (
              <Pressable key={d.id} onPress={() => p.toggleDaily(d.id)} style={[styles.dCard, on && styles.dOn]}>
                <View style={styles.dRow}>
                  <Display style={[styles.dTitle, on && { color: colors.void }]}>{d.title}</Display>
                  <Mono style={[styles.dMark, on && { color: colors.void }]}>{on ? 'STAMPED' : 'OPEN'}</Mono>
                </View>
                <Serif style={[styles.dHint, on && { color: colors.ink2 }]}>{d.hint}</Serif>
              </Pressable>
            );
          })}
        </View>

        <Mono style={styles.sec}>ACTIVE FREEZE</Mono>
        <Pressable onPress={() => router.push(`/survival/${freeze.id}`)} style={styles.sos}>
          <Mono style={styles.sosK}>SOS  ·  TAP TO RUN PROTOCOL</Mono>
          <Display style={styles.sosT}>{freeze.title}</Display>
          <Serif style={styles.sosD}>{freeze.freeze}</Serif>
        </Pressable>

        <Mono style={styles.sec}>CONTINUE THE MANUAL</Mono>
        <Pressable onPress={() => router.push(`/encyclopedia/${last.id}`)} style={styles.paper}>
          <Mono style={styles.fm}>{last.fm}</Mono>
          <Display style={styles.paperT}>{last.title}</Display>
          <Serif style={styles.paperD}>{last.dek}</Serif>
          {p.stamped[last.id] ? <Stamp label="STAMPED" tone="olive" /> : <Pill label="UNSTAMPED" />}
        </Pressable>

        <View style={styles.row}>
          <Pressable onPress={() => router.push('/encyclopedia')} style={styles.half}>
            <Mono style={styles.halfK}>FM</Mono>
            <Display style={styles.halfT}>ENCYCLOPEDIA</Display>
          </Pressable>
          <Pressable onPress={() => router.push(`/drills/${freeze.drillId}`)} style={styles.half}>
            <Mono style={styles.halfK}>GO</Mono>
            <Display style={styles.halfT}>{drillMap[freeze.drillId]?.title ?? 'DRILL'}</Display>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 48, gap: 12 },
  top: { gap: 8 },
  meta: { fontSize: 11, letterSpacing: 1.4, color: colors.mute2 },
  brand: { fontSize: 18, color: colors.mute2, letterSpacing: 4, marginTop: 4 },
  hq: { fontSize: 56, lineHeight: 56, color: colors.cream, marginTop: -6 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  rankLine: { flex: 1, fontSize: 14, color: colors.paper },
  barTrack: { height: 6, backgroundColor: colors.ink2, marginTop: 8 },
  barFill: { height: 6, backgroundColor: colors.hazard },
  next: { fontSize: 11, letterSpacing: 1.4, color: colors.mute2 },
  quote: { borderWidth: 1, borderColor: colors.rule, padding: 14, backgroundColor: colors.ink2, gap: 6 },
  qk: { fontSize: 10, letterSpacing: 2, color: colors.hazard },
  qt: { fontSize: 20, lineHeight: 28, color: colors.cream },
  sec: { marginTop: 8, fontSize: 11, letterSpacing: 2, color: colors.mute2 },
  daily: { gap: 8 },
  dCard: { borderWidth: 1, borderColor: colors.rule, padding: 12, backgroundColor: colors.ink2 },
  dOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dTitle: { fontSize: 28, color: colors.cream, lineHeight: 30 },
  dMark: { fontSize: 11, color: colors.hazard, letterSpacing: 1.4 },
  dHint: { fontSize: 14, color: colors.paper, marginTop: 4 },
  sos: { backgroundColor: '#1A0B09', borderWidth: 1, borderColor: colors.stamp, padding: 14, gap: 6 },
  sosK: { color: colors.stamp, fontSize: 11, letterSpacing: 1.6 },
  sosT: { fontSize: 32, lineHeight: 34, color: colors.cream },
  sosD: { color: colors.paper, fontSize: 15 },
  paper: { backgroundColor: colors.paper, padding: 14, gap: 6 },
  fm: { color: colors.hazardDim, fontSize: 11, letterSpacing: 1.6 },
  paperT: { fontSize: 32, lineHeight: 34, color: colors.void },
  paperD: { color: '#2A2118', fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  half: { flex: 1, borderWidth: 1, borderColor: colors.rule, padding: 12, backgroundColor: colors.ink2, minHeight: 88 },
  halfK: { color: colors.hazard, fontSize: 10, letterSpacing: 1.6 },
  halfT: { color: colors.cream, fontSize: 22, lineHeight: 24, marginTop: 8 },
});
