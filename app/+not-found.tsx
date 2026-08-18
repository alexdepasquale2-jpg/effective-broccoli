import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Display, Mono, Screen, Serif } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <View style={styles.box}>
          <Mono style={styles.k}>404 / OFF MAP</Mono>
          <Display style={styles.t}>THIS PAGE IS A STALL</Display>
          <Serif style={styles.s}>It does not exist. Returning to HQ is the move.</Serif>
          <Link href="/" style={styles.link}>
            <Display style={styles.linkT}>RETURN TO HQ</Display>
          </Link>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', gap: 14 },
  k: { color: colors.stamp, letterSpacing: 2, fontSize: 12 },
  t: { fontSize: 42, lineHeight: 44, color: colors.cream },
  s: { marginBottom: 12, lineHeight: 22, color: colors.paper },
  link: { backgroundColor: colors.hazard, paddingVertical: 14, alignItems: 'center' },
  linkT: { color: colors.void, fontSize: 22, letterSpacing: 2, textAlign: 'center' },
});
