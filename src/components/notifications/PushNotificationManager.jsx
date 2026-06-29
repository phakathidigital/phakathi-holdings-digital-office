import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { api } from '@/api/apiClient';
import NotificationToast from './NotificationToast';

/**
 * Manages browser push notifications.
 * When the user enables push in Settings, this component:
 * 1. Requests notification permission from the browser
 * 2. Registers the service worker
 * 3. Stores this device's push subscription on the backend
 * 4. Falls back to in-tab notifications for active sessions
 */
export default function PushNotificationManager({ user }) {
  const queryClient = useQueryClient();
  const seenToastIdsRef = useRef(new Set());
  const toastBootstrappedRef = useRef(false);
  const [activeToasts, setActiveToasts] = useState([]);

  const { data: profile } = useQuery({
    queryKey: ['userProfile-push', user?.email],
    queryFn: () => api.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-live-popups', user?.email],
    queryFn: () => api.entities.Notification.list('-created_date', 25),
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  const pushEnabled = profile?.[0]?.push_notifications_enabled || false;

  const isNotificationForUser = useCallback((notif) => {
    if (!notif || notif.is_archived) return false;
    if (notif.target_users?.length > 0 && !notif.target_users.includes(user?.email)) return false;
    if (notif.is_read_by?.includes(user?.email)) return false;
    return true;
  }, [user?.email]);

  const dismissToast = useCallback((id) => {
    setActiveToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    const relevant = notifications
      .filter(isNotificationForUser)
      .sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));

    if (!toastBootstrappedRef.current) {
      relevant.forEach((notif) => seenToastIdsRef.current.add(notif.id));
      toastBootstrappedRef.current = true;
      return;
    }

    const fresh = relevant.filter((notif) => !seenToastIdsRef.current.has(notif.id));
    if (fresh.length === 0) return;

    fresh.forEach((notif) => seenToastIdsRef.current.add(notif.id));
    setActiveToasts((items) => [...fresh, ...items].slice(0, 4));
    queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
  }, [notifications, isNotificationForUser, queryClient, user?.email]);

  useEffect(() => {
    if (!user?.email || !pushEnabled) return;

    let unsubscribe;
    let cancelled = false;

    (async () => {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      const { publicKey } = await api.push.getVapidPublicKey();
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      if (!cancelled) {
        await api.push.subscribe({
          ...subscription.toJSON(),
          device_label: navigator.platform || 'Browser device',
          user_agent: navigator.userAgent,
        });
      }

      unsubscribe = api.entities.Notification.subscribe((event) => {
        if (event.type !== 'create') return;
        const notif = event.data;
        if (!notif) return;

        // Check targeting — if target_users is set, only show to those users
        if (notif.target_users?.length > 0 && !notif.target_users.includes(user.email)) return;

        try {
          new Notification(notif.title || 'Phakathi Flow', {
            body: notif.message || '',
            tag: notif.id,
            icon: '/brand/phakathi-holdings-icon.svg',
            badge: '/brand/phakathi-holdings-icon.svg',
            requireInteraction: false,
            renotify: true,
            timestamp: Date.now(),
            silent: false,
          });
        } catch (e) {
          // Service worker push covers supported devices.
        }
      });
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.email, pushEnabled]);

  return (
    <div className="fixed left-1/2 top-5 z-[9999] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((notif) => (
          <NotificationToast
            key={notif.id}
            notification={notif}
            onDismiss={() => dismissToast(notif.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
