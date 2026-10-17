import { X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { MealFoodItem } from '@/features/home/types/meal-food';
import { useAppTranslation } from '@/i18n';
import { AuthScreenTheme } from '@/shared/constants/auth-screen-theme';
import { Spacing } from '@/shared/constants/theme';

type Props = {
  visible: boolean;
  initialName?: string;
  onClose: () => void;
  onSave: (food: MealFoodItem) => void;
};

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (!t || t === '—' || t === '-') {
    return null;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseRequiredNumber(raw: string): number {
  return parseOptionalNumber(raw) ?? 0;
}

export function MealFoodCreateModal({ visible, initialName = '', onClose, onSave }: Props) {
  const { t } = useAppTranslation();
  const [name, setName] = useState(initialName);
  const [protein, setProtein] = useState('0');
  const [fat, setFat] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [kcal, setKcal] = useState('0');
  const [isDrink, setIsDrink] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [fiber, setFiber] = useState('');
  const [sugars, setSugars] = useState('');
  const [sodium, setSodium] = useState('');
  const [satFat, setSatFat] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialName);
    }
  }, [visible, initialName]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const id = `custom-${Date.now()}`;
    onSave({
      id,
      name: trimmed,
      source: 'custom',
      isDrink,
      per100g: {
        proteinG: parseRequiredNumber(protein),
        fatG: parseRequiredNumber(fat),
        carbsG: parseRequiredNumber(carbs),
        kcal: parseRequiredNumber(kcal),
        fiberG: parseOptionalNumber(fiber),
        sugarsG: parseOptionalNumber(sugars),
        sodiumMg: parseOptionalNumber(sodium),
        saturatedFatG: parseOptionalNumber(satFat),
      },
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('home.diary.foodSearch.createTitle')}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X color={AuthScreenTheme.textMuted} size={22} weight="bold" />
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.per100Row}>
            <Text style={styles.sectionHint}>{t('home.diary.foodSearch.per100g')}</Text>
          </View>

          <Text style={styles.fieldLabel}>{t('home.diary.foodSearch.fieldName')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('home.diary.foodSearch.namePlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.input}
            autoCapitalize="sentences"
          />

          <View style={styles.macroGrid}>
            <MacroField
              label={t('home.diary.foodSearch.fieldProtein')}
              labelColor="#7EC8FF"
              value={protein}
              onChangeText={setProtein}
            />
            <MacroField
              label={t('home.diary.foodSearch.fieldFat')}
              labelColor="#FFD56B"
              value={fat}
              onChangeText={setFat}
            />
            <MacroField
              label={t('home.diary.foodSearch.fieldCarbs')}
              labelColor="#6EE7A8"
              value={carbs}
              onChangeText={setCarbs}
            />
            <MacroField
              label={t('home.diary.foodSearch.fieldEnergy')}
              labelColor="#FFB340"
              value={kcal}
              onChangeText={setKcal}
            />
          </View>

          <View style={styles.drinkRow}>
            <View style={styles.drinkText}>
              <Text style={styles.drinkTitle}>{t('home.diary.foodSearch.isDrink')}</Text>
              <Text style={styles.drinkHint}>{t('home.diary.foodSearch.isDrinkHint')}</Text>
            </View>
            <Switch
              value={isDrink}
              onValueChange={setIsDrink}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(61, 214, 140, 0.35)' }}
              thumbColor={isDrink ? AuthScreenTheme.accent : '#f4f4f5'}
            />
          </View>

          <Pressable onPress={() => setShowMore((v) => !v)} style={styles.moreToggle}>
            <Text style={styles.moreToggleText}>
              {showMore ? t('home.diary.foodSearch.lessFields') : t('home.diary.foodSearch.moreFields')}
            </Text>
          </Pressable>

          {showMore ? (
            <View style={styles.moreGrid}>
              <MacroField
                label={t('home.diary.foodSearch.fieldFiber')}
                labelColor="#5BC0BE"
                value={fiber}
                onChangeText={setFiber}
                optional
              />
              <MacroField
                label={t('home.diary.foodSearch.fieldSugars')}
                labelColor="#FF9F0A"
                value={sugars}
                onChangeText={setSugars}
                optional
              />
              <MacroField
                label={t('home.diary.foodSearch.fieldSodium')}
                labelColor="#B8B8FF"
                value={sodium}
                onChangeText={setSodium}
                optional
              />
              <MacroField
                label={t('home.diary.foodSearch.fieldSatFat')}
                labelColor="#E8A838"
                value={satFat}
                onChangeText={setSatFat}
                optional
              />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}>
            <Text style={styles.saveBtnText}>{t('home.diary.foodSearch.saveProduct')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MacroField({
  label,
  labelColor,
  value,
  onChangeText,
  optional,
}: {
  label: string;
  labelColor: string;
  value: string;
  onChangeText: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <View style={styles.macroCell}>
      <Text style={[styles.macroLabel, { color: labelColor }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={optional ? '—' : '0'}
        placeholderTextColor="rgba(255,255,255,0.22)"
        style={styles.macroInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    color: AuthScreenTheme.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  per100Row: {
    alignItems: 'flex-end',
  },
  sectionHint: {
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: Spacing.one,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    color: AuthScreenTheme.text,
    fontSize: 17,
    fontWeight: '600',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: Spacing.two,
  },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  macroCell: {
    width: '47%',
    flexGrow: 1,
    gap: 6,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  macroInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 16,
    color: AuthScreenTheme.text,
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  drinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
  },
  drinkText: {
    flex: 1,
    gap: 4,
  },
  drinkTitle: {
    color: AuthScreenTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  drinkHint: {
    color: AuthScreenTheme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  moreToggle: {
    paddingVertical: Spacing.two,
  },
  moreToggleText: {
    color: AuthScreenTheme.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  saveBtn: {
    borderRadius: 14,
    backgroundColor: AuthScreenTheme.accent,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnText: {
    color: '#0a0a0c',
    fontSize: 16,
    fontWeight: '800',
  },
});
