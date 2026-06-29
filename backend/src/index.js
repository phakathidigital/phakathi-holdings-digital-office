import express from "express";
import cors from "cors";
import path from "node:path";
import { ensureStore } from "./config/database.js";
import { uploadDir } from "./config/paths.js";
import authRoutes from "./routes/auth.js";
import entityRoutes from "./routes/entities.js";
import integrationRoutes from "./routes/integrations.js";
import functionRoutes from "./routes/functions.js";
import analyticsRoutes from "./routes/analytics.js";
import pushRoutes from "./routes/push.js";
import { startNotificationScheduler } from "./services/scheduler.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "phakathi-flow-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/entities", entityRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/functions", functionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/push", pushRoutes);

// README-style resource route aliases. The frontend compatibility client uses
// /api/entities/:EntityName, while these aliases keep the backend ready for
// direct REST resource routes as the production API is hardened.
const resourceAliases = {
  users: "User",
  "user-profiles": "UserProfile",
  "user-presence": "UserPresence",
  projects: "Project",
  tasks: "Task",
  "leave-requests": "LeaveRequest",
  expenses: "Expense",
  tickets: "Ticket",
  "ticket-comments": "TicketComment",
  "hr-documents": "HRDocument",
  "doc-folders": "DocFolder",
  "onboarding-records": "OnboardingRecord",
  "performance-reviews": "PerformanceReview",
  kpis: "KPI",
  okrs: "OKR",
  "peer-feedback": "PeerFeedback",
  payslips: "Payslip",
  "benefits-enrollments": "BenefitsEnrollment",
  assets: "Asset",
  announcements: "Announcement",
  channels: "Channel",
  messages: "Message",
  bookings: "Booking",
  resources: "Resource",
  "meeting-notes": "MeetingNote",
  "meeting-studio": "MeetingStudio",
  "time-logs": "TimeLog",
  portfolios: "Portfolio",
  milestones: "Milestone",
  "company-feed": "CompanyFeedPost",
  recognitions: "Recognition",
  notifications: "Notification",
  "push-subscriptions": "PushSubscription",
  "notification-deliveries": "NotificationDelivery",
  "knowledge-base": "KnowledgeBaseDocument",
  "dam-compliance-rules": "DAMComplianceRule",
  "sage-integration": "SageIntegration",
  "drive-sync": "DriveSyncConnection",
};

for (const [route, entityName] of Object.entries(resourceAliases)) {
  app.use(`/api/${route}`, (req, _res, next) => {
    req.url = `/entities/${entityName}${req.url === "/" ? "" : req.url}`;
    next();
  }, entityRoutes);
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

await ensureStore();
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Phakathi Flow API running on http://127.0.0.1:${PORT}`);
});
startNotificationScheduler();
