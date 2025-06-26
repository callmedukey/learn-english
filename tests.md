# Medals Feature Testing Plan

## Overview
Comprehensive testing plan for the medals feature, focusing on timezone handling, data integrity, and user experience.

## Testing Checklist

### Phase 1: Timezone Testing
- [ ] Create `__tests__/utils/timezone.test.ts`
  - [ ] Test `getCurrentKoreaYearMonth()` at month boundaries
  - [ ] Test `getMonthBoundariesInUTC()` for all 12 months
  - [ ] Verify Korea midnight = new month globally
  - [ ] Test with mocked server timezones (UTC, EST, PST, etc.)
  - [ ] Test daylight saving time transitions

- [ ] Create `__tests__/integration/month-transition.test.ts`
  - [ ] Simulate month transition at 23:59 KST → 00:00 KST
  - [ ] Verify challenge activation/deactivation
  - [ ] Test score cutoff at exact transition time
  - [ ] Verify no scores count after month ends

### Phase 2: Medal Assignment Testing
- [ ] Create `__tests__/medals/assignment.test.ts`
  - [ ] Test top 3 scorer identification
  - [ ] Test tie-breaking scenarios (same scores)
  - [ ] Test with 0, 1, 2, 3+ participants
  - [ ] Verify medal creation in database
  - [ ] Test manual medal assignment override

- [ ] Create `__tests__/medals/leaderboard.test.ts`
  - [ ] Test real-time leaderboard updates
  - [ ] Verify position changes with new scores
  - [ ] Test leaderboard finalization
  - [ ] Test historical leaderboard queries

### Phase 3: Score Tracking Testing
- [ ] Create `__tests__/scores/monthly-scores.test.ts`
  - [ ] Test score increments for challenge content
  - [ ] Verify non-challenge content doesn't count
  - [ ] Test cumulative vs monthly score separation
  - [ ] Test score updates with transactions
  - [ ] Simulate concurrent score submissions

- [ ] Create `__tests__/scores/challenge-validation.test.ts`
  - [ ] Test novel/keyword validation for challenges
  - [ ] Verify only designated content counts
  - [ ] Test with expired challenges
  - [ ] Test with future challenges

### Phase 4: Data Integrity Testing
- [ ] Create `__tests__/database/transactions.test.ts`
  - [ ] Test rollback on partial failures
  - [ ] Test concurrent user submissions
  - [ ] Test race conditions in medal assignment
  - [ ] Verify data consistency after errors

- [ ] Create `__tests__/database/constraints.test.ts`
  - [ ] Test unique constraints (one medal per type per challenge)
  - [ ] Test foreign key relationships
  - [ ] Test cascade deletes
  - [ ] Verify index performance

### Phase 5: Server Actions & Queries Testing
- [ ] Create `__tests__/actions/admin-medals.test.ts`
  - [ ] Test all admin mutations with auth
  - [ ] Test unauthorized access rejection
  - [ ] Test input validation
  - [ ] Test revalidation triggers

- [ ] Create `__tests__/queries/medals-queries.test.ts`
  - [ ] Test all server query functions
  - [ ] Test with various user states
  - [ ] Test error handling
  - [ ] Test query performance

### Phase 6: UI Component Testing
- [ ] Create `__tests__/components/MedalDisplay.test.tsx`
  - [ ] Test medal count display
  - [ ] Test medal images loading
  - [ ] Test empty state
  - [ ] Test loading states

- [ ] Create `__tests__/components/LeaderboardTable.test.tsx`
  - [ ] Test sorting and ranking
  - [ ] Test user highlighting
  - [ ] Test responsive design
  - [ ] Test real-time updates

- [ ] Create `__tests__/components/WinnerPopup.test.tsx`
  - [ ] Test popup timing
  - [ ] Test dismissal behavior
  - [ ] Test content rendering
  - [ ] Test multiple popups queue

### Phase 7: Edge Cases & Error Handling
- [ ] Create `__tests__/edge-cases/medals-edge.test.ts`
  - [ ] Test with deleted users
  - [ ] Test with deleted challenges
  - [ ] Test with malformed data
  - [ ] Test network failures
  - [ ] Test timeout scenarios

### Phase 8: End-to-End Testing
- [ ] Create `e2e/medals-flow.spec.ts` (Playwright/Cypress)
  - [ ] Complete user flow: view challenges → complete questions → earn points → view medals
  - [ ] Admin flow: create challenge → assign medals → create popup
  - [ ] Month transition flow
  - [ ] Multi-user competition simulation

### Phase 9: Performance Testing
- [ ] Create load testing scripts
  - [ ] Test with 1000+ concurrent users
  - [ ] Test leaderboard queries with large datasets
  - [ ] Test medal assignment with many participants
  - [ ] Monitor database query performance

### Phase 10: Manual Testing Checklist
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Test with slow network connections
- [ ] Test with different user roles
- [ ] Test accessibility (screen readers, keyboard navigation)

## Testing Utilities to Create

### 1. Test Helpers (`/tests/helpers/`)
```typescript
// timezone-helpers.ts
export function mockKoreaTime(date: string) {
  jest.setSystemTime(new Date(date));
}

export function mockMonthTransition() {
  // Mock 23:59 → 00:00 transition
}

// medal-helpers.ts
export function createMockChallenge(overrides = {}) {
  return {
    year: 2024,
    month: 1,
    levelType: 'AR',
    // ... defaults
    ...overrides
  };
}
```

### 2. Test Fixtures (`/tests/fixtures/`)
```typescript
// users.ts
export const testUsers = [
  { id: '1', nickname: 'GoldWinner', ... },
  { id: '2', nickname: 'SilverWinner', ... },
  { id: '3', nickname: 'BronzeWinner', ... },
];

// challenges.ts
export const testChallenges = [
  // Various challenge scenarios
];
```

### 3. Test Database Setup
```typescript
// setup-test-db.ts
export async function setupTestDatabase() {
  // Clear test database
  // Seed with test data
  // Return cleanup function
}
```

## CI/CD Integration
- [ ] Add test scripts to package.json
- [ ] Configure GitHub Actions for automated testing
- [ ] Set up test coverage reporting
- [ ] Add pre-commit hooks for tests

## Testing Documentation
- [ ] Document how to run tests locally
- [ ] Document test environment setup
- [ ] Create testing best practices guide
- [ ] Document how to add new tests

## Success Criteria
- [ ] All unit tests pass with >90% coverage
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] No critical bugs in manual testing
- [ ] Performance benchmarks met
- [ ] Timezone logic verified across all scenarios