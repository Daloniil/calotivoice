import type { Icon } from 'phosphor-react-native';
import { CaretRight } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type ProfileMenuRowProps = {
  IconComponent: Icon;
  iconColor: string;
  iconTint: string;
  label: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  /** Extra block below label (e.g. download description + button). */
  footer?: ReactNode;
  alignTop?: boolean;
};

export function ProfileMenuRow({
  IconComponent,
  iconColor,
  iconTint,
  label,
  subtitle,
  trailing,
  onPress,
  destructive = false,
  showChevron = Boolean(onPress),
  footer,
  alignTop = Boolean(footer),
}: ProfileMenuRowProps) {
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: iconTint }]}>
        <IconComponent color={iconColor} size={22} weight="duotone" />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.label, destructive && styles.destructiveLabel]} numberOfLines={2}>
          {label}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {footer}
      </View>
      <View style={styles.trailing}>
        {trailing}
        {showChevron && onPress ? (
          <CaretRight color={AuthScreenTheme.textMuted} size={18} weight="bold" />
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, alignTop && styles.rowTop, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, alignTop && styles.rowTop]}>{content}</View>;
}

export function ProfileBadge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

export function ProfileTrailingText({ text }: { text: string }) {
  return <Text style={styles.trailingText}>{text}</Text>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  rowTop: {
    alignItems: 'flex-start',
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: AuthScreenTheme.text,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  destructiveLabel: {
    color: AuthScreenTheme.error,
  },
  subtitle: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    lineHeight: 19,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  trailingText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
