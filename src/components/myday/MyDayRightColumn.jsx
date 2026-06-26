import { motion } from 'framer-motion';
import { Bell, Users } from 'lucide-react';
import AIBriefingCard from '@/components/myday/AIBriefingCard';
import { fadeUp, SectionHeader, STATUS_DOT } from './MyDayHelpers';

export default function MyDayRightColumn({ user, tasks, leaveRequests, notifications, presences, onlineCount }) {
  const unreadNotifs = notifications.filter(n => !n.is_read_by?.includes(user?.email));

  return (
    <div className="space-y-5">

      {/* AI Daily Briefing */}
      <AIBriefingCard user={user} tasks={tasks} leaveRequests={leaveRequests} />

      {/* Notifications */}
      <motion.div {...fadeUp(0.12)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <SectionHeader icon={Bell} iconColor="bg-purple-100 text-purple-600" title="Notifications"
          badge={unreadNotifs.length > 0 ? unreadNotifs.length : undefined} linkTo="/Notifications" />
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-purple-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">All clear!</p>
            <p className="text-xs text-gray-400 mt-1">No new notifications</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {notifications.slice(0, 6).map(n => (
              <div key={n.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${!n.is_read_by?.includes(user?.email) ? 'bg-purple-50 border border-purple-100' : 'hover:bg-gray-50'}`}>
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${n.priority === 'critical' ? 'bg-red-500' : n.priority === 'high' ? 'bg-orange-400' : 'bg-gray-300'}`} />
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{n.title}</p>
                  <p className="text-gray-400 truncate mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* TeamAvailability */}
      <motion.div {...fadeUp(0.16)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <SectionHeader icon={Users} iconColor="bg-emerald-100 text-emerald-600" title="Team Online"
          badge={`${onlineCount} active`} />
        {presences.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-emerald-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">No presence data</p>
            <p className="text-xs text-gray-400 mt-1">Team status will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {presences.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600">{p.user_name?.charAt(0) || '?'}</span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[p.status] || 'bg-gray-300'}`} />
                </div>
                <p className="text-sm text-gray-700 flex-1 truncate font-medium">{p.user_name}</p>
                <span className="text-xs text-gray-400 capitalize">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}