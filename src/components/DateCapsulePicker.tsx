import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, padding, radius, fontSizes, fontWeights, commonStyles, useTheme } from '../theme';
import { playSpinnerTickSound } from '../services/soundEffects';

export interface DateItem {
  id: string;
  month: string;
  day: string;
  weekday?: string;
  isDashed?: boolean;
  label?: string;
}

interface DateCapsulePickerProps {
  dates?: DateItem[];
  selectedId: string;
  onSelectDate: (item: DateItem) => void;
  onAddDate?: () => void;
}

export const generateRealtimeDates = (): DateItem[] => {
  const list: DateItem[] = [];
  const today = new Date();

  // Generate 6 days starting from today
  for (let offset = 0; offset <= 5; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
    const weekdayStr = d.toLocaleDateString('en-US', { weekday: 'short' });

    list.push({
      id: dayStr,
      day: dayStr,
      month: monthStr,
      weekday: weekdayStr,
    });
  }

  // Final dashed item for adding a custom date
  list.push({
    id: 'add_custom_date',
    month: today.toLocaleDateString('en-US', { month: 'short' }),
    day: '+',
    weekday: 'Add',
    isDashed: true,
    label: '+ Add',
  });

  return list;
};

export const DateCapsulePicker: React.FC<DateCapsulePickerProps> = ({
  dates,
  selectedId,
  onSelectDate,
  onAddDate,
}) => {
  const { theme } = useTheme();
  // Use real-time dates if none provided
  const activeDates = dates && dates.length > 0 ? dates : generateRealtimeDates();

  const handlePress = (item: DateItem) => {
    playSpinnerTickSound(850);
    if (item.isDashed) {
      if (onAddDate) onAddDate();
      else onSelectDate(item);
    } else {
      onSelectDate(item);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="always"
        contentContainerStyle={styles.container}
      >
        {activeDates.map((item) => {
          const isSelected = selectedId === item.day;

          if (item.isDashed) {
            return (
              <View key={item.id} style={styles.capsuleWrapper}>
                <TouchableOpacity
                  style={styles.dashedCapsule}
                  onPress={() => handlePress(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={theme.primaryLight} />
                  <Text style={styles.dashedDayText}>{item.day}</Text>
                  <Text style={styles.dashedMonthText}>{item.month}</Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View key={item.id} style={styles.capsuleWrapper}>
              {/* Concentric aura glow for selected date capsule */}
              {isSelected && (
                <>
                  <View style={[styles.pillAuraOuter, { backgroundColor: theme.primaryMuted }]} pointerEvents="none" />
                  <View style={[styles.pillAuraMid, { backgroundColor: theme.primaryMuted }]} pointerEvents="none" />
                  <View style={[styles.pillAuraInner, { backgroundColor: theme.primaryGlow }]} pointerEvents="none" />
                </>
              )}
              <TouchableOpacity
                style={[
                  styles.capsule,
                  isSelected
                    ? [styles.capsuleSelected, { backgroundColor: theme.primary, shadowColor: theme.primary }]
                    : styles.capsuleNormal,
                ]}
                onPress={() => handlePress(item)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.monthBadgeText,
                    isSelected && styles.monthBadgeTextSelected,
                  ]}
                >
                  {item.month.toUpperCase()}
                </Text>

                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {item.day}
                </Text>

                <Text
                  style={[
                    styles.weekdayText,
                    isSelected && styles.weekdayTextSelected,
                  ]}
                >
                  {item.weekday || 'Day'}
                </Text>

                {isSelected && <View style={styles.selectedIndicatorDot} />}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.xxs,
  },
  container: {
    paddingHorizontal: padding.screenHorizontal,
    paddingVertical: spacing.md,
    gap: spacing.md + 2,
    alignItems: 'center',
  },
  capsuleWrapper: {
    width: 54,
    height: 104,
    position: 'relative',
    ...commonStyles.center,
    overflow: 'visible',
  },
  capsule: {
    width: 54,
    height: 104,
    borderRadius: 27,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg - 2,
    zIndex: 2,
  },
  capsuleNormal: {
    backgroundColor: 'rgba(16, 16, 26, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  capsuleSelected: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  // Pure geometric pill aura layers in electric violet
  pillAuraInner: {
    position: 'absolute',
    top: -2.5,
    bottom: -2.5,
    left: -2.5,
    right: -2.5,
    borderRadius: 29.5,
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    zIndex: 1,
  },
  pillAuraMid: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    left: -6,
    right: -6,
    borderRadius: 33,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    zIndex: 0,
  },
  pillAuraOuter: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: -10,
    right: -10,
    borderRadius: 37,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    zIndex: -1,
  },
  selectedIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  dashedCapsule: {
    width: 54,
    height: 104,
    borderRadius: 27,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg - 2,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(16, 16, 26, 0.4)',
  },
  monthBadgeText: {
    color: '#7E7E94',
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.6,
  },
  monthBadgeTextSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: fontWeights.heavy,
  },
  dayText: {
    color: colors.textPrimary,
    fontSize: fontSizes.titleSm,
    fontWeight: fontWeights.heavy,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: fontSizes.titleMd,
  },
  weekdayText: {
    color: '#6C6C82',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  weekdayTextSelected: {
    color: '#FFFFFF',
    fontWeight: fontWeights.bold,
  },
  dashedDayText: {
    color: '#9E9EB4',
    fontSize: fontSizes.subtitle,
    fontWeight: fontWeights.bold,
  },
  dashedMonthText: {
    color: '#6C6C82',
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
  },
});
