import React from 'react';
import { Modal } from 'react-native';
import { Task } from '../types/task';
import { CreateTaskScreen } from './CreateTaskScreen';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => void;
  initialVoiceActive?: boolean;
  existingTasks?: Task[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onSave,
  initialVoiceActive = false,
  existingTasks = [],
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <CreateTaskScreen
        onClose={onClose}
        onSave={onSave}
        initialVoiceActive={initialVoiceActive}
        existingTasks={existingTasks}
      />
    </Modal>
  );
};

