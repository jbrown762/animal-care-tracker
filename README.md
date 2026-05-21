# Animal Care Tracker

Foundation MVP for a multi-org animal care task tracker built with Expo, Supabase, TanStack Query, and NativeWind.

## Setup

1. Install dependencies:

   ```powershell
   npm.cmd install
   ```

2. Copy `.env.example` to `.env` and fill in:

   ```text
   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

3. Apply Supabase migrations from `supabase/migrations`.

4. Start web development:

   ```powershell
   npm.cmd run web
   ```

The app renders a clear setup screen when Supabase environment variables are missing.
