import { useState, useEffect } from 'react';

export type RobotAlertPosition = 'left' | 'right' | 'middle';
export type RobotAlertType = 'required' | 'warning' | 'error' | 'info' | 'success';

export interface RobotAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface RobotAlertOptions {
  title: string;
  message: string;
  position?: RobotAlertPosition;
  type?: RobotAlertType;
  buttons?: RobotAlertButton[];
  onDismiss?: () => void;
  speak?: boolean;
}

type AlertListener = (alert: RobotAlertOptions | null) => void;

let currentAlert: RobotAlertOptions | null = null;
const listeners = new Set<AlertListener>();

// Cycle positions automatically if not explicitly given: left -> middle -> right -> left...
const POSITIONS: RobotAlertPosition[] = ['middle', 'left', 'right'];
let positionIndex = 0;

export function showRobotAlert(options: RobotAlertOptions) {
  const chosenPosition = options.position || POSITIONS[positionIndex % POSITIONS.length];
  positionIndex++;

  currentAlert = {
    ...options,
    position: chosenPosition,
    speak: options.speak ?? true,
  };

  listeners.forEach((listener) => listener(currentAlert));
}

export function hideRobotAlert() {
  currentAlert = null;
  listeners.forEach((listener) => listener(null));
}

export function robotAlert(
  title: string,
  message: string,
  buttons?: RobotAlertButton[],
  extra?: { position?: RobotAlertPosition; type?: RobotAlertType; speak?: boolean }
) {
  showRobotAlert({
    title,
    message,
    buttons,
    position: extra?.position,
    type: extra?.type,
    speak: extra?.speak ?? true,
  });
}

export function useRobotAlert() {
  const [alert, setAlert] = useState<RobotAlertOptions | null>(currentAlert);

  useEffect(() => {
    const listener: AlertListener = (newAlert) => {
      setAlert(newAlert ? { ...newAlert } : null);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    alert,
    showAlert: showRobotAlert,
    hideAlert: hideRobotAlert,
  };
}
