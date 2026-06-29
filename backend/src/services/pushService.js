import { webPush } from "../config/push.js";
import { nowStamped, writeDb } from "../config/database.js";

function isTargetedToUser(notification, userEmail) {
  return !notification.target_users?.length || notification.target_users.includes(userEmail);
}

function userAllowsNotification(profile, notification) {
  if (!profile || profile.push_notifications_enabled === false) return false;
  if (notification.preference_key && profile[notification.preference_key] === false) return false;
  return true;
}

export async function deliverNotification(db, notification) {
  db.entities.PushSubscription ||= [];
  db.entities.NotificationDelivery ||= [];
  db.entities.UserProfile ||= [];

  const profilesByEmail = new Map(db.entities.UserProfile.map((profile) => [profile.user_email, profile]));
  const subscriptions = db.entities.PushSubscription.filter((sub) => {
    const profile = profilesByEmail.get(sub.user_email);
    return sub.enabled !== false && userAllowsNotification(profile, notification) && isTargetedToUser(notification, sub.user_email);
  });

  const payload = JSON.stringify({
    title: notification.title || "Phakathi Flow",
    body: notification.message || "",
    tag: notification.id,
    url: "/Notifications",
    icon: "/brand/phakathi-holdings-icon.svg",
    badge: "/brand/phakathi-holdings-icon.svg",
    data: { notificationId: notification.id, url: "/Notifications" },
  });

  for (const sub of subscriptions) {
    const delivery = nowStamped({
      notification_id: notification.id,
      user_email: sub.user_email,
      channel: "browser_push",
      status: "pending",
      endpoint: sub.endpoint,
    });
    try {
      await webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
      delivery.status = "sent";
      delivery.sent_at = new Date().toISOString();
    } catch (error) {
      delivery.status = "failed";
      delivery.error = error.message;
      if (error.statusCode === 404 || error.statusCode === 410) sub.enabled = false;
    }
    db.entities.NotificationDelivery.push(delivery);
  }

  await writeDb(db);
}
