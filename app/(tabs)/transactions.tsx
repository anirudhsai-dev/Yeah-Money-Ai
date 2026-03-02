import React, { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, FlatList, Pressable,
  TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, formatDate, parseISODate } from '@/lib/utils';
import { Transaction } from '@/lib/types';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { transactions, categories, accounts } = useFinance();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const categoryById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const accountById = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);
  const visibleAccountIds = useMemo(() => new Set(accounts.filter(a => !a.isHidden).map(a => a.id)), [accounts]);

  const filtered = useMemo(() => {
    // Filter out transactions from hidden accounts
    let list = transactions.filter(t => visibleAccountIds.has(t.accountId));

    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => {
        const cat = t.categoryId ? categoryById.get(t.categoryId) : undefined;
        const acc = accountById.get(t.accountId);
        return (
          cat?.name.toLowerCase().includes(q) ||
          acc?.name.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
        );
      });
    }
    return list.sort((a, b) => {
      const dateA = parseISODate(a.date)?.getTime() ?? 0;
      const dateB = parseISODate(b.date)?.getTime() ?? 0;
      return dateB - dateA;
    });
  }, [transactions, filterType, search, categoryById, accountById, visibleAccountIds]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Transfer';
    return categoryById.get(categoryId)?.name || 'Unknown';
  };

  const getCategoryIcon = (categoryId?: string): string => {
    if (!categoryId) return 'swap-horizontal';
    return categoryById.get(categoryId)?.icon || 'help-circle';
  };

  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Unknown';
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' },
    { key: 'transfer', label: 'Transfer' },
  ];

  const renderItem = ({ item: txn }: { item: Transaction }) => (
    <Pressable
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
        <Text style={[styles.txnAccount, { color: theme.textSecondary }]} numberOfLines={1}>
          {getAccountName(txn.accountId)}
          {txn.type === 'transfer' && txn.toAccountId ? ` → ${getAccountName(txn.toAccountId)}` : ''}
          {txn.notes ? ` · ${txn.notes}` : ''}
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
  );

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => { router.push('/manage-categories'); Haptics.selectionAsync(); }}
            style={[styles.catBtn, { backgroundColor: theme.card }]}
          >
            <Ionicons name="pricetag-outline" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={18} color={theme.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={theme.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, { backgroundColor: theme.card }, filterType === f.key && [styles.filterChipActive, { backgroundColor: theme.primaryMuted }]]}
            onPress={() => { setFilterType(f.key); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.filterText, { color: theme.textSecondary }, filterType === f.key && [styles.filterTextActive, { color: theme.primary }]]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions found</Text>
          </View>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => { router.push('/add-transaction'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
      >
        <View style={[styles.fabInner, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerActions: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 26, fontFamily: 'DMSans_700Bold' },
  catBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'DMSans_400Regular', padding: 0 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterChipActive: {},
  filterText: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  filterTextActive: {},
  txnItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  txnIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, gap: 2 },
  txnCategory: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  txnAccount: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  txnRight: { alignItems: 'flex-end', gap: 2 },
  txnAmount: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  txnDate: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  fab: { position: 'absolute', bottom: 90, right: 20, zIndex: 10 },
  fabInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
