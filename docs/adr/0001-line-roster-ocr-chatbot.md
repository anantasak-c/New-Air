# 0001. LINE Chatbot Roster OCR & Stateless Flex Architecture

- **Status**: Accepted
- **Deciders**: User, Agent
- **Date**: 2026-08-18

---

## Context and Problem Statement

Flight crew members (pilots and cabin crew) frequently receive their duty schedules via mobile app screenshots (e.g. AIMS, CrewPad, NetLine). Typing dates and report duty times manually into a web form introduces friction. We want to enable crew members to simply send a screenshot to a LINE Official Account, have AI scan the roster, ask 1-click preference questions, and return a clean LINE Flex Carousel calculation card.

---

## Decision Drivers

1. **Zero-Friction Crew Experience**: Upload screenshot and get sleep times in seconds.
2. **Cost Efficiency**: Zero or near-zero operating costs for hobby/production scale.
3. **Stateless Serverless Execution**: No database maintenance or session timeout bugs.
4. **Professional UI Integrity**: Clean, tabular, readable LINE Flex Message output.

---

## Considered Options

1. **Option A (Accepted)**: Vercel Serverless Function (`/api/line-webhook.js`) + Google Gemini Flash Vision API + Stateless Postback + LINE Flex Carousel.
2. **Option B**: VPS + Self-hosted n8n instance + Docker + Redis session storage.
3. **Option C**: Web-only manual input without LINE Chatbot.

---

## Decision Outcome

Chosen **Option A** because:
- **Serverless on Vercel**: Runs within the existing project infrastructure with 0 server costs.
- **Gemini Flash Vision**: Generous free tier (1,500 scans/day) and high OCR precision for airline rosters.
- **Stateless Postback**: Encodes parsed flight payload in LINE Quick Reply postback data, avoiding database overhead.
- **Flex Carousel**: Accommodates multi-flight list screenshots cleanly.

---

## Consequences

### Positive
- Crew can calculate sleep schedule directly in LINE chat.
- Zero server maintenance, automatic scaling on Vercel.
- Instant response with Flex Carousel.

### Negative / Trade-offs
- LINE Messaging API requires Channel Secret and Access Token configuration in Vercel environment variables.
- Gemini API Key must be supplied in `.env` / Vercel secrets.
