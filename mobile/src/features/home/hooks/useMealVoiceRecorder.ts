import { useCallback, useEffect, useState } from 'react';
import {
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { useAppTranslation } from '@/i18n';

import { MEAL_RECORDING_OPTIONS } from '@/features/home/constants/recording-options';
import type { GuardCheckResult } from '@/lib/guard-api';
import type { IntakeResult } from '@/lib/intake-api';
import {
  SttHttpError,
  SttNetworkError,
  transcribeRecording,
} from '@/lib/stt-api';

export type MealVoiceTranscriptionResult = {
  text: string;
  guard: GuardCheckResult | null;
  intake: IntakeResult | null;
};

type UseMealVoiceRecorderOptions = {
  onComplete?: (result: MealVoiceTranscriptionResult) => void;
};

export function useMealVoiceRecorder({ onComplete }: UseMealVoiceRecorderOptions = {}) {
  const { t } = useAppTranslation();
  const recorder = useAudioRecorder(MEAL_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 80);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void requestRecordingPermissionsAsync();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setError(t('home.voice.recordFailed'));
    }
  }, [recorder, t]);

  const stopAndTranscribe = useCallback(async () => {
    if (!recorderState.isRecording) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        throw new Error('no recording');
      }
      const apiResult = await transcribeRecording(uri);
      const text = apiResult.text.trim();
      if (!text) {
        setError(t('home.voice.emptyTranscript'));
        onComplete?.({ text: '', guard: null, intake: null });
        return;
      }

      let guard: GuardCheckResult | null = apiResult.guard ?? null;
      let intake: IntakeResult | null = null;

      if (!guard) {
        onComplete?.({ text, guard: null, intake: null });
        return;
      }

      if (guard.allowed) {
        if (apiResult.intake) {
          intake = apiResult.intake;
        }
      }

      onComplete?.({ text, guard, intake });
    } catch (e) {
      if (e instanceof SttNetworkError) {
        setError(t('home.voice.backendUnreachable', { url: e.baseUrl }));
      } else if (e instanceof SttHttpError && e.status >= 500) {
        setError(t('home.voice.transcribeFailed'));
      } else if (e instanceof SttHttpError) {
        setError(e.message || t('home.voice.transcribeFailed'));
      } else {
        setError(t('home.voice.transcribeFailed'));
      }
    } finally {
      setBusy(false);
    }
  }, [onComplete, recorder, recorderState.isRecording, t]);

  return {
    startRecording,
    stopAndTranscribe,
    isRecording: recorderState.isRecording,
    busy,
    error,
    durationMillis: recorderState.durationMillis,
    metering: recorderState.metering,
    clearError: () => setError(null),
  };
}
