# Dummy Data for Testing

This directory contains dummy data generators for testing UI components without requiring a populated database.

## Medal Dummy Data (`medal-dummy-data.ts`)

Provides comprehensive dummy data for all medal-related components including:

### Main Functions

- **`getDummyMonthlyRankings(type: "novel" | "rc", grade?: string)`**
  - Returns top 5 rankings for the specified type
  - Optionally filter by grade
  - Includes medal images for top 3 ranks

- **`getDummyUserStats(userId: string)`**
  - Returns complete user statistics including:
    - AR and RC level scores
    - Total scores
    - Ranking percentages
    - Medal counts and history
    - Recent medal achievements

- **`getDummyGlobalWinnersData()`**
  - Returns leaderboard data for all grades
  - Includes gold, silver, and bronze winners
  - Covers both AR and RC levels

- **`getDummyPersonalRankings(userId: string)`**
  - Returns user's personal achievement rankings
  - Includes rank, total participants, and scores
  - Mixed AR and RC achievements

- **`getDummyPopups(userId: string)`**
  - Returns active popup configurations
  - Includes both GLOBAL_WINNERS and PERSONAL_ACHIEVEMENT types

- **`getDummyMonthlyUserStats(userId: string)`**
  - Returns current month's novel and RC scores
  - Used in the monthly stats card

- **`getCompleteDummyData(userId: string)`**
  - Returns all dummy data for a user in one call
  - Useful for comprehensive component testing

### Sample Data Includes

- **21 dummy users** across all grades (Kinder to Adult)
- **8 AR levels** (0.5 to 4.0)
- **6 RC levels** (A1 to C2)
- **Medal images** (placeholder URLs)
- **Country flags** (placeholder URLs)

### Usage Example

```typescript
import { 
  getCompleteDummyData,
  getDummyMonthlyRankings,
  getDummyUserStats 
} from "@/lib/dummy-data";

// Get all data for a user
const allData = getCompleteDummyData("user-1");

// Get specific data
const novelRankings = getDummyMonthlyRankings("novel");
const userStats = getDummyUserStats("user-1");
```

### Demo Page

See `/app/(after-auth)/demo/medal-components/page.tsx` for a complete demo of all medal components using this dummy data.

The demo page includes:
- User selector to test different users
- Toggle for showing/hiding popups
- All medal-related components
- Debug view of current data

### Notes

- All scores are randomly generated within realistic ranges
- Medal counts and achievements are randomized per user
- Popup dates are set to current month for visibility
- Images use placeholder services for consistent testing