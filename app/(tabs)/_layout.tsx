import { Tabs } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { Home, Library, Search, Settings } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import MiniPlayer from '../../components/MiniPlayer';

const TABS = [
  { name: 'index', label: 'Discover', Icon: Home },
  { name: 'search', label: 'Search', Icon: Search },
  { name: 'library', label: 'Library', Icon: Library },
  { name: 'settings', label: 'Settings', Icon: Settings },
] as const;

function TabButton({
  label,
  Icon,
  focused,
  onPress,
}: {
  label: string;
  Icon: typeof Home;
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(focused ? 1 : 0.92);
  const indicator = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, { damping: 16, stiffness: 220 });
    indicator.value = withSpring(focused ? 1 : 0, { damping: 18, stiffness: 200 });
  }, [focused]);

  const wrap = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bar = useAnimatedStyle(() => ({
    opacity: indicator.value,
    width: 18 * indicator.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center"
      style={{ paddingTop: 10 }}
    >
      <Animated.View style={wrap} className="items-center">
        <Icon
          color={focused ? '#ff5c2e' : '#5a4d42'}
          size={20}
          strokeWidth={focused ? 2.2 : 1.8}
        />
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 10,
            color: focused ? '#f5efe3' : '#5a4d42',
            marginTop: 4,
          }}
        >
          {label}
        </Text>
        <Animated.View
          style={[
            bar,
            {
              height: 2,
              borderRadius: 2,
              backgroundColor: '#ff5c2e',
              marginTop: 4,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0907' }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={({ state, navigation }) => (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#0a0907',
              borderTopWidth: 1,
              borderTopColor: 'rgba(245,239,227,0.06)',
              height: 72,
              paddingBottom: 12,
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
                  Icon={tab.Icon}
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
