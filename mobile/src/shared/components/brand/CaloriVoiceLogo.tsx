import { BowlFood, Microphone, Waveform } from 'phosphor-react-native';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { Brand } from '@/shared/constants/theme';
import { useColorScheme } from '@/shared/hooks/use-color-scheme';

type CaloriVoiceLogoProps = {
  size?: number;
  style?: ViewStyle;
  /** Тёмный экран входа — всегда «night»-вариант mark. */
  forceDark?: boolean;
};

/**
 * Mark: Phosphor Icons (MIT) — Microphone, Waveform, BowlFood.
 * https://github.com/phosphor-icons/core/blob/main/LICENSE
 */
export function CaloriVoiceLogo({ size = 72, style, forceDark }: CaloriVoiceLogoProps) {
  const scheme = useColorScheme();
  const isDark = forceDark || scheme === 'dark';
  const radius = Math.round(size * 0.24);
  const micSize = Math.round(size * 0.38);
  const waveSize = Math.round(size * 0.62);
  const bowlSize = Math.round(size * 0.22);

  const surface = isDark ? '#1A2E24' : Brand.accentSoft;
  const ring = isDark ? 'rgba(47, 158, 107, 0.45)' : 'rgba(47, 158, 107, 0.18)';

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: surface,
          borderColor: ring,
        },
        Platform.OS === 'ios' && styles.shadowIos,
        Platform.OS === 'android' && styles.shadowAndroid,
        style,
      ]}>
      <View style={styles.waveLayer} pointerEvents="none">
        <Waveform size={waveSize} color={Brand.accent} weight="duotone" style={styles.wave} />
      </View>

      <View style={styles.micLayer} pointerEvents="none">
        <Microphone size={micSize} color={Brand.accent} weight="fill" />
      </View>

      <View
        style={[
          styles.bowlBadge,
          {
            borderRadius: bowlSize * 0.45,
            backgroundColor: isDark ? 'rgba(33, 34, 37, 0.95)' : 'rgba(255, 255, 255, 0.94)',
          },
        ]}
        pointerEvents="none">
        <BowlFood size={bowlSize} color={Brand.accent} weight="fill" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  shadowIos: {
    shadowColor: Brand.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  shadowAndroid: {
    elevation: 6,
  },
  waveLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.42,
    transform: [{ translateY: 4 }],
  },
  wave: {
    transform: [{ rotate: '-8deg' }],
  },
  micLayer: {
    zIndex: 2,
    transform: [{ translateY: -2 }],
  },
  bowlBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    zIndex: 3,
    padding: 3,
  },
});
