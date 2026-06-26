# Phakathi Flow Base44 Migration Notes

## Scope completed

- Centralised the active Phakathi Holdings subsidiary list in `src/lib/subsidiaries.js`.
- Updated runtime subsidiary dropdowns to use the canonical list.
- Updated Base44 entity enums to the canonical group list.
- Added `CompanyTeam` as a Base44 entity schema for grouping team placeholders and future company membership data.
- Added a first-login profile completion gate for users without a subsidiary.
- Preserved personal branding and added company-level branding defaults.
- Added a weekly Monday group alignment meeting template to the scheduler and AI meeting transcript flow.
- Fixed local Vite config portability by replacing implicit CommonJS `__dirname` usage with an ESM-safe equivalent and moving Vite cache to `./.vite-cache`.

## Canonical subsidiaries

1. Phakathi Holdings
2. Empoweryst
3. Micky Mouse School / Baby Geniuses
4. Phakathi Capital
5. Key Experts
6. Kaelo Education
7. Kaelo
8. Synergex Health

Legacy names such as `Kaello Education Co.`, `Mickey Mouse Schools`, and `Synergex Healthcare` are kept only as compatibility aliases in code.

## Initial team placeholders

- Phakathi Holdings: Lorraine, Meriam, Phathu, Thuli, Percity
- Empoweryst: Sarah, Lesedi, Molato

These are placeholders until real user emails are available. Meeting attendee fields now accept names or emails, but only valid emails receive outgoing meeting invites or AI summaries.

## First-login company setup

Base44-hosted authentication is still used. Because the hosted signup screen is not locally controlled, the app now enforces company selection immediately after authentication. A user without `user.subsidiary` is shown the company profile setup screen before the main app renders.

The setup stores:

- `subsidiary`, `department`, `job_title`, and `full_name` on the Base44 auth user via `base44.auth.updateMe()`.
- A matching `UserProfile` record keyed by `user_email`.

## Group overview access

The app computes whole-group overview access from the employee designation/role and department in `src/lib/accessControl.js`.

These users can see and manage group-level overview areas regardless of their selected subsidiary:

- Group CEO / Chief Executive Officer
- Operations Manager
- HR / Human Resources
- Base44 `admin` role

The designation is stored in the existing `job_title` field to preserve compatibility with the migrated Base44 app.

## Branding model

Branding precedence is:

1. Company defaults from `src/lib/subsidiaries.js`.
2. User-specific `user.branding` overrides saved from Settings -> Branding.

This preserves the previous per-user colour scheme feature while giving each company sensible defaults.

## Weekly Monday meetings

The meeting scheduler includes a "Use weekly Monday alignment template" action that fills:

- title
- next Monday date
- default time
- Phakathi Holdings as group-level host
- initial team placeholder attendees
- agenda based on the 23 March, 30 March, and 20 April 2026 meeting notes
- recurrence metadata

## Local verification

Run:

```bash
npm install
npm run build
npm run dev
```

Expected:

- Build completes.
- Dev server starts on Vite.
- New authenticated users without a subsidiary are blocked by the company setup screen.
- Existing users with a subsidiary enter the app normally.
