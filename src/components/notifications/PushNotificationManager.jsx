import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

/**
 * Manages browser push notifications.
 * When the user enables push in Settings, this component:
 * 1. Requests notification permission from the browser
 * 2. Registers the service worker
 * 3. Stores this device's push subscription on the backend
 * 4. Falls back to in-tab notifications for active sessions
 */
export default function PushNotificationManager({ user }) {
  const { data: profile } = useQuery({
    queryKey: ['userProfile-push', user?.email],
    queryFn: () => api.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const pushEnabled = profile?.[0]?.push_notifications_enabled || false;

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

  return null;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
