# Local Testing & QA Prompt

You are testing the "Phakathi Flow" application — a React 18 + Tailwind CSS + Vite single-page app built on the Base44 BaaS platform. The app is an employee experience, operations, and intelligence platform with 40+ pages, 34 entities, and 100+ components organized into eight navigation hubs (Home, Work, Collaboration, People, Operations, Company, Insights, Account).

Your job is to set up the app locally, run it against the Base44 backend, and execute a comprehensive QA test plan covering every major feature. Report any bugs, broken flows, or visual issues you find.

## Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A Base44 account with an app created (you need VITE_APP_ID and VITE_SERVER_URL)

## Step 1 — Environment Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root:
   ```env
   VITE_APP_ID=your_base44_app_id
   VITE_SERVER_URL=https://api.base44.com
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.
5. Verify the app loads — you should see the login screen or be redirected to login.

## Step 2 — Authentication & Onboarding

1. Log in with an existing Base44 user account (or create one via the Base44 dashboard).
2. Verify the first-time **WelcomeTour** overlay appears (shows for the first 5 logins).
3. Click through all tour steps — verify each step renders with the correct icon, title, and description.
4. Dismiss the tour and verify it doesn't reappear on refresh (localStorage flag `phakathi_tour_seen`).
5. Verify the sidebar loads with all 8 navigation groups and ~35 nav items.
6. Verify the sidebar footer shows your name, email, and avatar/initials.
7. Verify the **NotificationBell** appears in the sidebar footer with an unread count badge (if applicable).

## Step 3 — Dashboard (Team Operations Hub)

1. Navigate to `/Dashboard` (should be the default landing page at `/`).
2. Verify the **HeroBanner** renders with org name, tagline, and stat cards.
3. Verify the **StatsGrid** shows 6+ metric cards (total projects, active projects, completed projects, total tasks, completed tasks, overdue tasks, team members).
4. Verify the **EmployeeAwards** section shows 3 award cards (Employee of the Week / Month / Year) with winner names or empty states.
5. Verify the **TeamBirthdays** section renders — a dark gradient panel with horizontally-scrollable birthday cards. Check:
   - Cards show team member names, birthday dates (MMM d format), and countdown badges ("Today! 🎂", "Tomorrow!", "In N days").
   - Color coding: pink for today, amber for this week, violet for later.
   - Empty state shows "No birthdays in the next 30 days" if no profiles have birthdays set.
   - If birthdays exist, verify the "N upcoming" count badge in the header matches the number of cards.
6. Verify the **ProjectsOverview** and **TeamPerformance** sections render in a 2-column grid.
7. Verify the **TeamPerformance** leaderboard shows ranked employees with completion rate, on-time delivery, and performance score. Click an employee to open the **EmployeeDetailDialog** — verify it shows their stats, active projects, and recent tasks.
8. Verify the **RecentTasks** section renders at the bottom.
9. If today is your birthday (or you set your birthday to today in Profile), verify the **BirthdayConfetti** modal appears with confetti animation.

## Step 4 — My Day (Personal Daily Hub)

1. Navigate to `/MyDay`.
2. Verify the **MyDayHero** renders a personalized greeting with the current user's name.
3. Verify the **AIBriefingCard** loads — it should fetch urgent tasks and pending leave approvals, then call the LLM to generate a "Top Priority Today" briefing. Check for loading state while the LLM call is in flight.
4. Verify the **MyDaySummaryCards** show pending tasks, upcoming bookings, and recent company feed posts.
5. Verify the **DailyReminders** strip shows contextual cards: SA holidays (if any in the next 14 days), upcoming birthdays, DAM compliance nudges (Mon/Thu), email response prompts (mornings), and rotating fun facts.
6. Verify the **MyDayLeftColumn** and **MyDayRightColumn** render urgent tasks, upcoming meetings, and pending approvals.
7. **Critical data check**: Verify MyDay only shows the current user's assigned tasks — NOT all org-wide tasks. If you see tasks assigned to other users, this is a bug.

## Step 5 — Notifications & Push

1. Navigate to `/Notifications`.
2. Verify the notification centre loads with priority/type filters.
3. Create a test notification via the **NotificationComposer** (if you're an admin) — set title, message, type, priority, and target. Verify it appears in the list.
4. Verify the **NotificationBell** in the sidebar updates its unread count.
5. Click the bell — verify the dropdown shows unread notifications with timestamps.
6. Mark a notification as read — verify the unread count decrements.
7. Navigate to `/Settings` → **NotificationSettings** section.
8. Enter a notification email address and toggle "Email Notifications" on. Save.
9. Toggle "Push Notifications" on — verify the browser prompts for notification permission. Grant it.
10. Create another test notification — verify a browser push notification appears (if the tab is open).
11. Navigate to `/Profile` and set your birthday to tomorrow. Save. Then manually trigger the `dailyNotificationScan` backend function (via the Base44 dashboard function tester) — verify it creates birthday notification records and (if email is enabled) sends a summary email.

## Step 6 — Work Hub (Projects, Kanban, Portfolios, Roadmaps)

1. `/Projects` — verify the project list loads with filter tabs (All / Active / Completed). Click a project to open `/ProjectDetails`. Verify the detail page shows project stats, task list, and task dialog.
2. `/Kanban` — verify the drag-and-drop board works. Drag a task between columns. Verify task dependencies show (if any). Open the **TimeLogDialog** and log time on a task.
3. `/Portfolios` — verify portfolio cards render with status, progress, risk level, and linked projects.
4. `/WorkloadPlanner` — verify the team workload analysis renders with per-employee task counts and capacity bars.
5. `/Roadmaps` — verify the roadmap visualisation renders with timeline and milestones.
6. `/GanttChart` — verify the Gantt timeline renders with bars and dependency lines.
7. `/TimeTracking` — verify you can log time against a task and view time entries.
8. `/Analytics` (Goals & OKRs) — verify OKR tracking renders with progress.

## Step 7 — Collaboration Hub

1. `/Messaging` — verify channels and direct messages load. Send a test message. Verify it appears in real-time (if another user is connected).
2. `/CompanyFeed` — verify the social feed loads. Create a post (update, announcement, recognition, or milestone). Like and comment on a post. Verify pinned posts appear at the top.
3. `/MeetingStudio` — verify the meeting studio loads. Create a meeting, upload an audio file, and trigger transcription + summarisation. Verify action items and individual summaries are generated.
4. `/AIAssistant` — verify the AI chat loads. Ask a question and verify a response streams back.

## Step 8 — People Hub

1. `/OrgChart` — verify the org chart renders in tree, grid, and analytics views. Click an employee to see their profile and reporting line.
2. `/PerformanceReviews` — verify the performance review list loads. Create a review, fill in self-assessment, and submit. Verify KPI and peer feedback sections work.
3. `/Onboarding` — verify the onboarding checklist loads with department-specific tasks.
4. `/TeamAttendance` — verify the team availability calendar renders with leave and meeting overlays.

## Step 9 — Operations Hub

1. `/Tickets` — verify the multi-queue ticketing system (IT / HR / Finance). Create a ticket, add a comment, and verify SLA tracking.
2. `/Assets` — verify the IT asset inventory loads with assignment tracking.
3. `/DocumentRepository` — verify the folder tree renders. Upload a document, share it, and verify per-department permissions work.
4. `/Expenses` — verify expense submission with receipt scanning works. Submit an expense and verify the approval workflow.
5. `/ResourceCalendar` — verify room booking works. Book a resource and verify it appears on the calendar.

## Step 10 — Company Hub

1. `/Noticeboard` — verify announcements load with pinning. Create an announcement and verify it appears.
2. `/CultureHub` — verify the recognition feed (kudos) and birthday wall render. Send kudos to a colleague with a badge type.
3. `/HRHub` — verify HR announcements, policy documents, and recent meetings render.
4. `/MeetingNotes` — verify structured meeting notes load with attendee management. Create a meeting note with action items.

## Step 11 — Insights Hub

1. `/ExecutiveDashboard` — verify the admin-only analytics page loads (if you're an admin). Check metric cards, engagement charts, DAM compliance widget, and department performance radar. If you're not an admin, verify access is denied.
2. `/PayrollDashboard` — verify payroll analytics render.
3. `/AutoPayroll` — verify the auto-payroll calculator works.
4. `/SageIntegration` — verify the Sage Integration Centre loads with connection status and sync config.
5. `/Integrations` — verify the integrations management page loads.

## Step 12 — Account Hub

1. `/Profile` — verify your profile loads with editable fields. Update your job title, subsidiary, phone, bio, and birthday. Upload a profile image. Save and verify changes persist.
2. `/Settings` — verify all settings sections render: Branding, NotificationSettings, PrivacySettings, DataManagement. Test the branding customisation (org name, tagline, colours) and verify it applies across the app.

## Step 13 — Responsive & Mobile

1. Resize the browser to mobile width (375px). Verify:
   - The sidebar collapses and a hamburger menu appears in the header.
   - All dashboard sections stack vertically.
   - The TeamBirthdays cards remain horizontally scrollable.
   - All forms and dialogs are usable on mobile.
2. Test on tablet width (768px) — verify the 2-column grids adapt.

## Step 14 — Backend Function Test

1. Using the Base44 dashboard, test the `dailyNotificationScan` backend function with an empty payload `{}`.
2. Verify it returns `{ success: true, birthdays: N, holidays: N, announcements: N, emailsSent: N, errors: [] }`.
3. Check the function logs for any errors.
4. If you have UserProfile records with birthdays in the next 5 days, verify the function creates Notification records for them.
5. Verify the "Daily Notification Scan" scheduled automation is active and configured to run at 7am SAST daily.

## Bug Report Format

For each issue found, report:
- **Page**: The route where the issue occurs
- **Component**: The component name
- **Severity**: Critical / High / Medium / Low
- **Description**: What happened
- **Steps to reproduce**: Numbered steps
- **Expected vs actual**: What should have happened vs what did happen
- **Screenshot**: If applicable

End with a summary: total issues by severity, and a pass/fail verdict for each of the 14 test sections.