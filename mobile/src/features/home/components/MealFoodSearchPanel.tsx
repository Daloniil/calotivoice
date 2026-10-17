import { MagnifyingGlass, Plus, X } from 'phosphor-react-native';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { MealFoodAddedCelebration } from '@/features/home/components/MealFoodAddedCelebration';
import { MealFoodCreateModal } from '@/features/home/components/MealFoodCreateModal';
import {
  FOOD_SEARCH_EXAMPLE_PHRASES,
  resolveAppLocale,
} from '@/features/home/constants/dynamic-placeholder-phrases';
import { useOpenFoodSearch } from '@/features/home/hooks/useOpenFoodSearch';
import { formatMacroCell, scalePer100g, sumEntryKcal } from '@/features/home/lib/format-food-macros';
import type { MealFoodItem, MealFoodLogEntry } from '@/features/home/types/meal-food';
import { useAppTranslation } from '@/i18n';
import { TypewriterPlaceholderText } from '@/shared/components/TypewriterPlaceholderText';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';
import { useRotatingTypewriter } from '@/shared/hooks/use-rotating-typewriter';

/** Сколько строк результатов видно без прокрутки. */
const VISIBLE_RESULT_ROWS = 5;
const RESULT_ROW_MIN_HEIGHT = 56;
const RESULT_SEPARATOR = Spacing.two + 4;
const RESULTS_LIST_MAX_HEIGHT =
  VISIBLE_RESULT_ROWS * RESULT_ROW_MIN_HEIGHT + (VISIBLE_RESULT_ROWS - 1) * RESULT_SEPARATOR;

const DEFAULT_GRAMS = '100';
const PORTION_INPUT_ACCESSORY_ID = 'meal-food-portion-done';
const SEARCH_INPUT_LINE_HEIGHT = 22;

function parseGrams(raw: string): number {
  const n = Number(raw.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) {
    return 100;
  }
  return Math.round(n);
}

type Props = {
  entries: MealFoodLogEntry[];
  onAdd: (entry: MealFoodLogEntry) => void;
  onRemoveEntry: (index: number) => void;
  onUpdateEntryGrams: (index: number, grams: number) => void;
  onOpenEntryDetail: (entry: MealFoodLogEntry) => void;
};

export function MealFoodSearchPanel({
  entries,
  onAdd,
  onRemoveEntry,
  onUpdateEntryGrams,
  onOpenEntryDetail,
}: Props) {
  const { t, i18n } = useAppTranslation();
  const locale = resolveAppLocale(i18n.language);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingFood, setPendingFood] = useState<MealFoodItem | null>(null);
  const [gramsText, setGramsText] = useState(DEFAULT_GRAMS);
  const [addedBurstKey, setAddedBurstKey] = useState(0);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);
  const [entryGramsText, setEntryGramsText] = useState('');
  const portionInputRef = useRef<TextInput>(null);
  const entryPortionInputRef = useRef<TextInput>(null);
  const skipBlurCommitRef = useRef(false);
  const skipEntryBlurCommitRef = useRef(false);
  const editingEntryIndexRef = useRef<number | null>(null);
  const entryGramsTextRef = useRef(entryGramsText);
  const commitInFlightRef = useRef(false);
  const pendingFoodRef = useRef(pendingFood);
  const gramsTextRef = useRef(gramsText);
  const { items, loading, loadingMore, error, hasMore, loadMore } = useOpenFoodSearch(query);
  const showSearchTypewriter = query.length === 0 && !searchFocused;
  const { text: searchExampleText, showCaret: searchShowCaret } = useRotatingTypewriter({
    phrases: FOOD_SEARCH_EXAMPLE_PHRASES[locale],
    enabled: showSearchTypewriter,
  });

  useEffect(() => {
    pendingFoodRef.current = pendingFood;
  }, [pendingFood]);

  useEffect(() => {
    gramsTextRef.current = gramsText;
  }, [gramsText]);

  useEffect(() => {
    editingEntryIndexRef.current = editingEntryIndex;
  }, [editingEntryIndex]);

  useEffect(() => {
    entryGramsTextRef.current = entryGramsText;
  }, [entryGramsText]);

  useEffect(() => {
    if (editingEntryIndex == null) {
      return;
    }
    const timer = setTimeout(() => entryPortionInputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [editingEntryIndex]);

  useEffect(() => {
    if (!pendingFood) {
      return;
    }
    setGramsText(DEFAULT_GRAMS);
    const timer = setTimeout(() => portionInputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [pendingFood?.id]);

  const commitPending = useCallback(() => {
    const food = pendingFoodRef.current;
    if (!food || commitInFlightRef.current) {
      return;
    }
    commitInFlightRef.current = true;
    const grams = parseGrams(gramsTextRef.current);
    pendingFoodRef.current = null;
    onAdd({ food, grams });
    setPendingFood(null);
    setEditingEntryIndex(null);
    setGramsText(DEFAULT_GRAMS);
    setQuery('');
    setAddedBurstKey((key) => key + 1);
    commitInFlightRef.current = false;
  }, [onAdd]);

  const commitPendingFromBlur = useCallback(() => {
    if (skipBlurCommitRef.current || !pendingFoodRef.current) {
      return;
    }
    commitPending();
  }, [commitPending]);

  const dismissPending = useCallback(() => {
    skipBlurCommitRef.current = true;
    pendingFoodRef.current = null;
    setPendingFood(null);
    setGramsText(DEFAULT_GRAMS);
    Keyboard.dismiss();
    setTimeout(() => {
      skipBlurCommitRef.current = false;
    }, 300);
  }, []);

  const armDismissWithoutCommit = useCallback(() => {
    skipBlurCommitRef.current = true;
  }, []);

  const startPending = useCallback((food: MealFoodItem) => {
    setEditingEntryIndex(null);
    setQuery('');
    Keyboard.dismiss();
    setPendingFood(food);
  }, []);

  const commitEntryGrams = useCallback(() => {
    const index = editingEntryIndexRef.current;
    if (index == null) {
      return;
    }
    const grams = parseGrams(entryGramsTextRef.current);
    onUpdateEntryGrams(index, grams);
    editingEntryIndexRef.current = null;
    setEditingEntryIndex(null);
  }, [onUpdateEntryGrams]);

  const commitEntryGramsFromBlur = useCallback(() => {
    if (skipEntryBlurCommitRef.current || editingEntryIndexRef.current == null) {
      return;
    }
    commitEntryGrams();
  }, [commitEntryGrams]);

  const startEditEntry = useCallback(
    (index: number, currentGrams: number) => {
      if (pendingFoodRef.current) {
        return;
      }
      setEditingEntryIndex(index);
      setEntryGramsText(String(currentGrams));
    },
    [],
  );

  const removeEntryAt = useCallback(
    (index: number) => {
      skipEntryBlurCommitRef.current = true;
      if (editingEntryIndexRef.current === index) {
        editingEntryIndexRef.current = null;
        setEditingEntryIndex(null);
      }
      onRemoveEntry(index);
      Keyboard.dismiss();
      setTimeout(() => {
        skipEntryBlurCommitRef.current = false;
      }, 300);
    },
    [onRemoveEntry],
  );

  const handleCreateSave = useCallback(
    (food: MealFoodItem) => {
      startPending(food);
    },
    [startPending],
  );

  const showFoodTable = pendingFood != null || entries.length > 0;

  return (
    <View style={styles.wrap}>
      <MealFoodAddedCelebration burstKey={addedBurstKey} />
      {showFoodTable ? (
        <View style={styles.foodTable}>
          <MealFoodTableHeader />
          {pendingFood ? (
            <MealFoodTableRow
              food={pendingFood}
              gramsText={gramsText}
              onChangeGrams={setGramsText}
              portionInputRef={portionInputRef}
              onConfirmPortion={commitPending}
              onCommitFromBlur={commitPendingFromBlur}
              onDismissPressIn={armDismissWithoutCommit}
              onDismiss={dismissPending}
              editing
            />
          ) : null}
          {entries.map((entry, index) => {
            const editingPortion = editingEntryIndex === index;
            return editingPortion ? (
              <MealFoodTableRow
                key={`${entry.food.id}-${index}`}
                food={entry.food}
                gramsText={entryGramsText}
                onChangeGrams={setEntryGramsText}
                portionInputRef={entryPortionInputRef}
                onConfirmPortion={commitEntryGrams}
                onCommitFromBlur={commitEntryGramsFromBlur}
                onDismissPressIn={() => {
                  skipEntryBlurCommitRef.current = true;
                }}
                onDismiss={() => removeEntryAt(index)}
                onOpenDetail={() => onOpenEntryDetail(entry)}
                editingEntry
              />
            ) : (
              <MealFoodTableRow
                key={`${entry.food.id}-${index}`}
                food={entry.food}
                grams={entry.grams}
                onRemove={() => removeEntryAt(index)}
                onOpenDetail={() => onOpenEntryDetail(entry)}
                onEditPortion={() => startEditEntry(index, entry.grams)}
              />
            );
          })}
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <MagnifyingGlass color="rgba(255,255,255,0.35)" size={18} weight="bold" />
          <View style={styles.searchInputWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder=""
              accessibilityLabel={t('home.diary.foodSearch.placeholder')}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {showSearchTypewriter ? (
              <View pointerEvents="none" style={styles.searchGhost}>
                <TypewriterPlaceholderText
                  prefix={t('home.diary.foodSearch.examplePrefix')}
                  text={searchExampleText}
                  showCaret={searchShowCaret}
                  style={styles.searchGhostText}
                  prefixStyle={styles.searchGhostPrefix}
                  numberOfLines={1}
                />
              </View>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.diary.foodSearch.clearA11y')}
            accessibilityState={{ disabled: query.length === 0 }}
            disabled={query.length === 0}
            hitSlop={8}
            onPress={() => setQuery('')}
            style={styles.searchClearBtn}>
            <X
              color={query.length > 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}
              size={16}
              weight="bold"
            />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCreateOpen(true)}
          style={({ pressed }) => [styles.createBtn, pressed && styles.createBtnPressed]}>
          <Plus color={AuthScreenTheme.text} size={16} weight="bold" />
          <Text style={styles.createBtnText}>{t('home.diary.foodSearch.create')}</Text>
        </Pressable>
      </View>

      {query.trim().length >= 2 ? (
        <View style={styles.results}>
          {loading ? (
            <ActivityIndicator color={AuthScreenTheme.accent} style={styles.loader} />
          ) : error ? (
            <Text style={styles.hint}>{t('home.diary.foodSearch.error')}</Text>
          ) : items.length === 0 ? (
            <Text style={styles.hint}>{t('home.diary.foodSearch.noResults')}</Text>
          ) : (
            <FoodSearchResultsList
              items={items}
              onPick={startPending}
              hasMore={hasMore}
              loading={loading}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          )}
        </View>
      ) : null}

      <MealFoodCreateModal
        visible={createOpen}
        initialName={query.trim()}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreateSave}
      />

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={PORTION_INPUT_ACCESSORY_ID}>
          <View style={styles.accessoryBar}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                if (pendingFoodRef.current) {
                  commitPending();
                } else if (editingEntryIndexRef.current != null) {
                  commitEntryGrams();
                }
              }}
              hitSlop={8}
              style={styles.accessoryDone}>
              <Text style={styles.accessoryDoneText}>{t('home.diary.foodSearch.portionDone')}</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
}

function MealFoodTableHeader() {
  const { t } = useAppTranslation();
  return (
    <View style={styles.tableHeaderRow}>
      <Text style={[styles.tableHeaderCell, styles.tableColName]}>{t('home.diary.foodSearch.tableName')}</Text>
      <Text style={[styles.tableHeaderCell, styles.tableColPortion, styles.tableHeaderRight]}>
        {t('home.diary.foodSearch.tablePortion')}
      </Text>
      <Text style={[styles.tableHeaderCell, styles.tableColKcalHead, styles.tableHeaderRight]}>
        {t('home.diary.foodSearch.tableKcal')}
      </Text>
      <View style={styles.tableColActionsHead} />
    </View>
  );
}

type MealFoodTableRowProps =
  | {
      food: MealFoodItem;
      editing: true;
      gramsText: string;
      onChangeGrams: (v: string) => void;
      portionInputRef: RefObject<TextInput | null>;
      onConfirmPortion: () => void;
      onCommitFromBlur: () => void;
      onDismissPressIn: () => void;
      onDismiss: () => void;
    }
  | {
      food: MealFoodItem;
      editingEntry: true;
      gramsText: string;
      onChangeGrams: (v: string) => void;
      portionInputRef: RefObject<TextInput | null>;
      onConfirmPortion: () => void;
      onCommitFromBlur: () => void;
      onDismissPressIn: () => void;
      onDismiss: () => void;
      onOpenDetail: () => void;
    }
  | {
      food: MealFoodItem;
      grams: number;
      onRemove: () => void;
      onOpenDetail: () => void;
      onEditPortion: () => void;
      editing?: false;
    };

function isPortionEditing(
  props: MealFoodTableRowProps,
): props is Extract<MealFoodTableRowProps, { editing: true } | { editingEntry: true }> {
  return 'editing' in props && props.editing === true
    ? true
    : 'editingEntry' in props && props.editingEntry === true;
}

function MealFoodTableRow(props: MealFoodTableRowProps) {
  const { t } = useAppTranslation();
  const { food } = props;
  const portionEditing = isPortionEditing(props);
  const grams = portionEditing ? parseGrams(props.gramsText) : props.grams;
  const scaled = scalePer100g(food.per100g, grams);
  const kcal = sumEntryKcal(food.per100g, grams);
  const isPendingRow = 'editing' in props && props.editing === true;

  return (
    <View style={styles.tableDataRow}>
      {isPendingRow ? (
        <View style={styles.tableColName}>
          <Text style={styles.tableProductName} numberOfLines={2}>
            {food.name}
          </Text>
          <MacroTableLine per100g={scaled} />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.diary.foodSearch.openDetailA11y', { name: food.name })}
          onPress={'onOpenDetail' in props ? props.onOpenDetail : undefined}
          style={({ pressed }) => [styles.tableColName, styles.tableColNamePressable, pressed && styles.addBtnPressed]}>
          <Text style={styles.tableProductName} numberOfLines={2}>
            {food.name}
          </Text>
          <MacroTableLine per100g={scaled} />
        </Pressable>
      )}

      <View style={styles.tableColPortion}>
        {portionEditing ? (
          <View style={styles.portionEdit}>
            <TextInput
              ref={props.portionInputRef}
              value={props.gramsText}
              onChangeText={props.onChangeGrams}
              onSubmitEditing={props.onConfirmPortion}
              onBlur={props.onCommitFromBlur}
              onEndEditing={props.onCommitFromBlur}
              blurOnSubmit
              keyboardType="number-pad"
              returnKeyType="done"
              selectTextOnFocus
              inputAccessoryViewID={PORTION_INPUT_ACCESSORY_ID}
              accessibilityLabel={t('home.diary.foodSearch.portionA11y')}
              style={styles.portionEditInput}
            />
            <Text style={styles.portionEditUnit}>{t('home.diary.macroUnitG')}</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.diary.foodSearch.editPortionA11y', { name: food.name })}
            onPress={'onEditPortion' in props ? props.onEditPortion : undefined}
            hitSlop={6}
            style={({ pressed }) => [styles.portionEdit, styles.portionEditPressable, pressed && styles.addBtnPressed]}>
            <Text style={styles.portionEditInput}>{grams}</Text>
            <Text style={styles.portionEditUnit}>{t('home.diary.macroUnitG')}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.tableColKcal}>
        <Text style={styles.tableKcalValue}>{kcal}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isPendingRow
            ? t('home.diary.foodSearch.dismissPendingA11y')
            : t('home.diary.foodSearch.removeEntryA11y', { name: food.name })
        }
        hitSlop={8}
        onPressIn={isPendingRow || ('editingEntry' in props && props.editingEntry) ? props.onDismissPressIn : undefined}
        onPress={
          isPendingRow || ('editingEntry' in props && props.editingEntry) ? props.onDismiss : props.onRemove
        }
        style={({ pressed }) => [styles.tableColAction, pressed && styles.addBtnPressed]}>
        <X color="rgba(255,255,255,0.38)" size={18} weight="bold" />
      </Pressable>
    </View>
  );
}

function MacroTableLine({ per100g }: { per100g: MealFoodItem['per100g'] }) {
  const { t } = useAppTranslation();
  const p = formatMacroCell(per100g.proteinG);
  const f = formatMacroCell(per100g.fatG);
  const c = formatMacroCell(per100g.carbsG);

  return (
    <Text style={styles.macroTableLine} numberOfLines={1}>
      <Text style={styles.macroP}>{p}</Text>
      <Text style={styles.macroLetterP}> {t('home.diary.foodSearch.proteinLetter')}</Text>
      <Text style={styles.macroDot}> · </Text>
      <Text style={styles.macroF}>{f}</Text>
      <Text style={styles.macroLetterF}> {t('home.diary.foodSearch.fatLetter')}</Text>
      <Text style={styles.macroDot}> · </Text>
      <Text style={styles.macroC}>{c}</Text>
      <Text style={styles.macroLetterC}> {t('home.diary.foodSearch.carbsLetter')}</Text>
    </Text>
  );
}

function MacroSummaryLine({
  per100g,
  compact,
}: {
  per100g: MealFoodItem['per100g'];
  compact?: boolean;
}) {
  const { t } = useAppTranslation();
  const kcal = formatMacroCell(per100g.kcal);
  const p = formatMacroCell(per100g.proteinG);
  const f = formatMacroCell(per100g.fatG);
  const c = formatMacroCell(per100g.carbsG);

  return (
    <Text style={[styles.macroLine, compact && styles.macroLineCompact]} numberOfLines={2}>
      <Text style={styles.macroKcal}>
        {kcal} {t('home.diary.kcalUnit')}
      </Text>
      <Text style={styles.macroDot}> · </Text>
      <Text style={styles.macroP}>{p}</Text>
      <Text style={styles.macroLetterP}> {t('home.diary.foodSearch.proteinLetter')} </Text>
      <Text style={styles.macroF}>{f}</Text>
      <Text style={styles.macroLetterF}> {t('home.diary.foodSearch.fatLetter')} </Text>
      <Text style={styles.macroC}>{c}</Text>
      <Text style={styles.macroLetterC}> {t('home.diary.foodSearch.carbsLetter')} </Text>
      {!compact ? (
        <Text style={styles.macroPer}> / 100 {t('home.diary.macroUnitG')}</Text>
      ) : null}
    </Text>
  );
}

const RESULTS_SCROLL_END_THRESHOLD = 56;

function FoodSearchResultsList({
  items,
  onPick,
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
}: {
  items: MealFoodItem[];
  onPick: (food: MealFoodItem) => void;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  const { t } = useAppTranslation();
  const loadMoreLockRef = useRef(false);

  const tryLoadMore = useCallback(() => {
    if (loadMoreLockRef.current || loading || loadingMore || !hasMore) {
      return;
    }
    loadMoreLockRef.current = true;
    onLoadMore();
  }, [hasMore, loading, loadingMore, onLoadMore]);

  useEffect(() => {
    if (!loadingMore) {
      loadMoreLockRef.current = false;
    }
  }, [loadingMore]);

  /** Пока список короче окна — догружаем, чтобы можно было скроллить дальше. */
  useEffect(() => {
    if (loading || loadingMore || !hasMore || items.length === 0) {
      return;
    }
    if (items.length <= VISIBLE_RESULT_ROWS) {
      tryLoadMore();
    }
  }, [hasMore, items.length, loading, loadingMore, tryLoadMore]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const nearBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - RESULTS_SCROLL_END_THRESHOLD;
      if (nearBottom) {
        tryLoadMore();
      }
    },
    [tryLoadMore],
  );

  const onContentSizeChange = useCallback(
    (_width: number, contentHeight: number) => {
      if (loading || loadingMore || !hasMore) {
        return;
      }
      if (contentHeight <= RESULTS_LIST_MAX_HEIGHT + 8) {
        tryLoadMore();
      }
    },
    [hasMore, loading, loadingMore, tryLoadMore],
  );

  const scrollable = items.length > VISIBLE_RESULT_ROWS || hasMore || loadingMore;

  const rows = (
    <View style={styles.resultsListContent}>
      {items.map((item, index) => (
        <View key={`${item.id}-${index}`}>
          {index > 0 ? <View style={styles.separator} /> : null}
          <FoodResultRow food={item} onAdd={() => onPick(item)} />
        </View>
      ))}
      {loadingMore ? (
        <>
          <View style={styles.separator} />
          <View
            accessibilityLabel={t('home.diary.foodSearch.loadMoreA11y')}
            accessibilityLiveRegion="polite"
            style={styles.loadMoreFooter}>
            <ActivityIndicator color={AuthScreenTheme.accent} size="small" />
          </View>
        </>
      ) : null}
    </View>
  );

  if (!scrollable) {
    return <View style={styles.resultsListShell}>{rows}</View>;
  }

  return (
    <ScrollView
      style={[styles.resultsListShell, styles.resultsListShellScrollable]}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={onContentSizeChange}
      onScroll={onScroll}
      scrollEventThrottle={160}
      showsVerticalScrollIndicator>
      {rows}
    </ScrollView>
  );
}

function FoodResultRow({ food, onAdd }: { food: MealFoodItem; onAdd: () => void }) {
  const { t } = useAppTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.diary.foodSearch.addA11y', { name: food.name })}
      onPress={onAdd}
      style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}>
      <View style={styles.resultText}>
        <Text style={styles.resultName} numberOfLines={2}>
          {food.name}
        </Text>
        <MacroSummaryLine per100g={food.per100g} />
      </View>
      <View style={styles.addBtn}>
        <Plus color={AuthScreenTheme.text} size={20} weight="bold" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  foodTable: {
    gap: 6,
    paddingBottom: Spacing.one,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 2,
  },
  tableHeaderCell: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.45,
  },
  tableHeaderRight: {
    textAlign: 'right',
  },
  accessoryBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#1c1c1e',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  accessoryDone: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  accessoryDoneText: {
    color: AuthScreenTheme.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  tableColName: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tableColNamePressable: {
    borderRadius: 8,
    marginVertical: -2,
    paddingVertical: 2,
  },
  tableColPortion: {
    width: 76,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tableColKcalHead: {
    width: 48,
  },
  tableColKcal: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tableKcalValue: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    lineHeight: 20,
  },
  tableColActionsHead: {
    width: 24,
  },
  tableColAction: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableProductName: {
    color: AuthScreenTheme.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  macroTableLine: {
    fontSize: 13,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },
  portionEdit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 2,
  },
  portionEditPressable: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginHorizontal: -4,
  },
  portionEditInput: {
    minWidth: 32,
    padding: 0,
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    lineHeight: 20,
  },
  portionEditUnit: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 13,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchField: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 10, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
    height: SEARCH_INPUT_LINE_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    width: '100%',
    height: SEARCH_INPUT_LINE_HEIGHT,
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: SEARCH_INPUT_LINE_HEIGHT,
    paddingVertical: 0,
    margin: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' as const } : {}),
  },
  searchGhost: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SEARCH_INPUT_LINE_HEIGHT,
    justifyContent: 'center',
  },
  searchGhostText: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: SEARCH_INPUT_LINE_HEIGHT,
  },
  searchGhostPrefix: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: SEARCH_INPUT_LINE_HEIGHT,
  },
  searchClearBtn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  createBtnPressed: {
    opacity: 0.88,
  },
  createBtnText: {
    color: AuthScreenTheme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  results: {
    gap: 4,
  },
  resultsListShell: {
    borderRadius: 12,
  },
  resultsListShellScrollable: {
    maxHeight: RESULTS_LIST_MAX_HEIGHT,
  },
  resultsListContent: {
    paddingTop: Spacing.two,
  },
  loader: {
    marginVertical: Spacing.three,
  },
  hint: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: Spacing.two,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: RESULT_ROW_MIN_HEIGHT,
    borderRadius: 12,
  },
  resultRowPressed: {
    opacity: 0.88,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  loadMoreFooter: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  resultName: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  macroLine: {
    fontSize: 15,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  macroLineCompact: {
    fontSize: 13,
  },
  macroKcal: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  macroDot: {
    color: 'rgba(255,255,255,0.28)',
  },
  macroP: {
    color: '#9DD4FF',
    fontWeight: '700',
  },
  macroLetterP: {
    color: '#64B5F6',
    fontWeight: '800',
    fontSize: 13,
  },
  macroF: {
    color: '#FFE08A',
    fontWeight: '700',
  },
  macroLetterF: {
    color: '#F5C542',
    fontWeight: '800',
    fontSize: 13,
  },
  macroC: {
    color: '#7AEBB8',
    fontWeight: '700',
  },
  macroLetterC: {
    color: AuthScreenTheme.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  macroPer: {
    color: 'rgba(255,255,255,0.38)',
    fontWeight: '600',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addBtnPressed: {
    opacity: 0.85,
  },
});
