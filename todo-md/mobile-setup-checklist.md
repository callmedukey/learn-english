# Mobile App Setup Checklist

Consolidated checklist for IAP and Push Notifications setup.

---

## Status Legend
- [ ] Not started
- [x] Completed

---

## 1. App Configuration (app.json)

| Task | Status |
|------|--------|
| Update `name` from "mobile" to "Reading Champ" | [x] Done |
| Update `slug` from "mobile" to "reading-champ" | [x] Done |
| Update `scheme` from "mobile" to "readingchamp" | [x] Done |
| Add `bundleIdentifier` to iOS config | [ ] Pending |
| Add `package` to Android config | [ ] Pending |
| Add Firebase config paths (`googleServicesFile`) | [ ] Pending |
| Add `expo-notifications` plugin | [x] Done |
| Configure splash screen with brand color (#fcf3e6) | [x] Done |

**Required app.json changes:**
```json
{
  "expo": {
    "name": "Reading Champ",
    "slug": "reading-champ",
    "scheme": "readingchamp",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.readingchamp",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.yourcompany.readingchamp",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-font",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#4F46E5"
        }
      ]
    ]
  }
}
```

---

## 2. Environment Variables

### Firebase (Push Notifications)
```env
# Add to .env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
**Status:** [ ] Not configured

### Apple IAP
```env
APPLE_BUNDLE_ID=com.yourcompany.readingchamp
APPLE_KEY_ID=
APPLE_ISSUER_ID=
APPLE_PRIVATE_KEY=  # Base64-encoded .p8 file
```
**Status:** [ ] Not configured

### Google IAP
```env
GOOGLE_PACKAGE_NAME=com.yourcompany.readingchamp
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# For webhook verification (security fix)
GOOGLE_PUBSUB_VERIFICATION_TOKEN=  # Generate: openssl rand -hex 32
GOOGLE_PUBSUB_SUBSCRIPTION=        # Optional
```
**Status:** [ ] Not configured

---

## 3. Firebase Setup (Push Notifications)

| Task | Status |
|------|--------|
| Create Firebase project | [ ] Pending |
| Enable Cloud Messaging | [ ] Pending |
| Generate service account key | [ ] Pending |
| Add Android app in Firebase | [ ] Pending |
| Download `google-services.json` to `/mobile/` | [ ] Pending |
| Add iOS app in Firebase | [ ] Pending |
| Download `GoogleService-Info.plist` to `/mobile/` | [ ] Pending |
| Upload APNs key (.p8) to Firebase (iOS production) | [ ] Pending |

---

## 4. App Store Connect Setup (Apple IAP)

| Task | Status |
|------|--------|
| Create subscription group "Reading Camp Premium" | [ ] Pending |
| Create product: `reading_camp_1month` | [ ] Pending |
| Create product: `reading_camp_3months` | [ ] Pending |
| Create product: `reading_camp_12months` | [ ] Pending |
| Configure Server Notifications V2 | [ ] Pending |
| Set webhook URL: `https://yourdomain.com/api/webhooks/apple` | [ ] Pending |
| Generate In-App Purchase API key (.p8) | [ ] Pending |
| Note Key ID and Issuer ID | [ ] Pending |
| Create sandbox tester account | [ ] Pending |

---

## 5. Google Play Console Setup (Google IAP)

| Task | Status |
|------|--------|
| Create subscription: `reading_camp_1month` | [ ] Pending |
| Create subscription: `reading_camp_3months` | [ ] Pending |
| Create subscription: `reading_camp_12months` | [ ] Pending |
| Create Cloud Pub/Sub topic | [ ] Pending |
| Configure RTDN with webhook URL | [ ] Pending |
| Create service account with roles | [ ] Pending |
| Link service account to Play Console | [ ] Pending |
| Add license testers | [ ] Pending |

**Webhook URL format (with security token):**
```
https://yourdomain.com/api/webhooks/google?token=YOUR_VERIFICATION_TOKEN
```

---

## 6. Database Migration

```bash
npm run db:generate && npm run db:migrate
```
**Status:** [ ] Pending (required after schema changes)

---

## 7. Mobile Build

| Task | Status |
|------|--------|
| Run `npx expo prebuild` | [ ] Pending |
| Add In-App Purchase capability in Xcode | [ ] Pending |
| Create development build | [ ] Pending |
| Test on physical device | [ ] Pending |

---

## 8. Security Fixes (Code Changes)

These have been applied in this session:

| Fix | Status |
|-----|--------|
| Add `@unique` to transaction IDs in schema | [x] Done |
| Add database indexes for transaction IDs | [x] Done |
| Google webhook signature verification | [x] Done |
| Remove Apple JWS insecure fallback | [x] Done |
| Deep link validation whitelist | [x] Done |
| Network connectivity detection | [x] Done |

---

## 9. Testing Checklist

### iOS Sandbox
- [ ] Sign in with sandbox account
- [ ] Test purchase flow
- [ ] Test restore purchases
- [ ] Test subscription expiration

### Android
- [ ] Upload to internal testing track
- [ ] Test purchase flow
- [ ] Test restore purchases

### Webhooks
- [ ] Test Apple notifications
- [ ] Test Google RTDN notifications
- [ ] Test renewal notifications
- [ ] Test cancellation notifications

### Push Notifications
- [ ] Test on physical device
- [ ] Verify token registration
- [ ] Send test notification from admin panel
- [ ] Test deep link navigation

---

## Quick Start Commands

```bash
# 1. Generate Prisma client and migrate
npm run db:generate && npm run db:migrate

# 2. Prebuild mobile app
cd mobile && npx expo prebuild

# 3. Run on device
npx expo run:ios    # or npx expo run:android

# 4. Or use EAS Build
eas build --profile development --platform ios
```

---

## 10. Asset Files Specification

### Current Assets Status

| File | Required Size | Current Size | Status |
|------|---------------|--------------|--------|
| `icon.png` | 1024x1024 | 1024x1024 | [x] OK |
| `adaptive-icon.png` | 1024x1024 | 1024x1024 | [x] OK |
| `splash-icon.png` | 1024x1024 | 1024x1024 | [x] OK (but see splash screen section) |
| `favicon.png` | 48x48 | 48x48 | [x] OK |
| `notification-icon.png` | 96x96 | - | [ ] Missing |

### Required Assets to Create

#### App Icon (`icon.png`)
- **Size:** 1024x1024 px
- **Format:** PNG (no transparency for iOS)
- **Usage:** App Store, home screen
- **Current:** ✅ Exists (but may be placeholder)

#### Adaptive Icon - Android (`adaptive-icon.png`)
- **Size:** 1024x1024 px (foreground layer)
- **Format:** PNG with transparency
- **Safe zone:** Keep important content within center 66% (676x676 px)
- **Usage:** Android home screen (masked to circle/squircle)
- **Current:** ✅ Exists (but may be placeholder)

#### Notification Icon (`notification-icon.png`)
- **Size:** 96x96 px
- **Format:** PNG
- **Design:** White icon on transparent background (Android uses silhouette)
- **Usage:** Push notification small icon
- **Current:** ❌ Missing - REQUIRED for push notifications

#### Favicon (`favicon.png`)
- **Size:** 48x48 px
- **Format:** PNG
- **Usage:** Web browser tab
- **Current:** ✅ Exists

---

### Splash Screen Assets

Expo supports two splash screen approaches:

#### Option A: Simple Centered Icon (Current Setup)
Uses `splash-icon.png` centered on colored background.

| Setting | Value |
|---------|-------|
| `splash.image` | `./assets/images/splash-icon.png` |
| `splash.resizeMode` | `contain` |
| `splash.backgroundColor` | `#ffffff` (or your brand color) |

**Recommended splash-icon.png specs:**
- **Size:** 1024x1024 px (will be scaled down)
- **Design:** Your logo/icon with padding
- **Background:** Transparent (backgroundColor fills the rest)

#### Option B: Full Splash Image (Recommended for Production)
Create device-specific full-screen images.

**Required files:**
```
/mobile/assets/images/
├── splash.png           # Universal fallback (1284x2778 px)
├── splash-dark.png      # Dark mode version (optional)
```

**Recommended sizes for full splash:**

| Device Type | Size (px) | Aspect Ratio |
|-------------|-----------|--------------|
| iPhone SE | 640x1136 | 9:16 |
| iPhone 8 | 750x1334 | 9:16 |
| iPhone 12/13/14 | 1170x2532 | 9:19.5 |
| iPhone 14 Pro Max | 1290x2796 | 9:19.5 |
| iPhone 15 Pro Max | 1320x2868 | 9:19.5 |
| iPad Pro 12.9" | 2048x2732 | 3:4 |
| Android Phone | 1080x1920 | 9:16 |
| Android Tablet | 1200x1920 | 10:16 |

**Simplified approach:** Create one large image (1284x2778 px) with `resizeMode: "cover"` and keep important content in the center safe zone.

#### app.json Splash Configuration

```json
{
  "expo": {
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#4F46E5"
    },
    "ios": {
      "splash": {
        "image": "./assets/images/splash.png",
        "resizeMode": "cover",
        "backgroundColor": "#4F46E5",
        "dark": {
          "image": "./assets/images/splash-dark.png",
          "backgroundColor": "#1a1a2e"
        }
      }
    },
    "android": {
      "splash": {
        "image": "./assets/images/splash.png",
        "resizeMode": "cover",
        "backgroundColor": "#4F46E5",
        "dark": {
          "image": "./assets/images/splash-dark.png",
          "backgroundColor": "#1a1a2e"
        }
      }
    }
  }
}
```

---

### Asset Checklist

| Asset | Size | Format | Status |
|-------|------|--------|--------|
| `icon.png` | 1024x1024 | PNG, no alpha (iOS) | [x] Done |
| `adaptive-icon.png` | 512x512 | PNG with alpha | [x] Done |
| `splash.png` | 1242x2688 | PNG | [x] Done |
| `splash-dark.png` | 1284x2778 | PNG | [ ] Create (optional) |
| `notification-icon.png` | 96x96 | PNG | [x] Done (see note) |
| `favicon.png` | 48x48 | PNG | [x] Done |

> **Note:** The notification icon should ideally be a white silhouette on transparent background for Android. The current icon may show as a solid square. Consider creating a monochrome version.

---

### Design Tips

1. **App Icon:** Should work at small sizes (29x29 px on iOS). Avoid fine details.

2. **Adaptive Icon:** Android masks icons. Use the [Adaptive Icon Playground](https://adapticon.tooo.io/) to test.

3. **Splash Screen:**
   - Keep logo/text in center 60% (safe zone for all devices)
   - Test on both iPhone SE (small) and iPad Pro (large)
   - Match `backgroundColor` to the edge color of your splash image

4. **Notification Icon (Android):**
   - Must be white silhouette on transparent background
   - Android applies your brand color as background tint
   - iOS uses your app icon automatically

---

## Files to Create/Add

| File | Location | Status |
|------|----------|--------|
| `google-services.json` | `/mobile/` | [ ] Missing (Firebase) |
| `GoogleService-Info.plist` | `/mobile/` | [ ] Missing (Firebase) |
| `notification-icon.png` | `/mobile/assets/images/` | [x] Added |
| `splash.png` | `/mobile/assets/images/` | [x] Added |
| App icons | `/mobile/assets/images/` | [x] Updated |

**Brand Color:** `#fcf3e6` (configured in app.json)
