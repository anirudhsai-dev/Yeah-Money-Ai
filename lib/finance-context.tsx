import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import * as Crypto from 'expo-crypto';
import { Account, Category, Transaction, Goal } from './types';
import * as Store from './storage';
import { parseISODate } from './utils';

interface FinanceContextValue {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  isLoading: boolean;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'isCompleted' | 'isPaused' | 'allocatedAmount'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  batchUpdateGoals: (updates: Array<{ id: string; changes: Partial<Goal> }>) => Promise<void>;
  getAccountBalance: (accountId: string) => number;
  getTotalBalance: () => number;
  getMonthlyIncome: (year: number, month: number) => number;
  getMonthlyExpense: (year: number, month: number) => number;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    await Store.initializeData();
    const [accs, cats, txns, gls] = await Promise.all([
      Store.getAccounts(),
      Store.getCategories(),
      Store.getTransactions(),
      Store.getGoals(),
    ]);
    setAccounts(accs);
    setCategories(cats);
    setTransactions(txns);
    setGoals(gls);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addAccount = useCallback(async (account: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = { ...account, id: Crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    await Store.saveAccounts(updated);
  }, [accounts]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    const updated = accounts.map(a => a.id === id ? { ...a, ...updates } : a);
    setAccounts(updated);
    await Store.saveAccounts(updated);
  }, [accounts]);

  const deleteAccount = useCallback(async (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    await Store.saveAccounts(updated);
  }, [accounts]);

  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...category, id: Crypto.randomUUID() };
    const updated = [...categories, newCategory];
    setCategories(updated);
    await Store.saveCategories(updated);
  }, [categories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    setCategories(updated);
    await Store.saveCategories(updated);
  }, [categories]);

  const deleteCategory = useCallback(async (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    await Store.saveCategories(updated);
  }, [categories]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTxn: Transaction = { ...transaction, id: Crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updated = [newTxn, ...transactions];
    setTransactions(updated);
    await Store.saveTransactions(updated);
  }, [transactions]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const updated = transactions.map(t => t.id === id ? { ...t, ...updates } : t);
    setTransactions(updated);
    await Store.saveTransactions(updated);
  }, [transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    await Store.saveTransactions(updated);
  }, [transactions]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'createdAt' | 'isCompleted' | 'isPaused' | 'allocatedAmount'>) => {
    const newGoal: Goal = { ...goal, id: Crypto.randomUUID(), allocatedAmount: 0, isCompleted: false, isPaused: false, createdAt: new Date().toISOString() };
    const updated = [...goals, newGoal];
    setGoals(updated);
    await Store.saveGoals(updated);
  }, [goals]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    const updated = goals.map(g => g.id === id ? { ...g, ...updates } : g);
    setGoals(updated);
    await Store.saveGoals(updated);
  }, [goals]);

  const deleteGoal = useCallback(async (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    await Store.saveGoals(updated);
  }, [goals]);

  const batchUpdateGoals = useCallback(async (updates: Array<{ id: string; changes: Partial<Goal> }>) => {
    const updated = goals.map(g => {
      const upd = updates.find(u => u.id === g.id);
      return upd ? { ...g, ...upd.changes } : g;
    });
    setGoals(updated);
    await Store.saveGoals(updated);
  }, [goals]);

  const accountBalanceMap = useMemo(() => {
    const balanceById = new Map<string, number>();

    for (const account of accounts) {
      balanceById.set(account.id, account.openingBalance);
    }

    for (const txn of transactions) {
      if (txn.type === 'income') {
        if (txn.accountId) balanceById.set(txn.accountId, (balanceById.get(txn.accountId) || 0) + txn.amount);
      } else if (txn.type === 'expense') {
        if (txn.accountId) balanceById.set(txn.accountId, (balanceById.get(txn.accountId) || 0) - txn.amount);
      } else if (txn.type === 'transfer') {
        if (txn.accountId) balanceById.set(txn.accountId, (balanceById.get(txn.accountId) || 0) - txn.amount);
        if (txn.toAccountId) balanceById.set(txn.toAccountId, (balanceById.get(txn.toAccountId) || 0) + txn.amount);
      }
    }

    return balanceById;
  }, [accounts, transactions]);

  const getAccountBalance = useCallback((accountId: string) => {
    return accountBalanceMap.get(accountId) ?? 0;
  }, [accountBalanceMap]);

  const getTotalBalance = useCallback(() => {
    return accounts
      .filter(acc => !acc.isHidden)
      .reduce((total, acc) => total + getAccountBalance(acc.id), 0);
  }, [accounts, getAccountBalance]);

  const getMonthlyIncome = useCallback((year: number, month: number) => {
    return transactions
      .filter(t => {
        const d = parseISODate(t.date);
        if (!d || d.getFullYear() !== year || d.getMonth() !== month) return false;

        const fromAcc = accounts.find(a => a.id === t.accountId);
        const toAcc = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;

        if (t.type === 'income') {
          return fromAcc && !fromAcc.isHidden;
        } else if (t.type === 'transfer') {
          // Inflow to visible pool: from hidden to visible
          return (fromAcc && fromAcc.isHidden) && (toAcc && !toAcc.isHidden);
        }
        return false;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, accounts]);

  const getMonthlyExpense = useCallback((year: number, month: number) => {
    return transactions
      .filter(t => {
        const d = parseISODate(t.date);
        if (!d || d.getFullYear() !== year || d.getMonth() !== month) return false;

        const fromAcc = accounts.find(a => a.id === t.accountId);
        const toAcc = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;

        if (t.type === 'expense') {
          return fromAcc && !fromAcc.isHidden;
        } else if (t.type === 'transfer') {
          // Outflow from visible pool: from visible to hidden
          return (fromAcc && !fromAcc.isHidden) && (toAcc && toAcc.isHidden);
        }
        return false;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, accounts]);

  const value = useMemo(() => ({
    accounts, categories, transactions, goals, isLoading,
    addAccount, updateAccount, deleteAccount,
    addCategory, updateCategory, deleteCategory,
    addTransaction, updateTransaction, deleteTransaction,
    addGoal, updateGoal, deleteGoal, batchUpdateGoals,
    getAccountBalance, getTotalBalance,
    getMonthlyIncome, getMonthlyExpense,
    refreshData: loadData,
  }), [accounts, categories, transactions, goals, isLoading,
    addAccount, updateAccount, deleteAccount,
    addCategory, updateCategory, deleteCategory,
    addTransaction, updateTransaction, deleteTransaction,
    addGoal, updateGoal, deleteGoal, batchUpdateGoals,
    getAccountBalance, getTotalBalance,
    getMonthlyIncome, getMonthlyExpense, loadData]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
