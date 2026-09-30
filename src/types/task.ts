export type Priority = 'urgent' | 'high' | 'medium' | 'low';


export type Category = 'Work' | 'Personal' | 'Urgent' | 'Health' | 'Finance' | 'General';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: Category;
  priority: Priority;
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
  createdVia: 'manual' | 'voice';
  voiceTranscription?: string;
  // Multi-client / multi-tenant readiness
  clientId?: string;
  userId?: string;
}

export type TaskFilter = 'all' | 'pending' | 'completed' | Category;
