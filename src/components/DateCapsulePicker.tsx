import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, padding, radius, fontSizes, fontWeights, commonStyles } from '../theme';
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
                  <Ionicons name="add" size={16} color="#787884" />
                  <Text style={styles.dashedDayText}>{item.day}</Text>
                  <Text style={styles.dashedMonthText}>{item.month}</Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View key={item.id} style={styles.capsuleWrapper}>
              {/* Concentric pill aura rings that strictly follow the exact pill shape of the button */}
              {isSelected && (
                <>
                  <View style={styles.pillAuraOuter} pointerEvents="none" />
                  <View style={styles.pillAuraMid} pointerEvents="none" />
                  <View style={styles.pillAuraInner} pointerEvents="none" />
                </>
              )}
              <TouchableOpacity
                style={[
                  styles.capsule,
                  isSelected ? styles.capsuleSelected : styles.capsuleNormal,
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
    marginVertical: spacing.xs,
  },
  container: {
    paddingHorizontal: padding.screenHorizontal,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
  },
  capsuleWrapper: {
    width: 54,
    height: 102,
    position: 'relative',
    ...commonStyles.center,
    overflow: 'visible',
  },
  capsule: {
    width: 54,
    height: 102,
    borderRadius: 27,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    zIndex: 2,
  },
  capsuleNormal: {
    backgroundColor: '#1E1E22',
    borderWidth: 1,
    borderColor: '#2A2A32',
  },
  // Zero rectangular box-shadow or blur: pure clean pill button
  capsuleSelected: {
    backgroundColor: colors.primary,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Pure geometric pill aura layers: exact width / 2 border radii
  pillAuraInner: {
    position: 'absolute',
    top: -2.5,
    bottom: -2.5,
    left: -2.5,
    right: -2.5,
    borderRadius: 29.5,
    backgroundColor: 'rgba(248, 168, 120, 0.32)',
    zIndex: 1,
  },
  pillAuraMid: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    left: -6,
    right: -6,
    borderRadius: 33,
    backgroundColor: 'rgba(248, 168, 120, 0.16)',
    zIndex: 0,
  },
  pillAuraOuter: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: -10,
    right: -10,
    borderRadius: 37,
    backgroundColor: 'rgba(248, 168, 120, 0.07)',
    zIndex: -1,
  },
  dashedCapsule: {
    width: 54,
    height: 102,
    borderRadius: 27,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#3D3D48',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(28, 28, 34, 0.4)',
  },
  monthBadgeText: {
    color: '#828290',
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  monthBadgeTextSelected: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
  dayText: {
    color: colors.textPrimary,
    fontSize: fontSizes.titleSm,
    fontWeight: fontWeights.heavy,
  },
  dayTextSelected: {
    color: '#151518',
    fontWeight: '900',
    fontSize: fontSizes.titleMd,
  },
  weekdayText: {
    color: '#767682',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  weekdayTextSelected: {
    color: '#151518',
    fontWeight: fontWeights.bold,
  },
  dashedDayText: {
    color: '#8A8A96',
    fontSize: fontSizes.subtitle,
    fontWeight: fontWeights.bold,
  },
  dashedMonthText: {
    color: '#6A6A76',
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
  },
});
