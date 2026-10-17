import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'phosphor-react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MealChatPanel } from '@/features/home/components/MealChatPanel';
import type { ChatMessage } from '@/features/home/types/chat-message';
import { useAppTranslation } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
};

const OPEN_MS = 320;
const CLOSE_MS = 240;

/** Отдельный слой чата поверх дашборда (composer остаётся снаружи). */
export function MealChatOverlay({ open, onClose, messages }: Props) {
  const { t } = useAppTranslation();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
    }

    progress.value = withTiming(
      open ? 1 : 0,
      {
        duration: open ? OPEN_MS : CLOSE_MS,
        easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished && !open) {
          runOnJS(setMounted)(false);
        }
      },
    );
  }, [open, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [36, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.96, 1]) },
    ],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <View pointerEvents={open ? 'auto' : 'none'} style={styles.host}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.chatCloseA11y')}
          onPress={onClose}
          style={styles.backdropPress}
        />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('home.chatTitle')}</Text>
            <Text style={styles.subtitle}>{t('home.chatSubtitle')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.chatCloseA11y')}
            hitSlop={10}
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
            <X color={AuthScreenTheme.textMuted} size={18} weight="bold" />
          </Pressable>
        </View>
        <MealChatPanel messages={messages} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    marginTop: Spacing.two,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(16, 16, 18, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerText: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.two,
  },
  title: {
    color: AuthScreenTheme.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  pressed: {
    opacity: 0.85,
  },
});
