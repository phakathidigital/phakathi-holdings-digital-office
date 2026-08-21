# Phakathi Flow mobile and desktop architecture

## Current state

Phakathi Flow is a browser-based React/Vite app using:

- Browser routing.
- `localStorage` auth token.
- Browser service worker push.
- Browser Notification API.
- Browser file uploads.

It is not yet packaged for Android, iOS, or desktop.

## Target platform strategy

```text
React/Vite Web
  -> Capacitor Android
  -> Capacitor iOS
  -> Tauri Desktop

All clients use the same API and business data layer.
```

## Required abstraction layer

Before mobile/desktop packaging, add:

- `src/platform/authStorage`
- `src/platform/notifications`
- `src/platform/files`
- `src/platform/device`
- `src/platform/links`
- `src/platform/offline`
- `src/platform/authCallbacks`

Each defaults to browser behavior and can later use Capacitor/Tauri implementations.

## Mobile target

Use Capacitor for:

- Android/iOS packaging.
- Native push.
- Secure token storage.
- File picker/camera.
- Deep links.
- App lifecycle.
- Device/session identity.

Mobile UI must support stacked dashboard cards, touch-friendly Kanban, mobile table/card views, drawer/bottom navigation, small-screen forms, and resilient notifications.

## Desktop target

Use Tauri for:

- Desktop packaging.
- Native notifications.
- Secure token storage.
- File system adapters.
- External link handling.
- Deep links.
- Window behavior.

## Auth target

- Web: improve beyond localStorage for production where possible.
- Mobile: secure storage.
- Desktop: OS secure storage/keychain.
- API: refresh tokens, sessions, device revocation.

## Notification target

- Web: current browser push.
- Android/iOS: native push adapter.
- Desktop: Tauri notification adapter.
- Server: one Notification/Delivery model, multiple delivery channels.

## Offline target

Start small:

1. Offline read cache.
2. Queue simple task status updates.
3. Conflict detection.
4. Broader offline document/work support later.

## Implementation order

1. Audit direct browser APIs.
2. Add platform abstractions.
3. Fix mobile responsiveness.
4. Add device/session model.
5. Add secure-token design.
6. Add Capacitor shell.
7. Add native mobile push.
8. Add Tauri shell.
9. Add native desktop notification/file adapters.
