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
import { LinearGradient } from 'expo-linear-gradient';
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

const HORIZON_HOURS = [
  { hour24: 6, label: '6 AM' },
  { hour24: 7, label: '7 AM' },
  { hour24: 8, label: '8 AM' },
  { hour24: 9, label: '9 AM' },
  { hour24: 10, label: '10 AM' },
  { hour24: 11, label: '11 AM' },
  { hour24: 12, label: '12 PM' },
  { hour24: 13, label: '1 PM' },
  { hour24: 14, label: '2 PM' },
  { hour24: 15, label: '3 PM' },
  { hour24: 16, label: '4 PM' },
  { hour24: 17, label: '5 PM' },
  { hour24: 18, label: '6 PM' },
  { hour24: 19, label: '7 PM' },
  { hour24: 20, label: '8 PM' },
  { hour24: 21, label: '9 PM' },
  { hour24: 22, label: '10 PM' },
  { hour24: 23, label: '11 PM' },
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

  // Select an hour on the fluid horizon track
  const handleSelectHorizonHour = (h24: number) => {
    playSpinnerTickSound(900);
    triggerHaptic();

    if (activeTarget === 'start') {
      const range = computeTimeRange(h24, selectedDuration, startMinute);
      const occ = checkSlotConflict(range.startMinutes, selectedDuration, occupiedSchedule);
      onSelectSlot({
        startHour: h24,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    } else {
      const newEndTotal = h24 * 60 + endMinute;
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
      {/* ================= MILKINSIDE GEN UI HERO CARD ================= */}
      <View style={styles.genCard}>
        {/* Soft Ambient Aurora Glow behind Hero */}
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.16)', 'rgba(56, 189, 248, 0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ambientGlow}
          pointerEvents="none"
        />

        {/* Top Header: Gen UI Badge & Proactive Status */}
        <View style={styles.genHeaderRow}>
          <View style={styles.genBadge}>
            <Ionicons name="sparkles" size={11} color="#A78BFA" style={{ marginRight: 5 }} />
            <Text style={styles.genBadgeText}>GEN UI SCHEDULE</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: currentSlotOccupied.occupied
                  ? 'rgba(239, 68, 68, 0.14)'
                  : 'rgba(52, 211, 153, 0.14)',
                borderColor: currentSlotOccupied.occupied
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(52, 211, 153, 0.3)',
              },
            ]}
          >
            <View
              style={[
                styles.statusPillDot,
                { backgroundColor: currentSlotOccupied.occupied ? '#EF4444' : '#34D399' },
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                { color: currentSlotOccupied.occupied ? '#F87171' : '#34D399' },
              ]}
            >
              {currentSlotOccupied.occupied ? 'Overlap' : 'Available'}
            </Text>
          </View>
        </View>

        {/* Hero Time Readout (Floating Glass Capsules) */}
        <View style={styles.heroTimeRow}>
          {/* Start Capsule */}
          <TouchableOpacity
            style={[
              styles.heroCapsule,
              activeTarget === 'start' && styles.heroCapsuleActiveStart,
            ]}
            onPress={() => {
              playSpinnerTickSound(850);
              triggerHaptic();
              setActiveTarget('start');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.capsuleTopLabelRow}>
              <View style={[styles.microDot, { backgroundColor: '#34D399' }]} />
              <Text style={[styles.capsuleTopLabel, activeTarget === 'start' && { color: '#34D399' }]}>
                START
              </Text>
            </View>
            <Text style={styles.capsuleDigits}>
              {String(start12Hour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')}
            </Text>
            <Text style={[styles.capsulePeriod, { color: isStartPm ? colors.primary : '#34D399' }]}>
              {isStartPm ? 'PM' : 'AM'}
            </Text>
          </TouchableOpacity>

          {/* Floating Duration Bridge */}
          <View style={styles.durationBridge}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899', '#FB923C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.durationBridgeGradient}
            >
              <Ionicons name="arrow-forward" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
              <Text style={styles.durationBridgeText}>{durLabel}</Text>
            </LinearGradient>
          </View>

          {/* End Capsule */}
          <TouchableOpacity
            style={[
              styles.heroCapsule,
              activeTarget === 'end' && styles.heroCapsuleActiveEnd,
            ]}
            onPress={() => {
              playSpinnerTickSound(850);
              triggerHaptic();
              setActiveTarget('end');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.capsuleTopLabelRow}>
              <View style={[styles.microDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.capsuleTopLabel, activeTarget === 'end' && { color: colors.primary }]}>
                END
              </Text>
            </View>
            <Text style={styles.capsuleDigits}>
              {String(end12Hour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}
            </Text>
            <Text style={[styles.capsulePeriod, { color: isEndPm ? colors.primary : '#34D399' }]}>
              {isEndPm ? 'PM' : 'AM'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= FLUID TIME HORIZON ================= */}
        <View style={styles.horizonSection}>
          <View style={styles.horizonLabelRow}>
            <Text style={styles.horizonHeading}>TIME HORIZON</Text>
            <Text style={styles.horizonSub}>Slide or tap to shift window</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizonScroll}
          >
            {HORIZON_HOURS.map((h) => {
              const isStart = selectedStartHour === h.hour24;
              const isEnd = endHour24 === h.hour24;
              const isInRange =
                selectedStartHour < endHour24
                  ? h.hour24 >= selectedStartHour && h.hour24 <= endHour24
                  : h.hour24 >= selectedStartHour || h.hour24 <= endHour24;

              const occ = checkSlotConflict(h.hour24 * 60, selectedDuration, occupiedSchedule);

              return (
                <TouchableOpacity
                  key={`horizon_${h.hour24}`}
                  style={[
                    styles.horizonCell,
                    isInRange && styles.horizonCellInRange,
                    isStart && styles.horizonCellStart,
                    isEnd && styles.horizonCellEnd,
                  ]}
                  onPress={() => handleSelectHorizonHour(h.hour24)}
                  activeOpacity={0.75}
                >
                  {isInRange && (
                    <LinearGradient
                      colors={
                        isStart
                          ? ['#34D399', 'rgba(52, 211, 153, 0.4)']
                          : isEnd
                          ? ['#FB923C', 'rgba(251, 146, 60, 0.4)']
                          : ['rgba(139, 92, 246, 0.3)', 'rgba(56, 189, 248, 0.3)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.horizonCellGradient}
                    />
                  )}

                  <Text
                    style={[
                      styles.horizonCellText,
                      isInRange && styles.horizonCellTextActive,
                      (isStart || isEnd) && styles.horizonCellTextBoundary,
                    ]}
                  >
                    {h.label}
                  </Text>

                  {occ.occupied && !isInRange && (
                    <View style={styles.horizonConflictPip} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ================= STREAMLINED TACTILE CONTROLS ================= */}
        <View style={styles.tactileControlsRow}>
          {/* Hour Stepper */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleStepHour(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.stepperCenter}>
              <Text style={styles.stepperDigits}>{String(active12Hour).padStart(2, '0')}</Text>
              <Text style={styles.stepperLabel}>HOUR</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleStepHour(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Minute Selector Pills */}
          <View style={styles.minutePillsGroup}>
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
                      isSelected && styles.minutePillTextActive,
                    ]}
                  >
                    :{String(m).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AM / PM Segmented Capsule */}
          <View style={styles.meridiemCapsule}>
            <TouchableOpacity
              style={[
                styles.meridiemCapsuleBtn,
                !activeIsPm && { backgroundColor: activeColor },
              ]}
              onPress={() => handleToggleMeridiem(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.meridiemCapsuleText,
                  !activeIsPm && styles.meridiemCapsuleTextActive,
                ]}
              >
                AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.meridiemCapsuleBtn,
                activeIsPm && { backgroundColor: activeColor },
              ]}
              onPress={() => handleToggleMeridiem(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.meridiemCapsuleText,
                  activeIsPm && styles.meridiemCapsuleTextActive,
                ]}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Duration Preset Pills */}
        <View style={styles.durationSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.durationPresetScroll}
          >
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.minutes;
              return (
                <TouchableOpacity
                  key={opt.minutes}
                  style={[
                    styles.durationPresetPill,
                    isSelected && styles.durationPresetPillSelected,
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
                      styles.durationPresetText,
                      isSelected && styles.durationPresetTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Conflict Warning & One-Tap Shift Action */}
        {currentSlotOccupied.occupied && (
          <View style={styles.conflictBanner}>
            <View style={styles.conflictHeader}>
              <Ionicons name="warning-outline" size={15} color="#F87171" style={{ marginRight: 6 }} />
              <Text style={styles.conflictTitle}>
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
                <Ionicons name="swap-horizontal" size={14} color="#151518" style={{ marginRight: 6 }} />
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

  // Milkinside Gen UI Card
  genCard: {
    backgroundColor: 'rgba(16, 16, 24, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    height: 180,
    borderRadius: 90,
  },

  // Header Row
  genHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  genBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  genBadgeText: {
    color: '#C4B5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Hero Time Row
  heroTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heroCapsule: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 36, 0.85)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroCapsuleActiveStart: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  heroCapsuleActiveEnd: {
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  capsuleTopLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  microDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  capsuleTopLabel: {
    color: '#8E8E9E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  capsuleDigits: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  capsulePeriod: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  durationBridge: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBridgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  durationBridgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Time Horizon Section
  horizonSection: {
    marginBottom: spacing.md,
  },
  horizonLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  horizonHeading: {
    color: '#A0A0B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  horizonSub: {
    color: '#66667A',
    fontSize: 10,
  },
  horizonScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  horizonCell: {
    width: 54,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 26, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  horizonCellInRange: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  horizonCellStart: {
    borderColor: '#34D399',
    borderWidth: 1.5,
  },
  horizonCellEnd: {
    borderColor: '#FB923C',
    borderWidth: 1.5,
  },
  horizonCellGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  horizonCellText: {
    color: '#8A8A9E',
    fontSize: 11,
    fontWeight: '700',
  },
  horizonCellTextActive: {
    color: '#FFFFFF',
  },
  horizonCellTextBoundary: {
    color: '#151518',
    fontWeight: '900',
  },
  horizonConflictPip: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },

  // Tactile Controls Row
  tactileControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: spacing.md,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 38, 0.9)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepperBtn: {
    width: 32,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(38, 38, 54, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCenter: {
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 42,
  },
  stepperDigits: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepperLabel: {
    color: '#76768A',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: -2,
  },

  // Minute Pills
  minutePillsGroup: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 38, 0.9)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'space-between',
    gap: 3,
  },
  minutePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutePillText: {
    color: '#8A8A9E',
    fontSize: 11,
    fontWeight: '700',
  },
  minutePillTextActive: {
    color: '#151518',
    fontWeight: '900',
  },

  // Meridiem Switch
  meridiemCapsule: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 38, 0.9)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  meridiemCapsuleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  meridiemCapsuleText: {
    color: '#8A8A9E',
    fontSize: 11,
    fontWeight: '700',
  },
  meridiemCapsuleTextActive: {
    color: '#151518',
    fontWeight: '900',
  },

  // Duration Presets Section
  durationSection: {
    marginBottom: spacing.xs,
  },
  durationPresetScroll: {
    gap: 6,
  },
  durationPresetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(26, 26, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  durationPresetPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationPresetText: {
    color: '#D4D4E0',
    fontSize: 11,
    fontWeight: '700',
  },
  durationPresetTextSelected: {
    color: '#151518',
    fontWeight: '900',
  },

  // Conflict Banner
  conflictBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 14,
    padding: spacing.sm + 2,
    marginTop: spacing.md,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  conflictTitle: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  shiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  shiftButtonText: {
    color: '#151518',
    fontSize: 11,
    fontWeight: '800',
  },
});
