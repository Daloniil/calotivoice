/** Понедельник 00:00 локального времени. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ISO-подобная неделя: понедельник — первый день. */
export function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date);
  const weekday = d.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isYesterday(date: Date): boolean {
  return isSameDay(date, addDays(new Date(), -1));
}

/** Смещение недели от «текущей» (неделя, в которой anchor), в целых неделях. */
export function weekOffsetFromAnchor(date: Date, anchor: Date): number {
  const monday = startOfWeekMonday(date).getTime();
  const anchorMonday = startOfWeekMonday(anchor).getTime();
  return Math.round((monday - anchorMonday) / (7 * 24 * 60 * 60 * 1000));
}

export function mondayForWeekOffset(anchorMonday: Date, offset: number): Date {
  return addDays(startOfWeekMonday(anchorMonday), offset * 7);
}

export function daysOfWeek(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function appLocaleTag(language: string): string {
  return language === 'ru' ? 'ru-RU' : 'en-US';
}

export function formatWeekRange(monday: Date, localeTag: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();

  const day = new Intl.DateTimeFormat(localeTag, { day: 'numeric' });
  const dayMonth = new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'short' });
  const dayMonthYear = new Intl.DateTimeFormat(localeTag, {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });

  if (sameMonth) {
    return `${day.format(monday)} – ${dayMonth.format(sunday)}`;
  }
  return `${dayMonthYear.format(monday)} – ${dayMonthYear.format(sunday)}`;
}

export function formatWeekdayShort(date: Date, localeTag: string): string {
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date);
}

export function formatDayNumber(date: Date, localeTag: string): string {
  return new Intl.DateTimeFormat(localeTag, { day: 'numeric' }).format(date);
}

export function formatSelectedDayTitle(date: Date, localeTag: string): string {
  return new Intl.DateTimeFormat(localeTag, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatMonthYear(date: Date, localeTag: string): string {
  return new Intl.DateTimeFormat(localeTag, { month: 'long', year: 'numeric' }).format(date);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export type MonthGridCell = { date: Date; inMonth: boolean };

/** Сетка 6×7 с понедельника (дни соседних месяцев помечены inMonth: false). */
export function getMonthGrid(viewMonth: Date): MonthGridCell[] {
  const monthStart = startOfMonth(viewMonth);
  const gridStart = startOfWeekMonday(monthStart);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return { date, inMonth: date.getMonth() === viewMonth.getMonth() };
  });
}

export function canGoToNextMonth(viewMonth: Date, maxDate: Date): boolean {
  const next = addMonths(viewMonth, 1);
  return startOfMonth(next).getTime() <= startOfMonth(maxDate).getTime();
}

export function isAfterDay(date: Date, maxDate: Date): boolean {
  return startOfDay(date).getTime() > startOfDay(maxDate).getTime();
}
