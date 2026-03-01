import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, Pressable, TextInput,
  Platform, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useFinance } from '@/lib/finance-context';
import { Transaction } from '@/lib/types';
import DatePicker from '@/components/DatePicker';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

type TxnType = 'expense' | 'income' | 'transfer';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const params = useLocalSearchParams<{ editId?: string }>();
  const {
    accounts, categories, transactions,
    addTransaction, updateTransaction, deleteTransaction,
  } = useFinance();

  const editTxn = params.editId ? transactions.find(t => t.id === params.editId) : null;

  const [type, setType] = useState<TxnType>(editTxn?.type || 'expense');
  const [amount, setAmount] = useState(editTxn ? editTxn.amount.toString() : '');
  const [accountId, setAccountId] = useState(editTxn?.accountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(editTxn?.toAccountId || (accounts[1]?.id || ''));
  const [categoryId, setCategoryId] = useState(editTxn?.categoryId || '');
  const [date, setDate] = useState(editTxn?.date || new Date().toISOString().split('T')[0]);
  const [addTime, setAddTime] = useState(!!editTxn?.time);
  const [time, setTime] = useState(editTxn?.time || '');
  const [notes, setNotes] = useState(editTxn?.notes || '');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState<'from' | 'to' | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type));
  }, [categories, type]);

  useEffect(() => {
    if (!editTxn && filteredCategories.length > 0 && type !== 'transfer') {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type]);

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!accountId) {
      Alert.alert('No Account', 'Please select an account.');
      return;
    }
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      Alert.alert('Invalid Transfer', 'Please select different accounts for transfer.');
      return;
    }

    const txnData: Omit<Transaction, 'id' | 'createdAt'> = {
      type,
      amount: amt,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      date,
      time: addTime && time ? time : undefined,
      notes: notes.trim() || undefined,
    };

    if (editTxn) {
      updateTransaction(editTxn.id, txnData);
    } else {
      addTransaction(txnData);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleDelete = () => {
    if (!editTxn) return;
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          deleteTransaction(editTxn.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Select';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Select';

  const typeColors = {
    expense: theme.expense,
    income: theme.income,
    transfer: theme.transfer,
  };

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{editTxn ? 'Edit Transaction' : 'Add Transaction'}</Text>
        {editTxn ? (
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Ionicons name="trash-outline" size={22} color={theme.expense} />
          </Pressable>
        ) : <View style={{ width: 24 }} />}
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
        bottomOffset={60}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.typeRow}>
          {(['expense', 'income', 'transfer'] as TxnType[]).map(t => (
            <Pressable
              key={t}
              style={[styles.typeChip, { backgroundColor: theme.card }, type === t && { backgroundColor: `${typeColors[t]}20` }]}
              onPress={() => { setType(t); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.typeText, { color: theme.textSecondary }, type === t && { color: typeColors[t] }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.currencySymbol, { color: typeColors[type] }]}>
            {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
          </Text>
          <TextInput
            style={[styles.amountInput, { color: typeColors[type] }]}
            placeholder="0"
            placeholderTextColor={theme.textTertiary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{type === 'transfer' ? 'From Account' : 'Account'}</Text>
          <Pressable
            style={[styles.fieldValue, { backgroundColor: theme.card }]}
            onPress={() => setShowAccountPicker('from')}
          >
            <Ionicons name={(accounts.find(a => a.id === accountId)?.icon || 'wallet') as any} size={18} color={theme.primary} />
            <Text style={[styles.fieldValueText, { color: theme.text }]}>{getAccountName(accountId)}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
          </Pressable>
        </View>

        {type === 'transfer' && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>To Account</Text>
            <Pressable
              style={[styles.fieldValue, { backgroundColor: theme.card }]}
              onPress={() => setShowAccountPicker('to')}
            >
              <Ionicons name={(accounts.find(a => a.id === toAccountId)?.icon || 'wallet') as any} size={18} color={theme.transfer} />
              <Text style={[styles.fieldValueText, { color: theme.text }]}>{getAccountName(toAccountId)}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
            </Pressable>
          </View>
        )}

        {type !== 'transfer' && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Category</Text>
            <Pressable
              style={[styles.fieldValue, { backgroundColor: theme.card }]}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Ionicons name={(categories.find(c => c.id === categoryId)?.icon || 'pricetag') as any} size={18} color={typeColors[type]} />
              <Text style={[styles.fieldValueText, { color: theme.text }]}>{getCategoryName(categoryId)}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
            </Pressable>
          </View>
        )}

        <View style={styles.field}>
          <DatePicker value={date} onChange={setDate} label="Date" />
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Add Time</Text>
            <Switch
              value={addTime}
              onValueChange={setAddTime}
              trackColor={{ false: theme.border, true: theme.primaryMuted }}
              thumbColor={addTime ? theme.primary : theme.textTertiary}
            />
          </View>
          {addTime && (
            <TextInput
              style={[styles.dateInput, { backgroundColor: theme.card, color: theme.text }]}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM (e.g. 14:30)"
              placeholderTextColor={theme.textTertiary}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: theme.card, color: theme.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note..."
            placeholderTextColor={theme.textTertiary}
            multiline
          />
        </View>

        <Pressable style={[styles.saveBtn, { backgroundColor: typeColors[type] }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{editTxn ? 'Update' : 'Save'}</Text>
        </Pressable>

        {showCategoryPicker && (
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerCard, { backgroundColor: theme.card }]}>
              <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Category</Text>
                <Pressable onPress={() => setShowCategoryPicker(false)}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </Pressable>
              </View>
              <KeyboardAwareScrollViewCompat style={styles.pickerList}>
                {filteredCategories.map(cat => (
                  <Pressable
                    key={cat.id}
                    style={[styles.pickerItem, { borderBottomColor: theme.border }, categoryId === cat.id && [styles.pickerItemActive, { backgroundColor: theme.cardElevated }]]}
                    onPress={() => { setCategoryId(cat.id); setShowCategoryPicker(false); Haptics.selectionAsync(); }}
                  >
                    <Ionicons name={cat.icon as any} size={20} color={categoryId === cat.id ? typeColors[type] : theme.textSecondary} />
                    <Text style={[styles.pickerItemText, { color: theme.text }, categoryId === cat.id && { color: typeColors[type] }]}>{cat.name}</Text>
                  </Pressable>
                ))}
              </KeyboardAwareScrollViewCompat>
            </View>
          </View>
        )}

        {showAccountPicker && (
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerCard, { backgroundColor: theme.card }]}>
              <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Account</Text>
                <Pressable onPress={() => setShowAccountPicker(null)}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </Pressable>
              </View>
              <KeyboardAwareScrollViewCompat style={styles.pickerList}>
                {accounts.map(acc => {
                  const selected = showAccountPicker === 'from' ? accountId === acc.id : toAccountId === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      style={[styles.pickerItem, { borderBottomColor: theme.border }, selected && [styles.pickerItemActive, { backgroundColor: theme.cardElevated }]]}
                      onPress={() => {
                        if (showAccountPicker === 'from') setAccountId(acc.id);
                        else setToAccountId(acc.id);
                        setShowAccountPicker(null);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Ionicons name={acc.icon as any} size={20} color={selected ? acc.color : theme.textSecondary} />
                      <Text style={[styles.pickerItemText, { color: theme.text }, selected && { color: acc.color }]}>{acc.name}</Text>
                    </Pressable>
                  );
                })}
              </KeyboardAwareScrollViewCompat>
            </View>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold' },
  typeRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  typeText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 24 },
  currencySymbol: { fontSize: 36, fontFamily: 'DMSans_700Bold' },
  amountInput: { fontSize: 42, fontFamily: 'DMSans_700Bold', textAlign: 'center', minWidth: 100, padding: 0 },
  field: { paddingHorizontal: 20, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 8 },
  fieldValue: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  fieldValueText: { flex: 1, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  dateInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  notesInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, fontFamily: 'DMSans_400Regular', minHeight: 60, textAlignVertical: 'top' },
  saveBtn: { marginHorizontal: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#fff' },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
  pickerCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: 400, paddingBottom: 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  pickerTitle: { fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
  pickerList: { paddingHorizontal: 20 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  pickerItemActive: { marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 0 },
  pickerItemText: { fontSize: 14, fontFamily: 'DMSans_500Medium' },
});
