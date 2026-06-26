import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Circle, Calendar, Clock, AlertTriangle, Award, Megaphone
} from 'lucide-react';
import { fadeUp, SectionHeader, PRIORITY_COLORS, BADGE_EMOJI } from './MyDayHelpers';

export default function MyDayLeftColumn({ overdueTasks, todayTasks, upcomingMeetings, pendingApprovals, recognitions, announcements }) {
  return (
    <div className="lg:col-span-2 space-y-5">

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <motion.div {...fadeUp(0.06)} className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} need your attention</p>
                <p className="text-white/70 text-xs mt-0.5">{overdueTasks.slice(0, 2).map(t => t.title).join(', ')}{overdueTasks.length > 2 ? ` +${overdueTasks.length - 2} more` : ''}</p>
              </div>
            </div>
            <Link to="/Kanban">
              <Button size="sm" className="bg-white text-red-600 hover:bg-red-50 border-0 font-semibold text-xs">Fix Now</Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Today's Tasks */}
      <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <SectionHeader icon={CheckCircle2} iconColor="bg-violet-100 text-violet-600" title="Tasks Due Today" badge={todayTasks.length} linkTo="/Kanban" linkLabel="Kanban" />
        {todayTasks.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="font-semibold text-gray-700">You're all caught up!</p>
            <p className="text-gray-400 text-sm mt-1">No tasks due today</p>
            <Link to="/Kanban"><Button variant="outline" size="sm" className="mt-3 text-xs">Browse all tasks</Button></Link>
          </div>
        ) : (
          <div className="space-y-1">
            {todayTasks.slice(0, 7).map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
                <Circle className="w-4 h-4 text-gray-200 group-hover:text-violet-300 transition-colors flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                  {task.assigned_to && <p className="text-xs text-gray-400 truncate">{task.assigned_to}</p>}
                </div>
                <Badge className={`text-xs border flex-shrink-0 font-medium ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-400 border-gray-200'}`}>{task.priority}</Badge>
              </motion.div>
            ))}
            {todayTasks.length > 7 && (
              <Link to="/Kanban">
                <p className="text-xs text-center text-violet-500 hover:text-violet-700 font-medium py-2 cursor-pointer">+{todayTasks.length - 7} more tasks →</p>
              </Link>
            )}
          </div>
        )}
      </motion.div>

      {/* Upcoming Meetings */}
      <motion.div {...fadeUp(0.14)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <SectionHeader icon={Calendar} iconColor="bg-blue-100 text-blue-600" title="Upcoming Meetings" badge={upcomingMeetings.length} linkTo="/MeetingStudio" linkLabel="Meeting Studio" />
        {upcomingMeetings.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700">No meetings scheduled</p>
            <p className="text-gray-400 text-sm mt-1">Enjoy the clear calendar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{m.title}</p>
                  <p className="text-xs text-gray-500">{m.meeting_date} · {m.attendees?.length || 0} attendees</p>
                </div>
                <Badge className={`text-xs border-0 font-medium ${m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{m.status}</Badge>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <motion.div {...fadeUp(0.18)} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
          <SectionHeader icon={Clock} iconColor="bg-amber-100 text-amber-600" title="Pending Approvals" badge={pendingApprovals.length} linkTo="/Leave" linkLabel="Review All" />
          <div className="space-y-2">
            {pendingApprovals.slice(0, 4).map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sm font-bold text-white">{req.employee_name?.charAt(0) || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{req.employee_name}</p>
                  <p className="text-xs text-gray-500">{req.leave_type} · {req.start_date} → {req.end_date}</p>
                </div>
                <Link to="/Leave"><Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-7 border-0">Review</Button></Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Recognitions */}
      {recognitions.length > 0 && (
        <motion.div {...fadeUp(0.22)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionHeader icon={Award} iconColor="bg-yellow-100 text-yellow-600" title="Recent Recognition" linkTo="/CultureHub" linkLabel="Culture Hub" />
          <div className="space-y-2">
            {recognitions.slice(0, 4).map(rec => (
              <div key={rec.id} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100">
                <span className="text-xl mt-0.5">{BADGE_EMOJI[rec.badge_type] || '🏆'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{rec.sender_name}</span> recognised{' '}
                    <span className="font-semibold text-amber-700">{rec.recipient_name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">"{rec.message}"</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <motion.div {...fadeUp(0.26)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <SectionHeader icon={Megaphone} iconColor="bg-orange-100 text-orange-600" title="Company Announcements" linkTo="/Noticeboard" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {announcements.map(a => (
              <div key={a.id} className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                <p className="text-sm font-semibold text-gray-800 mb-1">{a.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}