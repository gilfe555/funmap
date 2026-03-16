# Testing Guide

This guide explains how to preview and test FunMap — including how to simulate multiple users without needing real people.

## Quick Preview (Single User)

### Option A: Your Phone (Best for GPS Testing)

1. Install [Expo Go](https://expo.dev/go) on your Android phone
2. Connect phone and laptop to the same Wi-Fi network
3. Run `npx expo start` in the project folder
4. Scan the QR code with your phone camera
5. The app loads with your real GPS location

**Best for:** testing the Fun toggle, seeing real map tiles, verifying location accuracy.

### Option B: Android Emulator (Best for Iterating Fast)

1. Make sure ADB is on your PATH (see [SETUP.md](SETUP.md))
2. Run `npx expo start --android` (opens Pixel_8 emulator automatically)
   - Or start the emulator manually first: `emulator -avd Pixel_8`
3. **Set a mock GPS location** (required — emulator has no real GPS):
   - Click the three-dot menu (⋮) on the emulator's side panel
   - Go to **Location** → enter lat/lng (e.g., Tel Aviv: `32.0853, 34.7818`) → **Set Location**

## Simulating Multiple Users (Seed Script)

You don't need multiple real users to test the heatmap. The seed script inserts fake fun signals directly into Supabase.

### Setup

The seed script needs a service role key (admin access). Add it to your `.env`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
Get it from: Supabase Dashboard → Settings → API → `service_role` key.

Install the seed script dependency:
```bash
npm install -D ts-node @types/node
```

### Running the Seed Script

```bash
# Seed 5 users near Tel Aviv (tests L1/L2 blobs)
npx ts-node scripts/seed-demo-data.ts --lat 32.0853 --lng 34.7818 --count 5

# Seed 10 users (tests L3 blob with fire emoji)
npx ts-node scripts/seed-demo-data.ts --lat 32.0853 --lng 34.7818 --count 10

# Seed at a different location (spread across a city)
npx ts-node scripts/seed-demo-data.ts --lat 32.0853 --lng 34.7818 --count 15 --spread 0.01

# Clean up — delete all seed data
npx ts-node scripts/seed-demo-data.ts --cleanup
```

Options:
| Flag | Default | Description |
|------|---------|-------------|
| `--lat` | 32.0853 | Center latitude |
| `--lng` | 34.7818 | Center longitude |
| `--count` | 5 | Number of fake signals to insert |
| `--spread` | 0.002 | How spread out the signals are (degrees) |
| `--cleanup` | — | Delete all rows with `is_seed = true` |

After running, open the app and navigate to that lat/lng on the map — you'll see heat blobs appear.

> **Note:** Seed signals use fake UUIDs as `user_id` and will appear on the map like real signals. They expire in 8 hours like real signals, or you can clean them up manually with `--cleanup`.

## Testing Realtime (Two Sessions)

To verify that signals appear on other users' maps in real time:

**Setup:**
- **Session A:** Your phone with Expo Go (your real account)
- **Session B:** Android Emulator Pixel_8 (create a second test account)

**Test steps:**
1. Log in on both devices with different accounts
2. On Session A (phone), tap the Fun toggle → it turns green
3. On Session B (emulator), watch the map at that location
4. A green heat blob should appear **within 2 seconds** on Session B

**Expected behavior:**
- Toggle ON on A → blob appears on B (≤2s)
- Toggle OFF on A → blob disappears from B (≤2s)
- Moving A to a new location and toggling ON → blob moves on B

## Intensity Level Testing

Use the seed script to verify each intensity level renders correctly:

| Test | Command | Expected Result |
|------|---------|-----------------|
| L1 (pale green, small) | `--count 1` | Small pale green circle |
| L1 (2 users) | `--count 2` | Same pale style, slightly larger |
| L2 (lime green, medium) | `--count 4` | Brighter lime green, medium circle |
| L3 (dark green + fire) | `--count 8` | Dark green, large circle, 🔥 emoji |

## Checking the Database

You can verify what's in the database at any time:

1. Go to Supabase Dashboard → **Table Editor** → `fun_signals`
2. You'll see all rows — active ones have `status = true` and a future `expires_at`
3. You can manually delete rows, change values, or insert test data from here too

## Common Issues

**Map shows no blobs after seeding:**
- Check the emulator's mock GPS is set to the same area as your seed data
- Verify the seed ran successfully by checking the Supabase Table Editor
- Make sure the map is zoomed out enough to include the seeded coordinates

**Realtime not working:**
- Confirm Realtime is enabled for `fun_signals` in Supabase (see [SUPABASE.md](SUPABASE.md))
- Check you're on a network that allows WebSocket connections (most do)
- Restart the Expo dev server and reload the app

**"Cannot read property of undefined" after seed:**
- The seed script uses fake user IDs not in `auth.users` — this is fine, RLS allows it via service role key
