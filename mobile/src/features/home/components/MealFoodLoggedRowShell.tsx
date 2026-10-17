import * as Haptics from 'expo-haptics';
import { Trash } from 'phosphor-react-native';
import { useCallback, useRef, type ReactNode } from 'react';
import { ActionSheetIOS, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { useAppTranslation } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';

const DELETE_WIDTH = 88;

type Props = {
  foodName: string;
  onDelete: () => void;
  onOpenDetail: () => void;
  onEditPortion: () => void;
  children: ReactNode;
};

export function MealFoodLoggedRowShell({
  foodName,
  onDelete,
  onOpenDetail,
  onEditPortion,
  children,
}: Props) {
  const { t } = useAppTranslation();
  const swipeRef = useRef<Swipeable>(null);

  const fireDelete = useCallback(() => {
    swipeRef.current?.close();
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    onDelete();
  }, [onDelete]);

  const renderRightActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = progress.interpolate({
        inputRange: [0, 0.35, 1],
        outputRange: [0.55, 0.92, 1],
        extrapolate: 'clamp',
      });
      const opacity = progress.interpolate({
        inputRange: [0, 0.2, 1],
        outputRange: [0, 0.85, 1],
        extrapolate: 'clamp',
      });
      const translateX = dragX.interpolate({
        inputRange: [-DELETE_WIDTH * 1.35, 0],
        outputRange: [0, DELETE_WIDTH],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View style={[styles.deleteSlot, { opacity, transform: [{ translateX }] }]}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.diary.foodSearch.removeEntryA11y', { name: foodName })}
              onPress={fireDelete}
              style={({ pressed }) => [styles.deleteAction, pressed && styles.deletePressed]}>
              <Trash color="#fff" size={22} weight="bold" />
              <Text style={styles.deleteLabel}>{t('home.diary.foodSearch.contextDelete')}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      );
    },
    [fireDelete, foodName, t],
  );

  const showContextMenu = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const options = [
      t('home.diary.foodSearch.contextDetails'),
      t('home.diary.foodSearch.contextEditPortion'),
      t('home.diary.foodSearch.contextDelete'),
      t('profile.cancel'),
    ];
    const cancelButtonIndex = 3;
    const destructiveButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, destructiveButtonIndex, title: foodName },
        (index) => {
          if (index === 0) {
            onOpenDetail();
          } else if (index === 1) {
            onEditPortion();
          } else if (index === 2) {
            fireDelete();
          }
        },
      );
    }
  }, [fireDelete, foodName, onEditPortion, onOpenDetail, t]);

  return (
    <View style={styles.shell}>
      <Pressable onLongPress={showContextMenu} delayLongPress={380} style={styles.longPressHost}>
        <Swipeable
          ref={swipeRef}
          friction={2}
          overshootRight={false}
          rightThreshold={DELETE_WIDTH * 0.45}
          renderRightActions={renderRightActions}>
          <View style={styles.rowSurface} collapsable={false}>
            {children}
          </View>
        </Swipeable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    alignSelf: 'stretch',
  },
  longPressHost: {
    width: '100%',
    alignSelf: 'stretch',
  },
  rowSurface: {
    width: '100%',
    alignSelf: 'stretch',
  },
  deleteSlot: {
    width: DELETE_WIDTH,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteAction: {
    width: DELETE_WIDTH,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: AuthScreenTheme.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 6,
  },
  deletePressed: {
    opacity: 0.92,
  },
  deleteLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
