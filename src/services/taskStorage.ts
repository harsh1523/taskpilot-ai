import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';

const STORAGE_KEY_PREFIX = '@ai_tasks_';

export class TaskStorageService {
  private getStorageKey(clientId?: string): string {
    return `${STORAGE_KEY_PREFIX}${clientId || 'default'}`;
  }

  async getTasks(clientId?: string): Promise<Task[]> {
    try {
      const key = this.getStorageKey(clientId);
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        return [];
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
