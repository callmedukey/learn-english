# User Payments Page

This page displays a user's payment history with comprehensive filtering and sorting capabilities.

## Features

### 1. Filtering Options

- **Plan Filter**: Filter payments by specific subscription plans or view all plans
- **Date Range Filter**:
  - Last 1 Month
  - Last 3 Months
  - Last 1 Year
  - Last 5 Years
  - All Time
- **Sort Options**:
  - Latest (newest first)
  - Oldest (oldest first)

### 2. Payment Table

Displays the following information for each payment:

- **Date**: Payment request date and time
- **Transaction ID**: Unique order ID for the payment
- **Plan**: Plan name and duration in days
- **Amount**: Final payment amount in KRW with discount information if applicable
- **Status**: Payment status with color-coded badges
  - PAID (Green)
  - PENDING (Amber)
  - FAILED (Red)
  - CANCELLED (Gray)
  - REFUNDED (Blue)

### 3. Server-Side Implementation

- All filtering is handled server-side using search parameters
- No client-side data fetching
- Optimized database queries with proper indexing
- Suspense boundaries for loading states

## File Structure

```
payments/
├── page.tsx                    # Main page component
├── components/
│   ├── payment-filters.tsx     # Filter controls
│   └── payment-table.tsx       # Payment history table
├── queries/
│   └── payments.query.ts       # Database queries
└── README.md                   # This file
```

## Usage

The page automatically loads the current user's payments and applies any filters from the URL search parameters. Users can:

1. Select different plans from the dropdown
2. Choose a date range to filter payments
3. Sort payments by date (latest or oldest)
4. View detailed payment information in the table

All filter changes update the URL parameters and trigger server-side re-rendering with the new filtered data.

## Color Scheme

Following the project guidelines, the page uses only:

- Tailwind gray shades
- Amber colors for highlights and pending states
- Primary color for interactive elements

## Database Queries

The implementation uses optimized Prisma queries with:

- Proper WHERE clauses for filtering
- Includes for related data (plan, subscription)
- Indexed fields for performance
- Type-safe TypeScript interfaces
