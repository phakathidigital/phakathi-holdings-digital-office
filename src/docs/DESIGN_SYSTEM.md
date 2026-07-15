# Phakathi Flow — Design System

This document defines the design system used across the Phakathi Flow application. It serves as the single source of truth for colors, typography, spacing, components, and visual patterns. Follow these guidelines when building new pages or components to maintain consistency.

---

## 1. Architecture Overview

The design system is built on three layers:

| Layer | Technology | Location |
|---|---|---|
| **CSS Design Tokens** | HSL custom properties | `src/index.css` (`:root` and `.dark`) |
| **Tailwind Theme Mapping** | Token → Tailwind class mapping | `tailwind.config.js` |
| **Component Library** | shadcn/ui (New York style) | `src/components/ui/*` |

**How it works:** Raw values (colors, radii) are defined as CSS variables in `src/index.css`. Tailwind's config maps those variables to utility classes (`bg-primary`, `text-foreground`, `border-border`). Components consume the mapped Tailwind classes — never hardcoded hex values. This means changing a single CSS variable updates the entire app.

### Key Principle
> **Never hardcode colors.** Always use mapped token classes (`bg-primary`, `text-muted-foreground`, `border-border`). The only exception is gradient-based celebratory components (birthday cards, awards) which intentionally use vibrant Tailwind palette colors for visual impact.

---

## 2. Color System

### 2.1 Semantic Color Tokens

All colors are stored as HSL triplets (without `hsl()` wrapper) in `src/index.css`. Tailwind wraps them with `hsl()` in `tailwind.config.js`.

#### Light Mode (`:root`)

| Token | HSL Value | Hex Equivalent | Usage |
|---|---|---|---|
| `--background` | `0 0% 100%` | `#FFFFFF` | Page background |
| `--foreground` | `0 0% 3.9%` | `#0A0A0A` | Primary text |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card backgrounds |
| `--card-foreground` | `0 0% 3.9%` | `#0A0A0A` | Card text |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Popover/dropdown backgrounds |
| `--popover-foreground` | `0 0% 3.9%` | `#0A0A0A` | Popover text |
| `--primary` | `0 0% 9%` | `#171717` | Primary buttons, active states |
| `--primary-foreground` | `0 0% 98%` | `#FAFAFA` | Text on primary |
| `--secondary` | `0 0% 96.1%` | `#F5F5F5` | Secondary surfaces |
| `--secondary-foreground` | `0 0% 9%` | `#171717` | Text on secondary |
| `--muted` | `0 0% 96.1%` | `#F5F5F5` | Muted backgrounds |
| `--muted-foreground` | `0 0% 45.1%` | `#737373` | Muted/placeholder text |
| `--accent` | `0 0% 96.1%` | `#F5F5F5` | Accent backgrounds |
| `--accent-foreground` | `0 0% 9%` | `#171717` | Text on accent |
| `--destructive` | `0 84.2% 60.2%` | `#EF4444` | Delete/error actions |
| `--destructive-foreground` | `0 0% 98%` | `#FAFAFA` | Text on destructive |
| `--border` | `0 0% 89.8%` | `#E5E5E5` | Borders, dividers |
| `--input` | `0 0% 89.8%` | `#E5E5E5` | Input borders |
| `--ring` | `0 0% 3.9%` | `#0A0A0A` | Focus ring |

#### Sidebar Tokens (Light)

| Token | HSL Value | Usage |
|---|---|---|
| `--sidebar-background` | `0 0% 98%` | Sidebar background |
| `--sidebar-foreground` | `240 5.3% 26.1%` | Sidebar text |
| `--sidebar-primary` | `240 5.9% 10%` | Active nav item |
| `--sidebar-primary-foreground` | `0 0% 98%` | Text on active nav |
| `--sidebar-accent` | `240 4.8% 95.9%` | Hover nav item |
| `--sidebar-accent-foreground` | `240 5.9% 10%` | Text on hover nav |
| `--sidebar-border` | `220 13% 91%` | Sidebar dividers |
| `--sidebar-ring` | `217.2 91.2% 59.8%` | Sidebar focus ring |

#### Chart Tokens

| Token | Light HSL | Dark HSL | Usage |
|---|---|---|---|
| `--chart-1` | `12 76% 61%` | `220 70% 50%` | Chart series 1 (red/blue) |
| `--chart-2` | `173 58% 39%` | `160 60% 45%` | Chart series 2 (teal/green) |
| `--chart-3` | `197 37% 24%` | `30 80% 55%` | Chart series 3 (navy/orange) |
| `--chart-4` | `43 74% 66%` | `280 65% 60%` | Chart series 4 (gold/purple) |
| `--chart-5` | `27 87% 67%` | `340 75% 55%` | Chart series 5 (orange/pink) |

### 2.2 Phakathi Brand Colors

In addition to the semantic tokens, the Layout component (`src/Layout.jsx`) defines Phakathi-specific brand colors as inline CSS variables. These represent the corporate identity:

```css
:root {
  --ph-primary: #C0C0C0;      /* Silver */
  --ph-primary-dark: #808080;  /* Gray */
  --ph-secondary: #000000;     /* Black */
  --ph-accent: #404040;        /* Dark gray */
  --ph-success: #10B981;       /* Emerald */
  --ph-warning: #F59E0B;       /* Amber */
  --ph-error: #EF4444;         /* Red */
  --ph-bg: #FFFFFF;            /* White */
}
```

**Brand identity:** Silver + Black (corporate Phakathi Holdings colors). The sidebar uses a clean white background with dark text, a silver/black logo block, and subtle gray hover states — reflecting a professional, enterprise tone.

### 2.3 Status Color Convention

Throughout the app, status colors follow a consistent pattern (used in badges, progress indicators, and alert cards):

| Status | Tailwind Classes | Usage |
|---|---|---|
| **Success / Completed** | `bg-emerald-100 text-emerald-700` | Completed tasks, approved items |
| **Warning / Pending** | `bg-amber-100 text-amber-700` | Pending items, at-risk projects |
| **Danger / Overdue** | `bg-red-100 text-red-700` | Overdue tasks, rejected items |
| **Info / In Progress** | `bg-blue-100 text-blue-700` | Active items, in-progress tasks |
| **Neutral / Default** | `bg-gray-100 text-gray-700` | Draft, archived, neutral states |

### 2.4 Celebratory Gradient Palette

For festive/engagement components (Team Birthdays, Employee Awards, Daily Reminders), vibrant gradients are used intentionally to create visual delight:

| Context | Gradient | Ring Color |
|---|---|---|
| **Birthday — Today** | `from-pink-500 to-rose-500` | `ring-pink-300/50` |
| **Birthday — This week** | `from-amber-400 to-orange-500` | `ring-amber-200/50` |
| **Birthday — Upcoming** | `from-violet-500 to-purple-500` | `ring-violet-200/50` |
| **Award — Week** | `from-blue-500 to-indigo-600` | — |
| **Award — Month** | `from-amber-500 to-orange-600` | — |
| **Award — Year** | `from-violet-500 to-purple-700` | — |
| **Dark panel** | `from-gray-900 via-gray-800 to-gray-950` | — |

---

## 3. Dark Mode

Dark mode is class-based (`darkMode: ["class"]`). When the `.dark` class is on the `<html>` element, all CSS variables switch to their dark equivalents. The token system means **no component changes are needed** — the same `bg-background`, `text-foreground` classes automatically resolve to dark values.

### Dark Mode Token Values

| Token | Dark HSL | Hex Equivalent |
|---|---|---|
| `--background` | `0 0% 3.9%` | `#0A0A0A` |
| `--foreground` | `0 0% 98%` | `#FAFAFA` |
| `--card` | `0 0% 3.9%` | `#0A0A0A` |
| `--primary` | `0 0% 98%` | `#FAFAFA` |
| `--secondary` | `0 0% 14.9%` | `#262626` |
| `--muted` | `0 0% 14.9%` | `#262626` |
| `--muted-foreground` | `0 0% 63.9%` | `#A3A3A3` |
| `--border` | `0 0% 14.9%` | `#262626` |
| `--destructive` | `0 62.8% 30.6%` | `#7F1D1D` |

> **Note:** The app currently defaults to light mode. Dark mode tokens are defined and ready but the `.dark` class is not toggled anywhere in the app yet.

---

## 4. Typography

The app uses system font stacks (no custom font imports currently). Typography is controlled via Tailwind utility classes:

| Element | Class Pattern | Typical Usage |
|---|---|---|
| Page title | `text-xl font-bold text-gray-900` | Dashboard section headers |
| Section title | `text-lg font-semibold text-gray-900` | Card headers |
| Body text | `text-sm text-gray-600` | Card content, descriptions |
| Muted/caption | `text-xs text-gray-500` | Timestamps, labels, helper text |
| Sidebar group label | `text-xs font-semibold text-gray-400 uppercase tracking-wider` | Nav group headers |
| Badge text | `text-xs font-bold` | Status badges, count chips |

### Font Size Scale (Tailwind defaults)

| Class | Size | Usage |
|---|---|---|
| `text-xs` | 0.75rem (12px) | Labels, captions, badges |
| `text-sm` | 0.875rem (14px) | Body text, sidebar items |
| `text-base` | 1rem (16px) | Default body |
| `text-lg` | 1.125rem (18px) | Card titles |
| `text-xl` | 1.25rem (20px) | Section headers |
| `text-2xl` | 1.5rem (24px) | Page titles, hero stats |
| `text-3xl` | 1.875rem (30px) | Large hero numbers |

---

## 5. Spacing & Border Radius

### 5.1 Border Radius

Border radius is token-based. The `--radius` CSS variable (default `0.5rem` = 8px) drives all radius utilities:

| Class | Formula | Pixel Value | Usage |
|---|---|---|---|
| `rounded-sm` | `var(--radius) - 4px` | 4px | Small elements, badges |
| `rounded-md` | `var(--radius) - 2px` | 6px | Inputs, buttons (sm) |
| `rounded-lg` | `var(--radius)` | 8px | Cards, buttons (default) |
| `rounded-xl` | 12px (Tailwind default) | 12px | Icon containers, medium cards |
| `rounded-2xl` | 16px (Tailwind default) | 16px | Birthday/award cards |
| `rounded-3xl` | 24px (Tailwind default) | 24px | Large festive panels |
| `rounded-full` | 9999px | — | Avatars, pills, badges |

### 5.2 Spacing Scale

Standard Tailwind spacing scale is used throughout. Common patterns:

| Context | Padding | Gap |
|---|---|---|
| Page container | `p-4 md:p-8` | `space-y-7` between sections |
| Cards | `p-6` | `gap-4` internal |
| Sidebar items | `px-3 py-2` | `gap-3` icon-to-label |
| Form fields | `space-y-4` | — |
| Max content width | `max-w-7xl mx-auto` | — |

### 5.3 Shadows

| Class | Usage |
|---|---|
| `shadow-sm` | Subtle elements, inputs |
| `shadow` | Default cards |
| `shadow-lg` | Icon containers, floating elements |
| `shadow-xl` | Large festive panels, modals |

---

## 6. Component Library — shadcn/ui

### 6.1 Configuration

The app uses **shadcn/ui** with the following configuration (`components.json`):

| Setting | Value |
|---|---|
| Style | `new-york` |
| Base Color | `neutral` |
| CSS Variables | `true` |
| TypeScript | `false` (JSX) |
| Icon Library | `lucide-react` |
| Components alias | `@/components` |
| UI alias | `@/components/ui` |
| Utils alias | `@/lib/utils` |
| Hooks alias | `@/hooks` |

### 6.2 Available UI Primitives

All shadcn/ui components are in `src/components/ui/`. Import each from its own file:

```
@/components/ui/button       @/components/ui/card         @/components/ui/dialog
@/components/ui/badge         @/components/ui/input        @/components/ui/label
@/components/ui/select       @/components/ui/tabs         @/components/ui/textarea
@/components/ui/switch        @/components/ui/checkbox     @/components/ui/table
@/components/ui/dropdown-menu @/components/ui/popover     @/components/ui/tooltip
@/components/ui/avatar        @/components/ui/progress     @/components/ui/skeleton
@/components/ui/separator     @/components/ui/scroll-area  @/components/ui/sheet
@/components/ui/alert         @/components/ui/alert-dialog @/components/ui/accordion
@/components/ui/tabs          @/components/ui/sidebar       @/components/ui/calendar
@/components/ui/chart         @/components/ui/command      @/components/ui/context-menu
@/components/ui/drawer         @/components/ui/form         @/components/ui/hover-card
@/components/ui/menubar       @/components/ui/navigation-menu @/components/ui/pagination
@/components/ui/radio-group    @/components/ui/slider       @/components/ui/toggle
@/components/ui/toggle-group  @/components/ui/aspect-ratio  @/components/ui/carousel
@/components/ui/collapsible    @/components/ui/input-otp    @/components/ui/resizable
@/components/ui/sonner        @/components/ui/breadcrumb    @/components/ui/use-toast
```

> **Important:** Each shadcn file exports only its own primitives. Import each from its own file. Never re-export from one UI file into another.

### 6.3 Button Variants

| Variant | Class | Usage |
|---|---|---|
| `default` | `bg-primary text-primary-foreground` | Primary actions (save, create) |
| `secondary` | `bg-secondary text-secondary-foreground` | Secondary actions |
| `outline` | `border border-input bg-background` | Tertiary actions, cancel |
| `ghost` | `hover:bg-accent` | Icon buttons, subtle actions |
| `destructive` | `bg-destructive text-destructive-foreground` | Delete, remove |
| `link` | `text-primary underline-offset-4` | Text links |

### 6.4 Button Sizes

| Size | Height | Padding | Usage |
|---|---|---|---|
| `default` | `h-9` | `px-4 py-2` | Standard buttons |
| `sm` | `h-8` | `px-3` | Compact actions, in-card |
| `lg` | `h-10` | `px-8` | Hero CTAs |
| `icon` | `h-9 w-9` | — | Icon-only buttons |

---

## 7. Iconography

Icons use **lucide-react** only. Never import icons that don't exist in the package — a non-existent icon breaks the entire app.

### Common Icons Used

| Hub | Icons |
|---|---|
| Home | `LayoutDashboard`, `Sun`, `Bell`, `CalendarDays` |
| Work | `FolderKanban`, `Columns`, `Layers`, `BarChart`, `Map`, `Timer`, `Target`, `GanttChartSquare` |
| Collaboration | `MessageCircle`, `Rss`, `Mic`, `Sparkles` |
| People | `GitBranch`, `Star`, `UserCheck`, `CalendarDays` |
| Operations | `Headphones`, `Monitor`, `FolderOpen`, `Receipt`, `CalendarClock` |
| Company | `Megaphone`, `Heart`, `Building2`, `ClipboardList` |
| Insights | `TrendingUp`, `Wallet`, `Calculator`, `Link2`, `Plug` |
| Account | `User`, `Settings` |

### Icon Sizing Convention

| Context | Size Class |
|---|---|
| Sidebar nav items | `w-4 h-4` |
| Card headers / icon containers | `w-5 h-5` or `w-6 h-6` |
| Button icons | `w-4 h-4` (default via `[&_svg]:size-4`) |
| Large hero icons | `w-8 h-8` or larger |

### Name Collision Rule
If a lucide icon shares a name with a page or component, alias it:
```jsx
import { Home as HomeIcon } from "lucide-react";
```

---

## 8. Layout System

### 8.1 App Shell

The app uses a **sidebar + main content** layout (`src/Layout.jsx`):

```
┌─────────────────────────────────────────────┐
│  Sidebar  │  Main Content Area              │
│           │                                 │
│  • Logo   │  ┌───────────────────────────┐  │
│  • Nav    │  │  Page content (scrollable)│  │
│    groups │  │                           │  │
│  • User   │  └───────────────────────────┘  │
│  • Logout │                                 │
└─────────────────────────────────────────────┘
```

- **Sidebar:** Fixed left, collapsible on mobile (hamburger menu in header). Uses the shadcn `Sidebar` component (`@/components/ui/sidebar`).
- **Main content:** `flex-1`, `overflow-auto`, `bg-gray-50` background.
- **Mobile header:** Only visible on `< md` breakpoints (`md:hidden`). Contains hamburger trigger + org name.

### 8.2 Navigation Structure

Eight navigation groups, each with a label and items:

| Group | Label Style | Items |
|---|---|---|
| Home | `text-xs font-semibold text-gray-400 uppercase` | Dashboard, My Day, Notifications, Calendar |
| Work | (same) | Projects, Kanban, Portfolios, Workload Planner, Roadmaps, Gantt, Time Tracking, Goals & OKRs |
| Collaboration | (same) | Messaging, Company Feed, Meeting Studio, AI Assistant |
| People | (same) | Org Chart, Performance, Onboarding, Team Attendance |
| Operations | (same) | Support Tickets, Assets, Document Vault, Expenses, Room Booking |
| Company | (same) | Noticeboard, Culture Hub, HR Hub, Meeting Notes |
| Insights | (same) | Executive Dash, Payroll, Auto Payroll, Sage Integration, Integrations |
| Account | (same) | Profile, Settings |

### 8.3 Active Nav Item Styling

```jsx
isActive
  ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 font-semibold shadow-sm border border-gray-200'
  : 'hover:bg-gray-50'
```

### 8.4 Page Container Pattern

Every page follows this container pattern:
```jsx
<div className="min-h-screen p-4 md:p-8">
  <div className="max-w-7xl mx-auto space-y-7">
    {/* Sections */}
  </div>
</div>
```

---

## 9. Card Patterns

### 9.1 Standard Card (shadcn)

```jsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### 9.2 Gradient Icon Header Card

Used for stat cards and feature cards. A colored gradient square holds an icon, followed by a title and value:

```jsx
<div className="flex items-center gap-3 mb-4">
  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
    <Icon className="w-6 h-6 text-white" />
  </div>
  <div>
    <h3 className="font-semibold text-gray-900">Title</h3>
    <p className="text-sm text-gray-500">Subtitle</p>
  </div>
</div>
```

### 9.3 Festive Panel (Dark Gradient)

Used for celebratory sections (Team Birthdays, Awards):

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-6 shadow-xl"
>
  {/* Decorative blur glows */}
  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl -translate-y-1/2 translate-x-1/3" />
  {/* Content */}
</motion.div>
```

### 9.4 Empty State Pattern

```jsx
<div className="py-12 text-center">
  <div className="text-5xl mb-3">🎈</div>
  <p className="text-gray-600 font-medium">No items found</p>
  <p className="text-gray-400 text-sm mt-1">Helper text for what to do</p>
</div>
```

---

## 10. Animation System

### 10.1 Framer Motion

Animations use **framer-motion** (`motion` components). Common patterns:

| Animation | Props | Usage |
|---|---|---|
| Fade + slide up | `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}` | Section entrance |
| Scale in | `initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}` | Card entrance |
| Staggered children | `transition={{ delay: i * 0.06 }}` | Lists of cards |
| Hover lift | `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}` | Interactive cards |
| Confetti | Custom canvas animation | Birthday celebration |

### 10.2 Tailwind Animations

| Animation | Duration | Usage |
|---|---|---|
| `animate-spin` | — | Loading spinners |
| `animate-pulse` | — | Skeleton loading |
| `accordion-down` | 0.2s ease-out | Accordion expand |
| `accordion-up` | 0.2s ease-out | Accordion collapse |

### 10.3 Transition Convention

Standard transition class for hover effects: `transition-all duration-200`

---

## 11. Badge & Status Pill Patterns

### 11.1 Status Badge

```jsx
<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
  Completed
</Badge>
```

### 11.2 Count Badge

```jsx
<span className="bg-white/10 text-white/70 px-3 py-1.5 rounded-full text-sm font-medium">
  3 upcoming
</span>
```

### 11.3 Avatar with Initials

```jsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
  <span className="text-white font-semibold text-sm">
    {name.charAt(0)}
  </span>
</div>
```

---

## 12. Loading States

### 12.1 Skeleton Loading

```jsx
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-4 w-1/2" />
```

### 12.2 Spinner

```jsx
<div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
```

### 12.3 Pattern

Always show loading indicators while async data is being fetched:
```jsx
{isLoading ? <Skeleton /> : <ActualContent />}
```

---

## 13. Guidelines for Future Expansion

### 13.1 Creating a New Page

1. Create a new file in `src/pages/` (e.g., `src/pages/NewFeature.jsx`)
2. Export as default with the same name as the file
3. Use the page container pattern (Section 8.4)
4. Add the route in `src/App.jsx` — both the import and the `<Route>` element
5. Add a navigation item in `src/Layout.jsx` (`navigationItems` array) with the correct group

### 13.2 Creating a New Component

1. Create a focused file in `src/components/` (under the appropriate subdirectory)
2. Keep components under ~50 lines — split into sub-components if larger
3. Export as default with the same name as the file
4. Use `@/` alias imports — never relative paths (`../../`)
5. Use shadcn/ui primitives from `@/components/ui/*`
6. Use lucide-react icons only

### 13.3 Adding a New Entity

1. Create the JSON schema in `base44/entities/EntityName.jsonc` (full schema, no comments)
2. Include all built-in fields implicitly (id, created_date, updated_date, created_by_id) — never declare them
3. Use the entity SDK: `base44.entities.EntityName.list/filter/create/update/delete`
4. Document the entity in `src/README.md` — Data Entities Reference table

### 13.4 Color Changes

To change the app's color theme:
1. Update the HSL values in `src/index.css` (`:root` for light, `.dark` for dark)
2. **Do not** touch `tailwind.config.js` — it only maps tokens to classes
3. **Do not** change individual component files — they use token classes that auto-update

### 13.5 Tailwind Class Rules

- **Always write class names as literal strings** — the build purges anything not found as a literal substring
- Never use dynamic class names (`bg-${color}-500`) — they'll be silently purged
- Use `safelist` in `tailwind.config.js` only for runtime-sourced values (entity records, API responses)
- Use mapped token classes (`bg-primary`) instead of hardcoded values (`bg-[#ffffff]`)

### 13.6 Responsive Design

| Breakpoint | Prefix | Target |
|---|---|---|
| Mobile | (none) | < 640px |
| Small | `sm:` | ≥ 640px |
| Medium | `md:` | ≥ 768px |
| Large | `lg:` | ≥ 1024px |
| XL | `xl:` | ≥ 1280px |

Common responsive patterns:
- Grid: `grid lg:grid-cols-2 gap-6` (stacks on mobile, 2-col on desktop)
- Padding: `p-4 md:p-8`
- Flex direction: `flex-col md:flex-row`
- Hidden/show: `md:hidden` (mobile-only), `hidden md:flex` (desktop-only)

---

## 14. File Locations Quick Reference

| File | Purpose |
|---|---|
| `src/index.css` | CSS design tokens (colors, radius) — `:root` and `.dark` |
| `tailwind.config.js` | Tailwind theme mapping (tokens → utility classes) |
| `components.json` | shadcn/ui configuration (style, aliases, base color) |
| `src/Layout.jsx` | App shell (sidebar + main content), nav structure, Phakathi brand colors |
| `src/components/ui/` | shadcn/ui primitive components |
| `src/lib/utils.js` | `cn()` utility for merging class names |
| `src/App.jsx` | Router — all page routes |

---

## 15. Summary

The Phakathi Flow design system is:

1. **Token-based** — CSS variables in `index.css` mapped to Tailwind classes in `tailwind.config.js`
2. **shadcn/ui (New York style)** — neutral base, CSS variables enabled, lucide icons
3. **Silver + Black brand identity** — professional enterprise tone with festive accent gradients for engagement
4. **Framer Motion** — for entrance, hover, and staggered animations
5. **Light mode default** — dark mode tokens defined and ready
6. **Responsive** — mobile-first with `md:` and `lg:` breakpoints

To maintain consistency: always use token classes, never hardcode colors, keep components small and focused, and follow the established patterns for cards, badges, animations, and empty states.