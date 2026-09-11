# Phakathi Flow Mobile and Desktop Architecture

Phase: 0 platform audit only.

## Current state

The current repository is a web application. It is not yet packaged as Android, iOS, Huawei, or desktop applications.

The web app already has useful foundations for future native packaging:

- React/Vite frontend.
- Service worker.
- Browser push foundation.
- API-first backend direction.
- Responsive UI components.
- Phakathi brand assets.

However, app-store distribution requires more than a working web build.

## Target platform model

Recommended platform approach:

```text
React/Vite web app
  -> Capacitor Android/iOS/Huawei wrappers
  -> Tauri desktop wrapper
  -> shared API and shared auth
  -> PostgreSQL/object storage backend
```

The mobile and desktop clients should not fork the business logic. They should use the same API, permissions, notification records, and audit rules as the web app.

## Android

Target:

- Capacitor wrapper.
- FCM push notifications.
- Android signing.
- Play Store data-safety documentation.
- Runtime permission handling.
- Deep links to notifications/tasks/meetings.

## iOS

Target:

- Capacitor iOS wrapper.
- APNs push notifications.
- Apple signing/provisioning.
- App Store privacy labels.
- Background notification handling.
- iOS-specific permission messaging.

## Huawei

Target:

- Huawei-compatible Android build.
- HMS push if Google Play Services cannot be assumed.
- Huawei AppGallery metadata and privacy disclosures.

## Microsoft desktop

Target:

- Tauri desktop app.
- Native desktop notifications.
- Installer/signing.
- Auto-update strategy.
- Windows notification routing.

## Offline expectations

Public/office users will expect some offline tolerance. Target behavior should be:

- Read cached recent records.
- Queue safe writes locally.
- Sync when online.
- Clearly mark unsynced records.
- Do not pretend integration actions succeeded offline.

The current app is not yet an offline-first system.

## Store readiness gaps

Before app-store distribution, the project needs:

- Production API URL.
- Production auth and password reset.
- Native push providers.
- Privacy policy and data deletion process.
- App icons/splash screens.
- Device QA matrix.
- Crash/error reporting.
- Release signing and store metadata.
- Security review.

## Recommendation

Do not package for public app stores until the production backend, notification delivery, permissions, and QA foundations are stable. A controlled internal office pilot should come first, followed by mobile wrappers.
