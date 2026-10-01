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
  { hour: 17, period: 'Evening' as const },
  { hour: 18, period: 'Evening' as const },
  { hour: 19, period: 'Evening' as const },
  { hour: 20, period: 'Night' as const },
  { hour: 21, period: 'Night' as const },
  { hour: 22, period: 'Night' as const },
];

const hours12List = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
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
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
  const [timeFilterPeriod, setTimeFilterPeriod] = useState<'All' | 'Morning' | 'Afternoon' | 'Night'>('All');
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

  // Select specific 12-hour
  const handleSelectHour = (h12: number) => {
    playSpinnerTickSound(900);
    triggerHaptic();

    if (activeTarget === 'start') {
      const new24H = to24Hour(h12, isStartPm);
      const range = computeTimeRange(new24H, selectedDuration, startMinute);
      const occ = checkSlotConflict(range.startMinutes, selectedDuration, occupiedSchedule);
      onSelectSlot({
        startHour: new24H,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    } else {
      let targetPm = isEndPm;
      if (!isStartPm && !isEndPm && h12 <= (selectedStartHour % 12)) {
        targetPm = true;
      }
      const newEnd24 = to24Hour(h12, targetPm);
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

  // Step hour by +/- 1
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

  // Step minutes by +/- 15m or +/- 30m
  const handleStepMinutes = (deltaMin: number) => {
    playSpinnerTickSound(deltaMin > 0 ? 1050 : 750);
    triggerHaptic();

    if (activeTarget === 'start') {
      let total = startTotalMinutes + deltaMin;
      if (total < 0) total += 1440;
      total = total % 1440;
      const newH = Math.floor(total / 60);
      const newM = total % 60;
      setStartMinute(newM);
      const range = computeTimeRange(newH, selectedDuration, newM);
      const occ = checkSlotConflict(total, selectedDuration, occupiedSchedule);
      onSelectSlot({
        startHour: newH,
        rangeString: range.rangeString,
        isOccupied: occ.occupied,
      });
    } else {
      const newDuration = Math.max(15, selectedDuration + deltaMin);
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

  const allTimeSlots = useMemo(() => {
    return baseHours.map((item) => {
      const slot = computeTimeRange(item.hour, selectedDuration, startMinute);
      const occ = checkSlotConflict(slot.startMinutes, selectedDuration, occupiedSchedule);
      return {
        ...item,
        ...slot,
        isOccupied: occ.occupied,
        occupiedTitle: occ.title,
      };
    });
  }, [selectedDuration, occupiedSchedule, startMinute]);

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

  const durLabel =
    selectedDuration < 60
      ? `${selectedDuration}m`
      : selectedDuration % 60 === 0
      ? `${selectedDuration / 60}h`
      : `${(selectedDuration / 60).toFixed(1)}h`;

  return (
    <View style={styles.container}>
      {/* 1. View Mode Switcher: Digital Hub vs Timeline List */}
      <View style={styles.viewModeToggleRow}>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'cards' && styles.viewModeBtnActive]}
          onPress={() => {
            playSpinnerTickSound(800);
            triggerHaptic();
            setViewMode('cards');
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="timer-outline"
            size={15}
            color={viewMode === 'cards' ? '#151518' : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.viewModeBtnText, viewMode === 'cards' && styles.viewModeBtnTextActive]}>
            Digital Hub
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'timeline' && styles.viewModeBtnActive]}
          onPress={() => {
            playSpinnerTickSound(800);
            triggerHaptic();
            setViewMode('timeline');
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="list"
            size={15}
            color={viewMode === 'timeline' ? '#151518' : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.viewModeBtnText, viewMode === 'timeline' && styles.viewModeBtnTextActive]}>
            Timeline List
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Session Duration Selector Pills */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Session Duration</Text>
      </View>
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
              style={[styles.durationChip, isSelected && styles.durationChipSelected]}
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
              <Text style={[styles.durationChipText, isSelected && styles.durationChipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. MODERN DIGITAL CAPSULE HUB */}
      {viewMode === 'cards' && (
        <View style={styles.digitalHubCard}>
          {/* Dual Hero Time Cards */}
          <View style={styles.heroRow}>
            {/* START TIME CARD */}
            <TouchableOpacity
              style={[
                styles.timeHeroCard,
                activeTarget === 'start' && styles.timeHeroCardActiveStart,
              ]}
              onPress={() => {
                playSpinnerTickSound(850);
                triggerHaptic();
                setActiveTarget('start');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.heroCardHeader}>
                <View style={[styles.heroDot, { backgroundColor: '#34D399' }]} />
                <Text style={[styles.heroCardLabel, activeTarget === 'start' && styles.heroCardLabelActiveStart]}>
                  START TIME
                </Text>
                {activeTarget === 'start' && (
                  <View style={[styles.activePill, { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
                    <Text style={[styles.activePillText, { color: '#34D399' }]}>ACTIVE</Text>
                  </View>
                )}
              </View>

              <View style={styles.heroDigitsRow}>
                <Text style={styles.heroDigits}>
                  {String(start12Hour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')}
                </Text>
                <View style={[styles.heroMeridiemTag, { backgroundColor: isStartPm ? 'rgba(255, 140, 66, 0.15)' : 'rgba(52, 211, 153, 0.15)' }]}>
                  <Text style={[styles.heroMeridiemText, { color: isStartPm ? colors.primary : '#34D399' }]}>
                    {isStartPm ? 'PM' : 'AM'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroCardHint}>
                {activeTarget === 'start' ? 'Adjusting below' : 'Tap to edit'}
              </Text>
            </TouchableOpacity>

            {/* Duration Bridge Arrow */}
            <View style={styles.bridgeContainer}>
              <View style={styles.bridgeLine} />
              <View style={styles.bridgeDurationBadge}>
                <Ionicons name="arrow-forward" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={styles.bridgeDurationText}>{durLabel}</Text>
              </View>
            </View>

            {/* END TIME CARD */}
            <TouchableOpacity
              style={[
                styles.timeHeroCard,
                activeTarget === 'end' && styles.timeHeroCardActiveEnd,
              ]}
              onPress={() => {
                playSpinnerTickSound(850);
                triggerHaptic();
                setActiveTarget('end');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.heroCardHeader}>
                <View style={[styles.heroDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.heroCardLabel, activeTarget === 'end' && styles.heroCardLabelActiveEnd]}>
                  END TIME
                </Text>
                {activeTarget === 'end' && (
                  <View style={[styles.activePill, { backgroundColor: 'rgba(255, 140, 66, 0.2)' }]}>
                    <Text style={[styles.activePillText, { color: colors.primary }]}>ACTIVE</Text>
                  </View>
                )}
              </View>

              <View style={styles.heroDigitsRow}>
                <Text style={styles.heroDigits}>
                  {String(end12Hour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')}
                </Text>
                <View style={[styles.heroMeridiemTag, { backgroundColor: isEndPm ? 'rgba(255, 140, 66, 0.15)' : 'rgba(52, 211, 153, 0.15)' }]}>
                  <Text style={[styles.heroMeridiemText, { color: isEndPm ? colors.primary : '#34D399' }]}>
                    {isEndPm ? 'PM' : 'AM'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroCardHint}>
                {activeTarget === 'end' ? 'Adjusting below' : 'Tap to edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tactile Adjustment Deck */}
          <View style={styles.adjustmentDeck}>
            {/* Deck Context Header */}
            <View style={styles.deckHeader}>
              <View
                style={[
                  styles.deckIndicatorDot,
                  { backgroundColor: activeTarget === 'start' ? '#34D399' : colors.primary },
                ]}
              />
              <Text style={styles.deckTitle}>
                SELECT {activeTarget === 'start' ? 'START' : 'END'} HOUR
              </Text>
            </View>

            {/* Hour Selector Strip with Steppers */}
            <View style={styles.hourSelectorRow}>
              <TouchableOpacity
                style={styles.hourStepperBtn}
                onPress={() => handleStepHour(-1)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color="#D4D4E0" />
                <Text style={styles.hourStepperBtnText}>1h</Text>
              </TouchableOpacity>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourStripScroll}
              >
                {hours12List.map((h) => {
                  const isSelected = active12Hour === h;
                  const isBoundary =
                    activeTarget === 'start' ? end12Hour === h : start12Hour === h;
                  return (
                    <TouchableOpacity
                      key={`hour_${h}`}
                      style={[
                        styles.hourPill,
                        isSelected && (activeTarget === 'start' ? styles.hourPillSelectedStart : styles.hourPillSelectedEnd),
                        !isSelected && isBoundary && styles.hourPillBoundary,
                      ]}
                      onPress={() => handleSelectHour(h)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.hourPillText,
                          isSelected && styles.hourPillTextSelected,
                          !isSelected && isBoundary && styles.hourPillTextBoundary,
                        ]}
                      >
                        {h}
                      </Text>
                      {!isSelected && isBoundary && (
                        <View
                          style={[
                            styles.hourPillMiniTag,
                            { backgroundColor: activeTarget === 'start' ? colors.primary : '#34D399' },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.hourStepperBtn}
                onPress={() => handleStepHour(1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#D4D4E0" />
                <Text style={styles.hourStepperBtnText}>1h</Text>
              </TouchableOpacity>
            </View>

            {/* Meridiem (AM/PM) & Minute Granularity Row */}
            <View style={styles.deckControlRow}>
              {/* AM / PM Segmented Capsule */}
              <View style={styles.meridiemCapsule}>
                <TouchableOpacity
                  style={[styles.meridiemCapsuleBtn, !activeIsPm && styles.meridiemCapsuleBtnActive]}
                  onPress={() => handleToggleMeridiem(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.meridiemCapsuleText, !activeIsPm && styles.meridiemCapsuleTextActive]}>
                    AM
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.meridiemCapsuleBtn, activeIsPm && styles.meridiemCapsuleBtnActive]}
                  onPress={() => handleToggleMeridiem(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.meridiemCapsuleText, activeIsPm && styles.meridiemCapsuleTextActive]}>
                    PM
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Minute Granularity Pills */}
              <View style={styles.minutePillsGroup}>
                {minuteOptions.map((m) => {
                  const isMinSelected = activeMinute === m;
                  return (
                    <TouchableOpacity
                      key={`min_${m}`}
                      style={[
                        styles.minutePill,
                        isMinSelected && (activeTarget === 'start' ? styles.minutePillActiveStart : styles.minutePillActiveEnd),
                      ]}
                      onPress={() => handleSelectMinute(m)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.minutePillText,
                          isMinSelected && styles.minutePillTextActive,
                        ]}
                      >
                        :{String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quick Nudge Fine-Tuning Pills */}
            <View style={styles.quickNudgeRow}>
              <TouchableOpacity
                style={styles.quickNudgeBtn}
                onPress={() => handleStepMinutes(-15)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickNudgeText}>-15m</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNudgeBtn}
                onPress={() => handleStepMinutes(15)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickNudgeText}>+15m</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNudgeBtn}
                onPress={() => handleStepMinutes(-30)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickNudgeText}>-30m</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNudgeBtn}
                onPress={() => handleStepMinutes(30)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickNudgeText}>+30m</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selection Live Status Bar */}
          <View style={styles.slotRangeBanner}>
            <View style={styles.slotRangeLeft}>
              <Ionicons
                name={currentSlotOccupied.occupied ? 'alert-circle' : 'checkmark-circle'}
                size={18}
                color={currentSlotOccupied.occupied ? '#F87171' : colors.success}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.slotRangeBannerText}>
                {currentSlotRange.displayString}
              </Text>
            </View>
            <View
              style={[
                styles.slotStatusTag,
                {
                  backgroundColor: currentSlotOccupied.occupied
                    ? 'rgba(239, 68, 68, 0.16)'
                    : 'rgba(52, 211, 153, 0.16)',
                },
              ]}
            >
              <Text
                style={[
                  styles.slotStatusTagText,
                  { color: currentSlotOccupied.occupied ? '#EF4444' : colors.success },
                ]}
              >
                {currentSlotOccupied.occupied ? 'Occupied' : 'Available'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 4. CONFLICT DETECTION & ONE-TAP SHIFT CARD */}
      {currentSlotOccupied.occupied && (
        <View style={styles.occupiedAlertCard}>
          <View style={styles.occupiedAlertHeader}>
            <Ionicons name="warning" size={17} color="#F87171" style={{ marginRight: 6 }} />
            <Text style={styles.occupiedAlertTitle}>
              Slot Occupied by &ldquo;{currentSlotOccupied.title}&rdquo;
            </Text>
          </View>

          <Text style={styles.occupiedAlertSub}>
            This time overlaps with an existing task on this date. You can shift it to the next free slot automatically.
          </Text>

          {nextSlotForShift && onShiftOccupiedSlot && currentSlotOccupied.conflictingTaskId && (
            <TouchableOpacity
              style={styles.shiftSlotBtn}
              onPress={() => {
                onShiftOccupiedSlot(
                  currentSlotOccupied.conflictingTaskId!,
                  nextSlotForShift.rangeString,
                  currentSlotOccupied.title
                );
              }}
              activeOpacity={0.8}
            >
              <View style={styles.shiftSlotBtnIconCircle}>
                <Ionicons name="swap-horizontal" size={16} color="#151518" />
              </View>
              <View style={styles.shiftSlotBtnContent}>
                <Text style={styles.shiftSlotBtnTitle}>
                  Shift &ldquo;{currentSlotOccupied.title}&rdquo; & Take This Slot
                </Text>
                <Text style={styles.shiftSlotBtnSub}>
                  Move existing task to {nextSlotForShift.rangeString}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* Quick Alternative Available Slots */}
          <Text style={styles.alternativeSlotsHeader}>Or pick an available slot:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.availableSlotsScroll}
          >
            {availableSlots.slice(0, 5).map((slot) => (
              <TouchableOpacity
                key={slot.rangeString}
                style={styles.availableSlotChip}
                onPress={() => {
                  playSpinnerTickSound(900);
                  triggerHaptic();
                  onSelectSlot({
                    startHour: slot.startHour,
                    rangeString: slot.rangeString,
                    isOccupied: false,
                  });
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={13} color="#151518" style={{ marginRight: 4 }} />
                <Text style={styles.availableSlotChipText}>{slot.rangeString}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 5. TIMELINE LIST VIEW */}
      {viewMode === 'timeline' && (
        <View style={styles.timelineContainer}>
          {/* Day Period Filter Tabs */}
          <View style={styles.periodTabsRow}>
            {(['All', 'Morning', 'Afternoon', 'Night'] as const).map((period) => {
              const isActive = timeFilterPeriod === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodTab, isActive && styles.periodTabActive]}
                  onPress={() => {
                    playSpinnerTickSound(750);
                    triggerHaptic();
                    setTimeFilterPeriod(period);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodTabText, isActive && styles.periodTabTextActive]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Vertical Slot Items */}
          <View style={styles.timeSlotsGrid}>
            {filteredTimeSlots.map((opt) => {
              const isSelected = selectedStartHour === opt.startHour;
              return (
                <TouchableOpacity
                  key={opt.rangeString}
                  style={[
                    styles.timeSlotChip,
                    isSelected && styles.timeSlotChipSelected,
                    opt.isOccupied && !isSelected && styles.timeSlotChipOccupied,
                  ]}
                  onPress={() => {
                    playSpinnerTickSound(opt.isOccupied ? 650 : 900);
                    triggerHaptic();
                    onSelectSlot({
                      startHour: opt.startHour,
                      rangeString: opt.rangeString,
                      isOccupied: opt.isOccupied,
                    });
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.timeSlotRowTop}>
                    <Ionicons
                      name={isSelected ? 'time' : 'time-outline'}
                      size={15}
                      color={
                        isSelected
                          ? '#151518'
                          : opt.isOccupied
                          ? '#F87171'
                          : '#9A9AA6'
                      }
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.timeSlotChipText,
                        isSelected && styles.timeSlotChipTextSelected,
                        opt.isOccupied && !isSelected && styles.timeSlotChipTextOccupied,
                      ]}
                    >
                      {opt.rangeString}
                    </Text>
                  </View>

                  <View style={styles.timeSlotStatusRow}>
                    {opt.isOccupied ? (
                      <View style={styles.occupiedTag}>
                        <View style={styles.redDot} />
                        <Text
                          style={[
                            styles.occupiedTagText,
                            isSelected && styles.occupiedTagTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {opt.occupiedTitle || 'Occupied'}
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
                          Free
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  viewModeToggleRow: {
    ...commonStyles.row,
    backgroundColor: 'rgba(22, 22, 32, 0.9)',
    borderRadius: radius.card,
    padding: 3,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewModeBtn: {
    ...commonStyles.flex1,
    ...commonStyles.rowCenter,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  viewModeBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  viewModeBtnText: {
    color: '#8A8A9A',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  viewModeBtnTextActive: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    color: '#A0A0B2',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  durationScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  durationChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: 'rgba(26, 26, 36, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  durationChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  durationChipText: {
    color: '#D4D4E0',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  durationChipTextSelected: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },

  // ================= MODERN DIGITAL HUB CARD =================
  digitalHubCard: {
    backgroundColor: 'rgba(20, 20, 28, 0.92)',
    borderRadius: radius.cardLg + 4,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 5,
  },
  heroRow: {
    ...commonStyles.row,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
  },
  timeHeroCard: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 38, 0.95)',
    borderRadius: radius.cardLg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeHeroCardActiveStart: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  timeHeroCardActiveEnd: {
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCardHeader: {
    ...commonStyles.row,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  heroCardLabel: {
    color: '#8E8E9E',
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  heroCardLabelActiveStart: {
    color: '#34D399',
  },
  heroCardLabelActiveEnd: {
    color: colors.primary,
  },
  activePill: {
    marginLeft: 'auto',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: fontWeights.heavy,
  },
  heroDigitsRow: {
    ...commonStyles.row,
    alignItems: 'baseline',
    marginTop: 2,
    marginBottom: 2,
  },
  heroDigits: {
    color: '#FFFFFF',
    fontSize: fontSizes.titleLg,
    fontWeight: fontWeights.heavy,
    letterSpacing: -0.5,
  },
  heroMeridiemTag: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  heroMeridiemText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.heavy,
  },
  heroCardHint: {
    color: '#6E6E80',
    fontSize: 9,
    marginTop: 2,
  },

  // Bridge between cards
  bridgeContainer: {
    paddingHorizontal: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bridgeLine: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
  },
  bridgeDurationBadge: {
    ...commonStyles.rowCenter,
    backgroundColor: '#1E1E2C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 2,
  },
  bridgeDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: fontWeights.heavy,
  },

  // Adjustment Deck
  adjustmentDeck: {
    backgroundColor: 'rgba(16, 16, 24, 0.85)',
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deckHeader: {
    ...commonStyles.rowCenter,
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  deckIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  deckTitle: {
    color: '#A0A0B4',
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
  },
  hourSelectorRow: {
    ...commonStyles.rowCenter,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  hourStepperBtn: {
    ...commonStyles.center,
    backgroundColor: 'rgba(32, 32, 46, 0.95)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: 38,
    height: 44,
  },
  hourStepperBtnText: {
    color: '#A0A0B4',
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  hourStripScroll: {
    gap: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  hourPill: {
    ...commonStyles.center,
    backgroundColor: 'rgba(28, 28, 40, 0.9)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: 40,
    height: 44,
    position: 'relative',
  },
  hourPillSelectedStart: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  hourPillSelectedEnd: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  hourPillBoundary: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(38, 38, 54, 0.95)',
  },
  hourPillText: {
    color: '#D4D4E0',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  hourPillTextSelected: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  hourPillTextBoundary: {
    color: '#FFFFFF',
    fontWeight: fontWeights.heavy,
  },
  hourPillMiniTag: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Meridiem & Minute Controls
  deckControlRow: {
    ...commonStyles.row,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  meridiemCapsule: {
    ...commonStyles.row,
    backgroundColor: 'rgba(28, 28, 42, 0.95)',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  meridiemCapsuleBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.full,
  },
  meridiemCapsuleBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  meridiemCapsuleText: {
    color: '#8E8E9E',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  meridiemCapsuleTextActive: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  minutePillsGroup: {
    ...commonStyles.row,
    backgroundColor: 'rgba(28, 28, 42, 0.95)',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 2,
  },
  minutePill: {
    paddingHorizontal: 9,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.full,
  },
  minutePillActiveStart: {
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  minutePillActiveEnd: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  minutePillText: {
    color: '#8E8E9E',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  minutePillTextActive: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },

  // Quick Nudge Buttons
  quickNudgeRow: {
    ...commonStyles.row,
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  quickNudgeBtn: {
    flex: 1,
    ...commonStyles.center,
    paddingVertical: spacing.xs + 2,
    backgroundColor: 'rgba(32, 32, 46, 0.8)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickNudgeText: {
    color: '#B0B0C4',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },

  // Range Status Banner
  slotRangeBanner: {
    ...commonStyles.rowCenter,
    backgroundColor: 'rgba(26, 26, 38, 0.9)',
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    justifyContent: 'space-between',
  },
  slotRangeLeft: {
    ...commonStyles.rowCenter,
    flex: 1,
  },
  slotRangeBannerText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  slotStatusTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  slotStatusTagText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },

  // Occupied alert card
  occupiedAlertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.09)',
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: radius.cardLg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  occupiedAlertHeader: {
    ...commonStyles.row,
    marginBottom: spacing.xs,
  },
  occupiedAlertTitle: {
    color: '#F87171',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  occupiedAlertSub: {
    color: '#D4D4E0',
    fontSize: fontSizes.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  shiftSlotBtn: {
    ...commonStyles.row,
    alignItems: 'center',
    backgroundColor: '#1E1E28',
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 168, 120, 0.35)',
    marginBottom: spacing.md,
  },
  shiftSlotBtnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    ...commonStyles.center,
    marginRight: spacing.md,
  },
  shiftSlotBtnContent: {
    ...commonStyles.flex1,
  },
  shiftSlotBtnTitle: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  shiftSlotBtnSub: {
    color: '#A0A0B2',
    fontSize: fontSizes.tiny,
  },
  alternativeSlotsHeader: {
    color: '#A0A0B2',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  availableSlotsScroll: {
    gap: spacing.sm,
  },
  availableSlotChip: {
    ...commonStyles.rowCenter,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  availableSlotChipText: {
    color: '#151518',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.heavy,
  },

  // Timeline Mode Styles
  timelineContainer: {
    marginTop: spacing.xs,
  },
  periodTabsRow: {
    ...commonStyles.row,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  periodTab: {
    ...commonStyles.flex1,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: '#1C1C24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodTabText: {
    color: '#8A8A9A',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  periodTabTextActive: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  timeSlotsGrid: {
    gap: spacing.sm,
  },
  timeSlotChip: {
    ...commonStyles.row,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  timeSlotChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  timeSlotChipOccupied: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  timeSlotRowTop: {
    ...commonStyles.rowCenter,
  },
  timeSlotChipText: {
    color: '#D4D4E0',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  timeSlotChipTextSelected: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  timeSlotChipTextOccupied: {
    color: '#F87171',
  },
  timeSlotStatusRow: {
    ...commonStyles.rowCenter,
  },
  occupiedTag: {
    ...commonStyles.rowCenter,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    maxWidth: 120,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  occupiedTagText: {
    color: '#EF4444',
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  occupiedTagTextSelected: {
    color: '#7F1D1D',
  },
  availableTag: {
    ...commonStyles.rowCenter,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  greenDotSelected: {
    backgroundColor: '#151518',
  },
  availableTagText: {
    color: colors.success,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  availableTagTextSelected: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
});
