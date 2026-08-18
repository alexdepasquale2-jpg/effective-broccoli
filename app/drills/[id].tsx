import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display, Mono, PrimaryButton, Serif } from '@/components/ui';
import { drillMap } from '@/content';
import { colors, fonts } from '@/constants/theme';
import { useProgress } from '@/store/progress';

export default function DrillRun() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const drill = drillMap[id];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useProgress();
  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState('');
  const [felt, setFelt] = useState(3);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const beat = useMemo(() => {
    if (!drill) return '';
    let current = drill.beats[0]?.text ?? '';
    for (const b of drill.beats) {
      if (elapsed >= b.at) current = b.text;
    }
    return current;
  }, [drill, elapsed]);

  if (!drill) {
    return (
      <View style={[styles.bg, { paddingTop: insets.top + 20, padding: 18 }]}>
        <Mono>MISSING DRILL</Mono>
      </View>
    );
  }

  const remain = Math.max(0, drill.durationSec - elapsed);
  const mm = String(Math.floor(remain / 60)).padStart(2, '0');
  const ss = String(remain % 60).padStart(2, '0');

  const start = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setPhase('run');
    setElapsed(0);
    timer.current = setInterval(() => {
      setElapsed((t) => {
        const n = t + 1;
        if (n >= drill.durationSec) {
          if (timer.current) clearInterval(timer.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setPhase('done');
          return drill.durationSec;
        }
        if (drill.beats.some((b) => b.at === n)) {
          Haptics.selectionAsync().catch(() => {});
        }
        return n;
      });
    }, 1000);
  };

  return (
    <View style={[styles.bg, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Mono style={styles.back}>◂ DRILLS</Mono>
        </Pressable>
        <Mono style={styles.int}>{drill.intensity}</Mono>
      </View>

      {phase === 'ready' ? (
        <View style={styles.body}>
          <Mono style={styles.k}>LIVE FIRE</Mono>
          <Display style={styles.title}>{drill.title}</Display>
          <Serif style={styles.why}>{drill.why}</Serif>
          <View style={styles.box}>
            <Mono style={styles.boxK}>SETUP</Mono>
            <Serif style={styles.boxT}>{drill.setup}</Serif>
          </View>
          <PrimaryButton title={`START  ·  ${drill.durationSec}s`} onPress={start} />
          <Mono style={styles.hint}>When it starts, you do not optimize. You follow the beats.</Mono>
        </View>
      ) : null}

      {phase === 'run' ? (
        <View style={styles.body}>
          <Mono style={styles.k}>IN CONTACT</Mono>
          <Display style={styles.clock}>
            {mm}:{ss}
          </Display>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(elapsed / drill.durationSec) * 100}%` }]} />
          </View>
          <Serif style={styles.beat}>{beat}</Serif>
        </View>
      ) : null}

      {phase === 'done' ? (
        <View style={styles.body}>
          <Mono style={styles.k}>AFTER ACTION</Mono>
          <Display style={styles.title}>LOG THE CONTACT</Display>
          <Serif style={styles.why}>{drill.completePrompt}</Serif>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="I did…"
            placeholderTextColor={colors.mute}
            multiline
            style={styles.input}
          />
          <Mono style={styles.boxK}>HOW STUPID IT FELT  ·  {felt}/5</Mono>
          <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setFelt(n)} style={[styles.dot, felt === n && styles.dotOn]}>
                <Mono style={[styles.dotT, felt === n && { color: colors.void }]}>{n}</Mono>
              </Pressable>
            ))}
          </View>
          <PrimaryButton
            title="FILE THE REPORT"
            onPress={() => {
              p.completeDrill(drill.id, note, felt);
              router.replace('/log');
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 18 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
  back: { color: colors.hazard, fontSize: 11, letterSpacing: 1.4 },
  int: { color: colors.mute2, fontSize: 11, letterSpacing: 2 },
  body: { flex: 1, gap: 12, paddingTop: 12 },
  k: { color: colors.hazard, fontSize: 11, letterSpacing: 2 },
  title: { fontSize: 44, lineHeight: 46, color: colors.cream },
  why: { fontSize: 16, lineHeight: 24, color: colors.paper },
  box: { borderWidth: 1, borderColor: colors.rule, padding: 12, backgroundColor: colors.ink2, gap: 6 },
  boxK: { color: colors.hazard, fontSize: 11, letterSpacing: 1.6 },
  boxT: { color: colors.paper, fontSize: 15, lineHeight: 22 },
  hint: { color: colors.mute, fontSize: 11, textAlign: 'center' },
  clock: { fontSize: 96, lineHeight: 96, color: colors.hazard, textAlign: 'center', marginTop: 12 },
  track: { height: 8, backgroundColor: colors.ink2 },
  fill: { height: 8, backgroundColor: colors.hazard },
  beat: { fontSize: 22, lineHeight: 32, color: colors.cream, textAlign: 'center', marginTop: 16 },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.rule,
    color: colors.cream,
    fontFamily: fonts.serif,
    padding: 12,
    textAlignVertical: 'top',
    backgroundColor: colors.ink2,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 8 },
  dot: { flex: 1, borderWidth: 1, borderColor: colors.rule, alignItems: 'center', paddingVertical: 8 },
  dotOn: { backgroundColor: colors.hazard, borderColor: colors.hazard },
  dotT: { color: colors.cream },
});
