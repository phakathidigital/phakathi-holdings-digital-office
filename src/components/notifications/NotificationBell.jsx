import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-bell', user?.email],
    queryFn: () => api.entities.Notification.list('-created_date', 50),
    enabled: !!user?.email,
    refetchInterval: 20000,
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = api.entities.Notification.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
    });
    return unsubscribe;
  }, [user?.email, queryClient]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const userNotifs = notifications.filter(n => {
    if (!n.is_read_by?.includes(user?.email)) return true;
    return false;
  });
  const unread = userNotifs.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <NotificationDropdown
            notifications={notifications}
            userEmail={user?.email}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}