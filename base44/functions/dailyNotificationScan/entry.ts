import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// South African public holidays inlined (Deno functions can't import frontend files)
const FIXED_HOLIDAYS = [
  { month: 0, day: 1, name: "New Year's Day", emoji: '🎉', message: 'Happy New Year! May this year bring growth and success.' },
  { month: 1, day: 14, name: "Valentine's Day", emoji: '❤️', message: 'Spread love and kindness — at work and at home!' },
  { month: 2, day: 8, name: "International Women's Day", emoji: '♀️', message: 'Celebrating the incredible women who make our organisation stronger.' },
  { month: 2, day: 21, name: "Human Rights Day", emoji: '🕊️', message: 'Commemorating Sharpeville and celebrating human rights for all.' },
  { month: 3, day: 1, name: "April Fools' Day", emoji: '🤡', message: 'Prank responsibly — keep it fun and workplace-appropriate!' },
  { month: 3, day: 22, name: "Earth Day", emoji: '🌍', message: "Let's go green! Small actions protect our planet." },
  { month: 3, day: 27, name: "Freedom Day", emoji: '🇿🇦', message: "Celebrating South Africa's first democratic elections, 1994." },
  { month: 4, day: 1, name: "Workers' Day", emoji: '👷', message: 'Honouring workers everywhere. Thank you for all you do!' },
  { month: 4, day: 25, name: "Africa Day", emoji: '🌍', message: 'Celebrating African unity and identity.' },
  { month: 5, day: 16, name: "Youth Day", emoji: '✊', message: 'Commemorating the Soweto Uprising of 1976.' },
  { month: 6, day: 18, name: "Nelson Mandela Day", emoji: '🙌', message: '67 minutes of service — what will you do to make a difference?' },
  { month: 7, day: 9, name: "National Women's Day", emoji: '💪', message: "Commemorating the 1956 Women's March to the Union Buildings." },
  { month: 8, day: 1, name: "Spring Day", emoji: '🌸', message: 'Spring has sprung! New beginnings and fresh energy.' },
  { month: 8, day: 10, name: "World Mental Health Day", emoji: '🧠', message: 'Check in on yourself and your colleagues. Mental health matters.' },
  { month: 8, day: 24, name: "Heritage Day", emoji: '🥘', message: 'Braai day! Celebrate our diverse cultural heritage.' },
  { month: 9, day: 16, name: "Boss's Day", emoji: '👔', message: 'A day to appreciate leadership that inspires.' },
  { month: 9, day: 31, name: "Halloween", emoji: '🎃', message: "Have a spooky day! Don't let deadlines scare you." },
  { month: 10, day: 1, name: "World AIDS Day", emoji: '🎗️', message: 'Showing support for those affected by HIV/AIDS.' },
  { month: 11, day: 16, name: "Day of Reconciliation", emoji: '🤝', message: 'Building a united, reconciled South Africa.' },
  { month: 11, day: 25, name: "Christmas Day", emoji: '🎄', message: 'Wishing you joy, peace, and festive cheer!' },
  { month: 11, day: 26, name: "Day of Goodwill", emoji: '🎁', message: 'A day of giving and sharing with those around you.' },
];

function getNthSundayOfMonth(year, month, n) {
  const firstDay = new Date(year, month, 1);
  const firstSundayDate = firstDay.getDay() === 0 ? 1 : 8 - firstDay.getDay();
  return { month, day: firstSundayDate + (n - 1) * 7 };
}

function getHolidayForDate(date) {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  for (const h of FIXED_HOLIDAYS) {
    if (h.month === month && h.day === day) return h;
  }

  const mothersDay = getNthSundayOfMonth(year, 4, 2);
  if (month === mothersDay.month && day === mothersDay.day) {
    return { name: "Mother's Day", emoji: '💐', message: 'Celebrating all the amazing mothers out there!' };
  }

  const fathersDay = getNthSundayOfMonth(year, 5, 3);
  if (month === fathersDay.month && day === fathersDay.day) {
    return { name: "Father's Day", emoji: '👨', message: 'Celebrating all the incredible fathers!' };
  }

  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = base44.asServiceRole;

    const now = new Date();
    const results = { birthdays: 0, holidays: 0, announcements: 0, emailsSent: 0, errors: [] };
    const newNotifications = [];

    // Fetch existing notifications to avoid duplicates (check by title)
    const recentNotifs = await admin.entities.Notification.list('-created_date', 100);
    const existingTitles = new Set(recentNotifs.map(n => n.title));

    // Fetch user profiles
    const profiles = await admin.entities.UserProfile.list('-created_date', 500);

    // Fetch users for full names
    let userMap = {};
    try {
      const users = await admin.entities.User.list('-created_date', 500);
      users.forEach(u => { userMap[u.email] = u; });
    } catch (e) {
      // User list not accessible — fall back to email as name
    }

    // --- 1. Scan birthdays (next 5 days) ---
    for (const profile of profiles) {
      if (!profile.birthday) continue;
      const bday = new Date(profile.birthday);
      const nextBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
      const daysAway = Math.ceil((nextBday - now) / 86400000);

      if (daysAway > 5 || daysAway < 0) continue;

      const bdayDateStr = nextBday.toISOString().split('T')[0];
      const name = userMap[profile.user_email]?.full_name || profile.user_email || 'A team member';
      const firstName = name.split(' ')[0];

      // Team notification (visible to everyone)
      const teamTitle = `🎂 ${firstName}'s birthday ${daysAway === 0 ? 'is today' : `in ${daysAway} day${daysAway !== 1 ? 's' : ''}`} (${bdayDateStr})`;
      if (!existingTitles.has(teamTitle)) {
        const teamMsg = daysAway === 0
          ? `It's ${name}'s birthday today! Don't forget to wish them well. 🎉`
          : `${name}'s birthday is in ${daysAway} day${daysAway !== 1 ? 's' : ''}. Remember to organise a birthday contribution! 🎁`;
        const teamNotif = {
          title: teamTitle,
          message: teamMsg,
          type: 'birthday_reminder',
          priority: daysAway <= 1 ? 'high' : 'medium',
          delivery_channels: ['in_app', 'email'],
        };
        await admin.entities.Notification.create(teamNotif);
        newNotifications.push(teamNotif);
        existingTitles.add(teamTitle);
        results.birthdays++;
      }

      // Personal notification to the birthday person (on the day)
      if (daysAway === 0) {
        const personalTitle = `🎉 Happy Birthday, ${firstName}! (${bdayDateStr})`;
        if (!existingTitles.has(personalTitle)) {
          const personalNotif = {
            title: personalTitle,
            message: `Wishing you an amazing birthday, ${name}! From everyone at Phakathi Holdings. 🎂`,
            type: 'birthday_reminder',
            priority: 'high',
            target_users: [profile.user_email],
            delivery_channels: ['in_app', 'email'],
          };
          await admin.entities.Notification.create(personalNotif);
          newNotifications.push(personalNotif);
          existingTitles.add(personalTitle);
        }
      }
    }

    // --- 2. Scan holidays (today + next 7 days) ---
    for (let offset = 0; offset <= 7; offset++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + offset);
      const holiday = getHolidayForDate(checkDate);
      if (!holiday) continue;

      const dateStr = checkDate.toISOString().split('T')[0];
      const prefix = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : `In ${offset} days`;
      const holidayTitle = `${holiday.emoji} ${prefix}: ${holiday.name} (${dateStr})`;

      if (!existingTitles.has(holidayTitle)) {
        const holidayNotif = {
          title: holidayTitle,
          message: holiday.message,
          type: 'hr_reminder',
          priority: offset <= 1 ? 'high' : 'medium',
          delivery_channels: ['in_app', 'email'],
        };
        await admin.entities.Notification.create(holidayNotif);
        newNotifications.push(holidayNotif);
        existingTitles.add(holidayTitle);
        results.holidays++;
      }
    }

    // --- 3. Scan recent announcements (last 24h) ---
    const announcements = await admin.entities.Announcement.list('-created_date', 20);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    for (const a of announcements) {
      if (!a.created_date) continue;
      if (new Date(a.created_date) < yesterday) continue;

      const annTitle = `📢 ${a.title}`;
      if (!existingTitles.has(annTitle)) {
        const annNotif = {
          title: annTitle,
          message: a.content || '',
          type: 'general',
          priority: a.category === 'urgent' ? 'high' : 'medium',
          delivery_channels: ['in_app', 'email'],
        };
        await admin.entities.Notification.create(annNotif);
        newNotifications.push(annNotif);
        existingTitles.add(annTitle);
        results.announcements++;
      }
    }

    // --- 4. Send summary emails to opted-in users ---
    if (newNotifications.length > 0) {
      const optedIn = profiles.filter(p => p.email_notifications_enabled && p.notification_email);

      for (const profile of optedIn) {
        const emailBody = newNotifications.map(n => `• ${n.title}\n  ${n.message}`).join('\n\n');
        const firstName = (userMap[profile.user_email]?.full_name || profile.user_email || 'there').split(' ')[0];

        try {
          await admin.integrations.Core.SendEmail({
            to: profile.notification_email,
            subject: `Phakathi Flow — ${newNotifications.length} new update${newNotifications.length !== 1 ? 's' : ''} for you`,
            body: `Hi ${firstName},\n\nHere's your daily update from Phakathi Flow:\n\n${emailBody}\n\n— Phakathi Flow`,
          });
          results.emailsSent++;
        } catch (e) {
          results.errors.push(`Email to ${profile.notification_email}: ${e.message}`);
        }
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});