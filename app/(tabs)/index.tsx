import React, { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable,
  Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, useThemeConfig } from '@/hooks/useTheme';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { isDark } = useThemeConfig();
  const {
    accounts, categories, transactions, getAccountBalance,
    getTotalBalance, getMonthlyIncome, getMonthlyExpense, refreshData, isLoading,
  } = useFinance();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  const monthlyIncome = useMemo(() => getMonthlyIncome(selectedYear, selectedMonth), [getMonthlyIncome, selectedYear, selectedMonth]);
  const monthlyExpense = useMemo(() => getMonthlyExpense(selectedYear, selectedMonth), [getMonthlyExpense, selectedYear, selectedMonth]);
  const netBalance = monthlyIncome - monthlyExpense;
  const totalBalance = useMemo(() => getTotalBalance(), [getTotalBalance]);

  const visibleAccounts = useMemo(() => accounts.filter(acc => !acc.isHidden), [accounts]);
  const visibleAccountIds = useMemo(() => new Set(visibleAccounts.map(a => a.id)), [visibleAccounts]);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => visibleAccountIds.has(t.accountId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions, visibleAccountIds]);

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    Haptics.selectionAsync();
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    Haptics.selectionAsync();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Transfer';
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryIcon = (categoryId?: string): string => {
    if (!categoryId) return 'swap-horizontal';
    return categories.find(c => c.id === categoryId)?.icon || 'help-circle';
  };

  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Unknown';
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + bottomInset }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>Yeah! Money</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Money Matters A Lot!</Text>
          </View>
          <Pressable
            onPress={() => { router.push('/settings'); Haptics.selectionAsync(); }}
            style={[styles.settingsBtn, { backgroundColor: theme.card }]}
          >
            <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.monthSelector}>
          <Pressable onPress={prevMonth} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
          </Pressable>
          <Text style={[styles.monthText, { color: theme.text }]}>{getMonthName(selectedMonth)} {selectedYear}</Text>
          <Pressable onPress={nextMonth} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Shadow Wrapper: Handles only the shadow/elevation */}
        <View style={[
          styles.summaryShadowWrapper,
          isDark ? styles.summaryShadowDark : styles.summaryShadowLight
        ]}>
          {/* Clipping Container: Handles borderRadius and overflow */}
          <View style={styles.summaryClipContainer}>
            <LinearGradient
              colors={isDark ? ['#1A2F2A', '#14141C'] : ['#E8F5E9', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Net Balance</Text>
              <Text style={[styles.summaryAmount, { color: netBalance >= 0 ? theme.income : theme.expense }]}>
                {netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netBalance))}
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryDot, { backgroundColor: theme.income }]} />
                  <View>
                    <Text style={[styles.summaryItemLabel, { color: theme.textSecondary }]}>Income</Text>
                    <Text style={[styles.summaryItemAmount, { color: theme.income }]}>
                      +{formatCurrency(monthlyIncome)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.summaryItem}>
                  <View style={[styles.summaryDot, { backgroundColor: theme.expense }]} />
                  <View>
                    <Text style={[styles.summaryItemLabel, { color: theme.textSecondary }]}>Expense</Text>
                    <Text style={[styles.summaryItemAmount, { color: theme.expense }]}>
                      -{formatCurrency(monthlyExpense)}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Accounts</Text>
          <Pressable onPress={() => { router.push('/manage-accounts'); Haptics.selectionAsync(); }}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>Manage</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsRow}>
          <Pressable style={[styles.totalBalanceCard, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="wallet" size={20} color={theme.primary} />
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total Balance</Text>
            <Text style={[styles.totalAmount, { color: theme.text }]}>{formatCurrency(totalBalance)}</Text>
          </Pressable>
          {visibleAccounts.map(account => (
            <Pressable key={account.id} style={[styles.accountCard, { borderLeftColor: account.color, backgroundColor: theme.card }]}>
              <Ionicons name={account.icon as any} size={18} color={account.color} />
              <Text style={[styles.accountName, { color: theme.textSecondary }]} numberOfLines={1}>{account.name}</Text>
              <Text style={[styles.accountBalance, { color: theme.text }]}>{formatCurrency(getAccountBalance(account.id))}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
          <Pressable onPress={() => { router.push('/(tabs)/transactions'); Haptics.selectionAsync(); }}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>Tap + to add your first transaction</Text>
          </View>
        ) : (
          recentTransactions.map(txn => (
            <Pressable
              key={txn.id}
              style={styles.txnItem}
              onPress={() => {
                router.push({ pathname: '/add-transaction', params: { editId: txn.id } });
                Haptics.selectionAsync();
              }}
            >
              <View style={[styles.txnIcon, {
                backgroundColor: txn.type === 'income' ? theme.incomeMuted
                  : txn.type === 'expense' ? theme.expenseMuted
                  : theme.transferMuted
              }]}>
                <Ionicons
                  name={txn.type === 'transfer' ? 'swap-horizontal' : getCategoryIcon(txn.categoryId) as any}
                  size={20}
                  color={txn.type === 'income' ? theme.income
                    : txn.type === 'expense' ? theme.expense
                    : theme.transfer}
                />
              </View>
              <View style={styles.txnInfo}>
                <Text style={[styles.txnCategory, { color: theme.text }]}>{getCategoryName(txn.categoryId)}</Text>
                <Text style={[styles.txnAccount, { color: theme.textSecondary }]}>
                  {getAccountName(txn.accountId)}
                  {txn.type === 'transfer' && txn.toAccountId ? ` → ${getAccountName(txn.toAccountId)}` : ''}
                </Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, {
                  color: txn.type === 'income' ? theme.income
                    : txn.type === 'expense' ? theme.expense
                    : theme.transfer
                }]}>
                  {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount)}
                </Text>
                <Text style={[styles.txnDate, { color: theme.textTertiary }]}>{formatDate(txn.date, txn.time)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => { router.push('/add-transaction'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
      >
        <LinearGradient
          colors={[theme.primary, theme.background === '#0A0A0F' ? '#00B386' : '#00A87E']}
          style={[styles.fabGradient, { shadowColor: theme.primary }]}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 26, fontFamily: 'DMSans_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 16 },
  monthText: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', minWidth: 140, textAlign: 'center' },
  summaryShadowWrapper: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    }),
  },
  summaryShadowLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  summaryShadowDark: {
    backgroundColor: '#14141C',
  },
  summaryClipContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  summaryCard: {
    padding: 20,
  },
  summaryLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  summaryAmount: { fontSize: 32, fontFamily: 'DMSans_700Bold', marginTop: 4, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryItemLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  summaryItemAmount: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', marginTop: 2 },
  divider: { width: 1, height: 36, marginHorizontal: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold' },
  seeAll: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  accountsRow: { paddingHorizontal: 20, gap: 12 },
  totalBalanceCard: { borderRadius: 16, padding: 16, minWidth: 130, gap: 6 },
  totalLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  totalAmount: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  accountCard: { borderRadius: 16, padding: 16, minWidth: 130, gap: 6, borderLeftWidth: 3 },
  accountName: { fontSize: 13, fontFamily: 'DMSans_500Medium', maxWidth: 100 },
  accountBalance: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  emptySubtext: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  txnItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  txnIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, gap: 2 },
  txnCategory: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  txnAccount: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  txnRight: { alignItems: 'flex-end', gap: 2 },
  txnAmount: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  txnDate: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  fab: { position: 'absolute', bottom: 90, right: 20, zIndex: 10 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
