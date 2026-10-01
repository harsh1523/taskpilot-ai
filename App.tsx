import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';
import { Task, TaskFilter } from './src/types/task';
import { taskStorage } from './src/services/taskStorage';
import { colors, spacing, padding, radius, fontSizes, fontWeights, commonStyles, ThemeProvider, useTheme } from './src/theme';
import { playSpinnerTickSound, playMacTrashSound } from './src/services/soundEffects';
import { Header } from './src/components/Header';
import { TaskItem } from './src/components/TaskItem';

import { CreateTaskModal } from './src/components/CreateTaskModal';
import { VoiceTaskModal } from './src/components/VoiceTaskModal';
import { OnboardingScreen } from './src/components/OnboardingScreen';
import { DateCapsulePicker, DateItem } from './src/components/DateCapsulePicker';
import { SplashScreenView } from './src/components/SplashScreenView';
import { TechnaOrb } from './src/components/common/TechnaOrb';

// Prevent native splash screen from auto hiding before app initializes
SplashScreen.preventAutoHideAsync().catch(() => {});

const ONBOARDING_KEY = '@ai_task_manager_has_seen_onboarding_v1';

function MainApp() {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('all');
  const [selectedDateId, setSelectedDateId] = useState<string>(() =>
    String(new Date().getDate()).padStart(2, '0')
  );
  const currentClient = 'default_workspace';

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await Promise.all([checkOnboarding(), loadTasks()]);
    } finally {
      // Hide OS native splash so animated branded splash can display smoothly
      await SplashScreen.hideAsync().catch(() => {});
    }
  };

  const checkOnboarding = async () => {
    try {
      const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
      setShowOnboarding(seen === null ? true : false);
    } catch {
      setShowOnboarding(false);
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}

    setShowOnboarding(false);
  };

  const loadTasks = async () => {
    setLoading(true);
    const loaded = await taskStorage.getTasks(currentClient);
    // Purge any legacy demo tasks so only real user data is stored
    const userOnlyTasks = loaded.filter((t) => !t.id.startsWith('demo-'));
    if (userOnlyTasks.length !== loaded.length) {
      await taskStorage.saveAllTasks(userOnlyTasks, currentClient);
    }
    setTasks(userOnlyTasks);
    setLoading(false);
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const updated = await taskStorage.updateTask(
      id,
      { isCompleted: !task.isCompleted },
      currentClient
    );
    setTasks(updated);
  };

  const handleDeleteTask = async (id: string) => {
    playMacTrashSound();
    const updated = await taskStorage.deleteTask(id, currentClient);
    setTasks(updated);
  };

  const handleShiftTask = async (taskId: string, newDueDate: string) => {
    const updated = await taskStorage.updateTask(
      taskId,
      { dueDate: newDueDate },
      currentClient
    );
    setTasks(updated);
  };

  const handleSaveNewTask = async (
    newTaskData: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>
  ) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isCompleted: false,
      clientId: currentClient,
    };
    const updated = await taskStorage.addTask(newTask, currentClient);
    setTasks(updated);
  };

  // Filtered tasks and counts
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search matching
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Filter matching
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'pending') return !t.isCompleted;
      if (selectedFilter === 'completed') return t.isCompleted;
      return t.category === selectedFilter;
    });
  }, [tasks, searchQuery, selectedFilter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: tasks.length,
      pending: tasks.filter((t) => !t.isCompleted).length,
      completed: tasks.filter((t) => t.isCompleted).length,
      Work: tasks.filter((t) => t.category === 'Work').length,
      Personal: tasks.filter((t) => t.category === 'Personal').length,
      Urgent: tasks.filter((t) => t.category === 'Urgent').length,
      Health: tasks.filter((t) => t.category === 'Health').length,
      Finance: tasks.filter((t) => t.category === 'Finance').length,
    };
    return map;
  }, [tasks]);

  // Show Splash Screen on startup
  if (isSplashVisible) {
    return (
      <SafeAreaProvider>
        <SplashScreenView onFinish={() => setIsSplashVisible(false)} />
      </SafeAreaProvider>
    );
  }

  // Show Onboarding Screen if active
  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onStart={handleFinishOnboarding} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#07070A" />

      {/* Dynamic Ambient Aurora Glow matching active color theme */}
      <LinearGradient
        colors={theme.gradients.ambient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      {/* App Header with Interactive Filters */}
      <Header
        totalCount={counts.all || 0}
        pendingCount={counts.pending || 0}
        completedCount={counts.completed || 0}
        activeFilter={selectedFilter as any}
        onSelectFilter={(f) => setSelectedFilter(f)}
      />

      {/* Date Capsule Strip */}
      <DateCapsulePicker
        selectedId={selectedDateId}
        onSelectDate={(item: DateItem) => setSelectedDateId(item.day)}
        onAddDate={() => {
          playSpinnerTickSound(900);
          setCreateModalVisible(true);
        }}
      />

      {/* Frosted Glass Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={17} color={theme.cyan || theme.primaryLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor="#6E6E82"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#8A8A9E" />
          </TouchableOpacity>
        )}
      </View>

      {/* Task List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTask}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          decelerationRate="normal"
          bounces={true}
          overScrollMode="always"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.primaryMuted, borderColor: theme.primaryGlow }]}>
                <Ionicons name="sparkles" size={32} color={theme.primaryLight} />
              </View>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try searching with different keywords'
                  : 'Tap "+ Create Task" below to add a task'}
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Action Dock with Glowing Create Task & Techna Voice Button */}
      <View style={styles.bottomDock}>
        <TouchableOpacity
          style={[styles.createTaskBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
          onPress={() => {
            playSpinnerTickSound(900);
            setCreateModalVisible(true);
          }}
          activeOpacity={0.88}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.createTaskBtnText}>Create Task</Text>
        </TouchableOpacity>

        {/* Techna Voice Assistant Robot Face with Blinking Eyes */}
        <TechnaOrb
          variant="face"
          size={54}
          isListening={false}
          onPress={() => {
            playSpinnerTickSound(980);
            setVoiceModalVisible(true);
          }}
        />
      </View>

      {/* Create Task Modal with Manual & Voice Entry in One */}
      <CreateTaskModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleSaveNewTask}
        existingTasks={tasks}
        onShiftTask={handleShiftTask}
      />

      {/* Techna Voice Task Modal */}
      <VoiceTaskModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSave={handleSaveNewTask}
        existingTasks={tasks}
        onShiftTask={handleShiftTask}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    ...commonStyles.flex1,
    backgroundColor: '#07070A',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  searchContainer: {
    ...commonStyles.row,
    backgroundColor: 'rgba(16, 16, 26, 0.8)',
    marginHorizontal: padding.screenHorizontal,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.base,
  },
  searchInput: {
    ...commonStyles.flex1,
    height: 48,
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
  },
  listContent: {
    paddingHorizontal: padding.screenHorizontal,
    paddingBottom: 150,
  },
  centerContainer: {
    ...commonStyles.center,
    ...commonStyles.flex1,
  },
  loadingText: {
    color: '#8A8A96',
    marginTop: spacing.base,
    fontSize: fontSizes.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    ...commonStyles.center,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  emptyTitle: {
    fontSize: fontSizes.titleSm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.md,
    color: '#7E7E94',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomDock: {
    position: 'absolute',
    bottom: spacing.xxxl,
    left: padding.screenHorizontal,
    right: padding.screenHorizontal,
    ...commonStyles.row,
    gap: spacing.lg,
  },
  createTaskBtn: {
    ...commonStyles.flex1,
    ...commonStyles.rowCenter,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xl - 2,
    borderRadius: radius.round,
    gap: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  createTaskBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.subtitle,
    fontWeight: fontWeights.heavy,
    letterSpacing: 0.3,
  },
  technaVoiceFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  technaVoiceGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    ...commonStyles.center,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
});

