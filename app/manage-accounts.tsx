import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Pressable, TextInput,
  Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency } from '@/lib/utils';
import { ACCOUNT_ICONS } from '@/lib/types';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function ManageAccountsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { accounts, addAccount, updateAccount, deleteAccount, getAccountBalance } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('cash');
  const [color, setColor] = useState(Colors.accountColors[0]);
  const [openingBalance, setOpeningBalance] = useState('0');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const resetForm = () => {
    setName('');
    setIcon('cash');
    setColor(Colors.accountColors[0]);
    setOpeningBalance('0');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (acc: typeof accounts[0]) => {
    setEditingId(acc.id);
    setName(acc.name);
    setIcon(acc.icon);
    setColor(acc.color);
    setOpeningBalance(acc.openingBalance.toString());
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter an account name.');
      return;
    }
    const bal = parseFloat(openingBalance) || 0;
    if (editingId) {
      await updateAccount(editingId, { name: name.trim(), icon, color, openingBalance: bal });
    } else {
      await addAccount({ name: name.trim(), icon, color, openingBalance: bal });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  };

  const handleDelete = (id: string, accountName: string) => {
    Alert.alert('Delete Account', `Delete "${accountName}"? Transactions linked to this account will remain but show "Unknown".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteAccount(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Manage Accounts</Text>
        <Pressable onPress={() => { setShowForm(true); Haptics.selectionAsync(); }} hitSlop={12}>
          <Ionicons name="add" size={24} color={theme.primary} />
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
        bottomOffset={60}
      >
        {accounts.map(acc => (
          <Pressable
            key={acc.id}
            style={[styles.accountItem, { borderBottomColor: theme.border }]}
            onPress={() => startEdit(acc)}
          >
            <View style={[styles.accIcon, { backgroundColor: `${acc.color}20` }]}>
              <Ionicons name={acc.icon as any} size={20} color={acc.color} />
            </View>
            <View style={styles.accInfo}>
              <Text style={[styles.accName, { color: theme.text }]}>{acc.name}</Text>
              <Text style={[styles.accBalance, { color: theme.textSecondary }]}>Balance: {formatCurrency(getAccountBalance(acc.id))}</Text>
            </View>
            <Pressable onPress={() => handleDelete(acc.id, acc.name)} hitSlop={12}>
              <Ionicons name="trash-outline" size={18} color={theme.textTertiary} />
            </Pressable>
          </Pressable>
        ))}

        {accounts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={40} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No accounts</Text>
          </View>
        )}

        {showForm && (
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>{editingId ? 'Edit Account' : 'New Account'}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardElevated, color: theme.text }]}
              placeholder="Account name"
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardElevated, color: theme.text }]}
              placeholder="Opening balance"
              placeholderTextColor={theme.textTertiary}
              value={openingBalance}
              onChangeText={setOpeningBalance}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.pickLabel, { color: theme.textSecondary }]}>Icon</Text>
            <View style={styles.iconRow}>
              {ACCOUNT_ICONS.map(ic => (
                <Pressable
                  key={ic}
                  style={[styles.iconOption, { backgroundColor: theme.cardElevated }, icon === ic && { backgroundColor: `${color}30`, borderColor: color }]}
                  onPress={() => { setIcon(ic); Haptics.selectionAsync(); }}
                >
                  <Ionicons name={ic as any} size={20} color={icon === ic ? color : theme.textSecondary} />
                </Pressable>
              ))}
            </View>
            <Text style={[styles.pickLabel, { color: theme.textSecondary }]}>Color</Text>
            <View style={styles.colorRow}>
              {Colors.accountColors.map(c => (
                <Pressable
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorSelected]}
                  onPress={() => { setColor(c); Haptics.selectionAsync(); }}
                />
              ))}
            </View>
            <View style={styles.formActions}>
              <Pressable style={[styles.cancelBtn, { backgroundColor: theme.cardElevated }]} onPress={resetForm}>
                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
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
  accountItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  accIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  accInfo: { flex: 1, gap: 2 },
  accName: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  accBalance: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  formCard: { marginHorizontal: 20, borderRadius: 16, padding: 20, marginTop: 16, gap: 12 },
  formTitle: { fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  pickLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
