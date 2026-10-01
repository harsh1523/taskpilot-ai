import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, Priority, Task } from '../types/task';
import { colors } from '../theme/colors';
import { playSpinnerTickSound, speakWithTechna } from '../services/soundEffects';
import { extractSpokenDueDate, parseVoiceToTaskForm, parseSpokenPriority } from '../services/voiceParser';
import { TechnaDisplayBorderGlow } from './TechnaDisplayBorderGlow';
import { voiceRecognition } from '../services/voiceRecognition';
import { TechnaOrb } from './common/TechnaOrb';
import { CircleIconButton } from './common/CircleIconButton';
import {
  getOccupiedSchedule,
  checkSlotConflict,
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

  // Step Values & Done Flags
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [, setSelectedDateObj] = useState(new Date(Date.now() + 86400000));
  const [selectedTimeRange, setSelectedTimeRange] = useState('06:00 PM - 07:00 PM');
  const [occupiedWarning, setOccupiedWarning] = useState<string | null>(null);
  const [conflictingInfo, setConflictingInfo] = useState<{
    taskId?: string;
    title: string;
    nextAvailableSlot: AvailableSlot | null;
    desiredSlot: string;
  } | null>(null);

  const [selectedPriority, setSelectedPriority] = useState<Priority>('high');

  // Occupied blocks and conflict checking powered by scheduleUtils
  const defaultOccupiedSchedule = useMemo(() => {
    return getOccupiedSchedule(existingTasks, selectedDate);
  }, [existingTasks, selectedDate]);

  const checkSlotConflictHelper = (startMin: number, durationMin: number = 60) => {
    return checkSlotConflict(startMin, durationMin, defaultOccupiedSchedule);
  };

  // Reset and auto-start listening on open
  useEffect(() => {
    if (visible) {
      setCurrentStep('task');
      setTaskTitle('');
      setSelectedDate('Tomorrow');
      setSelectedTimeRange('06:00 PM - 07:00 PM');
      setOccupiedWarning(null);
      setConflictingInfo(null);
      setSelectedPriority('high');
      setLiveTranscript('');

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

    const started = await voiceRecognition.start({
      onStart: () => {
        setIsListening(true);
      },
      onTranscript: (transcript: string, isFinal: boolean) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          handleSpokenInput(transcript);
        }
      },
      onError: () => {
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
      setSelectedDate(dateLabel);
      if (fullForm.dateObj) setSelectedDateObj(fullForm.dateObj);
      setSelectedTimeRange(timeRange);
      setSelectedPriority(priority);
      setCurrentStep('done');
      setLiveTranscript('');

      playSpinnerTickSound(1200);
      speakWithTechna(`Scheduled ${title} for ${dateLabel} at ${timeRange}.`);
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

  // Step 1: Task Name Added
  const handleTaskNameAdded = (name: string) => {
    playSpinnerTickSound(1000);
    setTaskTitle(name);
    setLiveTranscript('');
    stopSpeechRecognition();

    speakWithTechna('When should I schedule this?');

    setTimeout(() => {
      setCurrentStep('time');
      startSpeechRecognition();
    }, 1000);
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
      setOccupiedWarning(`Occupied by "${conflict.title}".`);
      setSelectedTimeRange(slotStr);
      setConflictingInfo({
        taskId: conflict.conflictingTaskId,
        title: conflict.title,
        nextAvailableSlot: nextSlot,
        desiredSlot: slotStr,
      });
      speakWithTechna(`That slot is occupied by ${conflict.title}. You can shift it or choose an open slot.`);
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

    speakWithTechna(`Shifted ${title} to ${nextRange}. Assigned ${desired}.`);
    handleTimeSlotConfirmed(desired, selectedDate);
  };

  // Step 2 Confirmation
  const handleTimeSlotConfirmed = (slotStr: string, dateStr: string = selectedDate) => {
    playSpinnerTickSound(1000);
    setSelectedTimeRange(slotStr);
    setOccupiedWarning(null);
    setLiveTranscript('');
    stopSpeechRecognition();

    speakWithTechna(`Scheduled for ${dateStr} at ${slotStr}. What priority?`);

    setTimeout(() => {
      setCurrentStep('priority');
      startSpeechRecognition();
    }, 1100);
  };

  // Step 3: Priority Selected -> Done
  const handlePrioritySelected = (p: Priority) => {
    playSpinnerTickSound(1100);
    setSelectedPriority(p);
    setLiveTranscript('');
    stopSpeechRecognition();

    speakWithTechna(`Saving ${p} priority task.`);

    setTimeout(() => {
      setCurrentStep('done');
      finalizeAndSave(p);
    }, 500);
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
    }, 900);
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
      <View style={styles.overlay}>
        {/* Techna Siri Edge Display Border Glow */}
        <TechnaDisplayBorderGlow active={isListening} />

        <View style={styles.modalCard}>
          {/* 1. Minimalist Apple Siri Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.siriHeaderGroup}>
              <View style={[styles.siriLiveDot, isListening && styles.siriLiveDotActive]} />
              <Text style={styles.siriTitleText}>Techna</Text>
              <Text style={styles.siriSubtitleText}>{isListening ? 'Listening' : 'Ready'}</Text>
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
                  <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.topSavePillText}>Save</Text>
                </TouchableOpacity>
              )}
              <CircleIconButton
                icon="close"
                size={32}
                iconSize={18}
                color="#8A8A9C"
                backgroundColor="rgba(255, 255, 255, 0.08)"
                onPress={onClose}
              />
            </View>
          </View>

          {/* 2. Hero Apple Siri Orb */}
          <View style={styles.orbWrapper}>
            <TechnaOrb
              isListening={isListening}
              onPress={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
              size={104}
            />
          </View>

          {/* 3. Clean Siri Query / Realtime Transcript */}
          <View style={styles.transcriptContainer}>
            {currentStep === 'done' ? (
              <View style={styles.centerStatusGroup}>
                <Ionicons name="checkmark-circle" size={26} color="#34D399" style={{ marginBottom: 4 }} />
                <Text style={styles.siriHeroPrompt}>Task Scheduled</Text>
                <Text style={styles.siriSubPrompt}>&ldquo;{taskTitle}&rdquo;</Text>
              </View>
            ) : taskTitle ? (
              <View style={styles.recognizedGroup}>
                <Text style={styles.taskTitleHeadline} numberOfLines={2}>
                  &ldquo;{taskTitle}&rdquo;
                </Text>
                <View style={styles.taskMetaRow}>
                  <View style={styles.metaChip}>
                    <Ionicons name="calendar-outline" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
                    <Text style={styles.metaChipText}>{selectedDate} • {selectedTimeRange}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="flag-outline" size={12} color="#EC4899" style={{ marginRight: 4 }} />
                    <Text style={styles.metaChipText}>{selectedPriority.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            ) : liveTranscript ? (
              <Text style={styles.liveTranscriptText} numberOfLines={2}>
                &ldquo;{liveTranscript}&rdquo;
              </Text>
            ) : (
              <View style={styles.heroTextGroup}>
                <Text style={styles.siriHeroPrompt}>
                  {isListening ? 'Listening...' : 'What would you like to schedule?'}
                </Text>
                <Text style={styles.siriSubPrompt}>
                  Tap Techna or speak naturally
                </Text>
              </View>
            )}
          </View>

          {/* Conflict Alert (if any) */}
          {occupiedWarning && conflictingInfo && (
            <View style={styles.conflictAlertCard}>
              <View style={styles.conflictHeader}>
                <Ionicons name="alert-circle" size={15} color="#F87171" style={{ marginRight: 6 }} />
                <Text style={styles.conflictTitle} numberOfLines={1}>
                  Slot occupied by &ldquo;{conflictingInfo.title}&rdquo;
                </Text>
              </View>
              {conflictingInfo.nextAvailableSlot && onShiftTask && (
                <TouchableOpacity
                  style={styles.conflictShiftBtn}
                  onPress={handleShiftOccupiedSlot}
                  activeOpacity={0.8}
                >
                  <Ionicons name="swap-horizontal" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.conflictShiftText}>
                    Shift to {conflictingInfo.nextAvailableSlot.rangeString}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
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
    backgroundColor: 'rgba(20, 20, 28, 0.97)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  siriHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siriLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#686878',
    marginRight: 8,
  },
  siriLiveDotActive: {
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  siriTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginRight: 6,
  },
  siriSubtitleText: {
    color: '#8E8E9E',
    fontSize: 12,
    fontWeight: '500',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topSavePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  topSavePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 2. Hero Apple Siri Orb
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },

  // 3. Dynamic Siri Headline / Transcript
  transcriptContainer: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  centerStatusGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  siriHeroPrompt: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  siriSubPrompt: {
    fontSize: 13,
    color: '#8E8E9E',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  heroTextGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTranscriptText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#38BDF8',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  recognizedGroup: {
    alignItems: 'center',
  },
  taskTitleHeadline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 10,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E0E0EA',
  },

  // Conflict Card
  conflictAlertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  conflictTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  conflictShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  conflictShiftText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
