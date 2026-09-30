import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { playSpinnerTickSound } from '../../services/soundEffects';
import { isSameDay, formatDateLabel } from '../../utils/scheduleUtils';

interface CalendarPickerViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date, label: string) => void;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarPickerView: React.FC<CalendarPickerViewProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [calYear, setCalYear] = useState<number>(() => selectedDate.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(() => selectedDate.getMonth());

  const prevMonth = () => {
    playSpinnerTickSound(750);
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    playSpinnerTickSound(850);
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    playSpinnerTickSound(900);
    const newDate = new Date(calYear, calMonth, day);
    const formatted = formatDateLabel(newDate);
    onSelectDate(newDate, formatted);
  };

  const handleQuickJumpDate = (offsetDays: number, label: string) => {
    playSpinnerTickSound(850);
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

  return (
    <View style={styles.container}>
      {/* Quick Jump Date Buttons */}
      <View style={styles.quickDateRow}>
        <TouchableOpacity
          style={[
            styles.quickDateBtn,
            isSameDay(selectedDate, today) && styles.quickDateBtnActive,
          ]}
          onPress={() => handleQuickJumpDate(0, 'Today')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.quickDateBtnText,
              isSameDay(selectedDate, today) && styles.quickDateBtnTextActive,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickDateBtn,
            isSameDay(selectedDate, tomorrow) && styles.quickDateBtnActive,
          ]}
          onPress={() => handleQuickJumpDate(1, 'Tomorrow')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.quickDateBtnText,
              isSameDay(selectedDate, tomorrow) && styles.quickDateBtnTextActive,
            ]}
          >
            Tomorrow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickDateBtn}
          onPress={() => handleQuickJumpDate(7, '')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickDateBtnText}>+1 Week</Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigator Header */}
      <View style={styles.calendarMonthHeader}>
        <TouchableOpacity onPress={prevMonth} style={styles.calNavArrow} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#C4C4D0" />
        </TouchableOpacity>
        <Text style={styles.calendarMonthTitle}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.calNavArrow} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color="#C4C4D0" />
        </TouchableOpacity>
      </View>

      {/* Day of Week Headers */}
      <View style={styles.calendarWeekRow}>
        {dayNames.map((name, i) => (
          <Text key={i} style={styles.calendarWeekLabel}>
            {name}
          </Text>
        ))}
      </View>

      {/* Calendar Day Cells Grid */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#161620',
    borderWidth: 1,
    borderColor: '#242432',
  },
  quickDateBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickDateBtnText: {
    color: '#9090A2',
    fontSize: 12,
    fontWeight: '700',
  },
  quickDateBtnTextActive: {
    color: '#151518',
    fontWeight: '800',
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 6,
  },
  calNavArrow: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#181822',
  },
  calendarMonthTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarWeekLabel: {
    width: 38,
    textAlign: 'center',
    color: '#6E6E80',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  calendarDayCell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  calendarDayCellSelected: {
    backgroundColor: colors.primary,
  },
  calendarDayCellMuted: {
    opacity: 0.28,
  },
  calendarDayNumber: {
    color: '#E0E0EA',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarDayNumberSelected: {
    color: '#151518',
    fontWeight: '800',
  },
  calendarDayNumberMuted: {
    color: '#666678',
  },
  calendarTodayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
