import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display, Mono, PrimaryButton, Serif } from '@/components/ui';
import { drillMap, entryMap, scenarioMap, type PathNode } from '@/content';
import { colors } from '@/constants/theme';
import { useProgress } from '@/store/progress';

export default function SurvivalRun() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scene = scenarioMap[id];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useProgress();
  const [nodeId, setNodeId] = useState('start');
  const [loops, setLoops] = useState(0);

  const node: PathNode | undefined = useMemo(
    () => scene?.path.find((n) => n.id === nodeId),
    [scene, nodeId],
  );

  if (!scene || !node) {
    return (
      <View style={[styles.bg, { paddingTop: insets.top + 20, padding: 18 }]}>
        <Mono>MISSING PROTOCOL</Mono>
      </View>
    );
  }

  const won = node.id === 'win';
  const failed = node.id === 'fail';

  return (
    <View style={styles.bg}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Mono style={styles.back}>◂ SOS</Mono>
        </Pressable>
        <Mono style={styles.mid}>LOOPS {loops}</Mono>
        <Mono style={styles.mid}>{scene.title}</Mono>
      </View>
      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <Mono style={styles.k}>{won ? 'CONTACT' : failed ? 'STALL' : 'INTERACTIVE PROTOCOL'}</Mono>
        <Display style={styles.h}>{node.prompt}</Display>
        <Serif style={styles.body}>{node.body}</Serif>

        {node.choices.map((c) => (
          <Pressable
            key={c.label}
            onPress={() => {
              if (c.kind === 'loop' || c.kind === 'fail') setLoops((n) => n + 1);
              if (c.next === 'win') p.completeProtocol(scene.id);
              setNodeId(c.next);
            }}
            style={[
              styles.choice,
              c.kind === 'win' || c.kind === 'advance' ? styles.go : styles.stall,
            ]}>
            <Mono style={styles.kind}>
              {c.kind === 'loop' ? 'LOOP' : c.kind === 'fail' ? 'STALL' : c.kind === 'win' ? 'CLEAR' : 'MOVE'}
            </Mono>
            <Serif style={styles.choiceT}>{c.label}</Serif>
          </Pressable>
        ))}

        {won ? (
          <View style={styles.pack}>
            <Mono style={styles.pk}>90-SECOND MOVE</Mono>
            <Display style={styles.pt}>{scene.immediate.title}</Display>
            <Serif style={styles.pb}>{scene.immediate.body}</Serif>
            <Mono style={styles.pk}>NEXT 24 HOURS</Mono>
            {scene.protocol24.map((x) => (
              <Serif key={x} style={styles.li}>
                ▸ {x}
              </Serif>
            ))}
            <Mono style={styles.pk}>7-DAY FOLLOW</Mono>
            {scene.protocol7.map((x) => (
              <Serif key={x} style={styles.li}>
                ▸ {x}
              </Serif>
            ))}
            <PrimaryButton title="RUN MATCHED DRILL" onPress={() => router.push(`/drills/${scene.drillId}`)} />
            {scene.relatedEntries[0] && entryMap[scene.relatedEntries[0]] ? (
              <Pressable
                onPress={() => router.push(`/encyclopedia/${scene.relatedEntries[0]}`)}
                style={styles.doc}>
                <Mono style={styles.pk}>MANUAL</Mono>
                <Display style={styles.docT}>{entryMap[scene.relatedEntries[0]].title}</Display>
              </Pressable>
            ) : null}
            {drillMap[scene.drillId] ? (
              <Mono style={styles.hint}>Matched drill: {drillMap[scene.drillId].title}</Mono>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#100807' },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  back: { color: colors.stamp, fontSize: 11, letterSpacing: 1.4 },
  mid: { color: colors.mute2, fontSize: 10, letterSpacing: 1, maxWidth: 140 },
  pad: { padding: 18, paddingBottom: 48, gap: 12 },
  k: { color: colors.stamp, fontSize: 11, letterSpacing: 2 },
  h: { fontSize: 36, lineHeight: 38, color: colors.cream },
  body: { fontSize: 16, lineHeight: 25, color: colors.paper },
  choice: { padding: 14, borderWidth: 1, gap: 6 },
  go: { borderColor: colors.olive, backgroundColor: '#14200F' },
  stall: { borderColor: '#4A2A24', backgroundColor: '#1A0E0C' },
  kind: { fontSize: 10, letterSpacing: 2, color: colors.hazard },
  choiceT: { color: colors.cream, fontSize: 16, lineHeight: 22 },
  pack: { marginTop: 8, gap: 8, borderWidth: 1, borderColor: colors.olive, padding: 14 },
  pk: { color: colors.olive, fontSize: 11, letterSpacing: 1.6, marginTop: 6 },
  pt: { fontSize: 28, lineHeight: 30, color: colors.cream },
  pb: { color: colors.paper, fontSize: 15, lineHeight: 22 },
  li: { color: colors.paper, fontSize: 14, lineHeight: 21 },
  doc: { backgroundColor: colors.paper, padding: 12, marginTop: 8 },
  docT: { color: colors.void, fontSize: 24, lineHeight: 26 },
  hint: { color: colors.mute2, fontSize: 11 },
});
