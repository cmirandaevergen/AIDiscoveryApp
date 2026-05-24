# AIDiscoveryApp

AI-powered discovery and strategy consulting platform for Evergen.

## Setup

1. Copy `.env.example` to `.env.development` and fill in your Supabase credentials.
2. Run `npm install`
3. Run `npm run dev`

## Supabase

- Apply `supabase/01_schema.sql` then `supabase/02_rls.sql` in the SQL editor for each environment.
- Enable Realtime on the `use_cases` table.
