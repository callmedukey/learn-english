# Subscription Display Update

## Issue
The "Already Subscribed!" message was being shown for all users with active subscriptions, regardless of whether they had auto-renewal or not. This was confusing for Korean users with recurring payments.

## Solution
Updated the profile page to show different messages based on:
1. User country (Korean vs International)
2. Auto-renewal status (recurring vs one-time)

## Changes Made

### For Korean Users with Auto-Renewal
- Title: "자동 갱신 구독 중" (Auto-renewal subscription active)
- Shows green badge: "자동 갱신 활성화됨" (Auto-renewal enabled)
- Displays next billing date
- Message explains subscription will renew automatically
- Link text: "결제 수단 및 자동 갱신 관리" (Manage payment method and auto-renewal)

### For International Users (or Non-Recurring)
- Title: "You're Already Subscribed!"
- Shows expiration date only
- Message explains they need to purchase after expiration
- No auto-renewal information shown

## Visual Differences

### Korean User with Auto-Renewal:
```
자동 갱신 구독 중
[Green Badge: 자동 갱신 활성화됨]
다음 결제일: 2025년 8월 7일

현재 구독 기간 만료일
2025년 8월 7일
30 days remaining

구독이 자동으로 갱신되며, 서비스가 중단 없이 계속됩니다.
[Link: 결제 수단 및 자동 갱신 관리]
```

### International User:
```
You're Already Subscribed!

Your subscription expires on
August 7, 2025
30 days remaining

You can purchase a new plan after your current subscription expires.
```

## Technical Details
- Checks `userCountry === "South Korea"` for Korean users
- Checks `autoRenew && recurringStatus === "ACTIVE"` for auto-renewal
- Uses Korean locale (`ko-KR`) for date formatting for Korean users
- Shows `nextBillingDate` only for auto-renewal subscriptions