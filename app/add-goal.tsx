import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Pressable, TextInput,
  Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useFinance } from '@/lib/finance-context';
import { GOAL_ICONS } from '@/lib/types';
import DatePicker from '@/components/DatePicker';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function AddGoalScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const params = useLocalSearchParams<{ editId?: string }>();
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();

  const editGoal = params.editId ? goals.find(g => g.id === params.editId) : null;

  const [name, setName] = useState(editGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(editGoal ? editGoal.targetAmount.toString() : '');
  const [targetDate, setTargetDate] = useState(editGoal?.targetDate || '');
  const [hasTargetDate, setHasTargetDate] = useState(!!editGoal?.targetDate);
  const [icon, setIcon] = useState(editGoal?.icon || 'flag');
  const [notes, setNotes] = useState(editGoal?.notes || '');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a goal name.');
      return;
    }
    const target = parseFloat(targetAmount);
    if (!target || target <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target amount.');
      return;
    }

    if (editGoal) {
      updateGoal(editGoal.id, {
        name: name.trim(),
        targetAmount: target,
        targetDate: hasTargetDate && targetDate ? targetDate : undefined,
        icon,
        notes: notes.trim() || undefined,
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmount: target,
        targetDate: hasTargetDate && targetDate ? targetDate : undefined,
        icon,
        notes: notes.trim() || undefined,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleDelete = () => {
    if (!editGoal) return;
    Alert.alert('Delete Goal', `Delete "${editGoal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          deleteGoal(editGoal.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{editGoal ? 'Edit Goal' : 'New Goal'}</Text>
        {editGoal ? (
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Ionicons name="trash-outline" size={22} color={theme.expense} />
          </Pressable>
        ) : <View style={{ width: 24 }} />}
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
        bottomOffset={60}
      >
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Goal Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="e.g. Emergency Fund"
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Amount</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="0"
            placeholderTextColor={theme.textTertiary}
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.dateToggleRow}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Date</Text>
            <Pressable
              style={[styles.togglePill, { backgroundColor: theme.card }, hasTargetDate && [styles.togglePillActive, { backgroundColor: theme.primaryMuted }]]}
              onPress={() => {
                const next = !hasTargetDate;
                setHasTargetDate(next);
                if (next && !targetDate) {
                  const d = new Date();
                  d.setMonth(d.getMonth() + 6);
                  setTargetDate(d.toISOString().split('T')[0]);
                }
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.togglePillText, { color: theme.textTertiary }, hasTargetDate && [styles.togglePillTextActive, { color: theme.primary }]]}>
                {hasTargetDate ? 'On' : 'Off'}
              </Text>
            </Pressable>
          </View>
          {hasTargetDate && (
            <DatePicker value={targetDate || new Date().toISOString().split('T')[0]} onChange={setTargetDate} />
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Icon</Text>
          <View style={styles.iconGrid}>
            {GOAL_ICONS.map(ic => (
              <Pressable
                key={ic}
                style={[styles.iconOption, { backgroundColor: theme.card }, icon === ic && [styles.iconSelected, { backgroundColor: theme.primaryMuted, borderColor: theme.primary }]]}
                onPress={() => { setIcon(ic); Haptics.selectionAsync(); }}
              >
                <Ionicons name={ic as any} size={20} color={icon === ic ? theme.primary : theme.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, minHeight: 60, textAlignVertical: 'top' }]}
            placeholder="Add a note..."
            placeholderTextColor={theme.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{editGoal ? 'Update Goal' : 'Create Goal'}</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold' },
  field: { paddingHorizontal: 20, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 8 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  dateToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  togglePill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  togglePillActive: {},
  togglePillText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  togglePillTextActive: {},
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconSelected: { borderWidth: 1.5 },
  saveBtn: { marginHorizontal: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
