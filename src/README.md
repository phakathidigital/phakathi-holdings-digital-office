# Phakathi Flow — Digital HR & Operations Platform

Phakathi Flow is a comprehensive digital workplace platform built for the Phakathi Holdings group of companies. It covers the full employee lifecycle — from onboarding through performance reviews, leave management, payroll, ticketing, document management, and more — all in a single unified interface.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Recent Changes](#recent-changes)
3. [Tech Stack](#tech-stack)
4. [App File Structure](#app-file-structure)
5. [Running Locally (with Base44 backend)](#running-locally-with-base44-backend)
6. [Running Locally (with your own backend)](#running-locally-with-your-own-backend)
7. [Custom Backend Architecture](#custom-backend-architecture)
8. [Environment Variables](#environment-variables)
9. [Data Entities Reference](#data-entities-reference)

---

## Feature Overview

| Module | Description |
|---|---|
| **Dashboard** | Overview — projects, tasks, birthdays, announcements, quick stats |
| **Projects & Kanban** | Project tracking with drag-and-drop task boards, **task dependencies**, and dependency visualisation |
| **Leave Management** | Submit, approve, and track all leave types |
| **Payslips** | Upload, publish, and download payslips per employee |
| **Payroll Dashboard** | Payroll analytics, auto-payroll, and benefits enrollment |
| **Expenses** | Submit expenses with receipt scanning and approval workflows |
| **Performance Reviews** | KPI tracking, OKRs, self-assessments, peer feedback, 360° reviews |
| **Onboarding** | Department-specific checklists for new hires |
| **Support Tickets** | Multi-queue ticketing (IT / HR / Finance) with SLA tracking |
| **Document Vault** | Folder-based document repository with tags, sharing, and per-department permissions |
| **Messaging** | Internal channels and direct messaging |
| **Meeting Studio** | AI-powered transcript summarisation, action item extraction, and **Kanban task sync** |
| **Team Attendance** | Aggregated leave + meeting calendar showing daily/weekly/monthly team availability |
| **Meeting Notes** | Structured meeting notes with attendee management |
| **Noticeboard** | Company-wide announcements with pinning |
| **Room Booking** | Resource and meeting room reservation calendar |
| **Assets** | IT asset inventory and assignment tracking |
| **Org Chart** | Interactive organisational chart — tree, grid, and analytics views; click-through employee profiles, reporting lines, active tasks |
| **AI Assistant** | Context-aware AI chat for HR and operations queries |
| **Analytics** | Cross-module reporting and visualisations |
| **Calendar** | Team-wide event calendar |
| **Integrations** | Third-party service connection management |
| **Settings & Branding** | Theme, colours, fonts, and org identity customisation |
| **Profile** | Employee profile with image upload |

---

## Recent Changes

### 2026-05-11 — Task Dependencies, Team Attendance, Org Chart, Meeting→Kanban Sync

#### 1. Task Dependency System (Kanban)
- **Entity change:** `Task.blocked_by` — new `string[]` field storing IDs of blocking tasks.
- **New component:** `components/kanban/DependencyPath.jsx` — renders a visual chain of blockers with colour-coded status (complete/incomplete).
- **New component:** `components/kanban/TaskDependencyPicker.jsx` — multi-select picker to assign blocking tasks when editing a task.
- **Updated:** `pages/Kanban.jsx` — status-change drag-and-drop is now blocked if any `blocked_by` task is incomplete; shows dependency badge on task cards.
- **Updated:** `entities/Task.json` — added `blocked_by` (array of task IDs) and `tags` fields.

#### 2. Team Attendance Calendar
- **New page:** `pages/TeamAttendance.jsx` — aggregates `LeaveRequest` (approved) and `MeetingStudio` (attendees) records into a day/week/month calendar view showing team availability at a glance.
- **Route added in `App.jsx`:** `/TeamAttendance`
- **Layout nav entry added** in `Layout.jsx`.

#### 3. Interactive Org Chart
- **New page:** `pages/OrgChart.jsx` — three views: recursive **tree**, responsive **grid**, and **analytics** tab.
- **New component:** `components/orgchart/OrgAnalytics.jsx` — department headcount, subsidiary distribution, charts.
- Pulls data from `UserProfile` and `User` entities; click any node to open a slide-out employee profile with direct reports, active projects, and assigned tasks.
- Filterable by subsidiary and full-text search.
- **Route added in `App.jsx`:** `/OrgChart`

#### 4. Meeting Studio → Kanban Task Sync
- **Updated AI prompt** in `pages/MeetingStudio.jsx` — now extracts `extracted_tasks` (structured JSON array: title, assigned_to, priority, due_date, description) alongside the summary.
- **Entity change:** `MeetingStudio.extracted_tasks` (array of task objects) and `MeetingStudio.tasks_synced` (boolean).
- **New component:** `components/meeting/KanbanSyncPanel.jsx` — shown inside the meeting detail modal. Lets users review/edit/add/remove extracted tasks, link them to a Project, then push them all to the Kanban board in one click. Shows "X tasks ready" / "Tasks synced" badges on meeting cards.
- **Backend requirement (self-hosted):** When implementing `/api/ai/invoke`, ensure the LLM response schema includes `extracted_tasks`. The `MeetingStudio` model needs `extracted_tasks Json[]` and `tasks_synced Boolean`.

#### 5. Entity Description Fields Added
Added optional `description` (maxLength: 1000) fields to: `LeaveRequest`, `Payslip`, `MeetingNote`, `PerformanceReview`, `PeerFeedback`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router DOM v7 |
| State / Data | TanStack React Query v5 |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Build Tool | Vite |
| Backend (default) | Base44 BaaS (database, auth, file storage, email, AI) |

---

## App File Structure

```
src/
├── api/
│   ├── base44Client.js          # SDK client initialisation
│   └── entities.js              # (optional) typed entity helpers
│
├── components/
│   ├── ai/                      # AI Assistant components
│   ├── dashboard/               # Dashboard widgets (stats, hero, recent tasks…)
│   ├── leave/                   # Leave request form & approval card
│   ├── meetings/                # Meeting note card & form
│   ├── meeting/                 # Audio recorder, scheduler, KanbanSyncPanel
│   ├── onboarding/              # Department checklist generator
│   ├── kanban/                  # DependencyPath visualiser, TaskDependencyPicker
│   ├── orgchart/                # Org chart analytics (OrgAnalytics)
│   ├── payroll/                 # Benefits enrollment, payroll views
│   ├── performance/             # KPI section, OKRs, peer feedback, eval report
│   ├── profile/                 # Profile edit, image upload dialogs
│   ├── project-details/         # Task dialog, task list, project stats
│   ├── projects/                # Project card, filter tabs, project dialog
│   ├── settings/                # Branding, notifications, privacy, data settings
│   ├── shared/                  # Camera scanner, reusable utilities
│   ├── vault/                   # Document vault: folder tree, upload, share, card
│   │   ├── DocumentCard.jsx
│   │   ├── FolderDialog.jsx
│   │   ├── FolderTree.jsx
│   │   ├── ShareDocDialog.jsx
│   │   └── UploadDocDialog.jsx
│   └── ui/                      # shadcn/ui primitives (button, card, dialog…)
│
├── entities/                    # JSON schemas (define database shape)
│   ├── Announcement.json
│   ├── Asset.json
│   ├── BenefitsEnrollment.json
│   ├── Booking.json
│   ├── Channel.json
│   ├── DocFolder.json
│   ├── Expense.json
│   ├── HRDocument.json
│   ├── KPI.json
│   ├── LeaveRequest.json
│   ├── MeetingNote.json
│   ├── MeetingStudio.json
│   ├── Message.json
│   ├── OKR.json
│   ├── OnboardingRecord.json
│   ├── Payslip.json
│   ├── PeerFeedback.json
│   ├── PerformanceReview.json
│   ├── Project.json
│   ├── Resource.json
│   ├── Task.json
│   ├── Ticket.json
│   ├── TicketComment.json
│   └── UserProfile.json
│
├── hooks/
│   └── use-mobile.jsx           # Mobile breakpoint hook
│
├── lib/
│   ├── app-params.js            # App ID, server URL, token from env
│   ├── AuthContext.jsx          # Auth provider & hooks
│   ├── BrandingLoader.jsx       # Loads branding from user profile on boot
│   ├── branding.js              # Branding CSS variable helpers
│   ├── iframe-messaging.js      # Preview iframe communication
│   ├── NavigationTracker.jsx    # Route change tracking
│   ├── PageNotFound.jsx         # 404 page
│   ├── query-client.js          # TanStack Query client instance
│   ├── utils.js                 # cn() and other utilities
│   └── VisualEditAgent.jsx      # In-app visual editing overlay
│
├── pages/
│   ├── AIAssistant.jsx
│   ├── Analytics.jsx
│   ├── Assets.jsx
│   ├── AutoPayroll.jsx
│   ├── Calendar.jsx
│   ├── Dashboard.jsx
│   ├── DocumentRepository.jsx   # Document Vault main page (folder tree, upload, share, approvals)
│   ├── Expenses.jsx
│   ├── Integrations.jsx
│   ├── Kanban.jsx
│   ├── Leave.jsx
│   ├── MeetingNotes.jsx
│   ├── MeetingStudio.jsx
│   ├── Messaging.jsx
│   ├── Noticeboard.jsx
│   ├── Onboarding.jsx
│   ├── OrgChart.jsx
│   ├── PayrollDashboard.jsx
│   ├── Payslips.jsx
│   ├── PerformanceReviews.jsx
│   ├── Profile.jsx
│   ├── ProjectDetails.jsx
│   ├── Projects.jsx
│   ├── ResourceCalendar.jsx
│   ├── Settings.jsx
│   ├── TeamAttendance.jsx        # Team availability calendar (leave + meetings aggregated)
│   └── Tickets.jsx
│
├── utils/
│   └── index.ts                 # Shared utility functions
│
├── App.jsx                      # Root router & auth wrapper
├── App.css
├── index.css                    # Tailwind base + CSS design tokens
├── index.html                   # HTML entry point
├── main.jsx                     # React DOM mount
└── tailwind.config.js           # Tailwind theme config
```

---

## Running Locally (with Base44 backend)

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Steps

```bash
# 1. Clone or export the project
git clone <your-repo-url>
cd phakathi-flow

# 2. Install dependencies
npm install

# 3. Create a .env file in the project root
cp .env.example .env
# Fill in your Base44 app credentials (see Environment Variables below)

# 4. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Running Locally (with your own backend)

To run this app completely independently of Base44, you need to replace three things:

| Base44 feature | Your replacement |
|---|---|
| Database + REST API | PostgreSQL + Express/FastAPI/Django |
| Authentication | JWT-based auth (e.g. Passport.js, Auth.js, or Supabase Auth) |
| File storage | AWS S3, Cloudflare R2, or Supabase Storage |
| Email sending | Resend, SendGrid, or Nodemailer |
| AI / LLM calls | OpenAI API, Anthropic API, or Google Gemini |

---

## Custom Backend Architecture

### Recommended Stack

```
Frontend  →  React (this repo, Vite)
Backend   →  Node.js + Express  (or FastAPI / Django)
Database  →  PostgreSQL  (or MongoDB)
Auth      →  JWT tokens  (or Supabase / Auth0)
Storage   →  AWS S3  (or Supabase Storage / Cloudflare R2)
Email     →  Resend or SendGrid
AI        →  OpenAI API
```

---

### Backend Folder Structure (Node.js + Express example)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL / Sequelize / Prisma connection
│   │   ├── storage.js           # S3 / R2 client setup
│   │   └── email.js             # Resend / SendGrid setup
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   ├── rbac.js              # Role-based access control (admin, user)
│   │   └── upload.js            # Multer file upload handler
│   │
│   ├── models/                  # Database models (Prisma schema or Sequelize models)
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── LeaveRequest.js
│   │   ├── Expense.js
│   │   ├── Ticket.js
│   │   ├── TicketComment.js
│   │   ├── HRDocument.js
│   │   ├── DocFolder.js
│   │   ├── OnboardingRecord.js
│   │   ├── PerformanceReview.js
│   │   ├── KPI.js
│   │   ├── OKR.js
│   │   ├── PeerFeedback.js
│   │   ├── Payslip.js
│   │   ├── BenefitsEnrollment.js
│   │   ├── Asset.js
│   │   ├── Announcement.js
│   │   ├── Channel.js
│   │   ├── Message.js
│   │   ├── Booking.js
│   │   ├── Resource.js
│   │   ├── MeetingNote.js
│   │   ├── MeetingStudio.js
│   │   └── UserProfile.js
│   │
│   ├── routes/
│   │   ├── auth.js              # POST /auth/login, /auth/register, /auth/me
│   │   ├── users.js             # GET/PATCH /users/:id
│   │   ├── projects.js          # CRUD /projects
│   │   ├── tasks.js             # CRUD /tasks
│   │   ├── leave.js             # CRUD /leave-requests
│   │   ├── expenses.js          # CRUD /expenses
│   │   ├── tickets.js           # CRUD /tickets
│   │   ├── ticketComments.js    # CRUD /ticket-comments
│   │   ├── documents.js         # CRUD /hr-documents + file upload
│   │   ├── folders.js           # CRUD /doc-folders
│   │   ├── onboarding.js        # CRUD /onboarding-records
│   │   ├── performance.js       # CRUD /performance-reviews
│   │   ├── kpis.js              # CRUD /kpis
│   │   ├── okrs.js              # CRUD /okrs
│   │   ├── peerFeedback.js      # CRUD /peer-feedback
│   │   ├── payslips.js          # CRUD /payslips
│   │   ├── benefits.js          # CRUD /benefits-enrollments
│   │   ├── assets.js            # CRUD /assets
│   │   ├── announcements.js     # CRUD /announcements
│   │   ├── channels.js          # CRUD /channels
│   │   ├── messages.js          # CRUD /messages (+ WebSocket)
│   │   ├── bookings.js          # CRUD /bookings
│   │   ├── resources.js         # CRUD /resources
│   │   ├── meetingNotes.js      # CRUD /meeting-notes
│   │   ├── meetingStudio.js     # CRUD /meeting-studio
│   │   ├── userProfiles.js      # CRUD /user-profiles
│   │   ├── upload.js            # POST /upload (returns file URL)
│   │   ├── email.js             # POST /send-email
│   │   └── ai.js                # POST /ai/invoke (LLM proxy)
│   │
│   ├── services/
│   │   ├── emailService.js      # Wrapper around Resend/SendGrid
│   │   ├── storageService.js    # Wrapper around S3/R2 upload
│   │   └── aiService.js         # Wrapper around OpenAI / Anthropic
│   │
│   └── index.js                 # Express app entry point
│
├── prisma/
│   └── schema.prisma            # Database schema (if using Prisma ORM)
│
├── .env
├── package.json
└── README.md
```

---

### Prisma Schema Example (key tables)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  full_name  String?
  role       String   @default("user")  // "admin" | "user"
  password_hash String
  created_date DateTime @default(now())
  updated_date DateTime @updatedAt
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  status      String   @default("planning")
  priority    String   @default("medium")
  subsidiary  String?
  start_date  DateTime?
  end_date    DateTime?
  budget      Float?
  team_members String[] // array of email addresses
  created_by  String
  created_date DateTime @default(now())
  updated_date DateTime @updatedAt
}

model Task {
  id          String   @id @default(uuid())
  project_id  String
  title       String
  description String?
  status      String   @default("todo")
  priority    String   @default("medium")
  assigned_to String?
  due_date    DateTime?
  blocked_by  String[] // array of Task IDs that must be completed first
  tags        String[]
  created_by  String
  created_date DateTime @default(now())
  updated_date DateTime @updatedAt
}

model LeaveRequest {
  id              String   @id @default(uuid())
  employee_email  String
  employee_name   String
  leave_type      String
  start_date      DateTime
  end_date        DateTime
  days_requested  Float
  reason          String
  status          String   @default("pending")
  approved_by     String?
  rejection_reason String?
  department      String
  subsidiary      String?
  created_date    DateTime @default(now())
  updated_date    DateTime @updatedAt
}

model HRDocument {
  id                  String   @id @default(uuid())
  title               String
  description         String?
  category            String
  folder_id           String?
  folder_path         String?
  file_url            String
  file_name           String?
  file_size           String?
  version             String   @default("1.0")
  version_notes       String?
  status              String   @default("pending_review")
  access_level        String   @default("employee_only")
  allowed_departments String[]
  shared_with         String[]
  tags                String[]
  owner_email         String
  owner_name          String?
  subsidiary          String?
  approved_by_email   String?
  approved_by_name    String?
  approved_date       DateTime?
  rejection_reason    String?
  expiry_date         DateTime?
  created_date        DateTime @default(now())
  updated_date        DateTime @updatedAt
}

model MeetingStudio {
  id                  String   @id @default(uuid())
  title               String
  meeting_date        DateTime
  attendees           String[]
  transcript          String?
  transcript_file_url String?
  summary             String?
  action_items        String[]
  decisions           String[]
  individual_summaries Json?    // { "email": "personal summary" }
  structured_notes    String?
  extracted_tasks     Json[]   // [{ title, assigned_to, priority, due_date, description }]
  tasks_synced        Boolean  @default(false)
  subsidiary          String?
  status              String   @default("pending")
  emails_sent         Boolean  @default(false)
  created_by          String
  created_date        DateTime @default(now())
  updated_date        DateTime @updatedAt
}

model UserProfile {
  id               String   @id @default(uuid())
  user_email       String   @unique
  job_title        String?
  subsidiary       String?
  phone            String?
  bio              String?
  birthday         DateTime?
  birthday_celebrated String?
  created_date     DateTime @default(now())
  updated_date     DateTime @updatedAt
}

model DocFolder {
  id                  String   @id @default(uuid())
  name                String
  description         String?
  parent_id           String?
  color               String   @default("#6b7280")
  access_level        String   @default("employee_only")
  allowed_departments String[]
  owner_email         String?
  path                String?
  created_date        DateTime @default(now())
  updated_date        DateTime @updatedAt
}

// ... (add remaining models following the same pattern)
```

---

### Replacing the Base44 Client in the Frontend

In `src/api/base44Client.js`, replace the Base44 SDK with your own REST API calls:

```js
// src/api/apiClient.js  — your custom client

const BASE_URL = import.meta.env.VITE_API_URL; // e.g. http://localhost:4000/api

async function request(method, path, body = null) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Generic entity factory — mirrors base44.entities.EntityName.*
function entity(resource) {
  return {
    list: (sort, limit) => request("GET", `/${resource}?sort=${sort || ""}&limit=${limit || 50}`),
    filter: (query) => request("POST", `/${resource}/filter`, query),
    create: (data) => request("POST", `/${resource}`, data),
    update: (id, data) => request("PATCH", `/${resource}/${id}`, data),
    delete: (id) => request("DELETE", `/${resource}/${id}`),
  };
}

export const api = {
  entities: {
    Project:           entity("projects"),
    Task:              entity("tasks"),
    LeaveRequest:      entity("leave-requests"),
    Expense:           entity("expenses"),
    Ticket:            entity("tickets"),
    TicketComment:     entity("ticket-comments"),
    HRDocument:        entity("hr-documents"),
    DocFolder:         entity("doc-folders"),
    OnboardingRecord:  entity("onboarding-records"),
    PerformanceReview: entity("performance-reviews"),
    KPI:               entity("kpis"),
    OKR:               entity("okrs"),
    PeerFeedback:      entity("peer-feedback"),
    Payslip:           entity("payslips"),
    BenefitsEnrollment:entity("benefits-enrollments"),
    Asset:             entity("assets"),
    Announcement:      entity("announcements"),
    Channel:           entity("channels"),
    Message:           entity("messages"),
    Booking:           entity("bookings"),
    Resource:          entity("resources"),
    MeetingNote:       entity("meeting-notes"),
    MeetingStudio:     entity("meeting-studio"),
    UserProfile:       entity("user-profiles"),
    User:              entity("users"),
  },
  auth: {
    me: () => request("GET", "/auth/me"),
    logout: () => { localStorage.removeItem("auth_token"); window.location.href = "/login"; },
    updateMe: (data) => request("PATCH", "/auth/me", data),
    isAuthenticated: async () => !!localStorage.getItem("auth_token"),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const form = new FormData();
        form.append("file", file);
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${BASE_URL}/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        return res.json(); // { file_url: "..." }
      },
      SendEmail: (data) => request("POST", "/send-email", data),
      InvokeLLM: (data) => request("POST", "/ai/invoke", data),
    },
  },
};
```

Then update every import in the app from:
```js
import { base44 } from "@/api/base44Client";
```
to:
```js
import { api as base44 } from "@/api/apiClient";
```

This keeps all existing component code unchanged — only the data layer swaps out.

---

### Express Backend Entry Point

```js
// backend/src/index.js

import express from "express";
import cors from "cors";
import { json } from "express";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
// ... import all route files

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(json());

app.use("/api/auth",              authRoutes);
app.use("/api/projects",          projectRoutes);
app.use("/api/tasks",             taskRoutes);
app.use("/api/leave-requests",    leaveRoutes);
app.use("/api/expenses",          expenseRoutes);
app.use("/api/tickets",           ticketRoutes);
app.use("/api/ticket-comments",   ticketCommentRoutes);
app.use("/api/hr-documents",      documentRoutes);
app.use("/api/doc-folders",       folderRoutes);
app.use("/api/onboarding-records",onboardingRoutes);
app.use("/api/performance-reviews",performanceRoutes);
app.use("/api/kpis",              kpiRoutes);
app.use("/api/okrs",              okrRoutes);
app.use("/api/peer-feedback",     peerFeedbackRoutes);
app.use("/api/payslips",          payslipRoutes);
app.use("/api/benefits-enrollments", benefitRoutes);
app.use("/api/assets",            assetRoutes);
app.use("/api/announcements",     announcementRoutes);
app.use("/api/channels",          channelRoutes);
app.use("/api/messages",          messageRoutes);
app.use("/api/bookings",          bookingRoutes);
app.use("/api/resources",         resourceRoutes);
app.use("/api/meeting-notes",     meetingNoteRoutes);
app.use("/api/meeting-studio",    meetingStudioRoutes);
app.use("/api/user-profiles",     userProfileRoutes);
app.use("/api/users",             userRoutes);
app.use("/api/upload",            uploadRoutes);
app.use("/api/send-email",        emailRoutes);
app.use("/api/ai",                aiRoutes);

app.listen(4000, () => console.log("Phakathi Flow API running on http://localhost:4000"));
```

---

## Environment Variables

### Frontend `.env`

```env
# Base44 (if using Base44 backend)
VITE_APP_ID=your_base44_app_id
VITE_SERVER_URL=https://api.base44.com

# Custom backend (if self-hosting)
VITE_API_URL=http://localhost:4000/api
```

### Backend `.env`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/phakathi_flow

# Auth
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# File storage (AWS S3 or compatible)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=phakathi-flow-files
AWS_REGION=af-south-1

# Email
RESEND_API_KEY=re_your_resend_key
FROM_EMAIL=no-reply@phakathiholdings.co.za

# AI
OPENAI_API_KEY=sk-your_openai_key
# or
ANTHROPIC_API_KEY=sk-ant-your_key
```

---

## Data Entities Reference

| Entity | Key Fields |
|---|---|
| **User** | email, full_name, role, profile_image_url |
| **UserProfile** | user_email, job_title, subsidiary, phone, birthday |
| **Project** | name, status, priority, subsidiary, team_members[], start_date, end_date |
| **Task** | project_id, title, status, priority, assigned_to, due_date, blocked_by[] (task dependency IDs), tags[] |
| **LeaveRequest** | employee_email, leave_type, start_date, end_date, status, department |
| **Expense** | employee_email, category, amount, expense_date, status, receipt_url |
| **Ticket** | title, category, priority, status, queue, submitter_email |
| **TicketComment** | ticket_id, author_email, content, is_internal |
| **HRDocument** | title, category, folder_id, file_url, access_level, allowed_departments[], tags[], shared_with[] |
| **DocFolder** | name, parent_id, color, access_level, allowed_departments[] |
| **OnboardingRecord** | employee_email, department, start_date, status, documents{}, accounts{}, training{} |
| **PerformanceReview** | employee_email, period, status, self_rating, manager_rating |
| **KPI** | review_id, employee_email, title, target, actual, weight, score |
| **OKR** | review_id, employee_email, objective, key_results[], progress |
| **PeerFeedback** | review_id, employee_email, reviewer_email, ratings, is_anonymous |
| **Payslip** | employee_email, period_month, period_year, file_url, status |
| **BenefitsEnrollment** | employee_email, medical_aid, retirement_fund, period_year |
| **Asset** | name, type, serial_number, assigned_to_email, status |
| **Announcement** | title, content, category, is_pinned, subsidiary |
| **Channel** | name, type, members[] |
| **Message** | channel_id, sender_email, content, reply_to_id |
| **Booking** | resource_id, title, date, start_time, end_time, booker_email |
| **Resource** | name, type, capacity, location |
| **MeetingNote** | title, meeting_date, attendees[], action_items[] |
| **MeetingStudio** | title, transcript, summary, action_items[], decisions[], individual_summaries{}, extracted_tasks[], tasks_synced |

---

*Phakathi Flow — Built on React + Tailwind CSS + Base44 (or your own backend)*