import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ListTodo, CalendarCheck, Rss, ThumbsUp, MessageSquare } from 'lucide-react';
import { fadeUp } from './MyDayHelpers';

export default function MyDaySummaryCards({ pendingCount, inProgressCount, todayCount, overdueCount, upcomingBookings, recentFeedPosts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Pending Tasks Summary */}
      <motion.div {...fadeUp(0.05)} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 text-white p-5 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <Link to="/Kanban">
              <span className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">View Board →</span>
            </Link>
          </div>
          <p className="text-4xl font-bold leading-none">{pendingCount}</p>
          <p className="text-white/80 text-sm mt-1 font-medium">Pending Tasks</p>
          <div className="mt-4 flex gap-3">
            <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center">
              <p className="text-lg font-bold">{inProgressCount}</p>
              <p className="text-[10px] text-white/70">In Progress</p>
            </div>
            <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center">
              <p className="text-lg font-bold">{todayCount}</p>
              <p className="text-[10px] text-white/70">Due Today</p>
            </div>
            <div className="bg-red-400/40 rounded-lg px-3 py-1.5 text-center">
              <p className="text-lg font-bold">{overdueCount}</p>
              <p className="text-[10px] text-white/70">Overdue</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upcoming Calendar Events */}
      <motion.div {...fadeUp(0.08)} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 text-white p-5 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <Link to="/Calendar">
              <span className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">Open Calendar →</span>
            </Link>
          </div>
          <p className="text-4xl font-bold leading-none">{upcomingBookings.length}</p>
          <p className="text-white/80 text-sm mt-1 font-medium">Upcoming Events</p>
          {upcomingBookings.length === 0 ? (
            <p className="text-white/50 text-xs mt-4">No events booked — your calendar is clear!</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {upcomingBookings.map(b => (
                <div key={b.id} className="flex items-center gap-2 bg-white/15 rounded-lg px-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
                  <p className="text-xs font-medium truncate">{b.title}</p>
                  <span className="text-[10px] text-white/60 ml-auto flex-shrink-0">{b.start_time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Company Feed */}
      <motion.div {...fadeUp(0.11)} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 text-white p-5 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Rss className="w-5 h-5 text-white" />
            </div>
            <Link to="/CompanyFeed">
              <span className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors">See Feed →</span>
            </Link>
          </div>
          <p className="text-4xl font-bold leading-none">{recentFeedPosts.length}</p>
          <p className="text-white/80 text-sm mt-1 font-medium">Recent Posts</p>
          {recentFeedPosts.length === 0 ? (
            <p className="text-white/50 text-xs mt-4">No posts yet — be the first to share!</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {recentFeedPosts.slice(0, 3).map(post => (
                <div key={post.id} className="bg-white/15 rounded-lg px-2.5 py-1.5">
                  <p className="text-xs font-medium truncate">{post.content?.slice(0, 50)}{post.content?.length > 50 ? '…' : ''}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-white/60">{post.author_name || 'Someone'}</span>
                    {post.likes?.length > 0 && (
                      <span className="text-[10px] text-white/60 flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" />{post.likes.length}</span>
                    )}
                    {post.comments?.length > 0 && (
                      <span className="text-[10px] text-white/60 flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{post.comments.length}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}