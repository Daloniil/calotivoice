import { RecordingPresets } from 'expo-audio';

/** Запись с metering для визуализации уровня звука в UI. */
export const MEAL_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
} as const;
