import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Display, Mono, Pill, Screen, Serif } from '@/components/ui';
import { entries, entriesInVolume, searchEntries, volumes } from '@/content';
import { colors, fonts } from '@/constants/theme';
import { useProgress } from '@/store/progress';

export default function Encyclopedia() {
  const router = useRouter();
  const { read, stamped } = useProgress();
  const [q, setQ] = useState('');
  const [vol, setVol] = useState<(typeof volumes)[number]['id'] | 'all'>('all');

  const list = useMemo(() => {
    const base = q.trim() ? searchEntries(q) : vol === 'all' ? entries : entriesInVolume(vol);
    if (!q.trim() || vol === 'all') return base;
    return base.filter((e) => e.volume === vol);
  }, [q, vol]);

  const readN = Object.keys(read).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <Mono style={styles.k}>FM LIBRARY  ·  {readN}/{entries.length} READ</Mono>
        <Display style={styles.h}>ENCYCLOPEDIA</Display>
        <Serif style={styles.dek}>
          Open a volume. Read one entry. Stamp it by doing the action. Do not binge this like school.
        </Serif>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="SEARCH THE MANUAL"
          placeholderTextColor={colors.mute}
          style={styles.search}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          <Pill label="ALL" active={vol === 'all'} onPress={() => setVol('all')} />
          {volumes.map((v) => (
            <Pill key={v.id} label={v.fm} active={vol === v.id} onPress={() => setVol(v.id)} />
          ))}
        </ScrollView>

        {q.trim() ? null : vol === 'all' ? (
          <View style={styles.vols}>
            {volumes.map((v) => {
              const n = entriesInVolume(v.id);
              const stampedN = n.filter((e) => stamped[e.id]).length;
              return (
                <Pressable key={v.id} onPress={() => setVol(v.id)} style={styles.vol}>
                  <View style={styles.volTop}>
                    <Mono style={styles.volFm}>{v.fm}</Mono>
                    <Mono style={styles.volN}>
                      {stampedN}/{n.length} STAMPED
                    </Mono>
                  </View>
                  <Display style={styles.volT}>{v.title}</Display>
                  <Serif style={styles.volB}>{v.blurb}</Serif>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.list}>
          {(q.trim() || vol !== 'all' ? list : []).map((e) => (
            <Pressable key={e.id} onPress={() => router.push(`/encyclopedia/${e.id}`)} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Mono style={styles.rowFm}>{e.fm}</Mono>
                <Display style={styles.rowT}>{e.title}</Display>
                <Serif style={styles.rowD}>{e.dek}</Serif>
              </View>
              <Mono style={styles.flag}>
                {stamped[e.id] ? 'STAMP' : read[e.id] ? 'READ' : 'NEW'}
              </Mono>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingBottom: 48, gap: 10 },
  k: { color: colors.hazard, letterSpacing: 2, fontSize: 11, marginTop: 4 },
  h: { fontSize: 48, lineHeight: 48, color: colors.cream },
  dek: { fontSize: 15, lineHeight: 22, color: colors.paper },
  search: {
    borderWidth: 1,
    borderColor: colors.rule,
    color: colors.cream,
    fontFamily: fonts.mono,
    paddingHorizontal: 12,
    paddingVertical: 10,
    letterSpacing: 1.2,
    fontSize: 13,
    backgroundColor: colors.ink2,
  },
  pills: { gap: 8, paddingVertical: 4 },
  vols: { gap: 10, marginTop: 6 },
  vol: { borderWidth: 1, borderColor: colors.rule, padding: 14, backgroundColor: colors.ink2 },
  volTop: { flexDirection: 'row', justifyContent: 'space-between' },
  volFm: { color: colors.hazard, letterSpacing: 1.6, fontSize: 11 },
  volN: { color: colors.mute2, fontSize: 10, letterSpacing: 1 },
  volT: { fontSize: 36, lineHeight: 38, color: colors.cream, marginTop: 6 },
  volB: { color: colors.paper, fontSize: 14, lineHeight: 21, marginTop: 4 },
  list: { gap: 8, marginTop: 8 },
  row: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.paper,
    padding: 12,
    alignItems: 'flex-start',
  },
  rowFm: { color: colors.hazardDim, fontSize: 10, letterSpacing: 1.4 },
  rowT: { color: colors.void, fontSize: 24, lineHeight: 26 },
  rowD: { color: '#2C241A', fontSize: 13, lineHeight: 19, marginTop: 4 },
  flag: { color: colors.stamp, fontSize: 10, letterSpacing: 1, marginTop: 4 },
});
