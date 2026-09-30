import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Priority } from '../../types/task';
import { colors } from '../../theme/colors';
import { playSpinnerTickSound } from '../../services/soundEffects';

export interface PriorityOption {
  key: Priority;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { key: 'urgent', label: 'Urgent', color: '#EF4444', icon: 'flame' },
  { key: 'high', label: 'High', color: '#F97316', icon: 'alert-circle' },
  { key: 'medium', label: 'Medium', color: '#F8A878', icon: 'time' },
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
                { borderColor: isSelected ? item.color : colors.cardBorder },
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
                backgroundColor: item.color,
                borderColor: item.color,
              },
            ]}
            onPress={() => handleSelect(item.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={item.icon}
              size={14}
              color={isSelected ? '#151518' : item.color}
              style={styles.rowIcon}
            />
            <Text
              style={[
                styles.rowText,
                { color: isSelected ? '#151518' : item.color },
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
    gap: 8,
  },
  rowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#181822',
    borderWidth: 1,
    borderColor: '#262636',
  },
  rowIcon: {
    marginRight: 5,
  },
  rowText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowTextActive: {
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#161620',
    borderWidth: 1,
  },
  pillIcon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    fontWeight: '800',
  },
});
