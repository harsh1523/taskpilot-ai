import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Priority } from '../../types/task';
import { colors, spacing, radius, fontSizes, fontWeights, commonStyles } from '../../theme';
import { playSpinnerTickSound } from '../../services/soundEffects';

export interface PriorityOption {
  key: Priority;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { key: 'urgent', label: 'Urgent', color: '#EF4444', icon: 'flame' },
  { key: 'high', label: 'High', color: '#FB923C', icon: 'alert-circle' },
  { key: 'medium', label: 'Medium', color: '#A78BFA', icon: 'time' },
  { key: 'low', label: 'Low', color: '#34D399', icon: 'leaf' },
];

interface PrioritySelectorProps {
  selectedPriority: Priority;
  onSelectPriority: (priority: Priority) => void;
  variant?: 'row' | 'grid' | 'pills';
  style?: StyleProp<ViewStyle>;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  selectedPriority,
  onSelectPriority,
  variant = 'row',
  style,
}) => {
  const handleSelect = (key: Priority) => {
    playSpinnerTickSound(key === 'urgent' ? 1100 : key === 'high' ? 1000 : 900);
    onSelectPriority(key);
  };

  if (variant === 'grid' || variant === 'pills') {
    return (
      <View style={[styles.gridContainer, style]}>
        {PRIORITY_OPTIONS.map((item) => {
          const isSelected = selectedPriority === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.pillButton,
                { borderColor: isSelected ? item.color : 'rgba(255, 255, 255, 0.08)' },
                isSelected && { backgroundColor: `${item.color}22` },
              ]}
              onPress={() => handleSelect(item.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon}
                size={15}
                color={item.color}
                style={styles.pillIcon}
              />
              <Text
                style={[
                  styles.pillText,
                  { color: isSelected ? item.color : colors.textSecondary },
                  isSelected && styles.pillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.rowContainer, style]}>
      {PRIORITY_OPTIONS.map((item) => {
        const isSelected = selectedPriority === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.rowButton,
              isSelected && {
                backgroundColor: `${item.color}22`,
                borderColor: item.color,
                shadowColor: item.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
              },
            ]}
            onPress={() => handleSelect(item.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={item.icon}
              size={14}
              color={item.color}
              style={styles.rowIcon}
            />
            <Text
              style={[
                styles.rowText,
                { color: isSelected ? '#FFFFFF' : '#8A8A9E' },
                isSelected && styles.rowTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowButton: {
    ...commonStyles.flex1,
    ...commonStyles.rowCenter,
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 18, 28, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowIcon: {
    marginRight: spacing.xs,
  },
  rowText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  rowTextActive: {
    fontWeight: fontWeights.heavy,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pillButton: {
    ...commonStyles.row,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xxl,
    backgroundColor: 'rgba(18, 18, 28, 0.75)',
    borderWidth: 1,
  },
  pillIcon: {
    marginRight: spacing.sm,
  },
  pillText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  pillTextActive: {
    fontWeight: fontWeights.heavy,
  },
});
