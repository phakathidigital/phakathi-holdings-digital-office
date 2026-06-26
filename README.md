# Base44 Preview Template for MicroVM sandbox

This template is used by the server to preview user-apps.

## user files
server creates the user-app files in the __components__, __pages__ folders

## server injected data
server injects app related data to __app.config.js__, which is used by App.jsx to render the components in the files.

---

## 2026 Base44 Local Migration Addendum

### Multi-company group-user feature

Phakathi Flow now uses one canonical subsidiary list across runtime dropdowns and Base44 entity schemas:

1. Phakathi Holdings
2. Empoweryst
3. Micky Mouse School / Baby Geniuses
4. Phakathi Capital
5. Key Experts
6. Kaelo Education
7. Kaelo
8. Synergex Health

New authenticated users who do not yet have a subsidiary are stopped at a first-login company setup screen before they can enter the main app. This preserves Base44-hosted authentication while ensuring each user is assigned to the correct company/team.

Initial team placeholders are documented in `src/lib/subsidiaries.js` and `MIGRATION.md`:

- Phakathi Holdings: Lorraine, Meriam, Phathu, Thuli, Percity
- Empoweryst: Sarah, Lesedi, Molato

### Branding behaviour

Company-level colour defaults are applied first. User-selected branding from Settings -> Branding still overrides company defaults and persists through `base44.auth.updateMe({ branding })`.

Phakathi Holdings web logos, cover imagery, and reusable icon assets are stored locally in `src/assets/branding/phakathi-holdings/`. Public browser/app icons live in `public/brand/`. The source brand guide is preserved in `docs/brand/phakathi-holdings-group-brand-guide.docx`.

The app uses the Phakathi Holdings logo in the auth landing screen, sidebar, mobile header, and browser favicon. The auth landing screen uses the portfolio-of-companies image, and the dashboard hero uses the company profile cover image to reflect the group focus areas: education, health, mining, energy, and shared services.

### Weekly Monday alignment meetings

The meeting scheduler and AI Meeting Studio include a weekly Monday alignment template based on the March/April 2026 meeting notes. The template includes group strategy alignment, subsidiary updates, performance/project-management blockers, and action-item follow-up.

### Local commands

```bash
npm install
npm run build
npm run dev
```

The Vite config now uses an ESM-safe `__dirname` equivalent and `./.vite-cache` to avoid the previous `node_modules/.vite-temp` permission failure.

### Verification checklist

- [ ] New user without subsidiary is forced through company setup.
- [ ] Empoweryst users can be assigned to Empoweryst.
- [ ] Phakathi Holdings users can be assigned to Phakathi Holdings.
- [ ] All active subsidiary dropdowns use the canonical list.
- [ ] User branding persists and overrides company defaults.
- [ ] Weekly Monday alignment template creates a usable meeting record.
- [ ] `npm install`, `npm run build`, and `npm run dev` work locally.
