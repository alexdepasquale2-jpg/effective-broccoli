import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Display, Mono, PrimaryButton, Screen, Serif } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useProgress } from '@/store/progress';

function ago(at: number) {
  const m = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (m < 60) return `${m}M AGO`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h}H AGO`;
  return `${Math.round(h / 24)}D AGO`;
}

export default function Log() {
  const p = useProgress();
  const [text, setText] = useState('');
  const [felt, setFelt] = useState(3);

  const shots = p.reports.length;
  const drills = Object.values(p.drillsDone).reduce((a, b) => a + b, 0);
  const stamps = Object.keys(p.stamped).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Mono style={styles.k}>FIELD LOG  ·  INTENTIONS DO NOT GET A LINE</Mono>
        <Display style={styles.h}>WHAT YOU DID</Display>
        <View style={styles.stats}>
          <Stat n={String(shots)} l="REPORTS" />
          <Stat n={String(drills)} l="DRILLS" />
          <Stat n={String(stamps)} l="STAMPS" />
          <Stat n={String(p.streak)} l="STREAK" />
        </View>
        <Mono style={styles.sec}>NEW REPORT</Mono>
        <Serif style={styles.dek}>Write the contact, not the plan. How dumb it felt is useful data.</Serif>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="I did…"
          placeholderTextColor={colors.mute}
          multiline
          style={styles.input}
        />
        <Mono style={styles.felt}>HOW STUPID IT FELT  ·  {felt}/5</Mono>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setFelt(n)} style={[styles.dot, felt === n && styles.dotOn]}>
              <Mono style={[styles.dotT, felt === n && { color: colors.void }]}>{n}</Mono>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          title="LOG CONTACT"
          onPress={() => {
            if (!text.trim()) return;
            p.addReport(text, felt, 'free');
            setText('');
            setFelt(3);
          }}
        />
        <Mono style={styles.sec}>RECENT</Mono>
        {p.reports.length === 0 ? (
          <Serif style={styles.empty}>Empty log. That is not mysterious. It is the freeze winning. Do a drill.</Serif>
        ) : (
          p.reports.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Mono style={styles.src}>{r.source.toUpperCase()}  ·  DUMB {r.felt}/5</Mono>
                <Mono style={styles.ago}>{ago(r.at)}</Mono>
              </View>
              <Serif style={styles.body}>{r.text}</Serif>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View style={styles.stat}>
      <Display style={styles.statN}>{n}</Display>
      <Mono style={styles.statL}>{l}</Mono>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { paddingBottom: 48, gap: 10 },
  k: { color: colors.olive, letterSpacing: 1.4, fontSize: 11, marginTop: 4 },
  h: { fontSize: 48, lineHeight: 48, color: colors.cream },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderWidth: 1, borderColor: colors.rule, padding: 8, backgroundColor: colors.ink2 },
  statN: { fontSize: 28, color: colors.cream, lineHeight: 30 },
  statL: { fontSize: 9, letterSpacing: 1, color: colors.mute2 },
  sec: { marginTop: 8, fontSize: 11, letterSpacing: 2, color: colors.mute2 },
  dek: { fontSize: 15, lineHeight: 22, color: colors.paper, marginTop: -4 },
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
  felt: { fontSize: 11, letterSpacing: 1.2, color: colors.hazard },
  row: { flexDirection: 'row', gap: 8 },
  dot: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.ink2,
  },
  dotOn: { backgroundColor: colors.hazard, borderColor: colors.hazard },
  dotT: { color: colors.cream, fontSize: 13 },
  empty: { color: colors.mute2, fontSize: 15, lineHeight: 22 },
  card: { borderWidth: 1, borderColor: colors.rule, padding: 12, backgroundColor: colors.ink2, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  src: { color: colors.hazard, fontSize: 10, letterSpacing: 1.2 },
  ago: { color: colors.mute, fontSize: 10, letterSpacing: 1 },
  body: { color: colors.paper, fontSize: 15, lineHeight: 22 },
});
