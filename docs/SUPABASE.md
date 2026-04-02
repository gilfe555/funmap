# Supabase Setup

This guide walks through creating the Supabase project and applying the database schema for FunMap.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in
2. Click **New Project**
3. Fill in:
   - **Name:** `funmap`
   - **Database Password:** choose a strong password (save it somewhere safe)
   - **Region:** choose the one closest to you (e.g., `eu-central-1` for Europe, `us-east-1` for US East)
4. Click **Create new project** — takes about 1 minute to provision

## 2. Get Your API Keys

1. In your project dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (the `eyJ...` JWT token under "Project API keys")
3. Paste both into your `.env` file:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

> **Service Role Key (for seed script only):** Also in Settings → API, copy the `service_role` key and add it as `SUPABASE_SERVICE_ROLE_KEY=...` in your `.env`. This key has admin access — never expose it in the app or commit it.

## 3. Apply the Database Schema

Run all four migration files **in order** via SQL Editor (left sidebar → New query → paste → Run):

| # | File | What it creates |
|---|------|----------------|
| 1 | `supabase/migrations/001_fun_signals.sql` | `fun_signals` table, RLS, indexes |
| 2 | `supabase/migrations/002_groups.sql` | `profiles`, `groups`, `group_members`, `events`, `event_rsvps`, `group_ratings`, all triggers and RLS |
| 3 | `supabase/migrations/003_invite_policy.sql` | Adds admin-invite RLS policy to `group_members` |
| 4 | `supabase/migrations/004_notifications.sql` | `notifications` table, new-event + RSVP trigger functions, RLS |

Each should return "Success. No rows returned." Verify in **Table Editor** — you should see all tables listed.

> **Existing users:** After running migration 002, backfill profile rows for any accounts created before the migration:
> ```sql
> INSERT INTO public.profiles (id, display_name)
> SELECT id, split_part(email, '@', 1)
> FROM auth.users
> ON CONFLICT (id) DO NOTHING;
> ```

## 4. Enable Realtime

The heatmap uses Supabase Realtime to push live updates to all connected clients.

1. In your project dashboard, go to **Database** → **Replication**
2. Under **Source**, find the `fun_signals` table
3. Toggle it **ON** (enable realtime for this table)

## 5. Configure Auth Settings (Optional but Recommended)

1. Go to **Authentication** → **Providers** → make sure **Email** is enabled
2. Go to **Authentication** → **Email Templates** → customize the confirmation email if desired
3. For development, you can turn off "Confirm email" under **Authentication** → **Settings** → disable "Enable email confirmations" so you can sign up instantly without checking email

## Schema Reference

The full schema is in `supabase/migrations/001_fun_signals.sql`. Key points:

- **One row per user** — the `user_id` is the primary key, so each user can only have one active fun signal. Toggling on at a new location simply updates the existing row.
- **`status` boolean** — `true` = having fun, `false` = not having fun
- **`expires_at`** — set to `NOW() + 8 hours` when toggled on; rows past this timestamp are treated as inactive even if `status = true`
- **Row Level Security** — enforced so users can only write to their own row, and can only read rows where `status = true` and not expired

## Troubleshooting

**"Permission denied" errors:** RLS is blocking the query. Make sure you're authenticated in the app before calling any Supabase function.

**Realtime not updating:** Make sure you enabled replication for `fun_signals` in step 4.

**Can't sign up:** If email confirmation is on and you don't receive the email, check spam or disable email confirmation in Auth settings (fine for development).
