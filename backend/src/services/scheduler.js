import { nowStamped, readDb, writeDb } from "../config/database.js";
import { birthdayNotifications, dailyWellnessNotifications, holidayNotifications, damUsageNotifications } from "./notificationContent.js";
import { deliverNotification } from "./pushService.js";

function alreadyExists(notifications, scheduleKey) {
  return notifications.some((notification) => notification.schedule_key === scheduleKey);
}

export async function runNotificationScan(date = new Date()) {
  const db = await readDb();
  db.entities.Notification ||= [];

  const candidates = [
    ...holidayNotifications(db, date),
    ...birthdayNotifications(db, date),
    ...damUsageNotifications(db, date),
    ...dailyWellnessNotifications(db, date),
  ];

  const created = [];
  for (const item of candidates) {
    if (alreadyExists(db.entities.Notification, item.schedule_key)) continue;
    const notification = nowStamped({
      ...item,
      created_by: "system",
      is_read_by: [],
      acknowledged_by: [],
      is_archived: false,
    });
    db.entities.Notification.push(notification);
    created.push(notification);
  }

  await writeDb(db);

  for (const notification of created) {
    const latestDb = await readDb();
    await deliverNotification(latestDb, notification);
  }

  return created;
}

export function startNotificationScheduler() {
  const run = () => runNotificationScan().catch((error) => console.error("Notification scan failed:", error));
  setTimeout(run, 5000);
  setInterval(run, 1000 * 60 * 60 * 4);
}
