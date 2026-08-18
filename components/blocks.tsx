import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Block } from '@/content';
import { colors, fonts } from '@/constants/theme';
import { Mono, Serif } from '@/components/ui';

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <View style={styles.wrap}>
      {blocks.map((b, i) => {
        if (b.type === 'p') {
          return (
            <Serif key={i} style={styles.p}>
              {b.text}
            </Serif>
          );
        }
        if (b.type === 'h') {
          return (
            <Mono key={i} style={styles.h}>
              {b.text}
            </Mono>
          );
        }
        if (b.type === 'quote') {
          return (
            <View key={i} style={styles.quote}>
              <Serif style={styles.quoteText}>{b.text}</Serif>
              {b.attr ? <Mono style={styles.attr}>{b.attr}</Mono> : null}
            </View>
          );
        }
        if (b.type === 'list') {
          return (
            <View key={i} style={styles.list}>
              {b.items.map((item) => (
                <View key={item} style={styles.li}>
                  <Mono style={styles.dash}>▸</Mono>
                  <Serif style={styles.liText}>{item}</Serif>
                </View>
              ))}
            </View>
          );
        }
        if (b.type === 'steps') {
          return (
            <View key={i} style={styles.steps}>
              {b.items.map((s) => (
                <View key={s.n} style={styles.step}>
                  <Mono style={styles.stepN}>{s.n}</Mono>
                  <View style={{ flex: 1 }}>
                    <Mono style={styles.stepTitle}>{s.title}</Mono>
                    <Serif style={styles.stepBody}>{s.text}</Serif>
                  </View>
                </View>
              ))}
            </View>
          );
        }
        const tone =
          b.kind === 'act' ? styles.act : b.kind === 'warn' ? styles.warn : styles.note;
        const label = b.kind === 'act' ? colors.hazard : b.kind === 'warn' ? colors.stamp : colors.olive;
        return (
          <View key={i} style={[styles.callout, tone]}>
            <Mono style={[styles.callTitle, { color: label }]}>{b.title}</Mono>
            <Serif style={styles.callBody}>{b.text}</Serif>
          </View>
        );
      })}
    </View>
  );
}

export function Related({ ids, titles }: { ids: string[]; titles: Record<string, string> }) {
  if (!ids.length) return null;
  return (
    <View style={styles.related}>
      <Mono style={styles.relLabel}>SEE ALSO</Mono>
      {ids.map((id) => (
        <Link key={id} href={`/encyclopedia/${id}`} style={styles.relLink}>
          <Serif style={styles.relText}>{titles[id] ?? id}</Serif>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  p: { fontSize: 16, lineHeight: 26, color: '#231C14' },
  h: {
    marginTop: 10,
    color: colors.hazardDim,
    fontSize: 12,
    letterSpacing: 1.8,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.hazard,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  quoteText: {
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    lineHeight: 28,
    color: '#1A140E',
  },
  attr: { marginTop: 6, fontSize: 11, color: colors.mute },
  list: { gap: 8 },
  li: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dash: { color: colors.hazard, marginTop: 4, fontSize: 12 },
  liText: { flex: 1, fontSize: 15, lineHeight: 24, color: '#231C14' },
  steps: { gap: 12 },
  step: { flexDirection: 'row', gap: 10 },
  stepN: { color: colors.hazard, fontSize: 14, width: 28, marginTop: 2 },
  stepTitle: { color: '#1A140E', fontSize: 12, letterSpacing: 1.2, marginBottom: 4 },
  stepBody: { fontSize: 15, lineHeight: 23, color: '#231C14' },
  callout: { padding: 12, borderWidth: 1, gap: 6 },
  act: { backgroundColor: '#F3E0C8', borderColor: colors.hazard },
  warn: { backgroundColor: '#EBD3C8', borderColor: colors.stamp },
  note: { backgroundColor: '#DDE3C8', borderColor: colors.olive },
  callTitle: { fontSize: 11, letterSpacing: 1.6 },
  callBody: { fontSize: 15, lineHeight: 23, color: '#231C14' },
  related: { marginTop: 8, gap: 8 },
  relLabel: { fontSize: 11, letterSpacing: 2, color: colors.mute },
  relLink: { paddingVertical: 4 },
  relText: { fontSize: 16, color: colors.hazardDim, textDecorationLine: 'underline' },
});
