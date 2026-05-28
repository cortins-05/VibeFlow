import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sliders, Trash2, Info, Headphones } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as FileSystem from 'expo-file-system/legacy';
import { useState, useEffect } from 'react';

export default function SettingsScreen() {
  const [cacheSize, setCacheSize] = useState('0.0');

  useEffect(() => {
    calculateCacheSize();
  }, []);

  async function calculateCacheSize() {
    try {
      const dir = (FileSystem.cacheDirectory ?? '') + 'audio/';
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        setCacheSize('0.0');
        return;
      }
      const files = await FileSystem.readDirectoryAsync(dir);
      let total = 0;
      for (const f of files) {
        const fi = await FileSystem.getInfoAsync(dir + f);
        if (fi.exists && (fi as any).size) total += (fi as any).size;
      }
      setCacheSize((total / 1024 / 1024).toFixed(1));
    } catch {
      setCacheSize('—');
    }
  }

  async function clearCache() {
    try {
      const dir = (FileSystem.cacheDirectory ?? '') + 'audio/';
      await FileSystem.deleteAsync(dir, { idempotent: true });
      setCacheSize('0.0');
    } catch {}
  }

  return (
    <View className="flex-1 bg-[#0e0c0a]">
      <LinearGradient
        colors={['rgba(255,92,46,0.10)', 'rgba(10,9,7,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View className="px-6 pt-2 pb-4">
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <Text
                style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#a08a78' }}
              >
                Preferences
              </Text>
              <View className="flex-row items-end mt-2">
                <Text
                  style={{ fontFamily: 'Manrope_300Light', fontSize: 48, lineHeight: 52 }}
                  className="text-cream"
                >
                  Settings
                </Text>
                <Text
                  style={{
                    fontFamily: 'Manrope_300Light',
                    fontSize: 48,
                    lineHeight: 52,
                  }}
                  className="text-amber"
                >
                  .
                </Text>
              </View>
            </MotiView>
          </View>

          <Section title="AUDIO">
            <Row
              icon={<Sliders color="#ff5c2e" size={18} strokeWidth={1.8} />}
              accent
              title="Equalizer"
              subtitle="Tune frequency response"
              meta="SOON"
            />
            <Divider />
            <Row
              icon={<Headphones color="#e8b67a" size={18} strokeWidth={1.8} />}
              title="Audio Quality"
              subtitle="Auto · adaptive bitrate"
              meta="HQ"
            />
          </Section>

          <Section title="STORAGE">
            <View
              className="flex-row items-center py-5"
              style={{ paddingHorizontal: 18 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(245,239,227,0.04)',
                }}
              >
                <Trash2 color="#a08a78" size={18} strokeWidth={1.8} />
              </View>
              <View className="flex-1 ml-3">
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 20,
                    lineHeight: 22,
                    color: '#f5efe3',
                  }}
                >
                  Cache
                </Text>
                <Text
                  style={{
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 12,
                    color: '#a08a78',
                    marginTop: 3,
                  }}
                >
                  {cacheSize} MB in use
                </Text>
              </View>
              <TouchableOpacity
                onPress={clearCache}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(245,239,227,0.10)',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 12,
                    color: '#a08a78',
                  }}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </Section>

          <Section title="ABOUT">
            <Row
              icon={<Info color="#a08a78" size={18} strokeWidth={1.8} />}
              title="VibeFlow"
              subtitle="Sound for the curious."
              meta="v1.0.0"
            />
          </Section>

          <View className="items-center mt-8">
            <Text
              style={{
                fontFamily: 'Manrope_300Light',
                fontSize: 18,
                color: '#3a322c',
              }}
            >
              Made with care
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-6 px-6">
      <View className="flex-row items-center mb-3">
        <View
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff5c2e' }}
        />
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 13,
            marginLeft: 8,
            color: '#a08a78',
          }}
        >
          {title}
        </Text>
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: 'rgba(245,239,227,0.06)',
            marginLeft: 10,
          }}
        />
      </View>
      <View
        style={{
          backgroundColor: '#1f1916',
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(245,239,227,0.06)',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  meta,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  meta: string;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="flex-row items-center py-5"
      style={{ paddingHorizontal: 18 }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent ? 'rgba(255,92,46,0.10)' : 'rgba(245,239,227,0.04)',
        }}
      >
        {icon}
      </View>
      <View className="flex-1 ml-3">
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 20,
            lineHeight: 22,
            color: '#f5efe3',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: 'Manrope_400Regular',
            fontSize: 11,
            color: '#a08a78',
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 12,
          color: accent ? '#ff5c2e' : '#5a4d42',
        }}
      >
        {meta}
      </Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: 'rgba(245,239,227,0.04)',
        marginHorizontal: 18,
      }}
    />
  );
}
