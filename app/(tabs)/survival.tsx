import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Display, Mono, Screen, Serif } from '@/components/ui';
import { freezeOptions, scenarios } from '@/content';
import { colors } from '@/constants/theme';
import { useProgress } from '@/store/progress';

export default function Survival() {
  const router = useRouter();
  const { freezeId, protocols } = useProgress();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <Mono style={styles.k}>SURVIVAL  ·  NAME THE FREEZE</Mono>
        <Display style={styles.h}>FIELD SOS</Display>
        <Serif style={styles.dek}>
          Do not diagnose your whole personality. Pick the weather you are in. Run the protocol. The interactive path will try to talk you back into the loop. Do not let it.
        </Serif>
        <View style={styles.list}>
          {scenarios.map((s) => {
            const mine = s.id === freezeId;
            const done = Boolean(protocols[s.id]);
            const opt = freezeOptions.find((f) => f.survivalId === s.id);
            return (
              <Pressable key={s.id} onPress={() => router.push(`/survival/${s.id}`)} style={[styles.card, mine && styles.mine]}>
                <View style={styles.top}>
                  <Mono style={styles.sig}>{mine ? 'ACTIVE FREEZE' : done ? 'RUN BEFORE' : 'PROTOCOL'}</Mono>
                  <Mono style={styles.go}>OPEN ▸</Mono>
                </View>
                <Display style={styles.t}>{s.title}</Display>
                <Serif style={styles.d}>{s.freeze}</Serif>
                <Mono style={styles.signal}>{opt?.label ?? s.signal}</Mono>
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
  k: { color: colors.stamp, letterSpacing: 2, fontSize: 11, marginTop: 4 },
  h: { fontSize: 52, lineHeight: 52, color: colors.cream },
  dek: { fontSize: 15, lineHeight: 22, color: colors.paper },
  list: { gap: 10, marginTop: 6 },
  card: { borderWidth: 1, borderColor: '#3A221C', backgroundColor: '#140C0A', padding: 14, gap: 6 },
  mine: { borderColor: colors.stamp },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  sig: { color: colors.stamp, fontSize: 10, letterSpacing: 1.6 },
  go: { color: colors.mute2, fontSize: 10, letterSpacing: 1.4 },
  t: { fontSize: 30, lineHeight: 32, color: colors.cream },
  d: { color: colors.paper, fontSize: 15, lineHeight: 22 },
  signal: { color: colors.mute2, fontSize: 11, marginTop: 4, letterSpacing: 0.4 },
});
