# Party Favor Photo — Business Intelligence

## Overview
- **Owner:** Joe Lee
- **Business:** Premium photo booth rental
- **Founded:** ~2017 (on The Bash since 2017, 20+ verified bookings)
- **Based:** Arlington, VA (serving DMV area)
- **Expanding to:** Dallas/Ft. Worth, Texas
- **Phone:** 202-798-0610
- **WhatsApp:** +12027980610
- **Email:** bookings@partyfavorphoto.com (live via Resend)
- **Website:** partyfavorphoto.com (React/Vite via Lovable.dev)
- **Booking system:** tave.com/party-favor-photo
- **Past email:** pfpattendants@gmail.com (forwarding to bookings@)

## Services & Pricing

### StudioStation Photo Booth (Flagship)
- **Price:** From $498 (2hr), $747 (3hr), $996 (4hr)
- **What it is:** Professional DSLR camera, studio strobe lighting, sequin backdrops, unlimited prints, QR code sharing, goofy props, professional attendant
- **Best for:** Graduation parties, ANGP events, birthdays, celebrations

### Wedding Packages
- **Price:** From $998 (4-6 hours)
- **Features:** Custom wedding backdrops, guest book integration, same-day photo delivery
- **Best for:** Weddings, receptions

### Corporate Events
- **Price:** From $750 (3-8 hours)
- **Features:** Branded backdrops, social media integration, team building
- **Best for:** Trade shows, conferences, company parties

### Celebration Packages
- **Price:** From $595 (3-5 hours)
- **Features:** Balloon arches, themed props, cultural elements
- **Best for:** Birthdays, quinceaneras, bar mitzvahs

## Team
- **Joe Lee** — Owner / President / Director of Photography
- **Ken Griffin** — PR / Communications
- **Daniel Perry** — Senior Event Specialist
- **Josue Segura** — Senior Event Specialist
- **Trudie** — Attendant (NOVA)
- **Jackie** — Representative (Dallas)

## Markets Served
Washington D.C. | Maryland | Virginia (DMV core)
Colorado | Texas (expanding) | Florida

## Key Venues Worked
- **St. James Sports Complex** (Springfield, VA) — ANGP events for multiple FCPS schools (several years running)
- Dave & Busters (Fair Oaks) — ANGP events
- Providence RECenter (Falls Church) — ANGP events
- Multiple FCPS high schools for All Night Grad Parties

## Digital Presence
- **Website:** partyfavorphoto.com (React, Vite, shadcn/ui, Tailwind)
- **Booking API:** partyfavorphoto.vercel.app/api/booking
- **AI Booking API:** Has endpoints for check availability, calculate price, add to cart, checkout
- **Listings:** The Knot (5.0 rating), WeddingWire (5.0), The Bash (5.0, 20+ bookings)
- **CRM/Booking:** Tave (tave.com/party-favor-photo)
- **Translation:** Website supports English/Spanish toggle

## Email System (Live)
- **Send:** bookings@partyfavorphoto.com via Resend edge function
- **Receive:** All @partyfavorphoto.com via Resend inbound + webhook to relay
- **Forwarding:** pfpattendants@gmail.com → bookings@partyfavorphoto.com (verified)
- **API Key:** re_... (redacted — not committed to public repo)
- **Webhook secret:** whsec_... (redacted)

## Campaign Status
- **Daily cron:** 50 emails/day at 8:00 AM via Windows Task Scheduler
- **Targets:** High school ANGP committees, universities, festivals, conferences
- **Active lead:** John R. Lewis HS — Melissa Dotimas, ANGP Chair (60 students, St. James venue)
- **Pitch:** Official photo booth partner — branded prints as in-home marketing

## Reputation
- 5.0 on The Knot (10+ reviews)
- 5.0 on WeddingWire
- 5.0 on The Bash (5 reviews, 20+ bookings)
- 8 recommendations on Alignable
- Described as: "responsive", "professional", "fun", "grade A quality"
