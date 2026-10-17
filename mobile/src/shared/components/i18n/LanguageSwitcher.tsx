import { CaretDown } from 'phosphor-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutRectangle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { setAppLocale, type AppLocale } from '@/i18n';
import { Brand, Spacing } from '@/shared/constants/theme';

const LOCALES: AppLocale[] = ['en', 'ru'];
const MENU_GAP = 8;
const MENU_MIN_WIDTH = 176;

function localeLabelKey(locale: AppLocale): `common.languageOptions.${AppLocale}` {
  return `common.languageOptions.${locale}`;
}

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const active = (i18n.language === 'ru' ? 'ru' : 'en') as AppLocale;

  const menuProgress = useSharedValue(0);
  const caretRotation = useSharedValue(0);

  const close = useCallback(() => {
    menuProgress.value = 0;
    caretRotation.value = 0;
    setOpen(false);
  }, [caretRotation, menuProgress]);

  const openMenu = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    menuProgress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    caretRotation.value = withTiming(180, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [open, caretRotation, menuProgress]);

  const pick = useCallback(
    (locale: AppLocale) => {
      void setAppLocale(locale);
      close();
    },
    [close],
  );

  const caretStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${caretRotation.value}deg` }],
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
    transform: [
      { translateY: (1 - menuProgress.value) * -6 },
      { scale: 0.96 + menuProgress.value * 0.04 },
    ],
  }));

  const menuTop = anchor ? anchor.y + anchor.height + MENU_GAP : 0;
  const menuRight = anchor ? screenWidth - anchor.x - anchor.width : Spacing.four;

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.changeLanguage')}
          accessibilityState={{ expanded: open }}
          onPress={openMenu}
          hitSlop={8}
          style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}>
          <Text style={styles.triggerText}>{t(localeLabelKey(active))}</Text>
          <Animated.View style={caretStyle}>
            <CaretDown size={12} color={AuthScreenTheme.textMuted} weight="bold" />
          </Animated.View>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="none" onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" />
          {anchor ? (
            <Animated.View
              style={[
                styles.menu,
                menuAnimatedStyle,
                {
                  top: menuTop,
                  right: menuRight,
                  minWidth: Math.max(anchor.width, MENU_MIN_WIDTH),
                },
              ]}>
              {LOCALES.map((locale, index) => {
                const isActive = locale === active;
                const isLast = index === LOCALES.length - 1;
                return (
                  <Pressable
                    key={locale}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => pick(locale)}
                    style={({ pressed }) => [
                      styles.row,
                      isActive && styles.rowActive,
                      pressed && styles.rowPressed,
                      !isLast && styles.rowBorder,
                    ]}>
                    <Text style={[styles.rowText, isActive && styles.rowTextActive]}>
                      {t(localeLabelKey(locale))}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingVertical: 6,
    paddingLeft: Spacing.two,
  },
  triggerPressed: {
    opacity: 0.72,
  },
  triggerText: {
    color: AuthScreenTheme.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  menu: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AuthScreenTheme.surfaceBorder,
    backgroundColor: 'rgba(33, 34, 37, 0.96)',
    overflow: 'hidden',
    shadowColor: Brand.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AuthScreenTheme.surfaceBorder,
  },
  rowActive: {
    backgroundColor: 'rgba(47, 158, 107, 0.14)',
  },
  rowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  rowTextActive: {
    color: AuthScreenTheme.accent,
    fontWeight: '600',
  },
});
