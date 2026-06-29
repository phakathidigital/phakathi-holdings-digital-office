import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format } from 'date-fns';
import { getTodayStr, getOverdueTasks, getTodaysTasks, getPendingTasks, getInProgressTasks } from '@/lib/taskUtils';
import DailyReminders from '@/components/dashboard/DailyReminders';
import MyDayHero from '@/components/myday/MyDayHero';
import MyDaySummaryCards from '@/components/myday/MyDaySummaryCards';
import MyDayLeftColumn from '@/components/myday/MyDayLeftColumn';
import MyDayRightColumn from '@/components/myday/MyDayRightColumn';

export default function MyDay() {
  const [user, setUser] = useState(null);
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  useEffect(() => { api.auth.me().then(setUser).catch(() => {}); }, []);

  // Personal view: only fetch the current user's assigned tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: () => api.entities.Task.filter({ assigned_to: user.email }, '-created_date', 150),
    enabled: !!user?.email,
  });
  const { data: meetings = [] } = useQuery({ queryKey: ['meetings'], queryFn: () => api.entities.MeetingStudio.list('-meeting_date', 15) });
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: () => api.entities.Notification.list('-created_date', 20) });
  const { data: announcements = [] } = useQuery({ queryKey: ['announcements'], queryFn: () => api.entities.Announcement.list('-created_date', 4) });
  const { data: presences = [] } = useQuery({ queryKey: ['presences'], queryFn: () => api.entities.UserPresence.list('-last_seen', 12) });
  const { data: leaveRequests = [] } = useQuery({ queryKey: ['leave'], queryFn: () => api.entities.LeaveRequest.filter({ status: 'pending' }) });
  const { data: recognitions = [] } = useQuery({ queryKey: ['recognitions'], queryFn: () => api.entities.Recognition.list('-created_date', 5) });
  const { data: feedPosts = [] } = useQuery({ queryKey: ['feedPosts'], queryFn: () => api.entities.CompanyFeedPost.list('-created_date', 5) });
  const { data: bookings = [] } = useQuery({ queryKey: ['bookings'], queryFn: () => api.entities.Booking.list('-date', 30) });

  const todayTasks = getTodaysTasks(tasks, todayStr);
  const overdueTasks = getOverdueTasks(tasks, todayStr);
  const upcomingMeetings = meetings.filter(m => m.meeting_date >= todayStr).slice(0, 3);
  const unreadNotifs = notifications.filter(n => !n.is_read_by?.includes(user?.email));
  const pendingApprovals = leaveRequests.filter(l => l.status === 'pending');
  const onlineCount = presences.filter(p => p.status === 'online' || p.status === 'busy').length;
  const pendingTasks = getPendingTasks(tasks);
  const inProgressTasks = getInProgressTasks(tasks);
  const upcomingBookings = bookings.filter(b => b.date >= todayStr && b.status === 'confirmed').slice(0, 3);
  const recentFeedPosts = feedPosts.slice(0, 4);

  const heroStats = {
    overdueCount: overdueTasks.length,
    todayCount: todayTasks.length,
    meetingsCount: upcomingMeetings.length,
    approvalsCount: pendingApprovals.length,
    unreadCount: unreadNotifs.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        <MyDayHero user={user} now={now} stats={heroStats} />

        <MyDaySummaryCards
          pendingCount={pendingTasks.length}
          inProgressCount={inProgressTasks.length}
          todayCount={todayTasks.length}
          overdueCount={overdueTasks.length}
          upcomingBookings={upcomingBookings}
          recentFeedPosts={recentFeedPosts}
        />

        <DailyReminders />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <MyDayLeftColumn
            overdueTasks={overdueTasks}
            todayTasks={todayTasks}
            upcomingMeetings={upcomingMeetings}
            pendingApprovals={pendingApprovals}
            recognitions={recognitions}
            announcements={announcements}
          />
          <MyDayRightColumn
            user={user}
            tasks={tasks}
            leaveRequests={leaveRequests}
            notifications={notifications}
            presences={presences}
            onlineCount={onlineCount}
          />
        </div>
      </div>
    </div>
  );
}