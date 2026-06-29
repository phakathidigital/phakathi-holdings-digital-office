import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/api/apiClient";
import { Calendar, Cake, Lightbulb, FileCheck, Mail } from "lucide-react";
import { getTodaysHoliday, getUpcomingHolidays } from "@/lib/saHolidays";
import { getDailyFunFact } from "@/lib/funFacts";

export default function DailyReminders() {
  const today = new Date();
  const todaysHoliday = getTodaysHoliday(today);
  const upcomingHolidays = getUpcomingHolidays(today, 14);
  const funFact = getDailyFunFact(today);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => api.entities.UserProfile.list(),
  });

  // Upcoming birthdays (next 14 days)
  const upcomingBirthdays = profiles
    .filter(p => p.birthday)
    .map(p => {
      const bday = new Date(p.birthday);
      const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
      const daysAway = Math.ceil((nextBday - today) / 86400000);
      return { ...p, nextBday, daysAway, isToday: daysAway === 0 };
    })
    .filter(p => p.daysAway <= 14)
    .sort((a, b) => a.daysAway - b.daysAway);

  const isMondayOrThursday = today.getDay() === 1 || today.getDay() === 4;
  const isMorning = today.getHours() < 12;

  const cards = [];

  // Today's holiday
  if (todaysHoliday) {
    cards.push({
      icon: Calendar,
      bg: 'from-rose-500 to-pink-600',
      title: todaysHoliday.name,
      body: todaysHoliday.message,
      emoji: todaysHoliday.emoji,
    });
  }

  // Upcoming holiday
  if (!todaysHoliday && upcomingHolidays.length > 0) {
    const next = upcomingHolidays[0];
    cards.push({
      icon: Calendar,
      bg: 'from-sky-500 to-blue-600',
      title: `Upcoming: ${next.name}`,
      body: next.daysAway === 1 ? 'Tomorrow!' : `In ${next.daysAway} days — ${next.message}`,
      emoji: next.emoji,
    });
  }

  // Birthdays
  if (upcomingBirthdays.length > 0) {
    const bday = upcomingBirthdays[0];
    cards.push({
      icon: Cake,
      bg: 'from-amber-400 to-orange-500',
      title: bday.isToday ? `🎂 Birthday Today!` : `Upcoming Birthday`,
      body: bday.isToday
        ? `It's ${bday.user_name || bday.user_email}'s birthday today! Don't forget to wish them well.`
        : `${bday.user_name || bday.user_email}'s birthday is in ${bday.daysAway} day${bday.daysAway > 1 ? 's' : ''}. Consider organising a contribution!`,
      emoji: '🎂',
    });
  }

  // DAM reminder
  if (isMondayOrThursday) {
    cards.push({
      icon: FileCheck,
      bg: 'from-violet-500 to-purple-600',
      title: 'DAM Reminder',
      body: 'Have you uploaded and classified your documents in the Document Vault this week? Keep compliance on track!',
      emoji: '📁',
    });
  }

  // Email reminder
  if (isMorning) {
    cards.push({
      icon: Mail,
      bg: 'from-teal-500 to-cyan-600',
      title: 'Morning Email Check',
      body: 'Take 10 minutes to clear your inbox and respond to priority emails before diving into deep work.',
      emoji: '✉️',
    });
  }

  // Fun fact / break reminder
  cards.push({
    icon: Lightbulb,
    bg: 'from-indigo-500 to-blue-600',
    title: 'Did You Know?',
    body: `${funFact.emoji} ${funFact.fact}`,
    emoji: funFact.emoji,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${card.bg} text-white p-4 shadow-sm`}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white">{card.title}</p>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">{card.body}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}