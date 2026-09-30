import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, padding, radius, fontSizes, fontWeights, commonStyles } from '../theme';
import { playSpinnerTickSound } from '../services/soundEffects';
import { formatDateLabel } from '../utils/scheduleUtils';

interface HeaderProps {
  totalCount: number;
  pendingCount: number;
  completedCount: number;
  activeFilter?: 'all' | 'pending' | 'completed';
  onSelectFilter?: (filter: 'all' | 'pending' | 'completed') => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  pendingCount,
  completedCount,
  activeFilter = 'all',
  onSelectFilter,
}) => {
  // Real-time clock and calendar that ticks every second
  const [currentDateTime, setCurrentDateTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time Date using centralized date utility
  const formattedDate = formatDateLabel(currentDateTime, true);

  // Format real-time Time with live ticking seconds (e.g., "05:48:22 PM")
  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const handleFilterPress = (filter: 'all' | 'pending' | 'completed') => {
    playSpinnerTickSound(850);
    if (onSelectFilter) {
      onSelectFilter(filter);
    }
  };

  return (
    <View style={styles.container}>
      {/* Real-time Status Bar (Date, Month, Year, and Live Ticking Time Only) */}
      <View style={styles.realtimeBar}>
        {/* Date Month Year Pill */}
        <View style={styles.datePill}>
          <Ionicons name="calendar" size={13} color={colors.primary} style={styles.pillIcon} />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Real-Time Clock Pill with live pulsing green dot */}
        <View style={styles.timePill}>
          <View style={styles.liveClockDot} />
          <Ionicons name="time" size={13} color={colors.primary} style={styles.pillIcon} />
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
      </View>

      {/* Main App Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          Smart <Text style={styles.boldTitle}>Tasks</Text>
        </Text>
      </View>

      {/* Apple-Style Segmented Filter Bar */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentTab, activeFilter === 'all' && styles.segmentTabActive]}
          onPress={() => handleFilterPress('all')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentLabel, activeFilter === 'all' && styles.segmentLabelActive]}>
            All
          </Text>
          <View style={[styles.countBadge, activeFilter === 'all' && styles.countBadgeActive]}>
            <Text style={[styles.countBadgeText, activeFilter === 'all' && styles.countBadgeTextActive]}>
              {totalCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeFilter === 'pending' && styles.segmentTabActive]}
          onPress={() => handleFilterPress('pending')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentLabel, activeFilter === 'pending' && styles.segmentLabelActive]}>
            Pending
          </Text>
          <View style={[styles.countBadge, activeFilter === 'pending' && styles.countBadgeActive]}>
            <Text style={[styles.countBadgeText, activeFilter === 'pending' && styles.countBadgeTextActive]}>
              {pendingCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeFilter === 'completed' && styles.segmentTabActive]}
          onPress={() => handleFilterPress('completed')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentLabel, activeFilter === 'completed' && styles.segmentLabelActive]}>
            Completed
          </Text>
          <View style={[styles.countBadge, activeFilter === 'completed' && styles.countBadgeActive]}>
            <Text style={[styles.countBadgeText, activeFilter === 'completed' && styles.countBadgeTextActive]}>
              {completedCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: padding.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  realtimeBar: {
    ...commonStyles.rowBetween,
    marginBottom: spacing.base,
  },
  datePill: {
    ...commonStyles.row,
    backgroundColor: '#16161E',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: '#262636',
  },
  timePill: {
    ...commonStyles.row,
    backgroundColor: '#16161E',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: '#262636',
  },
  pillIcon: {
    marginRight: spacing.sm,
  },
  liveClockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  dateText: {
    color: '#D4D4E0',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  timeText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.heavy,
    letterSpacing: 0.5,
  },
  titleRow: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.headline,
    fontWeight: '300',
    color: '#E8E8EE',
    letterSpacing: -0.5,
  },
  boldTitle: {
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  segmentTab: {
    ...commonStyles.flex1,
    ...commonStyles.rowCenter,
    paddingVertical: spacing.md,
    borderRadius: radius.md + 5,
    gap: spacing.sm,
  },
  segmentTabActive: {
    backgroundColor: '#20202A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentLabel: {
    color: '#767686',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
  segmentLabelActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.heavy,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: '#1A1A22',
  },
  countBadgeActive: {
    backgroundColor: colors.primary,
  },
  countBadgeText: {
    color: '#6E6E7E',
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  countBadgeTextActive: {
    color: '#151518',
    fontWeight: fontWeights.heavy,
  },
});
