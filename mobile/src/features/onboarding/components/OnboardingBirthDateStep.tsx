import DateTimePicker from '@react-native-community/datetimepicker';
import { useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppleHealthFillButton } from '@/features/onboarding/components/AppleHealthFillButton';
import { playOnboardingWheelTick } from '@/shared/lib/onboarding-wheel-feedback';
import type { AppleHealthSnapshot } from '@/lib/health/apple-health';
import { Spacing } from '@/shared/constants/theme';

const IOS_DATE_SPINNER_HEIGHT = 216;

type OnboardingBirthDateStepProps = {
  birthDate: Date;
  onBirthDateChange: (date: Date) => void;
  onHealthImported: (data: AppleHealthSnapshot) => void;
};

export function OnboardingBirthDateStep({
  birthDate,
  onBirthDateChange,
  onHealthImported,
}: OnboardingBirthDateStepProps) {
  const lastTickMsRef = useRef(birthDate.getTime());

  return (
    <View style={styles.stack}>
      <View style={[styles.pickerSlot, Platform.OS === 'ios' && styles.pickerSlotIos]}>
        <DateTimePicker
          value={birthDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          themeVariant="dark"
          onChange={(_, date) => {
            if (!date) {
              return;
            }
            const nextMs = date.getTime();
            if (nextMs !== lastTickMsRef.current) {
              lastTickMsRef.current = nextMs;
              // iOS spinner уже играет системный wheel-click; тот же наш tick — на Android и на линейках.
              if (Platform.OS !== 'ios') {
                playOnboardingWheelTick();
              }
            }
            onBirthDateChange(date);
          }}
          style={styles.datePicker}
        />
      </View>

      <AppleHealthFillButton onImported={onHealthImported} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.three,
  },
  pickerSlot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickerSlotIos: {
    minHeight: IOS_DATE_SPINNER_HEIGHT,
  },
  datePicker: {
    width: '100%',
  },
});
