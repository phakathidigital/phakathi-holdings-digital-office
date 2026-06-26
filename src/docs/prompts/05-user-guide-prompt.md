# User Guide Generation Prompt

You are writing a comprehensive, non-technical user guide for the "Phakathi Flow" application — an employee experience, operations, and intelligence platform built for the Phakathi Holdings group of companies. The guide is for end-users (employees, managers, and admins) who will use the app daily. Write in clear, friendly, non-technical language. No code, no file names, no technical jargon.

## Output
Produce a single markdown file (`USER_GUIDE.md`) structured by the app's eight navigation hubs. For each feature, explain: what it is, who it's for, how to use it step-by-step, and any tips. Include screenshots placeholders where helpful (e.g., `![Dashboard](screenshots/dashboard.png)`).

## Guide Structure

### 1. Getting Started
- How to log in (you'll receive an invite email from your administrator)
- The first-time welcome tour (what it shows, how to dismiss, how to replay it)
- The sidebar navigation — eight hubs: Home, Work, Collaboration, People, Operations, Company, Insights, Account
- How to switch between mobile and desktop views

### 2. Home Hub

#### Dashboard (Team Operations Hub)
- What it shows: team-wide stats, employee awards, team birthdays, project overview, team performance, recent tasks
- **Team Birthdays section**: explains the vibrant birthday cards — today's birthdays (pink), this week (amber), upcoming (violet), and the countdown badges. How to add your own birthday (via Profile) so you appear here.
- **Employee Awards**: Employee of the Week / Month / Year — how winners are determined (task completion metrics)
- **Team Performance leaderboard**: how to view your ranking, click a colleague to see their detail card
- Who can see it: all users (team-wide view)

#### My Day (Personal Daily Hub)
- What it shows: personalised greeting, AI task briefing, daily reminders, summary cards, urgent tasks, upcoming meetings, pending approvals
- **AI Briefing Card**: how it auto-detects your top priorities and generates a daily action plan
- **Daily Reminders**: SA public holidays, upcoming birthdays, DAM compliance nudges, email prompts, fun facts
- Important: My Day shows only YOUR tasks — not the whole team's
- Best time to check: every morning

#### Notifications
- The notification bell in the sidebar — how to check unread alerts
- Notification types: general, HR reminders, security alerts, executive notices, IT downtime, DAM reminders, meeting reminders, birthday reminders
- How to mark as read, acknowledge, and filter by priority/type
- How to enable email and push notifications (via Settings)

#### Calendar
- Team-wide event calendar
- How to view by day/week/month
- How to create an event

### 3. Work Hub

#### Projects
- How to view all projects, filter by status (All / Active / Completed)
- How to open a project to see its details, tasks, and stats
- How to create a new project (managers/admins)

#### Kanban
- The drag-and-drop task board — how to move tasks between columns (To Do, In Progress, Done)
- Task dependencies — what the dependency lines mean
- How to log time on a task (Time Log dialog)

#### Portfolios
- Strategic project portfolios — how they group multiple projects
- How to view portfolio status, progress, risk level, and linked projects

#### Workload Planner
- Team workload analysis — how to see who's overloaded or underutilised
- Capacity bars and task counts per employee

#### Roadmaps
- Project roadmap visualisation — timeline view of milestones and deliverables

#### Gantt Timeline
- Gantt chart with task bars and dependency lines
- How to read the timeline and identify critical path

#### Time Tracking
- How to log time against a task
- Billable vs non-billable hours
- How to view your time entries by date

#### Goals & OKRs
- Objective and Key Result tracking
- How to view progress and update key results

### 4. Collaboration Hub

#### Messaging
- Channels (group chats) vs direct messages
- How to send a message, reply, and see who's online
- Real-time message delivery

#### Company Feed
- The social engagement feed — how to post updates, announcements, recognition, and milestones
- How to like and comment on posts
- Pinned posts — what they are and how admins pin them
- How to add images and tags to your posts

#### Meeting Studio
- AI-powered meeting transcription and summarisation
- How to create a meeting, upload an audio recording, and get:
  - A full transcript
  - An AI-generated summary
  - Action items (automatically extracted)
  - Decisions made
  - Individual summaries per attendee
- How to sync action items to the Kanban board as tasks

#### AI Assistant
- Context-aware AI chat for HR and operations questions
- How to ask questions and get intelligent responses
- What kinds of questions it can answer (leave policies, company info, task help)

### 5. People Hub

#### Org Chart
- Interactive organisational chart — tree, grid, and analytics views
- How to click an employee to see their profile, reporting line, and active tasks
- How to view department analytics

#### Performance Reviews
- The review cycle: draft → self-assessment → manager review → completed
- How to fill in your self-assessment and self-rating
- How managers fill in manager assessments and ratings
- KPI tracking, strengths, areas for improvement, development goals
- Peer feedback — how to submit anonymous or named feedback for a colleague

#### Onboarding
- Department-specific checklists for new hires
- How to track progress through onboarding tasks (documents, accounts, training)

#### Team Attendance
- Aggregated team availability — leave and meetings overlaid on a calendar
- How to view daily/weekly/monthly availability
- How to see who's on leave today

### 6. Operations Hub

#### Support Tickets
- Multi-queue ticketing: IT, HR, Finance
- How to submit a ticket (set title, category, priority, description)
- How to track ticket status and SLA
- How to add comments (internal and external)

#### Assets
- IT asset inventory — laptops, monitors, phones
- How to see which assets are assigned to whom
- Asset status tracking (available, assigned, in repair, retired)

#### Document Vault
- Folder-based document repository with tree navigation
- How to upload a document (set category, access level, tags)
- How to share a document with specific people or departments
- Document approvals — how documents get reviewed and approved
- Version history — how to see previous versions

#### Expenses
- How to submit an expense (category, amount, date, description)
- Receipt scanning — how to upload a photo of your receipt
- Approval workflow — how managers approve/reject expenses
- How to track expense status

#### Room Booking
- How to book a meeting room or resource
- Calendar view of bookings
- How to cancel a booking

### 7. Company Hub

#### Noticeboard
- Company-wide announcements with pinning
- How to view pinned announcements at the top
- How admins create and pin announcements

#### Culture Hub
- **Recognition Feed (Kudos)**: how to send recognition to a colleague with a badge type (Star Performer, Team Player, Innovator, Above and Beyond, Leadership, Customer First, Problem Solver, Mentor)
- How to like a recognition
- **Birthday Wall**: celebrates team birthdays — how it connects to the Dashboard Team Birthdays section
- How birthdays are detected (from your Profile birthday field)

#### HR Hub
- HR announcements and pinned notices
- Downloadable policy documents and handbooks
- Recent HR meetings feed

#### Meeting Notes
- Structured meeting notes with attendee management
- How to create a meeting note (title, date, type, attendees, agenda, minutes, action items)
- Confidential meeting notes — how to mark a note as confidential
- Department-specific notes

### 8. Insights Hub

#### Executive Dashboard (Admin-Only)
- Who can access: admins only
- What it shows: high-level metrics, engagement charts, DAM compliance widget, department performance radar
- How to use it for strategic decision-making

#### Payroll Dashboard
- Payroll analytics and summaries
- How to view payroll by period, subsidiary, or department

#### Auto Payroll
- Automated payroll calculation
- How to run a payroll cycle

#### Sage Integration
- The Sage Integration Centre — connecting to Sage HR/Payroll
- Connection modes: API, CSV import, webhook
- How to configure sync modules (leave balances, leave requests, employee profiles, departments, reporting structures)
- Sync frequency settings (manual, hourly, daily, weekly)

#### Integrations
- Third-party service connection management
- How to connect and disconnect integrations

### 9. Account Hub

#### Profile
- How to update your personal information: job title, subsidiary, phone, bio
- **How to set your birthday** — this is important! Your birthday powers the Team Birthdays section on the Dashboard, the Birthday Wall on the Culture Hub, the birthday confetti on your special day, and the daily notification scan. Set it in Profile → Birthday field.
- How to upload a profile image and cover image
- How to view your profile as others see it

#### Settings
- **Branding**: how admins customise the org name, tagline, and colours across the app
- **Notification Settings**: 
  - How to enter your notification email address
  - How to toggle email notifications on/off (opt in to receive birthday, holiday, and announcement alerts via email)
  - How to toggle browser push notifications on/off (opt in to receive pop-up alerts on your device)
  - How push notifications work: you'll get a browser permission prompt — click Allow. Then you'll receive pop-up alerts even when the app tab is in the background.
- **Privacy Settings**: data visibility and privacy controls
- **Data Management**: export and data controls

### 10. Notifications Deep Dive

#### How Automated Notifications Work
- Every morning at 7am, the system automatically scans for:
  - **Upcoming birthdays** (next 5 days) — creates team-wide reminder notifications ("Thuli's birthday is in 5 days, remember the contribution!") and a personal message to the birthday person
  - **SA public holidays** (next 7 days) — creates holiday reminder notifications for all staff
  - **Recent announcements** — creates notification records for new company-wide announcements
- These notifications appear in:
  - The notification bell dropdown (in-app)
  - The Notifications page (full notification centre)
  - Your email inbox (if you've enabled email notifications in Settings)
  - Your device screen (if you've enabled browser push notifications in Settings)

#### How to Enable All Notification Channels
1. Go to Settings → Notification Settings
2. Enter your preferred email address in the "Notification Email" field
3. Toggle "Email Notifications" on
4. Toggle "Push Notifications" on — your browser will ask for permission; click "Allow"
5. You're all set — you'll now receive birthday, holiday, and announcement alerts via in-app, email, and browser push

### 11. Tips & Best Practices
- Check **My Day** every morning for your AI briefing and daily reminders
- Set your **birthday** in Profile so the team can celebrate you
- Enable **email and push notifications** in Settings so you never miss an important alert
- Use the **Company Feed** to share wins and recognise colleagues
- Log your **time** regularly in Time Tracking for accurate billing
- Keep your **Profile** updated so colleagues can find you in the Org Chart

### 12. FAQ
- **Q: I can't see my birthday on the Dashboard.** A: Make sure you've set your birthday in Profile. The Team Birthdays section shows birthdays in the next 30 days.
- **Q: I'm not receiving email notifications.** A: Go to Settings → Notification Settings, enter your email, and toggle Email Notifications on.
- **Q: I'm not receiving push notifications.** A: Go to Settings → Notification Settings, toggle Push Notifications on, and make sure you clicked "Allow" when your browser asked for permission.
- **Q: My Day shows tasks that aren't mine.** A: This shouldn't happen — My Day only shows tasks assigned to you. Contact your administrator if you see other people's tasks.
- **Q: I can't access the Executive Dashboard.** A: The Executive Dashboard is admin-only. Contact your administrator if you need access.
- **Q: How are Employee of the Week/Month/Year winners chosen?** A: Winners are determined objectively by task completion metrics — completion rate, on-time delivery, and total tasks completed in the period.

## Tone & Style
- Friendly, encouraging, and non-technical
- Use "you" and "your" throughout
- Use short paragraphs and bullet points
- Include emoji where appropriate (🎉, 🎂, ✅, 📌) to match the app's vibrant tone
- No code snippets, no file paths, no technical architecture
- Assume the reader has never used a workplace app before