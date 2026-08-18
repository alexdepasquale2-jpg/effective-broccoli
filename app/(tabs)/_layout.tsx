import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { useProgress } from '@/store/progress';

function TabMark({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.mark}>
      <Text style={[styles.markText, focused && styles.markOn]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { hydrated, onboarded } = useProgress();

  if (!hydrated) return <View style={styles.boot} />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.hazard,
        tabBarInactiveTintColor: colors.mute,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HQ',
          tabBarIcon: ({ focused }) => <TabMark label="HQ" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="encyclopedia"
        options={{
          title: 'MANUAL',
          tabBarIcon: ({ focused }) => <TabMark label="FM" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="survival"
        options={{
          title: 'SOS',
          tabBarIcon: ({ focused }) => <TabMark label="SOS" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="drills"
        options={{
          title: 'DRILLS',
          tabBarIcon: ({ focused }) => <TabMark label="GO" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'LOG',
          tabBarIcon: ({ focused }) => <TabMark label="LOG" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: colors.ink },
  bar: {
    backgroundColor: '#090807',
    borderTopWidth: 2,
    borderTopColor: colors.hazard,
    height: 64,
    paddingTop: 6,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  item: { paddingTop: 4 },
  mark: { alignItems: 'center', justifyContent: 'center', minWidth: 28 },
  markText: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    color: colors.mute,
    letterSpacing: 1,
  },
  markOn: { color: colors.hazard },
});
