const FUN_FACTS = [
  { fact: "Taking a 5-minute walk every hour can boost productivity. Go stretch those legs!", emoji: "🚶" },
  { fact: "Regular breaks help your brain reset. Permission to rest granted.", emoji: "☕" },
  { fact: "The Pomodoro Technique uses 25-minute focus blocks and 5-minute breaks.", emoji: "🍅" },
  { fact: "Hydration supports focus. Small water break, big brain energy.", emoji: "💧" },
  { fact: "South Africa has 11 official languages — the most of any country.", emoji: "🇿🇦" },
  { fact: "Looking at something green for a minute can help reset tired eyes.", emoji: "🌿" },
  { fact: "A short laugh at work can lower stress. Tiny joy counts.", emoji: "😂" },
];

const FIXED_HOLIDAYS = [
  { month: 0, day: 1, name: "New Year's Day", type: "public", emoji: "🎉", message: "Happy New Year! May this year bring growth and success." },
  { month: 2, day: 21, name: "Human Rights Day", type: "public", emoji: "🕊️", message: "Celebrating human rights for all." },
  { month: 3, day: 27, name: "Freedom Day", type: "public", emoji: "🇿🇦", message: "Celebrating South Africa's democratic freedom." },
  { month: 4, day: 1, name: "Workers' Day", type: "public", emoji: "👷", message: "Honouring workers everywhere. Thank you for all you do." },
  { month: 5, day: 16, name: "Youth Day", type: "public", emoji: "✊", message: "Commemorating youth courage and leadership." },
  { month: 7, day: 9, name: "National Women's Day", type: "public", emoji: "💪", message: "Celebrating women who move South Africa forward." },
  { month: 8, day: 24, name: "Heritage Day", type: "public", emoji: "🥘", message: "Celebrate our diverse cultural heritage." },
  { month: 11, day: 16, name: "Day of Reconciliation", type: "public", emoji: "🤝", message: "Building a united, reconciled South Africa." },
  { month: 11, day: 25, name: "Christmas Day", type: "public", emoji: "🎄", message: "Wishing you joy, peace, and festive cheer." },
  { month: 11, day: 26, name: "Day of Goodwill", type: "public", emoji: "🎁", message: "A day of giving and sharing." },
  { month: 8, day: 10, name: "World Mental Health Day", type: "special", emoji: "🧠", message: "Check in on yourself and your colleagues. Mental health matters." },
  { month: 6, day: 18, name: "Nelson Mandela Day", type: "special", emoji: "🙌", message: "67 minutes of service — what will you do today?" },
];

export function getDailyFunFact(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return FUN_FACTS[dayOfYear % FUN_FACTS.length];
}

export function getTodaysHoliday(date = new Date()) {
  return FIXED_HOLIDAYS.find((h) => h.month === date.getMonth() && h.day === date.getDate()) || null;
}

export function birthdayNotifications(db, date = new Date()) {
  const profiles = db.entities.UserProfile || [];
  return profiles
    .filter((profile) => profile.birthday && profile.birthday_notifications_enabled !== false)
    .filter((profile) => {
      const birthday = new Date(profile.birthday);
      return birthday.getMonth() === date.getMonth() && birthday.getDate() === date.getDate();
    })
    .map((profile) => ({
      title: "🎂 Birthday Today",
      message: `It's ${profile.full_name || profile.user_name || profile.user_email}'s birthday today. Don't forget to wish them well!`,
      type: "birthday_reminder",
      priority: "medium",
      target_users: [],
      delivery_channels: ["in_app", "browser_push"],
      preference_key: "birthday_notifications_enabled",
      related_entity_type: "UserProfile",
      related_entity_id: profile.id,
      schedule_key: `birthday-${profile.id}-${date.toISOString().slice(0, 10)}`,
    }));
}

function usersWithPreference(db, preferenceKey) {
  return (db.entities.UserProfile || [])
    .filter((profile) => profile[preferenceKey] !== false)
    .map((profile) => profile.user_email)
    .filter(Boolean);
}

export function dailyWellnessNotifications(db, date = new Date()) {
  const fact = getDailyFunFact(date);
  return [
    {
      title: "☕ Time for a quick reset",
      message: "Take a short break, drink water, stretch, and come back sharper.",
      type: "hr_reminder",
      priority: "low",
      delivery_channels: ["in_app", "browser_push"],
      target_users: usersWithPreference(db, "break_reminders_enabled"),
      preference_key: "break_reminders_enabled",
      schedule_key: `break-${date.toISOString().slice(0, 10)}`,
    },
    {
      title: `Did You Know? ${fact.emoji}`,
      message: fact.fact,
      type: "general",
      priority: "low",
      delivery_channels: ["in_app", "browser_push"],
      target_users: usersWithPreference(db, "did_you_know_enabled"),
      preference_key: "did_you_know_enabled",
      schedule_key: `did-you-know-${date.toISOString().slice(0, 10)}`,
    },
  ];
}

export function holidayNotifications(db, date = new Date()) {
  const holiday = getTodaysHoliday(date);
  if (!holiday) return [];
  return [{
    title: `${holiday.emoji} ${holiday.name}`,
    message: holiday.message,
    type: holiday.type === "public" ? "hr_reminder" : "general",
    priority: "medium",
    delivery_channels: ["in_app", "browser_push"],
    target_users: usersWithPreference(db, "holiday_notifications_enabled"),
    preference_key: "holiday_notifications_enabled",
    schedule_key: `holiday-${holiday.name}-${date.toISOString().slice(0, 10)}`,
  }];
}
