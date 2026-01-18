# Critical Reminders for App Store Submissions

## Android Keystore Backup

**CRITICAL: Losing your keystore means you cannot update your app!**

### Keystore Location
```
mobile/android/app/reading-champ-release.keystore
```

### Backup Instructions
1. Store the keystore file in a secure location (password manager, encrypted drive)
2. Document the following credentials separately in a secure password manager:
   - **Store Password**: [Your keystore password]
   - **Key Alias**: `reading-champ`
   - **Key Password**: [Your key password]

### Never Do These:
- Never commit the keystore to git (already in `.gitignore`)
- Never share the keystore or passwords publicly
- Never lose the only copy - always have backups!

---

## Version Bumping

### When to Bump Versions
Every time you submit a new build to the stores, you must increment versions:

| Field | Where | When to Change |
|-------|-------|----------------|
| `version` | `app.json` | User-visible version (1.0.0 → 1.1.0) |
| `ios.buildNumber` | `app.json` | Every iOS build submission |
| `android.versionCode` | `app.json` | Every Android build submission |

### Version Bump Workflow
```bash
# 1. Update version in app.json
# 2. Regenerate native projects
cd mobile
npx expo prebuild --clean

# 3. Build and submit
```

### Example Version Progression
| Release | version | buildNumber | versionCode |
|---------|---------|-------------|-------------|
| Initial | 1.0.0 | 1 | 1 |
| Bug fix | 1.0.1 | 2 | 2 |
| Feature | 1.1.0 | 3 | 3 |
| Major | 2.0.0 | 4 | 4 |

---

## APNs Key Information

### Development Key
- **File**: `mobile/apple-apn-dev-key.p8`
- **Key ID**: Check Apple Developer Portal
- **Purpose**: Push notifications in sandbox/development

### Production Key
- **File**: `mobile/apple-apn-main-key.p8`
- **Key ID**: Check Apple Developer Portal
- **Purpose**: Push notifications in production

### Notes:
- Both `.p8` files are gitignored for security
- Keys are stored in Apple Developer Portal → Keys
- Can be regenerated if lost (but requires updating server config)

---

## Firebase Configuration (Push Notifications)

### Required Files
| File | Location | Source |
|------|----------|--------|
| `GoogleService-Info.plist` | `mobile/` | Firebase Console (iOS app) |
| `google-services.json` | `mobile/` | Firebase Console (Android app) |

### Setup Steps (One-time)
1. Create Firebase project at https://console.firebase.google.com/
2. Add iOS app (Bundle ID: `com.reading-champ`)
3. Add Android app (Package: `com.readingchamp_android`)
4. Download config files to `mobile/` directory
5. Upload APNs key (`.p8`) to Firebase for iOS push

### Server Environment Variables
```env
FIREBASE_PROJECT_ID=reading-champ-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@reading-champ-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Notes:
- Config files are gitignored (contain project credentials)
- Service account key for server must be generated from Firebase Console → Project Settings → Service accounts
- APNs key upload is required for iOS push notifications to work
- After adding config files, run `npx expo prebuild --clean`

---

## Prebuild Regeneration

### When to Run `npx expo prebuild --clean`
Run this command after ANY of these changes:
- Modifying `app.json` (versions, bundle ID, permissions, etc.)
- Adding/removing Expo plugins
- Changing native configurations
- Updating Expo SDK version

### Prebuild Command
```bash
cd mobile
npx expo prebuild --clean
```

### What It Does:
1. Deletes existing `ios/` and `android/` folders
2. Regenerates native projects from `app.json` config
3. Applies all Expo plugin configurations

### Warning:
Any manual changes to `ios/` or `android/` folders will be lost after prebuild!
If you need persistent native changes, use Expo config plugins instead.

---

## Store Submission Checklist

### Before Every Submission

#### Code & Build
- [ ] All features tested on real devices
- [ ] No console.log or debug code in production
- [ ] API URL points to production (`https://reading-champ.com`)
- [ ] Version numbers incremented in `app.json`
- [ ] Run `npx expo prebuild --clean`

#### iOS Specific
- [ ] Test on iOS simulator
- [ ] Archive builds successfully in Xcode
- [ ] Signing configured correctly (automatic or manual)
- [ ] All required capabilities enabled (In-App Purchase, Push Notifications)

#### Android Specific
- [ ] Test on Android emulator
- [ ] Keystore file exists and credentials are correct
- [ ] `./gradlew bundleRelease` completes without errors
- [ ] AAB file generated successfully

### Store Listings
- [ ] App name, description, and keywords updated
- [ ] Screenshots reflect current UI
- [ ] Privacy policy URL is live and accessible
- [ ] Support URL/email is valid
- [ ] Age rating questionnaire completed

### Post-Submission
- [ ] Monitor for review feedback
- [ ] iOS: Check App Store Connect for status updates
- [ ] Android: Check Play Console for status updates

---

## Review Timeline Expectations

| Platform | First Submission | Updates |
|----------|------------------|---------|
| iOS | 1-7 days | 1-3 days |
| Android | 1-7 days | 1-3 days |

### Tips for Faster Review:
- Complete all store listing metadata before submitting
- Include clear app preview/demo video
- Respond to reviewer questions promptly
- Avoid obvious policy violations

---

## Configuration Files Reference

| File | Purpose | Committed? |
|------|---------|------------|
| `app.json` | Expo/React Native config | Yes |
| `.env` | Environment variables | Yes (no secrets!) |
| `*.keystore` | Android signing | NO |
| `*.p8` | Apple push notification keys | NO |
| `google-services.json` | Firebase Android config | NO |
| `GoogleService-Info.plist` | Firebase iOS config | NO |
| `ios/` | Generated iOS project | NO |
| `android/` | Generated Android project | NO |

---

## Emergency Contacts

### Apple Developer Support
- https://developer.apple.com/contact/

### Google Play Console Support
- https://support.google.com/googleplay/android-developer/

### Expo Support
- https://expo.dev/contact
- Discord: https://discord.gg/expo
