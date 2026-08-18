import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Classified, Display, GhostButton, HazardBar, Mono, PrimaryButton, Screen, Serif } from '@/components/ui';
import { freezeOptions } from '@/content';
import { colors, fonts } from '@/constants/theme';
import { useProgress } from '@/store/progress';

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useProgress();
  const [step, setStep] = useState(0);
  const [freezeId, setFreezeId] = useState(freezeOptions[0].id);
  const [callsign, setCallsign] = useState('');
  const [holding, setHolding] = useState(false);

  const go = (n: number) => {
    Haptics.selectionAsync().catch(() => {});
    setStep(n);
  };

  if (step === 0) {
    return (
      <Screen>
        <HazardBar />
        <View style={styles.cover}>
          <Classified text="UNCLASSIFIED / SELF HELP" />
          <Mono style={styles.fm}>FM-RX 01  ·  FIELD MANUAL</Mono>
          <Display style={styles.word}>RETARD</Display>
          <Display style={styles.word2}>MAXX</Display>
          <Serif style={styles.dek}>
            Immersive encyclopedia and survival guide for people who think so well they never leave the driveway.
          </Serif>
          <View style={{ height: 18 }} />
          <PrimaryButton title="OPEN THE MANUAL" onPress={() => go(1)} />
          <Mono style={styles.fine}>This book is useless until you move.</Mono>
        </View>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <Mono style={styles.kicker}>FM-00  ·  BRIEFING</Mono>
          <Display style={styles.h}>THE DOCTRINE IN ONE BREATH</Display>
          <Serif style={styles.body}>
            Retardmaxxing, in this manual, means taking the next real action before your mind finishes building a perfect case for it. The ugly name is a shock wrapper. The useful core is not recklessness and not a slur aimed at disabled people. It is a tax revolt against intelligence spent on hesitation.
          </Serif>
          <Serif style={styles.body}>
            You will not binge this like a course. You will read, stamp a page by doing the action, and leave. When frozen, you will name the freeze in Survival and run a 90-second move. Drills are the point. The log is the only honest rank.
          </Serif>
          <View style={styles.call}>
            <Mono style={styles.callK}>HARD LIMIT</Mono>
            <Serif style={styles.callT}>
              If you are in danger or thinking about harming yourself, this is the wrong tool. Get real help. In the US, call or text 988.
            </Serif>
          </View>
          <PrimaryButton title="I UNDERSTAND. NEXT." onPress={() => go(2)} />
        </ScrollView>
      </Screen>
    );
  }

  if (step === 2) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <Mono style={styles.kicker}>DIAGNOSTIC</Mono>
          <Display style={styles.h}>WHAT IS FREEZING YOU</Display>
          <Serif style={styles.body}>Pick the loudest one. You can change it later by using Survival.</Serif>
          <View style={styles.col}>
            {freezeOptions.map((f) => {
              const on = f.id === freezeId;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setFreezeId(f.id);
                  }}
                  style={[styles.opt, on && styles.optOn]}>
                  <Mono style={[styles.optT, on && styles.optTon]}>{f.label.toUpperCase()}</Mono>
                </Pressable>
              );
            })}
          </View>
          <PrimaryButton title="LOCK THIS FREEZE" onPress={() => go(3)} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Mono style={styles.kicker}>CALLSIGN</Mono>
        <Display style={styles.h}>WHAT DO WE CALL YOU IN THE LOG</Display>
        <Serif style={styles.body}>Optional. Blank becomes OPERATOR. This is not a brand. It is a file name.</Serif>
        <TextInput
          value={callsign}
          onChangeText={setCallsign}
          placeholder="CALLSIGN"
          placeholderTextColor={colors.mute}
          autoCapitalize="characters"
          style={styles.input}
        />
        <Pressable
          onPressIn={() => setHolding(true)}
          onPressOut={() => setHolding(false)}
          onLongPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            completeOnboarding(callsign, freezeId);
            router.replace('/');
          }}
          delayLongPress={650}
          style={[styles.hold, holding && styles.holdOn]}>
          <Display style={styles.holdT}>{holding ? 'KEEP HOLDING' : 'HOLD TO START BEFORE YOU UNDERSTAND'}</Display>
        </Pressable>
        <GhostButton title="BACK" onPress={() => go(2)} />
        <Mono style={styles.fine}>A tap is still a negotiation. A hold is a commit.</Mono>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { flex: 1, justifyContent: 'center', gap: 10, paddingBottom: 24 },
  fm: { color: colors.mute2, letterSpacing: 2, fontSize: 11, marginTop: 10 },
  word: { fontSize: 82, lineHeight: 78, color: colors.cream, marginTop: 8 },
  word2: { fontSize: 82, lineHeight: 78, color: colors.hazard, marginTop: -8 },
  dek: { fontSize: 16, lineHeight: 24, color: colors.paper, marginTop: 8 },
  fine: { fontSize: 11, textAlign: 'center', marginTop: 12, color: colors.mute },
  pad: { paddingBottom: 40, gap: 12, paddingTop: 8 },
  kicker: { color: colors.hazard, letterSpacing: 2, fontSize: 11 },
  h: { fontSize: 40, lineHeight: 42, color: colors.cream },
  body: { fontSize: 16, lineHeight: 25, color: colors.paper },
  call: { borderWidth: 1, borderColor: colors.stamp, padding: 12, gap: 6, marginBottom: 8 },
  callK: { color: colors.stamp, fontSize: 11, letterSpacing: 1.6 },
  callT: { color: colors.paper, fontSize: 15, lineHeight: 22 },
  col: { gap: 8, marginBottom: 8 },
  opt: { borderWidth: 1, borderColor: colors.rule, padding: 12, backgroundColor: colors.ink2 },
  optOn: { borderColor: colors.hazard, backgroundColor: '#24140E' },
  optT: { color: colors.mute2, fontSize: 12, letterSpacing: 0.8 },
  optTon: { color: colors.hazard },
  input: {
    borderWidth: 1,
    borderColor: colors.mute,
    color: colors.cream,
    fontFamily: fonts.monoMed,
    padding: 12,
    letterSpacing: 2,
    fontSize: 16,
  },
  hold: {
    backgroundColor: colors.hazard,
    paddingVertical: 22,
    alignItems: 'center',
    marginTop: 8,
  },
  holdOn: { backgroundColor: colors.olive },
  holdT: { color: colors.void, fontSize: 18, textAlign: 'center', paddingHorizontal: 12 },
});
