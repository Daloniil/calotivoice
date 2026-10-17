import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Microphone, Stop } from 'phosphor-react-native';
import {
  MEAL_VOICE_EXAMPLE_PHRASES,
  resolveAppLocale,
} from '@/features/home/constants/dynamic-placeholder-phrases';
import { RecordingLevelMeter } from '@/features/home/components/RecordingLevelMeter';
import { useAppTranslation } from '@/i18n';
import { TypewriterPlaceholderText } from '@/shared/components/TypewriterPlaceholderText';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';
import { useRotatingTypewriter } from '@/shared/hooks/use-rotating-typewriter';

export type HomeMealInputBarMode = 'idle' | 'recording' | 'processing';

type Props = {
  mode: HomeMealInputBarMode;
  durationMillis: number;
  metering?: number;
  /** Тап по строке — открыть чат (дашборд остаётся под overlay). */
  onComposerPress: () => void;
  onMicPress: () => void;
  micDisabled?: boolean;
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Composer внизу экрана: pill + микрофон (ChatGPT / iMessage). */
export function HomeMealInputBar({
  mode,
  durationMillis,
  metering,
  onComposerPress,
  onMicPress,
  micDisabled = false,
}: Props) {
  const { t, i18n } = useAppTranslation();
  const locale = resolveAppLocale(i18n.language);
  const showMealTypewriter = mode === 'idle';
  const { text: mealExampleText, showCaret: mealShowCaret } = useRotatingTypewriter({
    phrases: MEAL_VOICE_EXAMPLE_PHRASES[locale],
    enabled: showMealTypewriter,
  });

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.searchOpenChatA11y')}
        disabled={mode !== 'idle'}
        onPress={onComposerPress}
        style={({ pressed }) => [styles.pill, mode !== 'idle' && styles.pillExpanded, pressed && mode === 'idle' && styles.pressed]}>
        {mode === 'idle' ? (
          <TypewriterPlaceholderText
            text={mealExampleText}
            showCaret={mealShowCaret}
            style={styles.placeholder}
            numberOfLines={1}
          />
        ) : null}

        {mode === 'recording' ? (
          <View style={styles.recordingMain}>
            <View style={styles.recordingLeft}>
              <View style={styles.recDot} />
              <Text style={styles.timer}>{formatDuration(durationMillis)}</Text>
            </View>
            <RecordingLevelMeter metering={metering} active />
          </View>
        ) : null}

        {mode === 'processing' ? (
          <View style={styles.processingRow}>
            <ActivityIndicator color={AuthScreenTheme.accent} size="small" />
            <Text style={styles.processingText}>{t('home.voice.processing')}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mode === 'recording' ? t('home.voice.stopA11y') : t('home.voice.startA11y')}
        disabled={micDisabled || mode === 'processing'}
        onPress={onMicPress}
        style={({ pressed }) => [
          styles.micBtn,
          mode === 'recording' && styles.micBtnRecording,
          pressed && !micDisabled && styles.pressed,
          (micDisabled || mode === 'processing') && styles.micDisabled,
        ]}>
        {mode === 'recording' ? (
          <Stop color={AuthScreenTheme.text} size={22} weight="fill" />
        ) : (
          <Microphone
            color={mode === 'processing' ? AuthScreenTheme.textMuted : AuthScreenTheme.text}
            size={22}
            weight="fill"
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  pill: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 24,
    backgroundColor: 'rgba(28, 28, 30, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillExpanded: {
    flex: 1,
  },
  placeholder: {
    color: AuthScreenTheme.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  recordingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 0,
  },
  recordingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AuthScreenTheme.error,
  },
  timer: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 44,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  processingText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(28, 28, 30, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnRecording: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
    borderColor: 'rgba(255, 69, 58, 0.45)',
  },
  micDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
  },
});
