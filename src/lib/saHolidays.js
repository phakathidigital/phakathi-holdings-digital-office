// South African public holidays + special days (SA first, then international)
const FIXED_HOLIDAYS = [
  { month: 0, day: 1, name: "New Year's Day", type: 'public', emoji: '🎉', message: 'Happy New Year! May this year bring growth and success.' },
  { month: 1, day: 14, name: "Valentine's Day", type: 'special', emoji: '❤️', message: 'Spread love and kindness — at work and at home!' },
  { month: 2, day: 8, name: "International Women's Day", type: 'special', emoji: '♀️', message: 'Celebrating the incredible women who make our organisation stronger.' },
  { month: 2, day: 21, name: "Human Rights Day", type: 'public', emoji: '🕊️', message: 'Commemorating Sharpeville and celebrating human rights for all.' },
  { month: 3, day: 1, name: "April Fools' Day", type: 'special', emoji: '🤡', message: 'Prank responsibly — keep it fun and workplace-appropriate!' },
  { month: 3, day: 22, name: "Earth Day", type: 'special', emoji: '🌍', message: "Let's go green! Small actions protect our planet." },
  { month: 3, day: 27, name: "Freedom Day", type: 'public', emoji: '🇿🇦', message: 'Celebrating South Africa\'s first democratic elections, 1994.' },
  { month: 4, day: 1, name: "Workers' Day", type: 'public', emoji: '👷', message: 'Honouring workers everywhere. Thank you for all you do!' },
  { month: 4, day: 25, name: "Africa Day", type: 'special', emoji: '🌍', message: 'Celebrating African unity and identity.' },
  { month: 5, day: 16, name: "Youth Day", type: 'public', emoji: '✊', message: 'Commemorating the Soweto Uprising of 1976.' },
  { month: 6, day: 18, name: "Nelson Mandela Day", type: 'special', emoji: '🙌', message: '67 minutes of service — what will you do to make a difference?' },
  { month: 7, day: 9, name: "National Women's Day", type: 'public', emoji: '💪', message: "Commemorating the 1956 Women's March to the Union Buildings." },
  { month: 8, day: 1, name: "Spring Day", type: 'special', emoji: '🌸', message: 'Spring has sprung! New beginnings and fresh energy.' },
  { month: 8, day: 10, name: "World Mental Health Day", type: 'special', emoji: '🧠', message: 'Check in on yourself and your colleagues. Mental health matters.' },
  { month: 8, day: 24, name: "Heritage Day", type: 'public', emoji: '🥘', message: 'Braai day! Celebrate our diverse cultural heritage.' },
  { month: 9, day: 16, name: "Boss's Day", type: 'special', emoji: '👔', message: 'A day to appreciate leadership that inspires.' },
  { month: 9, day: 31, name: "Halloween", type: 'special', emoji: '🎃', message: "Have a spooky day! Don't let deadlines scare you." },
  { month: 10, day: 1, name: "World AIDS Day", type: 'special', emoji: '🎗️', message: 'Showing support for those affected by HIV/AIDS.' },
  { month: 11, day: 16, name: "Day of Reconciliation", type: 'public', emoji: '🤝', message: 'Building a united, reconciled South Africa.' },
  { month: 11, day: 25, name: "Christmas Day", type: 'public', emoji: '🎄', message: 'Wishing you joy, peace, and festive cheer!' },
  { month: 11, day: 26, name: "Day of Goodwill", type: 'public', emoji: '🎁', message: 'A day of giving and sharing with those around you.' },
];

function getNthSundayOfMonth(year, month, n) {
  const firstDay = new Date(year, month, 1);
  const firstSundayDate = firstDay.getDay() === 0 ? 1 : 8 - firstDay.getDay();
  return { month, day: firstSundayDate + (n - 1) * 7 };
}

export function getTodaysHoliday(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  for (const h of FIXED_HOLIDAYS) {
    if (h.month === month && h.day === day) return h;
  }

  const mothersDay = getNthSundayOfMonth(year, 4, 2);
  if (month === mothersDay.month && day === mothersDay.day) {
    return { name: "Mother's Day", type: 'special', emoji: '💐', message: 'Celebrating all the amazing mothers out there!' };
  }

  const fathersDay = getNthSundayOfMonth(year, 5, 3);
  if (month === fathersDay.month && day === fathersDay.day) {
    return { name: "Father's Day", type: 'special', emoji: '👨', message: 'Celebrating all the incredible fathers!' };
  }

  return null;
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