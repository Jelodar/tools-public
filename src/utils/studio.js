const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function convertBaseValue(rawValue, inputRadix, outputRadix) {
  const source = String(rawValue ?? '').trim().toUpperCase();
  const from = Number(inputRadix);
  const to = Number(outputRadix);

  if (!source) return '0';
  if (!Number.isInteger(from) || from < 2 || from > 36) throw new Error('Invalid input radix');
  if (!Number.isInteger(to) || to < 2 || to > 36) throw new Error('Invalid target radix');

  const negative = source.startsWith('-');
  const normalized = negative ? source.slice(1) : source;

  if (!normalized) throw new Error('Invalid value');

  let total = 0n;

  for (const char of normalized) {
    const digit = DIGITS.indexOf(char);
    if (digit < 0 || digit >= from) throw new Error('Invalid digit for selected radix');
    total = (total * BigInt(from)) + BigInt(digit);
  }

  const output = total.toString(to).toUpperCase();
  return negative && total !== 0n ? `-${output}` : output;
}

export function parseTimestampInput(rawValue) {
  const normalized = String(rawValue ?? '').trim();

  if (!normalized) throw new Error('Enter a timestamp');
  if (!/^[+-]?\d+$/.test(normalized)) throw new Error('Timestamp must be numeric');

  const raw = BigInt(normalized);
  const isSeconds = raw > -10000000000n && raw < 10000000000n;
  const milliseconds = isSeconds ? raw * 1000n : raw;
  const numericValue = Number(milliseconds);

  if (!Number.isFinite(numericValue)) throw new Error('Timestamp is out of range');

  const date = new Date(numericValue);

  if (Number.isNaN(date.getTime())) throw new Error('Timestamp is out of range');

  return {
    detectedUnit: isSeconds ? 'seconds' : 'milliseconds',
    milliseconds: numericValue,
    date
  };
}

export function formatTimestampSnapshot(rawValue) {
  const { detectedUnit, milliseconds, date } = parseTimestampInput(rawValue);

  return {
    detectedUnit,
    milliseconds,
    local: date.toString(),
    utc: date.toUTCString(),
    iso: date.toISOString()
  };
}

export function parseDateInputAsLocalDate(rawValue) {
  const normalized = String(rawValue ?? '').trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) throw new Error('Enter a valid date');

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    throw new Error('Enter a valid date');
  }

  return date;
}

function getFormatterParts(locale, options, date) {
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.formatToParts(date).reduce((accumulator, part) => {
    if (part.type !== 'literal') accumulator[part.type] = part.value;
    return accumulator;
  }, {});
}

function buildCalendarEntry(locale, calendar, date) {
  const parts = getFormatterParts(
    locale,
    {
      calendar,
      numberingSystem: 'latn',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    date
  );

  return {
    weekday: parts.weekday,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    label: `${parts.weekday}, ${parts.month} ${parts.day}, ${parts.year}`
  };
}

export function getCalendarSnapshot(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new Error('Invalid date');

  return {
    gregorian: buildCalendarEntry('en-US', 'gregory', date),
    jalali: buildCalendarEntry('en-US-u-ca-persian', 'persian', date),
    islamic: buildCalendarEntry('en-US-u-ca-islamic-umalqura', 'islamic-umalqura', date)
  };
}

function parseDateTimeLocalInput(rawValue) {
  const normalized = String(rawValue ?? '').trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) throw new Error('Enter a valid local date and time');

  const [, year, month, day, hour, minute, second = '00'] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second)
  };
}

function getTimeZoneOffsetMilliseconds(timeZone, date) {
  const parts = getFormatterParts(
    'en-US',
    {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    },
    date
  );

  const zonedUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return zonedUtc - date.getTime();
}

function resolveZonedDateTime(parts, timeZone) {
  let instant = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const offset = getTimeZoneOffsetMilliseconds(timeZone, new Date(instant));
    const nextInstant = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - offset;
    if (nextInstant === instant) break;
    instant = nextInstant;
  }

  return new Date(instant);
}

function formatTimeZoneSnapshot(date, timeZone) {
  const parts = getFormatterParts(
    'en-US',
    {
      timeZone,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short'
    },
    date
  );

  const city = timeZone.split('/').pop()?.replace(/_/g, ' ') || timeZone;

  return {
    timeZone,
    city,
    weekday: parts.weekday,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    zoneName: parts.timeZoneName,
    isoLike: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`,
    label: `${parts.weekday} ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} ${parts.timeZoneName}`
  };
}

export function resolveTimeZoneConversion(rawValue, sourceTimeZone, targetTimeZone) {
  if (!sourceTimeZone || !targetTimeZone) throw new Error('Choose both source and target timezones');

  const parts = parseDateTimeLocalInput(rawValue);
  const instant = resolveZonedDateTime(parts, sourceTimeZone);

  return {
    instant,
    source: formatTimeZoneSnapshot(instant, sourceTimeZone),
    target: formatTimeZoneSnapshot(instant, targetTimeZone)
  };
}

function parseTimeOfDay(rawValue, fallback) {
  const normalized = String(rawValue || fallback).trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error('Enter a valid time');
  const minutes = (Number(match[1]) * 60) + Number(match[2]);
  if (minutes < 0 || minutes > 24 * 60) throw new Error('Enter a valid time');
  return minutes;
}

function parseIsoDateParts(rawValue) {
  const date = parseDateInputAsLocalDate(rawValue);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}

function getZoneMinuteOfDay(date, timeZone) {
  const parts = getFormatterParts(
    'en-US',
    {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    },
    date
  );
  return (Number(parts.hour) * 60) + Number(parts.minute);
}

function isMinuteInsideWindow(minute, start, end) {
  if (start === end) return true;
  if (start < end) return minute >= start && minute < end;
  return minute >= start || minute < end;
}

export function buildTimeOverlapPlan(options = {}) {
  const zones = Array.from(new Set((options.zones || []).map((zone) => String(zone).trim()).filter(Boolean)));
  if (zones.length < 2) throw new Error('Choose at least two timezones');
  const dateParts = parseIsoDateParts(options.date);
  const workStart = parseTimeOfDay(options.workStart, '09:00');
  const workEnd = parseTimeOfDay(options.workEnd, '17:00');
  const stepMinutes = Math.max(15, Math.min(240, Math.round(Number(options.stepMinutes) || 30)));
  const dayStart = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0);
  const slots = [];

  for (let minute = 0; minute < 24 * 60; minute += stepMinutes) {
    const instant = new Date(dayStart + (minute * 60000));
    const localTimes = zones.map((zone) => formatTimeZoneSnapshot(instant, zone));
    const fits = zones.every((zone) => isMinuteInsideWindow(getZoneMinuteOfDay(instant, zone), workStart, workEnd));
    if (!fits) continue;
    const utcHour = String(Math.floor(minute / 60)).padStart(2, '0');
    const utcMinute = String(minute % 60).padStart(2, '0');
    slots.push({
      instant,
      label: `${utcHour}:${utcMinute} UTC`,
      localTimes
    });
  }

  return {
    date: `${String(dateParts.year).padStart(4, '0')}-${String(dateParts.month).padStart(2, '0')}-${String(dateParts.day).padStart(2, '0')}`,
    zones,
    workStart,
    workEnd,
    stepMinutes,
    slots
  };
}

export function summarizeDstContext(timeZone, year = new Date().getFullYear()) {
  if (!timeZone) throw new Error('Choose a timezone');
  const safeYear = Math.max(1970, Math.min(9999, Math.round(Number(year) || new Date().getFullYear())));
  const transitions = [];
  let previousDate = new Date(Date.UTC(safeYear, 0, 1, 12, 0, 0));
  let previousOffset = getTimeZoneOffsetMilliseconds(timeZone, previousDate) / 60000;

  for (let day = 1; day <= 366; day += 1) {
    const currentDate = new Date(Date.UTC(safeYear, 0, 1 + day, 12, 0, 0));
    if (currentDate.getUTCFullYear() !== safeYear) break;
    const currentOffset = getTimeZoneOffsetMilliseconds(timeZone, currentDate) / 60000;
    if (currentOffset !== previousOffset) {
      transitions.push({
        date: currentDate.toISOString().slice(0, 10),
        fromOffsetMinutes: previousOffset,
        toOffsetMinutes: currentOffset,
        direction: currentOffset > previousOffset ? 'forward' : 'back'
      });
    }
    previousDate = currentDate;
    previousOffset = currentOffset;
  }

  const now = new Date(Date.UTC(safeYear, Math.min(11, new Date().getUTCMonth()), 1, 12, 0, 0));
  return {
    timeZone,
    year: safeYear,
    currentOffsetMinutes: getTimeZoneOffsetMilliseconds(timeZone, now) / 60000,
    observesDst: transitions.length > 0,
    transitions
  };
}

function addBusinessDays(date, amount) {
  const out = new Date(date.getTime());
  const direction = amount < 0 ? -1 : 1;
  let remaining = Math.abs(Math.round(Number(amount) || 0));
  while (remaining > 0) {
    out.setDate(out.getDate() + direction);
    const day = out.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return out;
}

function formatDateMathResult(date) {
  return {
    date,
    isoDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date),
    label: new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(date)
  };
}

export function applyDateMath(rawDate, operations = {}) {
  let date = parseDateInputAsLocalDate(rawDate);
  const years = Math.round(Number(operations.years) || 0);
  const months = Math.round(Number(operations.months) || 0);
  const weeks = Math.round(Number(operations.weeks) || 0);
  const days = Math.round(Number(operations.days) || 0);
  const businessDays = Math.round(Number(operations.businessDays) || 0);

  if (years) date.setFullYear(date.getFullYear() + years);
  if (months) date.setMonth(date.getMonth() + months);
  if (weeks || days) date.setDate(date.getDate() + (weeks * 7) + days);
  if (businessDays) date = addBusinessDays(date, businessDays);

  return formatDateMathResult(date);
}

export function getDateDifference(startDate, endDate) {
  const start = parseDateInputAsLocalDate(startDate);
  const end = parseDateInputAsLocalDate(endDate);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.round((endUtc - startUtc) / 86400000);
  return {
    days,
    weeks: Math.trunc(days / 7),
    remainderDays: Math.abs(days % 7),
    direction: days < 0 ? 'backward' : 'forward'
  };
}
