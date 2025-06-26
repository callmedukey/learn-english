# Server Timezone Configuration

## Overview
The Reading Camp medal assignment job is designed to run at **00:00 KST (Korean Standard Time)** every day, regardless of the server's timezone setting. This document explains how the timezone-aware system works and how to configure your server.

## Current Implementation
Our cron job uses a timezone-aware wrapper that:
- Runs every hour (not just once per day)
- Checks if the current time in Korea is midnight (00:00-00:59)
- Only executes the medal assignment job during that window
- Works regardless of server timezone setting

## Checking Server Timezone

To check your server's current timezone configuration:

```bash
timedatectl
```

Example output:
```
Local time: Thu 2025-06-26 04:29:10 UTC
Universal time: Thu 2025-06-26 04:29:10 UTC
RTC time: Thu 2025-06-26 04:29:11
Time zone: Etc/UTC (UTC, +0000)
System clock synchronized: yes
NTP service: active
RTC in local TZ: no
```

## Setting Server Timezone (Optional)

Our cron jobs work with any timezone, but if you want to set the server to a specific timezone:

### List Available Timezones
```bash
# List all timezones
timedatectl list-timezones

# Search for specific timezone
timedatectl list-timezones | grep Seoul
timedatectl list-timezones | grep Jakarta
```

### Set Timezone
```bash
# Set to UTC (recommended for servers)
sudo timedatectl set-timezone UTC

# Or set to Korea time
sudo timedatectl set-timezone Asia/Seoul

# Or set to Jakarta time
sudo timedatectl set-timezone Asia/Jakarta

# Verify the change
date
timedatectl
```

## How Our Timezone Solution Works

### 1. Cron Wrapper Script (`/scripts/cron-wrapper.ts`)
- Executes every hour via PM2's cron_restart: `"0 * * * *"`
- Uses `date-fns-tz` to convert current UTC time to Korean time
- Only runs the medal job when Korean time hour === 0 (midnight)

### 2. Timezone Conversion
```typescript
const now = new Date();                          // Server time (any timezone)
const koreaTime = toZonedTime(now, 'Asia/Seoul'); // Convert to KST
const hour = koreaTime.getHours();               // Get hour in Korean time

if (hour === 0) {
  // Run medal assignment job
}
```

### 3. Benefits
- **Server Independent**: Works on servers in any timezone
- **Migration Safe**: Move servers without changing code
- **DST Safe**: Handles daylight saving time automatically
- **Clear Logging**: Shows both UTC and KST times in logs

## Common Timezone Scenarios

### Server in UTC (like your current setup)
- Server time: 15:00 UTC
- Korea time: 00:00 KST (next day)
- Medal job: ✅ Runs

### Server in Jakarta (WIB/UTC+7)
- Server time: 22:00 WIB
- Korea time: 00:00 KST (next day)
- Medal job: ✅ Runs

### Server in Korea (KST/UTC+9)
- Server time: 00:00 KST
- Korea time: 00:00 KST
- Medal job: ✅ Runs

## Testing the System

### Test the Wrapper (Dry Run)
```bash
# Run the wrapper manually to see what it would do
npm run medal-wrapper-test
```

### Force Run Medal Job
```bash
# Bypass the wrapper and run the job directly
npm run medal-job
```

### View Cron Logs
```bash
# View recent cron wrapper executions
tail -f logs/cron-out.log

# View any errors
tail -f logs/cron-error.log
```

## Troubleshooting

### Job Not Running at Expected Time
1. Check server timezone: `timedatectl`
2. Check PM2 cron status: `pm2 status medal-cron`
3. View wrapper logs to see timezone calculations: `tail -100 logs/cron-out.log`

### Timezone Calculation Issues
The wrapper logs detailed timezone information:
```
UTC Time: 2024-07-01T15:00:00.000Z
Korea Time: 2024-07-02T00:00:00.000Z
Korea Hour: 0:00
✅ It is midnight in Korea! Running medal assignment job...
```

### PM2 Cron Not Triggering
```bash
# Restart the cron job
pm2 restart medal-cron

# Check PM2 logs
pm2 logs medal-cron

# Verify cron pattern
pm2 describe medal-cron | grep cron
```

## Alternative Approaches (Not Recommended)

### 1. Fixed UTC Time
If you know your server will always be in UTC:
```javascript
cron_restart: "0 15 * * *" // 15:00 UTC = 00:00 KST
```
⚠️ **Problem**: Breaks if server timezone changes

### 2. System Crontab with TZ
Using system cron with timezone:
```bash
# In crontab -e
TZ=Asia/Seoul
0 0 * * * /usr/bin/node /path/to/medal-cron.ts
```
⚠️ **Problem**: Not all cron implementations support TZ variable

### 3. Server Set to KST
Setting entire server to Korean time:
```bash
sudo timedatectl set-timezone Asia/Seoul
```
⚠️ **Problem**: May affect other applications expecting UTC

## Conclusion
Our timezone-aware wrapper approach ensures the medal assignment job runs at exactly 00:00 KST every day, regardless of:
- Server physical location
- Server timezone configuration
- Daylight saving time changes
- Future server migrations

This robust solution requires no special server configuration and works out of the box.