import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Category, Priority, Task } from '../types/task';
import { colors, useTheme } from '../theme';
import { playSpinnerTickSound, speakWithTechna } from '../services/soundEffects';
import { extractSpokenDueDate, parseVoiceToTaskForm, parseSpokenPriority } from '../services/voiceParser';
import { robotAlert } from '../services/robotAlert';
import { TechnaDisplayBorderGlow } from './TechnaDisplayBorderGlow';
import { voiceRecognition } from '../services/voiceRecognition';
import { TechnaOrb, RobotFaceMode } from './common/TechnaOrb';
import { CircleIconButton } from './common/CircleIconButton';
import {
  getOccupiedSchedule,
  checkSlotConflict,
  computeTimeRange,
  parseTimeString,
  findNextAvailableSlot,
  AvailableSlot,
} from '../utils/scheduleUtils';

const { height: screenHeight } = Dimensions.get('window');

/**
 * 7-Bar Organic Audio Waveform Visualizer
 * Reacts with continuous GPU-accelerated harmonic scaling when listening
 */
const VoiceWaveform: React.FC<{ isListening: boolean; color: string }> = ({ isListening, color }) => {
  const bars = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0.18))).current;

  useEffect(() => {
    if (!isListening) {
      Animated.parallel(
        bars.map((b) =>
          Animated.timing(b, {
            toValue: 0.18,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          })
        )
      ).start();
      return;
    }

    const configs = [
      { min: 0.2, max: 0.65, dur: 420 },
      { min: 0.22, max: 0.85, dur: 360 },
      { min: 0.25, max: 1.15, dur: 300 },
      { min: 0.3, max: 1.35, dur: 260 },
      { min: 0.25, max: 1.1, dur: 310 },
      { min: 0.22, max: 0.8, dur: 370 },
      { min: 0.2, max: 0.6, dur: 440 },
    ];

    const loops = bars.map((b, i) => {
      const c = configs[i];
      return Animated.loop(
        Animated.sequence([
          Animated.timing(b, {
            toValue: c.max,
            duration: c.dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(b, {
            toValue: c.min,
            duration: c.dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    });

    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [isListening]);

  return (
    <View style={styles.waveformContainer}>
      {bars.map((barAnim, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.waveformBar,
            {
              backgroundColor: color,
              transform: [{ scaleY: barAnim }],
              opacity: isListening ? 0.95 : 0.22,
              shadowColor: color,
              shadowOpacity: isListening ? 0.8 : 0,
              shadowRadius: 6,
            },
          ]}
        />
      ))}
    </View>
  );
};

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
  const { theme } = useTheme();
  const [modalRendered, setModalRendered] = useState(visible);
  const [currentStep, setCurrentStep] = useState<TechnaStep>('task');
  const [isListening, setIsListening] = useState(false);
  const [robotFaceMode, setRobotFaceMode] = useState<RobotFaceMode>('waves');
  const [liveTranscript, setLiveTranscript] = useState('');

  // Smooth Motion Values
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(screenHeight)).current;
  const dotPulseAnim = useRef(new Animated.Value(1)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const contentTranslateAnim = useRef(new Animated.Value(0)).current;
  const donePopAnim = useRef(new Animated.Value(0)).current;

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
  const [manualInputText, setManualInputText] = useState('');
  const [voiceNotice, setVoiceNotice] = useState('');
  const simulationTimers = useRef<any[]>([]);

  const clearSimulationTimers = () => {
    simulationTimers.current.forEach((t) => clearTimeout(t));
    simulationTimers.current = [];
  };

  // Occupied blocks and conflict checking powered by scheduleUtils
  const defaultOccupiedSchedule = useMemo(() => {
    return getOccupiedSchedule(existingTasks, selectedDate);
  }, [existingTasks, selectedDate]);

  const checkSlotConflictHelper = (startMin: number, durationMin: number = 60) => {
    return checkSlotConflict(startMin, durationMin, defaultOccupiedSchedule);
  };

  // Smooth Close Sequence
  const handleModalClose = () => {
    clearSimulationTimers();
    stopSpeechRecognition();
    setRobotFaceMode('idle');
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: screenHeight * 0.85,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalRendered(false);
      onClose();
    });
  };

  // Reset and auto-start listening on open with spring entrance
  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      setCurrentStep('task');
      setTaskTitle('');
      setSelectedDate('Tomorrow');
      setSelectedTimeRange('06:00 PM - 07:00 PM');
      setOccupiedWarning(null);
      setConflictingInfo(null);
      setSelectedPriority('high');
      setLiveTranscript('');
      setRobotFaceMode('waves');

      backdropAnim.setValue(0);
      sheetAnim.setValue(screenHeight * 0.85);

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0,
          damping: 24,
          mass: 0.85,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ]).start();

      startSpeechRecognition();
    } else if (modalRendered) {
      handleModalClose();
    }
    return () => {
      stopSpeechRecognition();
    };
  }, [visible]);

  // Dot pulsating breathing animation when active
  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(dotPulseAnim, {
            toValue: 1.45,
            duration: 650,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(dotPulseAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      dotPulseAnim.setValue(1);
    }
  }, [isListening]);

  // Smooth text morph when step or speech changes
  useEffect(() => {
    contentFadeAnim.setValue(0.35);
    contentTranslateAnim.setValue(8);
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, Boolean(taskTitle), Boolean(liveTranscript)]);

  // Done completion pop
  useEffect(() => {
    if (currentStep === 'done') {
      donePopAnim.setValue(0);
      Animated.spring(donePopAnim, {
        toValue: 1,
        friction: 5,
        tension: 110,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep]);

  // Cross-Platform Speech Recognition Starter
  const startSpeechRecognition = async () => {
    setIsListening(true);
    setRobotFaceMode('waves');
    setVoiceNotice('');

    const started = await voiceRecognition.start({
      onStart: () => {
        setIsListening(true);
        setRobotFaceMode('waves');
      },
      onTranscript: (transcript: string, isFinal: boolean) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          handleSpokenInput(transcript);
        }
      },
      onError: (err: string) => {
        setIsListening(false);
        setRobotFaceMode('idle');
        setVoiceNotice(err);
      },
      onEnd: () => {
        setIsListening(false);
        setRobotFaceMode('idle');
      },
    });

    if (!started) {
      setIsListening(false);
      setRobotFaceMode('idle');
      const env = voiceRecognition.getEnvironmentStatus();
      if (!env.isAvailable && env.message) {
        setVoiceNotice(env.message);
      }
    }
  };

  const stopSpeechRecognition = () => {
    voiceRecognition.stop();
    setIsListening(false);
  };

  // Interactive Voice Simulator (for Simulators or demonstration without native hardware mic)
  const simulateVoiceInput = (phrase: string = 'Doctor appointment tomorrow at 10 AM high priority') => {
    clearSimulationTimers();
    stopSpeechRecognition();
    setIsListening(true);
    setRobotFaceMode('waves');
    setLiveTranscript('');
    setVoiceNotice('');

    speakWithTechna('Listening to voice input.');

    const words = phrase.split(' ');
    let current = '';

    words.forEach((word, index) => {
      const timer = setTimeout(() => {
        current = current ? `${current} ${word}` : word;
        setLiveTranscript(current);
        playSpinnerTickSound(900 + index * 30);

        if (index === words.length - 1) {
          const finishTimer = setTimeout(() => {
            setIsListening(false);
            setRobotFaceMode('done');
            handleSpokenInput(phrase);
          }, 450);
          simulationTimers.current.push(finishTimer);
        }
      }, (index + 1) * 200);

      simulationTimers.current.push(timer);
    });
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
      setRobotFaceMode('done');

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
    setRobotFaceMode('done');

    speakWithTechna('When should I schedule this?');

    setTimeout(() => {
      setRobotFaceMode('waves');
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
    setRobotFaceMode('done');

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
    setRobotFaceMode('done');

    speakWithTechna(`Scheduled for ${dateStr} at ${slotStr}. What priority?`);

    setTimeout(() => {
      setRobotFaceMode('waves');
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
    setRobotFaceMode('done');

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
      handleModalClose();
    }, 900);
  };

  return (
    <Modal
      visible={modalRendered}
      animationType="none"
      transparent
      statusBarTranslucent={true}
      onRequestClose={handleModalClose}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlay}>
        {/* Animated iOS Frosted Glass Backdrop Blur */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropAnim }]}>
          <TouchableWithoutFeedback onPress={handleModalClose}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 50}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Techna Siri Edge Display Border Glow */}
        <TechnaDisplayBorderGlow active={isListening} />

        {/* Animated Spring Slide-Up Sheet */}
        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [{ translateY: sheetAnim }],
            },
          ]}
        >
          {/* iOS Frosted Glass Card Blur Effect */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 100}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          {/* iOS Specular Top Sheen Reflection */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.4 }}
            style={styles.topSheen}
            pointerEvents="none"
          />

          {/* iOS Sheet Drag Handle Capsule */}
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          {/* 1. Minimalist Apple Siri Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.siriHeaderGroup}>
              <Animated.View
                style={[
                  styles.siriLiveDot,
                  isListening && [
                    styles.siriLiveDotActive,
                    {
                      backgroundColor: theme.primary,
                      transform: [{ scale: dotPulseAnim }],
                    },
                  ],
                ]}
              />
              <Text style={styles.siriTitleText}>Techna</Text>
              <Text style={styles.siriSubtitleText}>{isListening ? 'Listening' : 'Ready'}</Text>
            </View>

            <View style={styles.headerRightGroup}>
              {taskTitle.trim().length > 0 && currentStep !== 'done' && (
                <TouchableOpacity
                  style={[styles.topSavePill, { backgroundColor: theme.primary }]}
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
                size={34}
                iconSize={19}
                color="#A0A0B2"
                backgroundColor="rgba(255, 255, 255, 0.10)"
                onPress={handleModalClose}
              />
            </View>
          </View>

          {/* 2. Hero 3D Companion Robot (Big & Spaciously Floating) */}
          <View style={styles.orbWrapper}>
            <TechnaOrb
              variant="full"
              isListening={isListening}
              faceMode={robotFaceMode}
              onPress={() => {
                if (isListening) {
                  stopSpeechRecognition();
                  setRobotFaceMode('idle');
                } else {
                  setRobotFaceMode('waves');
                  startSpeechRecognition();
                }
              }}
              size={180}
            />
          </View>

          {/* Equalizer Audio Waveform Visualizer */}
          <VoiceWaveform isListening={isListening} color={theme.primaryLight || '#38BDF8'} />

          {/* Voice Notice / Simulator Assistant Banner */}
          {!!voiceNotice && !isListening && (
            <View style={styles.noticeCard}>
              <View style={styles.noticeCardHeader}>
                <Ionicons name="hardware-chip-outline" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
                <Text style={styles.noticeCardTitle}>iOS Simulator Voice Notice</Text>
              </View>
              <Text style={styles.noticeCardBody} numberOfLines={2}>
                {voiceNotice}
              </Text>
              <View style={styles.noticeCardActions}>
                <TouchableOpacity
                  style={[styles.noticeActionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => simulateVoiceInput('Doctor appointment tomorrow at 10 AM high priority')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.noticeActionBtnText}>Try Voice Demo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.noticeActionSecondaryBtn}
                  onPress={() => {
                    robotAlert(
                      'Live Microphone Testing',
                      'To test real live microphone recognition with your Mac microphone:\n\n1. Press "w" in your Expo terminal or open http://localhost:8081 in Chrome/Safari.\n2. Tap the Techna microphone to speak freely!\n\nOr test on a physical iPhone/Android device with Expo Go.',
                      [{ text: 'Got It' }],
                      { type: 'info' }
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="globe-outline" size={13} color="#93C5FD" style={{ marginRight: 4 }} />
                  <Text style={styles.noticeActionSecondaryText}>Live Mic on Web</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 3. Clean Siri Query / Realtime Transcript with Smooth Morph */}
          <Animated.View
            style={[
              styles.transcriptContainer,
              {
                opacity: contentFadeAnim,
                transform: [{ translateY: contentTranslateAnim }],
              },
            ]}
          >
            {currentStep === 'done' ? (
              <Animated.View
                style={[
                  styles.centerStatusGroup,
                  {
                    transform: [{ scale: donePopAnim }],
                    opacity: donePopAnim,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={34} color="#34D399" style={{ marginBottom: 6 }} />
                <Text style={styles.siriHeroPrompt}>Task Scheduled</Text>
                <Text style={styles.siriSubPrompt}>&ldquo;{taskTitle}&rdquo;</Text>
              </Animated.View>
            ) : taskTitle ? (
              <View style={styles.recognizedGroup}>
                <Text style={styles.taskTitleHeadline} numberOfLines={2}>
                  &ldquo;{taskTitle}&rdquo;
                </Text>
                <View style={styles.taskMetaRow}>
                  <View style={styles.metaChip}>
                    <Ionicons name="calendar-outline" size={13} color="#38BDF8" style={{ marginRight: 5 }} />
                    <Text style={styles.metaChipText}>{selectedDate} • {selectedTimeRange}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="flag-outline" size={13} color="#EC4899" style={{ marginRight: 5 }} />
                    <Text style={styles.metaChipText}>{selectedPriority.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            ) : liveTranscript ? (
              <Text style={[styles.liveTranscriptText, { color: theme.primaryLight }]} numberOfLines={3}>
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

            {/* Quick Voice / Text Input Row when active */}
            {currentStep !== 'done' && (
              <View style={styles.quickInputSection}>
                <View style={styles.inputBarRow}>
                  <TextInput
                    style={styles.textInputBar}
                    placeholder={isListening ? "Listening... or type command" : "Type or dictate task details..."}
                    placeholderTextColor="rgba(255, 255, 255, 0.42)"
                    value={manualInputText}
                    onChangeText={setManualInputText}
                    onSubmitEditing={() => {
                      if (manualInputText.trim()) {
                        handleSpokenInput(manualInputText.trim());
                        setManualInputText('');
                      }
                    }}
                    returnKeyType="done"
                  />
                  {manualInputText.trim().length > 0 ? (
                    <TouchableOpacity
                      style={[styles.sendInputBtn, { backgroundColor: theme.primary }]}
                      onPress={() => {
                        playSpinnerTickSound(1100);
                        handleSpokenInput(manualInputText.trim());
                        setManualInputText('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.micToggleBtn,
                        isListening
                          ? { backgroundColor: '#EF4444' }
                          : { backgroundColor: theme.primary },
                      ]}
                      onPress={() => {
                        playSpinnerTickSound(1000);
                        if (isListening) {
                          stopSpeechRecognition();
                          setRobotFaceMode('idle');
                        } else {
                          startSpeechRecognition();
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={isListening ? "mic" : "mic-outline"} size={17} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Quick Assistant Suggestion Chips */}
                {!taskTitle && (
                  <View style={styles.suggestionChipsRow}>
                    {[
                      'Doctor tomorrow 10am',
                      'Gym today 6pm',
                      'Review project tomorrow 2pm',
                    ].map((chip) => (
                      <TouchableOpacity
                        key={chip}
                        style={styles.suggestionChip}
                        onPress={() => {
                          playSpinnerTickSound(900);
                          simulateVoiceInput(chip);
                        }}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="sparkles-outline" size={11} color="#38BDF8" style={{ marginRight: 4 }} />
                        <Text style={styles.suggestionChipText}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Conflict Alert (if any) */}
          {occupiedWarning && conflictingInfo && (
            <View style={styles.conflictAlertCard}>
              <View style={styles.conflictHeader}>
                <Ionicons name="alert-circle" size={16} color="#F87171" style={{ marginRight: 6 }} />
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
                  <Ionicons name="swap-horizontal" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.conflictShiftText}>
                    Shift to {conflictingInfo.nextAvailableSlot.rangeString}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom spacing anchor */}
          <View style={{ height: 8 }} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 4, 10, 0.62)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: Math.min(screenHeight * 0.82, 740),
    minHeight: 560,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(22, 18, 36, 0.68)' : 'rgba(18, 14, 28, 0.92)',
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    paddingHorizontal: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  sheetHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginRight: 8,
  },
  siriSubtitleText: {
    color: '#9E9EB2',
    fontSize: 13,
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

  // 2. Hero Techna Robot Companion
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 10,
  },

  // 3. Dynamic Siri Headline / Transcript
  transcriptContainer: {
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  centerStatusGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  siriHeroPrompt: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  siriSubPrompt: {
    fontSize: 15,
    color: '#A2A2B8',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  heroTextGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTranscriptText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#38BDF8',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  recognizedGroup: {
    alignItems: 'center',
  },
  taskTitleHeadline: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 10,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 12,
  },
  metaChipText: {
    fontSize: 13,
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
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    gap: 6,
    marginBottom: 6,
  },
  waveformBar: {
    width: 4.5,
    height: 26,
    borderRadius: 2.5,
  },
  noticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    alignSelf: 'center',
  },
  noticePillText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  noticeCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.28)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  noticeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  noticeCardTitle: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeCardBody: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 15,
  },
  noticeCardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  noticeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 11,
    borderRadius: 12,
  },
  noticeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  noticeActionSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: 5.5,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  noticeActionSecondaryText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
  },
  quickInputSection: {
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  inputBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 4,
  },
  textInputBar: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 6,
  },
  sendInputBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  suggestionChipText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
});
