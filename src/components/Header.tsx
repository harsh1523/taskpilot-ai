import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, padding, radius, fontSizes, fontWeights, commonStyles, useTheme } from '../theme';
import { playSpinnerTickSound } from '../services/soundEffects';
import { formatDateLabel } from '../utils/scheduleUtils';
import { TaskPilotBrand } from './common/TaskPilotBrand';

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
  const { theme, cycleTheme } = useTheme();
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

  const activeTabStyle = {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
  };

  return (
    <View style={styles.container}>
      {/* Real-time Status Bar (Date and Live Ticking Time with Gen UI frosted capsules) */}
      <View style={styles.realtimeBar}>
        {/* Date Month Year Pill */}
        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={13} color={theme.primaryLight} style={styles.pillIcon} />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Real-Time Clock Pill with live pulsing neon emerald dot */}
        <View style={styles.timePill}>
          <View style={styles.liveClockDot} />
          <Ionicons name="time-outline" size={13} color={theme.cyan || colors.cyan} style={styles.pillIcon} />
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
      </View>

      {/* Main App Title */}
      <View style={styles.titleRow}>
        <View style={styles.titleAuraContainer}>
          <View style={styles.brandTitleGroup}>
            <TaskPilotBrand variant="icon" size={38} showGlow animated />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.title}>
                TaskPilot <Text style={[styles.boldTitle, { color: theme.primaryLight }]}>AI</Text>
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.genUiBadge, { borderColor: `${theme.primary}50`, backgroundColor: theme.primaryMuted }]}
            onPress={() => {
              playSpinnerTickSound(1050);
              cycleTheme();
            }}
            activeOpacity={0.75}
            accessibilityLabel={`Theme: ${theme.name}. Tap to change theme.`}
          >
            <Ionicons name="sparkles" size={10} color={theme.primaryLight} style={{ marginRight: 4 }} />
            <Text style={[styles.genUiBadgeText, { color: theme.primaryLight }]}>{theme.name.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Frosted Glass Segmented Filter Bar */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentTab, activeFilter === 'all' && [styles.segmentTabActive, activeTabStyle]]}
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
          style={[styles.segmentTab, activeFilter === 'pending' && [styles.segmentTabActive, activeTabStyle]]}
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
          style={[styles.segmentTab, activeFilter === 'completed' && [styles.segmentTabActive, activeTabStyle]]}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
  },
  realtimeBar: {
    ...commonStyles.rowBetween,
    marginBottom: spacing.md,
  },
  datePill: {
    ...commonStyles.row,
    backgroundColor: 'rgba(18, 18, 28, 0.75)',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timePill: {
    ...commonStyles.row,
    backgroundColor: 'rgba(18, 18, 28, 0.75)',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillIcon: {
    marginRight: spacing.xs + 2,
  },
  liveClockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: spacing.xs + 2,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  dateText: {
    color: '#D4D4E8',
    fontSize: fontSizes.sm - 0.5,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.2,
  },
  timeText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm - 0.5,
    fontWeight: fontWeights.heavy,
    letterSpacing: 0.4,
  },
  titleRow: {
    marginBottom: spacing.lg,
  },
  titleAuraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.headline,
    fontWeight: '300',
    color: '#DCDCE8',
    letterSpacing: -0.6,
  },
  boldTitle: {
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
  },
  genUiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  genUiBadgeText: {
    color: '#C4B5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 16, 26, 0.85)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 3,
  },
  segmentTab: {
    ...commonStyles.flex1,
    ...commonStyles.rowCenter,
    paddingVertical: spacing.md - 1,
    borderRadius: 16,
    gap: spacing.sm,
  },
  segmentTabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentLabel: {
    color: '#828298',
    fontSize: fontSizes.md - 1,
    fontWeight: fontWeights.semibold,
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: fontWeights.heavy,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  countBadgeText: {
    color: '#727288',
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeights.heavy,
  },
});
