import { Category, Priority, Task } from '../types/task';

export interface ParsedVoiceResult {
  title: string;
  category: Category;
  priority: Priority;
  dueDate?: string;
  rawText: string;
}

export interface TimeSlotOption {
  id: string;
  label: string;
  timeRange: string;
  duration: string;
  icon: string;
  subtitle?: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
}

export const AVAILABLE_TIME_SLOTS: TimeSlotOption[] = [
  { id: 'morning', label: 'Morning Focus', timeRange: '09:00 AM - 12:00 PM', duration: '3 hrs', icon: 'sunny-outline', subtitle: 'Peak clarity & focus', period: 'morning' },
  { id: 'afternoon', label: 'Afternoon Sprint', timeRange: '02:00 PM - 04:30 PM', duration: '2.5 hrs', icon: 'partly-sunny-outline', subtitle: 'Productive work', period: 'afternoon' },
  { id: 'evening', label: 'Evening Session', timeRange: '06:00 PM - 08:30 PM', duration: '2.5 hrs', icon: 'cloudy-night-outline', subtitle: 'Review & completion', period: 'evening' },
  { id: 'night', label: 'Night Wrap-up', timeRange: '09:00 PM - 10:30 PM', duration: '1.5 hrs', icon: 'moon-outline', subtitle: 'Relax & plan ahead', period: 'night' },
];

export const AVAILABLE_DUE_DATES = [
  { id: 'today', label: 'Today', subtitle: 'Due today' },
  { id: 'tomorrow', label: 'Tomorrow', subtitle: 'Next day' },
  { id: 'friday', label: 'This Friday', subtitle: 'End of week' },
  { id: 'weekend', label: 'Weekend', subtitle: 'Sat / Sun' },
  { id: 'next_week', label: 'Next Week', subtitle: 'Next Mon' },
];


export function parseSpokenTask(spokenText: string): { title: string; category: Category } {
  const text = spokenText.trim();
  const lower = text.toLowerCase();

  let category: Category = 'Work';
  if (lower.includes('meeting') || lower.includes('client') || lower.includes('presentation') || lower.includes('email') || lower.includes('report') || lower.includes('project') || lower.includes('code') || lower.includes('app')) {
    category = 'Work';
  } else if (lower.includes('doctor') || lower.includes('gym') || lower.includes('workout') || lower.includes('medicine') || lower.includes('walk') || lower.includes('yoga')) {
    category = 'Health';
  } else if (lower.includes('buy') || lower.includes('groceries') || lower.includes('home') || lower.includes('family') || lower.includes('friend') || lower.includes('call mom')) {
    category = 'Personal';
  } else if (lower.includes('invoice') || lower.includes('payment') || lower.includes('budget') || lower.includes('bank') || lower.includes('bill')) {
    category = 'Finance';
  }

  let clean = text
    .replace(/^(create a task to|create a task for|add a task to|add a task for|remind me to|i need to|please)\s+/i, '')
    .trim();

  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  } else {
    clean = text;
  }

  return { title: clean, category };
}

export function extractSpokenDueDate(text: string): { dateObj: Date; dateLabel: string } | null {
  const lower = text.toLowerCase();
  const now = new Date();

  // Helper for upcoming weekday
  const getUpcomingWeekday = (targetDay: number, isNextWeek: boolean = false): Date => {
    const currentDay = now.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    if (isNextWeek) diff += 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  };

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  // 1. Month first with day number: "September 5", "Oct 12th", "Nov 5 2026", "due on Oct 2nd"
  const monthFirstRegex = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/i;
  const mfMatch = text.match(monthFirstRegex);
  if (mfMatch) {
    const mPrefix = mfMatch[1].slice(0, 3).toLowerCase();
    const mIdx = monthNames.indexOf(mPrefix);
    const dNum = parseInt(mfMatch[2], 10);
    const yNum = mfMatch[3] ? parseInt(mfMatch[3], 10) : now.getFullYear();
    if (mIdx !== -1 && dNum >= 1 && dNum <= 31) {
      const d = new Date(yNum, mIdx, dNum);
      return {
        dateObj: d,
        dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      };
    }
  }

  // 2. Day number first with month: "5th of September", "5 September", "28th Sept", "1st Oct"
  const dayFirstRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?\b/i;
  const dfMatch = text.match(dayFirstRegex);
  if (dfMatch) {
    const dNum = parseInt(dfMatch[1], 10);
    const mPrefix = dfMatch[2].slice(0, 3).toLowerCase();
    const mIdx = monthNames.indexOf(mPrefix);
    const yNum = dfMatch[3] ? parseInt(dfMatch[3], 10) : now.getFullYear();
    if (mIdx !== -1 && dNum >= 1 && dNum <= 31) {
      const d = new Date(yNum, mIdx, dNum);
      return {
        dateObj: d,
        dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      };
    }
  }

  // 3. Day after tomorrow
  if (/\b(?:day\s+after\s+tomorrow)\b/i.test(lower)) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    return {
      dateObj: d,
      dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  }

  // 4. Tomorrow
  if (/\btomorrow\b/i.test(lower)) {
    const tm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return {
      dateObj: tm,
      dateLabel: 'Tomorrow',
    };
  }

  // 5. Today / Tonight
  if (/\b(?:today|tonight)\b/i.test(lower)) {
    return {
      dateObj: now,
      dateLabel: 'Today',
    };
  }

  // 6. In N days
  const inDaysMatch = lower.match(/\bin\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a couple of|a few)?\s*days?\b/i);
  if (inDaysMatch) {
    let numDays = 1;
    const word = inDaysMatch[1];
    if (word === 'one') numDays = 1;
    else if (word === 'two' || word === 'a couple of') numDays = 2;
    else if (word === 'three' || word === 'a few') numDays = 3;
    else if (word === 'four') numDays = 4;
    else if (word === 'five') numDays = 5;
    else if (word === 'six') numDays = 6;
    else if (word === 'seven') numDays = 7;
    else if (word && !isNaN(parseInt(word, 10))) numDays = parseInt(word, 10);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + numDays);
    return {
      dateObj: d,
      dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  }

  // 7. In a week / in N weeks
  const inWeeksMatch = lower.match(/\bin\s+(\d+|a|one|two|three)?\s*weeks?\b/i);
  if (inWeeksMatch) {
    let numWeeks = 1;
    const word = inWeeksMatch[1];
    if (word === 'two') numWeeks = 2;
    else if (word === 'three') numWeeks = 3;
    else if (word && !isNaN(parseInt(word, 10))) numWeeks = parseInt(word, 10);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + numWeeks * 7);
    return {
      dateObj: d,
      dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  }

  // 8. Weekdays: Monday through Sunday with optional "this" or "next"
  const weekdayMap: { [key: string]: number } = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
  };
  const weekdayMatch = lower.match(/\b(this|next)?\s*(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat)\b/i);
  if (weekdayMatch) {
    const isNext = weekdayMatch[1]?.toLowerCase() === 'next';
    const dayIdx = weekdayMap[weekdayMatch[2].toLowerCase()];
    if (dayIdx !== undefined) {
      const d = getUpcomingWeekday(dayIdx, isNext);
      return {
        dateObj: d,
        dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      };
    }
  }

  // 9. Weekend / Next Weekend
  if (/\bnext\s+weekend\b/i.test(lower)) {
    const d = getUpcomingWeekday(6, true);
    return {
      dateObj: d,
      dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  }
  if (/\b(?:weekend|this\s+weekend)\b/i.test(lower)) {
    const d = getUpcomingWeekday(6, false);
    return {
      dateObj: d,
      dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  }

  // 10. Next week
  if (/\bnext\s+week\b/i.test(lower)) {
    const d = getUpcomingWeekday(1, true); // Monday next week
    return {
      dateObj: d,
      dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  }

  // 11. End of week
  if (/\bend\s+of\s+(?:the\s+)?week\b/i.test(lower)) {
    const d = getUpcomingWeekday(5, false); // This Friday
    return {
      dateObj: d,
      dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  }

  // 12. Explicit "due date <number>" / "due on the <number>" / "due <number>" / "date <number>"
  const explicitDayNumMatch = lower.match(/\b(?:due\s+date\s*(?:is|on|to)?|due\s*(?:on|by|is)?|date\s*(?:is|on|to)?|deadline\s*(?:is|on|to)?)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (explicitDayNumMatch) {
    const dNum = parseInt(explicitDayNumMatch[1], 10);
    if (dNum >= 1 && dNum <= 31) {
      let targetMonth = now.getMonth();
      let targetYear = now.getFullYear();
      if (dNum < now.getDate()) {
        targetMonth += 1;
        if (targetMonth > 11) {
          targetMonth = 0;
          targetYear += 1;
        }
      }
      const d = new Date(targetYear, targetMonth, dNum);
      return {
        dateObj: d,
        dateLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      };
    }
  }

  return null;
}

export function parseSpokenDateAndTime(spokenText: string): {
  dateLabel?: string;
  timeSlotId?: string;
  timeSlotRange?: string;
} {
  const lower = spokenText.toLowerCase();

  // Detect Date using comprehensive extractor
  const parsedDate = extractSpokenDueDate(spokenText);
  const dateLabel = parsedDate?.dateLabel;

  // Detect Time Slot
  let matchedSlot: TimeSlotOption | undefined = undefined;
  if (lower.includes('morning') || lower.includes('9 am') || lower.includes('10 am') || lower.includes('9:00') || lower.includes('early')) {
    matchedSlot = AVAILABLE_TIME_SLOTS[0]; // Morning
  } else if (lower.includes('afternoon') || lower.includes('2 pm') || lower.includes('3 pm') || lower.includes('noon') || lower.includes('lunch')) {
    matchedSlot = AVAILABLE_TIME_SLOTS[1]; // Afternoon
  } else if (lower.includes('evening') || lower.includes('6 pm') || lower.includes('7 pm') || lower.includes('6:00') || lower.includes('sunset')) {
    matchedSlot = AVAILABLE_TIME_SLOTS[2]; // Evening
  } else if (lower.includes('night') || lower.includes('9 pm') || lower.includes('10 pm') || lower.includes('late')) {
    matchedSlot = AVAILABLE_TIME_SLOTS[3]; // Night
  }

  return {
    dateLabel,
    timeSlotId: matchedSlot?.id,
    timeSlotRange: matchedSlot?.timeRange,
  };
}

export function parseSpokenPriority(spokenText: string): Priority | null {
  const lower = spokenText.toLowerCase();
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical') || lower.includes('emergency')) {
    return 'urgent';
  }
  if (lower.includes('high') || lower.includes('important') || lower.includes('top priority')) {
    return 'high';
  }
  if (lower.includes('medium') || lower.includes('normal') || lower.includes('regular') || lower.includes('standard')) {
    return 'medium';
  }
  if (lower.includes('low') || lower.includes('later') || lower.includes('when free') || lower.includes('optional')) {
    return 'low';
  }
  return null;
}

export function parseVoiceToTask(spokenText: string): ParsedVoiceResult {
  const text = spokenText.trim();
  const lower = text.toLowerCase();

  // Detect priority
  let priority: Priority = 'medium';
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) {
    priority = 'urgent';
  } else if (lower.includes('high priority') || lower.includes('high')) {
    priority = 'high';
  } else if (lower.includes('low priority') || lower.includes('later') || lower.includes('low')) {
    priority = 'low';
  }

  const { title, category } = parseSpokenTask(text);
  const { dateLabel, timeSlotRange } = parseSpokenDateAndTime(text);

  let dueDate: string | undefined = undefined;
  if (dateLabel && timeSlotRange) {
    dueDate = `${dateLabel} • ${timeSlotRange}`;
  } else if (dateLabel) {
    dueDate = dateLabel;
  } else if (timeSlotRange) {
    dueDate = `Today • ${timeSlotRange}`;
  }

  return {
    title,
    category,
    priority,
    dueDate,
    rawText: text,
  };
}

export interface ParsedTaskFormData {
  title?: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  priority?: Priority;
  dateLabel?: string;
  dateObj?: Date;
  timeLabel?: string;
  category?: Category;
  notificationEnabled?: boolean;
  repeatIndex?: number;
}

export function parseVoiceToTaskForm(spokenText: string): ParsedTaskFormData {
  const text = spokenText.trim();
  if (!text) return {};

  const lower = text.toLowerCase();
  const result: ParsedTaskFormData = {};

  // 1. Detect Category
  if (lower.includes('work') || lower.includes('client') || lower.includes('meeting') || lower.includes('presentation') || lower.includes('report') || lower.includes('project') || lower.includes('code') || lower.includes('app')) {
    result.category = 'Work';
  } else if (lower.includes('gym') || lower.includes('workout') || lower.includes('doctor') || lower.includes('health') || lower.includes('medicine') || lower.includes('walk') || lower.includes('yoga') || lower.includes('run')) {
    result.category = 'Health';
  } else if (lower.includes('finance') || lower.includes('invoice') || lower.includes('payment') || lower.includes('bank') || lower.includes('budget') || lower.includes('bill') || lower.includes('salary') || lower.includes('tax')) {
    result.category = 'Finance';
  } else if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('critical')) {
    result.category = 'Urgent';
  } else if (lower.includes('personal') || lower.includes('call') || lower.includes('mom') || lower.includes('dad') || lower.includes('family') || lower.includes('groceries') || lower.includes('home') || lower.includes('buy')) {
    result.category = 'Personal';
  }

  // 2. Detect Priority
  const detectedPriority = parseSpokenPriority(text);
  if (detectedPriority) {
    result.priority = detectedPriority;
  }

  // 3. Detect Due Date (Full Calendar Support)
  const detectedDate = extractSpokenDueDate(text);
  if (detectedDate) {
    result.dateObj = detectedDate.dateObj;
    result.dateLabel = detectedDate.dateLabel;
  }

  // 4. Detect Time Preset (6:00 AM to 12:00 AM Midnight)
  if (lower.includes('midnight') || lower.includes('12 am')) {
    result.timeLabel = '12:00 AM';
  } else if (lower.includes('noon') || lower.includes('12 pm')) {
    result.timeLabel = '12:00 PM';
  } else if (lower.includes('morning focus') || lower.includes('early morning') || lower.includes('6 am')) {
    result.timeLabel = '06:00 AM';
  } else if (lower.includes('7 am')) {
    result.timeLabel = '07:00 AM';
  } else if (lower.includes('8 am')) {
    result.timeLabel = '08:00 AM';
  } else if (lower.includes('9 am') || lower.includes('morning')) {
    result.timeLabel = '09:00 AM';
  } else if (lower.includes('10 am')) {
    result.timeLabel = '10:00 AM';
  } else if (lower.includes('11 am')) {
    result.timeLabel = '11:00 AM';
  } else if (lower.includes('1 pm')) {
    result.timeLabel = '01:00 PM';
  } else if (lower.includes('2 pm') || lower.includes('afternoon')) {
    result.timeLabel = '02:00 PM';
  } else if (lower.includes('3 pm')) {
    result.timeLabel = '03:00 PM';
  } else if (lower.includes('4 pm')) {
    result.timeLabel = '04:00 PM';
  } else if (lower.includes('5 pm')) {
    result.timeLabel = '05:00 PM';
  } else if (lower.includes('6 pm') || lower.includes('evening')) {
    result.timeLabel = '06:00 PM';
  } else if (lower.includes('7 pm')) {
    result.timeLabel = '07:00 PM';
  } else if (lower.includes('8 pm')) {
    result.timeLabel = '08:00 PM';
  } else if (lower.includes('9 pm') || lower.includes('night')) {
    result.timeLabel = '09:00 PM';
  } else if (lower.includes('10 pm')) {
    result.timeLabel = '10:00 PM';
  } else if (lower.includes('11 pm')) {
    result.timeLabel = '11:00 PM';
  } else {
    const timeMatch = text.match(/\b([1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/i);
    if (timeMatch) {
      const h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] || '00';
      const ampm = timeMatch[3].toUpperCase();
      result.timeLabel = `${h < 10 ? `0${h}` : h}:${m} ${ampm}`;
    }
  }

  // 5. Detect Location: "at <place>", "in <place>", "location <place>"
  const locMatch = text.match(/\b(?:location|at|in)\s+([A-Za-z0-9\s'’.-]+?)(?=\s+(?:tomorrow|today|friday|monday|weekend|on|meeting|link|zoom|teams|priority|urgent|notes|description|details|repeat|remind|$))/i);
  if (locMatch && locMatch[1]) {
    const candidate = locMatch[1].trim();
    // Exclude temporal words
    if (!/^(9\s*am|6\s*am|12\s*pm|morning|afternoon|evening|night|\d+)/i.test(candidate)) {
      result.location = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  // 6. Detect Meeting Link
  const urlMatch = text.match(/(https?:\/\/[^\s]+|zoom\.us\/[^\s]+|meet\.google\.com\/[^\s]+|teams\.microsoft\.com\/[^\s]+)/i);
  if (urlMatch) {
    result.meetingLink = urlMatch[1];
  } else if (lower.includes('zoom')) {
    result.meetingLink = 'https://zoom.us/j/meeting';
  } else if (lower.includes('google meet')) {
    result.meetingLink = 'https://meet.google.com/call';
  } else if (lower.includes('teams')) {
    result.meetingLink = 'https://teams.microsoft.com';
  }

  // 7. Detect Description / Notes
  const descMatch = text.match(/\b(?:notes|description|details|bring|about)\s*[:\-]?\s*([A-Za-z0-9\s'’.,!?-]+?)(?=\s+(?:tomorrow|today|friday|monday|at|location|priority|repeat|$))/i);
  if (descMatch && descMatch[1]) {
    const descText = descMatch[1].trim();
    if (descText.length > 2) {
      result.description = descText.charAt(0).toUpperCase() + descText.slice(1);
    }
  }

  // 8. Detect Repeat
  if (lower.includes('repeat daily') || lower.includes('every day')) {
    result.repeatIndex = 1;
  } else if (lower.includes('repeat weekly') || lower.includes('every week') || lower.includes('weekly on monday')) {
    result.repeatIndex = 2;
  } else if (lower.includes('repeat monthly') || lower.includes('every month')) {
    result.repeatIndex = 3;
  }

  // 9. Detect Notification
  if (lower.includes('remind me') || lower.includes('alert') || lower.includes('notify') || lower.includes('with reminder') || lower.includes('with notification')) {
    result.notificationEnabled = true;
  }

  // 10. Clean Task Title
  let cleanTitle = text
    .replace(/^(create a task to|create a task for|add a task to|add a task for|remind me to|i need to|please|schedule a task for|schedule)\s+/i, '')
    // Strip due date clauses
    .replace(/\b(?:due\s+date\s*(?:is|on|to)?|due\s*(?:on|by|is)?|deadline\s*(?:is|on)?)\s*(?:the\s+)?(?:\d{1,2}(?:st|nd|rd|th)?)?\b/gi, '')
    // Strip date keywords
    .replace(/\b(day after tomorrow|tomorrow|today|tonight|yesterday|this weekend|next weekend|weekend|next week|end of (?:the )?week)\b/gi, '')
    // Strip weekdays
    .replace(/\b(?:this|next)?\s*(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/gi, '')
    // Strip relative days/weeks
    .replace(/\b(?:in\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|a few|a couple of)?\s*(?:days?|weeks?))\b/gi, '')
    // Strip month + day & day + month
    .replace(/\b(?:on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?\b/gi, '')
    .replace(/\b(?:on\s+)?\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+\d{4})?\b/gi, '')
    // Strip times
    .replace(/\b(?:at\s+)?(?:[1-9]|1[0-2])(?::[0-5]\d)?\s*(?:am|pm)\b/gi, '')
    .replace(/\b(in the morning|in the evening|in the afternoon|at night|midnight|noon)\b/gi, '')
    // Strip priority
    .replace(/\b(urgent|high|medium|low)\s+(?:priority)?\b/gi, '')
    // Strip categories
    .replace(/\b(work|health|personal|finance|urgent)\s+category\b/gi, '')
    // Strip locations
    .replace(/\b(?:location|at|in)\s+([A-Za-z0-9\s'’.-]+?)(?=\s+(?:meeting|link|zoom|teams|notes|details|$))/gi, '')
    // Strip meeting links
    .replace(/\b(meeting\s+link|zoom\s+link|link)\b/gi, '')
    // Strip notes/description
    .replace(/\b(?:notes|description|details)\s*[:\-]?\s*([A-Za-z0-9\s'’.,!?-]+?)$/gi, '')
    // Strip repeat
    .replace(/\b(repeat daily|repeat weekly|repeat monthly|every day|every week)\b/gi, '')
    // Collapse excess spaces
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleanTitle.length > 0) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    result.title = cleanTitle;
  }

  return result;
}


