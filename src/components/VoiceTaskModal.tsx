import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Category, Priority, Task } from '../types/task';
import { colors } from '../theme/colors';
import { playSpinnerTickSound, speakWithTechna } from '../services/soundEffects';
import { extractSpokenDueDate, parseVoiceToTaskForm, parseSpokenPriority } from '../services/voiceParser';
import { TechnaDisplayBorderGlow } from './TechnaDisplayBorderGlow';
import { voiceRecognition } from '../services/voiceRecognition';
import { TechnaOrb } from './common/TechnaOrb';
import { PrioritySelector } from './common/PrioritySelector';
import { CircleIconButton } from './common/CircleIconButton';
import {
  getOccupiedSchedule,
  checkSlotConflict,
  computeAvailableSlots,
  computeTimeRange,
  parseTimeString,
  findNextAvailableSlot,
  AvailableSlot,
} from '../utils/scheduleUtils';

interface VoiceTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => void;
  existingTasks?: Task[];
  onShiftTask?: (taskId: string, newDueDate: string) => Promise<void> | void;
}

type TechnaStep = 'task' | 'time' | 'priority' | 'done';

const sampleTaskPrompts = [
  'Prepare marketing launch budget',
  'Weekly design sync with team',
  'Doctor annual checkup',
  'Review mobile app wireframes',
];

const sampleTimePrompts = [
  'Tomorrow at 10 AM',
  'Friday at 6 PM',
  'Tomorrow at 2 PM',
  'Today at 7 PM',
];

export const VoiceTaskModal: React.FC<VoiceTaskModalProps> = ({
  visible,
  onClose,
  onSave,
  existingTasks = [],
  onShiftTask,
}) => {
  const [currentStep, setCurrentStep] = useState<TechnaStep>('task');
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceInputText, setVoiceInputText] = useState('');
  const [micStatusMessage, setMicStatusMessage] = useState<string | null>(null);

  // Step Values & Done Flags
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDone, setTaskDone] = useState(false);

  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [selectedDateObj, setSelectedDateObj] = useState(new Date(Date.now() + 86400000));
  const [selectedTimeRange, setSelectedTimeRange] = useState('06:00 PM - 07:00 PM');
  const [timeDone, setTimeDone] = useState(false);
  const [occupiedWarning, setOccupiedWarning] = useState<string | null>(null);
  const [conflictingInfo, setConflictingInfo] = useState<{
    taskId?: string;
    title: string;
    nextAvailableSlot: AvailableSlot | null;
    desiredSlot: string;
  } | null>(null);

  const [selectedPriority, setSelectedPriority] = useState<Priority>('high');
  const [priorityDone, setPriorityDone] = useState(false);

  // Occupied blocks and conflict checking powered by scheduleUtils
  const defaultOccupiedSchedule = useMemo(() => {
    return getOccupiedSchedule(existingTasks);
  }, [existingTasks]);

  const checkSlotConflictHelper = (startMin: number, durationMin: number = 60) => {
    return checkSlotConflict(startMin, durationMin, defaultOccupiedSchedule);
  };

  // Compute available free slots via centralized utility
  const availableFreeSlots = useMemo(() => {
    return computeAvailableSlots(defaultOccupiedSchedule, 60, 6, 22);
  }, [defaultOccupiedSchedule]);

  // Reset and auto-start listening on open
  useEffect(() => {
    if (visible) {
      setCurrentStep('task');
      setTaskTitle('');
      setTaskDone(false);
      setSelectedDate('Tomorrow');
      setSelectedTimeRange('06:00 PM - 07:00 PM');
      setTimeDone(false);
      setOccupiedWarning(null);
      setConflictingInfo(null);
      setSelectedPriority('high');
      setPriorityDone(false);
      setLiveTranscript('');
      setVoiceInputText('');
      setMicStatusMessage(null);

      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
    return () => {
      stopSpeechRecognition();
    };
  }, [visible]);

  // Cross-Platform Speech Recognition Starter
  const startSpeechRecognition = async () => {
    setIsListening(true);
    setMicStatusMessage(null);

    const started = await voiceRecognition.start({
      onStart: () => {
        setIsListening(true);
      },
      onTranscript: (transcript: string, isFinal: boolean) => {
        setLiveTranscript(transcript);
        setVoiceInputText(transcript);
        if (isFinal) {
          handleSpokenInput(transcript);
        }
      },
      onError: (err: string) => {
        setMicStatusMessage(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started) {
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    voiceRecognition.stop();
    setIsListening(false);
  };

  // Smart Voice Input Processor (Handles both full sentences and step-by-step)
  const handleSpokenInput = (rawSpoken: string) => {
    const text = rawSpoken.trim();
    if (!text) return;

    // Check if the user spoke an all-in-one natural command (e.g. "Doctor appointment tomorrow at 10 AM high priority")
    const fullForm = parseVoiceToTaskForm(text);

    if (fullForm.title && (fullForm.dateLabel || fullForm.timeLabel || fullForm.priority)) {
      const title = fullForm.title;
      const dateLabel = fullForm.dateLabel || 'Tomorrow';
      let timeRange = '06:00 PM - 07:00 PM';
      if (fullForm.timeLabel) {
        const parsedTime = parseTimeString(fullForm.timeLabel);
        if (parsedTime) {
          timeRange = computeTimeRange(parsedTime.hour, 60).rangeString;
        } else {
          timeRange = fullForm.timeLabel;
        }
      }
      const priority = fullForm.priority || 'medium';

      setTaskTitle(title);
      setTaskDone(true);
      setSelectedDate(dateLabel);
      if (fullForm.dateObj) setSelectedDateObj(fullForm.dateObj);
      setSelectedTimeRange(timeRange);
      setTimeDone(true);
      setSelectedPriority(priority);
      setPriorityDone(true);
      setCurrentStep('done');
      setLiveTranscript('');
      setVoiceInputText('');

      playSpinnerTickSound(1200);
      speakWithTechna(`Got it! Scheduled "${title}" for ${dateLabel} at ${timeRange}, ${priority} priority.`);
      finalizeAndSave(priority, title, dateLabel, timeRange);
      return;
    }

    // Step-by-step voice processing
    if (currentStep === 'task') {
      const clean = text
        .replace(/^(add a task to|add a task for|create a task to|create a task for|remind me to|task name is|task is|i need to|please)\s+/i, '')
        .trim();
      if (clean.length > 1) {
        handleTaskNameAdded(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    } else if (currentStep === 'time') {
      const lower = text.toLowerCase();
      if (
        conflictingInfo &&
        (lower.includes('shift') ||
          lower.includes('move') ||
          lower.includes('change slot') ||
          lower.includes('reschedule') ||
          lower.includes('take slot'))
      ) {
        handleShiftOccupiedSlot();
        return;
      }
      handleTimeSpoken(text);
    } else if (currentStep === 'priority') {
      const prio = parseSpokenPriority(text);
      if (prio) {
        handlePrioritySelected(prio);
      }
    }
  };

  // Step 1: Task Name Added -> Display "Done ✓" -> advance
  const handleTaskNameAdded = (name: string) => {
    playSpinnerTickSound(1000);
    setTaskTitle(name);
    setTaskDone(true);
    setLiveTranscript('');
    setVoiceInputText('');
    stopSpeechRecognition();

    speakWithTechna('When would you like to schedule this?');

    setTimeout(() => {
      setCurrentStep('time');
      startSpeechRecognition();
    }, 1100);
  };

  // Step 2: Due Date & Time Spoken
  const handleTimeSpoken = (spoken: string) => {
    const lower = spoken.toLowerCase();
    const parsedDate = extractSpokenDueDate(spoken);
    const dateStr = parsedDate?.dateLabel || 'Tomorrow';
    setSelectedDate(dateStr);
    if (parsedDate?.dateObj) setSelectedDateObj(parsedDate.dateObj);

    // Extract hour
    let hour = 18; // default 6 PM
    const parsedTime = parseTimeString(spoken);
    if (parsedTime) {
      hour = parsedTime.hour;
    } else if (lower.includes('morning') || lower.includes('9 am')) hour = 9;
    else if (lower.includes('afternoon') || lower.includes('2 pm')) hour = 14;
    else if (lower.includes('evening') || lower.includes('6 pm')) hour = 18;
    else if (lower.includes('night') || lower.includes('9 pm')) hour = 21;

    // Check conflict via centralized helper
    const conflict = checkSlotConflictHelper(hour * 60, 60);
    const slotStr = computeTimeRange(hour, 60).rangeString;

    if (conflict.occupied) {
      const nextSlot = findNextAvailableSlot(defaultOccupiedSchedule, hour * 60, 60);
      playSpinnerTickSound(650);
      setOccupiedWarning(`"${slotStr}" is already occupied (${conflict.title}). Pick another slot or shift "${conflict.title}":`);
      setSelectedTimeRange(slotStr);
      setConflictingInfo({
        taskId: conflict.conflictingTaskId,
        title: conflict.title,
        nextAvailableSlot: nextSlot,
        desiredSlot: slotStr,
      });
      speakWithTechna(`That slot is occupied by ${conflict.title}. You can shift it to ${nextSlot ? nextSlot.rangeString : 'another time'} or choose an open slot.`);
    } else {
      setConflictingInfo(null);
      handleTimeSlotConfirmed(slotStr, dateStr);
    }
  };

  // Shift conflicting occupied task to next free window
  const handleShiftOccupiedSlot = async () => {
    if (!conflictingInfo || !conflictingInfo.nextAvailableSlot) return;
    playSpinnerTickSound(1050);

    if (conflictingInfo.taskId && onShiftTask) {
      const shiftedDueDate = `${selectedDate} • ${conflictingInfo.nextAvailableSlot.rangeString}`;
      await onShiftTask(conflictingInfo.taskId, shiftedDueDate);
    }

    const desired = conflictingInfo.desiredSlot;
    const title = conflictingInfo.title;
    const nextRange = conflictingInfo.nextAvailableSlot.rangeString;
    setConflictingInfo(null);
    setOccupiedWarning(null);

    speakWithTechna(`Shifted ${title} to ${nextRange}. Assigned ${desired} to this task.`);
    handleTimeSlotConfirmed(desired, selectedDate);
  };

  // Step 2 Confirmation: Display "Done ✓" -> advance
  const handleTimeSlotConfirmed = (slotStr: string, dateStr: string = selectedDate) => {
    playSpinnerTickSound(1000);
    setSelectedTimeRange(slotStr);
    setOccupiedWarning(null);
    setTimeDone(true);
    setLiveTranscript('');
    setVoiceInputText('');
    stopSpeechRecognition();

    speakWithTechna(`Scheduled for ${dateStr} at ${slotStr}. What priority should I set?`);

    setTimeout(() => {
      setCurrentStep('priority');
      startSpeechRecognition();
    }, 1200);
  };

  // Step 3: Priority Selected -> Display "Done ✓" -> complete
  const handlePrioritySelected = (p: Priority) => {
    playSpinnerTickSound(1100);
    setSelectedPriority(p);
    setPriorityDone(true);
    setLiveTranscript('');
    setVoiceInputText('');
    stopSpeechRecognition();

    speakWithTechna(`Priority set to ${p}. Saving task.`);

    setTimeout(() => {
      setCurrentStep('done');
      finalizeAndSave(p);
    }, 600);
  };

  // Finalize & Save
  const finalizeAndSave = (
    prio: Priority = selectedPriority,
    title: string = taskTitle,
    date: string = selectedDate,
    time: string = selectedTimeRange
  ) => {
    stopSpeechRecognition();
    const finalTask = {
      title: title.trim() || 'Untitled Voice Task',
      category: 'Work' as Category,
      priority: prio,
      dueDate: `${date} • ${time}`,
      createdVia: 'voice' as const,
      voiceTranscription: `Created via Techna Voice Assistant: "${title}"`,
    };

    setTimeout(() => {
      onSave(finalTask);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Techna Display Border Glow */}
        <TechnaDisplayBorderGlow active={isListening} />

        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.technaStatusGroup}>
              <View style={[styles.technaLiveDot, !isListening && styles.technaLiveDotInactive]} />
              <Text style={styles.technaTitleText}>Techna AI Voice</Text>
            </View>
            <View style={styles.headerRightGroup}>
              {taskTitle.trim().length > 0 && currentStep !== 'done' && (
                <TouchableOpacity
                  style={styles.topSavePill}
                  onPress={() => {
                    playSpinnerTickSound(1100);
                    finalizeAndSave(selectedPriority, taskTitle, selectedDate, selectedTimeRange);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#151518" style={{ marginRight: 4 }} />
                  <Text style={styles.topSavePillText}>Save Task</Text>
                </TouchableOpacity>
              )}
              <CircleIconButton
                icon="close"
                size={32}
                iconSize={18}
                color="#8A8A9C"
                backgroundColor="transparent"
                onPress={onClose}
              />
            </View>
          </View>

          {/* Central Techna Animated Glowing Orb (Reusable Component) */}
          <TechnaOrb
            isListening={isListening}
            onPress={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
          />

          {/* Techna Voice & Dictation Bar with Instant Keyboard Mic Support */}
          <View style={[styles.voiceInputCapsule, isListening && styles.voiceInputCapsuleActive]}>
            <TouchableOpacity
              onPress={() => {
                playSpinnerTickSound(isListening ? 700 : 1000);
                if (isListening) stopSpeechRecognition();
                else startSpeechRecognition();
              }}
              activeOpacity={0.7}
              style={styles.inputMicBtn}
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={20}
                color={isListening ? '#34D399' : '#A0A0B8'}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.voiceTextInput}
              value={voiceInputText}
              onChangeText={(text) => {
                setVoiceInputText(text);
                setLiveTranscript(text);
              }}
              placeholder={
                currentStep === 'task'
                  ? 'Speak or type task name (e.g. Design review)...'
                  : currentStep === 'time'
                  ? 'Speak due date & time (e.g. Tomorrow 10 AM)...'
                  : 'Speak or tap priority (Urgent, High, Medium, Low)...'
              }
              placeholderTextColor="#76768E"
              returnKeyType="send"
              onSubmitEditing={() => {
                if (voiceInputText.trim()) {
                  handleSpokenInput(voiceInputText.trim());
                }
              }}
            />
            {voiceInputText.trim().length > 0 && (
              <TouchableOpacity
                style={styles.sendVoiceBtn}
                onPress={() => handleSpokenInput(voiceInputText.trim())}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-up" size={16} color="#151518" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status / Permission Message Notice */}
          {micStatusMessage ? (
            <View style={styles.errorNoticeBox}>
              <Ionicons name="information-circle" size={14} color="#FBBF24" style={{ marginRight: 6 }} />
              <Text style={styles.errorNoticeText}>{micStatusMessage}</Text>
            </View>
          ) : liveTranscript.length > 0 ? (
            <View style={styles.liveTranscriptCapsule}>
              <Ionicons name="sparkles" size={13} color="#F8A878" style={{ marginRight: 6 }} />
              <Text style={styles.liveTranscriptText} numberOfLines={1}>
                {liveTranscript}
              </Text>
            </View>
          ) : null}

          {/* ================= STEP-BY-STEP PROGRESS CARD ================= */}
          <View style={styles.progressCard}>
            {/* Step 1: Task Name */}
            <View style={styles.stepItemRow}>
              <View style={styles.stepIndicatorCol}>
                <View style={[styles.stepBullet, taskDone && styles.stepBulletDone]}>
                  {taskDone ? (
                    <Ionicons name="checkmark" size={11} color="#101014" />
                  ) : (
                    <Text style={styles.stepBulletNumber}>1</Text>
                  )}
                </View>
                <View style={[styles.stepLine, taskDone && styles.stepLineDone]} />
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepHeaderRow}>
                  <Text style={styles.stepLabel}>Task Name</Text>
                  {taskDone && (
                    <View style={styles.doneBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#34D399" />
                      <Text style={styles.doneBadgeText}>Done ✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepValueText}>
                  {taskTitle ? `"${taskTitle}"` : currentStep === 'task' ? 'Listening... Speak task name' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Step 2: Due Date & Time Slot */}
            <View style={styles.stepItemRow}>
              <View style={styles.stepIndicatorCol}>
                <View style={[styles.stepBullet, timeDone && styles.stepBulletDone]}>
                  {timeDone ? (
                    <Ionicons name="checkmark" size={11} color="#101014" />
                  ) : (
                    <Text style={styles.stepBulletNumber}>2</Text>
                  )}
                </View>
                <View style={[styles.stepLine, timeDone && styles.stepLineDone]} />
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepHeaderRow}>
                  <Text style={styles.stepLabel}>Due Date & Time Slot</Text>
                  {timeDone && (
                    <View style={styles.doneBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#34D399" />
                      <Text style={styles.doneBadgeText}>Done ✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepValueText}>
                  {timeDone
                    ? `${selectedDate} • ${selectedTimeRange}`
                    : currentStep === 'time'
                    ? 'Listening... Say date or time (e.g. Tomorrow 10 AM)'
                    : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Step 3: Priority */}
            <View style={styles.stepItemRow}>
              <View style={styles.stepIndicatorCol}>
                <View style={[styles.stepBullet, priorityDone && styles.stepBulletDone]}>
                  {priorityDone ? (
                    <Ionicons name="checkmark" size={11} color="#101014" />
                  ) : (
                    <Text style={styles.stepBulletNumber}>3</Text>
                  )}
                </View>
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepHeaderRow}>
                  <Text style={styles.stepLabel}>Priority</Text>
                  {priorityDone && (
                    <View style={styles.doneBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#34D399" />
                      <Text style={styles.doneBadgeText}>Done ✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepValueText}>
                  {priorityDone
                    ? selectedPriority.toUpperCase()
                    : currentStep === 'priority'
                    ? 'Say or select priority'
                    : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Always-On Notification Tag */}
            <View style={styles.notificationNoticeRow}>
              <Ionicons name="notifications" size={14} color="#F472B6" style={{ marginRight: 6 }} />
              <Text style={styles.notificationNoticeText}>Notification: Always On</Text>
            </View>
          </View>

          {/* ================= DYNAMIC INTERACTIVE STEP CONTROLS ================= */}
          {/* STEP 1 CONTROLS */}
          {currentStep === 'task' && (
            <View style={styles.interactiveBox}>
              <Text style={styles.promptTitle}>Say or tap a task prompt:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {sampleTaskPrompts.map((sample) => (
                  <TouchableOpacity
                    key={sample}
                    style={styles.sampleChip}
                    onPress={() => handleTaskNameAdded(sample)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="mic-circle" size={14} color="#F8A878" style={{ marginRight: 4 }} />
                    <Text style={styles.sampleChipText}>"{sample}"</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* STEP 2 CONTROLS (With Occupied Slot Detection & Available Slots) */}
          {currentStep === 'time' && (
            <View style={styles.interactiveBox}>
              {occupiedWarning ? (
                <View style={styles.occupiedAlertBox}>
                  <View style={styles.occupiedAlertHeader}>
                    <Ionicons name="alert-circle" size={16} color="#F87171" style={{ marginRight: 6 }} />
                    <Text style={styles.occupiedAlertTitle}>Slot Occupied</Text>
                  </View>
                  <Text style={styles.occupiedAlertSub}>{occupiedWarning}</Text>

                  {/* Option to Shift the Occupied Task */}
                  {conflictingInfo?.nextAvailableSlot && conflictingInfo.taskId && onShiftTask && (
                    <TouchableOpacity
                      style={styles.shiftSlotBtn}
                      onPress={handleShiftOccupiedSlot}
                      activeOpacity={0.8}
                    >
                      <View style={styles.shiftSlotBtnIconCircle}>
                        <Ionicons name="swap-horizontal" size={16} color="#151518" />
                      </View>
                      <View style={styles.shiftSlotBtnContent}>
                        <Text style={styles.shiftSlotBtnTitle} numberOfLines={1}>
                          Shift "{conflictingInfo.title}"
                        </Text>
                        <Text style={styles.shiftSlotBtnSub}>
                          Move to {conflictingInfo.nextAvailableSlot.rangeString} & keep {conflictingInfo.desiredSlot}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}

                  <Text style={styles.alternativeSlotsHeader}>Or pick an open slot:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {availableFreeSlots.slice(0, 5).map((slot) => (
                      <TouchableOpacity
                        key={slot.rangeString}
                        style={styles.availableChip}
                        onPress={() => handleTimeSlotConfirmed(slot.rangeString)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="sparkles" size={11} color="#151518" style={{ marginRight: 4 }} />
                        <Text style={styles.availableChipText}>{slot.rangeString}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <>
                  <Text style={styles.promptTitle}>Say due date or time slot:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {sampleTimePrompts.map((tSample) => (
                      <TouchableOpacity
                        key={tSample}
                        style={styles.sampleChip}
                        onPress={() => handleTimeSpoken(tSample)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="time" size={13} color="#F8A878" style={{ marginRight: 4 }} />
                        <Text style={styles.sampleChipText}>{tSample}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          )}

          {/* STEP 3 CONTROLS (Priority Selection via Reusable PrioritySelector) */}
          {currentStep === 'priority' && (
            <View style={styles.interactiveBox}>
              <Text style={styles.promptTitle}>Say or tap priority:</Text>
              <PrioritySelector
                selectedPriority={selectedPriority}
                onSelectPriority={handlePrioritySelected}
                variant="grid"
              />
            </View>
          )}

          {/* STEP 4 CONTROLS (Done & Auto-saving) */}
          {currentStep === 'done' && (
            <View style={styles.celebrationBox}>
              <Ionicons name="checkmark-done-circle" size={32} color="#34D399" />
              <Text style={styles.celebrationText}>All Details Added • Saving Task...</Text>
            </View>
          )}

          {/* Manual Save Task Button when title is entered */}
          {taskTitle.trim().length > 0 && currentStep !== 'done' && (
            <TouchableOpacity
              style={styles.modalSaveTaskBtn}
              onPress={() => {
                playSpinnerTickSound(1100);
                finalizeAndSave(selectedPriority, taskTitle, selectedDate, selectedTimeRange);
              }}
              activeOpacity={0.85}
              accessibilityLabel="Save Task"
            >
              <LinearGradient
                colors={colors.gradients.techna}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSaveTaskGradient}
              >
                <Ionicons name="checkmark-circle" size={18} color="#151518" style={{ marginRight: 6 }} />
                <Text style={styles.modalSaveTaskBtnText}>Save Task</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Mic Toggle Bar at bottom */}
          <TouchableOpacity
            style={[styles.micActionRow, isListening && styles.micActionRowActive]}
            onPress={() => {
              playSpinnerTickSound(isListening ? 700 : 1000);
              if (isListening) stopSpeechRecognition();
              else startSpeechRecognition();
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={18}
              color={isListening ? colors.primary : '#8A8A9C'}
            />
            <Text style={[styles.micActionText, isListening && styles.micActionTextActive]}>
              {isListening ? 'Techna is listening... (Speak or dictate)' : 'Tap to activate voice listening'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.88)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#242434',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topSavePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  topSavePillText: {
    color: '#151518',
    fontSize: 12,
    fontWeight: '800',
  },
  modalSaveTaskBtn: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveTaskGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  modalSaveTaskBtnText: {
    color: '#151518',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  technaStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technaLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginRight: 8,
  },
  technaLiveDotInactive: {
    backgroundColor: '#71717A',
  },
  technaTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E28',
    alignItems: 'center',
    justifyContent: 'center',
  },

  voiceInputCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#2B2B3C',
    marginBottom: 10,
  },
  voiceInputCapsuleActive: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
  },
  inputMicBtn: {
    padding: 4,
    marginRight: 6,
  },
  voiceTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sendVoiceBtn: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  errorNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  errorNoticeText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  liveTranscriptCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(248, 168, 120, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 168, 120, 0.25)',
  },
  liveTranscriptText: {
    color: '#F8A878',
    fontSize: 12,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: '#181822',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262638',
    marginBottom: 12,
  },
  stepItemRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  stepBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#262634',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D3D52',
  },
  stepBulletDone: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
  },
  stepBulletNumber: {
    color: '#8A8A9E',
    fontSize: 11,
    fontWeight: '800',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#262634',
    marginVertical: 2,
    minHeight: 18,
  },
  stepLineDone: {
    backgroundColor: '#34D399',
  },
  stepContentCol: {
    flex: 1,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stepLabel: {
    color: '#8A8A9E',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 4,
  },
  doneBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  stepValueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  notificationNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#242434',
  },
  notificationNoticeText: {
    color: '#F472B6',
    fontSize: 11,
    fontWeight: '700',
  },
  interactiveBox: {
    marginBottom: 12,
  },
  promptTitle: {
    color: '#A0A0B2',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222230',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#323244',
  },
  sampleChipText: {
    color: '#E0E0F0',
    fontSize: 12,
    fontWeight: '600',
  },
  occupiedAlertBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  occupiedAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  occupiedAlertTitle: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  occupiedAlertSub: {
    color: '#E0E0EC',
    fontSize: 12,
    marginBottom: 8,
  },
  shiftSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B26',
    borderWidth: 1,
    borderColor: 'rgba(248, 168, 120, 0.45)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  shiftSlotBtnIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shiftSlotBtnContent: {
    flex: 1,
  },
  shiftSlotBtnTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  shiftSlotBtnSub: {
    color: '#F8A878',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  alternativeSlotsHeader: {
    color: '#9E9EB2',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  availableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  availableChipText: {
    color: '#151518',
    fontSize: 11,
    fontWeight: '800',
  },

  celebrationBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  celebrationText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '800',
  },
  micActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181822',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#262638',
  },
  micActionRowActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(248, 168, 120, 0.08)',
  },
  micActionText: {
    color: '#8A8A9C',
    fontSize: 13,
    fontWeight: '700',
  },
  micActionTextActive: {
    color: colors.primary,
  },
});
