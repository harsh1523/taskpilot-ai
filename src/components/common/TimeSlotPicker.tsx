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

const DIAL_SIZE = 240;
const RADIUS = 84;
const NODE_SIZE = 36;
const CENTER = DIAL_SIZE / 2;

// 12 Clock positions from 1 to 12
const clockHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

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
  const [viewMode, setViewMode] = useState<'radial' | 'timeline'>('radial');
  const [timeFilterPeriod, setTimeFilterPeriod] = useState<'All' | 'Morning' | 'Afternoon' | 'Night'>('All');

  const isPm = selectedStartHour >= 12;
  const current12Hour = selectedStartHour % 12 === 0 ? 12 : selectedStartHour % 12;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  // Convert 12h display number (1..12) with current AM/PM to 24h
  const to24Hour = (h12: number, pm: boolean): number => {
    if (pm) {
      return h12 === 12 ? 12 : h12 + 12;
    }
    return h12 === 12 ? 0 : h12;
  };

  // Handle Hour Selection on Dial
  const handleSelectClockHour = (h12: number) => {
    playSpinnerTickSound(900);
    triggerHaptic();
    const new24H = to24Hour(h12, isPm);
    const range = computeTimeRange(new24H, selectedDuration);
    const occ = checkSlotConflict(range.startMinutes, selectedDuration, occupiedSchedule);
    onSelectSlot({
      startHour: new24H,
      rangeString: range.rangeString,
      isOccupied: occ.occupied,
    });
  };

  // Toggle AM / PM
  const handleToggleMeridiem = (targetPm: boolean) => {
    if (targetPm === isPm) return;
    playSpinnerTickSound(950);
    triggerHaptic();
    const new24H = to24Hour(current12Hour, targetPm);
    const range = computeTimeRange(new24H, selectedDuration);
    const occ = checkSlotConflict(range.startMinutes, selectedDuration, occupiedSchedule);
    onSelectSlot({
      startHour: new24H,
      rangeString: range.rangeString,
      isOccupied: occ.occupied,
    });
  };

  const currentSlotRange = useMemo(() => {
    return computeTimeRange(selectedStartHour, selectedDuration);
  }, [selectedStartHour, selectedDuration]);

  const currentSlotOccupied = useMemo(() => {
    return checkSlotConflict(currentSlotRange.startMinutes, selectedDuration, occupiedSchedule);
  }, [currentSlotRange, selectedDuration, occupiedSchedule]);

  const nextSlotForShift = useMemo(() => {
    if (!currentSlotOccupied.occupied) return null;
    return findNextAvailableSlot(occupiedSchedule, currentSlotRange.startMinutes, selectedDuration);
  }, [currentSlotOccupied.occupied, occupiedSchedule, currentSlotRange.startMinutes, selectedDuration]);

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

  // Pointer angle (0° is 12, 90° is 3, 180° is 6, 270° is 9)
  const pointerAngle = (current12Hour % 12) * 30;

  return (
    <View style={styles.container}>
      {/* 1. Header Toggle: Radial Dial vs Timeline List */}
      <View style={styles.viewModeToggleRow}>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'radial' && styles.viewModeBtnActive]}
          onPress={() => {
            playSpinnerTickSound(800);
            triggerHaptic();
            setViewMode('radial');
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="time"
            size={14}
            color={viewMode === 'radial' ? '#151518' : colors.textSecondary}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.viewModeBtnText, viewMode === 'radial' && styles.viewModeBtnTextActive]}>
            Radial Dial
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
            size={14}
            color={viewMode === 'timeline' ? '#151518' : colors.textSecondary}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.viewModeBtnText, viewMode === 'timeline' && styles.viewModeBtnTextActive]}>
            Timeline List
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Duration Selector Chips */}
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

      {/* 3. RADIAL CLOCK DIAL VIEW */}
      {viewMode === 'radial' && (
        <View style={styles.radialCard}>
          {/* AM / PM Segmented Capsule Switcher */}
          <View style={styles.meridiemContainer}>
            <TouchableOpacity
              style={[styles.meridiemBtn, !isPm && styles.meridiemBtnActive]}
              onPress={() => handleToggleMeridiem(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.meridiemBtnText, !isPm && styles.meridiemBtnTextActive]}>
                AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.meridiemBtn, isPm && styles.meridiemBtnActive]}
              onPress={() => handleToggleMeridiem(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.meridiemBtnText, isPm && styles.meridiemBtnTextActive]}>
                PM
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Clock Face Ring */}
          <View style={styles.clockDialWrapper}>
            {/* Center Pointer Laser Hand */}
            <View
              style={[
                styles.pointerHandWrapper,
                { transform: [{ rotate: `${pointerAngle}deg` }] },
              ]}
              pointerEvents="none"
            >
              <View style={styles.pointerHandLine} />
              <View style={styles.pointerHandTip} />
            </View>

            {/* Glowing Center Hub Disc */}
            <View style={styles.clockCenterHub} pointerEvents="none">
              <Text style={styles.centerTimeText}>
                {String(current12Hour).padStart(2, '0')}:00
              </Text>
              <View style={styles.centerMeridiemTag}>
                <View
                  style={[
                    styles.centerStatusPip,
                    { backgroundColor: currentSlotOccupied.occupied ? '#EF4444' : colors.success },
                  ]}
                />
                <Text style={styles.centerMeridiemText}>{isPm ? 'PM' : 'AM'}</Text>
              </View>
            </View>

            {/* 12 Interactive Radial Hour Nodes */}
            {clockHours.map((h) => {
              const isSelected = current12Hour === h;
              const angle = ((h % 12) * 30 - 90) * (Math.PI / 180);
              const nodeLeft = CENTER + RADIUS * Math.cos(angle) - NODE_SIZE / 2;
              const nodeTop = CENTER + RADIUS * Math.sin(angle) - NODE_SIZE / 2;

              // Check if this hour is occupied
              const h24 = to24Hour(h, isPm);
              const nodeConflict = checkSlotConflict(h24 * 60, selectedDuration, occupiedSchedule);
              const isOccupied = nodeConflict.occupied;

              return (
                <TouchableOpacity
                  key={`node_${h}`}
                  style={[
                    styles.clockNode,
                    { left: nodeLeft, top: nodeTop },
                    isSelected && styles.clockNodeSelected,
                    isOccupied && !isSelected && styles.clockNodeOccupied,
                  ]}
                  onPress={() => handleSelectClockHour(h)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.clockNodeText,
                      isSelected && styles.clockNodeTextSelected,
                      isOccupied && !isSelected && styles.clockNodeTextOccupied,
                    ]}
                  >
                    {h}
                  </Text>
                  {isOccupied && (
                    <View
                      style={[
                        styles.nodeOccupiedDot,
                        isSelected && { backgroundColor: '#7F1D1D' },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Current Selection Status Bar */}
          <View style={styles.slotRangeBanner}>
            <Ionicons
              name={currentSlotOccupied.occupied ? 'alert-circle' : 'checkmark-circle'}
              size={16}
              color={currentSlotOccupied.occupied ? '#F87171' : colors.success}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.slotRangeBannerText}>
              {currentSlotRange.displayString}
            </Text>
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
          {/* Period Filter Tabs */}
          <View style={styles.periodFilterRow}>
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
  // Radial Dial Glass Card
  radialCard: {
    backgroundColor: 'rgba(20, 20, 28, 0.88)',
    borderRadius: radius.cardLg + 4,
    borderWidth: 1.2,
    borderColor: 'rgba(248, 168, 120, 0.22)',
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  meridiemContainer: {
    ...commonStyles.row,
    backgroundColor: 'rgba(26, 26, 38, 0.95)',
    borderRadius: radius.full,
    padding: 3,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  meridiemBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  meridiemBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  meridiemBtnText: {
    color: '#8E8E9E',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  meridiemBtnTextActive: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  // Circular Dial Face
  clockDialWrapper: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: 'rgba(14, 14, 20, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(248, 168, 120, 0.2)',
    position: 'relative',
    ...commonStyles.center,
  },
  // Clock pointer line
  pointerHandWrapper: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    ...commonStyles.center,
  },
  pointerHandLine: {
    position: 'absolute',
    top: 36,
    width: 2.5,
    height: RADIUS - 18,
    backgroundColor: colors.primary,
    borderRadius: 1,
    opacity: 0.8,
  },
  pointerHandTip: {
    position: 'absolute',
    top: 30,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  // Center Hub
  clockCenterHub: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(26, 26, 36, 0.96)',
    borderWidth: 1.5,
    borderColor: 'rgba(248, 168, 120, 0.3)',
    ...commonStyles.center,
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  centerTimeText: {
    color: colors.textPrimary,
    fontSize: fontSizes.titleSm,
    fontWeight: fontWeights.heavy,
    letterSpacing: -0.5,
  },
  centerMeridiemTag: {
    ...commonStyles.rowCenter,
    marginTop: 2,
  },
  centerStatusPip: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  centerMeridiemText: {
    color: colors.primary,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  // 12 Clock Nodes
  clockNode: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: 'rgba(30, 30, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...commonStyles.center,
    zIndex: 5,
  },
  clockNodeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  clockNodeOccupied: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  clockNodeText: {
    color: '#D4D4E2',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  clockNodeTextSelected: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  clockNodeTextOccupied: {
    color: '#FCA5A5',
  },
  nodeOccupiedDot: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  slotRangeBanner: {
    ...commonStyles.rowCenter,
    backgroundColor: 'rgba(24, 24, 34, 0.8)',
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    justifyContent: 'space-between',
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
    fontSize: fontSizes.sm,
    lineHeight: 18,
    marginBottom: spacing.base,
  },
  shiftSlotBtn: {
    ...commonStyles.row,
    backgroundColor: 'rgba(28, 24, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(248, 168, 120, 0.45)',
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  shiftSlotBtnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    ...commonStyles.center,
    marginRight: spacing.base,
  },
  shiftSlotBtnContent: {
    ...commonStyles.flex1,
  },
  shiftSlotBtnTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  shiftSlotBtnSub: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.xxs,
  },
  alternativeSlotsHeader: {
    color: '#9E9EB2',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  availableSlotsScroll: {
    gap: spacing.md,
  },
  availableSlotChip: {
    ...commonStyles.row,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
  },
  availableSlotChipText: {
    color: '#151518',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.heavy,
  },
  // Timeline list view
  timelineContainer: {
    marginTop: spacing.sm,
  },
  periodFilterRow: {
    flexDirection: 'row',
    backgroundColor: '#161622',
    borderRadius: radius.lg,
    padding: 3,
    marginBottom: spacing.xl - 2,
    gap: spacing.xs,
  },
  periodTab: {
    ...commonStyles.flex1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radius.base,
  },
  periodTabActive: {
    backgroundColor: '#262638',
  },
  periodTabText: {
    color: '#76768E',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  periodTabTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.heavy,
  },
  timeSlotsGrid: {
    gap: spacing.md,
  },
  timeSlotChip: {
    ...commonStyles.rowBetween,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl - 2,
    borderRadius: radius.xl,
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
    ...commonStyles.row,
  },
  timeSlotChipText: {
    color: '#E0E0EA',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  timeSlotChipTextSelected: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  timeSlotChipTextOccupied: {
    color: '#FCA5A5',
  },
  timeSlotStatusRow: {
    ...commonStyles.row,
  },
  occupiedTag: {
    ...commonStyles.row,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.sm,
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
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    maxWidth: 90,
  },
  occupiedTagTextSelected: {
    color: '#7F1D1D',
  },
  availableTag: {
    ...commonStyles.row,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  greenDotSelected: {
    backgroundColor: '#064E3B',
  },
  availableTagText: {
    color: colors.success,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  availableTagTextSelected: {
    color: '#064E3B',
  },
});
