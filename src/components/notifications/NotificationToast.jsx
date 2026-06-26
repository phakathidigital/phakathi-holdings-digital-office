import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

const PRIORITY_STYLES = {
  low: 'border-l-gray-400 bg-white',
  medium: 'border-l-blue-500 bg-white',
  high: 'border-l-orange-500 bg-white',
  critical: 'border-l-red-600 bg-red-50',
};

export default function NotificationToast({ notification, onDismiss }) {
  const timerRef = useRef(null);
  const duration = notification?.priority === 'critical' ? null : 5000;

  useEffect(() => {
    if (duration) {
      timerRef.current = setTimeout(onDismiss, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [duration, onDismiss]);

  if (!notification) return null;

  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border-l-4 min-w-72 max-w-sm ${PRIORITY_STYLES[notification.priority]}`}
      style={{ border: '1px solid #e5e7eb' }}
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