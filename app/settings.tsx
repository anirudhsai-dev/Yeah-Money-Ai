import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme, useThemeConfig, ThemeType } from '@/hooks/useTheme';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { themeSetting, setThemeSetting } = useThemeConfig();
  const [isThemeExpanded, setIsThemeExpanded] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleThemeChange = (setting: ThemeType) => {
    setThemeSetting(setting);
    Haptics.selectionAsync();
  };

  const themeOptions: { label: string; value: ThemeType; icon: string }[] = [
    { label: 'Light Theme', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark Theme', value: 'dark', icon: 'moon-outline' },
    { label: 'System Default', value: 'system', icon: 'settings-outline' },
  ];

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Theme Setting */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Pressable
            style={styles.settingRow}
            onPress={() => {
              setIsThemeExpanded(!isThemeExpanded);
              Haptics.selectionAsync();
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="color-palette-outline" size={22} color={theme.primary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Theme</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {themeSetting.charAt(0).toUpperCase() + themeSetting.slice(1)}
              </Text>
              <Ionicons
                name={isThemeExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.textTertiary}
              />
            </View>
          </Pressable>

          {isThemeExpanded && (
            <View style={[styles.expandContent, { borderTopColor: theme.border }]}>
              {themeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={styles.radioRow}
                  onPress={() => handleThemeChange(option.value)}
                >
                  <View style={styles.radioLabelContainer}>
                    <Ionicons name={option.icon as any} size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
                    <Text style={[styles.radioLabel, { color: theme.text }]}>{option.label}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    { borderColor: theme.border },
                    themeSetting === option.value && { borderColor: theme.primary, backgroundColor: theme.primaryMuted }
                  ]}>
                    {themeSetting === option.value && (
                      <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Version Info */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color={theme.textSecondary} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>App Version</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
              {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold' },
  content: { padding: 20, gap: 16 },
  section: { borderRadius: 16, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, fontFamily: 'DMSans_500Medium' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  expandContent: { borderTopWidth: 1, paddingVertical: 8 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  radioLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  radioLabel: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
});
