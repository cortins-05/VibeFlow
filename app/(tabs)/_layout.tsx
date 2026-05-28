import { Tabs } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MiniPlayer from '../../components/MiniPlayer';
import { useTheme, glow } from '../../constants/theme';

const TABS = [
  { name: 'index', label: 'discover' },
  { name: 'search', label: 'search' },
  { name: 'library', label: 'library' },
  { name: 'settings', label: 'settings' },
] as const;

function TabButton({ label, focused, onPress }: { label: string; focused: boolean; onPress: () => void }) {
  const { colors, fonts } = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.92);
  const indicator = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, { damping: 16, stiffness: 220 });
    indicator.value = withSpring(focused ? 1 : 0, { damping: 18, stiffness: 200 });
  }, [focused]);

  const wrap = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bar = useAnimatedStyle(() => ({
    opacity: indicator.value,
    width: 16 * indicator.value,
  }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
      <Animated.View style={[wrap, { alignItems: 'center' }]}>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            letterSpacing: 0.5,
            color: focused ? colors.accent : colors.textFaint,
            ...(focused ? glow(colors.accent, 6, 0.5) : {}),
          }}
        >
          {focused ? `[${label}]` : label}
        </Text>
        <Animated.View
          style={[bar, { height: 2, borderRadius: 1, backgroundColor: colors.accent, marginTop: 4 }]}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={({ state, navigation }) => (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.bg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              height: 72 + insets.bottom,
              paddingBottom: 12 + insets.bottom,
            }}
          >
            {state.routes.map((route, i) => {
              const tab = TABS.find((t) => t.name === route.name);
              if (!tab) return null;
              const focused = state.index === i;
              return (
                <TabButton
                  key={route.key}
                  label={tab.label}
                  focused={focused}
                  onPress={() => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name as never);
                    }
                  }}
                />
              );
            })}
          </View>
        )}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="library" />
        <Tabs.Screen name="favorites" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="downloads" />
        <Tabs.Screen name="settings" />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
