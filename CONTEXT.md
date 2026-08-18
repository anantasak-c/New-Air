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
- **Rest / Day Off (REST)**: Mandatory rest period / day off with no flight duties (`REST-1`).

---

## 2. Schedule Calculation Model

### Target Wake-Up Time
The optimal time the crew member should wake up, calculated as:
$$\text{Wake-Up Time} = \text{Report Duty Time} - (\text{Prep Time} + \text{Transit Time})$$

### Prep Time (Preparation & Grooming)
Time allocated at home for grooming, uniform dressing, packing flight kit, and final check (default: 1.5 hours).

### Transit Time (Travel to Airport)
Estimated door-to-door driving / taxi time from residence to airport terminal (default: 1.0 hour).

### 4-Box Bedtime Schedule
The recommended bedtime hours for the night before duty:
1. **8 Hours (Full Rest)**: $\text{Wake-Up} - 8\text{h}$ — Optimal recovery and cognitive sharpness.
2. **7 Hours (Comfortable)**: $\text{Wake-Up} - 7\text{h}$ — Standard sufficient rest.
3. **6 Hours (Standard)**: $\text{Wake-Up} - 6\text{h}$ — Acceptable working rest.
4. **5 Hours (Minimum Safe)**: $\text{Wake-Up} - 5\text{h}$ — Minimum threshold before alertness declines.

---

## 3. LINE Chatbot Architecture

### Roster OCR (Vision Intelligence)
The automated computer vision pipeline powered by Google Gemini 1.5/2.0 Flash to scan uploaded Roster screenshots and extract structured flight events (`duty_date`, `pairing_code`, `report_time`, `duty_type`).

### Quick Reply Prompt
An interactive 1-click prompt asking the crew member to specify their total prep + transit hours (`2.0h`, `2.5h`, `3.0h`, `3.5h`).

### Stateless Postback
A design pattern where extracted flight parameters are encoded directly into the LINE Quick Reply `postback.data` string, eliminating the need for server-side session databases.

### Flex Carousel
A multi-card horizontal swiper message in LINE displaying calculation cards for each flight duty discovered in the user's uploaded screenshot.
