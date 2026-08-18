import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Display, Mono, Screen, Serif } from '@/components/ui';
import { drills } from '@/content';
import { colors } from '@/constants/theme';
import { useProgress } from '@/store/progress';

export default function Drills() {
  const router = useRouter();
  const { drillsDone } = useProgress();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <Mono style={styles.k}>LIVE FIRE  ·  KNOWLEDGE THAT STAYS IN THE PHONE IS STILL FREEZE</Mono>
        <Display style={styles.h}>DRILLS</Display>
        <Serif style={styles.dek}>
          Timed missions. You do the thing while the clock runs. When it ends, you log contact. That is the whole religion.
        </Serif>
        <View style={styles.list}>
          {drills.map((d) => {
            const n = drillsDone[d.id] ?? 0;
            return (
              <Pressable key={d.id} onPress={() => router.push(`/drills/${d.id}`)} style={styles.card}>
                <View style={styles.top}>
                  <Mono style={styles.int}>{d.intensity}</Mono>
                  <Mono style={styles.time}>{d.durationSec}s</Mono>
                </View>
                <Display style={styles.t}>{d.title}</Display>
                <Serif style={styles.w}>{d.why}</Serif>
                <Mono style={styles.n}>{n ? `${n} RUN${n === 1 ? '' : 'S'}` : 'UNRUN'}</Mono>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingBottom: 48, gap: 10 },
  k: { color: colors.hazard, letterSpacing: 1.4, fontSize: 11, marginTop: 4 },
  h: { fontSize: 56, lineHeight: 56, color: colors.cream },
  dek: { fontSize: 15, lineHeight: 22, color: colors.paper },
  list: { gap: 10, marginTop: 6 },
  card: { borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.ink2, padding: 14, gap: 6 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  int: { color: colors.hazard, fontSize: 11, letterSpacing: 2 },
  time: { color: colors.mute2, fontSize: 11, letterSpacing: 1.4 },
  t: { fontSize: 32, lineHeight: 34, color: colors.cream },
  w: { color: colors.paper, fontSize: 15, lineHeight: 22 },
  n: { color: colors.olive, fontSize: 11, letterSpacing: 1.4, marginTop: 4 },
});
