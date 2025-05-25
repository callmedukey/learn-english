# Plan Selection & Payment System

This directory contains the complete plan selection and payment system for the Learn English application, integrated with TossPayments.

## Features

### 📋 Plan Selection

- **Plan Cards**: Display available subscription plans with pricing and features
- **Popular Plan Badge**: Highlights the most popular plan (3-month plan by default)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Plan Features**: Shows included features for each plan

### 🎫 Coupon System

- **Coupon Input**: Users can enter coupon codes for discounts
- **Real-time Validation**: Validates coupons against the database
- **Two Discount Types**:
  - Percentage discounts (e.g., 20% off)
  - Flat amount discounts (e.g., ₩5,000 off)
- **Visual Feedback**: Shows applied coupons with discount amount

### 💳 Payment Integration

- **TossPayments SDK**: Integrated with TossPayments for secure payments
- **Payment Summary**: Shows final price and plan expiration date
- **Order Management**: Creates payment records before processing
- **Success/Fail Handling**: Proper redirect handling for payment outcomes

## File Structure

```
plans/
├── page.tsx                    # Main plans page (server component)
├── components/
│   ├── plans-client.tsx        # Main client component orchestrating the flow
│   ├── plan-card.tsx          # Individual plan card component
│   ├── coupon-input.tsx       # Coupon input and validation
│   └── payment-summary.tsx    # Payment summary display
├── actions/
│   ├── coupon.actions.ts      # Server actions for coupon validation
│   └── payment.actions.ts     # Server actions for payment creation
├── queries/
│   └── plans.query.ts         # Database queries for plans and coupons
├── success/
│   ├── page.tsx               # Payment success page
│   └── components/
│       └── success-content.tsx # Success page content
└── fail/
    └── page.tsx               # Payment failure page
```

## Usage Flow

1. **Plan Selection**: User selects a subscription plan from available options
2. **Coupon Application**: User can optionally enter a coupon code for discounts
3. **Payment Summary**: System shows final price and plan expiration date
4. **Payment Processing**: TossPayments SDK handles the payment flow
5. **Confirmation**: Payment is confirmed via API and subscription is created

## Test Coupons

For testing purposes, the following coupons are available:

- **TEST20**: 20% discount on any plan
- **SAVE5000**: ₩5,000 flat discount

## Configuration

### TossPayments Setup

Update the following constants in `plans-client.tsx`:

```typescript
const TOSS_CLIENT_KEY = "your_actual_client_key";
```

And in `app/api/payments/confirm/route.ts`:

```typescript
const TOSS_SECRET_KEY = "your_actual_secret_key";
```

### Environment Variables

Make sure to set these in your `.env` file:

```env
TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
```

## Database Schema

The system uses the following models:

- **Plan**: Subscription plans with flexible pricing and duration
- **DiscountCoupon**: Coupon codes with percentage or flat discounts
- **Payment**: Payment records from TossPayments
- **UserSubscription**: User subscription status and expiration

## API Endpoints

- `POST /api/payments/confirm`: Confirms payment with TossPayments and creates subscription

## Color Scheme

Following the project's design system:

- **Primary**: Amber (amber-500, amber-600)
- **Secondary**: Gray shades
- **Success**: Green (green-50, green-600, green-800)
- **Error**: Red (red-50, red-600, red-800)

## Security Considerations

1. **Payment Verification**: All payments are verified with TossPayments API
2. **Amount Validation**: Payment amounts are validated against database records
3. **Coupon Validation**: Coupons are validated server-side
4. **User Authentication**: Only authenticated users can access the plans page

## Testing

To test the payment flow:

1. Navigate to `/plans`
2. Select a plan
3. Enter a test coupon (TEST20 or SAVE5000)
4. Click "Confirm Payment"
5. Use TossPayments test card numbers for testing

## Future Enhancements

- [ ] Auto-renewal functionality
- [ ] Plan comparison table
- [ ] Subscription management
- [ ] Payment history
- [ ] Refund processing
- [ ] Webhook handling for payment events
