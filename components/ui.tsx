import { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';

export function AppFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') {
    return <View style={styles.nativeFill}>{children}</View>;
  }
  return (
    <View style={styles.webPage}>
      <View style={styles.webPhone}>{children}</View>
    </View>
  );
}

export function Screen({ children, style }: ViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top, 12), paddingBottom: 8 },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Display({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.display, style]}>
      {children}
    </Text>
  );
}

export function Mono({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.mono, style]}>
      {children}
    </Text>
  );
}

export function Serif({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.serif, style]}>
      {children}
    </Text>
  );
}

export function Rule({ color = colors.rule }: { color?: string }) {
  return <View style={[styles.rule, { backgroundColor: color }]} />;
}

export function Stamp({
  label,
  tone = 'stamp',
}: {
  label: string;
  tone?: 'stamp' | 'olive' | 'hazard';
}) {
  const border = tone === 'olive' ? colors.olive : tone === 'hazard' ? colors.hazard : colors.stamp;
  return (
    <View style={[styles.stamp, { borderColor: border }]}>
      <Text style={[styles.stampText, { color: border }]}>{label}</Text>
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillOn]}
      disabled={!onPress}>
      <Mono style={[styles.pillText, active && styles.pillTextOn]}>{label}</Mono>
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  dim,
}: {
  title: string;
  onPress: () => void;
  dim?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primary, dim && styles.primaryDim, pressed && { opacity: 0.85 }]}>
      <Display style={styles.primaryText}>{title}</Display>
    </Pressable>
  );
}

export function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.7 }]}>
      <Mono style={styles.ghostText}>{title}</Mono>
    </Pressable>
  );
}

export function HazardBar() {
  return (
    <View style={styles.hazardWrap}>
      {Array.from({ length: 18 }).map((_, i) => (
        <View key={i} style={[styles.hazardStripe, i % 2 === 0 ? styles.hazardA : styles.hazardB]} />
      ))}
    </View>
  );
}

export function Classified({ text = 'FIELD USE ONLY' }: { text?: string }) {
  return (
    <View style={styles.classWrap}>
      <Mono style={styles.classText}>{text}</Mono>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeFill: { flex: 1, backgroundColor: colors.ink },
  webPage: {
    flex: 1,
    backgroundColor: '#050403',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%' as unknown as number,
  },
  webPhone: {
    width: '100%',
    maxWidth: 430,
    flex: 1,
    backgroundColor: colors.ink,
    overflow: 'hidden',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#1C1814',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
  },
  display: {
    fontFamily: fonts.display,
    color: colors.cream,
    letterSpacing: 1.2,
  },
  mono: {
    fontFamily: fonts.mono,
    color: colors.mute2,
    letterSpacing: 0.4,
  },
  serif: {
    fontFamily: fonts.serif,
    color: colors.paper,
    lineHeight: 24,
  },
  rule: { height: 1, backgroundColor: colors.rule, width: '100%' },
  stamp: {
    borderWidth: 3,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '-8deg' }],
    alignSelf: 'flex-start',
  },
  stampText: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 2,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 2,
    backgroundColor: colors.ink2,
  },
  pillOn: {
    borderColor: colors.hazard,
    backgroundColor: '#2A140C',
  },
  pillText: { fontSize: 11, color: colors.mute2 },
  pillTextOn: { color: colors.hazard },
  primary: {
    backgroundColor: colors.hazard,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  primaryDim: { backgroundColor: colors.oliveDim },
  primaryText: { color: colors.void, fontSize: 22, letterSpacing: 2 },
  ghost: {
    borderWidth: 1,
    borderColor: colors.mute,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 2,
  },
  ghostText: { color: colors.cream, fontSize: 12, letterSpacing: 1.4 },
  hazardWrap: {
    height: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  hazardStripe: { width: 18, height: 28, transform: [{ rotate: '28deg' }, { translateY: -8 }] },
  hazardA: { backgroundColor: colors.hazard },
  hazardB: { backgroundColor: colors.void },
  classWrap: {
    borderWidth: 1,
    borderColor: colors.stamp,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  classText: { color: colors.stamp, fontSize: 10, letterSpacing: 2 },
});
