import { Task } from '../types/task';

export interface ScheduleBlock {
  startMin: number;
  endMin: number;
  title: string;
  taskId?: string;
  task?: Task;
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
  conflictingTask?: Task;
  conflictingTaskId?: string;
}

export interface AvailableSlot {
  startHour: number;
  rangeString: string;
}

/**
 * Parses time strings such as "10 AM", "6:30 pm", "8pm", "11:15 am", "06:00 PM", or "18:00" into 24-hour hour, minute, and total minutes.
 */
export function parseTimeString(text: string): { hour: number; minute: number; isPm: boolean; totalMinutes: number } | null {
  if (!text) return null;

  // 1. 12-hour AM/PM format (e.g. "06:00 PM", "6:30 pm", "8pm", "11:15 am")
  const ampmMatch = text.match(/\b(0?[1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3].toLowerCase() === 'pm';

    if (isPm && hour !== 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;

    return {
      hour,
      minute,
      isPm,
      totalMinutes: hour * 60 + minute,
    };
  }

  // 2. 24-hour military format (e.g. "18:00", "09:30")
  const milMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (milMatch) {
    const hour = parseInt(milMatch[1], 10);
    const minute = parseInt(milMatch[2], 10);
    return {
      hour,
      minute,
      isPm: hour >= 12,
      totalMinutes: hour * 60 + minute,
    };
  }

  return null;
}

/**
 * Extracts start and end minutes from time strings or ranges (e.g. "06:00 PM - 07:00 PM" or "6:00 PM").
 */
export function extractTimeRangeFromText(
  text: string
): { startMin: number; endMin: number } | null {
  if (!text) return null;

  const regex = /\b(0?[1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/gi;
  const matches = [...text.matchAll(regex)];

  if (matches.length >= 2) {
    const start = parseTimeString(matches[0][0]);
    const end = parseTimeString(matches[1][0]);
    if (start && end) {
      let endMinutes = end.totalMinutes;
      if (endMinutes <= start.totalMinutes) endMinutes += 1440;
      return { startMin: start.totalMinutes, endMin: endMinutes };
    }
  }

  const single = parseTimeString(text);
  if (single) {
    return { startMin: single.totalMinutes, endMin: single.totalMinutes + 60 };
  }

  return null;
}

/**
 * Checks if a task's dueDate string matches a target date string or Date object.
 */
export function isDateMatch(dueDate: string, targetDate?: string | Date): boolean {
  if (!targetDate || !dueDate) return true;

  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth();

  const tm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tmDay = tm.getDate();
  const tmMonth = tm.getMonth();

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  function parseDateInfo(input: string | Date) {
    if (input instanceof Date) {
      return {
        day: input.getDate(),
        month: input.getMonth(),
        isToday: input.getDate() === todayDay && input.getMonth() === todayMonth,
        isTomorrow: input.getDate() === tmDay && input.getMonth() === tmMonth,
      };
    }

    const str = String(input).trim().toLowerCase();
    const isToday = /\btoday\b/i.test(str);
    const isTomorrow = /\btomorrow\b/i.test(str);

    let day: number | undefined;
    let month: number | undefined;

    const mMatch =
      str.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*(\d{1,2})\b/i) ||
      str.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)/i);

    if (mMatch) {
      if (isNaN(parseInt(mMatch[1], 10))) {
        month = monthNames.indexOf(mMatch[1].slice(0, 3).toLowerCase());
        day = parseInt(mMatch[2], 10);
      } else {
        day = parseInt(mMatch[1], 10);
        month = monthNames.indexOf(mMatch[2].slice(0, 3).toLowerCase());
      }
    }

    if (isToday) {
      day = todayDay;
      month = todayMonth;
    } else if (isTomorrow) {
      day = tmDay;
      month = tmMonth;
    }

    return { str, day, month, isToday, isTomorrow };
  }

  // Extract date portion if separated by • or -
  let datePart = dueDate;
  if (dueDate.includes('•')) {
    datePart = dueDate.split('•')[0].trim();
  }

  const targetInfo = parseDateInfo(targetDate);
  const dueInfo = parseDateInfo(datePart);

  // If dueDate does not contain any date terms (e.g. pure time string), match active date
  if (!dueInfo.isToday && !dueInfo.isTomorrow && dueInfo.day === undefined) {
    return true;
  }

  // Exact string match
  if (dueInfo.str && targetInfo.str && dueInfo.str === targetInfo.str) {
    return true;
  }

  // Day & Month match
  if (dueInfo.day !== undefined && targetInfo.day !== undefined) {
    return dueInfo.day === targetInfo.day && dueInfo.month === targetInfo.month;
  }

  // Today / Tomorrow keyword match
  if (dueInfo.isToday && targetInfo.isToday) return true;
  if (dueInfo.isTomorrow && targetInfo.isTomorrow) return true;

  return false;
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

export function computeTimeRange(
  startHour: number,
  durationMinutes: number,
  startMinute: number = 0
): TimeRangeResult {
  const startMinTotal = startHour * 60 + startMinute;
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
 * Extracts occupied schedule blocks strictly from existing user tasks with a valid dueDate.
 * Filters out completed tasks and checks date matching when targetDate is provided.
 */
export function getOccupiedSchedule(
  existingTasks: Task[] = [],
  targetDate?: string | Date
): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];

  if (existingTasks && existingTasks.length > 0) {
    existingTasks.forEach((t) => {
      if (t.isCompleted) return;
      if (!t.dueDate) return;
      if (targetDate && !isDateMatch(t.dueDate, targetDate)) return;

      const range = extractTimeRangeFromText(t.dueDate);
      if (range) {
        blocks.push({
          startMin: range.startMin,
          endMin: range.endMin,
          title: t.title.slice(0, 30),
          taskId: t.id,
          task: t,
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
      return {
        occupied: true,
        title: b.title,
        conflictingTask: b.task,
        conflictingTaskId: b.taskId,
      };
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
 * Finds the closest upcoming available free slot to shift an occupied task into.
 */
export function findNextAvailableSlot(
  occupiedSchedule: ScheduleBlock[],
  afterStartMin: number,
  durationMin: number = 60
): AvailableSlot | null {
  const startH = Math.max(6, Math.floor(afterStartMin / 60) + 1);
  for (let h = startH; h <= 22; h++) {
    const sMin = h * 60;
    const res = checkSlotConflict(sMin, durationMin, occupiedSchedule);
    if (!res.occupied) {
      const slot = computeTimeRange(h, durationMin);
      return { startHour: h, rangeString: slot.rangeString };
    }
  }
  // Wrap around earlier in the day if necessary
  for (let h = 6; h < startH; h++) {
    const sMin = h * 60;
    const res = checkSlotConflict(sMin, durationMin, occupiedSchedule);
    if (!res.occupied) {
      const slot = computeTimeRange(h, durationMin);
      return { startHour: h, rangeString: slot.rangeString };
    }
  }
  return null;
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
