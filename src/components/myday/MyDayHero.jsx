import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sun, Moon } from 'lucide-react';
import { fadeUp, StatPill } from './MyDayHelpers';

function getGreeting(h) {
  if (h < 12) return { text: 'Good Morning', Icon: Sun, bg: 'from-amber-500 to-orange-400' };
  if (h < 17) return { text: 'Good Afternoon', Icon: Sun, bg: 'from-orange-400 to-rose-400' };
  return { text: 'Good Evening', Icon: Moon, bg: 'from-indigo-500 to-purple-600' };
}

export default function MyDayHero({ user, now, stats }) {
  const { text: greetText, Icon: GreetIcon, bg: greetBg } = getGreeting(now.getHours());
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <motion.div {...fadeUp(0)} className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 text-white overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-purple-600/15 blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${greetBg} flex items-center justify-center shadow-xl`}>
              <GreetIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">{format(now, 'EEEE, MMMM d, yyyy')}</p>
              <h1 className="text-3xl md:text-4xl font-bold mt-0.5 tracking-tight">
                {greetText}, {firstName} 👋
              </h1>
              <p className="text-white/40 text-sm mt-1">Here's your day at a glance</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {stats.overdueCount > 0 && (
              <StatPill value={stats.overdueCount} label="Overdue" color="bg-red-500/30 text-red-200" />
            )}
            <StatPill value={stats.todayCount} label="Due Today" />
            <StatPill value={stats.meetingsCount} label="Meetings" />
            <StatPill value={stats.approvalsCount} label="Approvals" />
            <StatPill value={stats.unreadCount} label="Unread" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}