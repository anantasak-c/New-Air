# ADR 0002: Smart Aviation Lifestyle & Rest Calendar

## Status
Accepted

## Context
Aviation flight crew rosters (such as AIMS, CrewPad, NetLine) provide very dense list views and cryptic monthly dot calendars. Crew members struggle to quickly understand:
1. When they need to go to sleep and wake up for upcoming flights.
2. Which days and hours are genuine "Free Time Windows" for scheduling personal life, gym, and family time.
3. Which evenings require early sleep ("Early Sleep Zones") before early morning departures.
4. How to seamlessly synchronize these complex sleep and flight events into their personal iOS (Apple Calendar) or Google Calendar.

## Decision
We will build a **Smart Aviation Lifestyle & Rest Calendar** integrated across the Web app and LIFF view:
1. **Apple iOS Clean White Design Calendar**:
   - Monthly interactive calendar grid displaying distinct duty badge chips (`✈️ BKK-CNX`, `⏳ Standby`, `🟢 Day Off`, `🏖️ Leave`).
   - Selected Day Agenda Sheet displaying the day's full operational & lifestyle timeline:
     - 🌙 Early Bedtime Slot (8h / 7h)
     - ☀️ Target Wakeup & Grooming Slot
     - 🚗 Transit to Airport
     - ✈️ Flight Duty (Report to Release)
     - ☕ Free Time Window (Available off-duty hours)
2. **1-Click iCalendar (.ics) Sync**:
   - Client-side generator (`src/utils/icsGenerator.js`) creating RFC 5545 compliant `.ics` calendar files.
   - Automatically injects alarms for Target Wakeup and Bedtime reminder notifications into the user's native device calendar.
3. **Multi-device Accessibility**:
   - Accessible directly in the LINE Chatbot LIFF view, in the Web App (`/calendar` and toggle tab), and as a direct export button.

## Consequences
- **Positive**:
  - Crew members can plan their personal and social life weeks in advance with zero mental math.
  - Native iOS/Google Calendar integration provides active push alarms without requiring custom mobile app installation.
  - Consistent Apple White aesthetic throughout web and LIFF.
- **Negative / Mitigations**:
  - Date parsing must handle various airline roster date strings (e.g. `24 Aug (Mo)`, `2026-08-24`, `Aug 25`) reliably via standardized date parser helpers.
