import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, fontSizes, fontWeights, commonStyles } from '../../theme';
import { playSpinnerTickSound } from '../../services/soundEffects';
import { isSameDay, formatDateLabel } from '../../utils/scheduleUtils';

interface CalendarPickerViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date, label: string) => void;
}

const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const CalendarPickerView: React.FC<CalendarPickerViewProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [calYear, setCalYear] = useState<number>(() => selectedDate.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(() => selectedDate.getMonth());

  // Keep calendar month & year in sync if selectedDate prop changes
  useEffect(() => {
    setCalYear(selectedDate.getFullYear());
    setCalMonth(selectedDate.getMonth());
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const prevMonth = () => {
    playSpinnerTickSound(750);
    triggerHaptic();
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    playSpinnerTickSound(850);
    triggerHaptic();
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    playSpinnerTickSound(900);
    triggerHaptic();
    const newDate = new Date(calYear, calMonth, day);
    const formatted = formatDateLabel(newDate);
    onSelectDate(newDate, formatted);
  };

  const handleQuickJumpDate = (offsetDays: number, label: string) => {
    playSpinnerTickSound(850);
    triggerHaptic();
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setCalYear(target.getFullYear());
    setCalMonth(target.getMonth());
    const formatted = label || formatDateLabel(target);
    onSelectDate(target, formatted);
  };

  // Build calendar matrix
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const prevMonthTotalDays = new Date(calYear, calMonth, 0).getDate();

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays: { day: number; inMonth: boolean; date: Date }[] = [];

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    calendarDays.push({
      day: d,
      inMonth: false,
      date: new Date(calYear, calMonth - 1, d),
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      inMonth: true,
      date: new Date(calYear, calMonth, d),
    });
  }

  // Padding days to fill out trailing week cells (total grid multiple of 7)
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      day: d,
      inMonth: false,
      date: new Date(calYear, calMonth + 1, d),
    });
  }

  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Calculate upcoming weekend date (Saturday)
  const currentDayOfWeek = today.getDay();
  const daysUntilSaturday = currentDayOfWeek === 6 ? 7 : (6 - currentDayOfWeek);
  const weekendDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilSaturday);
  const nextWeekDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

  const presets: {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    offset: number;
    isActive: boolean;
  }[] = [
    {
      key: 'today',
      label: 'Today',
      icon: 'today-outline',
      offset: 0,
      isActive: isSameDay(selectedDate, today),
    },
    {
      key: 'tomorrow',
      label: 'Tomorrow',
      icon: 'calendar-outline',
      offset: 1,
      isActive: isSameDay(selectedDate, tomorrow),
    },
    {
      key: 'weekend',
      label: 'Weekend',
      icon: 'cafe-outline',
      offset: daysUntilSaturday,
      isActive: isSameDay(selectedDate, weekendDate),
    },
    {
      key: 'next_week',
      label: '+1 Wk',
      icon: 'arrow-forward-outline',
      offset: 7,
      isActive: isSameDay(selectedDate, nextWeekDate),
    },
  ];

  return (
    <View style={styles.cardContainer}>
      {/* Subtle Top Ambient Lighting Glow */}
      <View style={styles.ambientTopGlow} pointerEvents="none" />

      {/* 1. Glassmorphism Quick Presets Pills (Horizontal scrollable, no collision/cramping) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickDateScrollView}
        contentContainerStyle={styles.quickDateScrollContent}
      >
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.key}
            style={[
              styles.quickDateBtn,
              preset.isActive && styles.quickDateBtnActive,
            ]}
            onPress={() => handleQuickJumpDate(preset.offset, preset.label)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={preset.icon}
              size={13}
              color={preset.isActive ? '#FFFFFF' : '#8A8A9E'}
              style={styles.quickDateIcon}
            />
            <Text
              style={[
                styles.quickDateBtnText,
                preset.isActive && styles.quickDateBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 2. Glassmorphic Month Navigator Header */}
      <View style={styles.calendarMonthHeader}>
        <TouchableOpacity
          onPress={prevMonth}
          style={styles.calNavArrow}
          activeOpacity={0.7}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={17} color="#D0D0DC" />
        </TouchableOpacity>

        <View style={styles.monthTitleWrapper}>
          <Ionicons name="calendar" size={15} color={colors.primary} style={{ marginRight: 7 }} />
          <Text style={styles.calendarMonthTitle}>{monthLabel}</Text>
        </View>

        <TouchableOpacity
          onPress={nextMonth}
          style={styles.calNavArrow}
          activeOpacity={0.7}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={17} color="#D0D0DC" />
        </TouchableOpacity>
      </View>

      {/* 3. Day of Week Header Row */}
      <View style={styles.calendarWeekRow}>
        {dayNames.map((name, i) => (
          <Text key={i} style={styles.calendarWeekLabel}>
            {name}
          </Text>
        ))}
      </View>

      {/* 4. Calendar Day Matrix Grid */}
      <View style={styles.calendarDaysGrid}>
        {calendarDays.map((item, index) => {
          const isSelected = isSameDay(item.date, selectedDate);
          const isToday = isSameDay(item.date, today);

          return (
            <TouchableOpacity
              key={`${index}_${item.day}`}
              style={[
                styles.calendarDayCell,
                isSelected && styles.calendarDayCellSelected,
                !item.inMonth && styles.calendarDayCellMuted,
              ]}
              disabled={!item.inMonth}
              onPress={() => handleSelectDay(item.day)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.calendarDayNumber,
                  isSelected && styles.calendarDayNumberSelected,
                  !item.inMonth && styles.calendarDayNumberMuted,
                ]}
              >
                {item.day}
              </Text>
              {isToday && !isSelected && <View style={styles.calendarTodayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 5. Active Date Selected Indicator Badge */}
      <View style={styles.selectedDateBadgeRow}>
        <View style={styles.selectedDateBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.selectedDateBadgeText}>
            Selected Date: {formatDateLabel(selectedDate, true)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(16, 16, 24, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md + 2,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  ambientTopGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 40,
  },
  quickDateScrollView: {
    marginBottom: spacing.base,
    marginHorizontal: -spacing.xs,
  },
  quickDateScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    alignItems: 'center',
  },
  quickDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 28, 40, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickDateBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  quickDateIcon: {
    marginRight: 5,
  },
  quickDateBtnText: {
    color: '#8A8A9E',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  quickDateBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeights.heavy,
  },
  calendarMonthHeader: {
    ...commonStyles.rowBetween,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  monthTitleWrapper: {
    ...commonStyles.rowCenter,
  },
  calNavArrow: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: 'rgba(28, 28, 40, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...commonStyles.center,
  },
  calendarMonthTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.subtitle,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
    paddingHorizontal: spacing.xs,
  },
  calendarWeekLabel: {
    width: 38,
    textAlign: 'center',
    color: '#6E6E82',
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  calendarDayCell: {
    width: 38,
    height: 38,
    ...commonStyles.center,
    borderRadius: 12,
    position: 'relative',
  },
  calendarDayCellSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  calendarDayCellMuted: {
    opacity: 0.22,
  },
  calendarDayNumber: {
    color: '#E0E0EA',
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  calendarDayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: fontWeights.heavy,
  },
  calendarDayNumberMuted: {
    color: '#666678',
  },
  calendarTodayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryLight,
  },
  selectedDateBadgeRow: {
    marginTop: spacing.lg,
    ...commonStyles.rowCenter,
  },
  selectedDateBadge: {
    ...commonStyles.rowCenter,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
    marginRight: spacing.sm,
  },
  selectedDateBadgeText: {
    color: colors.primaryLight,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
  },
});
