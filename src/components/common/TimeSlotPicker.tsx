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

  // Convert 12h display number (1..12) with AM/PM to 24h
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

  const activeColor = activeTarget === 'start' ? '#34D399' : colors.primary;

  return (
    <View style={styles.container}>
      {/* 1. Main Time Capsule Card */}
      <View style={styles.timeCard}>
        {/* Top: Start vs End Capsule Bar */}
        <View style={styles.capsuleRow}>
          {/* Start Time Capsule */}
          <TouchableOpacity
            style={[
              styles.timeCapsule,
              activeTarget === 'start' && styles.timeCapsuleActiveStart,
            ]}
            onPress={() => {
              playSpinnerTickSound(850);
              triggerHaptic();
              setActiveTarget('start');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.capsuleHeader}>
              <View style={[styles.capsuleDot, { backgroundColor: '#34D399' }]} />
              <Text style={[styles.capsuleLabel, activeTarget === 'start' && { color: '#34D399' }]}>
                START
              </Text>
            </View>
            <Text style={[styles.capsuleValue, activeTarget === 'start' && styles.capsuleValueActive]}>
              {String(start12Hour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')}{' '}
              <Text style={styles.capsuleMeridiem}>{isStartPm ? 'PM' : 'AM'}</Text>
            </Text>
          </TouchableOpacity>

          {/* Middle: Duration Badge */}
          <View style={styles.durationBadge}>
            <Ionicons name="arrow-forward" size={13} color="#8E8E9E" style={{ marginRight: 3 }} />
            <Text style={styles.durationBadgeText}>{durLabel}</Text>
          </View>

          {/* End Time Capsule */}
          <TouchableOpacity
            style={[
              styles.timeCapsule,
              activeTarget === 'end' && styles.timeCapsuleActiveEnd,
            ]}
            onPress={() => {
              playSpinnerTickSound(850);
              triggerHaptic();
              setActiveTarget('end');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.capsuleHeader}>
              <View style={[styles.capsuleDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.capsuleLabel, activeTarget === 'end' && { color: colors.primary }]}>
                END
              </Text>
            </View>
            <Text style={[styles.capsuleValue, activeTarget === 'end' && styles.capsuleValueActive]}>
              {String(end12Hour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}{' '}
              <Text style={styles.capsuleMeridiem}>{isEndPm ? 'PM' : 'AM'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Sleek Minimal Time Editor */}
        <View style={styles.editorSection}>
          <Text style={styles.editorHint}>
            Adjusting <Text style={{ color: activeColor, fontWeight: '700' }}>{activeTarget === 'start' ? 'Start Time' : 'End Time'}</Text>
          </Text>

          <View style={styles.controlsRow}>
            {/* Hour Stepper Box */}
            <View style={styles.hourStepperBox}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => handleStepHour(-1)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.hourValueContainer}>
                <Text style={styles.hourNumberText}>
                  {String(active12Hour).padStart(2, '0')}
                </Text>
                <Text style={styles.hourUnitLabel}>HOUR</Text>
              </View>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => handleStepHour(1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Minute Pills Group */}
            <View style={styles.minuteCol}>
              <View style={styles.minuteGrid}>
                {minuteOptions.map((m) => {
                  const isSelected = activeMinute === m;
                  return (
                    <TouchableOpacity
                      key={`min_${m}`}
                      style={[
                        styles.minutePill,
                        isSelected && {
                          backgroundColor: activeColor,
                          borderColor: activeColor,
                        },
                      ]}
                      onPress={() => handleSelectMinute(m)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.minutePillText,
                          isSelected && styles.minutePillTextSelected,
                        ]}
                      >
                        :{String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* AM / PM Segmented Switch */}
            <View style={styles.meridiemSwitch}>
              <TouchableOpacity
                style={[
                  styles.meridiemBtn,
                  !activeIsPm && { backgroundColor: activeColor },
                ]}
                onPress={() => handleToggleMeridiem(false)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.meridiemBtnText,
                    !activeIsPm && styles.meridiemBtnTextActive,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.meridiemBtn,
                  activeIsPm && { backgroundColor: activeColor },
                ]}
                onPress={() => handleToggleMeridiem(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.meridiemBtnText,
                    activeIsPm && styles.meridiemBtnTextActive,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. Quick Duration Pills */}
        <View style={styles.durationSection}>
          <Text style={styles.durationSectionLabel}>DURATION</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.durationScroll}
          >
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.minutes;
              return (
                <TouchableOpacity
                  key={opt.minutes}
                  style={[
                    styles.durationPill,
                    isSelected && styles.durationPillSelected,
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
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.durationPillText,
                      isSelected && styles.durationPillTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Minimal Availability Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: currentSlotOccupied.occupied ? '#EF4444' : colors.success },
              ]}
            />
            <Text style={styles.statusText}>
              {currentSlotRange.rangeString}
            </Text>
          </View>

          <View
            style={[
              styles.statusTag,
              {
                backgroundColor: currentSlotOccupied.occupied
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(52, 211, 153, 0.15)',
              },
            ]}
          >
            <Text
              style={[
                styles.statusTagText,
                { color: currentSlotOccupied.occupied ? '#EF4444' : colors.success },
              ]}
            >
              {currentSlotOccupied.occupied ? 'Occupied' : 'Available'}
            </Text>
          </View>
        </View>
      </View>

      {/* 5. Conflict Resolution Card (only shown when slot has conflict) */}
      {currentSlotOccupied.occupied && (
        <View style={styles.conflictCard}>
          <View style={styles.conflictHeader}>
            <Ionicons name="warning-outline" size={16} color="#F87171" style={{ marginRight: 6 }} />
            <Text style={styles.conflictTitle}>
              Overlaps with &ldquo;{currentSlotOccupied.title}&rdquo;
            </Text>
          </View>

          {nextSlotForShift && onShiftOccupiedSlot && currentSlotOccupied.conflictingTaskId && (
            <TouchableOpacity
              style={styles.shiftBtn}
              onPress={() => {
                onShiftOccupiedSlot(
                  currentSlotOccupied.conflictingTaskId!,
                  nextSlotForShift.rangeString,
                  currentSlotOccupied.title
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal" size={15} color="#151518" style={{ marginRight: 6 }} />
              <Text style={styles.shiftBtnText}>
                Shift to {nextSlotForShift.rangeString} & take slot
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
  },
  timeCard: {
    backgroundColor: 'rgba(20, 20, 28, 0.94)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md + 2,
    marginBottom: spacing.md,
  },

  // 1. Top Capsule Row
  capsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeCapsule: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 40, 0.85)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  timeCapsuleActiveStart: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  timeCapsuleActiveEnd: {
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  capsuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  capsuleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  capsuleLabel: {
    color: '#8E8E9E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  capsuleValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  capsuleValueActive: {
    color: '#FFFFFF',
  },
  capsuleMeridiem: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0B2',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(32, 32, 46, 0.9)',
    borderRadius: 12,
    marginHorizontal: 6,
  },
  durationBadgeText: {
    color: '#D4D4E0',
    fontSize: 11,
    fontWeight: '700',
  },

  // 2. Editor Section
  editorSection: {
    backgroundColor: 'rgba(15, 15, 22, 0.75)',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.md,
  },
  editorHint: {
    color: '#8E8E9E',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: spacing.sm + 2,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  // Hour Stepper Box
  hourStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 42, 0.95)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepperBtn: {
    width: 36,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(42, 42, 60, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourValueContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    minWidth: 46,
  },
  hourNumberText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  hourUnitLabel: {
    color: '#7E7E92',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: -2,
  },

  // Minute Pills
  minuteCol: {
    flex: 1,
  },
  minuteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  minutePill: {
    width: '46%',
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(28, 28, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutePillText: {
    color: '#B0B0C4',
    fontSize: 12,
    fontWeight: '700',
  },
  minutePillTextSelected: {
    color: '#151518',
    fontWeight: '800',
  },

  // Meridiem Switch
  meridiemSwitch: {
    backgroundColor: 'rgba(28, 28, 42, 0.95)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  meridiemBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  meridiemBtnText: {
    color: '#8E8E9E',
    fontSize: 12,
    fontWeight: '700',
  },
  meridiemBtnTextActive: {
    color: '#151518',
    fontWeight: '800',
  },

  // 3. Duration Section
  durationSection: {
    marginBottom: spacing.md,
  },
  durationSectionLabel: {
    color: '#7E7E92',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  durationScroll: {
    gap: 6,
  },
  durationPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 28, 40, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  durationPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationPillText: {
    color: '#D4D4E0',
    fontSize: 12,
    fontWeight: '700',
  },
  durationPillTextSelected: {
    color: '#151518',
    fontWeight: '800',
  },

  // 4. Status Bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: '#E0E0EC',
    fontSize: 13,
    fontWeight: '700',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // 5. Conflict Card
  conflictCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conflictTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  shiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  shiftBtnText: {
    color: '#151518',
    fontSize: 12,
    fontWeight: '800',
  },
});
