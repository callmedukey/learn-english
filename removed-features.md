# Removed Features Documentation

This document tracks features that have been removed from the Reading Camp application to maintain clarity about architectural decisions.

## Medal System Manual Controls (Removed on 2025-06-25)

### What was removed

The following manual admin controls were removed from the medal system:

1. **Manual Medal Assignment** (`/admin/medals/winners/`)
   - Admin page for manually assigning gold, silver, and bronze medals
   - `assignMedals()` server action that allowed overriding automatic medal assignment
   - UI components for selecting winners manually

2. **Manual Winner Popup Creation** (`/admin/medals/popups/`)
   - Admin page for creating custom winner announcement popups
   - `createWinnerPopup()` server action for manual popup creation
   - UI forms for customizing popup content and display times

3. **Manual Medal Finalization** 
   - `finalizeMonthlyMedals()` server action for manually triggering end-of-month processing
   - Button in admin panel to manually finalize medals for a month

4. **Manual Leaderboard Recalculation**
   - `recalculateLeaderboard()` server action for manually recalculating standings
   - Admin controls for recalculating scores and rankings

5. **Manual Winner Override**
   - `overrideMedalWinner()` server action for changing medal recipients after assignment
   - UI for overriding specific medal positions (gold/silver/bronze)

### Why these features were removed

All of these manual controls are redundant because the medal system is fully automated:

1. **Automatic Medal Assignment**: The `runMedalAssignmentJob()` function runs daily at midnight Korean time and automatically:
   - Finds challenges that have ended
   - Calculates the top 3 scorers based on actual performance data
   - Assigns medals accordingly
   - Creates leaderboard records

2. **Automatic Popup Creation**: The same job automatically creates winner popups:
   - Global winner announcements showing all grade winners
   - Personal achievement popups for individual users
   - Popups are set to display for 7 days at the start of each month

3. **Fair and Transparent System**: By removing manual controls:
   - The system ensures fairness - medals are always based on actual scores
   - Reduces potential for human error or bias
   - Simplifies the codebase and reduces maintenance burden
   - Prevents accidental or intentional manipulation of results

### What remains

The admin panel still retains essential medal management features:

1. **Monthly Challenge Management** (`/admin/medals/challenges/`)
   - Create and configure monthly challenges
   - Set which novels/keywords are included in challenges
   - Schedule future challenges with auto-activation

2. **Medal Image Management** (`/admin/medals/images/`)
   - Upload custom medal images for each level
   - Manage gold, silver, and bronze medal designs
   - Essential for visual customization

### Migration notes

No data migration is required. The automated job system (`medal-cron`) will continue to handle all medal assignments and popup creation automatically. Any medals or popups created manually before this change will remain in the database and function normally.

## Admin Panel Rename: Medals → Challenges (2025-06-25)

### What was changed

The admin panel section previously called "Medals" has been renamed to "Challenges" to better reflect its actual purpose.

### Changes made:
1. **Directory rename**: `/app/admin/medals/` → `/app/admin/challenges/`
2. **API route rename**: `/app/api/admin/medals/` → `/app/api/admin/challenges/`
3. **Navigation update**: Admin sidebar now shows "Challenges" instead of "Medals"
4. **Page title update**: "Medal Management" → "Challenge Management"
5. **URL updates**: All references to `/admin/medals` updated to `/admin/challenges`

### Why this change was made

After removing the manual winner and popup management features, the admin panel's primary function is to manage monthly challenges and medal images. The name "Challenges" more accurately describes what admins are actually managing - the monthly competition setup, not the medal assignment itself (which is automated).

This naming is clearer because:
- Admins create and manage challenges, not medals
- Medals are automatically awarded based on challenge results
- The section focuses on challenge configuration and medal image uploads