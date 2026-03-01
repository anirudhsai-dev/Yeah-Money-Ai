import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Category, Transaction, Goal, DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from './types';

const KEYS = {
  ACCOUNTS: 'yeahmoney_accounts',
  CATEGORIES: 'yeahmoney_categories',
  TRANSACTIONS: 'yeahmoney_transactions',
  GOALS: 'yeahmoney_goals',
  INITIALIZED: 'yeahmoney_initialized',
};

export async function initializeData() {
  const initialized = await AsyncStorage.getItem(KEYS.INITIALIZED);
  if (!initialized) {
    await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify([]));
    await AsyncStorage.setItem(KEYS.INITIALIZED, 'true');
  }
}

export async function getAccounts(): Promise<Account[]> {
  const data = await AsyncStorage.getItem(KEYS.ACCOUNTS);
  return data ? JSON.parse(data) : DEFAULT_ACCOUNTS;
}

export async function saveAccounts(accounts: Account[]) {
  await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export async function getCategories(): Promise<Category[]> {
  const data = await AsyncStorage.getItem(KEYS.CATEGORIES);
  return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
}

export async function saveCategories(categories: Category[]) {
  await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
}

export async function getTransactions(): Promise<Transaction[]> {
  const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
}

export async function saveTransactions(transactions: Transaction[]) {
  await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export async function getGoals(): Promise<Goal[]> {
  const data = await AsyncStorage.getItem(KEYS.GOALS);
  return data ? JSON.parse(data) : [];
}

export async function saveGoals(goals: Goal[]) {
  await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
}
