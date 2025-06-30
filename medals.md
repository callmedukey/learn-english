# Medals Feature Implementation Plan

## Important: Timezone Handling

All medal challenges and monthly rankings operate on **Korean Standard Time (Asia/Seoul)**:
- When Korea enters a new month (e.g., July 1st 00:00 KST), the previous month's rankings end globally
- All users worldwide compete on the same schedule based on Korean time
- Use `date-fns-tz` for consistent timezone handling across the application

**Implementation Pattern:**
```typescript
import { utcToZonedTime } from 'date-fns-tz';

const APP_TIMEZONE = 'Asia/Seoul';

function getCurrentYearMonth() {
  const now = new Date(); // UTC
  const koreaTime = utcToZonedTime(now, APP_TIMEZONE);
  return {
    year: koreaTime.getFullYear(),
    month: koreaTime.getMonth() + 1
  };
}
```

## Implementation Checklist

### Phase 1: Database Schema
- [x] Create `/prisma/schema/medals.prisma` with all medal-related models
- [x] Update `/prisma/schema/auth.prisma` to add medal relations to User model
- [x] Update `/prisma/schema/score.prisma` to add MonthlyARScore and MonthlyRCScore models
- [x] Update `/prisma/schema/novel.prisma` to add challenge relations
- [x] Update `/prisma/schema/rc.prisma` to add challenge relations
- [x] Run `npm run db:generate` to generate Prisma client
- [x] Create and run database migrations

### Phase 2: Server Queries and Actions
- [x] ⚠️ **REFACTOR NEEDED**: Move data fetching functions to server queries
- [x] Create `/server-queries/medals.ts` with:
  - [x] `getUserMedals()` - Fetch user's medals
  - [x] `getCurrentLeaderboard()` - Get current standings ✅ **Timezone fixed**
  - [x] `getActivePopup()` - Get active winner popup
  - [x] `getMedalImages()` - Get medal images for a level
  - [x] `getActiveChallenges()` - Get all active challenges
  - [x] `getHistoricalLeaderboard()` - Get past leaderboards
  - [x] Helper functions: `getCurrentKoreaYearMonth()`, `getMonthBoundariesInUTC()`
- [x] Update `/actions/medals.ts` to remove query functions (removed file)
- [x] Create `/actions/admin/medals.ts` with mutations only:
  - [x] `createMonthlyChallenge()` - Create monthly challenge ✅ **Timezone fixed**
  - [x] `updateChallenge()` - Update challenge details
  - [x] `uploadMedalImages()` - Upload medal images
  - [x] `assignMedals()` - Manually assign medals
  - [x] `createWinnerPopup()` - Create winner announcement
  - [x] `finalizeMonthlyMedals()` - End-of-month medal assignment ✅ **Timezone fixed**
  - [x] `recalculateLeaderboard()` - Recalculate standings
  - [x] `overrideMedalWinner()` - Manual winner override

#### Server Queries and Actions Updates Needed:

1. **Server Query Pattern** for `/server-queries/medals.ts`:
   ```typescript
   import "server-only";
   import { auth } from "@/auth";
   import { prisma } from "@/prisma/prisma-client";
   import { utcToZonedTime } from 'date-fns-tz';
   import { APP_TIMEZONE } from '@/lib/constants/timezone';
   
   export async function getCurrentLeaderboard(levelType: LevelType, levelId: string) {
     // No "use server" directive - this is a server-only query
     const now = new Date();
     const koreaTime = utcToZonedTime(now, APP_TIMEZONE);
     const year = koreaTime.getFullYear();
     const month = koreaTime.getMonth() + 1;
     // ... rest of logic
   }
   ```

2. **finalizeMonthlyMedals()** in `/actions/admin/medals.ts`:
   ```typescript
   // Same timezone conversion needed for year/month calculation
   const now = new Date();
   const koreaTime = utcToZonedTime(now, APP_TIMEZONE);
   const year = koreaTime.getFullYear();
   const month = koreaTime.getMonth() + 1;
   ```

3. **Helper function to add** in a shared utilities file:
   ```typescript
   import { startOfMonth, endOfMonth } from 'date-fns';
   import { zonedTimeToUtc } from 'date-fns-tz';
   
   function getMonthBoundariesInUTC(year: number, month: number) {
     // Create date in Korea timezone
     const koreaDate = new Date(year, month - 1, 1);
     
     // Get start and end of month in Korea time
     const startInKorea = startOfMonth(koreaDate);
     const endInKorea = endOfMonth(koreaDate);
     
     // Convert to UTC for database storage
     return {
       startDate: zonedTimeToUtc(startInKorea, APP_TIMEZONE),
       endDate: zonedTimeToUtc(endInKorea, APP_TIMEZONE)
     };
   }
   ```

### Phase 2.5: Server Actions Timezone Updates
- [x] Install `date-fns-tz`: `npm install date-fns-tz`
- [x] Create `/lib/constants/timezone.ts` with `APP_TIMEZONE = 'Asia/Seoul'`
- [x] Update `getCurrentLeaderboard()` to use Korea timezone for year/month
- [x] Update `finalizeMonthlyMedals()` to use Korea timezone
- [x] Add `getMonthBoundariesInUTC()` helper function for consistent date handling
- [ ] Test timezone conversions with different server times

### Phase 3: Score Tracking Updates
- [x] Update existing score calculation logic to also update monthly scores
- [x] Modify question completion handlers to check if content is part of active challenge
- [x] Add transaction support to ensure both cumulative and monthly scores update atomically

#### Phase 3 Details:

**Current Score Tracking System:**
- Cumulative Scores: ARScore and RCScore tables track total points per level
- Question Completion: Individual question completion records with points awarded

**Timezone Considerations:**
- Install `date-fns-tz`: `npm install date-fns-tz`
- Create a constants file for timezone: `/lib/constants/timezone.ts`
  ```typescript
  export const APP_TIMEZONE = 'Asia/Seoul';
  ```
- All year/month calculations must use Korean time
- When checking active challenges, convert UTC to Korea time first

**Required Modifications:**

1. **Update Score Submission Actions**
   - Files to modify:
     - `/app/(after-auth)/(user)/novel/[arId]/[novelId]/[chapterId]/actions/question.actions.ts`
     - `/app/(after-auth)/(user)/rc/[rcLevelId]/[keywordId]/actions/rc-question.actions.ts`
   
   - Add active challenge checking:
     ```typescript
     import { utcToZonedTime } from 'date-fns-tz';
     import { APP_TIMEZONE } from '@/lib/constants/timezone';
     
     // Check for active monthly challenge
     const now = new Date();
     const koreaTime = utcToZonedTime(now, APP_TIMEZONE);
     const year = koreaTime.getFullYear();
     const month = koreaTime.getMonth() + 1;
     
     const challenge = await prisma.monthlyChallenge.findFirst({
       where: {
         year,
         month,
         levelType: 'AR', // or 'RC'
         levelId: arId, // or rcLevelId
         active: true,
         startDate: { lte: now },
         endDate: { gte: now },
         novelIds: { has: novelId } // or keywordIds: { has: keywordId }
       }
     });
     ```

2. **Monthly Score Updates**
   - If content is part of active challenge, update MonthlyARScore/MonthlyRCScore
   - Use upsert pattern to create or increment scores
   - Link monthly score to challenge ID

3. **Transaction Safety**
   - Wrap all score updates in `prisma.$transaction()`
   - Include: cumulative score, monthly score, and total score
   - Ensure atomicity of all updates

4. **Challenge Content Validation**
   - AR: Verify novel ID is in challenge's novelIds array
   - RC: Verify keyword ID is in challenge's keywordIds array
   - Only count scores from designated content

### Phase 4: Admin Pages
- [x] Create `/app/admin/medals/page.tsx` - Medal management dashboard
- [x] Create `/app/admin/medals/challenges/page.tsx` - Challenge creation/management
- [x] Create `/app/admin/medals/challenges/[id]/page.tsx` - Edit specific challenge
- [x] Create `/app/admin/medals/images/page.tsx` - Medal image upload interface
- [x] Create `/app/admin/medals/winners/page.tsx` - Winner management/override
- [x] Create `/app/admin/medals/popups/page.tsx` - Popup content management

### Phase 4.5: Future Challenge Scheduling
- [x] **Problem**: Future challenges appear in "Past Challenges" and cannot be edited
- [x] **Solution**: Implement proper future challenge handling

#### Schema Updates
- [x] Add `scheduledActive` field to MonthlyChallenge model:
  ```prisma
  model MonthlyChallenge {
    // ... existing fields ...
    scheduledActive Boolean @default(false) // Auto-activate when month arrives
  }
  ```

#### Challenge Display Updates
- [x] Update `/app/admin/medals/challenges/page.tsx`:
  - [x] Add three sections: Past, Current, Future
  - [x] Fix filtering logic to properly categorize by date:
    ```typescript
    const now = getCurrentKoreaYearMonth();
    const pastChallenges = challenges.filter(c => 
      c.year < now.year || (c.year === now.year && c.month < now.month)
    );
    const currentChallenges = challenges.filter(c => 
      c.year === now.year && c.month === now.month
    );
    const futureChallenges = challenges.filter(c => 
      c.year > now.year || (c.year === now.year && c.month > now.month)
    );
    ```
  - [x] Show edit buttons for future challenges
  - [x] Add status indicators (Scheduled, Active, Past)

#### Automatic Activation
- [x] Create `checkAndActivateScheduledChallenges()` function:
  ```typescript
  export async function checkAndActivateScheduledChallenges() {
    const { year, month } = getCurrentKoreaYearMonth();
    
    // Find scheduled challenges for current month
    const toActivate = await prisma.monthlyChallenge.findMany({
      where: {
        year,
        month,
        scheduledActive: true,
        active: false
      }
    });
    
    // Activate them
    if (toActivate.length > 0) {
      await prisma.monthlyChallenge.updateMany({
        where: { id: { in: toActivate.map(c => c.id) } },
        data: { active: true }
      });
    }
    
    return toActivate.length;
  }
  ```
- [x] Call this function on admin page loads
- [ ] Optional: Add manual "Check & Activate" button

#### Benefits
- No gaps between monthly challenges
- Plan challenges months in advance
- Clear visibility of upcoming challenges
- Automatic activation ensures continuity

### Phase 4.6: Past Challenge Details View
- [x] **Problem**: Cannot see what novels/keywords were selected in past challenges
- [x] **Solution**: Add detailed view for historical challenge data

#### Implementation
- [x] Create `ViewChallengeDialog` component:
  - [x] Created `/app/admin/medals/challenges/view-challenge-dialog.tsx`
  - [x] Shows read-only challenge details including:
    - Challenge period and level
    - List of selected novels/keywords with names
    - Participation statistics
    - Medal winners (if awarded)
- [x] Update Past Challenges table:
  - [x] Add "View" action button with eye icon (line 301 in challenges page)
  - [x] Add content count in table (e.g., "5 novels selected")
- [x] Fetch full content details when dialog opens:
  - [x] Created API endpoint `/app/api/admin/medals/challenges/[id]/details/route.ts`
  - [x] Includes novel/keyword names using proper database joins
  - [x] Shows medal winners and participant statistics

#### Benefits
- Historical reference for planning future challenges
- Transparency in past challenge configurations
- Better decision making for content selection

### Phase 4.7: Level Lock System
- [x] **Requirement**: Users can only attempt one AR/RC level per month
- [x] **Feature**: Level change requests with configurable limits

#### New Database Models
- [x] Add to `/prisma/schema/medals.prisma`:
  ```prisma
  model UserLevelLock {
    id        String    @id @default(uuid())
    userId    String
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    
    levelType LevelType // AR or RC
    levelId   String    // References AR.id or RCLevel.id
    
    year      Int
    month     Int       // 1-12
    
    lockedAt  DateTime  @default(now())
    changesUsed Int     @default(0)
    lastChangeAt DateTime?
    
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    
    @@unique([userId, levelType, year, month])
  }
  
  model LevelChangeRequest {
    id        String    @id @default(uuid())
    userId    String
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    
    levelType LevelType
    fromLevelId String
    toLevelId   String
    
    year      Int
    month     Int
    
    reason    String?
    status    ChangeRequestStatus @default(PENDING)
    
    reviewedBy   String?
    reviewer     User?    @relation("ReviewedRequests", fields: [reviewedBy], references: [id])
    reviewedAt   DateTime?
    reviewNote  String?
    
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
  }
  
  enum ChangeRequestStatus {
    PENDING
    APPROVED
    REJECTED
    AUTO_APPROVED
  }
  
  model SystemConfig {
    id        String    @id @default(uuid())
    key       String    @unique
    value     String    // JSON stringified value
    
    description String?
    updatedBy   String?
    
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
  }
  ```

#### Level Lock Implementation
- [x] Create `/server-queries/level-locks.ts`:
  - [x] `getUserLevelLock()` - Get user's current level lock
  - [x] `checkLevelLockPermission()` - Verify if action is allowed
  - [x] `getLevelChangeRequests()` - Admin view of requests
  - [x] Additional helper functions for system config and change requests
  
- [x] Create `/actions/level-locks.ts`:
  - [x] `createUserLevelLock()` - Create level lock when user first scores
  - [x] `requestLevelChange()` - Submit change request
  - [x] `approveLevelChange()` - Admin approval
  - [x] `rejectLevelChange()` - Admin rejection
  - [x] `updateSystemConfig()` - Update system settings
  
- [x] Update score submission actions:
  ```typescript
  // Before allowing score submission
  const lockCheck = await checkUserLevelLock(userId, levelType, levelId);
  if (!lockCheck.allowed) {
    throw new Error(`You are locked to level ${lockCheck.currentLevel} for this month`);
  }
  if (lockCheck.shouldCreateLock) {
    await createUserLevelLock(userId, levelType, levelId, year, month);
  }
  ```

#### Challenge Confirmation Implementation
- [x] Create `/actions/challenge-confirmation.ts`:
  - [x] `confirmChallengeParticipation()` - Creates level lock when user joins challenge
  - [x] `getUserLevelLockStatus()` - Helper to check user's current lock status
  - [x] Proper error handling with specific error codes
  - [x] Timezone-aware date handling using Korean time
  ```typescript
  export async function confirmChallengeParticipation(
    levelType: LevelType,
    levelId: string
  ) {
    const session = await auth();
    const { year, month } = getCurrentKoreaYearMonth();
    
    // Check existing lock
    const existingLock = await getUserLevelLock(session.user.id, levelType);
    
    if (existingLock) {
      if (existingLock.levelId === levelId) {
        return { success: true, alreadyConfirmed: true };
      }
      return { 
        success: false, 
        error: "locked_to_different_level",
        currentLevel: existingLock.levelId 
      };
    }
    
    // Create new lock
    await createUserLevelLock(session.user.id, levelType, levelId);
    return { success: true, newLock: true };
  }
  ```

- [x] Level Change Request Updates:
  - [x] Removed reason parameter from `requestLevelChange` (made optional)
  - [x] Always set status to "PENDING" (removed auto-approval)
  - [x] Added score reset logic to `approveLevelChange`
  - [x] Created `cancelLevelChangeRequest()` - Allows users to cancel pending requests
  - [x] Fixed all import issues (toZonedTime instead of utcToZonedTime)
    ```typescript
    // Reset monthly scores when approving level change
    if (request.levelType === "AR") {
      await tx.monthlyARScore.deleteMany({
        where: {
          userId: request.userId,
          year: request.year,
          month: request.month,
          ARId: request.fromLevelId
        }
      });
    } else {
      await tx.monthlyRCScore.deleteMany({
        where: {
          userId: request.userId,
          year: request.year,
          month: request.month,
          RCLevelId: request.fromLevelId
        }
      });
    }
    ```

#### Configuration
- [x] Add system config entries:
  - [x] `medal.levelChangesPerMonth`: Default 1
  - [x] `medal.requireApprovalForLevelChange`: Default false
  - [x] Created `/actions/admin/system-config.ts` with initialization function
- [ ] Create admin UI for config management (not implemented yet)

#### User Interface Updates
- [x] Challenge confirmation buttons:
  - [x] Created `/app/(after-auth)/(user)/novel/[arId]/components/challenge-confirmation-button.tsx`
  - [x] Created `/app/(after-auth)/(user)/rc/[rcLevelId]/components/rc-challenge-confirmation-button.tsx`
  - [x] Connected to level lock system - buttons create level locks when confirmed
  - [x] Show different states based on user's level lock status:
    - "Join Monthly Challenge" - no lock exists
    - "Challenge Joined ✓" - locked to current level
    - "Level Change Pending" - has pending request (clickable to cancel)
    - "Request Level Change" - locked to different level
  - [x] Level change request dialog with score reset warning
  - [x] Cancel pending request functionality
  - [x] All feedback via dialogs (no toasts)
  - [x] Always visible even when no active challenge
  
- [ ] User dashboard:
  - [ ] Show current locked level prominently
  - [ ] Display changes remaining (1 per month)
  - [ ] Show pending level change requests
  
- [x] Level selection pages:
  - [x] "Join Monthly Challenge" button when no lock exists
  - [x] "Challenge Joined ✓" when locked to current level  
  - [x] "Request Level Change" when locked to different level
  - [x] "Level Change Pending" when request awaiting approval
  - [x] Fetch and pass user's level lock and pending requests
  - [x] Handle both active and inactive challenge states

- [x] Visual indicators for user's selected level:
  - [x] Add primary color ring around AR/RC level cards when user has selected that level
  - [x] Different from amber challenge ring to avoid confusion
  - [x] "Your Selected Level" badge on level cards with primary color theme
  - [x] Fetch user level lock data in level listing pages
  - [x] Update ARCard and RCLevelCard components with new prop

#### Admin Features
- [x] Level change request management page (`/app/admin/medals/level-changes/page.tsx`)
  - [x] Table with pending/approved/rejected requests
  - [x] Approve/Reject actions with confirmation dialogs
  - [x] Success/error feedback via dialogs (not toasts)
  - [x] Auto-resets monthly scores on approval
  - [x] Added to admin sidebar navigation with RefreshCw icon
  - [x] Summary cards showing counts by status
  - [x] Proper Korean timezone formatting for dates
- [ ] View all user level locks
- [ ] System config management (future enhancement)

#### Benefits
- Prevents level-hopping for easy medals
- Maintains competitive integrity
- Flexible configuration per institution needs
- Clear audit trail for changes

### Phase 4.8: Challenge Confirmation & Level Lock UI
- [x] **Completed**: Full implementation of user-facing level lock system
- [x] Challenge confirmation buttons that create level locks
- [x] Level change request system with admin approval
- [x] Cancel pending request functionality
- [x] All user feedback via dialogs (no toasts)
- [x] Admin interface for managing level change requests

### Phase 5: Dashboard Integration
- [x] **Note**: Medals will be integrated directly into the existing dashboard, not separate pages

#### Monthly Leaderboard Section
- [x] Create `/components/leaderboard/monthly-leaderboard.tsx`:
  - [x] Copy structure from existing leaderboard component
  - [x] Query MonthlyARScore/MonthlyRCScore tables
  - [x] Show current month rankings only
  - [x] Add medal images for top 3 positions (placeholder implemented, actual images need MedalImage uploads)
- [x] Update `/app/(after-auth)/(user)/dashboard/page.tsx`:
  ```tsx
  <div className="py-16">
    <MonthlyLeaderboard userId={session.user.id} userGrade={userGrade} />
    <Leaderboard userId={session.user.id} userGrade={userGrade} /> // Now "All-Time"
    <ContinueLearning userId={session.user.id} />
  </div>
  ```

#### All-Time Leaderboard Updates
- [x] Update `/components/leaderboard/leaderboard.tsx`:
  - [x] Change title from "Leaderboard" to "All-Time Leaderboard"
  - [x] Keep existing functionality unchanged

#### User Stats Medal Display
- [x] Update `/components/leaderboard/user-stats.tsx`:
  - [x] Add medals section after total score
  - [x] Display format: Using MedalDisplayWithDialog component
  - [x] Create query to fetch user's total medal counts
  - [x] Show "No medals earned yet" message when user has no medals
- [x] Implementation:
  ```tsx
  // After Total Stats section
  <div className="mt-4 space-y-2">
    <div className="text-lg font-bold text-primary">
      MEDALS {userMedals.length > 0 ? `(${medalCounts.totalGold + medalCounts.totalSilver + medalCounts.totalBronze})` : '(0)'}
    </div>
    {userMedals.length > 0 ? (
      <MedalDisplayWithDialog 
        medals={userMedals} 
        userId={userId}
        maxDisplay={6} 
      />
    ) : (
      <div className="text-center">
        <p className="text-sm text-gray-500">No medals earned yet</p>
        <p className="mt-1 text-xs text-gray-400">Compete in monthly challenges to earn medals!</p>
      </div>
    )}
  </div>
  ```

#### User Stats Popover Enhancements
- [x] Update `/components/leaderboard/user-stats-content.tsx`:
  - [x] Add medals section to detailed breakdown
  - [x] Show medals by level type (AR/RC)
  - [x] Include medalsByLevel display

#### Medal Display Components
- [x] Create `/components/medals/medal-count.tsx`:
  - [x] Shows medal count with styling
  - [x] Integrated into medal display components
- [x] Medal display components already exist:
  - [x] `/components/medals/medal-display-with-dialog.tsx`
  - [x] `/components/medals/medal-history-dialog.tsx`
  - [x] `/components/medals/medal-level-display.tsx`
  - [x] `/components/medals/medal-row-display.tsx`

#### Server Queries
- [x] Create `/server-queries/monthly-leaderboard.ts`:
  - [x] `getMonthlyLeaderboard()` - Get current month rankings by level
  - [x] `getUserMonthlyStats()` - Get user's monthly performance
  - [x] `getMonthlyLeaderboardByGrade()` - Get monthly rankings by grade
  - [x] `getMonthlyOverallLeaderboard()` - Get overall monthly rankings
- [x] Create monthly ranking query files:
  - [x] `/components/leaderboard/queries/monthly-grade-ranking.query.ts`
  - [x] `/components/leaderboard/queries/monthly-user-ranking.query.ts`
- [x] Update user stats to include medal data:
  - [x] Already fetching medal counts and display data

### Phase 6: UI Components ✅
**Status: Complete**
- [x] Create medal display components - Show user's medal summary
  - [x] `/components/medals/medal-count.tsx` - Shows medal counts with styling
  - [x] `/components/medals/medal-display-with-dialog.tsx` - Displays medals with dialog
  - [x] `/components/medals/medal-history-dialog.tsx` - Shows medal history in dialog
  - [x] `/components/medals/medal-level-display.tsx` - Display medals by level
  - [x] `/components/medals/medal-level-display-with-dialog.tsx` - Level display with dialog
  - [x] `/components/medals/medal-row-display.tsx` - Row display for medals
- [x] Integrated medal displays into dashboard and user stats
- [x] Create monthly winner announcement popups:
  - [x] `/components/medals/global-winners-popup.tsx` - Shows top 3 winners for ALL grades on one page
  - [x] `/components/medals/personal-achievement-popup.tsx` - Shows user's own ranking in their selected levels (certificate-style)
  - [x] `/components/medals/winner-popup-container.tsx` - Container that manages which popups to show
  - [x] Update `MonthlyPopup` model to support different popup types (GLOBAL_WINNERS, PERSONAL_ACHIEVEMENT)
  - [x] Added `UserPopupDismissal` model to track which users have dismissed popups
  - [x] Create `getUserMonthlyRankings()` query for personal rankings
  - [x] Create `getGlobalWinnersData()` query for global winners data
  - [x] Create `/actions/popup-dismissal.ts` for dismissing popups
  - [x] Integrated popup container into dashboard page
  - [x] Created seed script (`/prisma/seed-popups.ts`) for testing popups with dummy data

### Phase 7: Background Jobs ✅ **COMPLETED**
- [x] Create `/lib/jobs/medal-assignment.ts` - End-of-month medal assignment logic
  - [x] `runMedalAssignmentJob()` - Main job orchestration
  - [x] `finalizeEndedChallenges()` - Award medals for ended challenges
  - [x] `createMonthlyWinnerPopups()` - Create winner announcement popups
  - [x] `activateScheduledChallenges()` - Activate challenges for new month
  - [x] `unlockPreviousMonthLevels()` - Clear user level locks from previous month
  - [x] Comprehensive logging and error handling
- [x] Create PM2 ecosystem configuration for running app + cron together
  - [x] `ecosystem.config.js` - PM2 configuration file
  - [x] Cron runs daily at midnight Korean time
  - [x] Both processes managed together (start/stop/restart)
- [x] Create `/scripts/medal-cron.ts` - Cron script wrapper
  - [x] Imports and runs medal assignment job
  - [x] Handles database connection lifecycle
  - [x] Clean exit for cron compatibility
- [x] Update package.json scripts
  - [x] Modified `start` script to use PM2 ecosystem
  - [x] Added `stop`, `restart`, and `medal-job` scripts
  - [x] Manual testing via `npm run medal-job`

#### Testing the Medal Job
```bash
# Test the job manually
npm run medal-job

# Start both app and cron (production mode)
npm run start

# View logs
npm run logs

# Check status
npm run status

# Stop everything
npm run stop
```

**Note**: The cron job runs daily at midnight Korean time. It will:
1. Finalize any ended challenges and award medals
2. Create winner popups for the previous month
3. Activate any scheduled challenges for the current month
4. Unlock all user level locks from the previous month

### Phase 8: Integration & Testing ✅ **COMPLETED**
- [x] Update user profile to display medal counts (integrated in user stats)
- [x] Add medal badges to leaderboard entries (medals shown in dashboard)
- [x] Test monthly challenge creation flow
- [x] Test score tracking with active challenges
- [x] Test medal assignment process
- [x] Test winner popup display
- [x] Verify data integrity with concurrent updates

### Phase 9: Performance Optimization ✅ **COMPLETED**
- [x] Add database indexes for monthly score queries
  - [x] MonthlyARScore: Composite index on (ARId, year, month, score)
  - [x] MonthlyRCScore: Composite index on (RCLevelId, year, month, score)
  - [x] Medal: Composite index on (userId, medalType)
  - [x] MonthlyLeaderboard: Index on (year, month, finalized)
  - [x] MonthlyChallenge: Index on (year, month, active)

### Phase 10: Documentation & Deployment
- [ ] Update README with medal feature documentation
- [ ] Create admin guide for medal management
- [ ] Add medal-related environment variables if needed
- [ ] Deploy and monitor initial rollout

### Phase 11: Bug Fixes & Improvements ✅ **COMPLETED**
- [x] **Fixed Monthly Score Tracking** - Only award monthly scores to users who have locked in
  - [x] Updated `completeQuestionAction` in Novel quiz to check `!lockCheck.shouldCreateLock`
  - [x] Updated `submitRCAnswer` in RC quiz to check `!lockCheck.shouldCreateLock`
  - [x] Ensures users must click "Join Monthly Challenge" before earning monthly points
- [x] **Added Monthly Level Lock Reset** - Unlock all user levels at month transition
  - [x] Created `getPreviousKoreaYearMonth()` helper function
  - [x] Added `unlockPreviousMonthLevels()` to medal assignment job
  - [x] Automatically clears previous month's locks when new month begins
  - [x] Allows users to select new levels for new month's challenges

## Architecture Guidelines

### Server Components Pattern
- **Server Queries** (`/server-queries/*.ts`): Data fetching functions marked with `import "server-only"`
  - Used directly in Server Components
  - No `"use server"` directive
  - Return data for rendering
  
- **Server Actions** (`/actions/*.ts`): Mutation functions marked with `"use server"`  
  - Used for form submissions and data mutations
  - Called from Client Components
  - Trigger revalidation

### File Organization
```
/server-queries/
  medals.ts         # Data fetching (getUserMedals, getLeaderboard, etc.)
/actions/
  admin/
    medals.ts       # Admin mutations (createChallenge, assignMedals, etc.)
```

## Overview
The medals feature rewards top performers in AR (Accelerated Reader) and RC (Reading Comprehension) challenges each month. Users compete for Gold, Silver, and Bronze medals based on their scores in designated novels and keywords.

## Database Schema

### New Models

#### 1. Medal
Tracks individual medals earned by users.
```prisma
model Medal {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  medalType MedalType // Gold, Silver, Bronze
  levelType LevelType // AR, RC
  levelId   String    // References AR.id or RCLevel.id
  
  year      Int
  month     Int       // 1-12
  score     Int       // Score achieved to earn this medal
  
  challengeId String?
  challenge   MonthlyChallenge? @relation(fields: [challengeId], references: [id])
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum MedalType {
  GOLD
  SILVER
  BRONZE
}

enum LevelType {
  AR
  RC
}
```

#### 2. MedalImage
Stores medal image paths for each AR/RC level.
```prisma
model MedalImage {
  id        String    @id @default(uuid())
  
  levelType LevelType
  levelId   String    // References AR.id or RCLevel.id
  medalType MedalType
  
  imageUrl  String    // Path to uploaded medal image
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@unique([levelType, levelId, medalType])
}
```

#### 3. MonthlyChallenge
Defines which novels/keywords are part of each month's challenge.
```prisma
model MonthlyChallenge {
  id        String    @id @default(uuid())
  
  year      Int
  month     Int       // 1-12
  levelType LevelType
  levelId   String    // References AR.id or RCLevel.id
  
  // For AR challenges
  novelIds  String[]  // Array of Novel.id
  
  // For RC challenges
  keywordIds String[] // Array of RCKeyword.id
  
  active    Boolean   @default(true)
  startDate DateTime
  endDate   DateTime
  
  medals    Medal[]
  leaderboard MonthlyLeaderboard?
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@unique([year, month, levelType, levelId])
}
```

#### 4. MonthlyLeaderboard
Stores the top 3 winners for each monthly challenge.
```prisma
model MonthlyLeaderboard {
  id        String    @id @default(uuid())
  
  year      Int
  month     Int
  levelType LevelType
  levelId   String
  
  challengeId    String           @unique
  challenge      MonthlyChallenge @relation(fields: [challengeId], references: [id])
  
  goldUserId     String?
  goldUser       User?   @relation("GoldMedals", fields: [goldUserId], references: [id])
  goldScore      Int?
  
  silverUserId   String?
  silverUser     User?   @relation("SilverMedals", fields: [silverUserId], references: [id])
  silverScore    Int?
  
  bronzeUserId   String?
  bronzeUser     User?   @relation("BronzeMedals", fields: [bronzeUserId], references: [id])
  bronzeScore    Int?
  
  finalized      Boolean @default(false) // Whether medals have been awarded
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

#### 5. MonthlyPopup
Content for winner announcement popups. Supports two types:
- **GLOBAL_WINNERS**: Shows top 3 winners for all grades
- **PERSONAL_ACHIEVEMENT**: Shows user's personal ranking in their selected levels

```prisma
model MonthlyPopup {
  id           String    @id @default(uuid())
  
  year         Int
  month        Int
  type         PopupType @default(GLOBAL_WINNERS)
  title        String
  content      String    // Rich text/HTML content
  
  active       Boolean   @default(true)
  displayFrom  DateTime  // When to start showing
  displayUntil DateTime  // When to stop showing
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum PopupType {
  GLOBAL_WINNERS      // Shows all grade winners
  PERSONAL_ACHIEVEMENT // Shows user's personal rankings
}
```

### Updates to Existing Models

#### User Model (auth.prisma)
```prisma
model User {
  // ... existing fields ...
  
  medals Medal[]
  
  // Leaderboard relations
  goldMedals   MonthlyLeaderboard[] @relation("GoldMedals")
  silverMedals MonthlyLeaderboard[] @relation("SilverMedals")
  bronzeMedals MonthlyLeaderboard[] @relation("BronzeMedals")
}
```

#### Score Models (score.prisma)
Add monthly score tracking:
```prisma
model MonthlyARScore {
  id        String @id @default(uuid())
  
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  ARId      String
  AR        AR     @relation(fields: [ARId], references: [id], onDelete: Cascade)
  
  year      Int
  month     Int
  score     Int    @default(0)
  
  challengeId String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, ARId, year, month])
}

model MonthlyRCScore {
  id        String @id @default(uuid())
  
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  RCLevelId String
  RCLevel   RCLevel @relation(fields: [RCLevelId], references: [id], onDelete: Cascade)
  
  year      Int
  month     Int
  score     Int    @default(0)
  
  challengeId String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, RCLevelId, year, month])
}
```

## Implementation Flow

### 1. Monthly Challenge Setup (Admin)
1. Admin creates a new monthly challenge for each AR/RC level
2. Selects specific novels (for AR) or keywords (for RC) to include
3. Sets start and end dates (typically 1st to last day of month)
4. Uploads medal images if not already present

### 2. User Participation
1. Users complete questions for designated novels/keywords
2. Scores are tracked in both cumulative and monthly tables
3. Only scores from challenge-designated content count toward medals

### 3. Score Calculation
- When a user completes a question:
  - Update regular ARScore/RCScore (cumulative)
  - Update MonthlyARScore/MonthlyRCScore for current month
  - Only count if the novel/keyword is part of active challenge

### 4. Medal Assignment (End of Month)
1. Scheduled job runs on last day of month
2. For each active challenge:
   - Query top 3 scorers from MonthlyARScore/MonthlyRCScore
   - Create Medal records for Gold, Silver, Bronze
   - Update MonthlyLeaderboard with winners
   - Mark leaderboard as finalized

### 5. Winner Announcement
Two types of popups are shown to users:

#### Popup 1 - Global Winners (전체 이용자 공지)
- Shows last month's monthly ranking results
- Displays 1st/2nd/3rd place winners for ALL grades on one page
- Shown to all users when they log in

#### Popup 2 - Personal Achievement (개인 성과 상장)
- Shows user's own ranking in their selected AR and RC levels
- Certificate-style design
- Messages:
  - **NOVEL**: "Congratulations! You have achieved [rank] place in (AR 2 NOVEL) for [grade] grade for July 2025."
  - **RC**: "Congratulations! You have achieved [rank] place in (Beginner Reading Comprehension) for [grade] grade for July 2025."
- Only shown if user participated in that month's challenge

### 6. Medal Display
- User profile shows:
  - Total medals by type (Gold: X, Silver: Y, Bronze: Z)
  - Medal history grid (Year/Month breakdown)
  - Medal images for each level achieved
- Leaderboard page shows current month standings

## Server Components & Actions

### Server Components (Data Fetching)
Located in respective page components:
- `app/(after-auth)/medals/page.tsx` - Fetch user's medal collection
- `app/(after-auth)/leaderboard/page.tsx` - Current month standings
- `app/(after-auth)/leaderboard/[year]/[month]/page.tsx` - Historical leaderboard
- `app/(after-auth)/challenges/page.tsx` - Display active challenges

### Server Actions
Located in `/actions/medals.ts`:
- `createMonthlyChallenge()` - Create monthly challenge
- `updateChallenge()` - Update challenge details
- `uploadMedalImages()` - Upload medal images
- `assignMedals()` - Manually assign medals (admin)
- `createWinnerPopup()` - Create winner announcement

Located in `/actions/admin/medals.ts`:
- `finalizeMonthlyMedals()` - End-of-month medal assignment
- `recalculateLeaderboard()` - Recalculate standings
- `overrideMedalWinner()` - Manual winner override

## UI Components

### 1. MedalDisplay
Shows user's medal collection with:
- Summary counts (Gold/Silver/Bronze)
- Hover to see which level and when earned
- Click to view detailed history

### 2. MedalHistory
Table/grid showing:
- Year and month
- Level (AR1, RC2, etc.)
- Medal type
- Score achieved

### 3. MonthlyLeaderboard
Real-time standings showing:
- Top 10 users for each level
- Current scores
- Days remaining in challenge

### 4. Winner Popups
Two types of modals for monthly announcements:

#### GlobalWinnersPopup
- Displays all grade winners in a grid layout
- Shows Gold, Silver, Bronze winners for each grade
- Includes winner nicknames and scores
- Celebration animation/effects

#### PersonalAchievementPopup  
- Certificate-style design
- Shows user's personal ranking in their selected levels
- Displays achievement messages for both AR and RC
- Professional/formal styling to feel like an award certificate

## Technical Considerations

### Performance
- Index monthly score tables on (userId, levelId, year, month)
- Cache current month leaderboards in Redis
- Batch score updates to reduce DB writes

### Data Integrity
- Use transactions when assigning medals
- Prevent duplicate medals for same challenge
- Validate challenge dates don't overlap

### Security
- Only admins can create challenges and assign medals
- Validate user scores before medal assignment
- Audit log for manual medal assignments

## Future Enhancements
1. Special event medals (holidays, milestones)
2. Medal trading/gifting between users
3. Medal-based rewards (unlock features, discounts)
4. Team challenges with group medals
5. Medal achievements (collect all golds, etc.)