import React, { useMemo, useState } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform,
  Alert, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Goal } from '@/lib/types';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { goals, transactions, getTotalBalance, updateGoal, deleteGoal, addGoal, batchUpdateGoals } = useFinance();

  const [showCalculator, setShowCalculator] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [selectedSplitIds, setSelectedSplitIds] = useState<string[]>([]);

  // Calculator State
  const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([]);
  const [monthsToSave, setMonthsToSave] = useState('6');
  const [calculatorMonth, setCalculatorMonth] = useState(() => new Date());

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const totalSavings = useMemo(() => getTotalBalance(), [getTotalBalance]);
  const totalAllocated = useMemo(() => goals.reduce((s, g) => s + g.allocatedAmount, 0), [goals]);
  const remainingSavings = totalSavings - totalAllocated;

  const activeGoals = useMemo(() => goals.filter(g => !g.isCompleted), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.isCompleted), [goals]);
  const hasEmergencyFundGoal = useMemo(() => goals.some(g => g.name === 'Emergency Fund'), [goals]);

  const monthlyExpenses = useMemo(() => {
    const targetMonth = calculatorMonth.getMonth();
    const targetYear = calculatorMonth.getFullYear();

    return transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const txnDate = new Date(t.date);
        return txnDate.getMonth() === targetMonth && txnDate.getFullYear() === targetYear;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [calculatorMonth, transactions]);

  const calculatorMonthLabel = useMemo(() => (
    calculatorMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  ), [calculatorMonth]);

  const shiftCalculatorMonth = (offset: number) => {
    setCalculatorMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    setSelectedTxnIds([]);
    Haptics.selectionAsync();
  };

  const toggleTxnSelection = (id: string) => {
    setSelectedTxnIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    Haptics.selectionAsync();
  };

  const calculateAndAddEF = () => {
    const monthlyAmount = transactions
      .filter(t => selectedTxnIds.includes(t.id))
      .reduce((sum, t) => sum + t.amount, 0);

    const months = parseInt(monthsToSave) || 6;
    const target = monthlyAmount * months;

    if (target <= 0) {
      Alert.alert('Selection Required', 'Please select at least one mandatory transaction.');
      return;
    }

    addGoal({
      name: 'Emergency Fund',
      targetAmount: target,
      icon: 'shield-checkmark',
      notes: `Based on ₹${monthlyAmount} monthly mandatory expenses for ${months} months.`,
    });

    setShowCalculator(false);
    setSelectedTxnIds([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const executeSplit = (targetGoalIds: string[]) => {
    if (targetGoalIds.length === 0) return;

    // Split total savings pool evenly among selected goals
    const perGoal = Math.max(0, totalSavings / targetGoalIds.length);

    const updates = goals.map(g => {
      if (targetGoalIds.includes(g.id)) {
        const allocated = Math.min(Math.floor(perGoal * 100) / 100, g.targetAmount);
        return {
          id: g.id,
          changes: {
            allocatedAmount: allocated,
            isCompleted: allocated >= g.targetAmount,
          },
        };
      }
      // Reset non-selected goals to 0 to ensure pool is fully redistributed
      return {
        id: g.id,
        changes: { allocatedAmount: 0, isCompleted: false }
      };
    });

    batchUpdateGoals(updates);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSplitting(false);
    setSelectedSplitIds([]);
  };

  const handleSplitPress = () => {
    if (activeGoals.length === 0) {
      Alert.alert('No Goals', 'Please add some goals first.');
      return;
    }

    Alert.alert(
      'Split Evenly',
      'Choose how to distribute your total savings:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'All Goals',
          onPress: () => executeSplit(activeGoals.map(g => g.id))
        },
        {
          text: 'Selected Goals',
          onPress: () => {
            setIsSplitting(true);
            setSelectedSplitIds([]);
            Haptics.selectionAsync();
          }
        },
      ]
    );
  };

  const handleResetGoal = (goal: Goal) => {
    Alert.alert('Reset Goal', `Reset allocation for "${goal.name}" to 0?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          updateGoal(goal.id, { allocatedAmount: 0, isCompleted: false });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleDelete = (goal: Goal) => {
    Alert.alert('Delete Goal', `Delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteGoal(goal.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
      },
    ]);
  };

  const handleAllocationChange = (goalId: string, value: string) => {
    const num = parseFloat(value) || 0;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const clamped = Math.min(num, goal.targetAmount);
    updateGoal(goalId, {
      allocatedAmount: clamped,
      isCompleted: clamped >= goal.targetAmount,
    });
  };

  const toggleSplitSelection = (id: string) => {
    setSelectedSplitIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Goals</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {!hasEmergencyFundGoal && (
              <Pressable
                onPress={() => { setShowCalculator(!showCalculator); Haptics.selectionAsync(); }}
                style={[styles.addBtn, { backgroundColor: theme.warningMuted }]}
              >
                <Ionicons name="shield-outline" size={22} color={theme.warning} />
              </Pressable>
            )}
            <Pressable
              onPress={() => { router.push('/add-goal'); Haptics.selectionAsync(); }}
              style={[styles.addBtn, { backgroundColor: theme.primaryMuted }]}
            >
              <Ionicons name="add" size={22} color={theme.primary} />
            </Pressable>
          </View>
        </View>

        {showCalculator && !hasEmergencyFundGoal && (
          <View style={[styles.calcCard, { backgroundColor: theme.card, borderColor: theme.warning }]}>
            <View style={styles.calcHeader}>
              <Ionicons name="calculator" size={20} color={theme.warning} />
              <Text style={[styles.calcTitle, { color: theme.text }]}>Emergency Fund Calculator</Text>
              <Pressable onPress={() => setShowCalculator(false)}>
                <Ionicons name="close" size={20} color={theme.textTertiary} />
              </Pressable>
            </View>
            <Text style={[styles.calcSub, { color: theme.textSecondary }]}> 
              Select mandatory monthly expenses to calculate your safety net.
            </Text>

            <View style={styles.monthSelectorRow}>
              <Pressable
                style={[styles.monthNavBtn, { backgroundColor: theme.cardElevated }]}
                onPress={() => shiftCalculatorMonth(-1)}
              >
                <Ionicons name="chevron-back" size={18} color={theme.text} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: theme.text }]}>{calculatorMonthLabel}</Text>
              <Pressable
                style={[styles.monthNavBtn, { backgroundColor: theme.cardElevated }]}
                onPress={() => shiftCalculatorMonth(1)}
              >
                <Ionicons name="chevron-forward" size={18} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.txnSelectorList}>
              {monthlyExpenses.length === 0 ? (
                <Text style={[styles.noTxns, { color: theme.textTertiary }]}>No expense transactions found for this month.</Text>
              ) : (
                <ScrollView
                  style={styles.txnScrollArea}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {monthlyExpenses.map(txn => (
                    <Pressable
                      key={txn.id}
                      style={[
                        styles.txnSelectRow,
                        { borderBottomColor: theme.border },
                        selectedTxnIds.includes(txn.id) && { backgroundColor: theme.primaryMuted }
                      ]}
                      onPress={() => toggleTxnSelection(txn.id)}
                    >
                      <Ionicons
                        name={selectedTxnIds.includes(txn.id) ? "checkbox" : "square-outline"}
                        size={18}
                        color={selectedTxnIds.includes(txn.id) ? theme.primary : theme.textTertiary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.txnName, { color: theme.text }]} numberOfLines={1}>{txn.notes || 'Expense'}</Text>
                        <Text style={[styles.txnDate, { color: theme.textTertiary }]}>{formatDate(txn.date)}</Text>
                      </View>
                      <Text style={[styles.txnAmount, { color: theme.text }]}>{formatCurrency(txn.amount)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.calcInputRow}>
              <Text style={[styles.calcLabel, { color: theme.textSecondary }]}>Months to cover:</Text>
              <TextInput
                style={[styles.monthsInput, { backgroundColor: theme.cardElevated, color: theme.text, borderColor: theme.border }]}
                keyboardType="numeric"
                value={monthsToSave}
                onChangeText={setMonthsToSave}
              />
            </View>

            <Pressable style={[styles.setupBtn, { backgroundColor: theme.warning }]} onPress={calculateAndAddEF}>
              <Text style={styles.setupBtnText}>Create Emergency Goal</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Savings</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(totalSavings)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Allocated</Text>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>{formatCurrency(totalAllocated)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: remainingSavings >= 0 ? theme.text : theme.expense }]}>{formatCurrency(remainingSavings)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          {isSplitting ? (
            <>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                onPress={() => executeSplit(selectedSplitIds)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={[styles.actionText, { color: "#fff" }]}>Confirm Split ({selectedSplitIds.length})</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: theme.cardElevated }]}
                onPress={() => { setIsSplitting(false); setSelectedSplitIds([]); }}
              >
                <Text style={[styles.actionText, { color: theme.textSecondary }]}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            activeGoals.length > 0 && (
              <Pressable style={[styles.actionBtn, { backgroundColor: theme.primaryMuted }]} onPress={handleSplitPress}>
                <Ionicons name="git-branch-outline" size={16} color={theme.primary} />
                <Text style={[styles.actionText, { color: theme.primary }]}>Split Evenly</Text>
              </Pressable>
            )
          )}
        </View>

        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={44} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No goals yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>Set financial targets to track your progress</Text>
          </View>
        ) : null}

        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {isSplitting ? 'Select Goals to Include in Split' : `Active Goals (${activeGoals.length})`}
            </Text>
            {activeGoals.map(goal => {
              const progress = goal.targetAmount > 0 ? Math.min((goal.allocatedAmount / goal.targetAmount) * 100, 100) : 0;
              const isSelectedForSplit = selectedSplitIds.includes(goal.id);

              return (
                <View key={goal.id} style={[styles.goalCard, { backgroundColor: theme.card }, isSelectedForSplit && { borderColor: theme.primary, borderWidth: 1.5 }]}>
                  <Pressable
                    style={styles.goalCardMain}
                    onPress={() => {
                      if (isSplitting) {
                        toggleSplitSelection(goal.id);
                      } else {
                        router.push({ pathname: '/add-goal', params: { editId: goal.id } });
                        Haptics.selectionAsync();
                      }
                    }}
                    onLongPress={() => !isSplitting && handleDelete(goal)}
                  >
                    <View style={styles.goalHeader}>
                      {isSplitting && (
                        <Ionicons
                          name={isSelectedForSplit ? "checkbox" : "square-outline"}
                          size={24}
                          color={isSelectedForSplit ? theme.primary : theme.textTertiary}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <View style={[styles.goalIcon, { backgroundColor: goal.name === 'Emergency Fund' ? theme.warningMuted : theme.primaryMuted }]}>
                        <Ionicons name={goal.icon as any} size={20} color={goal.name === 'Emergency Fund' ? theme.warning : theme.primary} />
                      </View>
                      <View style={styles.goalInfo}>
                        <Text style={[styles.goalName, { color: theme.text }]}>{goal.name}</Text>
                        <Text style={[styles.goalTarget, { color: theme.textSecondary }]}>Target: {formatCurrency(goal.targetAmount)}</Text>
                      </View>
                      {!isSplitting && (
                        <View style={styles.headerRight}>
                          <Pressable
                            style={[styles.resetIconButton, { backgroundColor: theme.cardElevated }]}
                            onPress={() => handleResetGoal(goal)}
                            hitSlop={10}
                          >
                            <Ionicons name="refresh-outline" size={16} color={theme.textSecondary} />
                          </Pressable>
                          <Text style={[styles.goalPercent, { color: goal.name === 'Emergency Fund' ? theme.warning : theme.primary }]}>{progress.toFixed(0)}%</Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.progressTrack, { backgroundColor: theme.cardElevated }]}>
                      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: goal.name === 'Emergency Fund' ? theme.warning : theme.primary }]} />
                    </View>
                  </Pressable>

                  {!isSplitting && (
                    <View style={styles.goalFooter}>
                      <View style={styles.allocatedBox}>
                        <Text style={[styles.goalAllocatedLabel, { color: theme.textSecondary }]}>Allocated:</Text>
                        <TextInput
                          style={[styles.inlineAllocInput, { color: theme.text, borderBottomColor: theme.border }]}
                          keyboardType="numeric"
                          defaultValue={goal.allocatedAmount.toString()}
                          onEndEditing={(e) => handleAllocationChange(goal.id, e.nativeEvent.text)}
                          placeholder="0"
                          placeholderTextColor={theme.textTertiary}
                        />
                      </View>
                      <Text style={[styles.goalRemaining, { color: theme.textTertiary }]}>Left: {formatCurrency(Math.max(0, goal.targetAmount - goal.allocatedAmount))}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {completedGoals.length > 0 && !isSplitting && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Completed ({completedGoals.length})</Text>
            {completedGoals.map(goal => (
              <View key={goal.id} style={[styles.goalCard, styles.completedCard, { backgroundColor: theme.card }]}>
                <Pressable
                  style={styles.goalCardMain}
                  onLongPress={() => handleDelete(goal)}
                >
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIcon, { backgroundColor: theme.incomeMuted }]}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.income} />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalName, { color: theme.text }]}>{goal.name}</Text>
                      <Text style={[styles.goalTarget, { color: theme.textSecondary }]}>{formatCurrency(goal.targetAmount)}</Text>
                    </View>
                    <View style={styles.headerRight}>
                      <Pressable
                        style={[styles.resetIconButton, { backgroundColor: theme.cardElevated }]}
                        onPress={() => handleResetGoal(goal)}
                        hitSlop={10}
                      >
                        <Ionicons name="refresh-outline" size={16} color={theme.textSecondary} />
                      </Pressable>
                      <Ionicons name="trophy" size={22} color={theme.warning} />
                    </View>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontFamily: 'DMSans_700Bold' },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  calcCard: { marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  calcHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  calcTitle: { flex: 1, fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
  calcSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 12 },
  monthSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthNavBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  txnSelectorList: { maxHeight: 240, marginBottom: 16, borderRadius: 8, overflow: 'hidden' },
  txnScrollArea: { flexGrow: 0 },
  txnSelectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, gap: 10, borderBottomWidth: 1 },
  txnName: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  txnDate: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  txnAmount: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  noTxns: { fontSize: 12, fontFamily: 'DMSans_400Regular', textAlign: 'center', padding: 20 },
  calcInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calcLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  monthsInput: { width: 60, height: 36, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontFamily: 'DMSans_600SemiBold' },
  setupBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  setupBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  summaryCard: { marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, height: 36 },
  summaryLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  summaryValue: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  actionText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  emptySubtext: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  section: { paddingHorizontal: 20, paddingTop: 12 },
  sectionTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', marginBottom: 12 },
  goalCard: { borderRadius: 16, padding: 16, marginBottom: 12, gap: 12, borderLeftWidth: 0 },
  goalCardMain: { gap: 12 },
  completedCard: { opacity: 0.75 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1, gap: 2 },
  goalName: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  goalTarget: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resetIconButton: { padding: 6, borderRadius: 8 },
  goalPercent: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allocatedBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalAllocatedLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  inlineAllocInput: { minWidth: 60, borderBottomWidth: 1, paddingVertical: 2, paddingHorizontal: 4, fontSize: 13, fontFamily: 'DMSans_600SemiBold', textAlign: 'right' },
  goalRemaining: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
});
