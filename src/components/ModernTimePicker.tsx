import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { playSpinnerTickSound } from '../services/soundEffects';

const { width } = Dimensions.get('window');

interface ModernTimePickerProps {
  startHour: number; // 1..12
  startMeridiem: 'AM' | 'PM';
  endHour: number;   // 1..12
  endMeridiem: 'AM' | 'PM';
  voiceEffectEnabled?: boolean;
  onChangeTime: (
    startH: number,
    startM: 'AM' | 'PM',
    endH: number,
    endM: 'AM' | 'PM'
  ) => void;
}

const quickPresets = [
  { label: 'Morning', icon: 'sunny-outline', startH: 9, startM: 'AM' as const, endH: 12, endM: 'PM' as const, desc: '9 AM - 12 PM' },
  { label: 'Afternoon', icon: 'partly-sunny-outline', startH: 2, startM: 'PM' as const, endH: 5, endM: 'PM' as const, desc: '2 PM - 5 PM' },
  { label: 'Evening', icon: 'cloudy-night-outline', startH: 6, startM: 'PM' as const, endH: 9, endM: 'PM' as const, desc: '6 PM - 9 PM' },
  { label: 'Night', icon: 'moon-outline', startH: 9, startM: 'PM' as const, endH: 11, endM: 'PM' as const, desc: '9 PM - 11 PM' },
];

const timelineHours = [
  { h: 6, m: 'AM' as const, label: '6 AM' },
  { h: 8, m: 'AM' as const, label: '8 AM' },
  { h: 10, m: 'AM' as const, label: '10 AM' },
  { h: 12, m: 'PM' as const, label: '12 PM' },
  { h: 2, m: 'PM' as const, label: '2 PM' },
  { h: 4, m: 'PM' as const, label: '4 PM' },
  { h: 6, m: 'PM' as const, label: '6 PM' },
  { h: 8, m: 'PM' as const, label: '8 PM' },
  { h: 10, m: 'PM' as const, label: '10 PM' },
];

export const ModernTimePicker: React.FC<ModernTimePickerProps> = ({
  startHour,
  startMeridiem,
  endHour,
  endMeridiem,
  voiceEffectEnabled = true,
  onChangeTime,
}) => {
  // Convert 12h to 24h for calculations
  const to24 = (h: number, m: 'AM' | 'PM') => {
    let hour = h % 12;
    if (m === 'PM') hour += 12;
    return hour;
  };

  const start24 = to24(startHour, startMeridiem);
  const end24 = to24(endHour, endMeridiem);
  const diffHours = (end24 - start24 + 24) % 24;
  const durationLabel = diffHours === 0 ? '12 hrs' : `${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'}`;

  const triggerVoice = (_text: string, freq: number = 850) => {
    playSpinnerTickSound(freq);
  };

  // Adjust Start Hour
  const stepStartHour = (delta: number) => {
    let nextH = startHour + delta;
    let nextM = startMeridiem;
    if (nextH > 12) {
      nextH = 1;
    } else if (nextH < 1) {
      nextH = 12;
    }
    onChangeTime(nextH, nextM, endHour, endMeridiem);
    triggerVoice(`Start at ${nextH} ${nextM}`, delta > 0 ? 950 : 750);
  };

  // Adjust End Hour
  const stepEndHour = (delta: number) => {
    let nextH = endHour + delta;
    let nextM = endMeridiem;
    if (nextH > 12) {
      nextH = 1;
    } else if (nextH < 1) {
      nextH = 12;
    }
    onChangeTime(startHour, startMeridiem, nextH, nextM);
    triggerVoice(`End at ${nextH} ${nextM}`, delta > 0 ? 1000 : 800);
  };

  const toggleStartMeridiem = () => {
    const nextM = startMeridiem === 'AM' ? 'PM' : 'AM';
    onChangeTime(startHour, nextM, endHour, endMeridiem);
    triggerVoice(`Start ${nextM}`, 900);
  };

  const toggleEndMeridiem = () => {
    const nextM = endMeridiem === 'AM' ? 'PM' : 'AM';
    onChangeTime(startHour, startMeridiem, endHour, nextM);
    triggerVoice(`End ${nextM}`, 900);
  };

  const applyPreset = (preset: typeof quickPresets[0]) => {
    onChangeTime(preset.startH, preset.startM, preset.endH, preset.endM);
    triggerVoice(`${preset.label}, ${preset.desc}`, 1050);
  };

  const addDurationHours = (hoursToAdd: number) => {
    let currentEnd24 = to24(endHour, endMeridiem);
    let nextEnd24 = (currentEnd24 + hoursToAdd) % 24;
    let nextH = nextEnd24 % 12 === 0 ? 12 : nextEnd24 % 12;
    let nextM: 'AM' | 'PM' = nextEnd24 >= 12 ? 'PM' : 'AM';
    onChangeTime(startHour, startMeridiem, nextH, nextM);
    triggerVoice(`Added ${hoursToAdd} hr, ends at ${nextH} ${nextM}`, 1000);
  };

  const formatDigits = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <View style={styles.container}>
      {/* Dual Digital Pods (Start Time ➔ End Time) */}
      <View style={styles.dualPodsRow}>
        {/* Start Time Pod */}
        <View style={styles.timePod}>
          <View style={styles.podHeader}>
            <Ionicons name="play-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.podLabel}>START TIME</Text>
          </View>

          <View style={styles.timeValueRow}>
            <Text style={styles.digitalDigits}>{formatDigits(startHour)}:00</Text>
            <TouchableOpacity
              style={styles.meridiemChip}
              onPress={toggleStartMeridiem}
              activeOpacity={0.7}
            >
              <Text style={styles.meridiemChipText}>{startMeridiem}</Text>
            </TouchableOpacity>
          </View>

          {/* Stepper Buttons */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => stepStartHour(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color="#C8C8D4" />
            </TouchableOpacity>
            <Text style={styles.stepperHint}>Hour</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => stepStartHour(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#C8C8D4" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Connecting Arrow & Duration Badge */}
        <View style={styles.centerConnector}>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </View>
          <View style={styles.durationCapsule}>
            <Text style={styles.durationCapsuleText}>{durationLabel}</Text>
          </View>
        </View>

        {/* End Time Pod */}
        <View style={styles.timePod}>
          <View style={styles.podHeader}>
            <Ionicons name="flag-outline" size={14} color="#7ED4AD" />
            <Text style={styles.podLabel}>END TIME</Text>
          </View>

          <View style={styles.timeValueRow}>
            <Text style={styles.digitalDigits}>{formatDigits(endHour)}:00</Text>
            <TouchableOpacity
              style={[styles.meridiemChip, { borderColor: '#7ED4AD44', backgroundColor: '#7ED4AD15' }]}
              onPress={toggleEndMeridiem}
              activeOpacity={0.7}
            >
              <Text style={[styles.meridiemChipText, { color: '#7ED4AD' }]}>{endMeridiem}</Text>
            </TouchableOpacity>
          </View>

          {/* Stepper Buttons */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => stepEndHour(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color="#C8C8D4" />
            </TouchableOpacity>
            <Text style={styles.stepperHint}>Hour</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => stepEndHour(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#C8C8D4" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Interactive Quick Time Slot Presets */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Smart Time Slots</Text>
        <Text style={styles.sectionSub}>One-tap select</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        bounces={true}
        contentContainerStyle={styles.presetsRow}
      >
        {quickPresets.map((preset, idx) => {
          const isSelected =
            startHour === preset.startH &&
            startMeridiem === preset.startM &&
            endHour === preset.endH &&
            endMeridiem === preset.endM;

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.presetCard, isSelected && styles.presetCardSelected]}
              onPress={() => applyPreset(preset)}
              activeOpacity={0.75}
            >
              <View style={styles.presetTopRow}>
                <Ionicons
                  name={preset.icon as any}
                  size={16}
                  color={isSelected ? colors.primary : '#8A8A96'}
                />
                <Text style={[styles.presetTitle, isSelected && styles.presetTitleSelected]}>
                  {preset.label}
                </Text>
              </View>
              <Text style={[styles.presetDesc, isSelected && styles.presetDescSelected]}>
                {preset.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Quick Add Duration Chips */}
      <View style={styles.quickAddRow}>
        <Text style={styles.quickAddLabel}>Quick Add:</Text>
        <TouchableOpacity
          style={styles.quickAddChip}
          onPress={() => addDurationHours(1)}
          activeOpacity={0.7}
        >
          <Text style={styles.quickAddChipText}>+1 Hour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAddChip}
          onPress={() => addDurationHours(2)}
          activeOpacity={0.7}
        >
          <Text style={styles.quickAddChipText}>+2 Hours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAddChip}
          onPress={() => addDurationHours(3)}
          activeOpacity={0.7}
        >
          <Text style={styles.quickAddChipText}>+3 Hours</Text>
        </TouchableOpacity>
      </View>

      {/* Visual Timeline Track */}
      <View style={styles.timelineSection}>
        <Text style={styles.timelineHeader}>Day Schedule Overview</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineStrip}
        >
          {timelineHours.map((item, idx) => {
            const item24 = to24(item.h, item.m);
            const inRange =
              start24 <= end24
                ? item24 >= start24 && item24 <= end24
                : item24 >= start24 || item24 <= end24;

            const isStart = item.h === startHour && item.m === startMeridiem;
            const isEnd = item.h === endHour && item.m === endMeridiem;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.timelineNode,
                  inRange && styles.timelineNodeInRange,
                  (isStart || isEnd) && styles.timelineNodeActive,
                ]}
                onPress={() => {
                  // Tap to set start time
                  onChangeTime(item.h, item.m, endHour, endMeridiem);
                  triggerVoice(`Start time set to ${item.label}`);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.timelineDot,
                    inRange && styles.timelineDotInRange,
                    (isStart || isEnd) && styles.timelineDotActive,
                  ]}
                />
                <Text
                  style={[
                    styles.timelineLabel,
                    inRange && styles.timelineLabelInRange,
                    (isStart || isEnd) && styles.timelineLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
  dualPodsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timePod: {
    flex: 1,
    backgroundColor: '#16161C',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262632',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  podHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  podLabel: {
    color: '#8A8A96',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  digitalDigits: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  meridiemChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 168, 120, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 168, 120, 0.4)',
  },
  meridiemChipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E26',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#272734',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperHint: {
    color: '#767684',
    fontSize: 11,
    fontWeight: '600',
  },
  centerConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1D1D25',
    borderWidth: 1,
    borderColor: '#2F2F3D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  durationCapsule: {
    backgroundColor: '#22222C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#323242',
  },
  durationCapsuleText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#E0E0EA',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionSub: {
    color: '#727280',
    fontSize: 11,
    fontWeight: '500',
  },
  presetsRow: {
    gap: 10,
    paddingBottom: 4,
  },
  presetCard: {
    backgroundColor: '#16161C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252532',
    minWidth: 124,
  },
  presetCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#242022',
  },
  presetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  presetTitle: {
    color: '#C8C8D4',
    fontSize: 13,
    fontWeight: '700',
  },
  presetTitleSelected: {
    color: colors.primary,
  },
  presetDesc: {
    color: '#6E6E7C',
    fontSize: 11,
    fontWeight: '500',
  },
  presetDescSelected: {
    color: '#E4E4EE',
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  quickAddLabel: {
    color: '#7A7A88',
    fontSize: 12,
    fontWeight: '600',
  },
  quickAddChip: {
    backgroundColor: '#1A1A22',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#292936',
  },
  quickAddChipText: {
    color: '#D0D0DC',
    fontSize: 11,
    fontWeight: '600',
  },
  timelineSection: {
    backgroundColor: '#14141A',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#22222E',
  },
  timelineHeader: {
    color: '#7E7E8D',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  timelineStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  timelineNode: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#262634',
  },
  timelineNodeInRange: {
    backgroundColor: '#262124',
    borderColor: 'rgba(248, 168, 120, 0.4)',
  },
  timelineNodeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A4A58',
    marginBottom: 4,
  },
  timelineDotInRange: {
    backgroundColor: colors.primary,
  },
  timelineDotActive: {
    backgroundColor: '#151518',
  },
  timelineLabel: {
    color: '#7A7A88',
    fontSize: 10,
    fontWeight: '600',
  },
  timelineLabelInRange: {
    color: '#F8A878',
  },
  timelineLabelActive: {
    color: '#151518',
    fontWeight: '800',
  },
});
