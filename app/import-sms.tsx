import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useFinance } from '@/lib/finance-context';
import { parseBulkSms } from '@/lib/sms-parser';

const CATEGORY_HINT_TO_KEYWORD: Record<string, string[]> = {
  food: ['food', 'dining'],
  transport: ['transport'],
  bills: ['bill', 'utilities'],
  shopping: ['shopping'],
  health: ['health'],
  salary: ['salary'],
  other: ['other'],
};

export default function ImportSmsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { accounts, categories, addTransaction } = useFinance();
  const [rawSms, setRawSms] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 20 : insets.bottom;

  const parsed = useMemo(() => parseBulkSms(rawSms), [rawSms]);

  const resolveCategoryId = (hint: string, type: 'income' | 'expense') => {
    const keywords = CATEGORY_HINT_TO_KEYWORD[hint] || ['other'];
    return (
      categories.find(c => c.type === type && keywords.some(k => c.name.toLowerCase().includes(k)))?.id ||
      categories.find(c => c.type === type)?.id
    );
  };

  const handleImport = async () => {
    if (!accounts.length) {
      Alert.alert('No accounts', 'Please create an account before importing SMS.');
      return;
    }
    if (!parsed.length) {
      Alert.alert('No transactions found', 'Paste transaction SMS lines first.');
      return;
    }

    const accountId = accounts[0].id;
    const date = new Date().toISOString().split('T')[0];

    for (const item of parsed) {
      await addTransaction({
        type: item.type,
        amount: item.amount,
        accountId,
        categoryId: resolveCategoryId(item.categoryHint, item.type),
        date,
        notes: `Imported SMS: ${item.notes}`,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Imported', `${parsed.length} transactions added from SMS text.`);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Import SMS</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollViewCompat contentContainerStyle={{ paddingBottom: bottomInset + 24 }}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>Paste SMS Text</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Paste bank SMS lines here to auto-detect expenses/income. No inbox permission is required.
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.cardElevated, color: theme.text }]}
            multiline
            value={rawSms}
            onChangeText={setRawSms}
            placeholder="Example: INR 450 debited via UPI at Zomato..."
            placeholderTextColor={theme.textTertiary}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>Detected Transactions</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{parsed.length} detected</Text>
          {parsed.slice(0, 8).map((item, idx) => (
            <View key={`${item.notes}-${idx}`} style={styles.itemRow}>
              <Text style={[styles.typePill, { color: item.type === 'expense' ? theme.expense : theme.income }]}>
                {item.type.toUpperCase()}
              </Text>
              <Text style={[styles.itemAmount, { color: theme.text }]}>₹{item.amount.toFixed(2)}</Text>
              <Text style={[styles.itemHint, { color: theme.textSecondary }]}>{item.categoryHint}</Text>
            </View>
          ))}
          {parsed.length > 8 && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>+{parsed.length - 8} more…</Text>}
        </View>

        <Pressable style={[styles.importBtn, { backgroundColor: theme.primary }]} onPress={handleImport}>
          <Text style={styles.importBtnText}>Import Transactions</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold' },
  card: { marginHorizontal: 20, borderRadius: 14, padding: 14, marginBottom: 14 },
  title: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', marginBottom: 6 },
  subtitle: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 8 },
  input: { minHeight: 180, borderRadius: 10, padding: 12, fontFamily: 'DMSans_400Regular' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typePill: { fontSize: 10, fontFamily: 'DMSans_700Bold', width: 60 },
  itemAmount: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', width: 90 },
  itemHint: { fontSize: 12, fontFamily: 'DMSans_400Regular', textTransform: 'capitalize' },
  importBtn: { marginHorizontal: 20, marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  importBtnText: { color: '#fff', fontSize: 14, fontFamily: 'DMSans_700Bold' },
});
