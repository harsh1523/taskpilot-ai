import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { playSpinnerTickSound } from '../services/soundEffects';

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

  // Format real-time Date: Weekday, Day Month Year (e.g., "Mon, 28 Sep 2026")
  const weekday = currentDateTime.toLocaleDateString('en-US', { weekday: 'short' });
  const day = currentDateTime.toLocaleDateString('en-US', { day: '2-digit' });
  const month = currentDateTime.toLocaleDateString('en-US', { month: 'short' });
  const year = currentDateTime.getFullYear();
  const formattedDate = `${weekday}, ${day} ${month} ${year}`;

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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  realtimeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262636',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262636',
  },
  pillIcon: {
    marginRight: 6,
  },
  liveClockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  dateText: {
    color: '#D4D4E0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleRow: {
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#E8E8EE',
    letterSpacing: -0.5,
  },
  boldTitle: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#14141A',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: '#22222E',
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 13,
    gap: 6,
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
    fontSize: 13,
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#1A1A22',
  },
  countBadgeActive: {
    backgroundColor: colors.primary,
  },
  countBadgeText: {
    color: '#6E6E7E',
    fontSize: 10,
    fontWeight: '700',
  },
  countBadgeTextActive: {
    color: '#151518',
    fontWeight: '800',
  },
});
