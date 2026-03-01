import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateDisplay(dateStr: string) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const monthIdx = parseInt(m, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return dateStr;
  return `${parseInt(d, 10)} ${MONTHS[monthIdx]} ${y}`;
}

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

export default function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  const parsed = useMemo(() => {
    const parts = value.split('-');
    if (parts.length === 3) {
      return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1, day: parseInt(parts[2], 10) };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
    Haptics.selectionAsync();
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
    Haptics.selectionAsync();
  };

  const selectDay = (day: number) => {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    onChange(dateStr);
    Haptics.selectionAsync();
    setVisible(false);
  };

  const isSelected = (day: number) => {
    return parsed.year === viewYear && parsed.month === viewMonth && parsed.day === day;
  };

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  };

  const openPicker = () => {
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
    setVisible(true);
  };

  return (
    <>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      <Pressable style={[styles.trigger, { backgroundColor: theme.card }]} onPress={openPicker}>
        <Ionicons name="calendar-outline" size={18} color={theme.primary} />
        <Text style={[styles.triggerText, { color: theme.text }]}>{formatDateDisplay(value)}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={[styles.card, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={styles.monthNav}>
              <Pressable onPress={goToPrevMonth} hitSlop={12}>
                <Ionicons name="chevron-back" size={22} color={theme.text} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: theme.text }]}>{MONTHS[viewMonth]} {viewYear}</Text>
              <Pressable onPress={goToNextMonth} hitSlop={12}>
                <Ionicons name="chevron-forward" size={22} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {DAYS.map(d => (
                <Text key={d} style={[styles.weekDay, { color: theme.textTertiary }]}>{d}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((day, i) => (
                <View key={i} style={styles.dayCell}>
                  {day !== null ? (
                    <Pressable
                      style={[
                        styles.dayBtn,
                        isSelected(day) && [styles.daySelected, { backgroundColor: theme.primary }],
                        isToday(day) && !isSelected(day) && [styles.dayToday, { borderColor: theme.primary }],
                      ]}
                      onPress={() => selectDay(day)}
                    >
                      <Text style={[
                        styles.dayText, { color: theme.text },
                        isSelected(day) && styles.dayTextSelected,
                        isToday(day) && !isSelected(day) && [styles.dayTextToday, { color: theme.primary }],
                      ]}>
                        {day}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>

            <Pressable style={[styles.todayBtn, { backgroundColor: theme.primaryMuted }]} onPress={() => {
              const now = new Date();
              const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
              onChange(todayStr);
              setViewYear(now.getFullYear());
              setViewMonth(now.getMonth());
              Haptics.selectionAsync();
              setVisible(false);
            }}>
              <Text style={[styles.todayBtnText, { color: theme.primary }]}>Today</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 8 },
  trigger: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  triggerText: { flex: 1, fontSize: 14, fontFamily: 'DMSans_500Medium' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { borderRadius: 20, padding: 20, width: '100%', maxWidth: 360 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthLabel: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, padding: 2, alignItems: 'center', justifyContent: 'center' },
  dayBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  daySelected: {},
  dayToday: { borderWidth: 1.5 },
  dayText: { fontSize: 14, fontFamily: 'DMSans_500Medium' },
  dayTextSelected: { color: '#fff', fontFamily: 'DMSans_700Bold' },
  dayTextToday: {},
  todayBtn: { marginTop: 12, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  todayBtnText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
});
