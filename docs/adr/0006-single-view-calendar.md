# ADR 0006: Single-View Calendar (Mini Month + Daily List) for the 100% LIFF

## Status
Accepted

## Context
The `/calendar` page (endpoint of the new 100% LIFF) had grown four view modes (5-day focus, month grid, agenda, route map) with dense grids designed for landscape desktops. On a phone inside LINE, month-grid cells were tiny and every fact required a tap. An interview with the owner set the goal: the page must answer, at a glance, **which days do I work, at what times, which days am I free, and when should I sleep** — in that priority (work calendar first, sleep second).

## Decision
1. **Single view** replaces the mode switcher: a **mini month map** (7-column strip, each day a pale duty tint — บิน=แดงอ่อน, STB=ส้มอ่อน, ว่าง=เขียวอ่อน — today ringed) over a **daily list**. Route map and .ics export move into the ⋯ menu; the 5-day, month-grid and agenda modes are removed.
2. **Daily list rows** answer the four questions without tapping:
   - Duty row (flight/standby): date block, pale accent, badge, pairing, `รายงาน/ปล่อย` times, and the **wake time** (`ตื่น HH:MM` = report − dressUp 90m − transit 60m, the same defaults as the 75% LIFF).
   - **Free runs collapse**: consecutive free/rest days merge into one row — `ว่าง 3 วันติด · 19–21 ก.ย. · นอนเต็มอิ่ม`.
   - Multi-day duties render as one span row (`26–27 ก.ย.`).
3. Tapping a row/day keeps the existing bottom-sheet modal (sleep options 8/7h, departure, free-time planning, .ics, Flightradar24) — recolored to the new pale red/orange/green language.
4. The list **auto-scrolls to today** on load; a `วันนี้` chip marks the row.
5. Wake times on this page always use the standard defaults (90+60). Per-user adjustments remain the 75% LIFF's job (ADR: LIFF split).

## Consequences
- **Positive**: one screen answers all four owner questions without interaction; far less code (~470 lines removed from the view layer); consistent with the white-utility direction.
- **Negative**: users who preferred the dense month grid or 5-day columns lose them (recoverable from git); wake times here don't reflect adjustments made in the 75% LIFF unless defaults match.
- **Follow-ups**: carry the adjusted dressUp/transit values through the `d=` codec if per-user wake times on this page become important.
