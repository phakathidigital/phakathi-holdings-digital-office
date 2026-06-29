import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Cake, Gift } from 'lucide-react';
import { format, parseISO, isSameDay, addDays, differenceInDays } from 'date-fns';

function getDaysUntilBirthday(birthdayStr) {
  if (!birthdayStr) return null;
  const today = new Date();
  const bday = parseISO(birthdayStr);
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  return differenceInDays(thisYear, today);
}

export default function BirthdayWall() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['user-profiles-birthdays'],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const upcoming = profiles
    .filter(p => p.birthday)
    .map(p => ({ ...p, daysUntil: getDaysUntilBirthday(p.birthday) }))
    .filter(p => p.daysUntil !== null && p.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const todayBirthdays = upcoming.filter(p => p.daysUntil === 0);
  const soonBirthdays = upcoming.filter(p => p.daysUntil > 0 && p.daysUntil <= 7);
  const thiMonth = upcoming.filter(p => p.daysUntil > 7);

  return (
    <div className="space-y-4">
      {todayBirthdays.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Cake className="w-4 h-4 text-pink-500" /> Today's Birthdays 🎉
          </h3>
          <div className="space-y-2">
            {todayBirthdays.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {p.user_email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{p.user_email?.split('@')[0]}</p>
                  <p className="text-xs text-pink-600">🎂 Happy Birthday!</p>
                </div>
                <Gift className="w-5 h-5 text-pink-400" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {soonBirthdays.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Coming up this week</h3>
          <div className="space-y-2">
            {soonBirthdays.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                  {p.user_email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{p.user_email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{format(parseISO(p.birthday), 'MMMM d')}</p>
                </div>
                <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                  {p.daysUntil === 1 ? 'Tomorrow' : `${p.daysUntil} days`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {thiMonth.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">This month</h3>
          <div className="space-y-1.5">
            {thiMonth.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                  {p.user_email?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm text-gray-700 flex-1">{p.user_email?.split('@')[0]}</span>
                <span className="text-xs text-gray-400">{p.birthday ? format(parseISO(p.birthday), 'MMM d') : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <Cake className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No upcoming birthdays in the next 30 days</p>
        </div>
      )}
    </div>
  );
}