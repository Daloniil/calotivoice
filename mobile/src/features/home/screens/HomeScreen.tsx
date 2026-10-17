import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGradientBackground } from '@/features/auth/components/AuthGradientBackground';
import { HomeDashboard } from '@/features/home/components/HomeDashboard';
import { useHomeChromeBridge } from '@/features/home/context/home-chrome-bridge';
import { isSameDay, startOfDay } from '@/features/home/lib/week-calendar';
import { HomeMealInputBar, type HomeMealInputBarMode } from '@/features/home/components/HomeMealInputBar';
import { MealChatOverlay } from '@/features/home/components/MealChatOverlay';
import { useMealVoiceRecorder } from '@/features/home/hooks/useMealVoiceRecorder';
import type { ChatMessage } from '@/features/home/types/chat-message';
import type { GuardCheckResult } from '@/lib/guard-api';
import type { IntakeResult } from '@/lib/intake-api';
import { useAppTranslation } from '@/i18n';
import { useAppLanguageTopInset } from '@/shared/components/i18n/AppLanguageChrome';
import { Spacing } from '@/shared/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';

function nextMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Дашборд + composer; чат открывается отдельным слоем (как ChatGPT). */
export function HomeScreen() {
  const { t } = useAppTranslation();
  const languageTopInset = useAppLanguageTopInset();
  const { session, needsWelcome } = useAuth();
  const { onboardingComplete } = useProfile();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [diaryDate, setDiaryDate] = useState(() => startOfDay(new Date()));
  const { setTodayJump } = useHomeChromeBridge();
  const today = useMemo(() => startOfDay(new Date()), []);
  const showTodayJump = !isSameDay(diaryDate, today);

  useEffect(() => {
    if (!showTodayJump) {
      setTodayJump(null);
      return;
    }
    setTodayJump({
      onPress: () => setDiaryDate(today),
    });
    return () => setTodayJump(null);
  }, [showTodayJump, setTodayJump, today]);

  const openChat = useCallback(() => setChatOpen(true), []);

  const handleVoiceComplete = useCallback(
    (result: { text: string; guard: GuardCheckResult | null; intake: IntakeResult | null }) => {
      setChatOpen(true);
      setMessages((prev) => {
        const base = prev.filter((m) => !(m.role === 'assistant' && m.kind === 'status'));
        const next: ChatMessage[] = [...base];

        if (result.text) {
          next.push({ id: nextMessageId(), role: 'user', text: result.text });
        }

        if (!result.text) {
          return next;
        }

        if (!result.guard) {
          next.push({
            id: nextMessageId(),
            role: 'assistant',
            kind: 'text',
            text: t('home.voice.guardUnavailable'),
          });
          return next;
        }

        next.push({ id: nextMessageId(), role: 'assistant', kind: 'guard', result: result.guard });

        if (result.guard.allowed && result.intake) {
          next.push({ id: nextMessageId(), role: 'assistant', kind: 'intake', result: result.intake });
        } else if (result.guard.allowed && !result.intake) {
          next.push({
            id: nextMessageId(),
            role: 'assistant',
            kind: 'text',
            text: t('home.voice.intakeUnavailable'),
          });
        }

        return next;
      });
    },
    [t],
  );

  const voice = useMealVoiceRecorder({ onComplete: handleVoiceComplete });

  useEffect(() => {
    if (!voice.error) {
      return;
    }
    setChatOpen(true);
    setMessages((prev) => [
      ...prev.filter((m) => !(m.role === 'assistant' && m.kind === 'status')),
      { id: nextMessageId(), role: 'system', kind: 'error', text: voice.error! },
    ]);
  }, [voice.error]);

  const inputMode: HomeMealInputBarMode = voice.busy
    ? 'processing'
    : voice.isRecording
      ? 'recording'
      : 'idle';

  const inputBar = useMemo(
    () => (
      <HomeMealInputBar
        mode={inputMode}
        durationMillis={voice.durationMillis}
        metering={voice.metering}
        micDisabled={voice.busy}
        onComposerPress={openChat}
        onMicPress={() => {
          if (voice.busy) {
            return;
          }
          if (voice.isRecording) {
            setChatOpen(true);
            setMessages((prev) => [
              ...prev,
              {
                id: nextMessageId(),
                role: 'assistant',
                kind: 'status',
                text: t('home.voice.processing'),
              },
            ]);
            void voice.stopAndTranscribe();
            return;
          }
          void voice.startRecording();
        }}
      />
    ),
    [
      inputMode,
      openChat,
      t,
      voice.busy,
      voice.durationMillis,
      voice.isRecording,
      voice.metering,
      voice.startRecording,
      voice.stopAndTranscribe,
    ],
  );

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (needsWelcome) {
    return <Redirect href="/onboarding" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <AuthGradientBackground style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={{ height: languageTopInset }} />

        <View style={styles.stage}>
          <HomeDashboard selectedDate={diaryDate} onSelectedDateChange={setDiaryDate} />
          <MealChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} messages={messages} />
        </View>

        <View style={styles.composerDock}>
          <View style={styles.composerHairline} />
          {inputBar}
        </View>
      </SafeAreaView>
    </AuthGradientBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  stage: {
    flex: 1,
    position: 'relative',
  },
  composerDock: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 30,
  },
  composerHairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.two,
    marginHorizontal: -Spacing.four,
  },
});
