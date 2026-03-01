import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Pressable, TextInput,
  Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useFinance } from '@/lib/finance-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const CATEGORY_ICONS = [
  'restaurant', 'car', 'cart', 'flash', 'game-controller', 'medkit',
  'school', 'home', 'nutrition', 'wallet', 'laptop', 'trending-up',
  'gift', 'return-down-back', 'airplane', 'fitness', 'shirt',
  'musical-notes', 'paw', 'cafe', 'book', 'construct',
  'ellipsis-horizontal-circle',
];

type TabType = 'expense' | 'income';

export default function ManageCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [tab, setTab] = useState<TabType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('restaurant');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = categories.filter(c => c.type === tab);

  const resetForm = () => {
    setName('');
    setIcon('restaurant');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a category name.');
      return;
    }
    if (editingId) {
      await updateCategory(editingId, { name: name.trim(), icon });
    } else {
      await addCategory({ name: name.trim(), icon, type: tab });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  };

  const handleDelete = (id: string, catName: string) => {
    Alert.alert('Delete Category', `Delete "${catName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteCategory(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Categories</Text>
        <Pressable onPress={() => { setShowForm(true); Haptics.selectionAsync(); }} hitSlop={12}>
          <Ionicons name="add" size={24} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabChip, { backgroundColor: theme.card }, tab === 'expense' && [styles.tabActive, { backgroundColor: theme.primaryMuted }]]}
          onPress={() => { setTab('expense'); Haptics.selectionAsync(); }}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, tab === 'expense' && { color: theme.primary }]}>Expense</Text>
        </Pressable>
        <Pressable
          style={[styles.tabChip, { backgroundColor: theme.card }, tab === 'income' && [styles.tabActive, { backgroundColor: theme.primaryMuted }]]}
          onPress={() => { setTab('income'); Haptics.selectionAsync(); }}
        >
          <Text style={[styles.tabText, { color: theme.textSecondary }, tab === 'income' && { color: theme.primary }]}>Income</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
        bottomOffset={60}
      >
        {filtered.map(cat => (
          <Pressable
            key={cat.id}
            style={[styles.catItem, { borderBottomColor: theme.border }]}
            onPress={() => startEdit(cat)}
          >
            <View style={[styles.catIcon, { backgroundColor: tab === 'expense' ? theme.expenseMuted : theme.incomeMuted }]}>
              <Ionicons name={cat.icon as any} size={20} color={tab === 'expense' ? theme.expense : theme.income} />
            </View>
            <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
            <Pressable onPress={() => handleDelete(cat.id, cat.name)} hitSlop={12}>
              <Ionicons name="trash-outline" size={18} color={theme.textTertiary} />
            </Pressable>
          </Pressable>
        ))}

        {showForm && (
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>{editingId ? 'Edit Category' : 'New Category'}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardElevated, color: theme.text }]}
              placeholder="Category name"
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <Text style={[styles.pickLabel, { color: theme.textSecondary }]}>Icon</Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.map(ic => (
                <Pressable
                  key={ic}
                  style={[styles.iconOption, { backgroundColor: theme.cardElevated }, icon === ic && [styles.iconSelected, { backgroundColor: theme.primaryMuted, borderColor: theme.primary }]]}
                  onPress={() => { setIcon(ic); Haptics.selectionAsync(); }}
                >
                  <Ionicons name={ic as any} size={20} color={icon === ic ? theme.primary : theme.textSecondary} />
                </Pressable>
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
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  tabChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: {},
  tabText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  catItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  catIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  formCard: { marginHorizontal: 20, borderRadius: 16, padding: 20, marginTop: 16, gap: 12 },
  formTitle: { fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  pickLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconSelected: { borderWidth: 1.5 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
