import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';

const STORAGE_KEY_PREFIX = '@ai_tasks_';

const initialDemoTasks: Task[] = [
  {
    id: 'demo-1',
    title: 'Review client project specifications',
    description: 'Go over the feature requirements and wireframes shared by the client.',
    category: 'Work',
    priority: 'high',
    dueDate: 'Today, 5:00 PM',
    isCompleted: false,
    createdAt: new Date().toISOString(),
    createdVia: 'manual',
    clientId: 'client_demo',
  },
  {
    id: 'demo-2',
    title: 'Voice Task: Schedule team sync call',
    description: 'Added via voice input: "Schedule team sync call for tomorrow morning at 10 AM"',
    category: 'Work',
    priority: 'medium',
    dueDate: 'Tomorrow, 10:00 AM',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdVia: 'voice',
    voiceTranscription: 'Schedule team sync call for tomorrow morning at 10 AM',
    clientId: 'client_demo',
  },
  {
    id: 'demo-3',
    title: 'Buy groceries for the week',
    description: 'Vegetables, fruits, and almond milk',
    category: 'Personal',
    priority: 'low',
    dueDate: 'Saturday',
    isCompleted: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdVia: 'manual',
    clientId: 'client_demo',
  },
];

export class TaskStorageService {
  private getStorageKey(clientId?: string): string {
    return `${STORAGE_KEY_PREFIX}${clientId || 'default'}`;
  }

  async getTasks(clientId?: string): Promise<Task[]> {
    try {
      const key = this.getStorageKey(clientId);
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        // Seed initial demo data on first load
        await this.saveAllTasks(initialDemoTasks, clientId);
        return initialDemoTasks;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading tasks:', error);
      return [];
    }
  }

  async saveAllTasks(tasks: Task[], clientId?: string): Promise<void> {
    try {
      const key = this.getStorageKey(clientId);
      await AsyncStorage.setItem(key, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  async addTask(task: Task, clientId?: string): Promise<Task[]> {
    const tasks = await this.getTasks(clientId);
    const updated = [task, ...tasks];
    await this.saveAllTasks(updated, clientId);
    return updated;
  }

  async updateTask(taskId: string, updates: Partial<Task>, clientId?: string): Promise<Task[]> {
    const tasks = await this.getTasks(clientId);
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    await this.saveAllTasks(updated, clientId);
    return updated;
  }

  async deleteTask(taskId: string, clientId?: string): Promise<Task[]> {
    const tasks = await this.getTasks(clientId);
    const updated = tasks.filter((t) => t.id !== taskId);
    await this.saveAllTasks(updated, clientId);
    return updated;
  }
}

export const taskStorage = new TaskStorageService();
