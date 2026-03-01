export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  openingBalance: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  date: string;
  time?: string;
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  allocatedAmount: number;
  targetDate?: string;
  icon: string;
  notes?: string;
  isCompleted: boolean;
  isPaused: boolean;
  createdAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Food & Dining', icon: 'restaurant', type: 'expense' },
  { id: 'cat_transport', name: 'Transport', icon: 'car', type: 'expense' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'cart', type: 'expense' },
  { id: 'cat_bills', name: 'Bills & Utilities', icon: 'flash', type: 'expense' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'game-controller', type: 'expense' },
  { id: 'cat_health', name: 'Health', icon: 'medkit', type: 'expense' },
  { id: 'cat_education', name: 'Education', icon: 'school', type: 'expense' },
  { id: 'cat_rent', name: 'Rent', icon: 'home', type: 'expense' },
  { id: 'cat_groceries', name: 'Groceries', icon: 'nutrition', type: 'expense' },
  { id: 'cat_other_exp', name: 'Other', icon: 'ellipsis-horizontal-circle', type: 'expense' },
  { id: 'cat_salary', name: 'Salary', icon: 'wallet', type: 'income' },
  { id: 'cat_freelance', name: 'Freelance', icon: 'laptop', type: 'income' },
  { id: 'cat_investment', name: 'Investment', icon: 'trending-up', type: 'income' },
  { id: 'cat_gift', name: 'Gift', icon: 'gift', type: 'income' },
  { id: 'cat_refund', name: 'Refund', icon: 'return-down-back', type: 'income' },
  { id: 'cat_other_inc', name: 'Other', icon: 'ellipsis-horizontal-circle', type: 'income' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'Cash', icon: 'cash', color: '#00D09C', openingBalance: 0, createdAt: new Date().toISOString() },
  { id: 'acc_bank', name: 'Bank Account', icon: 'business', color: '#5B8DEF', openingBalance: 0, createdAt: new Date().toISOString() },
];

export const ACCOUNT_ICONS = [
  'cash', 'card', 'wallet', 'business', 'globe', 'diamond', 'shield', 'star',
];

export const GOAL_ICONS = [
  'flag', 'trophy', 'rocket', 'airplane', 'home', 'car', 'school', 'heart',
  'diamond', 'gift', 'shield', 'star',
];
