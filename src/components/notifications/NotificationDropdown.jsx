import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
};

const TYPE_ICONS = {
  security_alert: '🔒',
  it_downtime: '⚠️',
  hr_reminder: '📋',
  meeting_reminder: '📅',
  birthday_reminder: '🎂',
  dam_reminder: '📁',
  executive_notice: '📢',
  general: '💬',
};

export default function NotificationDropdown({ notifications, userEmail, onClose }) {
  const queryClient = useQueryClient();

  const markRead = useMutation({
    mutationFn: (id) => {
      const notif = notifications.find(n => n.id === id);
      const already = notif?.is_read_by || [];
      if (already.includes(userEmail)) return Promise.resolve();
      return api.entities.Notification.update(id, { is_read_by: [...already, userEmail] });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-bell'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => {
      const unread = notifications.filter(n => !n.is_read_by?.includes(userEmail));
      return Promise.all(unread.map(n =>
        api.entities.Notification.update(n.id, { is_read_by: [...(n.is_read_by || []), userEmail] })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-bell'] }),
  });

  const recent = notifications.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="fixed left-4 right-4 top-20 mx-auto w-auto max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9998] overflow-hidden md:left-auto md:right-6 md:mx-0 md:w-96"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-700" />
          <span className="font-semibold text-sm text-gray-900">Notifications</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => markAllRead.mutate()} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <CheckCheck className="w-3 h-3" /> All read
          </button>
          <Link to="/Notifications" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> View all
          </Link>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {recent.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">No notifications yet</div>
        ) : (
          recent.map(n => {
            const isRead = n.is_read_by?.includes(userEmail);
            return (
              <div
                key={n.id}
                onClick={() => !isRead && markRead.mutate(n.id)}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!isRead ? 'bg-blue-50/40' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{TYPE_ICONS[n.type] || '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORITY_COLORS[n.priority]}`}>
                        {n.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  {!isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
