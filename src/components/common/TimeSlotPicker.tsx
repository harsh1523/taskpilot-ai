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
      {/* ================= MILKINSIDE GEN UI CARD ================= */}
      <View style={styles.genCard}>
        {/* Soft Ambient Aurora Glow */}
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.18)', 'rgba(56, 189, 248, 0.06)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.ambientGlow}
          pointerEvents="none"
        />

        {/* Header: Title Badge & Status Pill */}
        <View style={styles.headerRow}>
          <View style={styles.titleBadge}>
            <Ionicons name="time" size={12} color={colors.primaryLight} style={{ marginRight: 5 }} />
            <Text style={styles.titleBadgeText}>SCHEDULE TIME</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: currentSlotOccupied.occupied
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(52, 211, 153, 0.12)',
                borderColor: currentSlotOccupied.occupied
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(52, 211, 153, 0.3)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: currentSlotOccupied.occupied ? '#EF4444' : '#34D399' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: currentSlotOccupied.occupied ? '#F87171' : '#34D399' },
              ]}
            >
              {currentSlotOccupied.occupied ? 'Overlap' : 'Available'}
            </Text>
          </View>
        </View>

        {/* Start & End Dual Cards */}
        <View style={styles.dualCardsRow}>
          {/* Start Card */}
          <TouchableOpacity
            style={[
              styles.timeCard,
              activeTarget === 'start' && styles.timeCardActive,
            ]}
            onPress={() => {
              playSpinnerTickSound(850);
              triggerHaptic();
              setActiveTarget('start');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.cardIndicatorDot,
                  { backgroundColor: activeTarget === 'start' ? colors.primaryLight : '#606072' },
                ]}
              />
              <Text
                style={[
                  styles.cardLabel,
                  activeTarget === 'start' && styles.cardLabelActive,
                ]}
              >
                START
              </Text>
            </View>
            <View style={styles.timeDigitsRow}>
              <Text style={styles.cardDigits}>
                {String(start12Hour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')}
              </Text>
              <Text style={styles.cardMeridiem}>{isStartPm ? 'PM' : 'AM'}</Text>
            </View>
          </TouchableOpacity>

          {/* Duration Indicator Arrow */}
          <View style={styles.bridgeContainer}>
            <View style={styles.bridgePill}>
              <Text style={styles.bridgeText}>{durLabel}</Text>
              <Ionicons name="arrow-forward" size={11} color={colors.primaryLight} style={{ marginLeft: 3 }} />
            </View>
          </View>

          {/* End Card */}
          <TouchableOpacity
            style={[
              styles.timeCard,
              activeTarget === 'end' && styles.timeCardActive,
            ]}
            onPress={() => {
              playSpinnerTickSound(850);
              triggerHaptic();
              setActiveTarget('end');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.cardIndicatorDot,
                  { backgroundColor: activeTarget === 'end' ? colors.primaryLight : '#606072' },
                ]}
              />
              <Text
                style={[
                  styles.cardLabel,
                  activeTarget === 'end' && styles.cardLabelActive,
                ]}
              >
                END
              </Text>
            </View>
            <View style={styles.timeDigitsRow}>
              <Text style={styles.cardDigits}>
                {String(end12Hour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}
              </Text>
              <Text style={styles.cardMeridiem}>{isEndPm ? 'PM' : 'AM'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Interactive Tactile Time Dial (Adjusting Active Target) */}
        <View style={styles.dialCard}>
          <View style={styles.dialStepperRow}>
            {/* Decrement Button */}
            <TouchableOpacity
              style={styles.dialStepBtn}
              onPress={() => handleStepHour(-1)}
              activeOpacity={0.7}
              accessibilityLabel="Decrease hour"
            >
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Large Digits Display */}
            <View style={styles.dialDigitsGroup}>
              <Text style={styles.dialBigNumber}>
                {String(active12Hour).padStart(2, '0')}
              </Text>
              <Text style={styles.dialColon}>:</Text>
              <Text style={styles.dialBigNumber}>
                {String(activeMinute).padStart(2, '0')}
              </Text>
              <View style={styles.dialActiveBadge}>
                <Text style={styles.dialActiveBadgeText}>{activeIsPm ? 'PM' : 'AM'}</Text>
              </View>
            </View>

            {/* Increment Button */}
            <TouchableOpacity
              style={styles.dialStepBtn}
              onPress={() => handleStepHour(1)}
              activeOpacity={0.7}
              accessibilityLabel="Increase hour"
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* AM/PM Switcher & Minute Options */}
          <View style={styles.dialSubControlsRow}>
            {/* AM / PM Segmented Capsule */}
            <View style={styles.meridiemSwitch}>
              <TouchableOpacity
                style={[
                  styles.meridiemBtn,
                  !activeIsPm && styles.meridiemBtnActive,
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
                  activeIsPm && styles.meridiemBtnActive,
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

            {/* Minute Selector Pills */}
            <View style={styles.minutePillsRow}>
              {minuteOptions.map((m) => {
                const isSelected = activeMinute === m;
                return (
                  <TouchableOpacity
                    key={`min_${m}`}
                    style={[
                      styles.minuteChip,
                      isSelected && styles.minuteChipActive,
                    ]}
                    onPress={() => handleSelectMinute(m)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.minuteChipText,
                        isSelected && styles.minuteChipTextActive,
                      ]}
                    >
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Quick Duration Preset Pills */}
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
                    isSelected && styles.durationPillActive,
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
                      isSelected && styles.durationPillTextActive,
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

  // Milkinside Gen UI Card
  genCard: {
    backgroundColor: 'rgba(16, 16, 26, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  titleBadgeText: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Start & End Dual Cards
  dualCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeCard: {
    flex: 1,
    backgroundColor: 'rgba(22, 22, 34, 0.75)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  timeCardActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  cardLabel: {
    color: '#8A8A9E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  cardLabelActive: {
    color: colors.primaryLight,
  },
  timeDigitsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cardDigits: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardMeridiem: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
  },
  bridgeContainer: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bridgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  bridgeText: {
    color: '#E0E0FC',
    fontSize: 10,
    fontWeight: '800',
  },

  // Interactive Tactile Time Dial
  dialCard: {
    backgroundColor: 'rgba(22, 22, 34, 0.65)',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: spacing.md,
  },
  dialStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  dialStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(32, 32, 48, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialDigitsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialBigNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  dialColon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#9494AC',
    marginHorizontal: 4,
  },
  dialActiveBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 10,
  },
  dialActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // AM/PM and Minutes row
  dialSubControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md - 2,
    gap: 8,
  },
  meridiemSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 16, 26, 0.85)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  meridiemBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meridiemBtnActive: {
    backgroundColor: colors.primary,
  },
  meridiemBtnText: {
    color: '#8A8A9E',
    fontSize: 12,
    fontWeight: '700',
  },
  meridiemBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  minutePillsRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 16, 26, 0.85)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 2,
  },
  minuteChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteChipActive: {
    backgroundColor: colors.primary,
  },
  minuteChipText: {
    color: '#8A8A9E',
    fontSize: 11,
    fontWeight: '700',
  },
  minuteChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // Quick Duration Section
  durationSection: {
    marginBottom: spacing.xs,
  },
  durationSectionLabel: {
    color: '#7E7E94',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  durationScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  durationPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(24, 24, 36, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  durationPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  durationPillText: {
    color: '#8E8EA8',
    fontSize: 12,
    fontWeight: '700',
  },
  durationPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // Conflict Banner
  conflictBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  conflictTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  shiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  shiftButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
