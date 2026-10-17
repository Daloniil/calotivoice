import { GlobeHemisphereWest } from 'phosphor-react-native';
import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProfileBadge, ProfileMenuRow } from '@/features/profile/components/ProfileMenuRow';
import { setAppLocale, type AppLocale } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

const LOCALES: AppLocale[] = ['en', 'ru'];

export function ProfileLanguageRow() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = (i18n.language === 'ru' ? 'ru' : 'en') as AppLocale;
  const badge = t(`common.localeBadge.${active}`);

  const pick = useCallback(async (locale: AppLocale) => {
    await setAppLocale(locale);
    setOpen(false);
  }, []);

  return (
    <>
      <ProfileMenuRow
        IconComponent={GlobeHemisphereWest}
        iconColor="#5AC8FA"
        iconTint="rgba(90, 200, 250, 0.18)"
        label={t('profile.menu.appLanguage')}
        trailing={<ProfileBadge text={badge} />}
        onPress={() => setOpen(true)}
      />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('common.changeLanguage')}</Text>
            {LOCALES.map((locale) => (
              <Pressable
                key={locale}
                accessibilityRole="button"
                onPress={() => void pick(locale)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <Text style={[styles.optionText, locale === active && styles.optionActive]}>
                  {t(`common.languageOptions.${locale}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    borderRadius: 20,
    backgroundColor: 'rgba(33, 34, 37, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  sheetTitle: {
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.one,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  optionPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionText: {
    color: AuthScreenTheme.text,
    fontSize: 17,
    fontWeight: '500',
  },
  optionActive: {
    color: AuthScreenTheme.accent,
    fontWeight: '700',
  },
});
