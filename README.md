# PlumbLine AI Starter

Next.js SaaS starter for a plumber-focused missed-call text-back product. The app includes:

- Supabase email-link auth wiring
- App Router pages for `dashboard`, `inbox`, `leads`, and `settings`
- A starter Postgres schema for accounts, missed calls, conversations, messages, leads, and notification settings
- A verified Twilio voice status webhook at `/api/twilio/voice-status`
- A verified Twilio inbound SMS webhook at `/api/twilio/inbound-sms`
- Automatic missed-call SMS recovery with templates, opt-outs, cooldown checks, and message persistence
- New lead-reply notifications by email and optional SMS with 10-minute dedupe
- A warm, trade-oriented UI instead of generic dashboard chrome

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and set your Supabase values:

   ```bash
   cp .env.example .env.local
   ```

3. Run the app:

   ```bash
   npm run dev
   ```

4. Apply the schema in your Supabase SQL editor:

   `supabase/schema.sql`

5. Seed local demo data if needed:

   ```bash
   npm run seed
   ```

## Notes

- The marketing/auth landing page lives at `/`.
- Route protection is handled in `middleware.ts`.
- The route UIs currently use seeded mock data in `lib/data.ts`; replace those reads with live Supabase queries as you wire the product.
