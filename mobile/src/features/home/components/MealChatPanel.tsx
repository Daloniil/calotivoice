import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BowlFood } from 'phosphor-react-native';
import { useAppTranslation } from '@/i18n';

import { MealIntakeCard } from '@/features/home/components/MealIntakeCard';
import type { ChatMessage } from '@/features/home/types/chat-message';
import { i18n } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type Props = {
  messages: ChatMessage[];
};

/** Полноэкранная лента сообщений (между top bar и composer). */
export function MealChatPanel({ messages }: Props) {
  const { t } = useAppTranslation();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={messages.length === 0 ? styles.emptyContent : styles.messagesContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {messages.length === 0 ? (
        <View style={styles.emptyBlock}>
          <View style={styles.emptyIcon}>
            <BowlFood color={AuthScreenTheme.accent} size={32} weight="duotone" />
          </View>
          <Text style={styles.emptyTitle}>{t('home.chatEmptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('home.chatEmptyBody')}</Text>
        </View>
      ) : (
        messages.map((message) => <ChatBubble key={message.id} message={message} />)
      )}
    </ScrollView>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const { t } = useAppTranslation();

  if (message.role === 'user') {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowUser]}>
        <View style={[styles.bubble, styles.bubbleUser]}>
          <Text style={styles.bubbleText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  if (message.role === 'system' && message.kind === 'error') {
    return (
      <View style={styles.bubbleRow}>
        <View style={[styles.bubble, styles.bubbleError]}>
          <Text style={styles.errorText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  if (message.role === 'assistant' && message.kind === 'text') {
    return (
      <View style={styles.bubbleRow}>
        <View style={[styles.bubble, styles.bubbleAssistant]}>
          <Text style={styles.bubbleText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  if (message.role === 'assistant' && message.kind === 'status') {
    return (
      <View style={styles.bubbleRow}>
        <Text style={styles.statusText}>{message.text}</Text>
      </View>
    );
  }

  if (message.role === 'assistant' && message.kind === 'guard') {
    const { result } = message;
    return (
      <View style={styles.bubbleRow}>
        <View style={[styles.bubble, result.allowed ? styles.guardOk : styles.guardBad]}>
          <Text style={styles.bubbleText}>
            {result.allowed ? t('home.voice.guardPassed') : t('home.voice.guardFailed')}
          </Text>
          {!result.allowed && result.reason ? (
            <Text style={styles.guardDetail}>
              {i18n.exists(`home.voice.guardReason.${result.reason}`)
                ? t(`home.voice.guardReason.${result.reason}`)
                : t('home.voice.guardReasonUnknown', { code: result.reason })}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (message.role === 'assistant' && message.kind === 'intake') {
    return (
      <View style={styles.intakeWrap}>
        <MealIntakeCard result={message.result} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    gap: Spacing.two,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  emptyBlock: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(47, 158, 107, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyTitle: {
    color: AuthScreenTheme.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyBody: {
    color: AuthScreenTheme.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
    width: '100%',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: 'rgba(47, 158, 107, 0.22)',
    borderColor: 'rgba(61, 214, 140, 0.35)',
  },
  bubbleAssistant: {
    backgroundColor: AuthScreenTheme.surface,
    borderColor: AuthScreenTheme.surfaceBorder,
  },
  bubbleError: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.35)',
  },
  bubbleText: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    lineHeight: 22,
  },
  errorText: {
    color: AuthScreenTheme.error,
    fontSize: 15,
    lineHeight: 21,
  },
  statusText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  guardOk: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: 'rgba(52, 199, 89, 0.45)',
  },
  guardBad: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: 'rgba(255, 59, 48, 0.45)',
  },
  guardDetail: {
    marginTop: Spacing.one,
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  intakeWrap: {
    width: '100%',
  },
});
