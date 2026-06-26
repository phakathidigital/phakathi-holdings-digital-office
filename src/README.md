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
| **My Day** | Personalised daily dashboard — greeting, AI task briefing, SA holiday/birthday reminders, vibrant summary cards, urgent tasks, upcoming meetings, pending approvals |
| **Dashboard** | Team operations hub — stats, employee awards (week/month/year), team performance leaderboard, vibrant team birthdays section, project overview, recent tasks |
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
| **Notification Centre** | Real-time in-app notifications, bell dropdown, priority filtering, acknowledgements, **automated daily scan** (birthdays, holidays, announcements), **email delivery**, **browser push notifications** |
| **Culture Hub** | Recognition feed (kudos), birthday wall, badge types, like reactions |
| **HR Hub** | HR announcements, downloadable policy documents, event feed |
| **Executive Dashboard** | Admin-only analytics: metrics cards, recharts visualisations, department radar, DAM compliance widget |
| **DAM Centre** | Compliance-aware document management with health scoring and automated reminders |
| **Sage Integration** | Self-service leave & HR sync layer (REST / CSV / webhook modes) |
| **Google Drive Sync** | DAM folder mirroring from Google Drive with auto-tagging |
| **AI Knowledge Assistant** | Semantic KB search with LLM-powered contextual responses |

---

## Recent Changes

### 2026-06-25 — Automated Notifications, Team Birthdays & Codebase Audit

#### Automated Push Notification System
- New **dailyNotificationScan** backend function — scheduled automation runs daily at 7am SAST, scans for upcoming birthdays (5 days), SA public holidays (7 days), and recent announcements, creates in-app Notification records (team-wide birthday reminders with contribution prompts + personal birthday messages), and sends summary emails to opted-in users
- New **PushNotificationManager** component — requests browser notification permission, subscribes to real-time Notification entity changes, shows pop-up alerts on the device even when the browser tab is in the background
- Updated **NotificationSettings** — users can now enter a notification email address and opt in to email alerts and browser push notifications (stored on UserProfile entity)
- New UserProfile fields: `notification_email`, `email_notifications_enabled`, `push_notifications_enabled`
- New scheduled automation: "Daily Notification Scan" (runs `dailyNotificationScan` function every day at 7am SAST)

#### Team Birthdays on Dashboard
- New **TeamBirthdays** component — vibrant, festive section on the Dashboard showing upcoming team birthdays (next 30 days) with gradient cards, avatar initials, countdown badges, and celebratory styling

#### Codebase Audit Fixes
- New **lib/taskUtils.js** — shared utilities (`isOverdue`, `getOverdueTasks`, `getTodaysTasks`, `computeTaskStats`) eliminating duplicated logic across Dashboard, TeamPerformance, EmployeeAwards, and EmployeeDetailDialog
- **MyDay.jsx** split from 473 lines → 95 lines, extracted into `MyDayHero`, `MyDaySummaryCards`, `MyDayLeftColumn`, `MyDayRightColumn`, and `MyDayHelpers` sub-components
- MyDay now fetches only the current user's assigned tasks (personal view) instead of all org-wide tasks
- Fixed invalid `border-200` Tailwind class in Layout sidebar
- Removed unused imports across WelcomeTour, StatsGrid, NotificationBell, and Dashboard
- Updated **WelcomeTour** to reflect the current 8-hub navigation structure (Dashboard, My Day, Work, Collaboration, People, Operations, Company, Insights, AI Assistant)

#### New Files
- `functions/dailyNotificationScan.js` — daily scan backend function
- `components/notifications/PushNotificationManager.jsx` — browser push notification manager
- `components/dashboard/TeamBirthdays.jsx` — festive team birthdays section
- `components/myday/MyDayHero.jsx`, `MyDaySummaryCards.jsx`, `MyDayLeftColumn.jsx`, `MyDayRightColumn.jsx`, `MyDayHelpers.jsx` — MyDay sub-components
- `lib/taskUtils.js` — shared task/performance utilities

---

### 2026-06-22 — My Day & Dashboard Differentiation

#### My Day (personal daily hub)
- New **AI Briefing Card** — auto-filters urgent tasks (critical/high, due today or overdue) and critical pending leave approvals, then uses the LLM to generate a "Top Priority Today" focus and a 2-sentence action plan
- New **Daily Reminders strip** — vibrant contextual cards for SA public holidays (Human Rights Day, Youth Day, Heritage Day, Mandela Day, etc.), upcoming birthdays with contribution reminders, DAM compliance nudges (Mon/Thu), email response prompts (mornings), and rotating "Did You Know?" fun facts (SA-specific + workplace well-being)
- New **vibrant summary cards** — pending tasks, upcoming bookings, and recent company feed posts in gradient cards
- Removed redundant nav-links so My Day is a focused personal view, distinct from the team Dashboard

#### Dashboard (team operations hub)
- New **Employee Awards** component — three gradient cards (Employee of the Week / Month / Year) computed objectively from task completion metrics
- New **Team Performance leaderboard** — ranked employee list with completion rate %, on-time delivery %, composite performance score, medals, and click-through detail dialog showing per-employee stats, active projects, and recent tasks

#### New Components (4)
- `components/myday/AIBriefingCard` — AI-driven daily task/approval briefing
- `components/dashboard/DailyReminders` — SA holidays, birthdays, DAM & email reminders, fun facts
- `components/dashboard/TeamPerformance` — performance leaderboard + detail dialog
- `components/dashboard/EmployeeAwards` — weekly/monthly/yearly award cards

#### New Libraries (2)
- `lib/saHolidays.js` — South African public holidays with contextual descriptions
- `lib/funFacts.js` — rotating daily fun facts (SA-specific + workplace well-being)

---

### 2026-06-01 — Phase 2 Enterprise Upgrade

#### New Pages (4)
- `/Notifications` — full notification centre with priority/type filters, acknowledgement workflows
- `/HRHub` — HR communications hub: announcements, pinned notices, policy document downloads, recent meetings
- `/ExecutiveDashboard` — admin-only analytics: 8 metric cards, engagement charts, DAM compliance widget, department performance radar
- `/CultureHub` — staff recognition feed (kudos) with badge types + birthday wall

#### New Components (15)
- `components/notifications/` — `NotificationBell`, `NotificationDropdown`, `NotificationToast`, `NotificationComposer`
- `components/culture/` — `BirthdayWall`, `RecognitionFeed`, `KudosDialog`
- `components/dam/` — `DAMHealthWidget`, `ComplianceReminderCard`
- `components/executive/` — `ExecutiveSummaryCards`, `EngagementAnalytics`, `DepartmentPerformanceChart`
- `components/integrations/sage/` — `SageConnectionPanel`
- `components/integrations/google-drive/` — `GoogleDriveConnector`
- `components/ai/` — `KnowledgeSearch` (expanded AI assistant)

#### New Entities (8)
`Notification`, `DAMComplianceRule`, `Recognition`, `KnowledgeBaseDocument`, `SageIntegration`, `DriveSyncConnection`, `UserPresence`

#### Layout Updates
- `NotificationBell` added to sidebar footer with live unread counter
- 4 new navigation entries: Notifications, Culture Hub, HR Hub, Executive Dashboard

---

### 2026-05-11 — Task Dependencies, Team Attendance, Org Chart, Meeting→Kanban Sync

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
│   ├── ai/                      # KnowledgeSearch, AIChat, ProjectAnalyzer, TaskPrioritizer, SmartSuggestions
│   ├── culture/                 # BirthdayWall, RecognitionFeed, KudosDialog
│   ├── dam/                     # DAMHealthWidget, ComplianceReminderCard
│   ├── dashboard/               # StatsGrid, HeroBanner, ProjectsOverview, RecentTasks, TeamActivity, TeamBirthdays,
│   │                            # QuickAccess, WelcomeTour, BirthdayConfetti, DailyReminders,
│   │                            # TeamPerformance, EmployeeAwards, EmployeeDetailDialog
│   ├── executive/               # ExecutiveSummaryCards, EngagementAnalytics, DepartmentPerformanceChart
│   ├── gantt/                   # GanttBar, GanttDependencyLines
│   ├── integrations/
│   │   ├── sage/                # SageConnectionPanel
│   │   └── google-drive/        # GoogleDriveConnector
│   ├── kanban/                  # DependencyPath, TaskDependencyPicker, TimeLogDialog
│   ├── leave/                   # LeaveRequestForm, LeaveApprovalCard
│   ├── meeting/                 # AudioRecorder, MeetingScheduler, KanbanSyncPanel
│   ├── meetings/                # MeetingNoteCard, MeetingNoteForm
│   ├── myday/                   # AIBriefingCard, MyDayHero, MyDaySummaryCards, MyDayLeftColumn, MyDayRightColumn, MyDayHelpers
│   ├── notices/                 # AnnouncementForm
│   ├── notifications/           # NotificationBell, NotificationDropdown, NotificationToast, NotificationComposer, PushNotificationManager
│   ├── onboarding/              # DepartmentChecklist
│   ├── orgchart/                # OrgAnalytics
│   ├── payslips/                # PayslipUploadDialog
│   ├── payroll/                 # BenefitsAdminPanel, BenefitsEnrollmentForm, EmployeePayrollView
│   ├── performance/             # KPISection, PeerFeedbackSection, EvaluationReport, GrowthHistory
│   ├── profile/                 # ProfileEditDialog, ProfileView, ProfileImageUpload, CoverImageUpload
│   ├── project-details/         # TaskDialog, TaskList, TaskItem, ProjectStats
│   ├── projects/                # ProjectCard, FilterTabs, ProjectDialog
│   ├── settings/                # BrandingSettings, NotificationSettings, PrivacySettings, DataManagement
│   ├── shared/                  # CameraScanner (receipt/document scanning)
│   ├── vault/                   # DocumentCard, FolderDialog, FolderTree, ShareDocDialog, UploadDocDialog
│   └── ui/                      # shadcn/ui primitives (button, card, dialog, sidebar, tabs, chart…)
│
├── entities/                    # JSON schemas (define database shape)
│   ├── Announcement.json
│   ├── Asset.json
│   ├── BenefitsEnrollment.json
│   ├── Booking.json
│   ├── Channel.json
│   ├── CompanyFeedPost.json     # Social feed posts (updates, announcements, recognition, milestones)
│   ├── DAMComplianceRule.json
│   ├── DocFolder.json
│   ├── DriveSyncConnection.json
│   ├── Expense.json
│   ├── HRDocument.json
│   ├── KPI.json
│   ├── KnowledgeBaseDocument.json
│   ├── LeaveRequest.json
│   ├── MeetingNote.json
│   ├── MeetingStudio.json
│   ├── Message.json
│   ├── Milestone.json           # Project milestones with dependencies and progress
│   ├── Notification.json
│   ├── OKR.json
│   ├── OnboardingRecord.json
│   ├── Payslip.json
│   ├── PeerFeedback.json
│   ├── PerformanceReview.json
│   ├── Portfolio.json           # Strategic project portfolios grouping multiple projects
│   ├── Project.json
│   ├── Recognition.json
│   ├── Resource.json
│   ├── SageIntegration.json
│   ├── Task.json
│   ├── Ticket.json
│   ├── TicketComment.json
│   ├── TimeLog.json             # Time tracking entries (task, project, hours, billable)
│   ├── UserPresence.json
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
│   ├── funFacts.js              # Rotating daily fun facts (SA-specific + workplace well-being)
│   ├── iframe-messaging.js      # Preview iframe communication
│   ├── NavigationTracker.jsx    # Route change tracking
│   ├── PageNotFound.jsx         # 404 page
│   ├── query-client.js          # TanStack Query client instance
│   ├── saHolidays.js            # South African public holidays with contextual descriptions
│   ├── taskUtils.js             # Shared task/performance utilities (isOverdue, computeTaskStats)
│   ├── utils.js                 # cn() and other utilities
│   └── VisualEditAgent.jsx      # In-app visual editing overlay
│
├── pages/
│   ├── AIAssistant.jsx
│   ├── Analytics.jsx            # Goals & OKRs
│   ├── Assets.jsx
│   ├── AutoPayroll.jsx
│   ├── Calendar.jsx
│   ├── CompanyFeed.jsx          # Social engagement feed (posts, likes, comments)
│   ├── CultureHub.jsx           # Recognition feed and birthday wall
│   ├── Dashboard.jsx            # Team operations hub (awards, performance, projects, tasks)
│   ├── DocumentRepository.jsx   # Document Vault (folder tree, upload, share, approvals)
│   ├── ExecutiveDashboard.jsx   # Executive analytics (admin-only)
│   ├── Expenses.jsx
│   ├── GanttChart.jsx           # Gantt timeline with dependency lines
│   ├── HRHub.jsx                # HR communications hub
│   ├── Integrations.jsx
│   ├── Kanban.jsx               # Drag-and-drop board with task dependencies & time logging
│   ├── Leave.jsx
│   ├── MeetingNotes.jsx
│   ├── MeetingStudio.jsx        # AI transcript summarisation + Kanban sync
│   ├── Messaging.jsx
│   ├── MyDay.jsx                # Personal daily dashboard (AI briefing, reminders, summary cards)
│   ├── Noticeboard.jsx
│   ├── Onboarding.jsx
│   ├── OrgChart.jsx
│   ├── PayrollDashboard.jsx
│   ├── Payslips.jsx
│   ├── PerformanceReviews.jsx
│   ├── Portfolios.jsx           # Strategic portfolio management
│   ├── Profile.jsx
│   ├── ProjectDetails.jsx
│   ├── Projects.jsx
│   ├── ResourceCalendar.jsx     # Room booking
│   ├── Roadmaps.jsx             # Project roadmap visualisation
│   ├── SageIntegration.jsx      # Sage Integration Centre
│   ├── Settings.jsx
│   ├── TeamAttendance.jsx       # Team availability calendar
│   ├── Tickets.jsx
│   ├── TimeTracking.jsx         # Time logging with billable tracking
│   ├── WorkloadPlanner.jsx      # Team workload analysis
│   └── Notifications.jsx        # Enterprise notification centre
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

```
functions/                        # Backend functions (Deno deploy handlers)
└── dailyNotificationScan.js      # Daily scan: birthdays, holidays, announcements → notifications + emails

docs/
└── prompts/                      # Audit and migration prompt documents
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
│   │   ├── UserProfile.js
│   │   ├── UserPresence.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── TimeLog.js
│   │   ├── Portfolio.js
│   │   ├── Milestone.js
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
│   │   ├── Notification.js
│   │   ├── Channel.js
│   │   ├── Message.js
│   │   ├── Booking.js
│   │   ├── Resource.js
│   │   ├── MeetingNote.js
│   │   ├── MeetingStudio.js
│   │   ├── CompanyFeedPost.js
│   │   ├── Recognition.js
│   │   ├── KnowledgeBaseDocument.js
│   │   ├── DAMComplianceRule.js
│   │   ├── SageIntegration.js
│   │   └── DriveSyncConnection.js
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
│   │   ├── userPresence.js      # CRUD /user-presence (online status, last seen)
│   │   ├── timeLogs.js          # CRUD /time-logs (time tracking, billable)
│   │   ├── portfolios.js        # CRUD /portfolios (strategic project portfolios)
│   │   ├── milestones.js        # CRUD /milestones (project milestones + dependencies)
│   │   ├── companyFeed.js       # CRUD /company-feed (posts, likes, comments)
│   │   ├── recognitions.js      # CRUD /recognitions (kudos, badges, likes)
│   │   ├── notifications.js     # CRUD /notifications (priority, targeting, acknowledgements)
│   │   ├── knowledgeBase.js     # CRUD /knowledge-base (AI-indexed documents)
│   │   ├── damRules.js          # CRUD /dam-compliance-rules (compliance automation)
│   │   ├── sageIntegration.js   # CRUD /sage-integration (Sage sync config)
│   │   ├── driveSync.js         # CRUD /drive-sync (Google Drive sync config)
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

// ── Phase 2+ models ──

model Portfolio {
  id                  String   @id @default(uuid())
  name                String
  description         String?
  status              String   @default("active")  // active | on_track | at_risk | delayed | completed | archived
  owner               String?  // owner email
  strategic_objective String?
  budget              Float?
  start_date          DateTime?
  end_date            DateTime?
  progress            Float    @default(0)
  project_ids         String[] // array of Project IDs
  risk_level          String   @default("low")      // low | medium | high | critical
  tags                String[]
  created_date        DateTime @default(now())
  updated_date        DateTime @updatedAt
}

model Milestone {
  id            String   @id @default(uuid())
  title         String
  description   String?
  project_id    String?
  portfolio_id  String?
  due_date      DateTime?
  status        String   @default("pending")  // pending | in_progress | completed | delayed
  progress      Float    @default(0)
  owner_email   String?
  dependencies  String[] // IDs of blocking milestones
  created_date  DateTime @default(now())
  updated_date  DateTime @updatedAt
}

model TimeLog {
  id             String   @id @default(uuid())
  task_id        String
  task_title     String?
  project_id     String?
  project_name   String?
  employee_email String
  employee_name  String?
  hours          Float
  log_date       DateTime
  description    String?
  billable        Boolean  @default(true)
  created_date   DateTime @default(now())
  updated_date   DateTime @updatedAt
}

model CompanyFeedPost {
  id            String   @id @default(uuid())
  content       String
  post_type     String   @default("update")  // update | announcement | recognition | milestone
  author_email  String?
  author_name   String?
  likes         String[] // user emails
  comments      Json[]   // [{ email, name, content, date }]
  image_url     String?
  tags          String[]
  subsidiary    String?
  department    String?
  is_pinned      Boolean  @default(false)
  created_date  DateTime @default(now())
  updated_date  DateTime @updatedAt
}

model Notification {
  id                     String   @id @default(uuid())
  title                   String
  message                 String
  type                    String   @default("general")
  priority                String   @default("medium")  // low | medium | high | critical
  target_departments      String[]
  target_users            String[] // specific user emails
  created_by              String?
  scheduled_for           DateTime?
  expires_at              DateTime?
  is_read_by              String[] // emails of users who read
  requires_acknowledgement Boolean @default(false)
  acknowledged_by         String[]
  delivery_channels       String[] // in_app | browser_push | email
  related_entity_type     String?
  related_entity_id       String?
  is_archived              Boolean  @default(false)
  created_date            DateTime @default(now())
  updated_date            DateTime @updatedAt
}

model Recognition {
  id               String   @id @default(uuid())
  sender_email     String
  sender_name      String?
  recipient_email  String
  recipient_name   String?
  message          String
  badge_type       String   @default("star_performer")
  is_public        Boolean  @default(true)
  subsidiary       String?
  department       String?
  likes            String[]
  created_date     DateTime @default(now())
  updated_date     DateTime @updatedAt
}

model KnowledgeBaseDocument {
  id                String   @id @default(uuid())
  title             String
  category          String   @default("Other")
  content           String?
  tags              String[]
  source_type       String   @default("manual")
  linked_entity_id  String?
  linked_entity_type String?
  embedding_status  String   @default("pending")  // pending | indexed | failed
  indexed_date      DateTime?
  is_active          Boolean  @default(true)
  access_level      String   @default("all_staff")
  view_count        Int      @default(0)
  created_date      DateTime @default(now())
  updated_date      DateTime @updatedAt
}

model DAMComplianceRule {
  id                   String   @id @default(uuid())
  title                String
  rule_type            String   // unsigned_document | missing_upload | expiring_contract | overdue_approval | ...
  target_departments   String[]
  frequency            String   @default("weekly")  // daily | weekly | monthly | on_trigger
  trigger_conditions   String?
  reminder_message     String?
  escalation_enabled   Boolean  @default(false)
  escalation_after_days Int    @default(7)
  is_active             Boolean  @default(true)
  last_triggered       DateTime?
  created_date         DateTime @default(now())
  updated_date         DateTime @updatedAt
}

model SageIntegration {
  id                String   @id @default(uuid())
  connection_name   String
  connection_status String   @default("disconnected")
  api_endpoint      String?
  last_sync_date    DateTime?
  sync_modules      String[] // leave_balances, leave_requests, employee_profiles, ...
  sync_frequency    String   @default("daily")
  sync_status       String   @default("idle")
  last_error        String?
  records_synced    Int      @default(0)
  sync_mode         String   @default("api")  // api | csv_import | webhook
  configured_by     String?
  notes             String?
  created_date      DateTime @default(now())
  updated_date      DateTime @updatedAt
}

model DriveSyncConnection {
  id                   String   @id @default(uuid())
  connection_name      String
  google_account_email String?
  root_folder_id       String?
  root_folder_name     String?
  sync_enabled          Boolean  @default(false)
  last_sync_date       DateTime?
  sync_status          String   @default("not_configured")
  mapped_departments   String[]
  auto_tagging_enabled  Boolean  @default(true)
  files_synced         Int      @default(0)
  sync_frequency       String   @default("daily")
  last_error           String?
  configured_by        String?
  created_date         DateTime @default(now())
  updated_date         DateTime @updatedAt
}

model UserPresence {
  id                  String   @id @default(uuid())
  user_email          String   @unique
  user_name           String?
  status              String   @default("offline")  // online | away | busy | offline
  last_seen           DateTime?
  current_page        String?
  availability_message String?
  created_date        DateTime @default(now())
  updated_date        DateTime @updatedAt
}
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
    UserPresence:      entity("user-presence"),
    TimeLog:           entity("time-logs"),
    Portfolio:         entity("portfolios"),
    Milestone:         entity("milestones"),
    CompanyFeedPost:   entity("company-feed"),
    Recognition:       entity("recognitions"),
    Notification:     entity("notifications"),
    KnowledgeBaseDocument: entity("knowledge-base"),
    DAMComplianceRule: entity("dam-compliance-rules"),
    SageIntegration:  entity("sage-integration"),
    DriveSyncConnection: entity("drive-sync"),
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
app.use("/api/user-presence",     userPresenceRoutes);
app.use("/api/time-logs",          timeLogRoutes);
app.use("/api/portfolios",        portfolioRoutes);
app.use("/api/milestones",        milestoneRoutes);
app.use("/api/company-feed",      companyFeedRoutes);
app.use("/api/recognitions",      recognitionRoutes);
app.use("/api/notifications",     notificationRoutes);
app.use("/api/knowledge-base",    knowledgeBaseRoutes);
app.use("/api/dam-compliance-rules", damRuleRoutes);
app.use("/api/sage-integration",  sageIntegrationRoutes);
app.use("/api/drive-sync",        driveSyncRoutes);
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
| **UserProfile** | user_email, job_title, subsidiary, phone, birthday, notification_email, email_notifications_enabled, push_notifications_enabled |
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
| **Portfolio** | name, status, owner, strategic_objective, budget, project_ids[], risk_level, progress |
| **Milestone** | title, project_id, portfolio_id, due_date, status, progress, owner_email, dependencies[] |
| **TimeLog** | task_id, project_id, employee_email, hours, log_date, billable, description |
| **CompanyFeedPost** | content, post_type, author_email, likes[], comments[], image_url, tags[], is_pinned |
| **Notification** | title, message, type, priority, target_departments[], target_users[], requires_acknowledgement, acknowledged_by[], is_read_by[] |
| **Recognition** | sender_email, recipient_email, message, badge_type, likes[], is_public |
| **KnowledgeBaseDocument** | title, category, content, tags[], source_type, embedding_status |
| **DAMComplianceRule** | title, rule_type, target_departments[], frequency, escalation_enabled |
| **SageIntegration** | connection_status, last_sync_date, sync_modules[], sync_mode, api_endpoint |
| **DriveSyncConnection** | google_account_email, root_folder_id, sync_status, files_synced, mapped_departments[] |
| **UserPresence** | user_email, status, last_seen, current_page |

---

*Phakathi Flow — Built on React + Tailwind CSS + Base44 (or your own backend)*