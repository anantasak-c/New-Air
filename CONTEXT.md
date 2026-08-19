# Flight Duty & Rest Planner — Domain Glossary

This document defines the ubiquitous domain language for the Flight Duty & Rest Planner and its LINE Chatbot subsystem.

---

## 1. Aviation & Roster Terms

### Roster / Duty Schedule
The official monthly or weekly work schedule for airline flight crew (pilots and cabin crew), displaying pairings, flight numbers, duty times, and off days.

### Report Duty Time (Sign-on / On-Duty)
The mandatory time flight crew must arrive at the airport terminal / operations center to begin pre-flight briefing, safety checks, and preparations before departure.

### Pairing / Flight Number
A sequence of flights operated by a crew member over a single duty period (e.g. `114-1: BKK-CNX-BKK-URT-BKK` or `TKIX1-1: BKK-TPE-KIX`).

### Duty Types
- **Flight Duty**: An active flight sequence with specific report and release times.
- **Standby (SBM / SBD / SBN)**: On-call standby duty where crew must be prepared to report if called (e.g., Morning Standby `SBM-1 02:00 - 12:00`).
- **Annual Leave (AL)**: Approved vacation / annual leave (`AL-1`).
- **Rest / Day Off (REST / RERRP)**: Mandatory rest period / day off with no flight duties (`REST-1`, `RERRP2LD-1`).

---

## 2. Schedule Calculation Model

### Target Wake-Up Time
The optimal time the crew member should wake up, calculated as:
$$\text{Wake-Up Time} = \text{Report Duty Time} - (\text{Prep Time} + \text{Transit Time})$$

### Prep Time (Preparation & Grooming)
Time allocated at home for grooming, uniform dressing, packing flight kit, and final check (default: 1.5 hours / 90 minutes).

### Transit Time (Travel to Airport)
Estimated door-to-door driving / taxi time from residence to airport terminal (default: 1.0 hour / 60 minutes).

### 4-Box Bedtime Schedule
The recommended bedtime hours for the night before duty:
1. **8 Hours (Full Rest)**: $\text{Wake-Up} - 8\text{h}$ — Optimal recovery and cognitive sharpness.
2. **7 Hours (Comfortable)**: $\text{Wake-Up} - 7\text{h}$ — Standard sufficient rest.
3. **6 Hours (Standard)**: $\text{Wake-Up} - 6\text{h}$ — Acceptable working rest.
4. **5 Hours (Minimum Safe)**: $\text{Wake-Up} - 5\text{h}$ — Minimum threshold before alertness declines.

---

## 3. Smart Lifestyle & Rest Calendar

### Smart Aviation Life Calendar
A high-glanceability monthly and weekly calendar that transforms complex airline roster duty dots into an actionable visual planning board showing duty blocks, sleep slots, and free windows.

### Mobile 5-Day Focus Mode (โหมด 5 วัน โฟกัสรายละเอียด)
An adaptive mobile layout displaying 5 days per row for wider columns (~75px+), enabling un-truncated flight pairing codes (`114-1 BKK-CNX`), report times (`06:05 L`), and bedtime capsules without truncation.

### Three-Tier Day Cell (การจัดวางข้อมูล 3 ชั้นในช่องวัน)
A structured in-cell hierarchy:
1. **Tier 1 (Header)**: Day number, weekday, and Moon icon `🌙` if early sleep is required.
2. **Tier 2 (Duty Bar)**: Colored duty bar (`✈️ Flight`, `⏳ Standby`, `🎉 Day Off`).
3. **Tier 3 (Sleep Capsule)**: Dedicated bedtime (`🌙 21:35 น.`) and wake-up (`☀️ 03:35 น.`) tags.

### Free Time Window (ช่วงเวลาว่างสำหรับวางแผนชีวิต)
The safe, unencumbered hours between the end of post-flight release and the start of the next pre-duty bedtime window, available for family, social life, workouts, and personal errands.

### Early Sleep Zone (โซนเตือนเข้านอนเร็ว)
An alert zone applied to the evening preceding any early morning report time ($< 07:00\text{ L}$), cautioning crew members against scheduling late-night activities.

### iCalendar (.ics) 1-Click Sync
RFC 5545 calendar export file generating multi-layer calendar events (Flight Duty, Wakeup Alarm, Bedtime Reminder) directly into native Apple Calendar (iOS/macOS) and Google Calendar.

---

## 4. LINE Chatbot & LIFF Architecture

### Roster OCR (Vision Intelligence)
The automated computer vision pipeline powered by Google Gemini 2.5 Flash Lite to scan uploaded Roster screenshots and extract structured flight events (`date`, `pairing`, `reportTime`, `releaseTime`, `dutyType`).

### LINE Front-end Framework (LIFF)
An embedded webview inside LINE (`LiffSchedulePicker`) enabling flight crew to interactively adjust dress-up time, transit time, and select multi-day duty items with Apple White design.

### Compact Flight Tuple Codec (`flightCodec.js`)
A stateless compression algorithm converting array of flight objects into compact tuples (`[date, pairing, reportTime, typeChar]`) ensuring base64 query URLs stay well below LINE's 1,000 character limit.

---

## 5. Flightradar24 & Route Story Map Engine

### Crew Route Story Map (แผนที่เส้นทางบินสตอรี่)
A dark aviation radar map rendering glowing Geodesic Great Circle flight arcs connecting all destinations in the crew member's monthly roster, with cumulative mileage and sector statistics.

### Story Card Generator (การบันทึกภาพสตอรี่ 9:16)
An in-browser image rendering engine exporting high-resolution 1080x1920 (9:16) graphics optimized for Instagram and TikTok Stories.

### Flightradar24 Live Tracking Link
Deep-link generator linking flight numbers to Flightradar24 live radar tracking (`https://www.flightradar24.com/data/flights/...`), allowing crew to share real-time flight status with family and friends.

### Airport Coordinates Engine (`airportEngine.js`)
A client-side aviation database mapping airport IATA/ICAO codes (`BKK`, `CNX`, `URT`, `HKT`, `YNT`, `TPE`, `OKA`, `KIX`, `NRT`, `HND`, `ICN`, `SIN`, `KUL`, `MEL`, `SYD`, etc.) to precise geographical coordinates and calculating great-circle distances.
