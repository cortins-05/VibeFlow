import { useEffect, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '../../constants/theme';
import type { LyricLine } from '../../services/lyrics';

export default function LyricsView({
  lyrics,
  activeLyricIdx,
  height,
}: {
  lyrics: LyricLine[];
  activeLyricIdx: number;
  height: number;
}) {
  const { colors, fonts } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, activeLyricIdx - 2) * 56, animated: true });
  }, [activeLyricIdx]);

  return (
    <View
      style={{
        height,
        marginHorizontal: 20,
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <LinearGradient
        colors={['rgba(229,255,58,0.05)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, zIndex: 10 }}
        pointerEvents="none"
      />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 48, paddingHorizontal: 20 }}>
        {lyrics.map((line, i) => {
          const isActive = i === activeLyricIdx;
          const isPast = i < activeLyricIdx;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ width: 24, alignItems: 'center', paddingTop: isActive ? 6 : 10 }}>
                <View
                  style={{
                    width: isActive ? 8 : 4,
                    height: isActive ? 8 : 4,
                    borderRadius: isActive ? 4 : 2,
                    backgroundColor: isActive ? colors.accent : isPast ? colors.textFaint : colors.textDim,
                  }}
                />
                {i < lyrics.length - 1 ? (
                  <View
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 20,
                      backgroundColor: isPast ? 'rgba(229,255,58,0.15)' : colors.border,
                    }}
                  />
                ) : null}
              </View>
              <MotiView
                from={isActive ? { opacity: 0.6, scale: 0.95 } : undefined}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 260 }}
                style={{ flex: 1, paddingLeft: 12 }}
              >
                {isActive ? (
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: -2,
                      bottom: -2,
                      width: 2,
                      backgroundColor: colors.accent,
                      borderRadius: 1,
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  />
                ) : null}
                <Text
                  style={{
                    fontFamily: isActive ? fonts.sans : fonts.sansReg,
                    fontSize: isActive ? 22 : 15,
                    lineHeight: isActive ? 28 : 22,
                    color: isActive ? colors.text : isPast ? colors.textFaint : colors.textDim,
                    textAlign: 'left',
                    letterSpacing: isActive ? 0.3 : 0.1,
                  }}
                >
                  {line.text}
                </Text>
              </MotiView>
            </View>
          );
        })}
      </ScrollView>
      <LinearGradient
        colors={['transparent', 'rgba(11,12,11,0.85)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, zIndex: 10 }}
        pointerEvents="none"
      />
    </View>
  );
}
