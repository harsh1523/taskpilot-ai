import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types/task';
import { colors, spacing, radius, fontSizes, fontWeights, commonStyles, useTheme } from '../theme';
import { playSpinnerTickSound, playMacTrashSound } from '../services/soundEffects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onDelete,
}) => {
  const { theme } = useTheme();
  const priorityInfo = colors.priorities[task.priority] || colors.priorities.medium;
  const categoryColor = colors.categories[task.category] || theme.primary;
  const checkScale = useRef(new Animated.Value(1)).current;

  // Swipe animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const isDeletingRef = useRef(false);

  const handleToggle = () => {
    const nextState = !task.isCompleted;
    playSpinnerTickSound(nextState ? 1050 : 750);
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 1.3, duration: 90, useNativeDriver: true }),
      Animated.timing(checkScale, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start();

    onToggleComplete(task.id);
  };

  // Trigger Mac Trash sound effect and smooth swipe-out removal
  const triggerDelete = () => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;

    // Authentic macOS Trash crumple & paper swoosh sound
    playMacTrashSound();

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(itemOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDelete(task.id);
    });
  };

  // PanResponder to handle swiping card to the left
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Activate horizontal swipe only when swiping left
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Swiping left: move card smoothly with slight drag resistance past -120px
          const drag = gestureState.dx < -120
            ? -120 + (gestureState.dx + 120) * 0.5
            : gestureState.dx;
          translateX.setValue(drag);
        } else {
          // Slight resistance if pulled right
          translateX.setValue(gestureState.dx * 0.15);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -110) {
          // Swiped past threshold: execute delete with Mac trash sound
          triggerDelete();
        } else if (gestureState.dx < -45) {
          // Partial swipe: snap open to reveal the red Delete button
          Animated.spring(translateX, {
            toValue: -78,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        } else {
          // Snap back closed
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const swipeBgOpacity = translateX.interpolate({
    inputRange: [-78, -15, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  const inlineDeleteOpacity = translateX.interpolate({
    inputRange: [-35, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.swipeContainer}>
      {/* Background Delete Action revealed only on swipe left */}
      <Animated.View style={[styles.swipeBackground, { opacity: swipeBgOpacity }]}>
        <TouchableOpacity
          style={styles.swipeDeleteAction}
          onPress={triggerDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Foreground Card with Pan Handlers */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          task.isCompleted && styles.cardCompleted,
          {
            transform: [{ translateX }],
            opacity: itemOpacity,
          },
        ]}
      >
        <View style={styles.contentRow}>
          {/* Checkbox button */}
          <TouchableOpacity
            onPress={handleToggle}
            activeOpacity={0.7}
            style={styles.checkboxTouch}
          >
            <Animated.View
              style={[
                styles.checkbox,
                task.isCompleted && [
                  styles.checkboxChecked,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                    shadowColor: theme.primary,
                  },
                ],
                { transform: [{ scale: checkScale }] },
              ]}
            >
              {task.isCompleted ? (
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
              ) : null}
            </Animated.View>
          </TouchableOpacity>

          {/* Task Details */}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                task.isCompleted && styles.titleCompleted,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            {task.description ? (
              <Text
                style={[
                  styles.description,
                  task.isCompleted && styles.descriptionCompleted,
                ]}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            ) : null}

            {/* Badges / Metadata row */}
            <View style={styles.metaRow}>
              {/* Due Date & Time */}
              {task.dueDate ? (
                <View style={styles.badge}>
                  <Ionicons name="time-outline" size={11} color={colors.cyan} />
                  <Text style={styles.badgeText}>{task.dueDate}</Text>
                </View>
              ) : null}

              {/* Category */}
              <View style={styles.badge}>
                <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                <Text style={styles.badgeText}>{task.category}</Text>
              </View>

              {/* Priority */}
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: `${priorityInfo.color}15`, borderColor: `${priorityInfo.color}35` },
                ]}
              >
                <Text style={[styles.priorityBadgeText, { color: priorityInfo.color }]}>
                  {priorityInfo.label}
                </Text>
              </View>

              {/* Voice badge */}
              {task.createdVia === 'voice' && (
                <View style={styles.voiceBadge}>
                  <Ionicons name="sparkles" size={10} color={theme.primaryLight} />
                  <Text style={styles.voiceText}>AI Voice</Text>
                </View>
              )}
            </View>
          </View>

          {/* Delete Action button (fades out as swipe opens to prevent double exposure) */}
          <Animated.View style={{ opacity: inlineDeleteOpacity }}>
            <TouchableOpacity
              onPress={triggerDelete}
              style={styles.deleteBtn}
              activeOpacity={0.6}
              accessibilityLabel="Delete task"
            >
              <Ionicons name="trash-outline" size={16} color="#6E6E82" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginBottom: spacing.md,
    borderRadius: 22,
    overflow: 'hidden',
  },
  swipeBackground: {
    ...commonStyles.absoluteFill,
    backgroundColor: '#DC2626',
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  swipeDeleteAction: {
    width: 78,
    height: '100%',
    ...commonStyles.center,
    gap: 3,
  },
  swipeDeleteText: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.heavy,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: '#12121A',
    borderRadius: 22,
    padding: spacing.lg + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  cardCompleted: {
    backgroundColor: '#0E0E16',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.65,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouch: {
    paddingTop: 2,
    paddingRight: spacing.md + 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...commonStyles.center,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  textContainer: {
    ...commonStyles.flex1,
  },
  title: {
    fontSize: fontSizes.lg - 0.5,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: spacing.xxs,
  },
  titleCompleted: {
    color: '#6E6E82',
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: fontSizes.sm,
    color: '#9494A8',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  descriptionCompleted: {
    color: '#4E4E60',
  },
  metaRow: {
    ...commonStyles.row,
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  badge: {
    ...commonStyles.row,
    backgroundColor: 'rgba(24, 24, 36, 0.75)',
    paddingHorizontal: spacing.md - 1,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    color: '#A8A8C0',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  priorityBadge: {
    paddingHorizontal: spacing.md - 1,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  voiceBadge: {
    ...commonStyles.row,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  voiceText: {
    color: colors.primaryLight,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  deleteBtn: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
});
