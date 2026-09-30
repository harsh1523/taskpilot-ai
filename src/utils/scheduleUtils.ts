import { Task } from '../types/task';

export interface ScheduleBlock {
  startMin: number;
  endMin: number;
  title: string;
}

export interface TimeRangeResult {
  startHour: number;
  startTime: string;
  endTime: string;
  rangeString: string;
  displayString: string;
  startMinutes: number;
  endMinutes: number;
}

export interface SlotConflictResult {
  occupied: boolean;
  title: string;
}

export interface AvailableSlot {
  startHour: number;
  rangeString: string;
}

/**
 * Default mock schedule blocks to simulate real-world calendar commitments.
 */
export const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  { startMin: 9 * 60, endMin: 10 * 60, title: 'Team Sync' },
  { startMin: 13 * 60, endMin: 14 * 60, title: 'Client Review' },
  { startMin: 16 * 60, endMin: 17 * 60, title: 'Sprint Retrospective' },
];

/**
 * Parses time strings such as "10 AM", "6:30 pm", "8pm", "11:15 am" into 24-hour hour, minute, and total minutes.
 */
export function parseTimeString(text: string): { hour: number; minute: number; isPm: boolean; totalMinutes: number } | null {
  if (!text) return null;
  const timeMatch = text.match(/\b([1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (!timeMatch) return null;

  let hour = parseInt(timeMatch[1], 10);
  const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const isPm = timeMatch[3].toLowerCase() === 'pm';

  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;

  return {
    hour,
    minute,
    isPm,
    totalMinutes: hour * 60 + minute,
  };
}

/**
 * Converts total minutes from midnight into 12-hour AM/PM string (e.g. 540 -> "09:00 AM").
 */
export function minutesToAmPm(totalMinutes: number): string {
  let h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hh = h < 10 ? `0${h}` : `${h}`;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${hh}:${mm} ${ampm}`;
}

/**
 * Computes human-readable time range string, display label with duration, and minute boundaries.
 */
export function computeTimeRange(startHour: number, durationMinutes: number): TimeRangeResult {
  const startMinTotal = startHour * 60;
  const endMinTotal = startMinTotal + durationMinutes;

  const startTime = minutesToAmPm(startMinTotal);
  const endTime = minutesToAmPm(endMinTotal);

  const durLabel =
    durationMinutes < 60
      ? `${durationMinutes}m`
      : durationMinutes % 60 === 0
      ? `${durationMinutes / 60}h`
      : `${(durationMinutes / 60).toFixed(1)}h`;

  return {
    startHour,
    startTime,
    endTime,
    rangeString: `${startTime} - ${endTime}`,
    displayString: `${startTime} - ${endTime} (${durLabel})`,
    startMinutes: startMinTotal,
    endMinutes: endMinTotal,
  };
}

/**
 * Extracts occupied schedule blocks combining default commitments and all existing tasks with a valid dueDate.
 */
export function getOccupiedSchedule(existingTasks: Task[] = []): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [...DEFAULT_SCHEDULE_BLOCKS];

  if (existingTasks && existingTasks.length > 0) {
    existingTasks.forEach((t) => {
      if (!t.dueDate) return;
      const parsed = parseTimeString(t.dueDate);
      if (parsed) {
        blocks.push({
          startMin: parsed.totalMinutes,
          endMin: parsed.totalMinutes + 60,
          title: t.title.slice(0, 20),
        });
      }
    });
  }

  return blocks;
}

/**
 * Checks if a proposed time range overlaps with any occupied block in the schedule.
 */
export function checkSlotConflict(
  startMin: number,
  durationMin: number,
  occupiedSchedule: ScheduleBlock[]
): SlotConflictResult {
  const endMin = startMin + durationMin;
  for (const b of occupiedSchedule) {
    if (Math.max(startMin, b.startMin) < Math.min(endMin, b.endMin)) {
      return { occupied: true, title: b.title };
    }
  }
  return { occupied: false, title: '' };
}

/**
 * Calculates all unoccupied 1-hour slots between minHour and maxHour.
 */
export function computeAvailableSlots(
  occupiedSchedule: ScheduleBlock[],
  durationMin: number = 60,
  minHour: number = 6,
  maxHour: number = 22
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  for (let h = minHour; h <= maxHour; h++) {
    const sMin = h * 60;
    const res = checkSlotConflict(sMin, durationMin, occupiedSchedule);
    if (!res.occupied) {
      const slot = computeTimeRange(h, durationMin);
      slots.push({ startHour: h, rangeString: slot.rangeString });
    }
  }
  return slots;
}

/**
 * Compares two dates ignoring time to check if they fall on the exact same calendar day.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formats a Date object into standard readable text (e.g. "Wed, 30 Sep" or "Wed, 30 Sep 2026").
 */
export function formatDateLabel(d: Date, includeYear: boolean = false): string {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.toLocaleDateString('en-US', { day: includeYear ? '2-digit' : 'numeric' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  if (includeYear) {
    return `${weekday}, ${day} ${month} ${d.getFullYear()}`;
  }
  return `${weekday}, ${day} ${month}`;
}
