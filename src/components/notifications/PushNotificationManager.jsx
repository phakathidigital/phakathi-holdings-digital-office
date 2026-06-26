import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Manages browser push notifications.
 * When the user enables push in Settings, this component:
 * 1. Requests notification permission from the browser
 * 2. Subscribes to real-time Notification entity changes
 * 3. Shows a browser notification when new alerts arrive (even if the tab is in the background)
 *
 * Note: True push when the app is fully closed requires a push server (VAPID).
 * For the "app closed" case, email delivery covers it via the daily scan automation.
 */
export default function PushNotificationManager({ user }) {
  const { data: profile } = useQuery({
    queryKey: ['userProfile-push', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const pushEnabled = profile?.[0]?.push_notifications_enabled || false;

  useEffect(() => {
    if (!user?.email || !pushEnabled) return;

    let unsubscribe;

    (async () => {
      if (!('Notification' in window)) return;

      // Request permission if not yet asked
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') return;

      // Subscribe to real-time notification creates
      unsubscribe = base44.entities.Notification.subscribe((event) => {
        if (event.type !== 'create') return;
        const notif = event.data;
        if (!notif) return;

        // Check targeting — if target_users is set, only show to those users
        if (notif.target_users?.length > 0 && !notif.target_users.includes(user.email)) return;

        try {
          new Notification(notif.title || 'Phakathi Flow', {
            body: notif.message || '',
            tag: notif.id,
            silent: false,
          });
        } catch (e) {
          // Some browsers require a service worker — silently ignore
        }
      });
    })();

    return () => { if (unsubscribe) unsubscribe(); };
  }, [user?.email, pushEnabled]);

  return null;
}