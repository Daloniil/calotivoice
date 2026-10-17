import { CaretDown } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type ProfileIdentityCardProps = {
  displayName: string;
  email: string;
};

export function ProfileIdentityCard({ displayName, email }: ProfileIdentityCardProps) {
  const initial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>{initial}</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
      </View>
      <View style={styles.chevronBtn}>
        <CaretDown color={AuthScreenTheme.textMuted} size={16} weight="bold" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 22,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 193, 7, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFC107',
    fontSize: 22,
    fontWeight: '700',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: AuthScreenTheme.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  email: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
  },
  chevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
