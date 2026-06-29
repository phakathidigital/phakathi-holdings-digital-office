import express from "express";
import { vapidPublicKey } from "../config/push.js";
import { requireAuth } from "../middleware/auth.js";
import { nowStamped, readDb, writeDb } from "../config/database.js";
import { runNotificationScan } from "../services/scheduler.js";
import { deliverNotification } from "../services/pushService.js";

const router = express.Router();

router.get("/vapid-public-key", (_req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

router.post("/subscribe", requireAuth, async (req, res) => {
  const db = req.db;
  db.entities.PushSubscription ||= [];
  const { endpoint, keys, device_label, user_agent } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ message: "Invalid push subscription" });

  const existingIndex = db.entities.PushSubscription.findIndex((sub) => sub.endpoint === endpoint);
  const record = nowStamped({
    user_email: req.user.email,
    endpoint,
    keys,
    device_label,
    user_agent,
    enabled: true,
    last_seen_at: new Date().toISOString(),
  }, existingIndex >= 0 ? db.entities.PushSubscription[existingIndex] : {});

  if (existingIndex >= 0) db.entities.PushSubscription[existingIndex] = record;
  else db.entities.PushSubscription.push(record);

  await writeDb(db);
  res.json(record);
});

router.post("/unsubscribe", requireAuth, async (req, res) => {
  const db = req.db;
  db.entities.PushSubscription ||= [];
  db.entities.PushSubscription = db.entities.PushSubscription.map((sub) =>
    sub.endpoint === req.body.endpoint && sub.user_email === req.user.email
      ? { ...sub, enabled: false, updated_date: new Date().toISOString() }
      : sub
  );
  await writeDb(db);
  res.json({ success: true });
});

router.post("/test", requireAuth, async (req, res) => {
  const db = await readDb();
  db.entities.Notification ||= [];
  const notification = nowStamped({
    title: "🔔 Test notification",
    message: "Push notifications are working on this device.",
    type: "general",
    priority: "low",
    target_users: [req.user.email],
    delivery_channels: ["in_app", "browser_push"],
    preference_key: "push_notifications_enabled",
    created_by: req.user.email,
    is_read_by: [],
    acknowledged_by: [],
    is_archived: false,
  });
  db.entities.Notification.push(notification);
  await writeDb(db);
  const latestDb = await readDb();
  await deliverNotification(latestDb, notification);
  res.json(notification);
});

router.post("/run-scan", requireAuth, async (_req, res) => {
  const created = await runNotificationScan();
  res.json({ created: created.length, notifications: created });
});

export default router;
