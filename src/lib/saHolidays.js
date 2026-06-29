// South African public holidays + recognised/special days.
// Month values are zero-based because JavaScript Date months are zero-based.
const FIXED_HOLIDAYS = [
  { month: 0, day: 1, name: "New Year's Day", type: 'public', emoji: '🎉', message: 'Happy New Year! May this year bring growth and success.', observedIfSunday: true },
  { month: 1, day: 14, name: "Valentine's Day", type: 'special', emoji: '❤️', message: 'Spread love and kindness — at work and at home!' },
  { month: 2, day: 8, name: "International Women's Day", type: 'special', emoji: '♀️', message: 'Celebrating the incredible women who make our organisation stronger.' },
  { month: 2, day: 21, name: "Human Rights Day", type: 'public', emoji: '🕊️', message: 'Commemorating Sharpeville and celebrating human rights for all.', observedIfSunday: true },
  { month: 3, day: 1, name: "April Fools' Day", type: 'special', emoji: '🤡', message: 'Prank responsibly — keep it fun and workplace-appropriate!' },
  { month: 3, day: 22, name: "Earth Day", type: 'special', emoji: '🌍', message: "Let's go green! Small actions protect our planet." },
  { month: 3, day: 27, name: "Freedom Day", type: 'public', emoji: '🇿🇦', message: 'Celebrating South Africa\'s first democratic elections, 1994.', observedIfSunday: true },
  { month: 4, day: 1, name: "Workers' Day", type: 'public', emoji: '👷', message: 'Honouring workers everywhere. Thank you for all you do!', observedIfSunday: true },
  { month: 4, day: 25, name: "Africa Day", type: 'special', emoji: '🌍', message: 'Celebrating African unity and identity.' },
  { month: 5, day: 16, name: "Youth Day", type: 'public', emoji: '✊', message: 'Commemorating the Soweto Uprising of 1976.', observedIfSunday: true },
  { month: 6, day: 18, name: "Nelson Mandela Day", type: 'special', emoji: '🙌', message: '67 minutes of service — what will you do to make a difference?' },
  { month: 7, day: 9, name: "National Women's Day", type: 'public', emoji: '💪', message: "Commemorating the 1956 Women's March to the Union Buildings.", observedIfSunday: true },
  { month: 8, day: 1, name: "Spring Day", type: 'special', emoji: '🌸', message: 'Spring has sprung! New beginnings and fresh energy.' },
  { month: 8, day: 24, name: "Heritage Day", type: 'public', emoji: '🥘', message: 'Braai day! Celebrate our diverse cultural heritage.', observedIfSunday: true },
  { month: 9, day: 10, name: "World Mental Health Day", type: 'special', emoji: '🧠', message: 'Check in on yourself and your colleagues. Mental health matters.' },
  { month: 9, day: 16, name: "Boss's Day", type: 'special', emoji: '👔', message: 'A day to appreciate leadership that inspires.' },
  { month: 9, day: 31, name: "Halloween", type: 'special', emoji: '🎃', message: "Have a spooky day! Don't let deadlines scare you." },
  { month: 11, day: 1, name: "World AIDS Day", type: 'special', emoji: '🎗️', message: 'Showing support for those affected by HIV/AIDS.' },
  { month: 11, day: 16, name: "Day of Reconciliation", type: 'public', emoji: '🤝', message: 'Building a united, reconciled South Africa.', observedIfSunday: true },
  { month: 11, day: 25, name: "Christmas Day", type: 'public', emoji: '🎄', message: 'Wishing you joy, peace, and festive cheer!', observedIfSunday: true },
  { month: 11, day: 26, name: "Day of Goodwill", type: 'public', emoji: '🎁', message: 'A day of giving and sharing with those around you.', observedIfSunday: true },
];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getNthSundayOfMonth(year, month, n) {
  const firstDay = new Date(year, month, 1);
  const firstSundayDate = firstDay.getDay() === 0 ? 1 : 8 - firstDay.getDay();
  return { month, day: firstSundayDate + (n - 1) * 7 };
}

function getEasterSunday(year) {
  // Anonymous Gregorian algorithm.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function holidaysForYear(year) {
  const holidays = [];

  for (const h of FIXED_HOLIDAYS) {
    const date = new Date(year, h.month, h.day);
    holidays.push({ ...h, date, dateKey: toDateKey(date), observed: false });

    if (h.type === 'public' && h.observedIfSunday && date.getDay() === 0) {
      const observedDate = addDays(date, 1);
      holidays.push({
        ...h,
        name: `${h.name} (Observed)`,
        message: `${h.message} Public holiday observed today because it falls on a Sunday.`,
        date: observedDate,
        dateKey: toDateKey(observedDate),
        observed: true,
        originalDate: toDateKey(date),
      });
    }
  }

  const easterSunday = getEasterSunday(year);
  const goodFriday = addDays(easterSunday, -2);
  const familyDay = addDays(easterSunday, 1);
  holidays.push({
    name: 'Good Friday',
    type: 'public',
    emoji: '✝️',
    message: 'Good Friday public holiday.',
    date: goodFriday,
    dateKey: toDateKey(goodFriday),
    observed: false,
  });
  holidays.push({
    name: 'Family Day',
    type: 'public',
    emoji: '👨‍👩‍👧‍👦',
    message: 'Family Day public holiday.',
    date: familyDay,
    dateKey: toDateKey(familyDay),
    observed: false,
  });

  const mothersDay = getNthSundayOfMonth(year, 4, 2);
  holidays.push({
    name: "Mother's Day",
    type: 'special',
    emoji: '💐',
    message: 'Celebrating all the amazing mothers out there!',
    date: new Date(year, mothersDay.month, mothersDay.day),
    dateKey: toDateKey(new Date(year, mothersDay.month, mothersDay.day)),
    observed: false,
  });

  const fathersDay = getNthSundayOfMonth(year, 5, 3);
  holidays.push({
    name: "Father's Day",
    type: 'special',
    emoji: '👨',
    message: 'Celebrating all the incredible fathers!',
    date: new Date(year, fathersDay.month, fathersDay.day),
    dateKey: toDateKey(new Date(year, fathersDay.month, fathersDay.day)),
    observed: false,
  });

  return holidays.sort((a, b) => a.date - b.date);
}

export function getTodaysHoliday(date = new Date()) {
  const key = toDateKey(date);
  return holidaysForYear(date.getFullYear()).find((h) => h.dateKey === key) || null;
}

export function getHolidaysInRange(startDate, endDate) {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const years = new Set([start.getFullYear(), end.getFullYear()]);
  if (end.getFullYear() - start.getFullYear() > 1) {
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) years.add(year);
  }

  return [...years]
    .flatMap((year) => holidaysForYear(year))
    .filter((holiday) => holiday.date >= start && holiday.date <= end)
    .sort((a, b) => a.date - b.date);
}

export function getUpcomingHolidays(date = new Date(), daysAhead = 14) {
  const holidays = [];
  for (let offset = 1; offset <= daysAhead; offset++) {
    const checkDate = new Date(date);
    checkDate.setDate(date.getDate() + offset);
    const holiday = getTodaysHoliday(checkDate);
    if (holiday) holidays.push({ ...holiday, date: checkDate, daysAway: offset });
  }
  return holidays;
}
