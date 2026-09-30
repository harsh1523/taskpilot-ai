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
import { colors } from '../theme/colors';
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
  const priorityInfo = colors.priorities[task.priority] || colors.priorities.medium;
  const categoryColor = colors.categories[task.category] || colors.primary;
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

  return (
    <View style={styles.swipeContainer}>
      {/* Background Delete Action revealed on swipe left */}
      <View style={styles.swipeBackground}>
        <TouchableOpacity
          style={styles.swipeDeleteAction}
          onPress={triggerDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

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
                task.isCompleted && styles.checkboxChecked,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              {task.isCompleted ? (
                <Ionicons name="checkmark" size={13} color="#0D0D11" />
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
                  <Ionicons name="time-outline" size={11} color={colors.primary} />
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
                  { backgroundColor: `${priorityInfo.color}18`, borderColor: `${priorityInfo.color}40` },
                ]}
              >
                <Text style={[styles.priorityBadgeText, { color: priorityInfo.color }]}>
                  {priorityInfo.label}
                </Text>
              </View>

              {/* Voice badge */}
              {task.createdVia === 'voice' && (
                <View style={styles.voiceBadge}>
                  <Ionicons name="mic" size={10} color={colors.primary} />
                  <Text style={styles.voiceText}>Voice</Text>
                </View>
              )}
            </View>
          </View>

          {/* Delete Action button (triggers Mac trash sound too) */}
          <TouchableOpacity
            onPress={triggerDelete}
            style={styles.deleteBtn}
            activeOpacity={0.6}
            accessibilityLabel="Delete task"
          >
            <Ionicons name="trash-outline" size={16} color="#646476" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#DC2626',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  swipeDeleteAction: {
    width: 78,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: '#15151C',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22222E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCompleted: {
    backgroundColor: '#121217',
    borderColor: '#1C1C24',
    opacity: 0.65,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouch: {
    paddingTop: 2,
    paddingRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: '#4A4A5A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F0F0F8',
    lineHeight: 20,
    marginBottom: 4,
  },
  titleCompleted: {
    color: '#6E6E7E',
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 12,
    color: '#848494',
    lineHeight: 17,
    marginBottom: 8,
  },
  descriptionCompleted: {
    color: '#555562',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D1D26',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#282836',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    color: '#A0A0B0',
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 168, 120, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  voiceText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
});
