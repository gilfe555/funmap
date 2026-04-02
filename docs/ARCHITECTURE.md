# Architecture

## Overview

FunMap is a React Native app (Expo) backed by Supabase. The core data flow is:

```
User toggles "Fun" ON
  → App reads GPS location
  → Upserts row in fun_signals table (Supabase)
  → Supabase Realtime broadcasts change to all subscribed clients
  → Other users' apps receive the event
  → Heatmap re-renders with new/updated blob
```

## Data Model

### `fun_signals` table

One row per user — the primary key is `user_id`, so each user can only have one active signal at a time.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID (PK) | References `auth.users.id` |
| `latitude` | DOUBLE PRECISION | User's latitude when they toggled on |
| `longitude` | DOUBLE PRECISION | User's longitude when they toggled on |
| `status` | BOOLEAN | `true` = having fun, `false` = not fun |
| `updated_at` | TIMESTAMPTZ | Last update time |
| `expires_at` | TIMESTAMPTZ | Set to `NOW() + 8h` when toggled on; `null` when off |

**Active signal definition:** `status = true AND expires_at > NOW()`

## How the Heatmap Works

### 1. Fetching Signals

When the user pans/zooms the map, `useHeatmap` fetches all active signals within the visible bounds:

```sql
SELECT * FROM fun_signals
WHERE status = true
  AND expires_at > NOW()
  AND latitude  BETWEEN :minLat AND :maxLat
  AND longitude BETWEEN :minLng AND :maxLng
```

### 2. Real-time Updates

A Supabase Realtime subscription listens for any changes to `fun_signals`. When a change arrives, the app merges it into its local signal map (keyed by `user_id`):

- **INSERT / UPDATE with status=true:** Add or update the signal
- **UPDATE with status=false:** Remove the signal
- **DELETE:** Remove the signal

### 3. Clustering

Nearby signals are grouped into clusters before rendering, so 10 people at the same bar show as one large blob rather than 10 overlapping dots.

Algorithm in `src/utils/clustering.ts`:
1. For each unassigned signal, find all other signals within 150m (Haversine distance)
2. Group them into a cluster centered at their average lat/lng
3. Return `Cluster[]` with `{lat, lng, count}`

Radius constant: `CLUSTER_RADIUS_METERS = 150` (in `src/constants/config.ts`)

### 4. Intensity Levels

Each cluster gets an intensity level based on user count:

| Level | Count | Color | Circle Radius | Extra |
|-------|-------|-------|---------------|-------|
| L1 (Low) | 1–2 | `rgba(144, 238, 144, 0.4)` — pale green | 80m | — |
| L2 (Medium) | 3–5 | `rgba(57, 255, 20, 0.65)` — lime green | 150m | — |
| L3 (High) | 6+ | `rgba(0, 128, 0, 0.85)` — dark green | 250m | 🔥 emoji |

### 5. Rendering

Each cluster renders as:
- A `Circle` component (react-native-maps) at the cluster center
- For L3: an additional `Marker` with a 🔥 emoji floating above

## Fun Toggle Logic

```
useFunSignal hook
  ├── toggleFun(lat, lng)
  │     ├── Upserts fun_signals row with status=true, expires_at=NOW()+8h
  │     └── Sets local 8-hour timer → calls turnOff() when it fires
  │
  ├── turnOff()
  │     └── Updates fun_signals row with status=false, expires_at=null
  │
  └── On app foreground (AppState change)
        └── Checks if expires_at has passed → calls turnOff() if so
```

**One-spot rule:** The DB schema uses `user_id` as the primary key. Upserting at a new location automatically overwrites the old one — no orphan rows possible.

## Authentication Flow

```
App starts
  → AuthContext checks Supabase session (AsyncStorage)
  → If session exists: navigate to (tabs)/index (Map)
  → If no session: navigate to (auth)/login

User logs in
  → supabase.auth.signInWithPassword()
  → Supabase sets session in AsyncStorage
  → AuthContext updates → app navigates to Map

User logs out
  → supabase.auth.signOut()
  → AsyncStorage cleared
  → App navigates to Login
```

## Groups Phase (Iteration 1 — Shipped)

The second major phase adds social groups, scheduled events, and a Future map mode.

### New Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Display name per user (auto-created on signup via trigger) |
| `groups` | Public or private groups with denormalized `member_count` and `avg_rating` |
| `group_members` | Many-to-many users↔groups with role (`admin` \| `member`) |
| `events` | Future fun events within a group — lat/lng + `starts_at` + `rsvp_count` |
| `event_rsvps` | Many-to-many users↔events |
| `group_ratings` | Per-user 1–5 star rating per group; average maintained by trigger |
| `notifications` | In-app alerts (new event, RSVP, invite) with `read` flag |

Migrations: `supabase/migrations/002_groups.sql`, `003_invite_policy.sql`, `004_notifications.sql`

### Map – Future Mode

```
User switches to Future mode
  → NowFutureToggle updates mapMode state
  → useFutureEvents fetches upcoming events within visible bounds
  → Events are clustered (same Haversine algorithm as fun signals)
  → FutureHeatmap renders event blobs (intensity = rsvp_count)
  → EventsStrip shows scrollable event cards at bottom
  → GroupFilterChips let user filter by joined group
  → Fun toggle is hidden (can't mark yourself as fun in the future)
```

### Notification Flow

```
DB trigger (AFTER INSERT ON events)
  → notify_new_event() fans out a notification row per group member
DB trigger (AFTER INSERT ON event_rsvps)
  → notify_new_rsvp() notifies the event creator
App (useNotifications hook)
  → Supabase Realtime subscription filtered by user_id
  → unreadCount drives the red badge on the Alerts tab
```

### New Screens

| Screen | Route |
|--------|-------|
| Discover Groups | `(tabs)/groups` |
| Create Group | `group/create` |
| Group Detail | `group/[id]` |
| Invite Users | `group/invite` |
| Create Event | `event/create` |
| Event Detail | `event/[id]` |
| Alerts | `(tabs)/alerts` |

## Future Iterations (Planned, Not Yet Built)

| Iteration | What gets added |
|-----------|----------------|
| Iter 2: Auto Fun Status | Background location, notification toasts |
| Iter 3: Statistics | New `(tabs)/stats.tsx`, aggregated query views |
| Iter 4: Feature Requests | New `(tabs)/requests.tsx`, requests DB table |
