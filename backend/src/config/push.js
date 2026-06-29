import webPush from "web-push";

const fallbackKeys = webPush.generateVAPIDKeys();

export const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || fallbackKeys.publicKey;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || fallbackKeys.privateKey;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:notifications@phakathiholdings.local";

webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn("Using temporary VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY for persistent push subscriptions.");
}

export { webPush };
