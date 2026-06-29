import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Bell } from 'lucide-react';

const PRIORITY_STYLES = {
  low: 'border-l-gray-400 bg-white',
  medium: 'border-l-blue-500 bg-white',
  high: 'border-l-orange-500 bg-white',
  critical: 'border-l-red-600 bg-red-50',
};

export default function NotificationToast({ notification, onDismiss }) {
  const timerRef = useRef(null);
  const duration = notification?.priority === 'critical' ? null : 10000;

  useEffect(() => {
    if (duration) {
      timerRef.current = setTimeout(onDismiss, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [duration, onDismiss]);

  if (!notification) return null;

  return (
    <motion.div
      initial={{ y: -24, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -24, opacity: 0, scale: 0.96 }}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-gray-200 border-l-4 p-4 shadow-2xl backdrop-blur min-w-72 ${PRIORITY_STYLES[notification.priority] || PRIORITY_STYLES.medium}`}
    >
      <Bell className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
        {notification.priority === 'critical' && (
          <span className="inline-block mt-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            Action Required
          </span>
        )}
      </div>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
