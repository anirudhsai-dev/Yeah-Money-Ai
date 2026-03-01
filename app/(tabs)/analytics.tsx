import React, { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, getMonthName, getShortMonthName, parseISODate } from '@/lib/utils';

const CHART_COLORS = ['#00D09C', '#5B8DEF', '#FF6B6B', '#FFB84D', '#A78BFA', '#F472B6', '#34D399', '#FB923C', '#60A5FA', '#C084FC'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PieChartProps {
  data: { name: string; amount: number; color: string }[];
  theme: any;
  totalLabel: string;
}

function PieChart({ data, theme, totalLabel }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const size = SCREEN_WIDTH * 0.55;
  const radius = size / 2.2;
  const center = size / 2;

  let currentAngle = -90;

  if (total === 0) return null;

  return (
    <View style={styles.pieContainer}>
      <View style={styles.svgWrapper}>
        <Svg width={size} height={size}>
          <G>
            {data.map((item, index) => {
              if (item.amount === 0) return null;

              const percentage = item.amount / total;
              const angle = percentage * 360;

              if (percentage >= 0.999) {
                return (
                  <Circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill={item.color}
                  />
                );
              }

              const x1 = center + radius * Math.cos((Math.PI * currentAngle) / 180);
              const y1 = center + radius * Math.sin((Math.PI * currentAngle) / 180);

              const nextAngle = currentAngle + angle;
              const x2 = center + radius * Math.cos((Math.PI * nextAngle) / 180);
              const y2 = center + radius * Math.sin((Math.PI * nextAngle) / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;
              const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              currentAngle = nextAngle;

              return (
                <Path
                  key={index}
                  d={d}
                  fill={item.color}
                  stroke={theme.card}
                  strokeWidth={2}
                />
              );
            })}
            <Circle cx={center} cy={center} r={radius * 0.65} fill={theme.card} />
          </G>
        </Svg>
        <View style={styles.totalOverlay}>
          <Text style={[styles.totalOverlayLabel, { color: theme.textSecondary }]}>{totalLabel}</Text>
          <Text style={[styles.totalOverlayValue, { color: theme.text }]} numberOfLines={1}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>

      <View style={styles.pieLegend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItemSmall}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.legendHeader}>
                <Text style={[styles.legendTextSmall, { color: theme.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.legendValueSmall, { color: theme.textSecondary }]}>
                  {Math.round((item.amount / total) * 100)}%
                </Text>
              </View>
              <View style={[styles.legendBarTrack, { backgroundColor: theme.cardElevated }]}>
                <View style={[styles.legendBarFill, { backgroundColor: item.color, width: `${(item.amount / total) * 100}%` }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { transactions, categories, accounts, getAccountBalance } = useFinance();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
    Haptics.selectionAsync();
  };

  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
    Haptics.selectionAsync();
  };

  const monthlyTxns = useMemo(() => {
    return transactions.filter(t => {
      const d = parseISODate(t.date);
      return !!d && d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const totalIncome = useMemo(() => monthlyTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthlyTxns]);
  const totalExpense = useMemo(() => monthlyTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthlyTxns]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthlyTxns.filter(t => t.type === 'expense' && t.categoryId).forEach(t => {
      map.set(t.categoryId!, (map.get(t.categoryId!) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([id, amount], i) => {
        const cat = categories.find(c => c.id === id);
        return {
          id,
          name: cat?.name || 'Unknown',
          icon: cat?.icon || 'help-circle',
          amount,
          color: CHART_COLORS[i % CHART_COLORS.length]
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTxns, categories]);

  const incomeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthlyTxns.filter(t => t.type === 'income' && t.categoryId).forEach(t => {
      map.set(t.categoryId!, (map.get(t.categoryId!) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([id, amount], i) => {
        const cat = categories.find(c => c.id === id);
        return {
          id,
          name: cat?.name || 'Unknown',
          icon: cat?.icon || 'help-circle',
          amount,
          color: CHART_COLORS[i % CHART_COLORS.length]
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTxns, categories]);

  const last6Months = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      if (m < 0) { m += 12; y -= 1; }
      const income = transactions
        .filter(t => {
          const d = parseISODate(t.date);
          return !!d && t.type === 'income' && d.getFullYear() === y && d.getMonth() === m;
        })
        .reduce((s, t) => s + t.amount, 0);
      const expense = transactions
        .filter(t => {
          const d = parseISODate(t.date);
          return !!d && t.type === 'expense' && d.getFullYear() === y && d.getMonth() === m;
        })
        .reduce((s, t) => s + t.amount, 0);
      result.push({ month: getShortMonthName(m), income, expense });
    }
    return result;
  }, [transactions, selectedMonth, selectedYear]);

  const maxTrend = useMemo(() => Math.max(...last6Months.map(m => Math.max(m.income, m.expense)), 1), [last6Months]);

  const accountDistribution = useMemo(() => {
    return accounts.map(acc => ({
      ...acc,
      balance: getAccountBalance(acc.id),
    })).filter(a => a.balance > 0).sort((a, b) => b.balance - a.balance);
  }, [accounts, getAccountBalance]);

  const totalPositiveBalance = useMemo(() => accountDistribution.reduce((s, a) => s + a.balance, 0), [accountDistribution]);

  const incomeExpenseBarMax = Math.max(totalIncome, totalExpense, 1);

  const expenseIncreaseInsights = useMemo(() => {
    let prevMonthNum = selectedMonth - 1;
    let prevYearNum = selectedYear;
    if (prevMonthNum < 0) {
      prevMonthNum = 11;
      prevYearNum -= 1;
    }

    const currentByCategory = new Map<string, number>();
    const previousByCategory = new Map<string, number>();

    for (const txn of transactions) {
      if (txn.type !== 'expense' || !txn.categoryId) continue;
      const d = parseISODate(txn.date);
      if (!d) continue;

      if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        currentByCategory.set(txn.categoryId, (currentByCategory.get(txn.categoryId) || 0) + txn.amount);
      } else if (d.getFullYear() === prevYearNum && d.getMonth() === prevMonthNum) {
        previousByCategory.set(txn.categoryId, (previousByCategory.get(txn.categoryId) || 0) + txn.amount);
      }
    }

    const allCategoryIds = new Set([...currentByCategory.keys(), ...previousByCategory.keys()]);
    return Array.from(allCategoryIds).map((categoryId) => {
      const current = currentByCategory.get(categoryId) || 0;
      const previous = previousByCategory.get(categoryId) || 0;
      const change = current - previous;
      const changePct = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);
      const category = categories.find(c => c.id === categoryId);

      return {
        categoryId,
        name: category?.name || 'Unknown',
        icon: category?.icon || 'help-circle',
        current,
        previous,
        change,
        changePct,
      };
    })
      .filter(item => item.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 5);
  }, [transactions, categories, selectedMonth, selectedYear]);


  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>

        <View style={styles.monthSelector}>
          <Pressable onPress={prevMonth} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
          </Pressable>
          <Text style={[styles.monthText, { color: theme.text }]}>{getMonthName(selectedMonth)} {selectedYear}</Text>
          <Pressable onPress={nextMonth} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Income vs Expense</Text>
          <View style={styles.barGroup}>
            <View style={styles.barRow}>
              <Text style={[styles.barLabel, { color: theme.textSecondary }]}>Income</Text>
              <View style={[styles.barTrack, { backgroundColor: theme.cardElevated }]}>
                <View style={[styles.barFill, { width: `${(totalIncome / incomeExpenseBarMax) * 100}%`, backgroundColor: theme.income }]} />
              </View>
              <Text style={[styles.barValue, { color: theme.income }]}>+{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={[styles.barLabel, { color: theme.textSecondary }]}>Expense</Text>
              <View style={[styles.barTrack, { backgroundColor: theme.cardElevated }]}>
                <View style={[styles.barFill, { width: `${(totalExpense / incomeExpenseBarMax) * 100}%`, backgroundColor: theme.expense }]} />
              </View>
              <Text style={[styles.barValue, { color: theme.expense }]}>-{formatCurrency(totalExpense)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Monthly Trends</Text>
          <View style={styles.trendChart}>
            {last6Months.map((m, i) => (
              <View key={i} style={styles.trendCol}>
                <View style={styles.trendBars}>
                  <View style={[styles.trendBar, { height: Math.max((m.income / maxTrend) * 80, 2), backgroundColor: theme.income }]} />
                  <View style={[styles.trendBar, { height: Math.max((m.expense / maxTrend) * 80, 2), backgroundColor: theme.expense }]} />
                </View>
                <Text style={[styles.trendLabel, { color: theme.textTertiary }]}>{m.month}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.income }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.expense }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Expense</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Expense by Category</Text>
          {categoryBreakdown.length === 0 ? (
            <Text style={[styles.noData, { color: theme.textTertiary }]}>No expenses this month</Text>
          ) : (
            <PieChart data={categoryBreakdown} theme={theme} totalLabel="Total Expense" />
          )}
        </View>

        {incomeBreakdown.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Income by Category</Text>
            <PieChart data={incomeBreakdown} theme={theme} totalLabel="Total Income" />
          </View>
        )}


        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Expense Increase Alerts</Text>
          {expenseIncreaseInsights.length === 0 ? (
            <Text style={[styles.noData, { color: theme.textTertiary }]}>No category has increased versus last month. Great control!</Text>
          ) : (
            <>
              <Text style={[styles.insightSubtext, { color: theme.textSecondary }]}>Auto-detected from your recorded transactions. Focus on these categories to cut spending.</Text>
              {expenseIncreaseInsights.map(item => (
                <View key={item.categoryId} style={styles.catRow}>
                  <View style={[styles.catIcon, { backgroundColor: `${theme.expense}1A` }]}>
                    <Ionicons name={item.icon as any} size={16} color={theme.expense} />
                  </View>
                  <View style={styles.catInfo}>
                    <Text style={[styles.catName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.insightDelta, { color: theme.expense }]}>+{formatCurrency(item.change)} ({item.changePct.toFixed(0)}%) vs last month</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.catAmount, { color: theme.expense }]}>{formatCurrency(item.current)}</Text>
                    <Text style={[styles.insightPrev, { color: theme.textTertiary }]}>Prev: {formatCurrency(item.previous)}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {accountDistribution.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Account Distribution</Text>
            {accountDistribution.map((acc, i) => (
              <View key={acc.id} style={styles.catRow}>
                <View style={[styles.catIcon, { backgroundColor: `${acc.color}20` }]}>
                  <Ionicons name={acc.icon as any} size={16} color={acc.color} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={[styles.catName, { color: theme.text }]}>{acc.name}</Text>
                  <View style={[styles.catBarTrack, { backgroundColor: theme.cardElevated }]}>
                    <View style={[styles.catBarFill, {
                      width: `${(acc.balance / totalPositiveBalance) * 100}%`,
                      backgroundColor: acc.color,
                    }]} />
                  </View>
                </View>
                <Text style={[styles.catAmount, { color: theme.text }]}>{formatCurrency(acc.balance)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontFamily: 'DMSans_700Bold', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 16 },
  monthText: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', minWidth: 140, textAlign: 'center' },
  card: { marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', marginBottom: 16 },
  barGroup: { gap: 14 },
  barRow: { gap: 6 },
  barLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, minWidth: 4 },
  barValue: { fontSize: 14, fontFamily: 'DMSans_700Bold', marginTop: 2 },
  trendChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
  trendCol: { alignItems: 'center', flex: 1, gap: 6 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  trendBar: { width: 14, borderRadius: 4, minHeight: 2 },
  trendLabel: { fontSize: 10, fontFamily: 'DMSans_500Medium' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  noData: { fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', paddingVertical: 20 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  catIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catInfo: { flex: 1, gap: 4 },
  catName: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  catBarTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: 5, borderRadius: 3, minWidth: 3 },
  catAmount: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  insightSubtext: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginBottom: 12 },
  insightDelta: { fontSize: 11, fontFamily: 'DMSans_500Medium' },
  insightPrev: { fontSize: 10, fontFamily: 'DMSans_400Regular' },
  pieContainer: { alignItems: 'center', paddingVertical: 10 },
  svgWrapper: { position: 'relative', width: SCREEN_WIDTH * 0.55, height: SCREEN_WIDTH * 0.55, justifyContent: 'center', alignItems: 'center' },
  totalOverlay: { position: 'absolute', width: '100%', alignItems: 'center', justifyContent: 'center' },
  totalOverlayLabel: { fontSize: 10, fontFamily: 'DMSans_500Medium', textTransform: 'uppercase' },
  totalOverlayValue: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginTop: 2, paddingHorizontal: 20 },
  pieLegend: { marginTop: 24, width: '100%', gap: 16 },
  legendItemSmall: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  legendTextSmall: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  legendValueSmall: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  legendBarTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  legendBarFill: { height: '100%', borderRadius: 2 },
});
