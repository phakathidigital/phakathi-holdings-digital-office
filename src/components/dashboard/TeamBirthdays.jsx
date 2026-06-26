import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Cake, Sparkles, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function TeamBirthdays() {
  const today = new Date();

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfiles-birthdays'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-bd'],
    queryFn: () => base44.entities.User.list(),
  });

  const userMap = {};
  users.forEach(u => { userMap[u.email] = u; });

  const upcomingBirthdays = profiles
    .filter(p => p.birthday)
    .map(p => {
      const bday = new Date(p.birthday);
      const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
      const daysAway = Math.ceil((nextBday - today) / 86400000);
      const name = userMap[p.user_email]?.full_name || p.user_email || 'Team Member';
      return { ...p, name, nextBday, daysAway, isToday: daysAway === 0 };
    })
    .filter(p => p.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway);

  const getCardStyle = (daysAway) => {
    if (daysAway === 0) return { bg: 'from-pink-500 to-rose-500', ring: 'ring-pink-300/50', badge: 'bg-white/30' };
    if (daysAway <= 7) return { bg: 'from-amber-400 to-orange-500', ring: 'ring-amber-200/50', badge: 'bg-white/25' };
    return { bg: 'from-violet-500 to-purple-500', ring: 'ring-violet-200/50', badge: 'bg-white/20' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-6 shadow-xl"
    >
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl translate-y-1/2 -translate-x-1/4" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Cake className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Team Birthdays
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h2>
            <p className="text-white/50 text-sm">Celebrate everyone's special day 🎉</p>
          </div>
        </div>
        {upcomingBirthdays.length > 0 && (
          <span className="text-sm bg-white/10 text-white/70 px-3 py-1.5 rounded-full font-medium">
            {upcomingBirthdays.length} upcoming
          </span>
        )}
      </div>

      {/* Birthday cards */}
      {upcomingBirthdays.length === 0 ? (
        <div className="relative py-12 text-center">
          <div className="text-5xl mb-3">🎈</div>
          <p className="text-white/60 font-medium">No birthdays in the next 30 days</p>
          <p className="text-white/30 text-sm mt-1">Add birthdays in Profile to see them here</p>
        </div>
      ) : (
        <div className="relative flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {upcomingBirthdays.map((b, i) => {
            const style = getCardStyle(b.daysAway);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`flex-shrink-0 w-44 rounded-2xl bg-gradient-to-br ${style.bg} p-4 text-white shadow-lg ring-2 ${style.ring} relative overflow-hidden`}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />

                <div className="relative flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center font-bold text-sm">
                    {b.name.charAt(0)}
                  </div>
                  {b.isToday && <span className="text-lg">🎉</span>}
                </div>

                <p className="font-semibold text-sm truncate">{b.name}</p>

                <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(b.nextBday, 'MMM d')}
                </p>

                <div className={`mt-3 inline-block ${style.badge} rounded-full px-2.5 py-1 text-xs font-bold`}>
                  {b.isToday ? 'Today! 🎂' : b.daysAway === 1 ? 'Tomorrow!' : `In ${b.daysAway} days`}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}