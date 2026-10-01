import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Switch,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, useTheme } from '../theme';
import { Priority, Task } from '../types/task';
import { playSpinnerTickSound, speakWithTechna } from '../services/soundEffects';
import { parseVoiceToTaskForm } from '../services/voiceParser';
import { TechnaDisplayBorderGlow } from './TechnaDisplayBorderGlow';
import { voiceRecognition } from '../services/voiceRecognition';
import {
  computeTimeRange,
  getOccupiedSchedule,
  checkSlotConflict,
  isSameDay,
  parseTimeString,
} from '../utils/scheduleUtils';

import { CircleIconButton } from './common/CircleIconButton';
import { PrioritySelector } from './common/PrioritySelector';
import { CalendarPickerView } from './common/CalendarPickerView';
import { TimeSlotPicker } from './common/TimeSlotPicker';

interface CreateTaskScreenProps {
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => void;
  initialVoiceActive?: boolean;
  existingTasks?: Task[];
  onShiftTask?: (taskId: string, newDueDate: string) => Promise<void> | void;
}

export interface RepeatOptionItem {
  id: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const REPEAT_LIST_OPTIONS: RepeatOptionItem[] = [
  { id: 'none', label: 'None', subtitle: 'Does not repeat', icon: 'close-circle-outline' },
  { id: 'daily', label: 'Daily', subtitle: 'Repeats every day at this time', icon: 'today-outline' },
  { id: 'weekdays', label: 'Weekdays (Mon - Fri)', subtitle: 'Repeats on business days only', icon: 'briefcase-outline' },
  { id: 'weekly', label: 'Weekly on Monday', subtitle: 'Repeats once every week', icon: 'calendar-outline' },
  { id: 'biweekly', label: 'Every 2 Weeks', subtitle: 'Repeats every other week', icon: 'calendar-number-outline' },
  { id: 'monthly', label: 'Monthly', subtitle: 'Repeats on the same date each month', icon: 'repeat-outline' },
];

const sampleVoicePhrases = [
  'Client feedback due date tomorrow at 6 PM high priority at office',
  'Morning team meeting due date Friday at 9 AM urgent',
  'Review quarterly budget due date 5th September at 4 PM',
  'Gym workout due date tomorrow at 7 PM',
  'Submit design roadmap due date next Monday 10 AM',
];

export const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({
  onClose,
  onSave,
  initialVoiceActive = false,
  existingTasks = [],
  onShiftTask,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [priority, setPriority] = useState<Priority>('high');

  // Calendar State
  const now = new Date();
  const [selectedDateObj, setSelectedDateObj] = useState(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Time & Duration State
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // 60 mins default
  const [selectedStartHour, setSelectedStartHour] = useState<number>(18); // 6:00 PM default
  const [selectedTime, setSelectedTime] = useState<string>('06:00 PM - 07:00 PM');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Notification and Repeat State with List Display
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [repeatIndex, setRepeatIndex] = useState(0);
  const [showRepeatList, setShowRepeatList] = useState(false);
  const [selectedRepeatId, setSelectedRepeatId] = useState('none');

  // Voice Auto-Fill State (unified with manual entry)
  const [isListening, setIsListening] = useState(initialVoiceActive ?? false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [autoFillNotice, setAutoFillNotice] = useState('');

  // Animated sound waves & pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundWave1 = useRef(new Animated.Value(10)).current;
  const soundWave2 = useRef(new Animated.Value(18)).current;
  const soundWave3 = useRef(new Animated.Value(14)).current;
  const soundWave4 = useRef(new Animated.Value(22)).current;

  // Soundwave animation loop
  useEffect(() => {
    let waveLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (isListening) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      waveLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(soundWave1, { toValue: 26, duration: 250, useNativeDriver: false }),
            Animated.timing(soundWave1, { toValue: 8, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(soundWave2, { toValue: 32, duration: 210, useNativeDriver: false }),
            Animated.timing(soundWave2, { toValue: 12, duration: 210, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(soundWave3, { toValue: 28, duration: 290, useNativeDriver: false }),
            Animated.timing(soundWave3, { toValue: 9, duration: 290, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(soundWave4, { toValue: 24, duration: 230, useNativeDriver: false }),
            Animated.timing(soundWave4, { toValue: 11, duration: 230, useNativeDriver: false }),
          ]),
        ])
      );
      waveLoop.start();
    } else {
      pulseAnim.setValue(1);
      soundWave1.setValue(10);
      soundWave2.setValue(18);
      soundWave3.setValue(14);
      soundWave4.setValue(22);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
      if (waveLoop) waveLoop.stop();
    };
  }, [isListening]);

  // Voice listening toggle
  useEffect(() => {
    if (isListening) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
    return () => {
      stopSpeechRecognition();
    };
  }, [isListening]);

  const startSpeechRecognition = async () => {
    setLiveTranscript('');
    setAutoFillNotice('');

    speakWithTechna("I'm listening. Tell me your task details.");

    await voiceRecognition.start({
      onStart: () => {
        setIsListening(true);
      },
      onTranscript: (transcript: string, isFinal: boolean) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          applyVoiceAutoFill(transcript);
          setIsListening(false);
          voiceRecognition.stop();
        }
      },
      onError: (err: string) => {
        setAutoFillNotice(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const stopSpeechRecognition = () => {
    voiceRecognition.stop();
    setIsListening(false);
  };

  const toggleVoiceListening = () => {
    playSpinnerTickSound(isListening ? 700 : 1000);
    setIsListening((prev) => !prev);
  };

  // Auto-Fill all fields from spoken text without pronouncing buttons
  const applyVoiceAutoFill = (spokenText: string) => {
    setLiveTranscript(spokenText);
    const parsed = parseVoiceToTaskForm(spokenText);
    let autoFilledCount = 0;
    const filledNames: string[] = [];

    if (parsed.title) {
      setTaskTitle(parsed.title);
      autoFilledCount++;
      filledNames.push('Title');
    }
    if (parsed.description) {
      setTaskDescription(parsed.description);
      autoFilledCount++;
      filledNames.push('Notes');
    }
    if (parsed.location) {
      setLocation(parsed.location);
      autoFilledCount++;
      filledNames.push('Location');
    }
    if (parsed.meetingLink) {
      setMeetingLink(parsed.meetingLink);
      autoFilledCount++;
      filledNames.push('Link');
    }
    if (parsed.priority) {
      setPriority(parsed.priority);
      autoFilledCount++;
      filledNames.push(`${parsed.priority.toUpperCase()} priority`);
    }
    if (parsed.dateLabel) {
      setSelectedDate(parsed.dateLabel);
      if (parsed.dateObj) {
        setSelectedDateObj(parsed.dateObj);
      }
      autoFilledCount++;
      filledNames.push(`Due: ${parsed.dateLabel}`);
    }
    if (parsed.timeLabel) {
      const parsedTime = parseTimeString(parsed.timeLabel);
      if (parsedTime) {
        setSelectedStartHour(parsedTime.hour);
        const range = computeTimeRange(parsedTime.hour, selectedDuration);
        setSelectedTime(range.rangeString);
        autoFilledCount++;
        filledNames.push(range.rangeString);
      } else {
        setSelectedTime(parsed.timeLabel);
        autoFilledCount++;
        filledNames.push(parsed.timeLabel);
      }
    }
    if (parsed.notificationEnabled !== undefined) {
      setNotificationEnabled(parsed.notificationEnabled);
      autoFilledCount++;
      filledNames.push('Notification');
    }
    if (parsed.repeatIndex !== undefined) {
      setRepeatIndex(parsed.repeatIndex);
      const repItem = REPEAT_LIST_OPTIONS[parsed.repeatIndex] || REPEAT_LIST_OPTIONS[0];
      setSelectedRepeatId(repItem.id);
      autoFilledCount++;
      filledNames.push(`Repeat: ${repItem.label}`);
    }

    if (autoFilledCount > 0) {
      playSpinnerTickSound(1100);
      setAutoFillNotice(`✨ Auto-filled: ${filledNames.join(' • ')}`);
      speakWithTechna(`Auto-filled ${parsed.title || 'task'}.`);
    }
  };

  const cycleRepeat = () => {
    playSpinnerTickSound(800);
    const nextIdx = (repeatIndex + 1) % REPEAT_LIST_OPTIONS.length;
    setRepeatIndex(nextIdx);
    setSelectedRepeatId(REPEAT_LIST_OPTIONS[nextIdx].id);
  };

  const handleSelectPriority = (p: Priority) => {
    playSpinnerTickSound(900);
    setPriority(p);
  };

  // Occupied schedule slots powered by scheduleUtils
  const occupiedSchedule = useMemo(() => {
    return getOccupiedSchedule(existingTasks, selectedDate);
  }, [existingTasks, selectedDate]);

  const handleSave = () => {
    const trimmed = taskTitle.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a task name.');
      return;
    }

    playSpinnerTickSound(1100);

    let fullDescription = taskDescription.trim();
    if (location.trim()) {
      fullDescription += (fullDescription ? '\n' : '') + `📍 ${location.trim()}`;
    }
    if (meetingLink.trim()) {
      fullDescription += (fullDescription ? '\n' : '') + `🔗 ${meetingLink.trim()}`;
    }

    const dueDateFormatted = `${selectedDate} • ${selectedTime}`;

    onSave({
      title: trimmed,
      description: fullDescription || `Scheduled for ${selectedDate} at ${selectedTime}`,
      category: 'Work',
      priority,
      dueDate: dueDateFormatted,
      createdVia: liveTranscript ? 'voice' : 'manual',
      voiceTranscription: liveTranscript || undefined,
    });

    onClose();
  };

  const topPadding = Math.max(insets.top, 14);
  const bottomPadding = Math.max(insets.bottom, 20);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Apple Intelligence Techna Display Border Glow when mic is active */}
      <TechnaDisplayBorderGlow active={isListening} />

      {/* Top Ambient Aurora Glow */}
      <LinearGradient
        colors={theme.gradients.ambient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Navigation Bar */}
        <View style={[styles.navBar, { paddingTop: topPadding }]}>
          <CircleIconButton
            icon="close"
            size={44}
            iconSize={20}
            color="#FFFFFF"
            backgroundColor="rgba(24, 24, 36, 0.8)"
            onPress={onClose}
          />

          {/* Techna Voice Mode Toggle Pill in Center */}
          <TouchableOpacity
            style={[
              styles.technaPillBtn,
              isListening && [styles.technaPillBtnActive, { borderColor: theme.primary, backgroundColor: theme.primaryMuted }],
            ]}
            onPress={toggleVoiceListening}
            activeOpacity={0.8}
          >
            <View style={[styles.technaDot, isListening && [styles.technaDotActive, { backgroundColor: theme.primary }]]} />
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={15}
              color={isListening ? theme.primaryLight : '#A0A0B0'}
            />
            <Text style={[styles.technaPillText, isListening && [styles.technaPillTextActive, { color: theme.primaryLight }]]}>
              {isListening ? 'Listening...' : 'Voice Auto-Fill'}
            </Text>
          </TouchableOpacity>

          {/* Top Save Task Button */}
          <TouchableOpacity
            style={[styles.navSaveBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
            accessibilityLabel="Save task"
          >
            <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={styles.navSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Form Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          scrollEventThrottle={16}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 30 }]}
        >
          {/* Title Header Group */}
          <View style={styles.titleSection}>
            <Text style={styles.screenHeading}>New task</Text>
            <Text style={styles.screenSubheading}>Add details manually or tap mic to speak</Text>
          </View>

          {/* Auto-filled status toast if voice input occurred */}
          {autoFillNotice.length > 0 && (
            <View style={styles.noticeCapsule}>
              <Ionicons name="sparkles" size={13} color="#F8A878" style={{ marginRight: 6 }} />
              <Text style={styles.noticeText}>{autoFillNotice}</Text>
            </View>
          )}

          {/* ================= CARD 1: Task Title & Description ================= */}
          <View style={styles.card}>
            <View style={styles.titleInputRow}>
              <TextInput
                style={styles.titleTextInput}
                placeholder="Task title"
                placeholderTextColor="#6C6C78"
                value={taskTitle}
                onChangeText={setTaskTitle}
                returnKeyType="next"
              />
              {taskTitle.length > 0 && (
                <TouchableOpacity onPress={() => setTaskTitle('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="#7A7A88" />
                </TouchableOpacity>
              )}
              {/* Mic button: Tap to speak & auto-fill */}
              <TouchableOpacity
                style={[styles.inputMicBtn, isListening && styles.inputMicBtnActive]}
                onPress={toggleVoiceListening}
                activeOpacity={0.75}
                accessibilityLabel="Tap to speak task details"
              >
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={18}
                  color={isListening ? '#101014' : colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Inline Voice Feedback Box if user tapped mic */}
            {isListening && (
              <View style={styles.inlineListeningBox}>
                <View style={styles.soundWaveRow}>
                  <Animated.View style={[styles.soundWaveBar, { height: soundWave1 }]} />
                  <Animated.View style={[styles.soundWaveBar, { height: soundWave2 }]} />
                  <Animated.View style={[styles.soundWaveBar, { height: soundWave3 }]} />
                  <Animated.View style={[styles.soundWaveBar, { height: soundWave4 }]} />
                  <Animated.View style={[styles.soundWaveBar, { height: soundWave2 }]} />
                </View>
                <View style={styles.inlineListeningTexts}>
                  <Text style={styles.inlineListeningTitle}>Listening... Speak your task</Text>
                  <Text style={styles.inlineListeningSub} numberOfLines={1}>
                    {liveTranscript || 'e.g., "Team meeting tomorrow at 10 AM"'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.hairlineDivider} />

            <TextInput
              style={styles.descTextInput}
              placeholder="Task description"
              placeholderTextColor="#5C5C68"
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* ================= CARD 2: Location & Meeting Link ================= */}
          <View style={styles.card}>
            <View style={styles.rowItem}>
              <Ionicons name="location-outline" size={18} color="#60A5FA" style={styles.rowIcon} />
              <TextInput
                style={styles.rowInput}
                placeholder="Location"
                placeholderTextColor="#5C5C68"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.hairlineDivider} />

            <View style={styles.rowItem}>
              <Ionicons name="link-outline" size={18} color="#A78BFA" style={styles.rowIcon} />
              <TextInput
                style={styles.rowInput}
                placeholder="Meeting link"
                placeholderTextColor="#5C5C68"
                value={meetingLink}
                onChangeText={setMeetingLink}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* ================= CARD 3: Select Priority ================= */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Select Priority</Text>
            <PrioritySelector
              selectedPriority={priority}
              onSelectPriority={setPriority}
              variant="row"
            />
          </View>

          {/* ================= CARD 4: Due Date, Time, Notification, Repeat ================= */}
          <View style={styles.card}>
            {/* Due Date Row (Tapping opens the full interactive Month Calendar) */}
            <TouchableOpacity
              style={styles.interactiveRow}
              onPress={() => {
                playSpinnerTickSound(800);
                setShowDatePicker(!showDatePicker);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.labelWithIcon}>
                <Ionicons name="calendar-outline" size={18} color="#FBBF24" style={styles.rowIcon} />
                <Text style={styles.rowLabelText}>Due date</Text>
              </View>
              <View style={[styles.pillBadge, showDatePicker && styles.pillBadgeActive]}>
                <Text style={styles.pillBadgeText}>{selectedDate}</Text>
                <Ionicons
                  name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={showDatePicker ? colors.primary : '#8E8E9E'}
                  style={{ marginLeft: 6 }}
                />
              </View>
            </TouchableOpacity>

            {/* ================= FULL INTERACTIVE CALENDAR ================= */}
            {showDatePicker && (
              <CalendarPickerView
                selectedDate={selectedDateObj}
                onSelectDate={(date, label) => {
                  setSelectedDateObj(date);
                  setSelectedDate(label);
                }}
              />
            )}

            <View style={styles.hairlineDivider} />

            {/* Time Row (Tapping opens the full 6:00 AM to 12:00 AM selector) */}
            <TouchableOpacity
              style={styles.interactiveRow}
              onPress={() => {
                playSpinnerTickSound(800);
                setShowTimePicker(!showTimePicker);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.labelWithIcon}>
                <Ionicons name="time-outline" size={18} color="#34D399" style={styles.rowIcon} />
                <Text style={styles.rowLabelText}>Time</Text>
              </View>
              <View style={[styles.pillBadge, showTimePicker && styles.pillBadgeActive]}>
                <Text style={styles.pillBadgeText}>{selectedTime}</Text>
                <Ionicons
                  name={showTimePicker ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={showTimePicker ? colors.primary : '#8E8E9E'}
                  style={{ marginLeft: 6 }}
                />
              </View>
            </TouchableOpacity>

            {/* ================= TIME PICKER WITH DURATION & AVAILABILITY ================= */}
            {showTimePicker && (
              <TimeSlotPicker
                selectedStartHour={selectedStartHour}
                selectedDuration={selectedDuration}
                occupiedSchedule={occupiedSchedule}
                onSelectSlot={(slot) => {
                  playSpinnerTickSound(slot.isOccupied ? 650 : 900);
                  setSelectedStartHour(slot.startHour);
                  setSelectedTime(slot.rangeString);
                }}
                onSelectDuration={(dur) => {
                  playSpinnerTickSound(850);
                  setSelectedDuration(dur);
                  setSelectedTime(computeTimeRange(selectedStartHour, dur).rangeString);
                }}
                onShiftOccupiedSlot={async (conflictingTaskId, newSlotRange, conflictingTaskTitle) => {
                  if (onShiftTask) {
                    const shiftedDueDate = `${selectedDate} • ${newSlotRange}`;
                    await onShiftTask(conflictingTaskId, shiftedDueDate);
                    playSpinnerTickSound(1150);
                    setAutoFillNotice(`🔄 Shifted "${conflictingTaskTitle}" to ${newSlotRange}`);
                    speakWithTechna(`Shifted ${conflictingTaskTitle} to ${newSlotRange}. Selected slot is now yours.`);
                  }
                }}
              />
            )}

            <View style={styles.hairlineDivider} />

            {/* Notification Switch Row */}
            <View style={styles.interactiveRow}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="notifications-outline" size={18} color="#F472B6" style={styles.rowIcon} />
                <Text style={styles.rowLabelText}>Notification</Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={(val) => {
                  playSpinnerTickSound(val ? 1000 : 700);
                  setNotificationEnabled(val);
                }}
                trackColor={{ false: '#262634', true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#262634"
              />
            </View>

            <View style={styles.hairlineDivider} />

            {/* Repeat Row (Tapping opens Repeat List in list form) */}
            <TouchableOpacity
              style={styles.interactiveRow}
              onPress={() => {
                playSpinnerTickSound(800);
                setShowRepeatList(!showRepeatList);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.labelWithIcon}>
                <Ionicons name="repeat-outline" size={18} color="#818CF8" style={styles.rowIcon} />
                <Text style={styles.rowLabelText}>Repeat</Text>
              </View>
              <View style={styles.valueWithChevron}>
                <Text style={styles.rowValueSubtleText}>
                  {REPEAT_LIST_OPTIONS.find((r) => r.id === selectedRepeatId)?.label || 'None'}
                </Text>
                <Ionicons
                  name={showRepeatList ? 'chevron-up' : 'chevron-forward'}
                  size={16}
                  color={showRepeatList ? colors.primary : '#606070'}
                />
              </View>
            </TouchableOpacity>

            {/* Repeat List Options in List Form */}
            {showRepeatList && (
              <View style={styles.repeatListContainer}>
                {REPEAT_LIST_OPTIONS.map((item) => {
                  const isSelected = selectedRepeatId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.repeatListItem, isSelected && styles.repeatListItemSelected]}
                      onPress={() => {
                        playSpinnerTickSound(850);
                        setSelectedRepeatId(item.id);
                        setRepeatIndex(REPEAT_LIST_OPTIONS.findIndex((r) => r.id === item.id));
                        setShowRepeatList(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.repeatIconCircle, isSelected && styles.repeatIconCircleSelected]}>
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={isSelected ? '#151518' : colors.primary}
                        />
                      </View>
                      <View style={styles.repeatTextGroup}>
                        <Text style={[styles.repeatItemLabel, isSelected && styles.repeatItemLabelSelected]}>
                          {item.label}
                        </Text>
                        <Text style={styles.repeatItemSub}>{item.subtitle}</Text>
                      </View>
                      <View style={[styles.repeatRadioCircle, isSelected && styles.repeatRadioCircleSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#151518" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070A',
  },
  keyboardView: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  circleIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(24, 24, 36, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  technaPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  technaPillBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  technaDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5A5A68',
  },
  technaDotActive: {
    backgroundColor: colors.primary,
  },
  technaPillText: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  technaPillTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  navSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  navSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomSaveButton: {
    marginTop: 26,
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  bottomSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  bottomSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titleSection: {
    marginBottom: 16,
  },
  screenHeading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  screenSubheading: {
    fontSize: 14,
    fontWeight: '500',
    color: '#767686',
    marginTop: 3,
  },

  // Notice capsule for voice feedback
  noticeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  noticeText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },

  // Cards
  card: {
    backgroundColor: 'rgba(16, 16, 24, 0.95)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleTextInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingVertical: 4,
  },
  clearBtn: {
    padding: 4,
    marginRight: 2,
  },
  inputMicBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 28, 40, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputMicBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  inlineListeningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  soundWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 3,
    marginRight: 10,
  },
  soundWaveBar: {
    width: 3,
    backgroundColor: colors.primaryLight,
    borderRadius: 2,
  },
  inlineListeningTexts: {
    flex: 1,
  },
  inlineListeningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: 2,
  },
  inlineListeningSub: {
    fontSize: 11,
    color: '#A0A0B0',
  },
  descTextInput: {
    fontSize: 14,
    color: '#D4D4E0',
    lineHeight: 20,
    minHeight: 58,
    paddingVertical: 4,
    textAlignVertical: 'top',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowIcon: {
    marginRight: 10,
  },
  rowInput: {
    flex: 1,
    fontSize: 15,
    color: '#E6E6F0',
    fontWeight: '500',
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EAEAEF',
    marginBottom: 12,
  },
  priorityPillRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  priorityPillSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityPillText: {
    fontSize: 12,
    color: '#7E7E8E',
    fontWeight: '600',
  },
  interactiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabelText: {
    fontSize: 15,
    color: '#E4E4EE',
    fontWeight: '600',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 36, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillBadgeActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  pillBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  valueWithChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValueSubtleText: {
    color: '#9090A0',
    fontSize: 14,
    fontWeight: '600',
  },

  // Repeat List Form Styles
  repeatListContainer: {
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    borderRadius: 18,
    padding: 8,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  repeatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(24, 24, 36, 0.7)',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  repeatListItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  repeatIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(32, 32, 46, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  repeatIconCircleSelected: {
    backgroundColor: colors.primary,
  },
  repeatTextGroup: {
    flex: 1,
  },
  repeatItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E2EC',
    marginBottom: 2,
  },
  repeatItemLabelSelected: {
    color: colors.primaryLight,
    fontWeight: '800',
  },
  repeatItemSub: {
    fontSize: 11,
    color: '#767688',
  },
  repeatRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#3D3D52',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  repeatRadioCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  manualSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  manualHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manualHeaderText: {
    color: '#D4D4E2',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  manualHeaderSubtext: {
    color: '#767688',
    fontSize: 11,
    fontWeight: '500',
  },
});
