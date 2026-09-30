import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { playSpinnerTickSound } from '../../services/soundEffects';
import {
  computeTimeRange,
  checkSlotConflict,
  ScheduleBlock,
} from '../../utils/scheduleUtils';

export interface DurationOption {
  minutes: number;
  label: string;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { minutes: 15, label: '15m' },
  { minutes: 30, label: '30m' },
  { minutes: 45, label: '45m' },
  { minutes: 60, label: '1h' },
  { minutes: 90, label: '1.5h' },
  { minutes: 120, label: '2h' },
  { minutes: 180, label: '3h' },
];

const baseHours = [
  { hour: 6, period: 'Morning' as const },
  { hour: 7, period: 'Morning' as const },
  { hour: 8, period: 'Morning' as const },
  { hour: 9, period: 'Morning' as const },
  { hour: 10, period: 'Morning' as const },
  { hour: 11, period: 'Morning' as const },
  { hour: 12, period: 'Afternoon' as const },
  { hour: 13, period: 'Afternoon' as const },
  { hour: 14, period: 'Afternoon' as const },
  { hour: 15, period: 'Afternoon' as const },
  { hour: 16, period: 'Afternoon' as const },
  { hour: 17, period: 'Afternoon' as const },
  { hour: 18, period: 'Evening' as const },
  { hour: 19, period: 'Evening' as const },
  { hour: 20, period: 'Evening' as const },
  { hour: 21, period: 'Night' as const },
  { hour: 22, period: 'Night' as const },
  { hour: 23, period: 'Night' as const },
];

interface TimeSlotPickerProps {
  selectedStartHour: number;
  selectedDuration: number;
  occupiedSchedule: ScheduleBlock[];
  onSelectSlot: (slot: { startHour: number; rangeString: string; isOccupied: boolean }) => void;
  onSelectDuration: (durationMinutes: number) => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedStartHour,
  selectedDuration,
  occupiedSchedule,
  onSelectSlot,
  onSelectDuration,
}) => {
  const [timeFilterPeriod, setTimeFilterPeriod] = useState<'All' | 'Morning' | 'Afternoon' | 'Night'>('All');

  const currentSlotRange = useMemo(() => {
    return computeTimeRange(selectedStartHour, selectedDuration);
  }, [selectedStartHour, selectedDuration]);

  const currentSlotOccupied = useMemo(() => {
    return checkSlotConflict(currentSlotRange.startMinutes, selectedDuration, occupiedSchedule);
  }, [currentSlotRange, selectedDuration, occupiedSchedule]);

  const allTimeSlots = useMemo(() => {
    return baseHours.map((item) => {
      const slot = computeTimeRange(item.hour, selectedDuration);
      const occ = checkSlotConflict(slot.startMinutes, selectedDuration, occupiedSchedule);
      return {
        ...item,
        ...slot,
        isOccupied: occ.occupied,
        occupiedTitle: occ.title,
      };
    });
  }, [selectedDuration, occupiedSchedule]);

  const availableSlots = useMemo(() => {
    return allTimeSlots.filter((s) => !s.isOccupied);
  }, [allTimeSlots]);

  const filteredTimeSlots = useMemo(() => {
    return allTimeSlots.filter((opt) => {
      if (timeFilterPeriod === 'All') return true;
      if (timeFilterPeriod === 'Morning') return opt.period === 'Morning';
      if (timeFilterPeriod === 'Afternoon') return opt.period === 'Afternoon';
      if (timeFilterPeriod === 'Night') return opt.period === 'Evening' || opt.period === 'Night';
      return true;
    });
  }, [allTimeSlots, timeFilterPeriod]);

  return (
    <View style={styles.container}>
      {/* 1. Duration Selector Chips */}
      <View style={styles.durationRow}>
        <View style={styles.durationHeader}>
          <Text style={styles.durationLabel}>Duration</Text>
          <Text style={styles.durationBadge}>
            {selectedDuration < 60
              ? `${selectedDuration} mins`
              : `${(selectedDuration / 60).toFixed(selectedDuration % 60 === 0 ? 0 : 1)} hrs`}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationChipsScroll}>
          {DURATION_OPTIONS.map((opt) => {
            const isSel = selectedDuration === opt.minutes;
            return (
              <TouchableOpacity
                key={opt.minutes}
                style={[styles.durationChip, isSel && styles.durationChipSelected]}
                onPress={() => onSelectDuration(opt.minutes)}
                activeOpacity={0.8}
              >
                <Text style={[styles.durationChipText, isSel && styles.durationChipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Occupied Alert & Alternative Slot Suggestions */}
      {currentSlotOccupied.occupied && (
        <View style={styles.occupiedAlertCard}>
          <View style={styles.occupiedAlertHeader}>
            <Ionicons name="alert-circle" size={17} color="#F87171" style={{ marginRight: 6 }} />
            <Text style={styles.occupiedAlertTitle}>
              Slot Occupied ({currentSlotOccupied.title})
            </Text>
          </View>
          <Text style={styles.occupiedAlertSub}>
            "{currentSlotRange.rangeString}" is already booked. Pick an available slot:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.availableSlotsScroll}>
            {availableSlots.slice(0, 5).map((avSlot) => (
              <TouchableOpacity
                key={avSlot.rangeString}
                style={styles.availableSlotChip}
                onPress={() => onSelectSlot(avSlot)}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={12} color="#151518" style={{ marginRight: 4 }} />
                <Text style={styles.availableSlotChipText}>{avSlot.rangeString}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 3. Period Filter Tabs */}
      <View style={styles.periodFilterRow}>
        {(['All', 'Morning', 'Afternoon', 'Night'] as const).map((period) => {
          const isAct = timeFilterPeriod === period;
          return (
            <TouchableOpacity
              key={period}
              style={[styles.periodTab, isAct && styles.periodTabActive]}
              onPress={() => {
                playSpinnerTickSound(750);
                setTimeFilterPeriod(period);
              }}
            >
              <Text style={[styles.periodTabText, isAct && styles.periodTabTextActive]}>
                {period}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Time Slots Grid */}
      <View style={styles.timeSlotsGrid}>
        {filteredTimeSlots.map((item) => {
          const isSelected = selectedStartHour === item.startHour;
          return (
            <TouchableOpacity
              key={item.startHour}
              style={[
                styles.timeSlotChip,
                isSelected && styles.timeSlotChipSelected,
                item.isOccupied && !isSelected && styles.timeSlotChipOccupied,
              ]}
              onPress={() => onSelectSlot(item)}
              activeOpacity={0.75}
            >
              <View style={styles.timeSlotRowTop}>
                <Text
                  style={[
                    styles.timeSlotChipText,
                    isSelected && styles.timeSlotChipTextSelected,
                    item.isOccupied && !isSelected && styles.timeSlotChipTextOccupied,
                  ]}
                >
                  {item.rangeString}
                </Text>
              </View>
              <View style={styles.timeSlotStatusRow}>
                {item.isOccupied ? (
                  <View style={styles.occupiedTag}>
                    <View style={styles.redDot} />
                    <Text
                      style={[
                        styles.occupiedTagText,
                        isSelected && styles.occupiedTagTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item.occupiedTitle || 'Busy'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.availableTag}>
                    <View style={[styles.greenDot, isSelected && styles.greenDotSelected]} />
                    <Text
                      style={[
                        styles.availableTagText,
                        isSelected && styles.availableTagTextSelected,
                      ]}
                    >
                      Available
                    </Text>
                  </View>
                )}
              </View>
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
  durationRow: {
    marginBottom: 14,
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  durationLabel: {
    color: '#8A8A9E',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  durationChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242434',
  },
  durationChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationChipText: {
    color: '#9E9EB2',
    fontSize: 12,
    fontWeight: '700',
  },
  durationChipTextSelected: {
    color: '#151518',
    fontWeight: '800',
  },
  occupiedAlertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.32)',
  },
  occupiedAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  occupiedAlertTitle: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  occupiedAlertSub: {
    color: '#D4D4E0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  availableSlotsScroll: {
    gap: 8,
  },
  availableSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  availableSlotChipText: {
    color: '#151518',
    fontSize: 11,
    fontWeight: '800',
  },
  periodFilterRow: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodTabActive: {
    backgroundColor: '#262638',
  },
  periodTabText: {
    color: '#76768E',
    fontSize: 12,
    fontWeight: '700',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  timeSlotsGrid: {
    gap: 8,
  },
  timeSlotChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#242434',
  },
  timeSlotChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotChipOccupied: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  timeSlotRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSlotChipText: {
    color: '#E0E0EA',
    fontSize: 13,
    fontWeight: '700',
  },
  timeSlotChipTextSelected: {
    color: '#151518',
    fontWeight: '800',
  },
  timeSlotChipTextOccupied: {
    color: '#FCA5A5',
  },
  timeSlotStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occupiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  redDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  occupiedTagText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 90,
  },
  occupiedTagTextSelected: {
    color: '#7F1D1D',
  },
  availableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
    marginRight: 5,
  },
  greenDotSelected: {
    backgroundColor: '#064E3B',
  },
  availableTagText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  availableTagTextSelected: {
    color: '#064E3B',
  },
});
