# Phakathi Flow mobile and desktop architecture

## Current state

Phakathi Flow is currently a responsive React/Vite web application. It already includes browser-compatible UI, a sidebar and mobile header, browser push service worker, localStorage auth token storage, and browser file uploads.

The application is not yet packaged as a mobile or desktop app.

## Target architecture

Use one business backend for all clients:

```text
             API
              |
       ----------------
       |       |      |
      Web   Mobile  Desktop
     Vite  Capacitor Tauri
```

Business logic stays server-side. Permissions, authentication, notifications, and audit logging must behave consistently across web, mobile, and desktop.

## Mobile target

Recommended wrapper:

- Capacitor.

Mobile-specific areas to abstract:

- Push notifications.
- Deep links.
- Authentication callbacks.
- File picking/camera uploads.
- Offline cache strategy.
- Device/session tracking.
- Secure token storage.

Mobile UX requirements include touch-friendly controls, mobile drawer or bottom navigation where appropriate, responsive tables/charts/Kanban/forms/modals, no horizontal overflow, and a notification centre usable on small screens.

## Desktop target

Recommended wrapper:

- Tauri.

Desktop-specific areas to abstract:

- File system access.
- External links.
- Deep links.
- Native notifications.
- Window behaviour.
- Authentication callbacks.
- Local secure storage.

## Shared client abstraction

Add small abstraction modules before mobile/desktop packaging:

- `src/platform/notifications`
- `src/platform/storage`
- `src/platform/files`
- `src/platform/links`
- `src/platform/authCallbacks`
- `src/platform/device`

Each abstraction should default to browser behaviour and allow Capacitor/Tauri implementations later.

## Current risks

- Browser APIs are used directly in several places.
- Auth token is stored in localStorage.
- Push notification setup is browser/service-worker specific.
- File upload and camera scanning are browser-first.
- Large tables and boards may overflow on mobile.

## Recommended mobile/desktop sequence

1. Audit all direct browser APIs.
2. Add platform abstraction layer.
3. Fix mobile responsiveness for Dashboard, My Day, CRM, Projects, Kanban, Calendar, Notifications, Meetings, DAM, HR, Analytics, and forms.
4. Add Capacitor shell.
5. Add mobile push provider strategy.
6. Add Tauri shell.
7. Add native notification/file/deep-link adapters.
8. Add device/session management.
9. Test on real mobile and desktop devices.
