import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { i18n } from '@/i18n';
import type { Sex } from '@/lib/profile/types';

export type AppleHealthSnapshot = {
  birthDate?: string;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
};

const HEALTH_READ_TYPES = [
  'HKQuantityTypeIdentifierHeight',
  'HKQuantityTypeIdentifierBodyMass',
  'HKCharacteristicTypeIdentifierDateOfBirth',
  'HKCharacteristicTypeIdentifierBiologicalSex',
] as const;

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** HealthKit через Nitro — только в dev/production build, не в Expo Go. */
async function loadHealthKitModule() {
  if (Platform.OS !== 'ios' || isExpoGo()) {
    return null;
  }
  try {
    return await import('@kingstinct/react-native-healthkit');
  } catch {
    return null;
  }
}

function mapBiologicalSex(value: number): Sex | undefined {
  switch (value) {
    case 1:
      return 'female';
    case 2:
      return 'male';
    case 3:
      return 'other';
    default:
      return undefined;
  }
}

function metersToCm(meters: number) {
  return Math.round(meters * 1000) / 10;
}

export async function isAppleHealthSupported(): Promise<boolean> {
  if (Platform.OS !== 'ios' || isExpoGo()) return false;
  const HealthKit = await loadHealthKitModule();
  if (!HealthKit) return false;
  try {
    return await HealthKit.isHealthDataAvailableAsync();
  } catch {
    return false;
  }
}

export async function readAppleHealthProfile(): Promise<AppleHealthSnapshot> {
  if (Platform.OS !== 'ios') {
    throw new Error(i18n.t('health.iosOnly'));
  }
  if (isExpoGo()) {
    throw new Error(i18n.t('health.expoGo'));
  }

  const HealthKit = await loadHealthKitModule();
  if (!HealthKit) {
    throw new Error(i18n.t('health.comingSoon'));
  }

  const available = await HealthKit.isHealthDataAvailableAsync();
  if (!available) {
    throw new Error(i18n.t('health.comingSoon'));
  }

  await HealthKit.requestAuthorization({ toRead: [...HEALTH_READ_TYPES] });

  const snapshot: AppleHealthSnapshot = {};

  const biologicalSex = await HealthKit.getBiologicalSexAsync();
  const mappedSex = mapBiologicalSex(biologicalSex);
  if (mappedSex) snapshot.sex = mappedSex;

  const dob = await HealthKit.getDateOfBirthAsync();
  if (dob) snapshot.birthDate = dob.toISOString().slice(0, 10);

  const heightSample = await HealthKit.getMostRecentQuantitySample('HKQuantityTypeIdentifierHeight');
  if (heightSample?.quantity != null) {
    const unit = heightSample.unit.toLowerCase();
    if (unit === 'm' || unit === 'meter' || unit === 'meters') {
      snapshot.heightCm = metersToCm(heightSample.quantity);
    } else if (unit === 'cm') {
      snapshot.heightCm = heightSample.quantity;
    } else if (unit === 'in' || unit === 'inch' || unit === 'inches') {
      snapshot.heightCm = Math.round(heightSample.quantity * 2.54 * 10) / 10;
    }
  }

  const weightSample = await HealthKit.getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass');
  if (weightSample?.quantity != null) {
    const unit = weightSample.unit.toLowerCase();
    if (unit === 'kg') {
      snapshot.weightKg = weightSample.quantity;
    } else if (unit === 'lb' || unit === 'lbs') {
      snapshot.weightKg = Math.round(weightSample.quantity * 0.453592 * 10) / 10;
    }
  }

  if (!snapshot.sex && !snapshot.birthDate && !snapshot.heightCm && !snapshot.weightKg) {
    throw new Error(i18n.t('health.noData'));
  }

  return snapshot;
}
