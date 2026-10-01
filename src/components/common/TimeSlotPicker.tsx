import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, fontSizes, fontWeights, commonStyles } from '../../theme';
import { playSpinnerTickSound } from '../../services/soundEffects';
import {
  computeTimeRange,
  checkSlotConflict,
  findNextAvailableSlot,
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

const minuteOptions = [0, 15, 30, 45];

interface TimeSlotPickerProps {
  selectedStartHour: number;
  selectedDuration: number;
  occupiedSchedule: ScheduleBlock[];
  onSelectSlot: (slot: { startHour: number; rangeString: string; isOccupied: boolean }) => void;
  onSelectDuration: (durationMinutes: number) => void;
  onShiftOccupiedSlot?: (conflictingTaskId: string, newDueDate: string, conflictingTaskTitle: string) => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedStartHour,
  selectedDuration,
  occupiedSchedule,
  onSelectSlot,
  onSelectDuration,
  onShiftOccupiedSlot,
}) => {
  const [activeTarget, setActiveTarget] = useState<'start' | 'end'>('start');
  const [startMinute, setStartMinute] = useState<number>(0);

  const isStartPm = selectedStartHour >= 12;
  const start12Hour = selectedStartHour % 12 === 0 ? 12 : selectedStartHour % 12;

  const startTotalMinutes = selectedStartHour * 60 + startMinute;
  const endTotalMinutes = startTotalMinutes + selectedDuration;

  const endHour24 = Math.floor(endTotalMinutes / 60) % 24;
  const endMinute = endTotalMinutes % 60;
  const isEndPm = endHour24 >= 12;
  const end12Hour = endHour24 % 12 === 0 ? 12 : endHour24 % 12;

  const active12Hour = activeTarget === 'start' ? start12Hour : end12Hour;
  const activeIsPm = activeTarget === 'start' ? isStartPm : isEndPm;
  const activeMinute = activeTarget === 'start' ? startMinute : endMinute;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const to24Hour = (h12: number, pm: boolean): number => {
    if (pm) {
      return h12 === 12 ? 12 : h12 + 12;
    }
    return h12 === 12 ? 0 : h12;
  };

  // Step active hour by +/- 1
  const handleStepHour = (delta: number) => {
    playSpinnerTickSound(delta > 0 ? 1000 : 800);
    triggerHaptic();

    if (activeTarget === 'start') {
      const new24H = (selectedStartHour + delta + 24) % 24;
      const range = computeTimeRange(new24H, selectedDuration, startMinute);
      const occ = checkSlotConflict(range.startMinutes, selectedDuration, occupiedSchedule);
      onSelectSlot({
        startHour: new24H,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    } else {
      const newEnd24 = (endHour24 + delta + 24) % 24;
      const newEndTotal = newEnd24 * 60 + endMinute;
      let newDuration = newEndTotal - startTotalMinutes;
      if (newDuration <= 0) {
        newDuration += 1440;
      }
      onSelectDuration(newDuration);
      const range = computeTimeRange(selectedStartHour, newDuration, startMinute);
      const occ = checkSlotConflict(startTotalMinutes, newDuration, occupiedSchedule);
      onSelectSlot({
        startHour: selectedStartHour,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    }
  };

  // Toggle AM / PM
  const handleToggleMeridiem = (targetPm: boolean) => {
    if (targetPm === activeIsPm) return;
    playSpinnerTickSound(950);
    triggerHaptic();

    if (activeTarget === 'start') {
      const new24H = to24Hour(start12Hour, targetPm);
      const range = computeTimeRange(new24H, selectedDuration, startMinute);
      const occ = checkSlotConflict(range.startMinutes, selectedDuration, occupiedSchedule);
      onSelectSlot({
        startHour: new24H,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    } else {
      const newEnd24 = to24Hour(end12Hour, targetPm);
      const newEndTotal = newEnd24 * 60 + endMinute;
      let newDuration = newEndTotal - startTotalMinutes;
      if (newDuration <= 0) {
        newDuration += 1440;
      }
      onSelectDuration(newDuration);
      const range = computeTimeRange(selectedStartHour, newDuration, startMinute);
      const occ = checkSlotConflict(startTotalMinutes, newDuration, occupiedSchedule);
      onSelectSlot({
        startHour: selectedStartHour,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    }
  };

  // Select Minute (:00, :15, :30, :45)
  const handleSelectMinute = (m: number) => {
    playSpinnerTickSound(900);
    triggerHaptic();

    if (activeTarget === 'start') {
      setStartMinute(m);
      const newStartTotal = selectedStartHour * 60 + m;
      const range = computeTimeRange(selectedStartHour, selectedDuration, m);
      const occ = checkSlotConflict(newStartTotal, selectedDuration, occupiedSchedule);
      onSelectSlot({
        startHour: selectedStartHour,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    } else {
      const newEndTotal = endHour24 * 60 + m;
      let newDuration = newEndTotal - startTotalMinutes;
      if (newDuration <= 0) {
        newDuration += 1440;
      }
      onSelectDuration(newDuration);
      const range = computeTimeRange(selectedStartHour, newDuration, startMinute);
      const occ = checkSlotConflict(startTotalMinutes, newDuration, occupiedSchedule);
      onSelectSlot({
        startHour: selectedStartHour,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    }
  };

  const currentSlotRange = useMemo(() => {
    return computeTimeRange(selectedStartHour, selectedDuration, startMinute);
  }, [selectedStartHour, selectedDuration, startMinute]);

  const currentSlotOccupied = useMemo(() => {
    return checkSlotConflict(currentSlotRange.startMinutes, selectedDuration, occupiedSchedule);
  }, [currentSlotRange, selectedDuration, occupiedSchedule]);

  const nextSlotForShift = useMemo(() => {
    if (!currentSlotOccupied.occupied) return null;
    return findNextAvailableSlot(occupiedSchedule, currentSlotRange.startMinutes, selectedDuration);
  }, [currentSlotOccupied.occupied, occupiedSchedule, currentSlotRange.startMinutes, selectedDuration]);

  const durLabel =
    selectedDuration < 60
      ? `${selectedDuration}m`
      : selectedDuration % 60 === 0
      ? `${selectedDuration / 60}h`
      : `${(selectedDuration / 60).toFixed(1)}h`;

  return (
    <View style={styles.container}>
      {/* ================= APPLE STYLE TIME PICKER CARD ================= */}
      <View style={styles.appleCard}>
        {/* 1. Apple Segmented Control: Starts vs Ends */}
        <View style={styles.appleSegmentedContainer}>
          <TouchableOpacity
            style={[
              styles.appleSegment,
              activeTarget === 'start' && styles.appleSegmentActive,
            ]}
            onPress={() => {
              playSpinnerTickSound(850);
              triggerHaptic();
              setActiveTarget('start');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.appleSegmentLabel,
                activeTarget === 'start' && styles.appleSegmentLabelActive,
              ]}
            >
              Starts
            </Text>
            <Text
              style={[
                styles.appleSegmentTime,
                activeTarget === 'start' && styles.appleSegmentTimeActive,
              ]}
            >
              {String(start12Hour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')} {isStartPm ? 'PM' : 'AM'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.appleSegment,
              activeTarget === 'end' && styles.appleSegmentActive,
            ]}
            onPress={() => {
              playSpinnerTickSound(850);
              triggerHaptic();
              setActiveTarget('end');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.appleSegmentLabel,
                activeTarget === 'end' && styles.appleSegmentLabelActive,
              ]}
            >
              Ends
            </Text>
            <Text
              style={[
                styles.appleSegmentTime,
                activeTarget === 'end' && styles.appleSegmentTimeActive,
              ]}
            >
              {String(end12Hour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')} {isEndPm ? 'PM' : 'AM'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Apple Digital Clock & Stepper Row */}
        <View style={styles.appleClockRow}>
          {/* Minus Stepper */}
          <TouchableOpacity
            style={styles.appleStepperBtn}
            onPress={() => handleStepHour(-1)}
            activeOpacity={0.7}
            accessibilityLabel="Decrease hour"
          >
            <Ionicons name="remove" size={20} color="#E0E0E6" />
          </TouchableOpacity>

          {/* Centered Time Capsule */}
          <View style={styles.appleTimeCapsule}>
            <Text style={styles.appleTimeDigits}>
              {String(active12Hour).padStart(2, '0')}
            </Text>
            <Text style={styles.appleTimeColon}>:</Text>
            <Text style={styles.appleTimeDigits}>
              {String(activeMinute).padStart(2, '0')}
            </Text>
          </View>

          {/* AM / PM Segmented Switch */}
          <View style={styles.appleAmPmPill}>
            <TouchableOpacity
              style={[styles.appleAmPmBtn, !activeIsPm && styles.appleAmPmBtnActive]}
              onPress={() => handleToggleMeridiem(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.appleAmPmText, !activeIsPm && styles.appleAmPmTextActive]}>
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.appleAmPmBtn, activeIsPm && styles.appleAmPmBtnActive]}
              onPress={() => handleToggleMeridiem(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.appleAmPmText, activeIsPm && styles.appleAmPmTextActive]}>
                PM
              </Text>
            </TouchableOpacity>
          </View>

          {/* Plus Stepper */}
          <TouchableOpacity
            style={styles.appleStepperBtn}
            onPress={() => handleStepHour(1)}
            activeOpacity={0.7}
            accessibilityLabel="Increase hour"
          >
            <Ionicons name="add" size={20} color="#E0E0E6" />
          </TouchableOpacity>
        </View>

        {/* 3. Apple Minute Chips (:00, :15, :30, :45) */}
        <View style={styles.appleMinutesRow}>
          {minuteOptions.map((m) => {
            const isSelected = activeMinute === m;
            return (
              <TouchableOpacity
                key={`min_${m}`}
                style={[
                  styles.appleMinuteChip,
                  isSelected && styles.appleMinuteChipActive,
                ]}
                onPress={() => handleSelectMinute(m)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.appleMinuteText,
                    isSelected && styles.appleMinuteTextActive,
                  ]}
                >
                  :{String(m).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hairline Divider */}
        <View style={styles.appleDivider} />

        {/* 4. Apple Duration Row */}
        <View style={styles.appleDurationSection}>
          <View style={styles.appleDurationHeader}>
            <Text style={styles.appleDurationLabel}>DURATION</Text>
            <Text style={styles.appleDurationValue}>{durLabel}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.appleDurationScroll}
          >
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.minutes;
              return (
                <TouchableOpacity
                  key={opt.minutes}
                  style={[
                    styles.appleDurationPill,
                    isSelected && styles.appleDurationPillActive,
                  ]}
                  onPress={() => {
                    playSpinnerTickSound(850);
                    triggerHaptic();
                    onSelectDuration(opt.minutes);
                    const range = computeTimeRange(selectedStartHour, opt.minutes, startMinute);
                    const occ = checkSlotConflict(range.startMinutes, opt.minutes, occupiedSchedule);
                    onSelectSlot({
                      startHour: selectedStartHour,
                      rangeString: range.rangeString,
                      isOccupied: occ.occupied,
                    });
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.appleDurationPillText,
                      isSelected && styles.appleDurationPillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 5. Apple Status & Conflict Indicator */}
        <View style={styles.appleFooterRow}>
          <View style={styles.appleStatusGroup}>
            <View
              style={[
                styles.appleStatusDot,
                { backgroundColor: currentSlotOccupied.occupied ? '#EF4444' : '#34D399' },
              ]}
            />
            <Text
              style={[
                styles.appleStatusText,
                { color: currentSlotOccupied.occupied ? '#F87171' : '#34D399' },
              ]}
            >
              {currentSlotOccupied.occupied ? 'Overlap detected' : 'Available • No conflicts'}
            </Text>
          </View>
          <Text style={styles.appleRangeSummary}>{currentSlotRange.rangeString}</Text>
        </View>

        {/* Conflict Shift Banner (when overlapping) */}
        {currentSlotOccupied.occupied && (
          <View style={styles.conflictBanner}>
            <View style={styles.conflictHeader}>
              <Ionicons name="warning-outline" size={15} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.conflictTitle} numberOfLines={1}>
                Overlaps with &ldquo;{currentSlotOccupied.title}&rdquo;
              </Text>
            </View>

            {nextSlotForShift && onShiftOccupiedSlot && currentSlotOccupied.conflictingTaskId && (
              <TouchableOpacity
                style={styles.shiftButton}
                onPress={() => {
                  onShiftOccupiedSlot(
                    currentSlotOccupied.conflictingTaskId!,
                    nextSlotForShift.rangeString,
                    currentSlotOccupied.title
                  );
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-horizontal" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.shiftButtonText}>
                  Shift to {nextSlotForShift.rangeString}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
  },

  // Apple Inset Grouped Card
  appleCard: {
    backgroundColor: 'rgba(24, 24, 32, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },

  // 1. Apple Segmented Control: Starts vs Ends
  appleSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118, 118, 128, 0.16)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  appleSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 11,
    gap: 6,
  },
  appleSegmentActive: {
    backgroundColor: 'rgba(44, 44, 56, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  appleSegmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E9E',
  },
  appleSegmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  appleSegmentTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E9E',
  },
  appleSegmentTimeActive: {
    color: colors.primaryLight,
    fontWeight: '800',
  },

  // 2. Apple Digital Clock & Stepper Row
  appleClockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  appleStepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(120, 120, 128, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleTimeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.18)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  appleTimeDigits: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appleTimeColon: {
    fontSize: 26,
    fontWeight: '400',
    color: '#9898AA',
    marginHorizontal: 4,
    marginBottom: 2,
  },
  appleAmPmPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118, 118, 128, 0.18)',
    borderRadius: 12,
    padding: 3,
  },
  appleAmPmBtn: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleAmPmBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  appleAmPmText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E9E',
  },
  appleAmPmTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // 3. Apple Minute Chips
  appleMinutesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  appleMinuteChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  appleMinuteChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  appleMinuteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E9E',
  },
  appleMinuteTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Hairline Divider
  appleDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },

  // 4. Apple Duration Section
  appleDurationSection: {
    marginBottom: 12,
  },
  appleDurationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appleDurationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E7E90',
    letterSpacing: 0.6,
  },
  appleDurationValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  appleDurationScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  appleDurationPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(118, 118, 128, 0.16)',
  },
  appleDurationPillActive: {
    backgroundColor: colors.primary,
  },
  appleDurationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9898AA',
  },
  appleDurationPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // 5. Apple Footer Status
  appleFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  appleStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appleStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  appleStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appleRangeSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E9E',
  },

  // Conflict Banner
  conflictBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  conflictTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  shiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  shiftButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
